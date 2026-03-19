# Lobster AI V3

正式生产版本的 AI Agent 平台，支持多用户、数据持久化。

## V3 核心改动

### 1. 数据持久化（Supabase）
- ✅ 用户表 (users)
- ✅ 项目表 (projects)
- ✅ 聊天消息表 (messages)
- ✅ 团队成员表 (team_members)
- ✅ 行级安全策略 (RLS)
- ✅ 自动创建用户记录触发器

### 2. 用户系统
- ✅ 邮箱注册/登录
- ✅ 魔法链接登录
- ✅ Supabase Auth 集成
- 🔲 手机号登录（可选，待实现）

### 3. Token 管理优化
- ✅ 删除 OpenAI 选项（无 API 资源）
- ✅ 保留 GitHub、Aliyun OSS、Brave Search、Alpha Vantage

### 4. LLM 接入
- 🔲 当前使用模拟响应
- 🔲 后续接入 OpenClaw + 阿里云 Coding Plan

## 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth（邮箱 + 魔法链接）
- **部署**: 阿里云函数计算 FC 3.0 / Vercel

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

## 数据库设置

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 执行 `supabase/schema.sql` 中的 SQL 脚本
3. 确保启用了 Row Level Security

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 项目 URL | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名密钥 | ✅ |

## 项目结构

```
lobster-ai-v3/
├── src/
│   ├── app/
│   │   ├── auth/           # 认证相关页面
│   │   │   ├── page.tsx    # 登录/注册页面
│   │   │   ├── callback/   # OAuth 回调
│   │   │   └── logout/     # 登出 API
│   │   ├── dashboard/      # 仪表盘（服务端渲染）
│   │   ├── chat/           # AI 对话
│   │   ├── tokens/         # Token 管理
│   │   └── ...
│   ├── components/
│   │   ├── UserMenu.tsx    # 用户菜单组件
│   │   └── ...
│   └── lib/
│       ├── supabase/       # Supabase 客户端
│       │   ├── client.ts   # 浏览器端
│       │   ├── server.ts   # 服务端
│       │   └── middleware.ts
│       └── types/
│           └── database.ts # 数据库类型定义
├── supabase/
│   └── schema.sql          # 数据库表结构
└── ...
```

## 版本历史

- **V1**: Lobster AI 原型 (已封存)
- **V2**: 生产版本基础 (已封存)
- **V3**: 正式生产版本 - 多用户支持 + 数据持久化

## License

MIT