import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  getProjectStateByProjectId,
  getAgentTasksByProject,
  updateProjectPhase,
  initProjectState,
} from '@/lib/db/project-state';
import { getProjectById } from '@/lib/db/projects';

/**
 * 获取项目状态
 */
export async function GET(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: '缺少项目 ID' }, { status: 400 });
  }

  // 验证项目所有权
  const project = getProjectById(projectId);
  if (!project || project.owner_id !== user.id) {
    return NextResponse.json({ error: '项目不存在或无权限' }, { status: 403 });
  }

  // 获取项目状态
  let state = getProjectStateByProjectId(projectId);
  
  // 如果没有状态，初始化
  if (!state) {
    initProjectState(projectId);
    state = getProjectStateByProjectId(projectId);
  }

  // 获取任务列表
  const tasks = getAgentTasksByProject(projectId);

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
    },
    state: state ? {
      phase: state.phase,
      ceo_message: state.ceo_message,
      current_task: state.current_task,
      assigned_agents: JSON.parse(state.assigned_agents || '[]'),
      progress: state.progress,
      deploy_url: state.deploy_url,
      deploy_status: state.deploy_status,
    } : null,
    tasks,
  });
}

/**
 * 更新项目阶段
 */
export async function POST(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, phase, currentTask } = body;

    if (!projectId) {
      return NextResponse.json({ error: '缺少项目 ID' }, { status: 400 });
    }

    // 验证项目所有权
    const project = getProjectById(projectId);
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ error: '项目不存在或无权限' }, { status: 403 });
    }

    updateProjectPhase(projectId, phase, currentTask);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update project state error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}