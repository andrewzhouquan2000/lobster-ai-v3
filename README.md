# Lobster AI V3

纯前端展示层的 AI Agent 平台，通过 OpenClaw Gateway API 调用 AI Agent。

## V3 架构说明

### 设计理念

Lobster AI V3 是一个**纯前端展示层**应用：
- **不实现 Agent 逻辑** - 所有 AI 功能通过 OpenClaw Gateway API 调用
- **数据持久化** - 本地 SQLite 存储用户、项目、消息数据
- **状态展示** - 前端只负责 UI 展示和用户交互

### 核心功能

- ✅ 用户注册/登录（本地认证）
- ✅ 项目管理（创建、查看、更新）
- ✅ AI 对话（通过 OpenClaw Gateway）
- ✅ 消息持久化（SQLite）
- ✅ Agent 市场（展示层）

## 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: SQLite (better-sqlite3)
- **认证**: 本地认证（JWT + Cookie）
- **AI**: OpenClaw Gateway API

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
# 本地认证
JWT_SECRET=your-secret-key

# OpenClaw Gateway 配置
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your-gateway-token

# 前端可见的 Gateway URL
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 生产构建

```bash
npm run build
npm run start
```

## 数据库结构

数据库文件位于 `data/lobster.db`，首次运行自动创建。

### 表结构

```sql
-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 项目表
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  settings TEXT DEFAULT '{}',
  openclaw_session_id TEXT,  -- 关联的 OpenClaw Session
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 消息表
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 团队成员表
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  invited_by TEXT,
  joined_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## API 端点

### 认证 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |

### 项目 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/projects` | GET | 获取用户项目列表 |
| `/api/projects` | POST | 创建新项目 |
| `/api/projects` | PUT | 更新项目 |

### Chat API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/chat` | GET | 检查 Gateway 状态 |
| `/api/chat` | POST | 发送消息到 OpenClaw |

## OpenClaw Gateway 集成

### Gateway 状态检查

```bash
curl http://localhost:3000/api/chat
# {"status":"online","gateway":{"url":"...","available":true}}
```

### 发送消息

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "sessionId": "optional-session-id"}'
```

## 项目结构

```
lobster-ai-v3/
├── data/
│   └── lobster.db           # SQLite 数据库
├── src/
│   ├── app/
│   │   ├── auth/            # 认证页面
│   │   ├── api/
│   │   │   ├── auth/        # 认证 API
│   │   │   ├── chat/        # Chat API (OpenClaw)
│   │   │   ├── projects/    # 项目 API
│   │   │   └── content/     # 内容生成 API
│   │   ├── dashboard/       # 仪表盘
│   │   ├── chat/            # AI 对话页面
│   │   ├── agents/          # Agent 市场页面
│   │   └── ...
│   ├── components/
│   │   ├── ui/              # UI 组件
│   │   ├── UserMenu.tsx     # 用户菜单
│   │   └── BottomNav.tsx    # 底部导航
│   └── lib/
│       ├── auth/            # 认证模块
│       ├── db/              # 数据库模块
│       ├── openclaw-client.ts  # OpenClaw API 客户端
│       └── types/
└── ...
```

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `JWT_SECRET` | JWT 密钥 | 可选（有默认值） |
| `NEXT_PUBLIC_APP_URL` | 应用 URL | 可选 |
| `OPENCLAW_GATEWAY_URL` | OpenClaw Gateway 地址 | 可选 |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway 认证 Token | 可选 |
| `NEXT_PUBLIC_OPENCLAW_GATEWAY_URL` | 前端可见的 Gateway URL | 可选 |

## 版本历史

- **V1**: Lobster AI 原型 (已封存)
- **V2**: 生产版本基础 (已封存)
- **V3**: 正式生产版本 - 多用户支持 + 数据持久化
- **V3 本地化**: 完全本地化运行，无需云端服务
- **V3 重构**: 纯前端展示层，通过 OpenClaw Gateway 调用 AI

## License

MIT