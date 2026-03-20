/**
 * CEO Agent Workflow - CEO AI 协作工作流
 * 
 * 负责：
 * 1. 接收用户需求
 * 2. 引导完善需求
 * 3. 分析并分配任务
 * 4. 协调开发流程
 * 5. 交付项目
 */
import { agents, Agent } from '@/data/agents';
import {
  initProjectState,
  getProjectStateByProjectId,
  updateProjectPhase,
  updateCeoMessage,
  assignAgents,
  updateProgress,
  setDeployUrl,
  createAgentTask,
  getAgentTasksByProject,
  updateAgentTaskStatus,
  ProjectPhase,
  AgentTask,
} from '@/lib/db/project-state';
import { getMessagesByProject, createMessage } from '@/lib/db/projects';
import { executeCoderTask, CoderAgent } from './coder-agent';

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || '';

// 项目类型映射到推荐 Agent
const PROJECT_TYPE_AGENTS: Record<string, string[]> = {
  'game': ['dev-game-01', 'design-ui-01', 'dev-fe-01'],
  'web': ['dev-fe-01', 'dev-be-01', 'design-ui-01'],
  'mobile': ['dev-mobile-03', 'design-ui-01', 'dev-be-01'],
  'data': ['ana-data-01', 'dev-ai-01', 'ops-data-01'],
  'content': ['write-content-01', 'design-graphic-01', 'mkt-social-01'],
  'default': ['dev-full-01', 'design-ui-01', 'write-copy-01'],
};

// CEO Agent Prompt 模板
const CEO_SYSTEM_PROMPT = `你是 Lobster AI 的 CEO，负责协调项目开发全流程。

## 你的职责
1. **需求收集**：引导用户描述需求，提问澄清细节
2. **需求分析**：理解项目类型、复杂度、所需资源
3. **团队组建**：从 Agent 市场选择合适的团队成员
4. **任务分配**：将项目拆解为具体任务分配给对应 Agent
5. **进度跟踪**：监控各 Agent 工作进度
6. **质量把控**：确保交付物符合用户预期
7. **项目交付**：生成可访问的项目链接

## 当前项目信息
- 项目名称：{projectName}
- 项目阶段：{phase}
- 已分配团队：{teamMembers}

## 工作原则
- 主动沟通，不懂就问
- 用简单语言解释技术概念
- 确保用户了解进度
- 遇到问题及时反馈

## 回复格式
根据当前阶段，你的回复应该：
- **init/init-requirement**: 友好问候，了解用户想做什么
- **requirement**: 提出具体问题帮助细化需求
- **planning**: 展示团队配置和开发计划
- **development**: 汇报当前进度和已完成内容
- **completed**: 展示项目交付链接`;

/**
 * CEO Agent 类
 */
export class CeoAgent {
  private projectId: string;
  private projectName: string;

  constructor(projectId: string, projectName: string) {
    this.projectId = projectId;
    this.projectName = projectName;
  }

  /**
   * 初始化项目（创建时调用）
   */
  static initProject(projectId: string, projectName: string): void {
    initProjectState(projectId);
    updateProjectPhase(projectId, 'init');
  }

  /**
   * 处理用户消息
   */
  async processUserMessage(userMessage: string): Promise<string> {
    const state = getProjectStateByProjectId(this.projectId);
    if (!state) {
      // 如果没有状态，初始化
      CeoAgent.initProject(this.projectId, this.projectName);
    }

    const currentState = getProjectStateByProjectId(this.projectId);
    const phase = currentState?.phase || 'init';

    // 根据阶段处理
    switch (phase) {
      case 'init':
      case 'requirement':
        return this.handleRequirementPhase(userMessage);
      case 'planning':
        return this.handlePlanningPhase(userMessage);
      case 'development':
        return this.handleDevelopmentPhase(userMessage);
      case 'completed':
        return this.handleCompletedPhase(userMessage);
      default:
        return this.handleRequirementPhase(userMessage);
    }
  }

  /**
   * 需求收集阶段
   */
  private async handleRequirementPhase(userMessage: string): Promise<string> {
    // 使用 LLM 分析用户需求
    const analysis = await this.analyzeRequirement(userMessage);
    
    // 判断需求是否足够清晰
    if (analysis.needsMoreInfo) {
      updateProjectPhase(this.projectId, 'requirement');
      return analysis.response;
    }

    // 需求清晰，进入规划阶段
    updateProjectPhase(this.projectId, 'planning', '正在组建团队...');
    
    // 分析项目类型并分配 Agent
    const projectType = analysis.projectType || 'default';
    const recommendedAgents = PROJECT_TYPE_AGENTS[projectType] || PROJECT_TYPE_AGENTS.default;
    assignAgents(this.projectId, recommendedAgents);

    // 创建任务
    const tasks = analysis.tasks || [];
    for (const task of tasks) {
      const agentId = task.agentId || recommendedAgents[0];
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        createAgentTask(this.projectId, agentId, agent.name, task.description);
      }
    }

