#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "./dev_command.ts";
import config from "./fresh.config.ts";
import "https://deno.land/x/fresh@1.6.5/src/types.ts";
import "$std/dotenv/load.ts";
import middleware from "./middleware.ts";

if (import.meta.main) {
    await dev(import.meta.url, "./main.ts", config, middleware);
}
