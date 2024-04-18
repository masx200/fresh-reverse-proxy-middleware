import { DenoMiddleWare } from "./DenoMiddleWare.ts";

// import {
//     bodyToBuffer,
// } from "https://cdn.jsdelivr.net/gh/masx200/deno-http-middleware@3.3.0/mod.ts";
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
    const resp = await next(request, info);
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
