/**
 * 主要中间件处理函数
 *
 * @param request 请求对象，包含请求的方法和URL等信息
 * @param info 请求的额外信息，例如远程地址
 * @param next 中间件链中的下一个函数，用于继续处理请求或结束请求处理
 * @returns 返回一个响应对象
 */
/**
 * 需要拦截并重定向到本地的域名列表
 */
const REDIRECT拦截域名前缀 = [
  "https://release-assets.githubusercontent.com",
  "https://raw.githubusercontent.com",
];

/**
 * 判断给定的URL是否需要被拦截并重定向到本地
 * @param url 要检查的URL
 * @returns 如果需要拦截返回true，否则返回false
 */
export function shouldInterceptRedirect(url: string): boolean {
  return REDIRECT拦截域名前缀.some((prefix) => url.startsWith(prefix));
}

/**
 * 将外部URL转换为本地代理URL
 * @param externalUrl 外部URL
 * @param token 认证token
 * @param requestHeaders 请求头，可选，用于获取x-forwarded-proto和x-forwarded-host
 * @returns 本地代理URL
 */
export function convertToLocalUrl(
  externalUrl: string,
  token: string,
  requestHeaders?: Headers
): string {
  const url = new URL(externalUrl);

  // 尝试从请求头获取协议和主机信息
  const forwardedProtocol = requestHeaders?.get("x-forwarded-proto");
  const forwardedHost = requestHeaders?.get("x-forwarded-host");

  // 使用转发头信息或回退到从URL解析
  const protocol = url.protocol.slice(0, -1);
  const host = url.hostname + (url.port ? `:${url.port}` : "");
  const path = url.pathname + url.search;

  return `${forwardedProtocol}://${forwardedHost}` + `/token/${token}/${protocol}/${host}${path}`;
}

/**
 * 主要中间件处理函数
 *
 * @param request 请求对象，包含请求的方法和URL等信息
 * @param info 请求的额外信息，例如远程地址
 * @param next 中间件链中的下一个函数，用于继续处理请求或结束请求处理
 * @returns 返回一个响应对象
 */
export async function reverse_proxy(
  url: URL,
  requestHeaders: Headers,
  request: Request
): Promise<Response> {
  try {
    const req_info = {
      method: request.method,
      url: url,
      headers: Object.fromEntries(requestHeaders),
    };
    console.log(
      JSON.stringify(
        {
          // ...info,
          request: req_info,
        },
        null,
        4
      )
    );
    const response = await fetch(url, {
      headers: requestHeaders,
      method: request.method,
      body: request.body,
      /* 关闭重定向 */
      /* 可以设定请求头中的字段"x-proxy-redirect"为"error" | "follow" |
"manual"来设定代理行为的重定向方式. */
      redirect: (requestHeaders.get("x-proxy-redirect") ??
        "manual") as RequestRedirect,
    });

    // 检查是否是重定向响应
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location && shouldInterceptRedirect(location)) {
        const token = Deno.env.get("token");
        if (token) {
          const localUrl = convertToLocalUrl(location, token, requestHeaders);
          console.log(
            JSON.stringify(
              {
                message: "重定向拦截",
                originalLocation: location,
                newLocation: localUrl,
                status: response.status,
              },
              null,
              4
            )
          );

          // 创建新的响应，将location指向本地
          const newHeaders = new Headers(response.headers);
          newHeaders.set("location", localUrl);

          return new Response(response.body, {
            headers: newHeaders,
            status: response.status,
          });
        }
      }
    }

    console.log(
      JSON.stringify(
        {
          // ...info,
          response: {
            headers: Object.fromEntries(response.headers),
            status: response.status,
          },
          request: req_info,
        },
        null,
        4
      )
    );
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
