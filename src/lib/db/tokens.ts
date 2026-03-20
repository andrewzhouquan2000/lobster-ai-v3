import db from './index';
import { randomUUID } from 'crypto';

// Token types
export type TokenType = 'github' | 'aliyun_oss' | 'feishu' | 'other';

export interface Token {
  id: string;
  user_id: string;
  name: string;
  type: TokenType;
  key_encrypted: string;
  status: 'active' | 'expired' | 'revoked';
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  token_id: string | null;
  provider: string;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  request_type: string | null;
  created_at: string;
}

export interface ResourceQuota {
  id: string;
  user_id: string;
  aliyun_balance: number;
  total_tokens_used: number;
  total_cost_usd: number;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  totalCalls: number;
  totalTokens: number;
  todayCalls: number;
  todayTokens: number;
  weekCalls: number;
  weekTokens: number;
  monthCalls: number;
  monthTokens: number;
}

// Simple encryption (for demo - in production use proper encryption)
function encryptKey(key: string): string {
  return Buffer.from(key).toString('base64');
}

function decryptKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

// Token operations
export function createToken(
  userId: string,
  name: string,
  type: TokenType,
  key: string
): Token {
  const tokenId = randomUUID();
  const now = new Date().toISOString();
  const encryptedKey = encryptKey(key);

  db.prepare(`
    INSERT INTO tokens (id, user_id, name, type, key_encrypted, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
  `).run(tokenId, userId, name, type, encryptedKey, now, now);

  return getTokenById(tokenId)!;
}

export function getTokenById(id: string): Token | undefined {
  const row = db.prepare('SELECT * FROM tokens WHERE id = ?').get(id) as any;
  if (!row) return undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    key_encrypted: row.key_encrypted,
    status: row.status,
    last_used_at: row.last_used_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getTokensByUser(userId: string): Token[] {
  const rows = db.prepare(`
    SELECT * FROM tokens 
    WHERE user_id = ? AND status != 'revoked'
    ORDER BY created_at DESC
  `).all(userId) as any[];

  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    key_encrypted: row.key_encrypted,
    status: row.status,
    last_used_at: row.last_used_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export function getTokenKey(id: string): string | null {
  const row = db.prepare('SELECT key_encrypted FROM tokens WHERE id = ?').get(id) as any;
  if (!row) return null;
  return decryptKey(row.key_encrypted);
}

export function updateTokenStatus(id: string, status: 'active' | 'expired' | 'revoked'): Token | undefined {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tokens SET status = ?, updated_at = ? WHERE id = ?
  `).run(status, now, id);

  return getTokenById(id);
}

export function updateTokenLastUsed(id: string): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tokens SET last_used_at = ?, updated_at = ? WHERE id = ?
  `).run(now, now, id);
}

export function deleteToken(id: string): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE tokens SET status = 'revoked', updated_at = ? WHERE id = ?
  `).run(now, id);
  return result.changes > 0;
}

// Usage log operations
export function createUsageLog(
  userId: string,
  provider: string,
  inputTokens: number,
  outputTokens: number,
  tokenId?: string,
  model?: string,
  requestType?: string,
  costUsd?: number
): UsageLog {
  const logId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO usage_logs (id, user_id, token_id, provider, model, input_tokens, output_tokens, total_tokens, cost_usd, request_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    logId,
    userId,
    tokenId || null,
    provider,
    model || null,
    inputTokens,
    outputTokens,
    inputTokens + outputTokens,
    costUsd || 0,
    requestType || null,
    now
  );

  // Update token last used if provided
  if (tokenId) {
    updateTokenLastUsed(tokenId);
  }

  return getUsageLogById(logId)!;
}

export function getUsageLogById(id: string): UsageLog | undefined {
  const row = db.prepare('SELECT * FROM usage_logs WHERE id = ?').get(id) as any;
  if (!row) return undefined;

  return {
    id: row.id,
    user_id: row.user_id,
    token_id: row.token_id,
    provider: row.provider,
    model: row.model,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    total_tokens: row.total_tokens,
    cost_usd: row.cost_usd,
    request_type: row.request_type,
    created_at: row.created_at,
  };
}

export function getUsageStats(userId: string): UsageStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Total stats
  const totalRow = db.prepare(`
    SELECT COUNT(*) as calls, COALESCE(SUM(total_tokens), 0) as tokens
    FROM usage_logs WHERE user_id = ?
  `).get(userId) as any;

  // Today stats
  const todayRow = db.prepare(`
    SELECT COUNT(*) as calls, COALESCE(SUM(total_tokens), 0) as tokens
    FROM usage_logs WHERE user_id = ? AND created_at >= ?
  `).get(userId, todayStart) as any;

  // Week stats
  const weekRow = db.prepare(`
    SELECT COUNT(*) as calls, COALESCE(SUM(total_tokens), 0) as tokens
    FROM usage_logs WHERE user_id = ? AND created_at >= ?
  `).get(userId, weekStart) as any;

  // Month stats
  const monthRow = db.prepare(`
    SELECT COUNT(*) as calls, COALESCE(SUM(total_tokens), 0) as tokens
    FROM usage_logs WHERE user_id = ? AND created_at >= ?
  `).get(userId, monthStart) as any;

  return {
    totalCalls: totalRow?.calls || 0,
    totalTokens: totalRow?.tokens || 0,
    todayCalls: todayRow?.calls || 0,
    todayTokens: todayRow?.tokens || 0,
    weekCalls: weekRow?.calls || 0,
    weekTokens: weekRow?.tokens || 0,
    monthCalls: monthRow?.calls || 0,
    monthTokens: monthRow?.tokens || 0,
  };
}

export function getUsageLogsByUser(userId: string, limit = 100): UsageLog[] {
  const rows = db.prepare(`
    SELECT * FROM usage_logs 
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as any[];

  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    token_id: row.token_id,
    provider: row.provider,
    model: row.model,
    input_tokens: row.input_tokens,
    output_tokens: row.output_tokens,
    total_tokens: row.total_tokens,
    cost_usd: row.cost_usd,
    request_type: row.request_type,
    created_at: row.created_at,
  }));
}

