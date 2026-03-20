/**
 * Agent Skills 集成模块
 * 让 Agent 可以检测并调用 OpenClaw skills
 */

import {
  getAllOpenClawSkills,
  getOpenClawSkillByName,
  type OpenClawSkill,
} from '@/lib/openclaw-skills';

// Gateway 配置
const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || '';

export interface SkillMatch {
  skill: OpenClawSkill;
  confidence: number;  // 0-1 匹配置信度
  keywords: string[];  // 匹配的关键词
}

/**
 * 根据用户消息检测可能需要的 skills
 */
export function detectRequiredSkills(message: string): SkillMatch[] {
  const skills = getAllOpenClawSkills();
  const matches: SkillMatch[] = [];
  const messageLower = message.toLowerCase();
  
  for (const skill of skills) {
    const keywords: string[] = [];
    let confidence = 0;
    
    // 检查 skill 名称匹配
    if (messageLower.includes(skill.name.toLowerCase())) {
      keywords.push(skill.name);
      confidence += 0.5;
    }
    
    // 检查描述中的关键词
    const descWords = skill.description.toLowerCase().split(/\s+/);
    for (const word of descWords) {
      if (word.length > 3 && messageLower.includes(word)) {
        keywords.push(word);
        confidence += 0.1;
      }
    }
    
    // 特定 skill 的匹配规则
    const specificMatchers: Record<string, (msg: string) => { match: boolean; keywords: string[] }> = {
      weather: (msg) => ({
        match: /天气|温度|气温|下雨|晴天|weather|temperature/i.test(msg),
        keywords: ['天气', '温度'],
      }),
      github: (msg) => ({
        match: /github|gh|pr|issue|repo|仓库|合并请求|问题/i.test(msg),
        keywords: ['github', '仓库'],
      }),
      notion: (msg) => ({
        match: /notion|笔记|数据库/i.test(msg),
        keywords: ['notion', '笔记'],
      }),
      xurl: (msg) => ({
        match: /twitter|tweet|x\.com|推特|发推/i.test(msg),
        keywords: ['twitter', 'x'],
      }),
      discord: (msg) => ({
        match: /discord|discord服务器|discord消息/i.test(msg),
        keywords: ['discord'],
      }),
      slack: (msg) => ({
        match: /slack|slack消息|slack频道/i.test(msg),
        keywords: ['slack'],
      }),
      'openai-image-gen': (msg) => ({
        match: /生成图片|generate image|dall-e|画图|画一张/i.test(msg),
        keywords: ['图像生成', 'image'],
      }),
      'openai-whisper': (msg) => ({
        match: /语音识别|转录|transcribe|whisper/i.test(msg),
        keywords: ['语音', 'whisper'],
      }),
    };
    
    // 应用特定匹配器
    if (specificMatchers[skill.name]) {
      const result = specificMatchers[skill.name](messageLower);
      if (result.match) {
        keywords.push(...result.keywords);
        confidence += 0.3;
      }
    }
    
    if (confidence > 0.2) {
      matches.push({
        skill,
        confidence: Math.min(confidence, 1),
        keywords: [...new Set(keywords)],  // 去重
      });
    }
  }
  
  // 按置信度排序
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * 通过 OpenClaw Gateway 调用 skill
 */
export async function invokeSkill(
  skillName: string, 
  prompt: string,
  context?: string
): Promise<{
  success: boolean;
  result?: string;
  error?: string;
  raw?: any;
}> {
  try {
    // 验证 skill 存在
    const skill = getOpenClawSkillByName(skillName);
    if (!skill) {
      return { success: false, error: `Skill not found: ${skillName}` };
    }
    
    // 构建调用消息
    const skillHint = `[使用 ${skillName} skill] `;
    const fullPrompt = context 
      ? `${skillHint}${context}\n\n用户请求: ${prompt}`
      : `${skillHint}${prompt}`;
    
    // 调用 Gateway
    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GATEWAY_TOKEN && { 'Authorization': `Bearer ${GATEWAY_TOKEN}` }),
      },
      body: JSON.stringify({
        model: 'default',
        messages: [{ role: 'user', content: fullPrompt }],
        stream: false,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Gateway error: ${response.status} - ${errorText}` 
      };
    }
    
    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';
    
    return {
      success: true,
      result,
      raw: data,
    };
    
  } catch (error) {
    console.error('Skill invoke error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 为 Agent 准备 skills 上下文
 * 返回可用的 skills 列表供 Agent 选择
 */
export function prepareSkillsContext(): string {
  const skills = getAllOpenClawSkills();
  
  // 按分类分组
  const byCategory: Record<string, OpenClawSkill[]> = {};
  for (const skill of skills) {
    if (!byCategory[skill.category]) {
      byCategory[skill.category] = [];
    }
    byCategory[skill.category].push(skill);
  }
  
  let context = '# 可用的 OpenClaw Skills\n\n';
  context += `共有 ${skills.length} 个 skills 可用。\n\n`;
  
  for (const [category, categorySkills] of Object.entries(byCategory)) {
    context += `## ${category}\n`;
    for (const skill of categorySkills) {
      context += `- **${skill.name}** ${skill.emoji}: ${skill.description.slice(0, 100)}...\n`;
    }
    context += '\n';
  }
  
  return context;
}

/**
 * Agent 执行任务时的 skill 辅助函数
 */
export async function executeWithSkills(
  userMessage: string,
  agentPrompt: string
): Promise<{
  response: string;
  skillsUsed: string[];
  skillResults: Record<string, string>;
}> {
  // 1. 检测可能需要的 skills
  const detectedSkills = detectRequiredSkills(userMessage);
  const skillsUsed: string[] = [];
  const skillResults: Record<string, string> = {};
  
  // 2. 如果检测到高置信度的 skill，先执行
  for (const match of detectedSkills.slice(0, 2)) {  // 最多使用前 2 个
    if (match.confidence > 0.5) {
      const result = await invokeSkill(match.skill.name, userMessage);
      if (result.success && result.result) {
        skillsUsed.push(match.skill.name);
        skillResults[match.skill.name] = result.result;
      }
    }
  }
  
  // 3. 将 skill 结果作为上下文提供给 Agent
  let enhancedPrompt = agentPrompt;
  if (skillsUsed.length > 0) {
    enhancedPrompt += '\n\n## Skills 执行结果\n\n';
    for (const skillName of skillsUsed) {
      enhancedPrompt += `### ${skillName}\n${skillResults[skillName]}\n\n`;
    }
  }
  
  return {
    response: enhancedPrompt,
    skillsUsed,
    skillResults,
  };
}