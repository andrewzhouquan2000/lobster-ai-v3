/**
 * Resources Database Operations - SQLite
 * 资源配置管理
 */
import db from './index';
import { randomUUID } from 'crypto';
import { resourceTypes, type ResourceType, type ResourceTypeInfo } from '@/data/skills';

export interface Resource {
  id: string;
  user_id: string;
  name: string;
  type: ResourceType;
  config: Record<string, any>;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DbResource {
  id: string;
  user_id: string;
  name: string;
  type: string;
  config: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * 创建资源
 */
export function createResource(
  userId: string,
  name: string,
  type: ResourceType,
  config: Record<string, any>
): Resource | null {
  try {
    const id = randomUUID();
    const now = new Date().toISOString();
    const configStr = JSON.stringify(config);

    db.prepare(`
      INSERT INTO resources (id, user_id, name, type, config, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(id, userId, name, type, configStr, now, now);

    return {
      id,
      user_id: userId,
      name,
      type,
      config,
      status: 'active',
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    console.error('Create resource error:', error);
    return null;
  }
}

/**
 * 获取用户的所有资源
 */
export function getResourcesByUser(userId: string): Resource[] {
  const rows = db.prepare(`
    SELECT * FROM resources WHERE user_id = ? ORDER BY created_at DESC
  `).all(userId) as DbResource[];

  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type as ResourceType,
    config: JSON.parse(row.config || '{}'),
    status: row.status as 'active' | 'inactive',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

/**
 * 按类型获取用户资源
 */
export function getResourcesByType(userId: string, type: ResourceType): Resource[] {
  const rows = db.prepare(`
    SELECT * FROM resources WHERE user_id = ? AND type = ? ORDER BY created_at DESC
  `).all(userId, type) as DbResource[];

  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type as ResourceType,
    config: JSON.parse(row.config || '{}'),
    status: row.status as 'active' | 'inactive',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

/**
 * 获取单个资源
 */
export function getResourceById(id: string): Resource | null {
  const row = db.prepare(`
    SELECT * FROM resources WHERE id = ?
  `).get(id) as DbResource | undefined;

  if (!row) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type as ResourceType,
    config: JSON.parse(row.config || '{}'),
    status: row.status as 'active' | 'inactive',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * 更新资源
 */
export function updateResource(
  id: string,
  updates: { name?: string; config?: Record<string, any>; status?: 'active' | 'inactive' }
): Resource | null {
  try {
    const now = new Date().toISOString();
    const existing = getResourceById(id);
    
    if (!existing) return null;

    const name = updates.name || existing.name;
    const config = updates.config || existing.config;
    const status = updates.status || existing.status;
    const configStr = JSON.stringify(config);

    db.prepare(`
      UPDATE resources 
      SET name = ?, config = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(name, configStr, status, now, id);

    return {
      ...existing,
      name,
      config,
      status,
      updated_at: now,
    };
  } catch (error) {
    console.error('Update resource error:', error);
    return null;
  }
}

/**
 * 删除资源
 */
export function deleteResource(id: string): boolean {
  try {
    const result = db.prepare(`DELETE FROM resources WHERE id = ?`).run(id);
    return result.changes > 0;
  } catch (error) {
    console.error('Delete resource error:', error);
    return false;
  }
}

/**
 * 获取用户的资源统计
 */
export function getResourceStats(userId: string): {
  total: number;
  active: number;
  byType: Record<string, number>;
} {
  const resources = getResourcesByUser(userId);
  const byType: Record<string, number> = {};

  for (const resource of resources) {
    byType[resource.type] = (byType[resource.type] || 0) + 1;
  }

  return {
    total: resources.length,
    active: resources.filter(r => r.status === 'active').length,
    byType,
  };
}

/**
 * 获取资源类型信息
 */
export function getResourceTypeList(): ResourceTypeInfo[] {
  return resourceTypes;
}

/**
 * 验证资源配置
 */
export function validateResourceConfig(
  type: ResourceType,
  config: Record<string, any>
): { valid: boolean; errors: string[] } {
  const typeInfo = resourceTypes.find(r => r.id === type);
  
  if (!typeInfo) {
    return { valid: false, errors: ['未知的资源类型'] };
  }

  const errors: string[] = [];

  for (const field of typeInfo.configFields) {
    if (!config[field.key] || config[field.key].trim() === '') {
      // 只有第一个字段通常是必填的
      if (typeInfo.configFields.indexOf(field) === 0) {
        errors.push(`${field.label} 不能为空`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}