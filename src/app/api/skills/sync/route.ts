/**
 * Skills 同步 API
 * 从 OpenClaw 同步 skills 到数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncOpenClawSkills, getSyncStatus } from '@/lib/sync-openclaw-skills';
import { getUserFromToken } from '@/lib/auth';

/**
 * POST - 同步 OpenClaw Skills
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户权限（可选）
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = syncOpenClawSkills();
    
    return NextResponse.json({
      success: true,
      message: `同步完成: 新增 ${result.added}, 更新 ${result.updated}, 总计 ${result.total}`,
      ...result,
    });
  } catch (error) {
    console.error('Sync skills error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync skills',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - 获取同步状态
 */
export async function GET(request: NextRequest) {
  try {
    const status = getSyncStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json({ 
      error: 'Failed to get sync status' 
    }, { status: 500 });
  }
}