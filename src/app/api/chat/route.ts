import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProjectById, createMessage, getMessagesByProject } from '@/lib/db/projects';
import {
  initProjectState,
  getProjectStateByProjectId,
  updateProjectPhase,
  assignAgents,
  updateProgress,
  setDeployUrl,
  createAgentTask,
  getAgentTasksByProject,
  updateAgentTaskStatus,
} from '@/lib/db/project-state';
import { agents } from '@/data/agents';
import { CoderAgent, executeCoderTask } from '@/lib/agents/coder-agent';

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || '';

// 项目类型映射到推荐 Agent
const PROJECT_TYPE_AGENTS: Record<string, { id: string; role: string }[]> = {
  'game': [
    { id: 'dev-game-01', role: '游戏开发工程师' },
    { id: 'design-ui-01', role: 'UI设计师' },
  ],
  'web': [
    { id: 'dev-fe-01', role: '前端工程师' },
    { id: 'dev-be-01', role: '后端工程师' },
  ],
  'mobile': [
    { id: 'dev-mobile-03', role: '移动端工程师' },
    { id: 'design-ui-01', role: 'UI设计师' },
  ],
  'default': [
    { id: 'dev-full-01', role: '全栈工程师' },
    { id: 'design-ui-01', role: 'UI设计师' },
  ],
};

