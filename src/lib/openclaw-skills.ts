/**
 * OpenClaw Skills 集成模块
 * 扫描并解析 OpenClaw skills 目录中的 SKILL.md 文件
 */

import fs from 'fs';
import path from 'path';

// OpenClaw Skills 路径
const SYSTEM_SKILLS_PATH = '/usr/local/lib/node_modules/openclaw/skills';
const USER_SKILLS_PATH = path.join(process.env.HOME || '', '.openclaw/skills');

export interface OpenClawSkill {
  name: string;
  description: string;
  emoji: string;
  homepage?: string;
  requires?: {
    bins?: string[];
    env?: string[];
  };
  install?: Array<{
    id: string;
    kind: string;
    formula?: string;
    package?: string;
    bins?: string[];
    label: string;
  }>;
  category: SkillCategory;
  location: string;
  source: 'system' | 'user';
}

export type SkillCategory = 
  | 'code' 
  | 'deploy' 
  | 'storage' 
  | 'ai' 
  | 'social' 
  | 'tools'
  | 'communication'
  | 'media'
  | 'productivity'
  | 'admin';

export interface SkillCategoryInfo {
  id: SkillCategory;
  name: string;
  icon: string;
  description: string;
}

export const skillCategories: SkillCategoryInfo[] = [
  { id: 'code', name: '代码仓库', icon: '💻', description: 'GitHub、GitLab等代码管理' },
  { id: 'deploy', name: '部署平台', icon: '🚀', description: 'Vercel、云函数等部署服务' },
  { id: 'storage', name: '云存储', icon: '☁️', description: 'OSS、S3等云存储服务' },
  { id: 'ai', name: 'AI模型', icon: '🤖', description: 'OpenAI、Claude等AI服务' },
  { id: 'social', name: '社交媒体', icon: '📱', description: 'X/Twitter、社交平台' },
  { id: 'communication', name: '通讯工具', icon: '💬', description: 'Discord、Slack、飞书等' },
  { id: 'tools', name: '工具服务', icon: '🔧', description: 'Notion、笔记等协作工具' },
  { id: 'media', name: '媒体处理', icon: '🎬', description: '图像、音频、视频处理' },
  { id: 'productivity', name: '生产力', icon: '📊', description: '笔记、任务、日历等' },
  { id: 'admin', name: '系统管理', icon: '⚙️', description: '系统管理和配置' },
];

/**
 * 根据技能名称推断分类
 */
function inferCategory(skillName: string, description: string): SkillCategory {
  const name = skillName.toLowerCase();
  const desc = description.toLowerCase();
  
  // 代码仓库
  if (name.includes('github') || name.includes('git') || name.includes('gh-')) return 'code';
  if (desc.includes('git') || desc.includes('repo') || desc.includes('pr') || desc.includes('issue')) return 'code';
  
  // 部署
  if (name.includes('deploy') || name.includes('fc') || name.includes('vercel')) return 'deploy';
  if (desc.includes('deploy') || desc.includes('serverless')) return 'deploy';
  
  // AI
  if (name.includes('openai') || name.includes('gemini') || name.includes('claude') || name.includes('ai')) return 'ai';
  if (desc.includes('gpt') || desc.includes('llm') || desc.includes('image generat')) return 'ai';
  
  // 通讯
  if (name.includes('discord') || name.includes('slack') || name.includes('imsg') || name.includes('wa')) return 'communication';
  if (desc.includes('discord') || desc.includes('slack') || desc.includes('message') || desc.includes('chat')) return 'communication';
  
  // 社交媒体
  if (name.includes('xurl') || name.includes('twitter') || name.includes('tweet')) return 'social';
  if (desc.includes('twitter') || desc.includes('x api') || desc.includes('tweet')) return 'social';
  
  // 存储
  if (name.includes('oss') || name.includes('s3') || name.includes('storage')) return 'storage';
  
  // 媒体
  if (name.includes('image') || name.includes('video') || name.includes('audio') || name.includes('whisper')) return 'media';
  if (desc.includes('image') || desc.includes('video') || desc.includes('audio') || desc.includes('transcri')) return 'media';
  
  // 生产力
  if (name.includes('notion') || name.includes('obsidian') || name.includes('bear') || name.includes('todo') || name.includes('things')) return 'productivity';
  if (desc.includes('note') || desc.includes('todo') || desc.includes('task') || desc.includes('calendar')) return 'productivity';
  
  // 工具
  if (name.includes('notion') || name.includes('trello') || name.includes('canvas')) return 'tools';
  
  // 管理
  if (name.includes('health') || name.includes('audit') || name.includes('admin') || name.includes('node-connect')) return 'admin';
  
  return 'tools';
}

/**
 * 解析 SKILL.md 文件的 YAML frontmatter
 */
