import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProjectById } from '@/lib/db/projects';
import { getProjectStateByProjectId, initProjectState } from '@/lib/db/project-state';
import { getCeoAgent } from '@/lib/agents/ceo-workflow';

/**
 * CEO Agent 对话 API
 */
export async function POST(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, message } = body;

    if (!projectId || !message) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    // 验证项目所有权
    const project = getProjectById(projectId);
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ error: '项目不存在或无权限' }, { status: 403 });
    }

    // 确保项目状态已初始化
    let state = getProjectStateByProjectId(projectId);
    if (!state) {
      initProjectState(projectId);
    }

    // 获取 CEO Agent 并处理消息
    const ceoAgent = getCeoAgent(projectId, project.name);
    const response = await ceoAgent.processUserMessage(message);

    // 获取更新后的状态
    const updatedState = getProjectStateByProjectId(projectId);

    return NextResponse.json({
      success: true,
      response,
      state: updatedState ? {
        phase: updatedState.phase,
        progress: updatedState.progress,
        deploy_url: updatedState.deploy_url,
      } : null,
    });
  } catch (error) {
    console.error('CEO chat error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '处理失败' 
    }, { status: 500 });
  }
}