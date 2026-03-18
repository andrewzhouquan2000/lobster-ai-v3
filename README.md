# Lobster AI V2

基于 Next.js 16 的 AI Agent 平台，部署到阿里云 FC。

## 功能特性

- 🤖 AI Agent 对话
- 🔐 GitHub OAuth 登录
- 💾 Supabase 数据存储
- 🚀 阿里云 FC 部署（国内访问优化）

## 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **认证**: GitHub OAuth
- **部署**: 阿里云函数计算 FC 3.0

## 开发

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建
npm run build

# 本地预览生产构建
npm run start
```

## 阿里云 FC 部署

### 前置要求

1. 安装 [Serverless DevTools](https://www.serverless-devs.com/):
   ```bash
   npm install -g @serverless-devs/s
   ```

2. 配置阿里云凭证:
   ```bash
   s config add
   ```

3. 确保 `.env.local` 包含必要的环境变量:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://lsgkavwhokakhiqibnvh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

### 部署步骤

```bash
# 方式一：使用部署脚本
./deploy/fc-deploy.sh

# 方式二：直接使用 s 命令
npm run fc:deploy    # 部署
npm run fc:logs      # 查看日志
npm run fc:remove    # 删除部署
```

### 部署脚本说明

- `deploy/fc-deploy.sh`: 完整部署脚本
  - 检查依赖
  - 构建项目
  - 准备部署包
  - 部署到 FC

- `s.yaml`: Serverless 配置文件
  - 区域: cn-hangzhou
  - 运行时: custom.debian10
  - 内存: 512MB
  - 超时: 60s

- `fc-handler.js`: FC 入口函数
  - 适配 Next.js standalone 模式
  - 健康检查端点

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 项目 URL | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名密钥 | ✅ |
| GITHUB_CLIENT_ID | GitHub OAuth App ID | 生产环境 |
| GITHUB_CLIENT_SECRET | GitHub OAuth Secret | 生产环境 |

## 项目结构

```
lobster-ai-v2/
├── deploy/
│   └── fc-deploy.sh      # FC 部署脚本
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   └── lib/              # 工具函数
├── public/               # 静态资源
├── fc-handler.js         # FC 入口函数
├── s.yaml                # Serverless 配置
└── next.config.ts        # Next.js 配置
```

## 版本历史

- **V1**: Lobster AI 原型 (已封存)
- **V2**: 生产版本 - 阿里云 FC 部署

## License

MIT