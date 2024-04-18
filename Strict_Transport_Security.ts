import { DenoMiddleWare } from "./DenoMiddleWare.ts";

export async function Strict_Transport_Security(
    ...[request, info, next]: Parameters<DenoMiddleWare>
): Promise<Response> {
    // console.log(2);
    const response = await next(request, info);
    const headers = new Headers(response.headers);

    headers.append("Strict-Transport-Security", "max-age=31536000");
    // console.log(ctx.response.body);
    // 必须把响应的主体转换为Uint8Array才行
    /* /* 不能全部读取,防止内存溢出,遇到大型文件,需要流式处理  */
    const body = response.body; //&& (await bodyToBuffer(response.body));

    // headers.delete("content-length");
    const res = new Response(body, {
        status: response.status,
        headers,
    });
    return res;
}
