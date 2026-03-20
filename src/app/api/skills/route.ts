import { NextRequest, NextResponse } from 'next/server';
import {
  initializeSkills,
  getAllSkills,
  getSkillsByCategoryDb,
  getAgentSkills,
  grantSkillToAgent,
  revokeSkillFromAgent,
  updateAgentSkills,
} from '@/lib/db/skills';
import { getUserFromToken } from '@/lib/auth';

// 初始化Skills（首次调用时）
let skillsInitialized = false;

function ensureSkillsInitialized() {
  if (!skillsInitialized) {
    try {
      initializeSkills();
      skillsInitialized = true;
    } catch (error) {
      console.error('Failed to initialize skills:', error);
    }
  }
}

// GET - 获取Skills列表或Agent的Skills
export async function GET(request: NextRequest) {
  try {
    ensureSkillsInitialized();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const agentId = searchParams.get('agentId');

    // 获取特定Agent的Skills
    if (agentId) {
      const skills = getAgentSkills(agentId);
      return NextResponse.json({ skills });
    }

    // 获取特定分类的Skills
    if (category) {
      const skills = getSkillsByCategoryDb(category);
      return NextResponse.json({ skills });
    }

    // 获取所有Skills
    const skills = getAllSkills();
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 为Agent分配Skills
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, skillIds, action } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }

    if (action === 'update' && Array.isArray(skillIds)) {
      // 更新Agent的所有Skills（替换模式）
      const success = updateAgentSkills(agentId, skillIds);
      return NextResponse.json({ success, count: skillIds.length });
    }

    if (action === 'grant' && skillIds) {
      // 单个或批量授权
      const ids = Array.isArray(skillIds) ? skillIds : [skillIds];
      let count = 0;
      for (const skillId of ids) {
        if (grantSkillToAgent(agentId, skillId)) {
          count++;
        }
      }
      return NextResponse.json({ success: true, granted: count });
    }

    if (action === 'revoke' && skillIds) {
      // 单个或批量撤销
      const ids = Array.isArray(skillIds) ? skillIds : [skillIds];
      let count = 0;
      for (const skillId of ids) {
        if (revokeSkillFromAgent(agentId, skillId)) {
          count++;
        }
      }
      return NextResponse.json({ success: true, revoked: count });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Skills operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}