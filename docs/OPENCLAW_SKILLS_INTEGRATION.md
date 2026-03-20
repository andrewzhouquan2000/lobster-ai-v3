# OpenClaw Skills 集成说明

## 概述

Lobster AI V3 现已集成 OpenClaw 真实 Skills，可以调用 OpenClaw 底座的 50+ 技能。

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                   Lobster AI V3                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │ Skills 页面 │   │ Skills API   │   │ Agent 集成  │  │
│  └──────┬──────┘   └──────┬───────┘   └──────┬──────┘  │
│         │                 │                   │         │
│         └─────────────────┼───────────────────┘         │
│                           │                             │
│  ┌────────────────────────▼────────────────────────┐   │
│  │         openclaw-skills.ts (Skills 读取模块)    │   │
│  └────────────────────────┬────────────────────────┘   │
└───────────────────────────┼─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                   OpenClaw 底座                          │
│  ┌──────────────────┐   ┌──────────────────────────┐   │
│  │ 系统 Skills (52) │   │ 用户 Skills (2)          │   │
│  │ - weather        │   │ - clawsec-suite          │   │
│  │ - github         │   │ - openclaw-audit-watchdog│   │
│  │ - notion         │   └──────────────────────────┘   │
│  │ - xurl           │                                  │
│  │ - discord        │   ┌──────────────────────────┐   │
│  │ - slack          │   │ OpenClaw Gateway         │   │
│  │ - openai-*       │   │ (HTTP API + WebSocket)   │   │
│  │ - ...            │   └──────────────────────────┘   │
│  └──────────────────┘                                  │
└─────────────────────────────────────────────────────────┘
```

## API 端点

### 1. 获取所有 Skills
```
GET /api/openclaw-skills
```

返回所有可用的 OpenClaw skills。

**响应示例:**
```json
{
  "skills": [
    {
      "name": "weather",
      "description": "获取天气信息...",
      "emoji": "☔",
      "category": "tools",
      "source": "system"
    }
  ],
  "stats": {
    "total": 54,
    "system": 52,
    "user": 2
  },
  "categories": [...]
}
```

### 2. 搜索 Skills
```
GET /api/openclaw-skills?q=天气
```

### 3. 按分类获取
```
GET /api/openclaw-skills?category=ai
```

### 4. 获取 Skill 详情
```
GET /api/openclaw-skills?action=detail&name=weather
```

### 5. 调用 Skill
```
POST /api/skills/[name]/invoke
Content-Type: application/json

{
  "prompt": "上海今天天气怎么样？"
}
```

**响应示例:**
```json
{
  "success": true,
  "skill": "weather",
  "result": "上海今天天气如下：⛅ 局部多云\n温度：15°C..."
}
```

### 6. 同步 Skills 到数据库
```
POST /api/skills/sync
```

## 前端使用

### Skills 页面
访问 `/skills` 页面可以查看所有可用的 OpenClaw skills，支持：
- 搜索
- 按分类筛选
- 查看详情
- 调用 skill

### Agent 集成

在 Agent 执行任务时，可以自动检测并调用相关 skills：

```typescript
import { 
  detectRequiredSkills, 
  invokeSkill,
  prepareSkillsContext 
} from '@/lib/agents/skill-executor';

// 检测用户消息需要的 skills
const matches = detectRequiredSkills("上海今天天气怎么样？");
// => [{ skill: weather, confidence: 0.8, keywords: ['天气'] }]

// 调用 skill
const result = await invokeSkill('weather', '上海今天天气怎么样？');

// 为 Agent 准备 skills 上下文
const context = prepareSkillsContext();
```

## 可用的 Skills 分类

| 分类 | 说明 | 示例 Skills |
|------|------|-------------|
| code | 代码仓库 | github, gh-issues |
| deploy | 部署平台 | - |
| storage | 云存储 | - |
| ai | AI 模型 | openai-image-gen, gemini |
| social | 社交媒体 | xurl (Twitter/X) |
| communication | 通讯工具 | discord, slack, imsg, wacli |
| tools | 工具服务 | weather, notion, 1password |
| media | 媒体处理 | openai-whisper, video-frames |
| productivity | 生产力 | apple-notes, bear-notes, obsidian |
| admin | 系统管理 | healthcheck, node-connect |

## 环境配置

在 `.env.local` 中配置 OpenClaw Gateway：

```env
NEXT_PUBLIC_OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN=your-token-here
```

## 开发

### 启动开发服务器
```bash
npm run dev
```

### 测试 API
```bash
# 获取所有 skills
curl http://localhost:3000/api/openclaw-skills

# 调用天气 skill
curl -X POST http://localhost:3000/api/skills/weather/invoke \
  -H "Content-Type: application/json" \
  -d '{"prompt": "北京天气"}'
```

## 文件结构

```
src/
├── lib/
│   ├── openclaw-skills.ts      # Skills 读取模块
│   ├── sync-openclaw-skills.ts # 同步到数据库
│   └── agents/
│       └── skill-executor.ts   # Agent 集成
├── app/
│   ├── skills/
│   │   └── page.tsx           # Skills 页面
│   └── api/
│       ├── openclaw-skills/
│       │   └── route.ts       # Skills API
│       └── skills/
│           ├── [name]/
│           │   └── invoke/
│           │       └── route.ts  # 调用 API
│           └── sync/
│               └── route.ts   # 同步 API
└── data/
    └── skills.ts              # 原有 skills 定义
```

## 更新日志

### 2024-03-20
- ✅ 创建 Skills 读取模块 (`openclaw-skills.ts`)
- ✅ 更新 Skills 页面展示真实数据
- ✅ 创建 Skill 调用 API (`/api/skills/[name]/invoke`)
- ✅ Agent 集成模块 (`skill-executor.ts`)
- ✅ 测试通过：weather skill 调用成功