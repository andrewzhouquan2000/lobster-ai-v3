/**
 * Conversation Management - SQLite 实现
 * 对话和消息持久化
 */
import db from './index';
import { randomUUID } from 'crypto';

export interface Conversation {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string | null;
  status: 'active' | 'archived' | 'deleted';
  openclaw_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: string; // JSON
  created_at: string;
}

/**
 * 创建新对话
 */
export function createConversation(
  userId: string, 
  projectId?: string, 
  title?: string
): Conversation {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO conversations (id, user_id, project_id, title, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `).run(id, userId, projectId || null, title || null, now, now);

  return getConversationById(id)!;
}

/**
 * 获取对话
 */
export function getConversationById(id: string): Conversation | undefined {
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
  if (!row) return undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    title: row.title,
    status: row.status,
    openclaw_session_id: row.openclaw_session_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * 获取用户的对话列表
 */
export function getConversationsByUser(userId: string, limit = 50): Conversation[] {
  const rows = db.prepare(`
    SELECT * FROM conversations 
    WHERE user_id = ? AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT ?
  `).all(userId, limit) as any[];

  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    title: row.title,
    status: row.status,
    openclaw_session_id: row.openclaw_session_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

/**
 * 更新对话的 OpenClaw Session ID
 */
export function updateConversationSession(
  conversationId: string, 
  sessionId: string | null
): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE conversations 
    SET openclaw_session_id = ?, updated_at = ? 
    WHERE id = ?
  `).run(sessionId, now, conversationId);
}

/**
 * 更新对话标题
 */
export function updateConversationTitle(
  conversationId: string, 
  title: string
): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE conversations 
    SET title = ?, updated_at = ? 
    WHERE id = ?
  `).run(title, now, conversationId);
}

/**
 * 归档对话
 */
export function archiveConversation(conversationId: string): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE conversations 
    SET status = 'archived', updated_at = ? 
    WHERE id = ?
  `).run(now, conversationId);
  
  return result.changes > 0;
}

/**
 * 添加消息
 */
export function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Record<string, unknown>
): ConversationMessage {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO conversation_messages (id, conversation_id, role, content, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, conversationId, role, content, JSON.stringify(metadata || {}), now);

  // 更新对话的 updated_at
  db.prepare(`
    UPDATE conversations SET updated_at = ? WHERE id = ?
  `).run(now, conversationId);

  return getMessageById(id)!;
}

/**
 * 获取消息
 */
export function getMessageById(id: string): ConversationMessage | undefined {
  const row = db.prepare('SELECT * FROM conversation_messages WHERE id = ?').get(id) as any;
  if (!row) return undefined;

  return {
    id: row.id,
    conversation_id: row.conversation_id,
    role: row.role,
    content: row.content,
    metadata: row.metadata,
    created_at: row.created_at,
  };
}

/**
 * 获取对话的所有消息
 */
export function getMessagesByConversation(
  conversationId: string, 
  limit = 100
): ConversationMessage[] {
  const rows = db.prepare(`
    SELECT * FROM conversation_messages 
    WHERE conversation_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `).all(conversationId, limit) as any[];

  return rows.map(row => ({
    id: row.id,
    conversation_id: row.conversation_id,
    role: row.role,
    content: row.content,
    metadata: row.metadata,
    created_at: row.created_at,
  }));
}

/**
 * 删除对话的所有消息（用于重新生成）
 */
export function deleteMessagesFromConversation(conversationId: string): boolean {
  const result = db.prepare(`
    DELETE FROM conversation_messages WHERE conversation_id = ?
  `).run(conversationId);
  
  return result.changes >= 0;
}

/**
 * 获取或创建项目关联的对话
 */
export function getOrCreateConversationForProject(
  userId: string,
  projectId: string,
  title?: string
): Conversation {
  // 尝试查找现有对话
  const existing = db.prepare(`
    SELECT * FROM conversations 
    WHERE user_id = ? AND project_id = ? AND status = 'active'
    LIMIT 1
  `).get(userId, projectId) as any;

  if (existing) {
    return {
      id: existing.id,
      user_id: existing.user_id,
      project_id: existing.project_id,
      title: existing.title,
      status: existing.status,
      openclaw_session_id: existing.openclaw_session_id,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
    };
  }

  // 创建新对话
  return createConversation(userId, projectId, title);
}