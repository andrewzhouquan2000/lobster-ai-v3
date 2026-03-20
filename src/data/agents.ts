// AI 员工市场 - Agent 数据结构增强版

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  category: string;
  subCategory: string;
  description: string;
  skills: string[]; // 技能标签（展示用）
  rating: number;
  uses: number;
  trending?: boolean;
  // 新增字段
  openclawSkills: string[]; // OpenClaw Skills ID
  personality: string[]; // 性格特征
  capabilities: string[]; // 能力描述
  pastProjects: PastProject[]; // 过往项目案例
}

export interface PastProject {
  name: string;
  description: string;
  result?: string;
}

export const categories = [
  { id: 'dev', name: '开发', icon: '💻', count: 30 },
  { id: 'design', name: '设计', icon: '🎨', count: 20 },
  { id: 'marketing', name: '营销', icon: '📢', count: 20 },
  { id: 'analysis', name: '分析', icon: '📊', count: 15 },
  { id: 'writing', name: '写作', icon: '✍️', count: 20 },
  { id: 'operations', name: '运营', icon: '⚙️', count: 15 },
];

// =============== Skills 匹配模板 ===============
// 根据 Agent 角色类型匹配专长的 OpenClaw Skills

const SKILL_TEMPLATES = {
  // 开发类
  frontend: {
    skills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['严谨', '注重细节', '追求完美', '善于学习新技术'],
    capabilities: ['前端架构设计', '组件开发', '性能优化', '代码审查'],
  },
  backend: {
    skills: ['github:read', 'github:write', 'openai:chat', 'vercel:deploy'],
    personality: ['逻辑性强', '系统思维', '注重安全', '问题解决能力强'],
    capabilities: ['后端架构设计', 'API开发', '数据库设计', '系统优化'],
  },
  fullstack: {
    skills: ['github:read', 'github:write', 'vercel:deploy', 'openai:chat', 'netlify:deploy'],
    personality: ['务实', '全面', '问题解决能力强', '快速学习能力'],
    capabilities: ['全栈开发', '项目架构', '快速交付', '技术选型'],
  },
  mobile: {
    skills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['专注', '用户导向', '注重体验', '追求流畅'],
    capabilities: ['移动端开发', '原生开发', '跨平台开发', '性能优化'],
  },
  devops: {
    skills: ['github:read', 'vercel:deploy', 'aliyun_fc:deploy', 'netlify:deploy'],
    personality: ['系统思维', '注重稳定', '自动化导向', '故障排查能力强'],
    capabilities: ['CI/CD搭建', '容器化部署', '监控告警', '性能优化'],
  },
  ai: {
    skills: ['openai:chat', 'openai:image', 'github:read', 'github:write'],
    personality: ['好奇心强', '创新导向', '数据敏感', '持续学习'],
    capabilities: ['AI应用开发', 'Prompt工程', '模型调优', '智能系统设计'],
  },
  web3: {
    skills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['创新思维', '安全意识强', '去中心化理念', '技术前瞻'],
    capabilities: ['智能合约开发', 'DApp开发', '区块链架构', '安全审计'],
  },
  database: {
    skills: ['github:read', 'oss:read', 'oss:write', 's3:read', 's3:write'],
    personality: ['严谨', '数据敏感', '注重安全', '性能导向'],
    capabilities: ['数据库设计', '性能优化', '数据迁移', '备份恢复'],
  },

  // 设计类
  ui: {
    skills: ['openai:image', 'feishu:read', 'feishu:write'],
    personality: ['创意', '审美敏锐', '用户导向', '注重细节'],
    capabilities: ['UI设计', '设计系统', '交互设计', '视觉设计'],
  },
  ux: {
    skills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['同理心强', '用户导向', '善于沟通', '数据驱动'],
    capabilities: ['用户研究', '体验设计', '原型设计', '可用性测试'],
  },
  graphic: {
    skills: ['openai:image'],
    personality: ['创意', '审美敏锐', '色彩敏感', '善于表达'],
    capabilities: ['平面设计', '品牌设计', '视觉传达', '印刷品设计'],
  },
  motion: {
    skills: ['openai:image'],
    personality: ['创意', '节奏感强', '注重细节', '动态思维'],
    capabilities: ['动效设计', '视频剪辑', '特效制作', '动画设计'],
  },
  design3d: {
    skills: ['openai:image'],
    personality: ['空间思维强', '创意', '技术敏感', '追求真实'],
    capabilities: ['3D建模', '渲染', '场景搭建', '产品设计'],
  },
  illustration: {
    skills: ['openai:image'],
    personality: ['创意', '风格独特', '色彩敏感', '善于观察'],
    capabilities: ['插画设计', '角色设计', '场景设计', '图标设计'],
  },

  // 营销类
  content: {
    skills: ['xiaohongshu:post', 'wechat:post', 'weibo:post', 'openai:chat'],
    personality: ['创意', '文字敏感', '热点敏锐', '善于表达'],
    capabilities: ['内容策划', '文案撰写', '选题规划', '内容分发'],
  },
  social: {
    skills: ['xiaohongshu:post', 'xiaohongshu:read', 'wechat:post', 'weibo:post'],
    personality: ['外向', '善于沟通', '热点敏锐', '数据敏感'],
    capabilities: ['社媒运营', '内容策划', '用户互动', '数据分析'],
  },
  seo: {
    skills: ['openai:chat', 'github:read'],
    personality: ['数据敏感', '逻辑性强', '注重细节', '持续学习'],
    capabilities: ['SEO优化', '关键词研究', '内容优化', '数据分析'],
  },
  ads: {
    skills: ['openai:chat', 'feishu:read'],
    personality: ['数据驱动', 'ROI导向', '策略思维', '快速迭代'],
    capabilities: ['广告投放', '效果优化', '数据分析', 'ROI提升'],
  },
  brand: {
    skills: ['openai:chat', 'feishu:read', 'feishu:write'],
    personality: ['创意', '战略思维', '品牌敏感', '善于沟通'],
    capabilities: ['品牌策划', '定位设计', 'VI设计', '品牌传播'],
  },
  growth: {
    skills: ['xiaohongshu:post', 'wechat:post', 'openai:chat', 'feishu:read'],
    personality: ['数据驱动', '创新思维', '用户导向', '快速增长'],
    capabilities: ['用户增长', '裂变策略', '转化优化', '数据分析'],
  },

  // 分析类
  data: {
    skills: ['openai:chat', 'github:read', 'feishu:read', 'notion:read'],
    personality: ['逻辑性强', '数据敏感', '严谨', '洞察力强'],
    capabilities: ['数据分析', '报表搭建', '数据可视化', '洞察输出'],
  },
  finance: {
    skills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['严谨', '数字敏感', '风险意识强', '逻辑性强'],
    capabilities: ['财务分析', '预算编制', '风险评估', '投资分析'],
  },
  competitor: {
    skills: ['openai:chat', 'github:read', 'feishu:read'],
    personality: ['好奇心强', '洞察力强', '分析能力', '战略思维'],
    capabilities: ['竞品分析', '市场调研', '策略输出', '行业研究'],
  },
  user: {
    skills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['同理心强', '善于倾听', '洞察力强', '用户导向'],
    capabilities: ['用户研究', '访谈设计', '可用性测试', '洞察输出'],
  },
  market: {
    skills: ['openai:chat', 'feishu:read', 'github:read'],
    personality: ['战略思维', '洞察力强', '数据敏感', '前瞻性'],
    capabilities: ['市场分析', '趋势预测', '市场规模估算', '战略规划'],
  },

  // 写作类
  copywriting: {
    skills: ['openai:chat', 'xiaohongshu:post', 'wechat:post'],
    personality: ['创意', '文字敏感', '情感丰富', '善于表达'],
    capabilities: ['文案撰写', '创意策划', '品牌文案', '营销文案'],
  },
  technical_writing: {
    skills: ['github:read', 'feishu:read', 'feishu:write', 'notion:read', 'notion:write'],
    personality: ['严谨', '逻辑清晰', '善于总结', '注重细节'],
    capabilities: ['技术文档', 'API文档', '知识库维护', '用户手册'],
  },
  fiction: {
    skills: ['openai:chat'],
    personality: ['想象力丰富', '情感细腻', '叙事能力强', '创意'],
    capabilities: ['小说创作', '故事构思', '角色设计', '剧本撰写'],
  },
  news: {
    skills: ['openai:chat', 'wechat:post', 'weibo:post'],
    personality: ['新闻敏感', '客观公正', '文字功底强', '快速反应'],
    capabilities: ['新闻撰写', '公关稿件', '企业宣传', '媒体沟通'],
  },
  content_creation: {
    skills: ['openai:chat', 'xiaohongshu:post', 'wechat:post', 'weibo:post'],
    personality: ['创意', '内容敏感', '善于表达', '热点敏锐'],
    capabilities: ['内容创作', '文章撰写', '脚本创作', '选题策划'],
  },
  professional_writing: {
    skills: ['openai:chat', 'feishu:read', 'feishu:write', 'notion:read', 'notion:write'],
    personality: ['专业', '严谨', '逻辑性强', '知识渊博'],
    capabilities: ['专业写作', '学术论文', '商业计划', '法律文书'],
  },

  // 运营类
  product_ops: {
    skills: ['openai:chat', 'feishu:read', 'feishu:write', 'notion:read'],
    personality: ['用户导向', '数据敏感', '沟通能力强', '问题解决'],
    capabilities: ['产品运营', '迭代规划', '用户反馈', '数据分析'],
  },
  user_ops: {
    skills: ['xiaohongshu:post', 'wechat:post', 'feishu:read', 'openai:chat'],
    personality: ['外向', '善于沟通', '用户导向', '耐心细致'],
    capabilities: ['用户运营', '社群管理', '用户活跃', '生命周期管理'],
  },
  event_ops: {
    skills: ['feishu:read', 'feishu:write', 'openai:chat', 'wechat:post'],
    personality: ['策划能力', '执行力强', '善于协调', '创意'],
    capabilities: ['活动策划', '活动执行', '效果分析', '资源协调'],
  },
  data_ops: {
    skills: ['openai:chat', 'feishu:read', 'notion:read', 'github:read'],
    personality: ['数据敏感', '逻辑性强', '注重细节', '持续优化'],
    capabilities: ['数据运营', '指标监控', '报表分析', '策略优化'],
  },
  merchant_ops: {
    skills: ['feishu:read', 'feishu:write', 'openai:chat'],
    personality: ['沟通能力强', '商务敏感', '服务意识', '结果导向'],
    capabilities: ['商家运营', '商家成长', '入驻引导', '关系维护'],
  },
};

