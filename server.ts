import { ServerContext } from "https://deno.land/x/fresh@1.6.5/src/server/context.ts";
export type {
    FromManifestConfig,
    FromManifestOptions,
} from "https://deno.land/x/fresh@1.6.5/src/server/context.ts";
export { STATUS_CODE } from "https://deno.land/x/fresh@1.6.5/src/server/deps.ts";
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
} from "https://deno.land/x/fresh@1.6.5/src/server/types.ts";
import { startServer } from "https://deno.land/x/fresh@1.6.5/src/server/boot.ts";
import { DenoMiddleWare } from "./DenoMiddleWare.ts";
export {
    defineApp,
    defineConfig,
    defineLayout,
    defineRoute,
} from "https://deno.land/x/fresh@1.6.5/src/server/defines.ts";
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
} from "https://deno.land/x/fresh@1.6.5/src/server/types.ts";
export { RenderContext } from "https://deno.land/x/fresh@1.6.5/src/server/render.ts";
export type { InnerRenderFunction } from "https://deno.land/x/fresh@1.6.5/src/server/render.ts";
export type { DestinationKind } from "https://deno.land/x/fresh@1.6.5/src/server/router.ts";

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
    const handler: Deno.ServeHandler = middleware
        ? (req, info) => middleware(req, info, () => handler_old(req, info))
        : handler_old;
    await startServer(handler, {
        ...realConfig,
        basePath: config?.router?.basePath ?? "",
    });
}
