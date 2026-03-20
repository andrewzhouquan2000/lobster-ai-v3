/**
 * OpenClaw Skills 同步脚本
 * 将 OpenClaw 的 skills 同步到本地数据库
 */

import db from './db/index';
import { getAllOpenClawSkills, type OpenClawSkill } from './openclaw-skills';
import { randomUUID } from 'crypto';

/**
 * 同步 OpenClaw Skills 到数据库
 */
export function syncOpenClawSkills(): {
  added: number;
  updated: number;
  total: number;
} {
  const openClawSkills = getAllOpenClawSkills();
  let added = 0;
  let updated = 0;
  
  const insertStmt = db.prepare(`
    INSERT INTO skills (id, name, display_name, description, category, icon, permissions, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);
  
  const updateStmt = db.prepare(`
    UPDATE skills 
    SET display_name = ?, description = ?, category = ?, icon = ?
    WHERE name = ?
  `);
  
  const checkStmt = db.prepare(`SELECT id FROM skills WHERE name = ?`);
  
  for (const skill of openClawSkills) {
    const existing = checkStmt.get(skill.name) as { id: string } | undefined;
    
    if (existing) {
      // 更新现有记录
      updateStmt.run(
        skill.name,  // display_name
        skill.description,
        skill.category,
        skill.emoji,
        skill.name
      );
      updated++;
    } else {
      // 插入新记录
      const id = randomUUID();
      insertStmt.run(
        id,
        skill.name,
        skill.name,  // display_name
        skill.description,
        skill.category,
        skill.emoji,
        '[]'  // permissions
      );
      added++;
    }
  }
  
  return {
    added,
    updated,
    total: openClawSkills.length,
  };
}

/**
 * 获取同步状态
 */
export function getSyncStatus(): {
  openClawCount: number;
  dbCount: number;
  synced: boolean;
} {
  const openClawSkills = getAllOpenClawSkills();
  const dbResult = db.prepare(`SELECT COUNT(*) as count FROM skills`).get() as { count: number };
  
  return {
    openClawCount: openClawSkills.length,
    dbCount: dbResult.count,
    synced: openClawSkills.length === dbResult.count,
  };
}