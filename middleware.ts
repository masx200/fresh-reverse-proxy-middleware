/**
 * 定义一个适用于Deno服务器中间件的类型。
 *
 * @param request 表示客户端发起的请求对象。
 * @param info 包含关于请求的额外信息，比如请求的路径、查询参数等。
 * @param next 一个函数，调用它会继续处理请求的链式操作，返回一个响应对象或一个响应对象的Promise。
 * @returns 返回一个响应对象或一个响应对象的Promise。这个响应对象会发送回客户端。
 */
export async function middlewareLogger(
    ...[request, info, next]: Parameters<DenoMiddleWare>
): Promise<Response> {
    console.log(
        JSON.stringify(
            {
                ...info,
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
    const resp = await next();
    console.log(
        JSON.stringify(
            {
                ...info,
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
    console.log({ method: request.method, url: request.url });

    console.log({ headers: Object.fromEntries(request.headers) });
    const token = Deno.env.get("token");
    const requestHeaders = new Headers(request.headers);
    requestHeaders.append(
        "Forwarded",
        `by=${nextUrl.host}; for=${info.remoteAddr.hostname}; host=${nextUrl.host}; proto=${
            nextUrl.href.startsWith("https://") ? "https" : "http"
        }`,
    );
    if (nextUrl.pathname.startsWith("/token/" + token + "/http/")) {
        // const hostname = "dash.deno.com"; // or 'eu.posthog.com'
        let url = new URL(
            "http://" +
                nextUrl.pathname.slice(6 + ("/token/" + token).length),
        );
        url.search = nextUrl.search;
        /* 循环处理多重前缀 */
        while (url.pathname.startsWith("/token/" + token + "/http/")) {
            url = new URL(
                "http://" +
                    url.pathname.slice(6 + ("/token/" + token).length),
            );
            url.search = nextUrl.search;
        }
        console.log({ url: url.href, method: request.method });
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
                nextUrl.pathname.slice(
                    6 + 1 + ("/token/" + token).length,
                ),
        );
        /* 添加search */
        url.search = nextUrl.search;
        /* 循环处理多重前缀 */
        while (url.pathname.startsWith("/token/" + token + "/https/")) {
            url = new URL(
                "https://" +
                    url.pathname.slice(
                        6 + 1 + ("/token/" + token).length,
                    ),
            );
            /* 添加search */
            url.search = nextUrl.search;
        }
        console.log({ url: url.href, method: request.method });

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
    const resp = await next();
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
import { DenoMiddleWare } from "./DenoMiddleWare.ts";
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
            redirect: "manual",
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
/**
 * 作为Deno中间件的默认异步函数。
 * 接收一个或多个参数，包括请求对象、信息对象和下一个中间件函数，并返回一个响应对象。
 *
 * @param request 请求对象，代表HTTP请求的相关信息。
 * @param info 信息对象，通常包含关于中间件执行环境的额外信息。
 * @param next 下一个中间件函数，用于将请求链式传递下去。
 * @returns 返回一个Promise，该Promise解析为一个响应对象。
 */
export default async function (
    ...[request, info, next]: Parameters<DenoMiddleWare>
): Promise<Response> {
    try {
        return await middlewareLogger(request, info, async () => {
            return await middlewareMain(request, info, next);
        });
    } catch (error) {
        console.error(error);
        return new Response(
            "internal server error" + "\n" + String(error),
            {
                status: 500,
            },
        );
    }
}
