/**
 * Project State Management - 项目状态和 CEO Agent 管理
 */
import db from './index';
import { randomUUID } from 'crypto';

// 项目阶段
export type ProjectPhase = 
  | 'init'           // 初始化
  | 'requirement'    // 需求收集
  | 'planning'       // 规划中
  | 'development'    // 开发中
  | 'review'         // 审核中
  | 'deploying'      // 部署中
  | 'completed'      // 已完成
  | 'paused';        // 暂停

// 项目状态
export interface ProjectState {
  id: string;
  project_id: string;
  phase: ProjectPhase;
  ceo_message: string | null;      // CEO 的初始化消息
  current_task: string | null;      // 当前任务描述
  assigned_agents: string;          // JSON: 已分配的 Agent 列表
  progress: number;                 // 0-100
  deploy_url: string | null;        // 部署链接
  deploy_status: string | null;     // 部署状态
  created_at: string;
  updated_at: string;
}

// Agent 任务状态
export interface AgentTask {
  id: string;
  project_id: string;
  agent_id: string;                 // Agent ID (如 dev-fe-01)
  agent_name: string;               // Agent 名称
  task_description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result: string | null;
  created_at: string;
  completed_at: string | null;
}

// 需求收集记录
export interface RequirementRecord {
  id: string;
  project_id: string;
  question: string;
  answer: string | null;
  asked_at: string;
  answered_at: string | null;
}

/**
 * 初始化项目状态（创建项目时调用）
 */
export function initProjectState(projectId: string): ProjectState {
  const id = randomUUID();
  const now = new Date().toISOString();

  // CEO 的初始化消息
  const ceoMessage = `你好！我是你的 CEO AI，负责协调整个项目开发流程。

我注意到这是一个新项目，在开始之前，我需要了解一些细节：

1. **项目目标**：这个项目的核心目标是什么？想解决什么问题？
2. **目标用户**：谁会使用这个产品？
3. **功能范围**：希望包含哪些核心功能？

请告诉我你的想法，我会帮你整理需求并组建最适合的开发团队。`;

  db.prepare(`
    INSERT INTO project_states (
      id, project_id, phase, ceo_message, current_task, 
      assigned_agents, progress, created_at, updated_at
    )
    VALUES (?, ?, 'init', ?, NULL, '[]', 0, ?, ?)
  `).run(id, projectId, ceoMessage, now, now);

  return getProjectStateById(id)!;
}

/**
 * 获取项目状态
 */
export function getProjectStateById(id: string): ProjectState | undefined {
  const row = db.prepare('SELECT * FROM project_states WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return mapRowToProjectState(row);
}

/**
 * 获取项目的状态
 */
export function getProjectStateByProjectId(projectId: string): ProjectState | undefined {
  const row = db.prepare('SELECT * FROM project_states WHERE project_id = ?').get(projectId) as any;
  if (!row) return undefined;
  return mapRowToProjectState(row);
}

/**
 * 更新项目阶段
 */
export function updateProjectPhase(projectId: string, phase: ProjectPhase, currentTask?: string): void {
  const now = new Date().toISOString();
  const updates: string[] = ['phase = ?', 'updated_at = ?'];
  const values: any[] = [phase, now];

  if (currentTask !== undefined) {
    updates.push('current_task = ?');
    values.push(currentTask);
  }

  values.push(projectId);
  db.prepare(`UPDATE project_states SET ${updates.join(', ')} WHERE project_id = ?`).run(...values);
}

/**
 * 更新 CEO 消息
 */
export function updateCeoMessage(projectId: string, message: string): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE project_states SET ceo_message = ?, updated_at = ? WHERE project_id = ?
  `).run(message, now, projectId);
}

/**
 * 分配 Agent
 */
export function assignAgents(projectId: string, agentIds: string[]): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE project_states SET assigned_agents = ?, updated_at = ? WHERE project_id = ?
  `).run(JSON.stringify(agentIds), now, projectId);
}

/**
 * 更新进度
 */
export function updateProgress(projectId: string, progress: number): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE project_states SET progress = ?, updated_at = ? WHERE project_id = ?
  `).run(Math.min(100, Math.max(0, progress)), now, projectId);
}

/**
 * 设置部署 URL
 */
export function setDeployUrl(projectId: string, url: string, status: string): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE project_states SET deploy_url = ?, deploy_status = ?, phase = 'completed', progress = 100, updated_at = ? 
    WHERE project_id = ?
  `).run(url, status, now, projectId);
}

