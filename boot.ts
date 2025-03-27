import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { DENO_DEPLOYMENT_ID } from "https://deno.land/x/fresh@1.7.3/src/server/build_id.ts";
import { colors } from "https://deno.land/x/fresh@1.7.3/src/server/deps.ts";
import { ServeHandler } from "https://deno.land/x/fresh@1.7.3/src/server/types.ts";
export type ServeOptions =
    & { port?: number; hostname?: string }
    & (
        | Deno.ServeUnixOptions
        | (
            | Deno.ServeTcpOptions
            | (Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem)
        )
        | (Deno.ServeUnixOptions & Deno.ServeInit<Deno.UnixAddr>)
        | (
            & (
                | Deno.ServeTcpOptions
                | (Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem)
            )
            & Deno.ServeInit<Deno.NetAddr>
        )
    );
export async function startServer(
    handler: Deno.ServeHandler,
    opts: Partial<ServeOptions> & { basePath: string },
) {
    if (!opts.onListen) {
        opts.onListen = (
            params: ({ port?: number } & Deno.UnixAddr) | Deno.NetAddr,
        ) => {
            const pathname = opts.basePath + "/";
            const address = colors.cyan(
                `http://localhost:${params.port}${pathname}`,
            );
            const localLabel = colors.bold("Local:");

            // Print more concise output for deploy logs
            if (DENO_DEPLOYMENT_ID) {
                console.log(
                    colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready ", 0), 121),
                    `${localLabel} ${address}`,
                );
            } else {
                console.log();
                console.log(
                    colors.bgRgb8(colors.rgb8(" 🍋 Fresh ready ", 0), 121),
                );
                console.log(`    ${localLabel} ${address}\n`);
            }
        };
    }

    const portEnv = Deno.env.get("PORT");
    if (portEnv !== undefined) {
        opts.port ??= parseInt(portEnv, 10);
    }

    if (opts.port) {
        await bootServer(handler, opts);
    } else {
        // No port specified, check for a free port. Instead of picking just
        // any port we'll check if the next one is free for UX reasons.
        // That way the user only needs to increment a number when running
        // multiple apps vs having to remember completely different ports.
        let firstError;
        for (let port = 8000; port < 8020; port++) {
            try {
                await bootServer(handler, { ...opts, port });
                firstError = undefined;
                break;
            } catch (err) {
                if (err instanceof Deno.errors.AddrInUse) {
                    // Throw first EADDRINUSE error
                    // if no port is free
                    if (!firstError) {
                        firstError = err;
                    }
                    continue;
                }

                throw err;
            }
        }

        if (firstError) {
            throw firstError;
        }
    }
}

async function bootServer(handler: ServeHandler, opts: Partial<ServeOptions>) {
    // @ts-ignore Ignore type error when type checking with Deno versions
    if (typeof Deno.serve === "function") {
        // @ts-ignore Ignore type error when type checking with Deno versions
        await Deno.serve(opts, (r, { remoteAddr }) =>
            // @ts-ignore Deprecated std serve way
            handler(r, {
                remoteAddr,
                localAddr: {
                    transport: "tcp",
                    hostname: opts.hostname ?? "localhost",
                    port: opts.port,
                } as Deno.NetAddr,
            })).finished;
    } else {
        // @ts-ignore Deprecated std serve way
        await serve(handler, opts);
    }
}