// Resource quota operations
export function getOrCreateResourceQuota(userId: string): ResourceQuota {
  let row = db.prepare('SELECT * FROM resource_quotas WHERE user_id = ?').get(userId) as any;

  if (!row) {
    const quotaId = randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO resource_quotas (id, user_id, aliyun_balance, total_tokens_used, total_cost_usd, created_at, updated_at)
      VALUES (?, ?, 0, 0, 0, ?, ?)
    `).run(quotaId, userId, now, now);

    row = db.prepare('SELECT * FROM resource_quotas WHERE user_id = ?').get(userId) as any;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    aliyun_balance: row.aliyun_balance,
    total_tokens_used: row.total_tokens_used,
    total_cost_usd: row.total_cost_usd,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function updateResourceQuota(
  userId: string,
  updates: { aliyun_balance?: number; total_tokens_used?: number; total_cost_usd?: number }
): ResourceQuota | undefined {
  const now = new Date().toISOString();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.aliyun_balance !== undefined) {
    fields.push('aliyun_balance = ?');
    values.push(updates.aliyun_balance);
  }
  if (updates.total_tokens_used !== undefined) {
    fields.push('total_tokens_used = ?');
    values.push(updates.total_tokens_used);
  }
  if (updates.total_cost_usd !== undefined) {
    fields.push('total_cost_usd = ?');
    values.push(updates.total_cost_usd);
  }

  if (fields.length > 0) {
    fields.push('updated_at = ?');
    values.push(now);
    values.push(userId);

    db.prepare(`UPDATE resource_quotas SET ${fields.join(', ')} WHERE user_id = ?`).run(...values);
  }

  return getOrCreateResourceQuota(userId);
}

// Get token type display info
export function getTokenTypeInfo(type: TokenType): { icon: string; label: string } {
  const typeMap: Record<TokenType, { icon: string; label: string }> = {
    github: { icon: '🐙', label: 'GitHub' },
    aliyun_oss: { icon: '☁️', label: 'Aliyun OSS' },
    feishu: { icon: '📄', label: '飞书' },
    other: { icon: '🔑', label: '其他' },
  };
  return typeMap[type];
}