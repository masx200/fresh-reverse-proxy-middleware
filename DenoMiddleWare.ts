import { ServeHandlerInfo } from "./types.ts";
export type NextFunction = (
    request: Request,
    info: ServeHandlerInfo & {
        remoteAddr: Deno.NetAddr;
    },
) => Response | Promise<Response>;

/**
 * 定义一个适用于Deno服务器中间件的类型。
 *
 * @param request 表示客户端发起的请求对象。
 * @param info 包含关于请求的额外信息，比如请求的路径、查询参数等。
 * @param next 一个函数，调用它会继续处理请求的链式操作，返回一个响应对象或一个响应对象的Promise。
 * @returns 返回一个响应对象或一个响应对象的Promise。这个响应对象会发送回客户端。
 */
export type DenoMiddleWare = (
    request: Request,
    info: ServeHandlerInfo & {
        remoteAddr: Deno.NetAddr;
    },
    next: NextFunction,
) => Response | Promise<Response>;
