/**
 * 主要中间件处理函数
 *
 * @param request 请求对象，包含请求的方法和URL等信息
 * @param info 请求的额外信息，例如远程地址
 * @param next 中间件链中的下一个函数，用于继续处理请求或结束请求处理
 * @returns 返回一个响应对象
 */
export async function reverse_proxy(
    url: URL,
    requestHeaders: Headers,
    request: Request,
): Promise<Response> {
    try {
        const req_info = {
            method: request.method,
            url: url,
            headers: Object.fromEntries(requestHeaders),
        };
        console.log(
            JSON.stringify(
                {
                    // ...info,
                    request: req_info,
                },
                null,
                4,
            ),
        );
        const response = await fetch(url, {
            headers: requestHeaders,
            method: request.method,
            body: request.body,
            /* 关闭重定向 */
            /* 可以设定请求头中的字段"x-proxy-redirect"为"error" | "follow" |
"manual"来设定代理行为的重定向方式. */
            redirect: (requestHeaders.get("x-proxy-redirect") ??
                "manual") as RequestRedirect,
        });
        console.log(
            JSON.stringify(
                {
                    // ...info,
                    response: {
                        headers: Object.fromEntries(response.headers),
                        status: response.status,
                    },
                    request: req_info,
                },
                null,
                4,
            ),
        );
        return new Response(response.body, {
            headers: response.headers,
            status: response.status,
        });
    } catch (error) {
        console.error(error);
        return new Response("bad gateway" + "\n" + String(error), {
            status: 502,
        });
    }
}