function parseSkillMd(content: string, filePath: string): Partial<OpenClawSkill> | null {
  try {
    // 提取 YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }
    
    const frontmatter = frontmatterMatch[1];
    const result: Partial<OpenClawSkill> = {};
    
    // 解析 name
    const nameMatch = frontmatter.match(/^name:\s*"?([^"\n]+)"?/m);
    if (nameMatch) {
      result.name = nameMatch[1].trim();
    }
    
    // 解析 description
    const descMatch = frontmatter.match(/^description:\s*["']?([\s\S]*?)["']?(?:\n\w|$)/m);
    if (descMatch) {
      result.description = descMatch[1].trim();
    }
    
    // 解析 homepage
    const homeMatch = frontmatter.match(/^homepage:\s*(.+)$/m);
    if (homeMatch) {
      result.homepage = homeMatch[1].trim();
    }
    
    // 解析 metadata 中的 emoji 和 requires
    const metadataMatch = frontmatter.match(/metadata:\s*\n([\s\S]*?)(?=\n\w|\n---|$)/);
    if (metadataMatch) {
      const metadata = metadataMatch[1];
      
      // 解析 emoji
      const emojiMatch = metadata.match(/"emoji":\s*"([^"]+)"/);
      if (emojiMatch) {
        result.emoji = emojiMatch[1];
      }
      
      // 解析 requires
      const requiresMatch = metadata.match(/"requires":\s*\{([^}]+)\}/);
      if (requiresMatch) {
        const requiresStr = requiresMatch[1];
        result.requires = {};
        
        // 解析 bins
        const binsMatch = requiresStr.match(/"bins":\s*\[([^\]]+)\]/);
        if (binsMatch) {
          result.requires.bins = binsMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
        }
        
        // 解析 env
        const envMatch = requiresStr.match(/"env":\s*\[([^\]]+)\]/);
        if (envMatch) {
          result.requires.env = envMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
        }
      }
      
      // 解析 install
      const installMatch = metadata.match(/"install":\s*\[([\s\S]*?)\]/);
      if (installMatch) {
        try {
          // 简单解析 install 数组
          result.install = [];
          const installStr = installMatch[1];
          const installItems = installStr.match(/\{[^}]+\}/g) || [];
          
          for (const item of installItems) {
            const idMatch = item.match(/"id":\s*"([^"]+)"/);
            const kindMatch = item.match(/"kind":\s*"([^"]+)"/);
            const formulaMatch = item.match(/"formula":\s*"([^"]+)"/);
            const packageMatch = item.match(/"package":\s*"([^"]+)"/);
            const labelMatch = item.match(/"label":\s*"([^"]+)"/);
            
            if (idMatch && kindMatch && labelMatch) {
              result.install.push({
                id: idMatch[1],
                kind: kindMatch[1],
                formula: formulaMatch?.[1],
                package: packageMatch?.[1],
                label: labelMatch[1],
              });
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    
    result.location = filePath;
    
    return result;
  } catch (error) {
    console.error(`Error parsing skill ${filePath}:`, error);
    return null;
  }
}

/**
 * 扫描指定目录中的 skills
 */
function scanSkillsDirectory(dirPath: string, source: 'system' | 'user'): OpenClawSkill[] {
  const skills: OpenClawSkill[] = [];
  
  try {
    if (!fs.existsSync(dirPath)) {
      return skills;
    }
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const skillDir = path.join(dirPath, entry.name);
      const skillMdPath = path.join(skillDir, 'SKILL.md');
      
      if (!fs.existsSync(skillMdPath)) continue;
      
      try {
        const content = fs.readFileSync(skillMdPath, 'utf-8');
        const parsed = parseSkillMd(content, skillMdPath);
        
        if (parsed && parsed.name) {
          const skill: OpenClawSkill = {
            name: parsed.name,
            description: parsed.description || '',
            emoji: parsed.emoji || '📦',
            homepage: parsed.homepage,
            requires: parsed.requires,
            install: parsed.install,
            category: inferCategory(parsed.name, parsed.description || ''),
            location: skillMdPath,
            source,
          };
          
          skills.push(skill);
        }
      } catch (err) {
        console.error(`Error reading ${skillMdPath}:`, err);
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dirPath}:`, err);
  }
  
  return skills;
}

/**
 * 获取所有 OpenClaw Skills
 */
export function getAllOpenClawSkills(): OpenClawSkill[] {
  const systemSkills = scanSkillsDirectory(SYSTEM_SKILLS_PATH, 'system');
  const userSkills = scanSkillsDirectory(USER_SKILLS_PATH, 'user');
  
  // 合并，用户 skills 覆盖系统 skills（同名）
  const skillMap = new Map<string, OpenClawSkill>();
  
  for (const skill of systemSkills) {
    skillMap.set(skill.name, skill);
  }
  
  for (const skill of userSkills) {
    skillMap.set(skill.name, skill);
  }
  
  return Array.from(skillMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 根据名称获取 Skill
 */
export function getOpenClawSkillByName(name: string): OpenClawSkill | undefined {
  const skills = getAllOpenClawSkills();
  return skills.find(s => s.name === name);
}

/**
 * 按分类获取 Skills
 */
export function getOpenClawSkillsByCategory(category: SkillCategory): OpenClawSkill[] {
  const skills = getAllOpenClawSkills();
  return skills.filter(s => s.category === category);
}

/**
 * 搜索 Skills
 */
export function searchOpenClawSkills(query: string): OpenClawSkill[] {
  const q = query.toLowerCase();
  const skills = getAllOpenClawSkills();
  
  return skills.filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q)
  );
}

/**
 * 获取 Skills 统计信息
 */
export function getOpenClawSkillsStats(): {
  total: number;
  system: number;
  user: number;
  byCategory: Record<SkillCategory, number>;
} {
  const skills = getAllOpenClawSkills();
  
  const stats = {
    total: skills.length,
    system: skills.filter(s => s.source === 'system').length,
    user: skills.filter(s => s.source === 'user').length,
    byCategory: {} as Record<SkillCategory, number>,
  };
  
  // 初始化所有分类
  for (const cat of skillCategories) {
    stats.byCategory[cat.id] = 0;
  }
  
  // 统计各分类
  for (const skill of skills) {
    stats.byCategory[skill.category] = (stats.byCategory[skill.category] || 0) + 1;
  }
  
  return stats;
}

/**
 * 获取 Skill 的 README 内容（用于详情展示）
 */
export function getOpenClawSkillReadme(name: string): string | null {
  const skill = getOpenClawSkillByName(name);
  if (!skill) return null;
  
  try {
    const content = fs.readFileSync(skill.location, 'utf-8');
    return content;
  } catch {
    return null;
  }
}