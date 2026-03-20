import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  getAgentTeamByUser, 
  addAgentToTeam, 
  removeAgentFromTeam,
  toggleAgentStatus,
  isAgentInTeam,
  getTeamStats
} from '@/lib/db/agent-team';

/**
 * 获取用户的团队成员列表
 */
export async function GET() {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const members = getAgentTeamByUser(user.id);
  const stats = getTeamStats(user.id);
  
  return NextResponse.json({ 
    members,
    stats
  });
}

/**
 * 添加 Agent 到团队
 */
export async function POST(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId, agentIds } = body;

    // 批量添加
    if (agentIds && Array.isArray(agentIds)) {
      const count = agentIds.filter(id => addAgentToTeam(user.id, id)).length;
      return NextResponse.json({ 
        success: true, 
        added: count,
        total: agentIds.length 
      });
    }

    // 单个添加
    if (!agentId) {
      return NextResponse.json({ error: '缺少 Agent ID' }, { status: 400 });
    }

    const member = addAgentToTeam(user.id, agentId);
    
    if (!member) {
      return NextResponse.json({ error: '添加失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}

/**
 * 更新团队成员状态
 */
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { agentId, action, status } = body;

    if (!agentId) {
      return NextResponse.json({ error: '缺少 Agent ID' }, { status: 400 });
    }

    if (action === 'remove') {
      const success = removeAgentFromTeam(user.id, agentId);
      return NextResponse.json({ success });
    } else if (action === 'toggle' && status) {
      const success = toggleAgentStatus(user.id, agentId, status);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

/**
 * 从团队移除 Agent
 */
export async function DELETE(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json({ error: '缺少 Agent ID' }, { status: 400 });
    }

    const success = removeAgentFromTeam(user.id, agentId);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json({ error: '移除失败' }, { status: 500 });
  }
}