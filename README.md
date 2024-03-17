# fresh-reverse-proxy-middleware

# Fresh project

Your new Fresh project is ready to go. You can follow the Fresh "Getting
Started" guide here: https://fresh.deno.dev/docs/getting-started

### Usage

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project:

```
deno task start
```

This will watch the project directory and restart as necessary.

# 运行方式

设置环境变量 token 访问秘钥

```
npx cross-env token=token123456  deno task start
```

访问地址:

```
http://localhost:8000/token/token123456/https/www.360.cn
```

```
http://localhost:8000/token/token123456/http/example.com
```

可以设定请求头中的字段"x-proxy-redirect"为"error" | "follow" |
"manual"来设定代理行为的重定向方式.
