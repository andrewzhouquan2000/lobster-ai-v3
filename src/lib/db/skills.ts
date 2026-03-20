/**
 * Skills Database Operations - SQLite
 */
import db from './index';
import { randomUUID } from 'crypto';
import { skills as predefinedSkills, type Skill } from '@/data/skills';

export interface DbSkill {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  icon: string;
  permissions: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface DbAgentSkill {
  id: string;
  agent_id: string;
  skill_id: string;
  granted_at: string;
}

/**
 * 初始化Skills表（从预定义数据）
 */
export function initializeSkills(): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM skills').get() as any;
  
  if (count.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO skills (id, name, display_name, description, category, icon, permissions, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const skill of predefinedSkills) {
      stmt.run(
        skill.id,
        skill.name,
        skill.displayName,
        skill.description || '',
        skill.category,
        skill.icon,
        JSON.stringify(skill.permissions)
      );
    }
  }
}

/**
 * 获取所有Skills
 */
export function getAllSkills(): Skill[] {
  const rows = db.prepare(`
    SELECT * FROM skills WHERE is_active = 1 ORDER BY category, name
  `).all() as DbSkill[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    category: row.category as any,
    icon: row.icon,
    permissions: JSON.parse(row.permissions || '[]'),
  }));
}

/**
 * 按分类获取Skills
 */
export function getSkillsByCategoryDb(category: string): Skill[] {
  const rows = db.prepare(`
    SELECT * FROM skills WHERE category = ? AND is_active = 1 ORDER BY name
  `).all(category) as DbSkill[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    category: row.category as any,
    icon: row.icon,
    permissions: JSON.parse(row.permissions || '[]'),
  }));
}

/**
 * 为Agent分配Skills
 */
export function grantSkillToAgent(agentId: string, skillId: string): boolean {
  try {
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT OR IGNORE INTO agent_skills (id, agent_id, skill_id, granted_at)
      VALUES (?, ?, ?, ?)
    `).run(id, agentId, skillId, now);

    return true;
  } catch (error) {
    console.error('Grant skill error:', error);
    return false;
  }
}

/**
 * 批量为Agent分配Skills
 */
export function grantSkillsToAgent(agentId: string, skillIds: string[]): number {
  let count = 0;
  for (const skillId of skillIds) {
    if (grantSkillToAgent(agentId, skillId)) {
      count++;
    }
  }
  return count;
}

/**
 * 撤销Agent的Skill
 */
export function revokeSkillFromAgent(agentId: string, skillId: string): boolean {
  try {
    const result = db.prepare(`
      DELETE FROM agent_skills WHERE agent_id = ? AND skill_id = ?
    `).run(agentId, skillId);

    return result.changes > 0;
  } catch (error) {
    console.error('Revoke skill error:', error);
    return false;
  }
}

/**
 * 获取Agent的所有Skills
 */
export function getAgentSkills(agentId: string): Skill[] {
  const rows = db.prepare(`
    SELECT s.* FROM skills s
    JOIN agent_skills ags ON s.id = ags.skill_id
    WHERE ags.agent_id = ? AND s.is_active = 1
    ORDER BY s.category, s.name
  `).all(agentId) as DbSkill[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    category: row.category as any,
    icon: row.icon,
    permissions: JSON.parse(row.permissions || '[]'),
  }));
}

/**
 * 获取拥有某Skill的所有Agents
 */
export function getAgentsWithSkill(skillId: string): string[] {
  const rows = db.prepare(`
    SELECT agent_id FROM agent_skills WHERE skill_id = ?
  `).all(skillId) as { agent_id: string }[];

  return rows.map(r => r.agent_id);
}

/**
 * 更新Agent的所有Skills（替换）
 */
export function updateAgentSkills(agentId: string, skillIds: string[]): boolean {
  try {
    // 先删除所有现有的
    db.prepare(`DELETE FROM agent_skills WHERE agent_id = ?`).run(agentId);

    // 再添加新的
    for (const skillId of skillIds) {
      grantSkillToAgent(agentId, skillId);
    }

    return true;
  } catch (error) {
    console.error('Update agent skills error:', error);
    return false;
  }
}

/**
 * 检查Agent是否拥有某个Skill
 */
export function agentHasSkill(agentId: string, skillId: string): boolean {
  const row = db.prepare(`
    SELECT id FROM agent_skills WHERE agent_id = ? AND skill_id = ?
  `).get(agentId, skillId);

  return !!row;
}

/**
 * 获取Agent的Skills统计
 */
export function getAgentSkillStats(agentId: string): {
  total: number;
  byCategory: Record<string, number>;
} {
  const skills = getAgentSkills(agentId);
  const byCategory: Record<string, number> = {};

  for (const skill of skills) {
    byCategory[skill.category] = (byCategory[skill.category] || 0) + 1;
  }

  return {
    total: skills.length,
    byCategory,
  };
}