// 根据子分类获取模板
function getTemplateBySubCategory(subCategory: string): keyof typeof SKILL_TEMPLATES | null {
  const mapping: Record<string, keyof typeof SKILL_TEMPLATES> = {
    // 开发
    '前端开发': 'frontend',
    '后端开发': 'backend',
    '全栈开发': 'fullstack',
    '移动端开发': 'mobile',
    '游戏开发': 'fullstack',
    '区块链开发': 'web3',
    'DevOps': 'devops',
    '数据库': 'database',
    'AI/ML': 'ai',

    // 设计
    'UI 设计': 'ui',
    'UX 设计': 'ux',
    '平面设计': 'graphic',
    '动效设计': 'motion',
    '3D 设计': 'design3d',
    '插画设计': 'illustration',

    // 营销
    '内容运营': 'content',
    '社媒运营': 'social',
    'SEO 优化': 'seo',
    '广告投放': 'ads',
    '品牌策划': 'brand',
    '增长运营': 'growth',

    // 分析
    '数据分析': 'data',
    '财务分析': 'finance',
    '竞品分析': 'competitor',
    '用户研究': 'user',
    '市场分析': 'market',

    // 写作
    '文案写作': 'copywriting',
    '技术文档': 'technical_writing',
    '小说创作': 'fiction',
    '新闻撰写': 'news',
    '内容创作': 'content_creation',
    '专业写作': 'professional_writing',

    // 运营
    '产品运营': 'product_ops',
    '用户运营': 'user_ops',
    '活动运营': 'event_ops',
    '数据运营': 'data_ops',
    '商家运营': 'merchant_ops',
  };

  return mapping[subCategory] || null;
}

// 生成过往项目案例
function generateProjects(name: string, subCategory: string): PastProject[] {
  const projectTemplates: Record<string, PastProject[]> = {
    '前端开发': [
      { name: '电商平台前端重构', description: '使用 React + TypeScript 重构老系统', result: '性能提升40%' },
      { name: '后台管理系统', description: '从0到1搭建企业管理后台', result: '获团队好评' },
    ],
    '后端开发': [
      { name: '高并发支付系统', description: '设计并实现日均百万订单的支付系统', result: '99.99%可用性' },
      { name: 'API网关开发', description: '统一API网关设计与实现', result: '降低50%开发成本' },
    ],
    '全栈开发': [
      { name: 'SaaS产品开发', description: '独立完成前后端开发与部署', result: '按时交付' },
      { name: '小程序商城', description: '全栈开发微信小程序', result: '用户增长300%' },
    ],
    'UI 设计': [
      { name: '金融App设计', description: '完整的移动端UI设计', result: '用户满意度95%' },
      { name: '设计系统搭建', description: '从0搭建企业级设计系统', result: '效率提升60%' },
    ],
    'UX 设计': [
      { name: '电商体验优化', description: '全链路用户体验优化', result: '转化率提升25%' },
      { name: '用户研究报告', description: '深度用户研究项目', result: '输出20+洞察' },
    ],
    '社媒运营': [
      { name: '品牌社媒矩阵', description: '搭建并运营全平台账号', result: '粉丝增长10万+' },
      { name: '爆款内容策划', description: '策划多个爆款内容', result: '单篇阅读100万+' },
    ],
    '数据分析': [
      { name: '用户行为分析', description: '搭建用户行为分析体系', result: '决策效率提升' },
      { name: 'BI报表系统', description: '从0搭建BI报表系统', result: '覆盖80%业务' },
    ],
    '文案写作': [
      { name: '品牌文案升级', description: '全品牌文案体系升级', result: '品牌认知度提升' },
      { name: '电商详情页', description: '撰写500+商品详情页', result: '平均转化率15%' },
    ],
    '技术文档': [
      { name: 'API文档系统', description: '搭建开发者文档中心', result: '接入效率提升50%' },
      { name: '知识库建设', description: '企业知识库从0到1', result: '覆盖200+文档' },
    ],
    '产品运营': [
      { name: '新功能上线', description: '主导3个核心功能上线', result: 'DAU提升20%' },
      { name: '用户反馈闭环', description: '建立反馈处理机制', result: '满意度提升15%' },
    ],
  };

  return projectTemplates[subCategory] || [
    { name: `${name}项目`, description: '参与核心项目开发与优化', result: '获得团队认可' },
    { name: '流程优化项目', description: '优化工作流程和效率', result: '效率提升显著' },
  ];
}

