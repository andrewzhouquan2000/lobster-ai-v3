/**
 * Agent Team Management - SQLite 实现
 * 用户的 AI 员工团队管理
 */
import db from './index';
import { randomUUID } from 'crypto';

export interface AgentTeamMember {
  id: string;
  user_id: string;
  agent_id: string;
  status: 'active' | 'inactive';
  added_at: string;
}

/**
 * 获取用户的团队成员列表
 */
export function getAgentTeamByUser(userId: string): AgentTeamMember[] {
  const rows = db.prepare(`
    SELECT * FROM agent_team 
    WHERE user_id = ? AND status = 'active'
    ORDER BY added_at DESC
  `).all(userId) as any[];

  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    agent_id: row.agent_id,
    status: row.status,
    added_at: row.added_at,
  }));
}

/**
 * 添加 Agent 到团队
 */
export function addAgentToTeam(userId: string, agentId: string): AgentTeamMember | null {
  try {
    // 检查是否已存在
    const existing = db.prepare(`
      SELECT * FROM agent_team WHERE user_id = ? AND agent_id = ?
    `).get(userId, agentId) as any;

    if (existing) {
      // 已存在，更新状态为 active
      db.prepare(`
        UPDATE agent_team SET status = 'active' WHERE id = ?
      `).run(existing.id);
      
      return {
        id: existing.id,
        user_id: userId,
        agent_id: agentId,
        status: 'active',
        added_at: existing.added_at,
      };
    }

    // 新增
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO agent_team (id, user_id, agent_id, status, added_at)
      VALUES (?, ?, ?, 'active', ?)
    `).run(id, userId, agentId, now);

    return {
      id,
      user_id: userId,
      agent_id: agentId,
      status: 'active',
      added_at: now,
    };
  } catch (error) {
    console.error('Add agent to team error:', error);
    return null;
  }
}

/**
 * 从团队移除 Agent（设为 inactive）
 */
export function removeAgentFromTeam(userId: string, agentId: string): boolean {
  try {
    const result = db.prepare(`
      UPDATE agent_team SET status = 'inactive' 
      WHERE user_id = ? AND agent_id = ?
    `).run(userId, agentId);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Remove agent from team error:', error);
    return false;
  }
}

/**
 * 切换 Agent 状态
 */
export function toggleAgentStatus(
  userId: string, 
  agentId: string, 
  status: 'active' | 'inactive'
): boolean {
  try {
    const result = db.prepare(`
      UPDATE agent_team SET status = ? 
      WHERE user_id = ? AND agent_id = ?
    `).run(status, userId, agentId);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Toggle agent status error:', error);
    return false;
  }
}

/**
 * 检查 Agent 是否在用户团队中
 */
export function isAgentInTeam(userId: string, agentId: string): boolean {
  const row = db.prepare(`
    SELECT id FROM agent_team 
    WHERE user_id = ? AND agent_id = ? AND status = 'active'
  `).get(userId, agentId);
  
  return !!row;
}

/**
 * 批量添加 Agent 到团队
 */
export function addAgentsToTeam(userId: string, agentIds: string[]): number {
  let count = 0;
  for (const agentId of agentIds) {
    const result = addAgentToTeam(userId, agentId);
    if (result) count++;
  }
  return count;
}

/**
 * 获取团队统计
 */
export function getTeamStats(userId: string): { total: number; active: number } {
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM agent_team WHERE user_id = ?
  `).get(userId) as any;

  const active = db.prepare(`
    SELECT COUNT(*) as count FROM agent_team WHERE user_id = ? AND status = 'active'
  `).get(userId) as any;

  return {
    total: total?.count || 0,
    active: active?.count || 0,
  };
}