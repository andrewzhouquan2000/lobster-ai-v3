/**
 * Skills 定义 - Skills = 能力 + 权限
 */

export interface Skill {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: SkillCategory;
  icon: string;
  permissions: string[];
}

export type SkillCategory = 
  | 'code' 
  | 'deploy' 
  | 'storage' 
  | 'ai' 
  | 'social' 
  | 'tools'
  | 'admin';

export interface SkillCategoryInfo {
  id: SkillCategory;
  name: string;
  icon: string;
  description: string;
}

export const skillCategories: SkillCategoryInfo[] = [
  { id: 'code', name: '代码仓库', icon: '💻', description: 'GitHub、GitLab等代码管理' },
  { id: 'deploy', name: '部署平台', icon: '🚀', description: 'Vercel、Netlify等部署服务' },
  { id: 'storage', name: '云存储', icon: '☁️', description: 'OSS、S3等云存储服务' },
  { id: 'ai', name: 'AI模型', icon: '🤖', description: 'OpenAI、Claude等AI服务' },
  { id: 'social', name: '社交媒体', icon: '📱', description: '小红书、微博等社交平台' },
  { id: 'tools', name: '工具服务', icon: '🔧', description: '飞书、Notion等协作工具' },
  { id: 'admin', name: '管理权限', icon: '👑', description: '系统管理和配置权限' },
];

/**
 * 预定义的Skills列表
 */