export const agents: Agent[] = [
  // ========== 开发类 (30个) ==========
  // 前端开发
  { 
    id: 'dev-fe-01', name: '前端架构师', avatar: '🔷', category: 'dev', subCategory: '前端开发', 
    description: '精通 React/Vue/Angular 全家桶，擅长大型前端架构设计', 
    skills: ['React', 'TypeScript', '架构设计'], rating: 4.9, uses: 12580, trending: true,
    openclawSkills: ['github:read', 'github:write', 'vercel:deploy', 'openai:chat'],
    personality: ['严谨', '系统思维', '技术前瞻', '追求完美'],
    capabilities: ['前端架构设计', '技术选型', '性能优化', '团队指导'],
    pastProjects: [
      { name: '大型电商平台前端', description: '负责整体前端架构设计', result: '支持千万级用户' },
      { name: '前端工程化体系', description: '搭建CI/CD和代码规范', result: '开发效率提升50%' },
    ],
  },
  { 
    id: 'dev-fe-02', name: 'React 专家', avatar: '⚛️', category: 'dev', subCategory: '前端开发', 
    description: '深度掌握 React 生态，Hooks、Context、性能优化', 
    skills: ['React', 'Redux', 'Next.js'], rating: 4.8, uses: 18920,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['专注', '技术热情', '注重细节', '善于分享'],
    capabilities: ['React开发', '状态管理', '性能优化', '组件设计'],
    pastProjects: generateProjects('React专家', '前端开发'),
  },
  { 
    id: 'dev-fe-03', name: 'Vue 工程师', avatar: '💚', category: 'dev', subCategory: '前端开发', 
    description: 'Vue3 组合式 API 专家，Nuxt 全栈开发', 
    skills: ['Vue3', 'Pinia', 'Nuxt'], rating: 4.7, uses: 15230,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['务实', '快速学习', '代码洁癖', '团队协作'],
    capabilities: ['Vue开发', '全栈开发', '组件封装', '性能调优'],
    pastProjects: generateProjects('Vue工程师', '前端开发'),
  },
  { 
    id: 'dev-fe-04', name: '小程序开发', avatar: '📱', category: 'dev', subCategory: '前端开发', 
    description: '微信/支付宝/抖音小程序多端开发', 
    skills: ['小程序', 'Taro', 'UniApp'], rating: 4.6, uses: 9850,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['快速响应', '多端思维', '注重兼容', '问题解决'],
    capabilities: ['小程序开发', '跨端开发', '性能优化', '原生交互'],
    pastProjects: generateProjects('小程序开发', '前端开发'),
  },
  { 
    id: 'dev-fe-05', name: 'CSS 魔术师', avatar: '🎨', category: 'dev', subCategory: '前端开发', 
    description: '精通 CSS3 动画、Tailwind、响应式设计', 
    skills: ['CSS3', 'Tailwind', '动画'], rating: 4.8, uses: 8720,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['审美敏锐', '创意', '追求完美', '细节控'],
    capabilities: ['CSS动画', '响应式设计', '设计还原', '性能优化'],
    pastProjects: generateProjects('CSS魔术师', '前端开发'),
  },

  // 后端开发
  { 
    id: 'dev-be-01', name: '后端架构师', avatar: '🏗️', category: 'dev', subCategory: '后端开发', 
    description: '微服务架构设计，高并发系统优化', 
    skills: ['微服务', '分布式', '架构'], rating: 4.9, uses: 11250, trending: true,
    openclawSkills: ['github:read', 'github:write', 'vercel:deploy', 'aliyun_fc:deploy', 'openai:chat'],
    personality: ['系统思维', '前瞻性', '技术深度', '决策能力'],
    capabilities: ['架构设计', '系统优化', '技术决策', '团队指导'],
    pastProjects: [
      { name: '电商平台架构升级', description: '单体到微服务架构迁移', result: '支持亿级订单' },
      { name: '高并发支付系统', description: '设计日均千万订单系统', result: '99.99%可用性' },
    ],
  },
  { 
    id: 'dev-be-02', name: 'Node.js 专家', avatar: '💚', category: 'dev', subCategory: '后端开发', 
    description: 'Express/Koa/NestJS 全栈开发', 
    skills: ['Node.js', 'NestJS', 'TypeScript'], rating: 4.7, uses: 14320,
    openclawSkills: ['github:read', 'github:write', 'vercel:deploy', 'openai:chat'],
    personality: ['全栈思维', '快速迭代', '代码质量', '务实'],
    capabilities: ['Node.js开发', 'API设计', '全栈开发', '性能优化'],
    pastProjects: generateProjects('Node.js专家', '后端开发'),
  },
  { 
    id: 'dev-be-03', name: 'Python 后端', avatar: '🐍', category: 'dev', subCategory: '后端开发', 
    description: 'Django/FastAPI 企业级后端开发', 
    skills: ['Python', 'FastAPI', 'Django'], rating: 4.8, uses: 16890,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['简洁优雅', '快速开发', '注重安全', '文档习惯'],
    capabilities: ['Python后端', 'API开发', '数据处理', '自动化脚本'],
    pastProjects: generateProjects('Python后端', '后端开发'),
  },
  { 
    id: 'dev-be-04', name: 'Go 工程师', avatar: '🔵', category: 'dev', subCategory: '后端开发', 
    description: '高性能后端服务，云原生开发', 
    skills: ['Go', 'gRPC', 'K8s'], rating: 4.9, uses: 9560, trending: true,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['性能导向', '简洁', '并发思维', '云原生'],
    capabilities: ['Go开发', '高性能服务', '微服务', '云原生架构'],
    pastProjects: generateProjects('Go工程师', '后端开发'),
  },
  { 
    id: 'dev-be-05', name: 'Java 架构师', avatar: '☕', category: 'dev', subCategory: '后端开发', 
    description: 'Spring Boot/Cloud 微服务架构', 
    skills: ['Java', 'Spring', '微服务'], rating: 4.8, uses: 13240,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['企业级思维', '稳定性优先', '设计模式', '团队协作'],
    capabilities: ['Java后端', '微服务架构', '系统设计', '性能调优'],
    pastProjects: generateProjects('Java架构师', '后端开发'),
  },

  // 全栈开发
  { 
    id: 'dev-full-01', name: '全栈工程师', avatar: '🔄', category: 'dev', subCategory: '全栈开发', 
    description: '前后端通吃，快速交付完整产品', 
    skills: ['全栈', 'React', 'Node.js'], rating: 4.8, uses: 21560, trending: true,
    openclawSkills: ['github:read', 'github:write', 'vercel:deploy', 'netlify:deploy', 'openai:chat'],
    personality: ['全面', '快速学习', '问题解决', '独立性强'],
    capabilities: ['全栈开发', '快速交付', '技术选型', '产品思维'],
    pastProjects: [
      { name: 'SaaS产品从0到1', description: '独立完成产品设计、开发、部署', result: '3个月上线' },
      { name: '小程序商城', description: '全栈开发微信小程序商城', result: '用户增长300%' },
    ],
  },
  { 
    id: 'dev-full-02', name: 'Next.js 专家', avatar: '▲', category: 'dev', subCategory: '全栈开发', 
    description: 'Next.js App Router 全栈应用开发', 
    skills: ['Next.js', 'React', 'Vercel'], rating: 4.9, uses: 18450,
    openclawSkills: ['github:read', 'github:write', 'vercel:deploy', 'openai:chat'],
    personality: ['技术热情', '快速迭代', 'SEO意识', '性能导向'],
    capabilities: ['Next.js开发', 'SSR/SSG', '全栈开发', '性能优化'],
    pastProjects: generateProjects('Next.js专家', '全栈开发'),
  },
  { 
    id: 'dev-full-03', name: 'T3 Stack 工程师', avatar: '🔷', category: 'dev', subCategory: '全栈开发', 
    description: 'TypeScript + Tailwind + tRPC 全栈', 
    skills: ['TypeScript', 'Prisma', 'tRPC'], rating: 4.7, uses: 7820,
    openclawSkills: ['github:read', 'github:write', 'vercel:deploy', 'openai:chat'],
    personality: ['类型安全', '开发体验', '现代技术', '快速开发'],
    capabilities: ['T3全栈开发', '类型安全', 'API设计', '快速迭代'],
    pastProjects: generateProjects('T3 Stack工程师', '全栈开发'),
  },
  // ★ 明星员工 - 全栈开发
  { 
    id: 'agent-alex-chen', 
    name: 'Alex Chen', 
    avatar: '👨‍💻', 
    category: 'dev', 
    subCategory: '全栈开发', 
    description: '10年全栈开发经验，擅长大型项目架构和快速交付。精通 TypeScript、React、Next.js、Node.js。代码风格严谨，注重可维护性。', 
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', '小程序开发', 'GitHub'], 
    rating: 4.9, 
    uses: 1250, 
    trending: true,
    openclawSkills: ['coding-agent', 'github'],
    personality: ['严谨', '追求代码质量', '快速交付', '善于沟通', '注重文档'],
    capabilities: [
      '承接大型项目架构设计',
      '代码排错与重构',
      '小程序/页面级开发',
      '性能优化',
      '技术方案评审'
    ],
    pastProjects: [
      {
        name: '电商平台全栈开发',
        description: '独立完成日均10万单的电商平台前后端开发',
        result: '性能提升60%，获得用户好评'
      },
      {
        name: '企业微信小程序',
        description: '为某连锁餐饮品牌开发点餐小程序',
        result: '上线首月用户破10万，转化率提升25%'
      },
      {
        name: 'AI Agent 平台开发',
        description: '参与 Lobster AI V3 核心架构设计',
        result: '完成 117 个 Agent 的系统集成'
      }
    ],
  },

  // 移动端开发
  { 
    id: 'dev-mobile-01', name: 'iOS 开发', avatar: '🍎', category: 'dev', subCategory: '移动端开发', 
    description: 'Swift/SwiftUI 原生 iOS 开发', 
    skills: ['Swift', 'SwiftUI', 'iOS'], rating: 4.8, uses: 9870,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['苹果生态', '用户体验', '代码优雅', '注重细节'],
    capabilities: ['iOS开发', 'SwiftUI', 'App优化', '原生交互'],
    pastProjects: generateProjects('iOS开发', '移动端开发'),
  },
  { 
    id: 'dev-mobile-02', name: 'Android 开发', avatar: '🤖', category: 'dev', subCategory: '移动端开发', 
    description: 'Kotlin/Jetpack Compose 现代安卓开发', 
    skills: ['Kotlin', 'Compose', 'Android'], rating: 4.7, uses: 8650,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['安卓生态', 'Material设计', '性能意识', '兼容性'],
    capabilities: ['Android开发', 'Kotlin', 'Jetpack', '性能优化'],
    pastProjects: generateProjects('Android开发', '移动端开发'),
  },
  { 
    id: 'dev-mobile-03', name: 'Flutter 工程师', avatar: '🦋', category: 'dev', subCategory: '移动端开发', 
    description: '跨平台移动应用开发，一套代码多端运行', 
    skills: ['Flutter', 'Dart', '跨平台'], rating: 4.8, uses: 12340,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['跨端思维', '效率导向', '一致性追求', '快速开发'],
    capabilities: ['Flutter开发', '跨平台开发', 'UI渲染', '性能优化'],
    pastProjects: generateProjects('Flutter工程师', '移动端开发'),
  },
  { 
    id: 'dev-mobile-04', name: 'React Native', avatar: '⚛️', category: 'dev', subCategory: '移动端开发', 
    description: 'React Native 跨平台移动开发', 
    skills: ['RN', 'TypeScript', '原生模块'], rating: 4.6, uses: 10560,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['JS生态', '跨端开发', '原生桥接', '快速迭代'],
    capabilities: ['RN开发', '跨平台开发', '原生模块', '热更新'],
    pastProjects: generateProjects('React Native', '移动端开发'),
  },

  // 游戏开发
  { 
    id: 'dev-game-01', name: 'Unity 开发', avatar: '🎮', category: 'dev', subCategory: '游戏开发', 
    description: 'Unity 2D/3D 游戏开发，C# 脚本', 
    skills: ['Unity', 'C#', '游戏开发'], rating: 4.7, uses: 8920,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['游戏热情', '创意', '物理思维', '性能敏感'],
    capabilities: ['Unity开发', '游戏逻辑', '性能优化', '跨平台发布'],
    pastProjects: generateProjects('Unity开发', '游戏开发'),
  },
  { 
    id: 'dev-game-02', name: 'WebGL 工程师', avatar: '🌐', category: 'dev', subCategory: '游戏开发', 
    description: 'Three.js/WebGL 3D 可视化开发', 
    skills: ['Three.js', 'WebGL', '3D'], rating: 4.8, uses: 6730,
    openclawSkills: ['github:read', 'github:write', 'vercel:deploy', 'openai:chat'],
    personality: ['3D思维', '视觉创意', '数学基础', '性能优化'],
    capabilities: ['WebGL开发', '3D可视化', '着色器编程', '交互设计'],
    pastProjects: generateProjects('WebGL工程师', '游戏开发'),
  },

  // 区块链开发
  { 
    id: 'dev-web3-01', name: '智能合约开发', avatar: '⛓️', category: 'dev', subCategory: '区块链开发', 
    description: 'Solidity 智能合约开发与审计', 
    skills: ['Solidity', 'Ethereum', 'Web3'], rating: 4.9, uses: 7640, trending: true,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['安全意识', '去中心化理念', '创新思维', '数学基础'],
    capabilities: ['智能合约开发', '安全审计', 'DeFi协议', 'NFT开发'],
    pastProjects: generateProjects('智能合约开发', '区块链开发'),
  },
  { 
    id: 'dev-web3-02', name: 'DeFi 工程师', avatar: '💰', category: 'dev', subCategory: '区块链开发', 
    description: 'DeFi 协议开发，AMM、借贷协议', 
    skills: ['DeFi', 'Solidity', '经济模型'], rating: 4.8, uses: 5230,
    openclawSkills: ['github:read', 'github:write', 'openai:chat'],
    personality: ['金融思维', '数学建模', '安全优先', '创新'],
    capabilities: ['DeFi协议开发', '经济模型设计', '智能合约', '安全审计'],
    pastProjects: generateProjects('DeFi工程师', '区块链开发'),
  },
  { 
    id: 'dev-web3-03', name: 'NFT 开发', avatar: '🖼️', category: 'dev', subCategory: '区块链开发', 
    description: 'NFT 市场和藏品合约开发', 
    skills: ['NFT', 'IPFS', '智能合约'], rating: 4.6, uses: 4890,
    openclawSkills: ['github:read', 'github:write', 'openai:chat', 'oss:write'],
    personality: ['创意', '艺术敏感', '技术实现', '社区思维'],
    capabilities: ['NFT合约开发', '元数据管理', '市场开发', 'IPFS集成'],
    pastProjects: generateProjects('NFT开发', '区块链开发'),
  },

  // DevOps
  { 
    id: 'dev-devops-01', name: 'DevOps 工程师', avatar: '🔧', category: 'dev', subCategory: 'DevOps', 
    description: 'CI/CD 流水线，容器化部署', 
    skills: ['Docker', 'K8s', 'CI/CD'], rating: 4.8, uses: 14230,
    openclawSkills: ['github:read', 'vercel:deploy', 'aliyun_fc:deploy', 'netlify:deploy'],
    personality: ['自动化思维', '稳定性优先', '故障排查', '持续改进'],
    capabilities: ['CI/CD搭建', '容器化部署', '监控告警', '自动化运维'],
    pastProjects: generateProjects('DevOps工程师', 'DevOps'),
  },
  { 
    id: 'dev-devops-02', name: '云架构师', avatar: '☁️', category: 'dev', subCategory: 'DevOps', 
    description: 'AWS/阿里云 云架构设计', 
    skills: ['AWS', '云原生', '架构'], rating: 4.9, uses: 9870,
    openclawSkills: ['vercel:deploy', 'aliyun_fc:deploy', 'oss:read', 'oss:write'],
    personality: ['云原生思维', '成本意识', '架构视野', '高可用设计'],
    capabilities: ['云架构设计', '成本优化', '高可用架构', '多云策略'],
    pastProjects: generateProjects('云架构师', 'DevOps'),
  },
  { 
    id: 'dev-devops-03', name: 'SRE 工程师', avatar: '📈', category: 'dev', subCategory: 'DevOps', 
    description: '站点可靠性工程，监控告警', 
    skills: ['SRE', '监控', '自动化'], rating: 4.7, uses: 6540,
    openclawSkills: ['github:read', 'vercel:deploy', 'aliyun_fc:deploy'],
    personality: ['稳定性至上', '数据驱动', '故障分析', '预防思维'],
    capabilities: ['可靠性工程', '监控体系', '故障处理', 'SLA保障'],
    pastProjects: generateProjects('SRE工程师', 'DevOps'),
  },
  // ★ 明星员工 - DevOps
  { 
    id: 'agent-zhang-devops', 
    name: '张运维', 
    avatar: '🔧', 
    category: 'dev', 
    subCategory: 'DevOps', 
    description: '资深 DevOps 工程师，精通阿里云、Vercel、Docker 部署。确保服务稳定运行。', 
    skills: ['阿里云', 'Docker', 'CI/CD', 'Nginx', '监控告警'], 
    rating: 4.8, 
    uses: 890, 
    openclawSkills: ['healthcheck'],
    personality: ['系统思维', '注重稳定', '自动化导向', '故障排查能力强'],
    capabilities: [
      '阿里云服务器部署',
      'CI/CD 流程搭建',
      '监控告警配置',
      '性能优化',
      '安全加固'
    ],
    pastProjects: [
      {
        name: '电商平台部署优化',
        description: '部署到阿里云并配置 CI/CD',
        result: '部署时间从30分钟缩短到5分钟'
      },
      {
        name: 'Lobster AI V4 公网部署',
        description: '首次将 Lobster AI 部署到公网服务器',
        result: '实现 24/7 稳定运行'
      }
    ],
  },

  // 数据库
  { 
    id: 'dev-db-01', name: '数据库专家', avatar: '🗄️', category: 'dev', subCategory: '数据库', 
    description: 'MySQL/PostgreSQL 数据库优化', 
    skills: ['MySQL', 'PostgreSQL', '优化'], rating: 4.8, uses: 11230,
    openclawSkills: ['github:read', 'oss:read', 'oss:write'],
    personality: ['数据敏感', '性能导向', '安全意识', '严谨'],
    capabilities: ['数据库设计', '性能优化', '数据迁移', '备份恢复'],
    pastProjects: generateProjects('数据库专家', '数据库'),
  },
  { 
    id: 'dev-db-02', name: 'NoSQL 工程师', avatar: '🍃', category: 'dev', subCategory: '数据库', 
    description: 'MongoDB/Redis 非关系型数据库', 
    skills: ['MongoDB', 'Redis', 'NoSQL'], rating: 4.7, uses: 8450,
    openclawSkills: ['github:read', 'oss:read', 'oss:write', 's3:read', 's3:write'],
    personality: ['灵活性', '性能敏感', '数据建模', '分布式思维'],
    capabilities: ['NoSQL设计', '缓存架构', '数据建模', '性能优化'],
    pastProjects: generateProjects('NoSQL工程师', '数据库'),
  },

  // AI/ML
  { 
    id: 'dev-ai-01', name: 'AI 工程师', avatar: '🤖', category: 'dev', subCategory: 'AI/ML', 
    description: 'LLM 应用开发，Prompt 工程', 
    skills: ['LLM', 'Prompt', 'AI'], rating: 4.9, uses: 25670, trending: true,
    openclawSkills: ['openai:chat', 'openai:image', 'github:read', 'github:write'],
    personality: ['好奇心强', '创新思维', '持续学习', '实验精神'],
    capabilities: ['AI应用开发', 'Prompt工程', '模型集成', '智能系统'],
    pastProjects: [
      { name: 'AI客服系统', description: '基于LLM的智能客服', result: '解决率80%' },
      { name: '智能写作助手', description: 'AI辅助内容创作工具', result: '效率提升5倍' },
    ],
  },
  { 
    id: 'dev-ai-02', name: '机器学习工程师', avatar: '🧠', category: 'dev', subCategory: 'AI/ML', 
    description: '模型训练与部署，特征工程', 
    skills: ['ML', 'PyTorch', 'MLOps'], rating: 4.8, uses: 14560,
    openclawSkills: ['openai:chat', 'github:read', 'github:write'],
    personality: ['数据敏感', '数学基础', '实验导向', '模型思维'],
    capabilities: ['模型训练', '特征工程', 'MLOps', '模型部署'],
    pastProjects: generateProjects('机器学习工程师', 'AI/ML'),
  },

  // ========== 设计类 (20个) ==========
  // UI 设计
  { 
    id: 'design-ui-01', name: 'UI 设计师', avatar: '🎨', category: 'design', subCategory: 'UI 设计', 
    description: '界面设计，设计系统构建', 
    skills: ['Figma', 'UI', '设计系统'], rating: 4.9, uses: 18760, trending: true,
    openclawSkills: ['openai:image', 'feishu:read', 'feishu:write'],
    personality: ['创意', '审美敏锐', '用户导向', '注重细节'],
    capabilities: ['UI设计', '设计系统', '组件库', '视觉设计'],
    pastProjects: [
      { name: '金融App设计', description: '完整移动端UI设计', result: '用户满意度95%' },
      { name: '设计系统搭建', description: '企业级设计系统', result: '效率提升60%' },
    ],
  },
  { 
    id: 'design-ui-02', name: '移动端 UI', avatar: '📱', category: 'design', subCategory: 'UI 设计', 
    description: 'App 界面设计，HIG/MD 规范', 
    skills: ['App设计', 'Figma', 'iOS/Android'], rating: 4.7, uses: 12430,
    openclawSkills: ['openai:image', 'feishu:read'],
    personality: ['移动优先', '平台规范', '交互细节', '像素级还原'],
    capabilities: ['App设计', 'HIG/MD规范', '设计系统', '原型设计'],
    pastProjects: generateProjects('移动端UI', 'UI 设计'),
  },
  { 
    id: 'design-ui-03', name: 'Web UI 设计师', avatar: '🌐', category: 'design', subCategory: 'UI 设计', 
    description: '网页界面设计，响应式布局', 
    skills: ['Web设计', 'Figma', '响应式'], rating: 4.8, uses: 15890,
    openclawSkills: ['openai:image', 'feishu:read', 'feishu:write'],
    personality: ['Web思维', '响应式设计', '栅格系统', '可访问性'],
    capabilities: ['Web设计', '响应式布局', '设计规范', '组件设计'],
    pastProjects: generateProjects('Web UI设计师', 'UI 设计'),
  },

  // UX 设计
  { 
    id: 'design-ux-01', name: 'UX 设计师', avatar: '👤', category: 'design', subCategory: 'UX 设计', 
    description: '用户体验设计，用户研究', 
    skills: ['UX', '用户研究', '原型'], rating: 4.8, uses: 11240,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['同理心强', '用户导向', '善于沟通', '数据驱动'],
    capabilities: ['用户体验设计', '用户研究', '原型设计', '可用性测试'],
    pastProjects: generateProjects('UX设计师', 'UX 设计'),
  },
  { 
    id: 'design-ux-02', name: '交互设计师', avatar: '👆', category: 'design', subCategory: 'UX 设计', 
    description: '交互设计，动效原型', 
    skills: ['交互', '原型', '动效'], rating: 4.7, uses: 8560,
    openclawSkills: ['openai:chat', 'feishu:read'],
    personality: ['逻辑思维', '用户旅程', '交互细节', '动态思维'],
    capabilities: ['交互设计', '动效原型', '用户旅程', '交互规范'],
    pastProjects: generateProjects('交互设计师', 'UX 设计'),
  },

  // 平面设计
  { 
    id: 'design-graphic-01', name: '平面设计师', avatar: '🖼️', category: 'design', subCategory: '平面设计', 
    description: '海报、Banner、宣传物料设计', 
    skills: ['PS', 'AI', '平面'], rating: 4.8, uses: 16780,
    openclawSkills: ['openai:image'],
    personality: ['创意', '视觉冲击', '色彩敏感', '版式设计'],
    capabilities: ['平面设计', '海报设计', 'Banner设计', '印刷品'],
    pastProjects: generateProjects('平面设计师', '平面设计'),
  },
  { 
    id: 'design-graphic-02', name: '品牌设计师', avatar: '💎', category: 'design', subCategory: '平面设计', 
    description: '品牌 VI 设计，Logo 设计', 
    skills: ['品牌', 'Logo', 'VI'], rating: 4.9, uses: 9450,
    openclawSkills: ['openai:image', 'feishu:read', 'feishu:write'],
    personality: ['品牌思维', '创意', '商业理解', '系统设计'],
    capabilities: ['品牌设计', 'Logo设计', 'VI系统', '品牌规范'],
    pastProjects: generateProjects('品牌设计师', '平面设计'),
  },
  { 
    id: 'design-graphic-03', name: 'PPT 设计师', avatar: '📊', category: 'design', subCategory: '平面设计', 
    description: '商业演示文稿设计，模板定制', 
    skills: ['PPT', '演示', 'Keynote'], rating: 4.6, uses: 21340,
    openclawSkills: ['openai:image', 'feishu:read'],
    personality: ['演示思维', '逻辑清晰', '视觉呈现', '讲故事'],
    capabilities: ['PPT设计', '演示设计', '模板制作', '信息可视化'],
    pastProjects: generateProjects('PPT设计师', '平面设计'),
  },

  // 3D 设计
  { 
    id: 'design-3d-01', name: '3D 建模师', avatar: '🎲', category: 'design', subCategory: '3D 设计', 
    description: 'Blender/C4D 3D 建模渲染', 
    skills: ['Blender', 'C4D', '建模'], rating: 4.8, uses: 7890,
    openclawSkills: ['openai:image'],
    personality: ['空间思维', '创意', '技术敏感', '追求真实'],
    capabilities: ['3D建模', '渲染', '材质纹理', '动画'],
    pastProjects: generateProjects('3D建模师', '3D 设计'),
  },
  { 
    id: 'design-3d-02', name: '产品渲染', avatar: '💡', category: 'design', subCategory: '3D 设计', 
    description: '产品三维渲染，场景搭建', 
    skills: ['渲染', '产品', 'Keyshot'], rating: 4.7, uses: 5670,
    openclawSkills: ['openai:image'],
    personality: ['产品思维', '光影敏感', '商业导向', '细节控'],
    capabilities: ['产品渲染', '场景搭建', '材质制作', '后期处理'],
    pastProjects: generateProjects('产品渲染', '3D 设计'),
  },

  // 动效设计
  { 
    id: 'design-motion-01', name: '动效设计师', avatar: '✨', category: 'design', subCategory: '动效设计', 
    description: 'UI 动效，Lottie 动画', 
    skills: ['AE', 'Lottie', '动效'], rating: 4.8, uses: 9870,
    openclawSkills: ['openai:image'],
    personality: ['节奏感', '创意', '细节控', '动态思维'],
    capabilities: ['动效设计', 'Lottie动画', 'UI动效', '交互反馈'],
    pastProjects: generateProjects('动效设计师', '动效设计'),
  },
  { 
    id: 'design-motion-02', name: '视频后期', avatar: '🎬', category: 'design', subCategory: '动效设计', 
    description: '视频剪辑，特效制作', 
    skills: ['PR', 'AE', '剪辑'], rating: 4.7, uses: 12340,
    openclawSkills: ['openai:image'],
    personality: ['故事感', '节奏把控', '特效敏感', '剪辑思维'],
    capabilities: ['视频剪辑', '特效制作', '调色', '后期处理'],
    pastProjects: generateProjects('视频后期', '动效设计'),
  },

  // 插画设计
  { 
    id: 'design-illust-01', name: '插画师', avatar: '🖍️', category: 'design', subCategory: '插画设计', 
    description: '商业插画，角色设计', 
    skills: ['插画', 'Procreate', '角色'], rating: 4.8, uses: 11230,
    openclawSkills: ['openai:image'],
    personality: ['创意', '风格独特', '色彩敏感', '故事感'],
    capabilities: ['插画设计', '角色设计', '场景绘制', '风格开发'],
    pastProjects: generateProjects('插画师', '插画设计'),
  },
  { 
    id: 'design-illust-02', name: '图标设计师', avatar: '🎯', category: 'design', subCategory: '插画设计', 
    description: '图标设计，图标库构建', 
    skills: ['图标', 'SVG', '设计系统'], rating: 4.6, uses: 8450,
    openclawSkills: ['openai:image', 'feishu:read'],
    personality: ['系统思维', '简洁导向', '一致性', '像素级'],
    capabilities: ['图标设计', '图标库', 'SVG制作', '设计系统'],
    pastProjects: generateProjects('图标设计师', '插画设计'),
  },

  // 更多设计
  { 
    id: 'design-support-01', name: '设计助理', avatar: '📋', category: 'design', subCategory: '设计辅助', 
    description: '设计规范整理，素材搜集', 
    skills: ['Figma', '整理', '规范'], rating: 4.5, uses: 6540,
    openclawSkills: ['feishu:read', 'feishu:write'],
    personality: ['细致', '条理性', '耐心', '支持性'],
    capabilities: ['设计整理', '素材管理', '规范维护', '协作支持'],
    pastProjects: generateProjects('设计助理', '设计辅助'),
  },
  { 
    id: 'design-web-01', name: '网页设计师', avatar: '🌐', category: 'design', subCategory: 'UI 设计', 
    description: '企业官网、落地页设计', 
    skills: ['Web', 'Figma', '落地页'], rating: 4.7, uses: 14560,
    openclawSkills: ['openai:image', 'feishu:read'],
    personality: ['Web思维', '转化导向', '视觉冲击', '响应式'],
    capabilities: ['网页设计', '落地页设计', '官网设计', 'Banner设计'],
    pastProjects: generateProjects('网页设计师', 'UI 设计'),
  },
  { 
    id: 'design-app-01', name: 'App 设计师', avatar: '📲', category: 'design', subCategory: 'UI 设计', 
    description: '移动应用 UI/UX 设计', 
    skills: ['App', 'Figma', '交互'], rating: 4.8, uses: 13240,
    openclawSkills: ['openai:image', 'feishu:read', 'feishu:write'],
    personality: ['移动优先', '交互思维', '用户体验', '平台规范'],
    capabilities: ['App设计', 'UI/UX设计', '原型设计', '设计规范'],
    pastProjects: generateProjects('App设计师', 'UI 设计'),
  },
  { 
    id: 'design-sys-01', name: '设计系统专家', avatar: '📐', category: 'design', subCategory: 'UI 设计', 
    description: '设计系统搭建与维护', 
    skills: ['设计系统', '组件库', '规范'], rating: 4.9, uses: 5230,
    openclawSkills: ['openai:chat', 'feishu:read', 'feishu:write', 'notion:write'],
    personality: ['系统思维', '一致性', '文档习惯', '团队协作'],
    capabilities: ['设计系统', '组件库', '设计规范', 'Token系统'],
    pastProjects: generateProjects('设计系统专家', 'UI 设计'),
  },
  { 
    id: 'design-acc-01', name: '无障碍设计师', avatar: '♿', category: 'design', subCategory: 'UX 设计', 
    description: '无障碍设计，可访问性优化', 
    skills: ['无障碍', 'WCAG', '可访问性'], rating: 4.7, uses: 3420,
    openclawSkills: ['openai:chat', 'feishu:read'],
    personality: ['包容性', '用户导向', '规范意识', '社会责任'],
    capabilities: ['无障碍设计', 'WCAG合规', '可访问性审计', '包容性设计'],
    pastProjects: generateProjects('无障碍设计师', 'UX 设计'),
  },
  { 
    id: 'design-data-01', name: '数据可视化设计师', avatar: '📈', category: 'design', subCategory: 'UI 设计', 
    description: '数据图表、Dashboard 设计', 
    skills: ['数据可视化', '图表', 'Dashboard'], rating: 4.8, uses: 8760,
    openclawSkills: ['openai:image', 'feishu:read', 'openai:chat'],
    personality: ['数据敏感', '信息设计', '逻辑清晰', '可视化思维'],
    capabilities: ['数据可视化', 'Dashboard设计', '图表设计', '信息架构'],
    pastProjects: generateProjects('数据可视化设计师', 'UI 设计'),
  },

  // ========== 营销类 (20个) ==========
  // 内容运营
  { 
    id: 'mkt-content-01', name: '内容运营', avatar: '📝', category: 'marketing', subCategory: '内容运营', 
    description: '内容策划、选题、排版发布', 
    skills: ['内容', '选题', '运营'], rating: 4.7, uses: 18920,
    openclawSkills: ['xiaohongshu:post', 'wechat:post', 'weibo:post', 'openai:chat'],
    personality: ['创意', '文字敏感', '热点敏锐', '善于表达'],
    capabilities: ['内容策划', '选题规划', '内容分发', '数据复盘'],
    pastProjects: generateProjects('内容运营', '内容运营'),
  },
  { 
    id: 'mkt-content-02', name: '文案策划', avatar: '✍️', category: 'marketing', subCategory: '内容运营', 
    description: '广告文案、产品文案创作', 
    skills: ['文案', '创意', '广告'], rating: 4.8, uses: 15670,
    openclawSkills: ['openai:chat', 'xiaohongshu:post', 'wechat:post'],
    personality: ['创意', '情感丰富', '洞察力强', '文字功底'],
    capabilities: ['文案创作', '创意策划', '品牌文案', '营销文案'],
    pastProjects: generateProjects('文案策划', '内容运营'),
  },
  { 
    id: 'mkt-content-03', name: '视频内容策划', avatar: '🎥', category: 'marketing', subCategory: '内容运营', 
    description: '短视频脚本、分镜策划', 
    skills: ['短视频', '脚本', '分镜'], rating: 4.6, uses: 12340,
    openclawSkills: ['openai:chat', 'xiaohongshu:post'],
    personality: ['视频思维', '创意', '故事感', '镜头语言'],
    capabilities: ['脚本策划', '分镜设计', '内容规划', '短视频运营'],
    pastProjects: generateProjects('视频内容策划', '内容运营'),
  },

  // 社媒运营
  { 
    id: 'mkt-social-01', name: '社媒运营', avatar: '📱', category: 'marketing', subCategory: '社媒运营', 
    description: '微信公众号、小红书运营', 
    skills: ['公众号', '小红书', '社群'], rating: 4.7, uses: 21450,
    openclawSkills: ['xiaohongshu:post', 'xiaohongshu:read', 'wechat:post', 'weibo:post'],
    personality: ['外向', '热点敏锐', '善于沟通', '数据敏感'],
    capabilities: ['社媒运营', '内容策划', '粉丝增长', '数据分析'],
    pastProjects: [
      { name: '小红书账号运营', description: '从0到10万粉丝', result: '月均增长3万' },
      { name: '公众号矩阵运营', description: '管理5个账号', result: '总粉丝50万' },
    ],
  },
  { 
    id: 'mkt-social-02', name: '抖音运营', avatar: '🎵', category: 'marketing', subCategory: '社媒运营', 
    description: '抖音账号运营、内容分发', 
    skills: ['抖音', '短视频', '直播'], rating: 4.8, uses: 18920, trending: true,
    openclawSkills: ['xiaohongshu:post', 'wechat:post', 'openai:chat'],
    personality: ['短视频敏感', '热点捕捉', '数据驱动', '创意执行'],
    capabilities: ['抖音运营', '短视频策划', '直播运营', '数据分析'],
    pastProjects: generateProjects('抖音运营', '社媒运营'),
  },
  { 
    id: 'mkt-social-03', name: 'B站运营', avatar: '📺', category: 'marketing', subCategory: '社媒运营', 
    description: 'B站账号运营、UP主合作', 
    skills: ['B站', '视频', '社区'], rating: 4.6, uses: 9870,
    openclawSkills: ['xiaohongshu:post', 'wechat:post', 'openai:chat'],
    personality: ['二次元文化', '社区运营', '长视频思维', 'UP主资源'],
    capabilities: ['B站运营', 'UP主合作', '社区运营', '视频内容'],
    pastProjects: generateProjects('B站运营', '社媒运营'),
  },

  // SEO 优化
  { 
    id: 'mkt-seo-01', name: 'SEO 优化师', avatar: '🔍', category: 'marketing', subCategory: 'SEO 优化', 
    description: '网站 SEO 优化，关键词布局', 
    skills: ['SEO', '关键词', '内容'], rating: 4.7, uses: 13450,
    openclawSkills: ['openai:chat', 'github:read', 'feishu:read'],
    personality: ['数据敏感', '逻辑性强', '持续学习', '细节控'],
    capabilities: ['SEO优化', '关键词研究', '内容优化', '数据分析'],
    pastProjects: generateProjects('SEO优化师', 'SEO 优化'),
  },
  { 
    id: 'mkt-seo-02', name: '技术 SEO', avatar: '⚙️', category: 'marketing', subCategory: 'SEO 优化', 
    description: '技术 SEO 优化，网站结构优化', 
    skills: ['技术SEO', '结构化数据', '性能'], rating: 4.8, uses: 7230,
    openclawSkills: ['github:read', 'openai:chat'],
    personality: ['技术导向', '系统思维', '数据驱动', '问题解决'],
    capabilities: ['技术SEO', '网站架构', '性能优化', '结构化数据'],
    pastProjects: generateProjects('技术SEO', 'SEO 优化'),
  },

  // 广告投放
  { 
    id: 'mkt-ads-01', name: '信息流广告', avatar: '📺', category: 'marketing', subCategory: '广告投放', 
    description: '巨量引擎、腾讯广告投放', 
    skills: ['信息流', '巨量', '投放'], rating: 4.8, uses: 11230,
    openclawSkills: ['openai:chat', 'feishu:read'],
    personality: ['数据驱动', 'ROI导向', '快速迭代', '策略思维'],
    capabilities: ['信息流投放', '效果优化', '数据分析', 'ROI提升'],
    pastProjects: generateProjects('信息流广告', '广告投放'),
  },
  { 
    id: 'mkt-ads-02', name: '搜索广告优化', avatar: '🔎', category: 'marketing', subCategory: '广告投放', 
    description: '百度、Google SEM 投放', 
    skills: ['SEM', '竞价', 'ROI'], rating: 4.7, uses: 8450,
    openclawSkills: ['openai:chat', 'feishu:read'],
    personality: ['搜索思维', '竞价策略', '数据敏感', 'ROI导向'],
    capabilities: ['SEM投放', '竞价策略', '效果优化', '关键词管理'],
    pastProjects: generateProjects('搜索广告优化', '广告投放'),
  },
  { 
    id: 'mkt-ads-03', name: '投放数据分析师', avatar: '📊', category: 'marketing', subCategory: '广告投放', 
    description: '广告数据分析、效果优化', 
    skills: ['数据分析', '投放', '优化'], rating: 4.8, uses: 7890,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['数据敏感', '逻辑性强', '洞察力强', '优化导向'],
    capabilities: ['投放分析', '效果优化', '数据建模', '报告输出'],
    pastProjects: generateProjects('投放数据分析师', '广告投放'),
  },

  // 品牌策划
  { 
    id: 'mkt-brand-01', name: '品牌策划', avatar: '💎', category: 'marketing', subCategory: '品牌策划', 
    description: '品牌定位、品牌策略制定', 
    skills: ['品牌', '定位', '策略'], rating: 4.9, uses: 9670,
    openclawSkills: ['openai:chat', 'feishu:read', 'feishu:write'],
    personality: ['战略思维', '创意', '品牌敏感', '商业理解'],
    capabilities: ['品牌定位', '品牌策略', 'VI设计', '品牌传播'],
    pastProjects: generateProjects('品牌策划', '品牌策划'),
  },
  { 
    id: 'mkt-brand-02', name: '活动策划', avatar: '🎉', category: 'marketing', subCategory: '品牌策划', 
    description: '线上线下活动策划执行', 
    skills: ['活动', '策划', '执行'], rating: 4.7, uses: 11340,
    openclawSkills: ['feishu:read', 'feishu:write', 'wechat:post', 'openai:chat'],
    personality: ['策划能力', '执行力强', '创意', '协调能力'],
    capabilities: ['活动策划', '活动执行', '资源协调', '效果分析'],
    pastProjects: generateProjects('活动策划', '品牌策划'),
  },

  // 增长运营
  { 
    id: 'mkt-growth-01', name: '增长运营', avatar: '📈', category: 'marketing', subCategory: '增长运营', 
    description: '用户增长、裂变增长策略', 
    skills: ['增长', '裂变', '转化'], rating: 4.8, uses: 14560, trending: true,
    openclawSkills: ['xiaohongshu:post', 'wechat:post', 'openai:chat', 'feishu:read'],
    personality: ['数据驱动', '创新思维', '用户导向', '快速增长'],
    capabilities: ['用户增长', '裂变策略', '转化优化', '数据分析'],
    pastProjects: [
      { name: '裂变增长活动', description: '设计并执行裂变活动', result: '用户增长300%' },
      { name: '转化漏斗优化', description: '全链路转化优化', result: '转化率提升50%' },
    ],
  },
  { 
    id: 'mkt-growth-02', name: '私域运营', avatar: '💬', category: 'marketing', subCategory: '增长运营', 
    description: '私域流量池搭建与运营', 
    skills: ['私域', '社群', '企微'], rating: 4.7, uses: 12890,
    openclawSkills: ['wechat:post', 'xiaohongshu:post', 'feishu:read', 'openai:chat'],
    personality: ['社群思维', '用户关系', '转化导向', '服务意识'],
    capabilities: ['私域搭建', '社群运营', '用户分层', '转化变现'],
    pastProjects: generateProjects('私域运营', '增长运营'),
  },

  // 更多营销
  { 
    id: 'mkt-pr-01', name: '公关媒介', avatar: '📰', category: 'marketing', subCategory: '品牌策划', 
    description: '媒体关系、公关策划', 
    skills: ['公关', '媒体', '危机'], rating: 4.6, uses: 5670,
    openclawSkills: ['openai:chat', 'wechat:post', 'weibo:post', 'feishu:read'],
    personality: ['媒体资源', '危机处理', '沟通能力', '应变能力'],
    capabilities: ['公关策划', '媒体关系', '危机处理', '稿件撰写'],
    pastProjects: generateProjects('公关媒介', '品牌策划'),
  },
  { 
    id: 'mkt-kol-01', name: 'KOL 运营', avatar: '⭐', category: 'marketing', subCategory: '社媒运营', 
    description: '达人合作、MCN 对接', 
    skills: ['KOL', '达人', '合作'], rating: 4.7, uses: 9840,
    openclawSkills: ['xiaohongshu:read', 'wechat:post', 'openai:chat'],
    personality: ['达人资源', '谈判能力', '内容眼光', 'ROI思维'],
    capabilities: ['KOL合作', 'MCN对接', '内容审核', '效果评估'],
    pastProjects: generateProjects('KOL运营', '社媒运营'),
  },
  { 
    id: 'mkt-video-01', name: '短视频运营', avatar: '🎬', category: 'marketing', subCategory: '内容运营', 
    description: '短视频账号矩阵运营', 
    skills: ['短视频', '矩阵', '运营'], rating: 4.8, uses: 16780,
    openclawSkills: ['xiaohongshu:post', 'wechat:post', 'openai:chat'],
    personality: ['短视频敏感', '矩阵思维', '数据驱动', '创意执行'],
    capabilities: ['短视频运营', '矩阵管理', '内容策划', '数据分析'],
    pastProjects: generateProjects('短视频运营', '内容运营'),
  },
  { 
    id: 'mkt-live-01', name: '直播运营', avatar: '🎥', category: 'marketing', subCategory: '社媒运营', 
    description: '直播策划、直播带货', 
    skills: ['直播', '带货', '运营'], rating: 4.7, uses: 13450,
    openclawSkills: ['xiaohongshu:post', 'wechat:post', 'openai:chat'],
    personality: ['直播经验', '带货能力', '实时反应', '数据驱动'],
    capabilities: ['直播策划', '直播运营', '带货转化', '主播管理'],
    pastProjects: generateProjects('直播运营', '社媒运营'),
  },
  { 
    id: 'mkt-comm-01', name: '社群运营', avatar: '👥', category: 'marketing', subCategory: '社媒运营', 
    description: '社群搭建、用户活跃', 
    skills: ['社群', '活跃', '运营'], rating: 4.6, uses: 15670,
    openclawSkills: ['wechat:post', 'feishu:read', 'openai:chat'],
    personality: ['外向', '善于沟通', '用户导向', '耐心细致'],
    capabilities: ['社群搭建', '用户活跃', '内容分发', '转化变现'],
    pastProjects: generateProjects('社群运营', '社媒运营'),
  },

  // ========== 分析类 (15个) ==========
  // 数据分析
  { 
    id: 'ana-data-01', name: '数据分析师', avatar: '📊', category: 'analysis', subCategory: '数据分析', 
    description: '业务数据分析、报表搭建', 
    skills: ['SQL', 'Python', 'Tableau'], rating: 4.8, uses: 16780, trending: true,
    openclawSkills: ['openai:chat', 'github:read', 'feishu:read', 'notion:read'],
    personality: ['逻辑性强', '数据敏感', '严谨', '洞察力强'],
    capabilities: ['数据分析', '报表搭建', '数据可视化', '洞察输出'],
    pastProjects: [
      { name: '用户行为分析体系', description: '搭建完整分析体系', result: '覆盖80%业务场景' },
      { name: 'BI报表系统', description: '从0到1搭建BI系统', result: '决策效率提升3倍' },
    ],
  },
  { 
    id: 'ana-data-02', name: 'BI 工程师', avatar: '📈', category: 'analysis', subCategory: '数据分析', 
    description: 'BI 报表开发、数据可视化', 
    skills: ['BI', '可视化', '报表'], rating: 4.7, uses: 9840,
    openclawSkills: ['openai:chat', 'feishu:read', 'feishu:write'],
    personality: ['可视化思维', '业务理解', '报表设计', '数据敏感'],
    capabilities: ['BI开发', '报表设计', '数据可视化', '指标体系'],
    pastProjects: generateProjects('BI工程师', '数据分析'),
  },
  { 
    id: 'ana-data-03', name: '埋点分析师', avatar: '📍', category: 'analysis', subCategory: '数据分析', 
    description: '数据埋点设计、行为分析', 
    skills: ['埋点', '神策', 'GA'], rating: 4.6, uses: 6230,
    openclawSkills: ['openai:chat', 'feishu:read'],
    personality: ['细节控', '逻辑性强', '数据敏感', '系统思维'],
    capabilities: ['埋点设计', '行为分析', '数据采集', '指标定义'],
    pastProjects: generateProjects('埋点分析师', '数据分析'),
  },

  // 财务分析
  { 
    id: 'ana-finance-01', name: '财务分析师', avatar: '💰', category: 'analysis', subCategory: '财务分析', 
    description: '财务报表分析、预算编制', 
    skills: ['财务', '报表', '预算'], rating: 4.8, uses: 11230,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['严谨', '数字敏感', '风险意识强', '逻辑性强'],
    capabilities: ['财务分析', '预算编制', '报表解读', '风险评估'],
    pastProjects: generateProjects('财务分析师', '财务分析'),
  },
  { 
    id: 'ana-finance-02', name: '投资分析师', avatar: '💹', category: 'analysis', subCategory: '财务分析', 
    description: '行业研究、投资分析', 
    skills: ['投资', '研究', '估值'], rating: 4.9, uses: 8560,
    openclawSkills: ['openai:chat', 'feishu:read', 'github:read'],
    personality: ['研究能力', '投资眼光', '风险评估', '行业洞察'],
    capabilities: ['投资分析', '行业研究', '估值建模', '尽职调查'],
    pastProjects: generateProjects('投资分析师', '财务分析'),
  },

  // 竞品分析
  { 
    id: 'ana-competitor-01', name: '竞品分析师', avatar: '🎯', category: 'analysis', subCategory: '竞品分析', 
    description: '竞品调研、竞争策略分析', 
    skills: ['竞品', '调研', '策略'], rating: 4.7, uses: 9870,
    openclawSkills: ['openai:chat', 'github:read', 'feishu:read'],
    personality: ['好奇心强', '洞察力强', '分析能力', '战略思维'],
    capabilities: ['竞品分析', '市场调研', '策略输出', '报告撰写'],
    pastProjects: generateProjects('竞品分析师', '竞品分析'),
  },
  { 
    id: 'ana-competitor-02', name: '行业研究员', avatar: '📚', category: 'analysis', subCategory: '竞品分析', 
    description: '行业研究、市场调研', 
    skills: ['行业研究', '报告', '市场'], rating: 4.8, uses: 7650,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['研究能力', '洞察力强', '写作能力', '数据敏感'],
    capabilities: ['行业研究', '市场调研', '报告撰写', '趋势分析'],
    pastProjects: generateProjects('行业研究员', '竞品分析'),
  },

  // 用户研究
  { 
    id: 'ana-user-01', name: '用户研究员', avatar: '👤', category: 'analysis', subCategory: '用户研究', 
    description: '用户访谈、可用性测试', 
    skills: ['用户研究', '访谈', '测试'], rating: 4.7, uses: 8230,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['同理心强', '善于倾听', '洞察力强', '用户导向'],
    capabilities: ['用户研究', '访谈设计', '可用性测试', '洞察输出'],
    pastProjects: generateProjects('用户研究员', '用户研究'),
  },
  { 
    id: 'ana-user-02', name: '体验分析师', avatar: '💡', category: 'analysis', subCategory: '用户研究', 
    description: 'NPS 调研、满意度分析', 
    skills: ['NPS', '满意度', '体验'], rating: 4.6, uses: 5450,
    openclawSkills: ['openai:chat', 'feishu:read'],
    personality: ['体验敏感', '数据驱动', '用户导向', '持续改进'],
    capabilities: ['体验分析', 'NPS调研', '满意度分析', '优化建议'],
    pastProjects: generateProjects('体验分析师', '用户研究'),
  },

  // 市场分析
  { 
    id: 'ana-market-01', name: '市场分析师', avatar: '🌍', category: 'analysis', subCategory: '市场分析', 
    description: '市场规模估算、趋势分析', 
    skills: ['市场', '趋势', '预测'], rating: 4.7, uses: 7340,
    openclawSkills: ['openai:chat', 'feishu:read', 'github:read'],
    personality: ['战略思维', '洞察力强', '数据敏感', '前瞻性'],
    capabilities: ['市场分析', '趋势预测', '市场规模估算', '战略规划'],
    pastProjects: generateProjects('市场分析师', '市场分析'),
  },
  { 
    id: 'ana-market-02', name: '产品分析师', avatar: '📦', category: 'analysis', subCategory: '市场分析', 
    description: '产品数据分析、迭代优化', 
    skills: ['产品', '数据', '迭代'], rating: 4.8, uses: 10560,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['数据驱动', '产品思维', '迭代导向', '用户导向'],
    capabilities: ['产品分析', '迭代优化', '数据驱动', 'AB测试'],
    pastProjects: generateProjects('产品分析师', '市场分析'),
  },

  // 更多分析
  { 
    id: 'ana-risk-01', name: '风险分析师', avatar: '⚠️', category: 'analysis', subCategory: '财务分析', 
    description: '风险评估、风控建模', 
    skills: ['风险', '风控', '建模'], rating: 4.7, uses: 4560,
    openclawSkills: ['openai:chat', 'feishu:read'],
    personality: ['风险意识', '严谨', '数学基础', '预警思维'],
    capabilities: ['风险评估', '风控建模', '预警体系', '合规审计'],
    pastProjects: generateProjects('风险分析师', '财务分析'),
  },
  { 
    id: 'ana-ops-01', name: '运营分析师', avatar: '🔧', category: 'analysis', subCategory: '数据分析', 
    description: '运营数据分析、漏斗分析', 
    skills: ['运营', '漏斗', '转化'], rating: 4.6, uses: 8970,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['数据敏感', '运营思维', '转化导向', '持续优化'],
    capabilities: ['运营分析', '漏斗分析', '转化优化', '数据驱动'],
    pastProjects: generateProjects('运营分析师', '数据分析'),
  },
  { 
    id: 'ana-ab-01', name: 'A/B 测试专家', avatar: '🧪', category: 'analysis', subCategory: '数据分析', 
    description: '实验设计、A/B 测试分析', 
    skills: ['A/B测试', '实验', '统计'], rating: 4.8, uses: 6780,
    openclawSkills: ['openai:chat', 'github:read', 'feishu:read'],
    personality: ['实验思维', '统计基础', '数据驱动', '科学方法'],
    capabilities: ['实验设计', 'A/B测试', '统计分析', '结果解读'],
    pastProjects: generateProjects('A/B测试专家', '数据分析'),
  },

  // ========== 写作类 (20个) ==========
  // 文案写作
  { 
    id: 'write-copy-01', name: '文案写手', avatar: '✍️', category: 'writing', subCategory: '文案写作', 
    description: '广告文案、营销文案创作', 
    skills: ['文案', '创意', '营销'], rating: 4.7, uses: 23450,
    openclawSkills: ['openai:chat', 'xiaohongshu:post', 'wechat:post'],
    personality: ['创意', '文字敏感', '情感丰富', '善于表达'],
    capabilities: ['文案撰写', '创意策划', '营销文案', '品牌文案'],
    pastProjects: generateProjects('文案写手', '文案写作'),
  },
  { 
    id: 'write-copy-02', name: '电商文案', avatar: '🛒', category: 'writing', subCategory: '文案写作', 
    description: '商品详情页、推广文案', 
    skills: ['电商', '详情页', '转化'], rating: 4.6, uses: 18760,
    openclawSkills: ['openai:chat', 'xiaohongshu:post'],
    personality: ['电商思维', '转化导向', '产品理解', '卖点提炼'],
    capabilities: ['电商文案', '详情页撰写', '卖点提炼', '转化优化'],
    pastProjects: generateProjects('电商文案', '文案写作'),
  },
  { 
    id: 'write-copy-03', name: '品牌文案', avatar: '💎', category: 'writing', subCategory: '文案写作', 
    description: '品牌故事、品牌调性文案', 
    skills: ['品牌', '故事', '调性'], rating: 4.8, uses: 12340,
    openclawSkills: ['openai:chat', 'wechat:post', 'feishu:read'],
    personality: ['品牌思维', '故事力', '情感共鸣', '调性把控'],
    capabilities: ['品牌文案', '故事撰写', '调性把控', '传播策划'],
    pastProjects: generateProjects('品牌文案', '文案写作'),
  },

  // 技术文档
  { 
    id: 'write-tech-01', name: '技术文档工程师', avatar: '📖', category: 'writing', subCategory: '技术文档', 
    description: 'API 文档、技术规范编写', 
    skills: ['文档', 'API', '技术写作'], rating: 4.8, uses: 9870,
    openclawSkills: ['github:read', 'feishu:read', 'feishu:write', 'notion:read', 'notion:write'],
    personality: ['严谨', '逻辑清晰', '善于总结', '注重细节'],
    capabilities: ['技术文档', 'API文档', '规范编写', '知识库维护'],
    pastProjects: generateProjects('技术文档工程师', '技术文档'),
  },
  { 
    id: 'write-tech-02', name: '产品文档', avatar: '📋', category: 'writing', subCategory: '技术文档', 
    description: 'PRD 文档、需求文档编写', 
    skills: ['PRD', '需求', '文档'], rating: 4.7, uses: 11230,
    openclawSkills: ['feishu:read', 'feishu:write', 'notion:read', 'notion:write'],
    personality: ['产品思维', '逻辑清晰', '细节控', '文档习惯'],
    capabilities: ['PRD撰写', '需求文档', '产品文档', '流程图'],
    pastProjects: generateProjects('产品文档', '技术文档'),
  },
  { 
    id: 'write-tech-03', name: '知识库维护', avatar: '📚', category: 'writing', subCategory: '技术文档', 
    description: '产品帮助文档、知识库', 
    skills: ['知识库', '帮助中心', 'FAQ'], rating: 4.5, uses: 6540,
    openclawSkills: ['feishu:read', 'feishu:write', 'notion:read', 'notion:write'],
    personality: ['整理能力', '用户导向', '系统思维', '持续维护'],
    capabilities: ['知识库维护', 'FAQ编写', '帮助文档', '内容整理'],
    pastProjects: generateProjects('知识库维护', '技术文档'),
  },

  // 小说创作
  { 
    id: 'write-fiction-01', name: '小说作家', avatar: '📚', category: 'writing', subCategory: '小说创作', 
    description: '网络小说、故事创作', 
    skills: ['小说', '故事', '创作'], rating: 4.6, uses: 15670,
    openclawSkills: ['openai:chat'],
    personality: ['想象力丰富', '情感细腻', '叙事能力强', '创意'],
    capabilities: ['小说创作', '故事构思', '角色设计', '情节编排'],
    pastProjects: generateProjects('小说作家', '小说创作'),
  },
  { 
    id: 'write-fiction-02', name: '剧本编剧', avatar: '🎬', category: 'writing', subCategory: '小说创作', 
    description: '影视剧本、短视频脚本', 
    skills: ['剧本', '编剧', '脚本'], rating: 4.7, uses: 8920,
    openclawSkills: ['openai:chat'],
    personality: ['故事力', '镜头感', '戏剧冲突', '角色塑造'],
    capabilities: ['剧本创作', '角色塑造', '情节设计', '对话撰写'],
    pastProjects: generateProjects('剧本编剧', '小说创作'),
  },

  // 新闻撰写
  { 
    id: 'write-news-01', name: '新闻编辑', avatar: '📰', category: 'writing', subCategory: '新闻撰写', 
    description: '新闻稿撰写、媒体稿件', 
    skills: ['新闻', '稿件', '媒体'], rating: 4.6, uses: 7890,
    openclawSkills: ['openai:chat', 'wechat:post', 'weibo:post'],
    personality: ['新闻敏感', '客观公正', '文字功底强', '快速反应'],
    capabilities: ['新闻撰写', '稿件编辑', '媒体沟通', '危机公关'],
    pastProjects: generateProjects('新闻编辑', '新闻撰写'),
  },
  { 
    id: 'write-news-02', name: '公关稿件', avatar: '📢', category: 'writing', subCategory: '新闻撰写', 
    description: '公关稿件、企业宣传稿', 
    skills: ['公关', '宣传', '稿件'], rating: 4.5, uses: 5670,
    openclawSkills: ['openai:chat', 'wechat:post', 'feishu:read'],
    personality: ['公关思维', '品牌意识', '危机处理', '媒体关系'],
    capabilities: ['公关稿件', '宣传文案', '危机应对', '品牌传播'],
    pastProjects: generateProjects('公关稿件', '新闻撰写'),
  },

  // 内容创作
  { 
    id: 'write-content-01', name: '内容创作者', avatar: '📝', category: 'writing', subCategory: '内容创作', 
    description: '公众号文章、知乎回答', 
    skills: ['公众号', '知乎', '内容'], rating: 4.7, uses: 21340,
    openclawSkills: ['openai:chat', 'wechat:post', 'xiaohongshu:post', 'weibo:post'],
    personality: ['内容敏感', '写作能力', '热点捕捉', '知识储备'],
    capabilities: ['内容创作', '文章撰写', '选题策划', '平台运营'],
    pastProjects: generateProjects('内容创作者', '内容创作'),
  },
  { 
    id: 'write-content-02', name: '短视频脚本', avatar: '🎥', category: 'writing', subCategory: '内容创作', 
    description: '抖音、B站视频脚本', 
    skills: ['短视频', '脚本', '分镜'], rating: 4.6, uses: 16780,
    openclawSkills: ['openai:chat', 'xiaohongshu:post'],
    personality: ['短视频思维', '创意', '故事感', '节奏把控'],
    capabilities: ['脚本创作', '分镜设计', '短视频策划', '内容规划'],
    pastProjects: generateProjects('短视频脚本', '内容创作'),
  },
  { 
    id: 'write-content-03', name: '直播脚本', avatar: '🎤', category: 'writing', subCategory: '内容创作', 
    description: '直播话术、直播脚本', 
    skills: ['直播', '话术', '脚本'], rating: 4.5, uses: 9870,
    openclawSkills: ['openai:chat', 'xiaohongshu:post'],
    personality: ['直播思维', '话术敏感', '节奏把控', '互动设计'],
    capabilities: ['直播脚本', '话术设计', '互动策划', '内容规划'],
    pastProjects: generateProjects('直播脚本', '内容创作'),
  },

  // 专业写作
  { 
    id: 'write-pro-01', name: '学术写作', avatar: '🎓', category: 'writing', subCategory: '专业写作', 
    description: '论文润色、学术写作', 
    skills: ['论文', '学术', '润色'], rating: 4.7, uses: 6230,
    openclawSkills: ['openai:chat', 'feishu:read', 'feishu:write'],
    personality: ['学术严谨', '逻辑清晰', '文献功底', '写作规范'],
    capabilities: ['学术写作', '论文润色', '文献综述', '研究方法'],
    pastProjects: generateProjects('学术写作', '专业写作'),
  },
  { 
    id: 'write-pro-02', name: '法律文书', avatar: '⚖️', category: 'writing', subCategory: '专业写作', 
    description: '合同起草、法律文书', 
    skills: ['法律', '合同', '文书'], rating: 4.8, uses: 4560,
    openclawSkills: ['openai:chat', 'feishu:read', 'feishu:write'],
    personality: ['法律严谨', '风险意识', '条款敏感', '逻辑严密'],
    capabilities: ['合同起草', '法律文书', '风险评估', '合规审核'],
    pastProjects: generateProjects('法律文书', '专业写作'),
  },
  { 
    id: 'write-pro-03', name: '商业计划书', avatar: '📊', category: 'writing', subCategory: '专业写作', 
    description: '商业计划书、融资 BP', 
    skills: ['BP', '商业计划', '融资'], rating: 4.8, uses: 7890,
    openclawSkills: ['openai:chat', 'feishu:read', 'feishu:write', 'notion:read'],
    personality: ['商业思维', '融资经验', '逻辑清晰', '数据敏感'],
    capabilities: ['商业计划书', '融资BP', '财务预测', '商业分析'],
    pastProjects: generateProjects('商业计划书', '专业写作'),
  },

  // 更多写作
  { 
    id: 'write-social-01', name: '社媒文案', avatar: '💬', category: 'writing', subCategory: '文案写作', 
    description: '朋友圈、微博、小红书文案', 
    skills: ['朋友圈', '微博', '小红书'], rating: 4.5, uses: 19870,
    openclawSkills: ['openai:chat', 'xiaohongshu:post', 'wechat:post', 'weibo:post'],
    personality: ['社交敏感', '热点捕捉', '文案创意', '平台理解'],
    capabilities: ['社媒文案', '朋友圈文案', '小红书文案', '微博文案'],
    pastProjects: generateProjects('社媒文案', '文案写作'),
  },
  { 
    id: 'write-seo-01', name: 'SEO 文案', avatar: '🔍', category: 'writing', subCategory: '文案写作', 
    description: 'SEO 优化文章、关键词布局', 
    skills: ['SEO', '关键词', '文章'], rating: 4.6, uses: 11230,
    openclawSkills: ['openai:chat', 'github:read'],
    personality: ['SEO思维', '关键词敏感', '内容质量', '搜索理解'],
    capabilities: ['SEO文案', '关键词布局', '内容优化', '搜索排名'],
    pastProjects: generateProjects('SEO文案', '文案写作'),
  },
  { 
    id: 'write-local-01', name: '本地化翻译', avatar: '🌍', category: 'writing', subCategory: '专业写作', 
    description: '多语言本地化、翻译', 
    skills: ['翻译', '本地化', '多语言'], rating: 4.7, uses: 7650,
    openclawSkills: ['openai:chat', 'feishu:read', 'feishu:write'],
    personality: ['语言天赋', '文化理解', '细节控', '本地化思维'],
    capabilities: ['翻译', '本地化', '多语言内容', '文化适配'],
    pastProjects: generateProjects('本地化翻译', '专业写作'),
  },

  // ========== 运营类 (15个) ==========
  // 产品运营
  { 
    id: 'ops-product-01', name: '产品运营', avatar: '📦', category: 'operations', subCategory: '产品运营', 
    description: '产品迭代、用户反馈收集', 
    skills: ['产品运营', '迭代', '反馈'], rating: 4.7, uses: 13450,
    openclawSkills: ['openai:chat', 'feishu:read', 'feishu:write', 'notion:read'],
    personality: ['用户导向', '数据敏感', '沟通能力强', '问题解决'],
    capabilities: ['产品运营', '迭代规划', '用户反馈', '数据分析'],
    pastProjects: generateProjects('产品运营', '产品运营'),
  },
  { 
    id: 'ops-product-02', name: '新用户运营', avatar: '🆕', category: 'operations', subCategory: '产品运营', 
    description: '新用户引导、激活留存', 
    skills: ['新用户', '激活', '引导'], rating: 4.6, uses: 9870,
    openclawSkills: ['openai:chat', 'feishu:read', 'wechat:post'],
    personality: ['用户导向', '转化思维', '数据分析', '流程设计'],
    capabilities: ['新用户引导', '激活策略', '留存优化', '数据分析'],
    pastProjects: generateProjects('新用户运营', '产品运营'),
  },

  // 用户运营
  { 
    id: 'ops-user-01', name: '用户运营', avatar: '👥', category: 'operations', subCategory: '用户运营', 
    description: '用户分层、生命周期管理', 
    skills: ['用户运营', '分层', '生命周期'], rating: 4.7, uses: 15670,
    openclawSkills: ['xiaohongshu:post', 'wechat:post', 'feishu:read', 'openai:chat'],
    personality: ['外向', '善于沟通', '用户导向', '耐心细致'],
    capabilities: ['用户运营', '用户分层', '生命周期管理', '社群运营'],
    pastProjects: generateProjects('用户运营', '用户运营'),
  },
  { 
    id: 'ops-user-02', name: '会员运营', avatar: '👑', category: 'operations', subCategory: '用户运营', 
    description: '会员体系、权益设计', 
    skills: ['会员', '权益', '体系'], rating: 4.8, uses: 11230,
    openclawSkills: ['feishu:read', 'feishu:write', 'openai:chat'],
    personality: ['会员思维', '权益敏感', '数据分析', '体系设计'],
    capabilities: ['会员运营', '权益设计', '体系搭建', '数据分析'],
    pastProjects: generateProjects('会员运营', '用户运营'),
  },
  { 
    id: 'ops-user-03', name: '客服运营', avatar: '🎧', category: 'operations', subCategory: '用户运营', 
    description: '客服流程、工单管理', 
    skills: ['客服', '工单', '流程'], rating: 4.5, uses: 8760,
    openclawSkills: ['feishu:read', 'openai:chat'],
    personality: ['服务意识', '耐心细致', '问题解决', '流程思维'],
    capabilities: ['客服管理', '工单处理', '流程优化', '满意度提升'],
    pastProjects: generateProjects('客服运营', '用户运营'),
  },

  // 活动运营
  { 
    id: 'ops-event-01', name: '活动运营', avatar: '🎉', category: 'operations', subCategory: '活动运营', 
    description: '活动策划、执行落地', 
    skills: ['活动', '策划', '执行'], rating: 4.7, uses: 13450,
    openclawSkills: ['feishu:read', 'feishu:write', 'openai:chat', 'wechat:post'],
    personality: ['策划能力', '执行力强', '善于协调', '创意'],
    capabilities: ['活动策划', '活动执行', '效果分析', '资源协调'],
    pastProjects: generateProjects('活动运营', '活动运营'),
  },
  { 
    id: 'ops-event-02', name: '大促运营', avatar: '🛍️', category: 'operations', subCategory: '活动运营', 
    description: '双11、618 大促策划', 
    skills: ['大促', '电商', '活动'], rating: 4.8, uses: 9870,
    openclawSkills: ['feishu:read', 'feishu:write', 'wechat:post', 'openai:chat'],
    personality: ['大促经验', '抗压能力', '协调能力', '数据驱动'],
    capabilities: ['大促策划', '活动执行', '数据分析', '资源协调'],
    pastProjects: generateProjects('大促运营', '活动运营'),
  },

  // 数据运营
  { 
    id: 'ops-data-01', name: '数据运营', avatar: '📊', category: 'operations', subCategory: '数据运营', 
    description: '数据监控、报表分析', 
    skills: ['数据', '监控', '报表'], rating: 4.6, uses: 11230,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read', 'github:read'],
    personality: ['数据敏感', '逻辑性强', '注重细节', '持续优化'],
    capabilities: ['数据运营', '指标监控', '报表分析', '策略优化'],
    pastProjects: generateProjects('数据运营', '数据运营'),
  },
  { 
    id: 'ops-data-02', name: '策略运营', avatar: '🎯', category: 'operations', subCategory: '数据运营', 
    description: '运营策略制定、效果优化', 
    skills: ['策略', '优化', '迭代'], rating: 4.7, uses: 8450,
    openclawSkills: ['openai:chat', 'feishu:read', 'notion:read'],
    personality: ['策略思维', '数据驱动', '优化导向', '系统思维'],
    capabilities: ['策略制定', '效果优化', '数据分析', '迭代规划'],
    pastProjects: generateProjects('策略运营', '数据运营'),
  },

  // 商家运营
  { 
    id: 'ops-merchant-01', name: '商家运营', avatar: '🏪', category: 'operations', subCategory: '商家运营', 
    description: '商家入驻、商家成长', 
    skills: ['商家', '入驻', '成长'], rating: 4.6, uses: 7650,
    openclawSkills: ['feishu:read', 'feishu:write', 'openai:chat'],
    personality: ['沟通能力强', '商务敏感', '服务意识', '结果导向'],
    capabilities: ['商家运营', '商家成长', '入驻引导', '关系维护'],
    pastProjects: generateProjects('商家运营', '商家运营'),
  },
  { 
    id: 'ops-merchant-02', name: '类目运营', avatar: '📂', category: 'operations', subCategory: '商家运营', 
    description: '商品类目管理、品类规划', 
    skills: ['类目', '品类', '规划'], rating: 4.5, uses: 5430,
    openclawSkills: ['feishu:read', 'openai:chat'],
    personality: ['类目思维', '规划能力', '数据分析', '供应链理解'],
    capabilities: ['类目管理', '品类规划', '商品运营', '数据分析'],
    pastProjects: generateProjects('类目运营', '商家运营'),
  },

  // 更多运营
  { 
    id: 'ops-content-01', name: '内容运营', avatar: '📝', category: 'operations', subCategory: '内容运营', 
    description: '内容审核、内容分发', 
    skills: ['内容', '审核', '分发'], rating: 4.6, uses: 12340,
    openclawSkills: ['xiaohongshu:post', 'wechat:post', 'openai:chat', 'feishu:read'],
    personality: ['内容敏感', '审核标准', '分发策略', '质量把控'],
    capabilities: ['内容运营', '内容审核', '内容分发', '质量把控'],
    pastProjects: generateProjects('内容运营', '内容运营'),
  },
  { 
    id: 'ops-risk-01', name: '风控运营', avatar: '🛡️', category: 'operations', subCategory: '数据运营', 
    description: '风险识别、风控策略', 
    skills: ['风控', '审核', '策略'], rating: 4.7, uses: 6540,
    openclawSkills: ['openai:chat', 'feishu:read'],
    personality: ['风险意识', '数据敏感', '策略思维', '预警能力'],
    capabilities: ['风控运营', '风险识别', '策略制定', '审核管理'],
    pastProjects: generateProjects('风控运营', '数据运营'),
  },
  { 
    id: 'ops-quality-01', name: '质量运营', avatar: '✅', category: 'operations', subCategory: '产品运营', 
    description: '质量监控、问题追踪', 
    skills: ['质量', '监控', '追踪'], rating: 4.5, uses: 4560,
    openclawSkills: ['feishu:read', 'openai:chat'],
    personality: ['质量意识', '细节控', '问题追踪', '持续改进'],
    capabilities: ['质量监控', '问题追踪', '流程优化', '数据驱动'],
    pastProjects: generateProjects('质量运营', '产品运营'),
  },
  { 
    id: 'ops-cross-01', name: '跨部门协作', avatar: '🤝', category: 'operations', subCategory: '产品运营', 
    description: '跨部门项目协调、资源对接', 
    skills: ['协作', '沟通', '协调'], rating: 4.6, uses: 7890,
    openclawSkills: ['feishu:read', 'feishu:write', 'openai:chat'],
    personality: ['沟通能力强', '协调能力', '项目思维', '资源整合'],
    capabilities: ['跨部门协作', '项目协调', '资源对接', '进度管理'],
    pastProjects: generateProjects('跨部门协作', '产品运营'),
  },
];

