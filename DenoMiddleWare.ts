import { ServeHandlerInfo } from "https://deno.land/x/fresh@1.6.5/src/server/types.ts";

export type DenoMiddleWare = (
    request: Request,
    info: ServeHandlerInfo,
    next: () => Response | Promise<Response>,
) => Response | Promise<Response>;
