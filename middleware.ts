import { DenoMiddleWare, NextFunction } from "./DenoMiddleWare.ts";
import { Strict_Transport_Security } from "./Strict_Transport_Security.ts";
import { compose } from "./compose.ts";
import { middlewareLogger } from "./middlewareLogger.ts";
import { middlewareMain } from "./middlewareMain.ts";
import { ServeHandlerInfo } from "./server.ts";
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
    ...[request, info, next1]: Parameters<DenoMiddleWare>
): Promise<Response> {
    const middlewares: DenoMiddleWare[] = [
        async function (
            request: Request,
            info: ServeHandlerInfo,
            next2: NextFunction,
        ) {
            if (request.headers.get("upgrade") == "websocket") {
                return await next1(request, info);
            }
            return next2(request, info);
        },

        middlewareLogger,
        Strict_Transport_Security,
        middlewareMain,
    ];

    const chain: DenoMiddleWare = compose(middlewares /* next1 */);
    try {
        // return await middlewareLogger(request, info, async () => {
        //     return await Strict_Transport_Security(request, info, async () => {
        //         return await middlewareMain(request, info, next);
        //     });
        // });
        return await chain(
            request,
            info,
            next1,
        );
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