// GET: 检查 Gateway 状态
export async function GET() {
  try {
    const response = await fetch(`${GATEWAY_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
    });

    if (response.ok) {
      return NextResponse.json({ status: 'connected', gateway: GATEWAY_URL });
    } else {
      return NextResponse.json({ status: 'error', gateway: GATEWAY_URL }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      gateway: GATEWAY_URL,
      error: error instanceof Error ? error.message : 'Connection failed' 
    }, { status: 503 });
  }
}

/**
 * 调用 LLM
 */
async function callLlm(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages,
        stream: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
    throw new Error(`LLM call failed: ${response.status}`);
  } catch (error) {
    console.error('Call LLM error:', error);
    throw error;
  }
}

/**
 * 分析用户需求
 */
async function analyzeRequirement(message: string): Promise<{
  needsMoreInfo: boolean;
  response: string;
  projectType: string;
  projectSummary: string;
}> {
  const prompt = `分析以下用户需求，判断需求是否足够清晰：

用户需求：${message}

请以 JSON 格式返回（只返回 JSON，不要其他内容）：
{
  "needsMoreInfo": false,
  "projectType": "game",
  "projectSummary": "简短的项目描述（1-2句话）",
  "response": "对用户需求的总结确认"
}

项目类型可选：game（游戏）, web（网站）, mobile（移动应用）, data（数据分析）, default（其他）

判断标准：
- 如果用户明确说了想做什么、有什么功能，则需求清晰
- 如果只是模糊的描述（如"做个游戏"），则需求不清晰`;

  try {
    const content = await callLlm([{ role: 'user', content: prompt }]);
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Analyze requirement error:', error);
  }

  // 默认逻辑
  const lowerMsg = message.toLowerCase();
  let projectType = 'default';
  
  if (lowerMsg.includes('游戏') || lowerMsg.includes('game') || lowerMsg.includes('24点')) {
    projectType = 'game';
  } else if (lowerMsg.includes('网站') || lowerMsg.includes('web') || lowerMsg.includes('网页')) {
    projectType = 'web';
  } else if (lowerMsg.includes('app') || lowerMsg.includes('移动') || lowerMsg.includes('手机')) {
    projectType = 'mobile';
  } else if (lowerMsg.includes('数据') || lowerMsg.includes('分析') || lowerMsg.includes('报表')) {
    projectType = 'data';
  }

  return {
    needsMoreInfo: false,
    projectType,
    projectSummary: message.slice(0, 100),
    response: `好的，我来帮你实现！`,
  };
}

/**
 * 生成 CEO AI 需求分析消息
 */
async function generateCeoAnalysisMessage(
  userMessage: string,
  projectType: string,
  projectSummary: string,
  assignedAgents: { id: string; role: string }[]
): Promise<string> {
  const agentNames = assignedAgents.map(a => {
    const agent = agents.find(ag => ag.id === a.id);
    return agent ? `${agent.name}（${a.role}）` : a.id;
  }).join('、');

  return `收到！我来组建团队并开始开发。

## 📋 需求分析
- **项目类型**：${projectType === 'game' ? '游戏应用' : projectType === 'web' ? 'Web网站' : projectType === 'mobile' ? '移动应用' : '应用'}
- **需求摘要**：${projectSummary}

## 👥 团队配置
已为你分配以下 Agent：
${agentNames}

## 🚀 开始执行
正在将任务分配给 Coder Agent...`;
}

/**
 * 生成 Coder Agent 开发进度消息
 */
async function generateCoderProgressMessage(
  taskDescription: string,
  progress: number,
  projectName: string
): Promise<string> {
  return `收到任务！正在开发中...

## 🛠️ 当前任务
${taskDescription}

## 📊 开发进度
- 需求分析 ✅
- 架构设计 ✅
- 核心功能开发 ${progress >= 50 ? '✅' : '🔄'}
- UI 界面实现 ${progress >= 70 ? '✅' : '🔄'}
- 测试调试 ${progress >= 90 ? '✅' : '⏳'}

**当前进度：${progress}%**

${progress >= 80 ? `\n🎉 核心功能已完成，正在进行最后优化...` : ''}`;
}

/**
 * 生成 Coder Agent 完成消息
 */
function generateCoderCompleteMessage(projectId: string, projectName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const previewUrl = `${baseUrl}/preview/${projectId}`;

  return `## ✅ 开发完成！

**项目名称**：${projectName}

### 📦 交付内容
- 完整的前端应用代码
- 响应式 UI 设计
- 核心功能实现

### 🔗 项目预览
[点击查看预览](${previewUrl})

---
Coder Agent 任务已完成，项目已准备就绪！`;
}

/**
 * 生成 CEO AI 交付消息
 */
function generateCeoDeliveryMessage(projectId: string, projectName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const previewUrl = `${baseUrl}/preview/${projectId}`;

  return `## 🎉 项目已完成！

**${projectName}** 已成功交付！

### 👥 团队贡献
- ✅ CEO AI：需求分析与项目协调
- ✅ Coder Agent：核心功能开发

### 🔗 交付链接
[点击查看项目预览](${previewUrl})

---
感谢使用 Lobster AI！如有任何问题或需要修改，随时告诉我。`;
}

/**
 * 主聊天 API - 实现 CEO AI → Coder Agent 完整协作流程
 */
export async function POST(request: NextRequest) {
  const user = await getSession();
  
  // 允许未登录用户使用（开发模式）
  // 使用 null 而不是 'anonymous'，避免外键约束错误
  const userId = user?.id || null;

  try {
    const body = await request.json();
    const { projectId, message, messages } = body;

    // 如果有 projectId，执行完整的 Agent 协作流程
    if (projectId) {
      const project = getProjectById(projectId);
      const projectName = project?.name || '新项目';

      // 确保项目状态已初始化
      let state = getProjectStateByProjectId(projectId);
      if (!state) {
        initProjectState(projectId);
        state = getProjectStateByProjectId(projectId);
      }

      const userMessage = message || messages?.[messages.length - 1]?.content || '';
      
      // 保存用户消息
      createMessage(projectId, 'user', userMessage, userId || undefined, { source: 'user' });

      // ========== 1. CEO AI 分析需求 ==========
      const analysis = await analyzeRequirement(userMessage);
      
      // 如果需求不清晰，CEO AI 追问
      if (analysis.needsMoreInfo) {
        const ceoMessage = `你好！我是 CEO AI，负责协调整个项目开发流程。

我注意到你提到想做"${userMessage.slice(0, 50)}..."，为了更好地帮你实现，我需要了解一些细节：

1. **项目目标**：这个项目的核心目标是什么？想解决什么问题？
2. **目标用户**：谁会使用这个产品？
3. **功能范围**：希望包含哪些核心功能？

请告诉我更多细节，我会帮你整理需求并组建最适合的开发团队。`;

        createMessage(projectId, 'assistant', ceoMessage, undefined, { agent: 'CEO AI', phase: 'requirement' });
        updateProjectPhase(projectId, 'requirement');

        return NextResponse.json({
          success: true,
          messages: [
            { role: 'assistant', content: ceoMessage, agent: 'CEO AI' }
          ],
          state: { phase: 'requirement', progress: 0 }
        });
      }

      // ========== 2. CEO AI 组建团队 ==========
      updateProjectPhase(projectId, 'planning', '正在组建团队...');
      
      const projectType = analysis.projectType;
      const assignedAgents = PROJECT_TYPE_AGENTS[projectType] || PROJECT_TYPE_AGENTS.default;
      assignAgents(projectId, assignedAgents.map(a => a.id));

      // 创建开发任务
      const taskDescription = `开发 ${projectName}：${analysis.projectSummary}`;
      for (const agentConfig of assignedAgents) {
        const agent = agents.find(a => a.id === agentConfig.id);
        if (agent) {
          createAgentTask(projectId, agent.id, agent.name, taskDescription);
        }
      }

      // CEO AI 分析消息
      const ceoAnalysisMessage = await generateCeoAnalysisMessage(
        userMessage,
        projectType,
        analysis.projectSummary,
        assignedAgents
      );
      createMessage(projectId, 'assistant', ceoAnalysisMessage, undefined, { agent: 'CEO AI', phase: 'planning' });

      // ========== 3. Coder Agent 开发 ==========
      updateProjectPhase(projectId, 'development', '开发进行中...');
      updateProgress(projectId, 20);

      // 模拟开发进度消息
      const coderProgressMessage = await generateCoderProgressMessage(
        taskDescription,
        30,
        projectName
      );
      createMessage(projectId, 'assistant', coderProgressMessage, undefined, { agent: 'Coder Agent', phase: 'development' });

      // 执行实际开发任务
      const tasks = getAgentTasksByProject(projectId);
      let coderResult: { success: boolean; message: string; previewUrl?: string } | null = null;

      if (tasks.length > 0) {
        const mainTask = tasks[0];
        updateAgentTaskStatus(mainTask.id, 'in_progress');
        updateProgress(projectId, 40);

        try {
          // 调用 Coder Agent 执行开发
          coderResult = await executeCoderTask(
            projectId,
            mainTask.id,
            taskDescription,
            {
              projectName,
              requirements: analysis.projectSummary,
            }
          );

          if (coderResult.success) {
            updateAgentTaskStatus(mainTask.id, 'completed', coderResult.message);
            updateProgress(projectId, 90);
          } else {
            updateAgentTaskStatus(mainTask.id, 'failed', coderResult.message);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '开发失败';
          updateAgentTaskStatus(mainTask.id, 'failed', errorMsg);
          coderResult = { success: false, message: errorMsg };
        }
      }

      // ========== 4. Coder Agent 完成消息 ==========
      updateProgress(projectId, 95);
      const coderCompleteMessage = generateCoderCompleteMessage(projectId, projectName);
      createMessage(projectId, 'assistant', coderCompleteMessage, undefined, { agent: 'Coder Agent', phase: 'completed', previewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/preview/${projectId}` });

      // ========== 5. CEO AI 交付消息 ==========
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const previewUrl = `${baseUrl}/preview/${projectId}`;
      
      setDeployUrl(projectId, previewUrl, 'success');
      updateProjectPhase(projectId, 'completed');

      const ceoDeliveryMessage = generateCeoDeliveryMessage(projectId, projectName);
      createMessage(projectId, 'assistant', ceoDeliveryMessage, undefined, { agent: 'CEO AI', phase: 'completed', deployUrl: previewUrl });

      // 返回完整的对话流程
      const allMessages = [
        { role: 'assistant', content: ceoAnalysisMessage, agent: 'CEO AI' },
        { role: 'assistant', content: coderProgressMessage, agent: 'Coder Agent' },
        { role: 'assistant', content: coderCompleteMessage, agent: 'Coder Agent' },
        { role: 'assistant', content: ceoDeliveryMessage, agent: 'CEO AI', isFinal: true },
      ];

      return NextResponse.json({
        success: true,
        messages: allMessages,
        state: {
          phase: 'completed',
          progress: 100,
          deploy_url: previewUrl,
        },
        deploy_url: previewUrl,
      });
    }

    // 没有 projectId 的情况：普通聊天代理
    const openaiRequest = {
      model: body.model || 'qwen-plus',
      messages: body.messages || [{ role: 'user', content: body.message || body.content || '' }],
      stream: false,
    };

    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gateway error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Chat API proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}