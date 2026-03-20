/**
 * OpenClaw Skills 集成测试
 * 运行: npx ts-node scripts/test-openclaw-skills.ts
 */

import {
  getAllOpenClawSkills,
  getOpenClawSkillByName,
  searchOpenClawSkills,
  getOpenClawSkillsStats,
  getOpenClawSkillsByCategory,
} from '../src/lib/openclaw-skills';
import {
  detectRequiredSkills,
  prepareSkillsContext,
} from '../src/lib/agents/skill-executor';

console.log('=== OpenClaw Skills 集成测试 ===\n');

// 1. 测试获取所有 Skills
console.log('1. 获取所有 OpenClaw Skills...');
const skills = getAllOpenClawSkills();
console.log(`   ✓ 共 ${skills.length} 个 skills\n`);

// 2. 测试统计信息
console.log('2. 获取统计信息...');
const stats = getOpenClawSkillsStats();
console.log(`   ✓ 总计: ${stats.total}`);
console.log(`   ✓ 系统: ${stats.system}`);
console.log(`   ✓ 用户: ${stats.user}`);
console.log(`   ✓ 分类分布:`);
for (const [cat, count] of Object.entries(stats.byCategory)) {
  if (count > 0) {
    console.log(`     - ${cat}: ${count}`);
  }
}
console.log();

// 3. 测试搜索
console.log('3. 测试搜索功能...');
const searchResults = searchOpenClawSkills('weather');
console.log(`   ✓ 搜索 "weather" 找到 ${searchResults.length} 个结果`);
for (const skill of searchResults) {
  console.log(`     - ${skill.emoji} ${skill.name}`);
}
console.log();

// 4. 测试获取单个 Skill
console.log('4. 测试获取单个 Skill...');
const weatherSkill = getOpenClawSkillByName('weather');
if (weatherSkill) {
  console.log(`   ✓ 找到 weather skill:`);
  console.log(`     - 名称: ${weatherSkill.name}`);
  console.log(`     - 图标: ${weatherSkill.emoji}`);
  console.log(`     - 分类: ${weatherSkill.category}`);
  console.log(`     - 描述: ${weatherSkill.description.slice(0, 50)}...`);
}
console.log();

// 5. 测试按分类获取
console.log('5. 测试按分类获取...');
const aiSkills = getOpenClawSkillsByCategory('ai');
console.log(`   ✓ AI 分类有 ${aiSkills.length} 个 skills:`);
for (const skill of aiSkills) {
  console.log(`     - ${skill.emoji} ${skill.name}`);
}
console.log();

// 6. 测试 Agent Skill 检测
console.log('6. 测试 Agent Skill 检测...');
const testMessages = [
  '上海今天天气怎么样？',
  '帮我看看 GitHub 上最新的 PR',
  '发一条 Twitter',
];
for (const msg of testMessages) {
  const matches = detectRequiredSkills(msg);
  console.log(`   消息: "${msg}"`);
  if (matches.length > 0) {
    console.log(`   ✓ 检测到 skills:`);
    for (const match of matches) {
      console.log(`     - ${match.skill.name} (置信度: ${match.confidence.toFixed(2)})`);
    }
  } else {
    console.log(`   - 未检测到相关 skill`);
  }
}
console.log();

// 7. 测试 Skills 上下文生成
console.log('7. 测试 Skills 上下文生成...');
const context = prepareSkillsContext();
console.log(`   ✓ 生成上下文长度: ${context.length} 字符`);
console.log(`   ✓ 前 200 字符:\n${context.slice(0, 200)}...\n`);

// 8. 列出所有 Skills
console.log('8. 所有 Skills 列表:');
for (const skill of skills) {
  console.log(`   ${skill.emoji} ${skill.name} [${skill.category}]`);
}

console.log('\n=== 测试完成 ===');