export const skills: Skill[] = [
  // ========== 代码仓库 ==========
  {
    id: 'github:read',
    name: 'github:read',
    displayName: 'GitHub 读取',
    description: '读取GitHub仓库内容、Issue、PR等',
    category: 'code',
    icon: '📖',
    permissions: ['repo:read', 'issue:read', 'pr:read'],
  },
  {
    id: 'github:write',
    name: 'github:write',
    displayName: 'GitHub 写入',
    description: '创建和更新GitHub仓库内容、Issue、PR等',
    category: 'code',
    icon: '✏️',
    permissions: ['repo:write', 'issue:write', 'pr:write'],
  },
  {
    id: 'github:admin',
    name: 'github:admin',
    displayName: 'GitHub 管理',
    description: '管理GitHub仓库设置、成员权限等',
    category: 'code',
    icon: '🔐',
    permissions: ['repo:admin', 'settings:write'],
  },
  {
    id: 'gitlab:read',
    name: 'gitlab:read',
    displayName: 'GitLab 读取',
    description: '读取GitLab仓库内容',
    category: 'code',
    icon: '📖',
    permissions: ['gitlab:repo:read'],
  },
  {
    id: 'gitlab:write',
    name: 'gitlab:write',
    displayName: 'GitLab 写入',
    description: '创建和更新GitLab仓库内容',
    category: 'code',
    icon: '✏️',
    permissions: ['gitlab:repo:write'],
  },

  // ========== 部署平台 ==========
  {
    id: 'vercel:deploy',
    name: 'vercel:deploy',
    displayName: 'Vercel 部署',
    description: '部署项目到Vercel平台',
    category: 'deploy',
    icon: '▲',
    permissions: ['vercel:deploy', 'vercel:domain'],
  },
  {
    id: 'vercel:manage',
    name: 'vercel:manage',
    displayName: 'Vercel 管理',
    description: '管理Vercel项目设置和域名',
    category: 'deploy',
    icon: '⚙️',
    permissions: ['vercel:project:write', 'vercel:domain:write'],
  },
  {
    id: 'netlify:deploy',
    name: 'netlify:deploy',
    displayName: 'Netlify 部署',
    description: '部署项目到Netlify平台',
    category: 'deploy',
    icon: '🌐',
    permissions: ['netlify:deploy', 'netlify:site'],
  },
  {
    id: 'aliyun_fc:deploy',
    name: 'aliyun_fc:deploy',
    displayName: '阿里云FC 部署',
    description: '部署函数到阿里云函数计算',
    category: 'deploy',
    icon: '☁️',
    permissions: ['aliyun:fc:deploy', 'aliyun:fc:invoke'],
  },

  // ========== 云存储 ==========
  {
    id: 'oss:read',
    name: 'oss:read',
    displayName: 'OSS 读取',
    description: '读取阿里云OSS存储内容',
    category: 'storage',
    icon: '📁',
    permissions: ['oss:get', 'oss:list'],
  },
  {
    id: 'oss:write',
    name: 'oss:write',
    displayName: 'OSS 写入',
    description: '上传和管理阿里云OSS存储内容',
    category: 'storage',
    icon: '📤',
    permissions: ['oss:put', 'oss:delete'],
  },
  {
    id: 's3:read',
    name: 's3:read',
    displayName: 'S3 读取',
    description: '读取AWS S3存储内容',
    category: 'storage',
    icon: '📁',
    permissions: ['s3:get', 's3:list'],
  },
  {
    id: 's3:write',
    name: 's3:write',
    displayName: 'S3 写入',
    description: '上传和管理AWS S3存储内容',
    category: 'storage',
    icon: '📤',
    permissions: ['s3:put', 's3:delete'],
  },

  // ========== AI模型 ==========
  {
    id: 'openai:chat',
    name: 'openai:chat',
    displayName: 'OpenAI 对话',
    description: '使用OpenAI GPT模型进行对话',
    category: 'ai',
    icon: '🤖',
    permissions: ['openai:chat', 'openai:completion'],
  },
  {
    id: 'openai:image',
    name: 'openai:image',
    displayName: 'OpenAI 图像',
    description: '使用DALL-E生成图像',
    category: 'ai',
    icon: '🎨',
    permissions: ['openai:image:generate'],
  },
  {
    id: 'claude:chat',
    name: 'claude:chat',
    displayName: 'Claude 对话',
    description: '使用Claude模型进行对话',
    category: 'ai',
    icon: '🧠',
    permissions: ['claude:chat'],
  },
  {
    id: 'qwen:chat',
    name: 'qwen:chat',
    displayName: '通义千问 对话',
    description: '使用阿里云通义千问模型',
    category: 'ai',
    icon: '🔮',
    permissions: ['qwen:chat'],
  },

  // ========== 社交媒体 ==========
  {
    id: 'xiaohongshu:post',
    name: 'xiaohongshu:post',
    displayName: '小红书发布',
    description: '发布小红书笔记内容',
    category: 'social',
    icon: '📕',
    permissions: ['xiaohongshu:note:write'],
  },
  {
    id: 'xiaohongshu:read',
    name: 'xiaohongshu:read',
    displayName: '小红书读取',
    description: '读取小红书数据和内容',
    category: 'social',
    icon: '📖',
    permissions: ['xiaohongshu:note:read'],
  },
  {
    id: 'weibo:post',
    name: 'weibo:post',
    displayName: '微博发布',
    description: '发布微博内容',
    category: 'social',
    icon: '📢',
    permissions: ['weibo:status:write'],
  },
  {
    id: 'wechat:post',
    name: 'wechat:post',
    displayName: '微信公众号发布',
    description: '发布微信公众号文章',
    category: 'social',
    icon: '💬',
    permissions: ['wechat:article:write'],
  },

  // ========== 工具服务 ==========
  {
    id: 'feishu:read',
    name: 'feishu:read',
    displayName: '飞书读取',
    description: '读取飞书文档、日历等',
    category: 'tools',
    icon: '📄',
    permissions: ['feishu:doc:read', 'feishu:calendar:read'],
  },
  {
    id: 'feishu:write',
    name: 'feishu:write',
    displayName: '飞书写入',
    description: '创建和编辑飞书文档',
    category: 'tools',
    icon: '✏️',
    permissions: ['feishu:doc:write'],
  },
  {
    id: 'notion:read',
    name: 'notion:read',
    displayName: 'Notion 读取',
    description: '读取Notion页面和数据库',
    category: 'tools',
    icon: '📓',
    permissions: ['notion:page:read', 'notion:db:read'],
  },
  {
    id: 'notion:write',
    name: 'notion:write',
    displayName: 'Notion 写入',
    description: '创建和编辑Notion内容',
    category: 'tools',
    icon: '✏️',
    permissions: ['notion:page:write', 'notion:db:write'],
  },

  // ========== 管理权限 ==========
  {
    id: 'admin:team',
    name: 'admin:team',
    displayName: '团队管理',
    description: '管理团队成员和角色',
    category: 'admin',
    icon: '👥',
    permissions: ['team:manage', 'agent:assign'],
  },
  {
    id: 'admin:settings',
    name: 'admin:settings',
    displayName: '系统设置',
    description: '修改系统配置和设置',
    category: 'admin',
    icon: '⚙️',
    permissions: ['settings:write'],
  },
  {
    id: 'admin:tokens',
    name: 'admin:tokens',
    displayName: 'Token管理',
    description: '管理所有API Token和密钥',
    category: 'admin',
    icon: '🔑',
    permissions: ['tokens:manage'],
  },
];

