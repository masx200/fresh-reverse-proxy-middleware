import { assertEquals } from "$std/testing/asserts.ts";
import {
    convertToLocalUrl,
    reverse_proxy,
    shouldInterceptRedirect,
} from "./reverse_proxy.ts";

Deno.test("shouldInterceptRedirect - 应该拦截指定的GitHub域名", () => {
    // 测试应该被拦截的域名
    assertEquals(
        shouldInterceptRedirect(
            "https://release-assets.githubusercontent.com/user/repo/v1.0.0/file.zip",
        ),
        true,
        "应该拦截 release-assets.githubusercontent.com",
    );

    assertEquals(
        shouldInterceptRedirect(
            "https://raw.githubusercontent.com/user/repo/main/file.json",
        ),
        true,
        "应该拦截 raw.githubusercontent.com",
    );

    assertEquals(
        shouldInterceptRedirect(
            "https://raw.githubusercontent.com/liandu2024/little/refs/heads/main/zashboard/zashboard-20250417.json",
        ),
        true,
        "应该拦截测试用例中的网址",
    );
});

Deno.test("shouldInterceptRedirect - 不应该拦截其他域名", () => {
    // 测试不应该被拦截的域名
    assertEquals(
        shouldInterceptRedirect("https://api.github.com/user/repo"),
        false,
        "不应该拦截 api.github.com",
    );

    assertEquals(
        shouldInterceptRedirect("https://github.com/user/repo/releases"),
        false,
        "不应该拦截 github.com",
    );

    assertEquals(
        shouldInterceptRedirect("https://example.com/file.zip"),
        false,
        "不应该拦截 example.com",
    );

    assertEquals(
        shouldInterceptRedirect("http://raw.githubusercontent.com/file.json"),
        false,
        "不应该拦截 http 协议",
    );
});

Deno.test("convertToLocalUrl - 正确转换外部URL为本地代理URL", () => {
    const token = "test-token";

    // 测试 https URL 转换
    assertEquals(
        convertToLocalUrl(
            "https://raw.githubusercontent.com/user/repo/main/file.json",
            token,
        ),
        "/token/test-token/https/raw.githubusercontent.com/user/repo/main/file.json",
        "应该正确转换 https URL",
    );

    // 测试带端口的 URL
    assertEquals(
        convertToLocalUrl(
            "https://release-assets.githubusercontent.com:443/user/repo/v1.0.0/file.zip",
            token,
        ),
        "/token/test-token/https/release-assets.githubusercontent.com:443/user/repo/v1.0.0/file.zip",
        "应该正确处理带端口的 URL",
    );

    // 测试带查询参数的 URL
    assertEquals(
        convertToLocalUrl(
            "https://raw.githubusercontent.com/user/repo/main/file.json?download=true",
            token,
        ),
        "/token/test-token/https/raw.githubusercontent.com/user/repo/main/file.json?download=true",
        "应该正确处理查询参数",
    );
});

Deno.test("reverse_proxy - 模拟重定向拦截功能", async () => {
    // 设置测试环境变量
    const originalToken = Deno.env.get("token");
    Deno.env.set("token", "test-token");

    try {
        // 创建模拟的重定向响应
        const mockResponse = new Response(null, {
            status: 302,
            headers: {
                "location":
                    "https://raw.githubusercontent.com/liandu2024/little/refs/heads/main/zashboard/zashboard-20250417.json",
            },
        });

        // 模拟 fetch 函数返回重定向响应
        const originalFetch = globalThis.fetch;
        globalThis.fetch = () => Promise.resolve(mockResponse);

        // 创建模拟请求
        const requestUrl = "http://localhost:8000/test";
        const request = new Request(requestUrl, {
            method: "GET",
            headers: new Headers(),
        });

        const requestHeaders = new Headers();
        const url = new URL("https://example.com/redirect");

        // 调用 reverse_proxy 函数
        const response = await reverse_proxy(url, requestHeaders, request);

        // 验证响应
        assertEquals(response.status, 302);
        assertEquals(
            response.headers.get("location"),
            "/token/test-token/https/raw.githubusercontent.com/liandu2024/little/refs/heads/main/zashboard/zashboard-20250417.json",
            "重定向 location 应该被转换为本地代理 URL",
        );

        // 恢复原始 fetch 函数
        globalThis.fetch = originalFetch;
    } finally {
        // 恢复原始环境变量
        if (originalToken) {
            Deno.env.set("token", originalToken);
        } else {
            Deno.env.delete("token");
        }
    }
});

Deno.test("reverse_proxy - 不拦截非目标域名的重定向", async () => {
    // 设置测试环境变量
    const originalToken = Deno.env.get("token");
    Deno.env.set("token", "test-token");

    try {
        // 创建模拟的重定向响应（非目标域名）
        const mockResponse = new Response(null, {
            status: 302,
            headers: {
                "location": "https://api.github.com/user/repos",
            },
        });

        // 模拟 fetch 函数返回重定向响应
        const originalFetch = globalThis.fetch;
        globalThis.fetch = () => Promise.resolve(mockResponse);

        // 创建模拟请求
        const requestUrl = "http://localhost:8000/test";
        const request = new Request(requestUrl, {
            method: "GET",
            headers: new Headers(),
        });

        const requestHeaders = new Headers();
        const url = new URL("https://example.com/redirect");

        // 调用 reverse_proxy 函数
        const response = await reverse_proxy(url, requestHeaders, request);

        // 验证响应
        assertEquals(response.status, 302);
        assertEquals(
            response.headers.get("location"),
            "https://api.github.com/user/repos",
            "非目标域名的重定向 location 应该保持不变",
        );

        // 恢复原始 fetch 函数
        globalThis.fetch = originalFetch;
    } finally {
        // 恢复原始环境变量
        if (originalToken) {
            Deno.env.set("token", originalToken);
        } else {
            Deno.env.delete("token");
        }
    }
});

Deno.test("测试用例URL验证", () => {
    const _token = "test-token";

    // 测试用户提供的三个URL
    const testUrls = [
        "https://raw.githubusercontent.com/liandu2024/little/refs/heads/main/zashboard/zashboard-20250417.json",
        "https://github.com/EasyTier/EasyTier/releases/download/v2.4.5/easytier-gui_2.4.5_arm64-setup.exe",
        "https://github.com/EasyTier/EasyTier/raw/refs/heads/main/CONTRIBUTING.md",
    ];

    // 第一个URL应该被拦截（raw.githubusercontent.com）
    assertEquals(
        shouldInterceptRedirect(testUrls[0]),
        true,
        "第一个URL应该被拦截",
    );

    // 第二个URL不应该被拦截（github.com域名，但不是raw或release-assets）
    assertEquals(
        shouldInterceptRedirect(testUrls[1]),
        false,
        "第二个URL不应该被拦截",
    );

    // 第三个URL不应该被拦截（github.com域名，但不是raw或release-assets）
    assertEquals(
        shouldInterceptRedirect(testUrls[2]),
        false,
        "第三个URL不应该被拦截",
    );
});
