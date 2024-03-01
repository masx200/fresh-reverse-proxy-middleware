import { FreshContext } from "$fresh/server.ts";
export async function handler(
    request: Request,
    ctx: FreshContext,
): Promise<Response> {
    // ctx.state.data = "myData";
    const nextUrl = new URL(request.url);
    console.log({ method: request.method, url: request.url });

    console.log({ headers: Object.fromEntries(request.headers) });
    const token = Deno.env.get("token");
    const requestHeaders = new Headers(request.headers);
    requestHeaders.append(
        "Forwarded",
        `by=${nextUrl.host}; for=${ctx.remoteAddr.hostname}; host=${nextUrl.host}; proto=${
            nextUrl.href.startsWith("https://") ? "https" : "http"
        }`,
    );
    if (nextUrl.pathname.startsWith("/token/" + token + "/http/")) {
        // const hostname = "dash.deno.com"; // or 'eu.posthog.com'
        let url = new URL(
            "http://" +
                nextUrl.pathname.slice(6 + ("/token/" + token).length),
        );
        url.search = nextUrl.search;
        /* 循环处理多重前缀 */
        while (url.pathname.startsWith("/token/" + token + "/http/")) {
            url = new URL(
                "http://" +
                    url.pathname.slice(6 + ("/token/" + token).length),
            );
            url.search = nextUrl.search;
        }
        console.log({ url: url.href, method: request.method });
        // const requestHeaders = new Headers(request.headers);
        requestHeaders.set("host", url.hostname);

        // url.protocol = "https";
        // url.hostname = hostname;
        // url.port = String(443);
        //   url.pathname = url.pathname; //.replace(/^\//, '');
        return await reverse_proxy(url, requestHeaders, request);
    }
    if (nextUrl.pathname.startsWith("/token/" + token + "/https/")) {
        let url = new URL(
            "https://" +
                nextUrl.pathname.slice(
                    6 + 1 + ("/token/" + token).length,
                ),
        );
        /* 添加search */
        url.search = nextUrl.search;
        /* 循环处理多重前缀 */
        while (url.pathname.startsWith("/token/" + token + "/https/")) {
            url = new URL(
                "https://" +
                    url.pathname.slice(
                        6 + 1 + ("/token/" + token).length,
                    ),
            );
            /* 添加search */
            url.search = nextUrl.search;
        }
        console.log({ url: url.href, method: request.method });

        requestHeaders.set("host", url.hostname);

        // url.protocol = "https";
        // url.hostname = hostname;
        // url.port = String(443);
        //   url.pathname = url.pathname; //.replace(/^\//, '');

        // return NextResponse.rewrite(url, {
        //   headers: requestHeaders,
        // });
        return await reverse_proxy(url, requestHeaders, request);
    }
    const resp = await ctx.next();
    // resp.headers.set("server", "fresh server");
    console.log(
        JSON.stringify(
            {
                response: {
                    headers: Object.fromEntries(resp.headers),
                    status: resp.status,
                },
                request: {
                    method: request.method,
                    url: request.url,
                    headers: Object.fromEntries(request.headers),
                },
            },
            null,
            4,
        ),
    );
    return resp;
}
async function reverse_proxy(
    url: URL,
    requestHeaders: Headers,
    request: Request,
): Promise<Response> {
    try {
        const response = await fetch(url, {
            headers: requestHeaders,
            method: request.method,
            body: request.body,
            /* 关闭重定向 */
            redirect: "manual",
        });

        return new Response(response.body, {
            headers: response.headers,
            status: response.status,
        });
    } catch (error) {
        console.error(error);
        return new Response("bad gateway" + "\n" + String(error), {
            status: 502,
        });
    }
}
