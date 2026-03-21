import db from './index';
import { randomUUID } from 'crypto';

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'deleted';
  settings: any;
  openclaw_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string;
  user_id: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: any;
  created_at: string;
}

export interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invited_by: string | null;
  joined_at: string;
}

// Project operations
export function createProject(ownerId: string, name: string, description?: string): Project {
  const projectId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO projects (id, owner_id, name, description, status, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', '{}', ?, ?)
  `).run(projectId, ownerId, name, description || null, now, now);

  // Add owner as team member
  db.prepare(`
    INSERT INTO team_members (id, project_id, user_id, role, joined_at)
    VALUES (?, ?, ?, 'owner', ?)
  `).run(randomUUID(), projectId, ownerId, now);

  return getProjectById(projectId)!;
}

export function getProjectById(id: string): Project | undefined {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
  if (!row) return undefined;

  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    description: row.description,
    status: row.status,
    settings: JSON.parse(row.settings || '{}'),
    openclaw_session_id: row.openclaw_session_id || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getProjectsByOwner(ownerId: string): Project[] {
  const rows = db.prepare(`
    SELECT * FROM projects 
    WHERE owner_id = ? AND status = 'active'
    ORDER BY updated_at DESC
  `).all(ownerId) as any[];

  return rows.map(row => ({
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    description: row.description,
    status: row.status,
    settings: JSON.parse(row.settings || '{}'),
    openclaw_session_id: row.openclaw_session_id || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export function updateProject(id: string, updates: Partial<Project>): Project | undefined {
  const project = getProjectById(id);
  if (!project) return undefined;

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.settings !== undefined) {
    fields.push('settings = ?');
    values.push(JSON.stringify(updates.settings));
  }
  if (updates.openclaw_session_id !== undefined) {
    fields.push('openclaw_session_id = ?');
    values.push(updates.openclaw_session_id);
  }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return getProjectById(id);
}

/**
 * 更新项目的 OpenClaw Session ID
 */
export function updateProjectSession(projectId: string, sessionId: string | null): void {
  db.prepare(`
    UPDATE projects SET openclaw_session_id = ?, updated_at = ? WHERE id = ?
  `).run(sessionId, new Date().toISOString(), projectId);
}

export function deleteProject(id: string): boolean {
  const result = db.prepare("UPDATE projects SET status = 'deleted', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), id);
  return result.changes > 0;
}

// Message operations
export function createMessage(
  projectId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  userId?: string | null,
  metadata?: any
): Message {
  const messageId = randomUUID();
  const now = new Date().toISOString();

  // 确保 userId 为 null 而不是 undefined，以符合外键约束
  // 外键约束允许 NULL 值，但不允许无效的非 NULL 值
  const effectiveUserId = userId || null;

  db.prepare(`
    INSERT INTO messages (id, project_id, user_id, role, content, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(messageId, projectId, effectiveUserId, role, content, JSON.stringify(metadata || {}), now);

  // Update project updated_at
  db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(now, projectId);

  return getMessageById(messageId)!;
}

export function getMessageById(id: string): Message | undefined {
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
  if (!row) return undefined;

  return {
    id: row.id,
    project_id: row.project_id,
    user_id: row.user_id,
    role: row.role,
    content: row.content,
    metadata: JSON.parse(row.metadata || '{}'),
    created_at: row.created_at,
  };
}

export function getMessagesByProject(projectId: string, limit = 100): Message[] {
  const rows = db.prepare(`
    SELECT * FROM messages 
    WHERE project_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `).all(projectId, limit) as any[];

  return rows.map(row => ({
    id: row.id,
    project_id: row.project_id,
    user_id: row.user_id,
    role: row.role,
    content: row.content,
    metadata: JSON.parse(row.metadata || '{}'),
    created_at: row.created_at,
  }));
}

// Team member operations
export function getTeamMembers(projectId: string): TeamMember[] {
  const rows = db.prepare(`
    SELECT * FROM team_members WHERE project_id = ?
  `).all(projectId) as any[];

  return rows.map(row => ({
    id: row.id,
    project_id: row.project_id,
    user_id: row.user_id,
    role: row.role,
    invited_by: row.invited_by,
    joined_at: row.joined_at,
  }));
}

export function addTeamMember(
  projectId: string,
  userId: string,
  role: 'admin' | 'member' | 'viewer' = 'member',
  invitedBy?: string
): TeamMember {
  const memberId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO team_members (id, project_id, user_id, role, invited_by, joined_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(memberId, projectId, userId, role, invitedBy || null, now);

  return {
    id: memberId,
    project_id: projectId,
    user_id: userId,
    role,
    invited_by: invitedBy || null,
    joined_at: now,
  };
}