/**
 * 创建 Agent 任务
 */
export function createAgentTask(
  projectId: string,
  agentId: string,
  agentName: string,
  taskDescription: string
): AgentTask {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO agent_tasks (id, project_id, agent_id, agent_name, task_description, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, projectId, agentId, agentName, taskDescription, now);

  return getAgentTaskById(id)!;
}

/**
 * 获取 Agent 任务
 */
export function getAgentTaskById(id: string): AgentTask | undefined {
  const row = db.prepare('SELECT * FROM agent_tasks WHERE id = ?').get(id) as any;
  if (!row) return undefined;
  return mapRowToAgentTask(row);
}

/**
 * 获取项目的所有 Agent 任务
 */
export function getAgentTasksByProject(projectId: string): AgentTask[] {
  const rows = db.prepare(`
    SELECT * FROM agent_tasks WHERE project_id = ? ORDER BY created_at ASC
  `).all(projectId) as any[];
  return rows.map(mapRowToAgentTask);
}

/**
 * 更新 Agent 任务状态
 */
export function updateAgentTaskStatus(
  taskId: string, 
  status: AgentTask['status'],
  result?: string
): void {
  const now = new Date().toISOString();
  const updates: string[] = ['status = ?'];
  const values: any[] = [status];

  if (result !== undefined) {
    updates.push('result = ?');
    values.push(result);
  }

  if (status === 'completed' || status === 'failed') {
    updates.push('completed_at = ?');
    values.push(now);
  }

  values.push(taskId);
  db.prepare(`UPDATE agent_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
}

/**
 * 添加需求问答
 */
export function addRequirementQa(projectId: string, question: string): RequirementRecord {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO requirement_records (id, project_id, question, asked_at)
    VALUES (?, ?, ?, ?)
  `).run(id, projectId, question, now);

  return {
    id,
    project_id: projectId,
    question,
    answer: null,
    asked_at: now,
    answered_at: null,
  };
}

/**
 * 回答需求问题
 */
export function answerRequirement(projectId: string, question: string, answer: string): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE requirement_records SET answer = ?, answered_at = ? 
    WHERE project_id = ? AND question = ?
  `).run(answer, now, projectId, question);
}

/**
 * 获取项目的需求记录
 */
export function getRequirementRecords(projectId: string): RequirementRecord[] {
  const rows = db.prepare(`
    SELECT * FROM requirement_records WHERE project_id = ? ORDER BY asked_at ASC
  `).all(projectId) as any[];

  return rows.map(row => ({
    id: row.id,
    project_id: row.project_id,
    question: row.question,
    answer: row.answer,
    asked_at: row.asked_at,
    answered_at: row.answered_at,
  }));
}

// Helper functions
function mapRowToProjectState(row: any): ProjectState {
  return {
    id: row.id,
    project_id: row.project_id,
    phase: row.phase,
    ceo_message: row.ceo_message,
    current_task: row.current_task,
    assigned_agents: row.assigned_agents,
    progress: row.progress,
    deploy_url: row.deploy_url,
    deploy_status: row.deploy_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapRowToAgentTask(row: any): AgentTask {
  return {
    id: row.id,
    project_id: row.project_id,
    agent_id: row.agent_id,
    agent_name: row.agent_name,
    task_description: row.task_description,
    status: row.status,
    result: row.result,
    created_at: row.created_at,
    completed_at: row.completed_at,
  };
}

// 初始化数据库表
db.exec(`
  CREATE TABLE IF NOT EXISTS project_states (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE,
    phase TEXT DEFAULT 'init',
    ceo_message TEXT,
    current_task TEXT,
    assigned_agents TEXT DEFAULT '[]',
    progress INTEGER DEFAULT 0,
    deploy_url TEXT,
    deploy_status TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE INDEX IF NOT EXISTS idx_project_states_project ON project_states(project_id);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS agent_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    task_description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    result TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE INDEX IF NOT EXISTS idx_agent_tasks_project ON agent_tasks(project_id);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS requirement_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    asked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    answered_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE INDEX IF NOT EXISTS idx_requirement_records_project ON requirement_records(project_id);
`);