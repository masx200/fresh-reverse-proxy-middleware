# Fresh 反向代理中间件

[![Deno Version](https://img.shields.io/badge/deno-2.x-blue.svg)](https://deno.land/)
[![Fresh Version](https://img.shields.io/badge/fresh-1.7.3-green.svg)](https://fresh.deno.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个基于 Fresh 框架的高性能反向代理中间件，支持 HTTP/HTTPS 代理服务，使用 Deno 运行时构建。

## ✨ 特性

- 🚀 基于 Fresh 框架的高性能中间件架构
- 🔐 简单易用的 Token 认证机制
- 🌐 支持 HTTP/HTTPS 双协议代理
- 🔄 可配置的重定向行为控制
- 📝 详细的请求/响应日志记录
- 🎯 支持多重前缀的代理 URL
- 🛡️ 内置 HSTS 安全头处理
- 📱 移动端友好的响应式设计

## 📦 安装

确保已安装 Deno：

```bash
# 安装 Deno
curl -fsSL https://deno.land/install.sh | sh
# 或者使用包管理器：https://deno.land/manual/getting_started/installation
```

克隆项目：

```bash
git clone https://github.com/masx200/fresh-reverse-proxy-middleware.git
cd fresh-reverse-proxy-middleware
```

## 🚀 快速开始

### 开发环境启动

```bash
# 设置环境变量 token 并启动开发服务器
npx cross-env -y token=your_token deno task start
```

### 直接运行主文件

```bash
npx cross-env -y token=your_token deno run -A main.ts
```

### 生产环境构建

```bash
# 构建项目
deno task build

# 预览生产环境
deno task preview
```

## 🔧 使用方法

### 设置认证 Token

通过环境变量设置访问密钥：

```bash
# Unix/Linux/macOS
token=your_secret_key deno task start

# Windows (使用 cross-env)
npx cross-env -y token=your_secret_key deno task start

# 或者直接运行
npx cross-env -y token=your_secret_key deno run -A main.ts
```

### 代理 URL 格式

支持以下格式的代理 URL：

```
http://localhost:8000/token/{token}/http/{target_url}
http://localhost:8000/token/{token}/https/{target_url}
```

### 示例

```bash
# 代理 HTTPS 网站
http://localhost:8000/token/token123456/https/www.360.cn

# 代理 HTTP 网站
http://localhost:8000/token/token123456/http/example.com

# 支持多重前缀
http://localhost:8000/token/token123456/token/token123456/http/example.com
```

## 🎮 高级配置

### 重定向行为控制

通过设置请求头 `x-proxy-redirect` 来控制重定向行为：

- `"error"` - 遇到重定向时返回错误
- `"follow"` - 自动跟随重定向（默认）
- `"manual"` - 手动处理重定向

```bash
curl -H "x-proxy-redirect: error" http://localhost:8000/token/token123456/https/example.com
```

## 🏗️ 项目架构

### 核心组件

```
├── middleware.ts              # 中间件入口点
├── compose.ts                 # 中间件组合器
├── DenoMiddleWare.ts          # 中间件类型定义
├── middlewareMain.ts          # 核心代理逻辑
├── reverse_proxy.ts           # 反向代理实现
├── middlewareLogger.ts        # 请求日志记录
├── Strict_Transport_Security.ts # HSTS 安全头处理
├── server.ts                  # 服务器创建和启动
├── boot.ts                    # 底层服务器实现
├── main.ts                    # 生产环境入口
└── dev.ts                     # 开发环境入口
```

### 工作流程

1. **请求解析** - 从 URL 路径提取 token 和目标地址
2. **身份验证** - 验证 token 是否匹配环境变量
3. **请求转发** - 使用 fetch API 转发请求到目标服务器
4. **响应处理** - 处理重定向、添加转发头信息
5. **日志记录** - 记录详细的请求/响应信息

## 🔍 开发命令

```bash
# 启动开发服务器（带文件监听）
deno task start

# 代码检查
deno task check

# 代码格式化
deno task fmt

# 代码 lint
deno lint

# 更新 Fresh 依赖
deno task update

# 构建生产版本
deno task build

# 预览生产环境
deno task preview
```

## 🧪 测试

项目包含测试端点 `routes/api/joke.ts`，可用于测试服务器是否正常运行：

```bash
http://localhost:8000/api/joke
```

运行测试：

```bash
deno test
```

## 📝 日志示例

```log
GET /token/token123456/https/example.com
Forwarded request to: https://example.com
Response status: 200 OK
Response time: 123ms
```

## 🔒 安全特性

- **Token 认证** - 通过环境变量控制访问权限
- **HSTS 支持** - 自动添加 Strict-Transport-Security 头
- **Forwarded 头** - 自动添加转发信息
- **请求过滤** - 未认证请求传递给 Fresh 路由处理

## 🌐 WebSocket 支持

WebSocket 连接直接透传，不经过代理处理，确保实时通信性能。

## 📊 版本历史

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的版本更新记录。

主要里程碑：

- `v1.0.0` - 初始版本，基本代理功能
- `v1.1.0` - 添加重定向拦截功能
- `v1.2.0` - 完善日志记录和错误处理
- `v1.3.0` - 更新至 Fresh 1.7.3，Deno 2.x

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Fresh 官方文档](https://fresh.deno.dev/docs)
- [Deno 官方文档](https://deno.land/manual)
- [中间件架构设计](https://fresh.deno.dev/docs/concepts/middleware)

## 📞 支持

如果您遇到问题或有任何建议，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索现有的 [Issues](https://github.com/masx200/fresh-reverse-proxy-middleware/issues)
3. 创建新的 Issue 描述您的问题

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！