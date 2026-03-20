import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  createProject, 
  getProjectsByOwner, 
  getProjectById, 
  updateProject,
  deleteProject
} from '@/lib/db/projects';
import { initProjectState } from '@/lib/db/project-state';

/**
 * 获取用户的项目列表
 */
export async function GET() {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const projects = getProjectsByOwner(user.id);
  return NextResponse.json({ projects });
}

/**
 * 创建新项目
 */
export async function POST(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, sessionId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    const project = createProject(user.id, name.trim(), description);
    
    if (!project) {
      return NextResponse.json({ error: '创建项目失败' }, { status: 500 });
    }

    // 初始化 CEO Agent 状态
    try {
      initProjectState(project.id);
    } catch (error) {
      console.error('Init CEO state error:', error);
    }

    // 如果提供了 OpenClaw Session ID，更新项目
    if (sessionId) {
      updateProject(project.id, { openclaw_session_id: sessionId });
    }

    return NextResponse.json({ 
      success: true, 
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        created_at: project.created_at,
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: '创建项目失败' }, { status: 500 });
  }
}

/**
 * 更新项目
 */
export async function PUT(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, updates } = body;

    if (!projectId) {
      return NextResponse.json({ error: '缺少项目 ID' }, { status: 400 });
    }

    // 验证项目所有权
    const project = getProjectById(projectId);
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ error: '项目不存在或无权限' }, { status: 403 });
    }

    const updated = updateProject(projectId, updates);
    
    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: '更新项目失败' }, { status: 500 });
  }
}

/**
 * 删除项目（软删除）
 */
export async function DELETE(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({ error: '缺少项目 ID' }, { status: 400 });
    }

    // 验证项目所有权
    const project = getProjectById(projectId);
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ error: '项目不存在或无权限' }, { status: 403 });
    }

    const success = deleteProject(projectId);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: '删除项目失败' }, { status: 500 });
  }
}