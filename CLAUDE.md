# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Fresh 框架的反向代理中间件项目，提供 HTTP/HTTPS 代理服务。项目使用 Deno 运行时，并支持自定义 token 认证。

## 开发命令

### 启动开发服务器
```bash
npx cross-env -y token=your_token deno task start
```

### 直接运行主文件
```bash
npx cross-env -y token=your_token deno run -A main.ts
```

### 构建项目
```bash
deno task build
```

### 代码检查
```bash
deno task check
```

### 预览生产环境
```bash
deno task preview
```

### 更新 Fresh 依赖
```bash
deno task update
```

## 核心架构

### 中间件系统
项目采用自定义的中间件架构，核心组件包括：

- **middleware.ts**: 主要中间件入口，组合所有中间件函数
- **compose.ts**: 中间件组合器，用于创建中间件链
- **DenoMiddleWare.ts**: 定义中间件类型和接口
- **middlewareMain.ts**: 核心代理逻辑处理
- **reverse_proxy.ts**: 反向代理实现
- **middlewareLogger.ts**: 请求日志记录
- **Strict_Transport_Security.ts**: HSTS 安全头处理

### 代理工作原理
1. 通过 URL 路径格式 `/token/{token}/http/{target_url}` 或 `/token/{token}/https/{target_url}` 指定代理目标
2. 中间件解析 URL，提取 token 和目标地址
3. 验证 token 环境变量
4. 使用 fetch API 转发请求到目标服务器
5. 支持通过 `x-proxy-redirect` 请求头控制重定向行为（error/follow/manual）

### 服务器启动流程
1. **main.ts**: 生产环境入口点
2. **dev.ts**: 开发环境入口点，支持文件监听
3. **server.ts**: 服务器创建和启动逻辑
4. **boot.ts**: 底层服务器启动实现

### 配置文件
- **deno.json**: Deno 项目配置，包含任务脚本和编译选项
- **import_map.json**: 模块导入映射，使用 Fresh 1.7.3
- **fresh.config.ts**: Fresh 框架配置，启用 Tailwind CSS 插件

## 认证机制

项目使用简单的 token 认证：
1. 通过环境变量 `token` 设置访问密钥
2. 请求 URL 必须包含正确的 token：`/token/{token}/...`
3. 如果未设置 token 或 token 不匹配，请求将传递给 Fresh 路由处理

## 特殊功能

- 支持多重前缀的代理 URL（如 `/token/token123/token/token123/http/example.com`）
- 自动添加 `Forwarded` 头信息
- 详细的请求/响应日志记录
- WebSocket 连接直接透传，不经过代理处理

## 测试端点

项目包含一个示例 API 端点 `routes/api/joke.ts`，用于返回随机笑话，可用于测试服务器是否正常运行。