/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import "https://deno.land/x/fresh@1.7.3/src/types.ts";
import config from "./fresh.config.ts";
import manifest from "./fresh.gen.ts";
import middleware from "./middleware.ts";
import { start } from "./server.ts";

if (import.meta.main) {
    await start(manifest, config, middleware);
}