/**
 * 按分类获取Skills
 */
export function getSkillsByCategory(category: SkillCategory): Skill[] {
  return skills.filter(s => s.category === category);
}

/**
 * 根据ID获取Skill
 */
export function getSkillById(id: string): Skill | undefined {
  return skills.find(s => s.id === id);
}

/**
 * 搜索Skills
 */
export function searchSkills(query: string): Skill[] {
  const q = query.toLowerCase();
  return skills.filter(s => 
    s.name.toLowerCase().includes(q) ||
    s.displayName.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q)
  );
}

/**
 * 获取所有活跃的Skills
 */
export function getActiveSkills(): Skill[] {
  return skills; // 全部返回，数据库层面控制活跃状态
}

/**
 * 资源类型定义
 */
export type ResourceType = 
  | 'github'
  | 'gitlab'
  | 'vercel'
  | 'netlify'
  | 'aliyun_oss'
  | 'aliyun_fc'
  | 'aws_s3'
  | 'openai'
  | 'feishu'
  | 'notion'
  | 'other';

export interface ResourceTypeInfo {
  id: ResourceType;
  name: string;
  icon: string;
  description: string;
  configFields: { key: string; label: string; type: 'text' | 'password' | 'url' }[];
}

export const resourceTypes: ResourceTypeInfo[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'GitHub代码仓库',
    configFields: [
      { key: 'token', label: 'Personal Access Token', type: 'password' },
      { key: 'defaultRepo', label: '默认仓库', type: 'text' },
    ],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: '🦊',
    description: 'GitLab代码仓库',
    configFields: [
      { key: 'token', label: 'Access Token', type: 'password' },
      { key: 'host', label: 'GitLab地址', type: 'url' },
    ],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: '▲',
    description: 'Vercel部署平台',
    configFields: [
      { key: 'token', label: 'Vercel Token', type: 'password' },
      { key: 'teamId', label: '团队ID', type: 'text' },
    ],
  },
  {
    id: 'netlify',
    name: 'Netlify',
    icon: '🌐',
    description: 'Netlify部署平台',
    configFields: [
      { key: 'token', label: 'Netlify Token', type: 'password' },
      { key: 'siteId', label: '站点ID', type: 'text' },
    ],
  },
  {
    id: 'aliyun_oss',
    name: '阿里云OSS',
    icon: '☁️',
    description: '阿里云对象存储',
    configFields: [
      { key: 'accessKeyId', label: 'AccessKey ID', type: 'text' },
      { key: 'accessKeySecret', label: 'AccessKey Secret', type: 'password' },
      { key: 'bucket', label: 'Bucket名称', type: 'text' },
      { key: 'region', label: '地域', type: 'text' },
    ],
  },
  {
    id: 'aliyun_fc',
    name: '阿里云FC',
    icon: '⚡',
    description: '阿里云函数计算',
    configFields: [
      { key: 'accessKeyId', label: 'AccessKey ID', type: 'text' },
      { key: 'accessKeySecret', label: 'AccessKey Secret', type: 'password' },
      { key: 'region', label: '地域', type: 'text' },
      { key: 'serviceName', label: '服务名称', type: 'text' },
    ],
  },
  {
    id: 'aws_s3',
    name: 'AWS S3',
    icon: '🪣',
    description: 'AWS对象存储',
    configFields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text' },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
      { key: 'bucket', label: 'Bucket名称', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    description: 'OpenAI API',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'organization', label: 'Organization ID', type: 'text' },
    ],
  },
  {
    id: 'feishu',
    name: '飞书',
    icon: '📄',
    description: '飞书开放平台',
    configFields: [
      { key: 'appId', label: 'App ID', type: 'text' },
      { key: 'appSecret', label: 'App Secret', type: 'password' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: '📓',
    description: 'Notion API',
    configFields: [
      { key: 'token', label: 'Integration Token', type: 'password' },
      { key: 'databaseId', label: 'Database ID', type: 'text' },
    ],
  },
  {
    id: 'other',
    name: '其他',
    icon: '🔧',
    description: '自定义资源',
    configFields: [
      { key: 'config', label: '配置JSON', type: 'text' },
    ],
  },
];

/**
 * 获取资源类型信息
 */
export function getResourceTypeInfo(type: ResourceType): ResourceTypeInfo | undefined {
  return resourceTypes.find(r => r.id === type);
}