// 模板组合
export const templates = [
  {
    id: 'startup-team',
    name: '创业团队套餐',
    description: '适合初创公司的核心团队配置',
    agents: ['dev-full-01', 'design-ui-01', 'mkt-growth-01', 'write-content-01'],
    icon: '🚀',
  },
  {
    id: 'content-studio',
    name: '内容工作室',
    description: '短视频和图文内容生产组合',
    agents: ['write-content-01', 'design-motion-01', 'mkt-social-01', 'ana-data-01'],
    icon: '🎬',
  },
  {
    id: 'product-team',
    name: '产品研发组',
    description: '产品设计和开发核心团队',
    agents: ['dev-fe-01', 'dev-be-01', 'design-ux-01', 'ana-user-01'],
    icon: '📱',
  },
  {
    id: 'marketing-squad',
    name: '营销铁军',
    description: '全渠道营销推广团队',
    agents: ['mkt-social-01', 'mkt-ads-01', 'write-copy-01', 'ana-competitor-01'],
    icon: '📢',
  },
  {
    id: 'data-team',
    name: '数据分析组',
    description: '数据驱动的分析团队',
    agents: ['ana-data-01', 'ana-user-01', 'ops-data-01', 'dev-ai-01'],
    icon: '📊',
  },
];

// 获取热门 Agent
export const getTrendingAgents = () => agents.filter(a => a.trending);

// 按分类获取 Agent
export const getAgentsByCategory = (categoryId: string) => 
  agents.filter(a => a.category === categoryId);

// 按子分类获取 Agent
export const getAgentsBySubCategory = (category: string, subCategory: string) =>
  agents.filter(a => a.category === category && a.subCategory === subCategory);

// 搜索 Agent
export const searchAgents = (query: string) => {
  const q = query.toLowerCase();
  return agents.filter(a => 
    a.name.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.skills.some(s => s.toLowerCase().includes(q))
  );
};

// 根据 ID 获取 Agent
export const getAgentById = (id: string) => agents.find(a => a.id === id);

// 获取 Agent 的 OpenClaw Skills
export const getAgentOpenClawSkills = (agentId: string) => {
  const agent = getAgentById(agentId);
  return agent?.openclawSkills || [];
};