    // 返回规划响应
    return this.generatePlanningResponse(recommendedAgents, tasks);
  }

  /**
   * 规划阶段
   */
  private async handlePlanningPhase(userMessage: string): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();
    
    // 用户确认开始开发
    if (lowerMessage.includes('开始') || lowerMessage.includes('确认') || lowerMessage.includes('好的') || lowerMessage.includes('可以')) {
      updateProjectPhase(this.projectId, 'development', '开发进行中...');
      updateProgress(this.projectId, 10);
      
      // 开始执行任务
      return this.startDevelopment();
    }

    // 用户想要修改
    if (lowerMessage.includes('修改') || lowerMessage.includes('调整')) {
      updateProjectPhase(this.projectId, 'requirement');
      return '好的，请告诉我你想调整哪些方面？';
    }

    return '如果你确认这个方案，请回复"开始开发"，或者告诉我需要调整的地方。';
  }

  /**
   * 开发阶段
   */
  private async handleDevelopmentPhase(userMessage: string): Promise<string> {
    const tasks = getAgentTasksByProject(this.projectId);
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    
    if (pendingTasks.length === 0) {
      // 所有任务完成，准备交付
      return await this.completeProject();
    }

    // 模拟开发进度
    const progress = Math.min(90, 10 + (tasks.filter(t => t.status === 'completed').length / tasks.length) * 80);
    updateProgress(this.projectId, Math.round(progress));

    return `开发进行中...\n\n当前进度：${Math.round(progress)}%\n\n${this.getTaskStatusReport(tasks)}`;
  }

  /**
   * 已完成阶段
   */
  private async handleCompletedPhase(userMessage: string): Promise<string> {
    const state = getProjectStateByProjectId(this.projectId);
    return `项目已完成！🎉\n\n访问链接：${state?.deploy_url || '正在生成...'}\n\n如果需要修改或有其他问题，随时告诉我！`;
  }

  /**
   * 分析用户需求（调用 LLM）
   */
  private async analyzeRequirement(message: string): Promise<{
    needsMoreInfo: boolean;
    response: string;
    projectType?: string;
    tasks?: { agentId: string; description: string }[];
  }> {
    try {
      // 调用 LLM 分析需求
      const prompt = `分析以下用户需求，判断需求是否足够清晰：

用户需求：${message}

请以 JSON 格式返回：
{
  "needsMoreInfo": boolean, // 是否需要更多信息
  "response": string, // 如果需要更多信息，这里是追问内容；否则是需求总结
  "projectType": string, // 项目类型：game/web/mobile/data/content/default
  "tasks": [ // 如果需求清晰，列出任务分解
    { "agentId": string, "description": string }
  ]
}

只返回 JSON，不要其他内容。`;

      const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        // 尝试解析 JSON
        try {
          // 提取 JSON 部分
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch {
          // JSON 解析失败，使用默认逻辑
        }
      }
    } catch (error) {
      console.error('Analyze requirement error:', error);
    }

    // 默认逻辑：简单判断
    const wordCount = message.length;
    if (wordCount < 20) {
      return {
        needsMoreInfo: true,
        response: `我了解你想做"${message}"相关的项目。能告诉我更多细节吗？比如：
        
1. 这个项目的主要目的是什么？
2. 目标用户是谁？
3. 希望有哪些核心功能？`,
      };
    }

    // 根据关键词判断项目类型
    let projectType = 'default';
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('游戏') || lowerMsg.includes('game')) {
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
      response: `好的，我来帮你规划这个项目！`,
      projectType,
      tasks: this.generateDefaultTasks(projectType),
    };
  }

  /**
   * 生成默认任务
   */
  private generateDefaultTasks(projectType: string): { agentId: string; description: string }[] {
    switch (projectType) {
      case 'game':
        return [
          { agentId: 'dev-game-01', description: '设计游戏核心逻辑和交互' },
          { agentId: 'design-ui-01', description: '设计游戏界面和视觉效果' },
          { agentId: 'dev-fe-01', description: '实现前端游戏引擎' },
        ];
      case 'web':
        return [
          { agentId: 'design-ui-01', description: '设计网站 UI 界面' },
          { agentId: 'dev-fe-01', description: '开发前端页面' },
          { agentId: 'dev-be-01', description: '开发后端服务' },
        ];
      default:
        return [
          { agentId: 'dev-full-01', description: '开发完整应用' },
          { agentId: 'design-ui-01', description: '设计用户界面' },
        ];
    }
  }

  /**
   * 生成规划响应
   */
  private generatePlanningResponse(agentIds: string[], tasks: { agentId: string; description: string }[]): string {
    const teamInfo = agentIds.map(id => {
      const agent = agents.find(a => a.id === id);
      return agent ? `- **${agent.name}** ${agent.avatar}: ${agent.description}` : id;
    }).join('\n');

    const taskInfo = tasks.map((t, i) => `${i + 1}. ${t.description}`).join('\n');

    return `## 📋 项目规划

**项目名称**：${this.projectName}

### 团队配置
${teamInfo}

### 开发任务
${taskInfo || '1. 需求分析与设计\n2. 核心功能开发\n3. 测试与优化'}

---
如果你确认这个方案，请回复「开始开发」，或者告诉我需要调整的地方。`;
  }

  /**
   * 开始开发
   */
  private async startDevelopment(): Promise<string> {
    const tasks = getAgentTasksByProject(this.projectId);
    
    // 实际执行开发任务
    let response = `## 🚀 开发启动\n\n`;
    response += `已分配 ${tasks.length} 个任务，正在执行...\n\n`;
    
    // 获取需求上下文
    const state = getProjectStateByProjectId(this.projectId);
    const requirements = state?.ceo_message || '';

    // 执行每个任务
    for (const task of tasks) {
      updateAgentTaskStatus(task.id, 'in_progress');
      response += `**${task.agent_name}** 开始处理：${task.task_description}\n`;
      
      // 调用 Coder Agent 执行实际开发
      try {
        const result = await executeCoderTask(
          this.projectId,
          task.id,
          task.task_description,
          {
            projectName: this.projectName,
            requirements,
          }
        );

        if (result.success) {
          updateAgentTaskStatus(task.id, 'completed', result.message);
          response += `✅ 完成：${result.message}\n`;
          if (result.previewUrl) {
            response += `📦 预览：${result.previewUrl}\n`;
          }
        } else {
          updateAgentTaskStatus(task.id, 'failed', result.message);
          response += `❌ 失败：${result.message}\n`;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        updateAgentTaskStatus(task.id, 'failed', errorMsg);
        response += `❌ 错误：${errorMsg}\n`;
      }
    }

    // 所有任务完成，进入部署阶段
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === tasks.length) {
      return await this.completeProject();
    }

    // 更新进度
    const progress = Math.round((completedTasks.length / tasks.length) * 100);
    updateProgress(this.projectId, progress);

    response += `\n当前进度：${progress}%`;
    
    return response;
  }

  /**
   * 完成项目
   */
  private async completeProject(): Promise<string> {
    updateProjectPhase(this.projectId, 'deploying', '正在部署...');
    updateProgress(this.projectId, 95);

    // 获取实际生成的文件
    const files = CoderAgent.getProjectFiles(this.projectId);
    
    // 生成部署链接
    const deployUrl = await this.generatePreviewUrl();

    setDeployUrl(this.projectId, deployUrl, 'success');
    updateProjectPhase(this.projectId, 'completed');

    const fileListDisplay = files.length > 0 
      ? files.slice(0, 10).map(f => `- \`${f}\``).join('\n') + (files.length > 10 ? `\n- ... 还有 ${files.length - 10} 个文件` : '')
      : '- 无生成文件';

    return `## 🎉 项目完成！

**项目名称**：${this.projectName}

### 📦 项目文件
${fileListDisplay}

### 🔗 访问链接
[点击查看预览](${deployUrl})

### 👥 团队贡献
${this.getContributions()}

---
感谢使用 Lobster AI！如有问题随时联系。`;
  }

  /**
   * 生成预览链接
   */
  private async generatePreviewUrl(): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/preview/${this.projectId}`;
  }

  /**
   * 获取任务状态报告
   */
  private getTaskStatusReport(tasks: AgentTask[]): string {
    return tasks.map(t => {
      const statusEmoji = {
        pending: '⏳',
        in_progress: '🔄',
        completed: '✅',
        failed: '❌',
      }[t.status] || '❓';

      return `${statusEmoji} **${t.agent_name}**: ${t.task_description}`;
    }).join('\n');
  }

  /**
   * 获取贡献报告
   */
  private getContributions(): string {
    const tasks = getAgentTasksByProject(this.projectId);
    return tasks.filter(t => t.status === 'completed').map(t => 
      `- ✅ ${t.agent_name}: ${t.task_description}`
    ).join('\n') || '- 团队协作完成';
  }

  /**
   * 调用 LLM
   */
  private async callLlm(messages: { role: string; content: string }[]): Promise<string> {
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
    } catch (error) {
      console.error('Call LLM error:', error);
    }
    return '';
  }
}

/**
 * 获取或创建 CEO Agent 实例
 */
export function getCeoAgent(projectId: string, projectName: string): CeoAgent {
  return new CeoAgent(projectId, projectName);
}