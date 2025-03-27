import { startServer } from "./boot.ts";
import { ServerContext } from "https://deno.land/x/fresh@1.7.3/src/server/context.ts";
import {
    ErrorHandler,
    FreshConfig,
    Handler,
    Handlers,
    IslandModule,
    LayoutConfig,
    MiddlewareModule,
    RouteConfig,
    ServeHandlerInfo,
    UnknownHandler,
} from "https://deno.land/x/fresh@1.7.3/src/server/types.ts";
import { DenoMiddleWare } from "./DenoMiddleWare.ts";
export type {
    FromManifestConfig,
    FromManifestOptions,
} from "https://deno.land/x/fresh@1.7.3/src/server/context.ts";
export {
    defineApp,
    defineConfig,
    defineLayout,
    defineRoute,
} from "https://deno.land/x/fresh@1.7.3/src/server/defines.ts";
export { STATUS_CODE } from "https://deno.land/x/fresh@1.7.3/src/server/deps.ts";
export { RenderContext } from "https://deno.land/x/fresh@1.7.3/src/server/render.ts";
export type { InnerRenderFunction } from "https://deno.land/x/fresh@1.7.3/src/server/render.ts";
export type { DestinationKind } from "https://deno.land/x/fresh@1.7.3/src/server/router.ts";
export type {
    AppContext,
    AppProps,
    DenoConfig,
    ErrorHandler,
    ErrorHandlerContext,
    ErrorPageProps,
    FreshConfig,
    FreshContext,
    FreshOptions,
    Handler,
    HandlerContext,
    Handlers,
    LayoutConfig,
    LayoutContext,
    LayoutProps,
    MiddlewareHandler,
    MiddlewareHandlerContext,
    MultiHandler,
    PageProps,
    Plugin,
    PluginAsyncRenderContext,
    PluginAsyncRenderFunction,
    PluginIslands,
    PluginMiddleware,
    PluginRenderContext,
    PluginRenderFunction,
    PluginRenderFunctionResult,
    PluginRenderResult,
    PluginRenderScripts,
    PluginRenderStyleTag,
    PluginRoute,
    RenderFunction,
    ResolvedFreshConfig,
    RouteConfig,
    RouteContext,
    RouterOptions,
    ServeHandlerInfo,
    StartOptions,
    UnknownHandler,
    UnknownHandlerContext,
    UnknownPageProps,
} from "https://deno.land/x/fresh@1.7.3/src/server/types.ts";

export interface Manifest {
    routes: Record<
        string,
        {
            // Use a more loose route definition type because
            // TS has trouble inferring normal vs aync functions. It cannot infer based on function arity
            default?: (
                // deno-lint-ignore no-explicit-any
                propsOrRequest: any,
                // deno-lint-ignore no-explicit-any
                ctx: any,
                // deno-lint-ignore no-explicit-any
            ) => Promise<any | Response> | any;
            handler?:
                // deno-lint-ignore no-explicit-any
                | Handler<any, any>
                // deno-lint-ignore no-explicit-any
                | Handlers<any, any>
                | UnknownHandler
                | ErrorHandler;
            config?: RouteConfig | LayoutConfig;
        } | MiddlewareModule
    >;
    islands: Record<string, IslandModule>;
    baseUrl: string;
}

export { ServerContext };

export async function createHandler(
    manifest: Manifest,
    config: FreshConfig = {},
): Promise<
    (req: Request, connInfo?: ServeHandlerInfo) => Promise<Response>
> {
    const ctx = await ServerContext.fromManifest(manifest, config);
    return ctx.handler();
}
/**
 * 启动服务器
 *
 * @param manifest 托管应用的清单文件，包含应用的配置和资源信息
 * @param config 服务器的配置信息，提供给 ServerContext 和 startServer 使用
 * @param middleware 一个可选的中间件函数，用于在请求处理流程中添加自定义逻辑
 * @returns Promise<void> 无返回值的Promise
 */
export async function start(
    manifest: Manifest,
    config: FreshConfig = {},
    middleware?: DenoMiddleWare,
): Promise<void> {
    const ctx = await ServerContext.fromManifest(manifest, {
        ...config,
        dev: false,
    });
    const realConfig = config.server ?? config;
    const handler_old = ctx.handler();
    //@ts-ignore
    const handler: Deno.ServeHandler = middleware
        //@ts-ignore
        ? (req, info) => middleware(req, info, () => handler_old(req, info))
        : handler_old;
    await startServer(handler, {
        ...realConfig,
        basePath: config?.router?.basePath ?? "",
    });
}
