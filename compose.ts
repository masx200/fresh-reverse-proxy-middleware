import { DenoMiddleWare, NextFunction } from "./DenoMiddleWare.ts";
import { ServeHandlerInfo } from "./server.ts";
/**
 * 将中间件函数组合起来，形成一个可以依次执行多个中间件的链式调用。
 * @param middlewares 一个包含多个Deno中间件函数的数组。
 * @returns 返回一个组合后的中间件函数，该函数可以接受请求、处理信息和下一个中间件函数，并按添加顺序依次执行中间件。
 */
export function compose(
    middlewares: DenoMiddleWare[],
    // next1: NextFunction,
): DenoMiddleWare {
    return async function (
        request: Request,
        info: ServeHandlerInfo,
        next1: NextFunction,
    ) {
        const middleware = middlewares.reduceRight(
            (next, middleware) => {
                return async (
                    ...[request, info]: Parameters<DenoMiddleWare>
                ) => {
                    return await middleware(
                        request,
                        info,
                        nextFunc,
                    );

                    async function nextFunc(
                        request: Request,
                        info: ServeHandlerInfo,
                    ) {
                        return await next(request, info, next1);
                    }
                };
            },
            next1,
        );
        return await middleware(request, info, next1);
    };
}
