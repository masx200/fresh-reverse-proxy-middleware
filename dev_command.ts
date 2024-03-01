import { updateCheck } from "https://deno.land/x/fresh@1.6.5/src/dev/update_check.ts";
import {
    DAY,
    dirname,
    fromFileUrl,
    join,
    toFileUrl,
} from "https://deno.land/x/fresh@1.6.5/src/dev/deps.ts";
import {
    FreshConfig,
    Manifest as ServerManifest,
} from "https://deno.land/x/fresh@1.6.5/src/server/mod.ts";
import { build } from "https://deno.land/x/fresh@1.6.5/src/dev/build.ts";
import {
    collect,
    ensureMinDenoVersion,
    generate,
    Manifest,
} from "https://deno.land/x/fresh@1.6.5/src/dev/mod.ts";
import { startServer } from "https://deno.land/x/fresh@1.6.5/src/server/boot.ts";
import { getInternalFreshState } from "https://deno.land/x/fresh@1.6.5/src/server/config.ts";
import { getServerContext } from "https://deno.land/x/fresh@1.6.5/src/server/context.ts";
import { DenoMiddleWare } from "./DenoMiddleWare.ts";
export default dev;
export async function dev(
    base: string,
    entrypoint: string,
    config?: FreshConfig,
    middleware?: DenoMiddleWare,
): Promise<void> {
    ensureMinDenoVersion();

    // Run update check in background
    updateCheck(DAY).catch(() => {});

    const dir = dirname(fromFileUrl(base));

    let currentManifest: Manifest;
    const prevManifest = Deno.env.get("FRSH_DEV_PREVIOUS_MANIFEST");
    if (prevManifest) {
        currentManifest = JSON.parse(prevManifest);
    } else {
        currentManifest = { islands: [], routes: [] };
    }
    const newManifest = await collect(dir, config?.router?.ignoreFilePattern);
    Deno.env.set("FRSH_DEV_PREVIOUS_MANIFEST", JSON.stringify(newManifest));

    const manifestChanged =
        !arraysEqual(newManifest.routes, currentManifest.routes) ||
        !arraysEqual(newManifest.islands, currentManifest.islands);

    if (manifestChanged) await generate(dir, newManifest);

    const manifest = (await import(toFileUrl(join(dir, "fresh.gen.ts")).href))
        .default as ServerManifest;

    if (Deno.args.includes("build")) {
        const state = await getInternalFreshState(
            manifest,
            config ?? {},
        );
        state.config.dev = false;
        state.loadSnapshot = false;
        state.build = true;
        await build(state);
    } else if (config) {
        const state = await getInternalFreshState(
            manifest,
            config,
        );
        state.config.dev = true;
        state.loadSnapshot = false;
        const ctx = await getServerContext(state);
        const handler_old = ctx.handler();
        const handler: Deno.ServeHandler = middleware
            ? (req, info) => middleware(req, info, () => handler_old(req, info))
            : handler_old;
        await startServer(handler, {
            ...state.config.server,
            basePath: state.config.basePath,
        });
    } else {
        // Legacy entry point: Back then `dev.ts` would call `main.ts` but
        // this causes duplicate plugin instantiation if both `dev.ts` and
        // `main.ts` instantiate plugins.
        Deno.env.set("__FRSH_LEGACY_DEV", "true");
        entrypoint = new URL(entrypoint, base).href;
        await import(entrypoint);
    }
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}
