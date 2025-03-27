import { DenoMiddleWare } from "./DenoMiddleWare.ts";
import { reverse_proxy } from "./reverse_proxy.ts";

/**
 * 主要中间件处理函数
 *
 * @param request 请求对象，包含请求的方法和URL等信息
 * @param info 请求的额外信息，例如远程地址
 * @param next 中间件链中的下一个函数，用于继续处理请求或结束请求处理
 * @returns 返回一个响应对象
 */
export async function middlewareMain(
    ...[request, info, next]: Parameters<DenoMiddleWare>
): Promise<Response> {
    const nextUrl = new URL(request.url);
    console.log(
        JSON.stringify(
            {
                method: request.method,
                url: request.url,
                headers: Object.fromEntries(request.headers),
            },
            null,
            4,
        ),
    );

    const token = Deno.env.get("token");
    if (!token) {
        return next(request, info);
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.append(
        "Forwarded",
        `by=${nextUrl.host}; for=${info.remoteAddr.hostname}; host=${nextUrl.host}; proto=${
            nextUrl.href.startsWith("https://") ? "https" : "http"
        }`,
    );
    if (nextUrl.pathname.startsWith("/token/" + token + "/http/")) {
        let url = new URL(
            "http://" + nextUrl.pathname.slice(6 + ("/token/" + token).length),
        );
        url.search = nextUrl.search;
        /* 循环处理多重前缀 */
        while (url.pathname.startsWith("/token/" + token + "/http/")) {
            url = new URL(
                "http://" + url.pathname.slice(6 + ("/token/" + token).length),
            );
            url.search = nextUrl.search;
        }
        console.log(
            JSON.stringify(
                {
                    method: request.method,
                    url: request.url,
                    headers: Object.fromEntries(request.headers),
                },
                null,
                4,
            ),
        );
        // const requestHeaders = new Headers(request.headers);
        requestHeaders.set("host", url.hostname);

        // url.protocol = "https";
        // url.hostname = hostname;
        // url.port = String(443);
        //   url.pathname = url.pathname; //.replace(/^\//, '');
        return await reverse_proxy(url, requestHeaders, request);
    }
    if (nextUrl.pathname.startsWith("/token/" + token + "/https/")) {
        let url = new URL(
            "https://" +
                nextUrl.pathname.slice(6 + 1 + ("/token/" + token).length),
        );
        /* 添加search */
        url.search = nextUrl.search;
        /* 循环处理多重前缀 */
        while (url.pathname.startsWith("/token/" + token + "/https/")) {
            url = new URL(
                "https://" +
                    url.pathname.slice(6 + 1 + ("/token/" + token).length),
            );
            /* 添加search */
            url.search = nextUrl.search;
        }
        console.log(
            JSON.stringify(
                {
                    method: request.method,
                    url: request.url,
                    headers: Object.fromEntries(request.headers),
                },
                null,
                4,
            ),
        );
        requestHeaders.set("host", url.hostname);

        // url.protocol = "https";
        // url.hostname = hostname;
        // url.port = String(443);
        //   url.pathname = url.pathname; //.replace(/^\//, '');
        // return NextResponse.rewrite(url, {
        //   headers: requestHeaders,
        // });
        return await reverse_proxy(url, requestHeaders, request);
    }
    const resp = await next(request, info);
    // resp.headers.set("server", "fresh server");
    console.log(
        JSON.stringify(
            {
                response: {
                    headers: Object.fromEntries(resp.headers),
                    status: resp.status,
                },
                request: {
                    method: request.method,
                    url: request.url,
                    headers: Object.fromEntries(request.headers),
                },
            },
            null,
            4,
        ),
    );
    return resp;
}
