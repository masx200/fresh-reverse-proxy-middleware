/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "./server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import "https://deno.land/x/fresh@1.6.5/src/types.ts";
await start(manifest, config);
