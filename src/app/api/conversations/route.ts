import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  createConversation, 
  getConversationsByUser, 
  getConversationById,
  getOrCreateConversationForProject,
  updateConversationTitle,
  archiveConversation,
  addMessage,
  getMessagesByConversation
} from '@/lib/db/conversations';

/**
 * 获取用户的对话列表或单个对话的消息
 */
export async function GET(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('id');
  const projectId = searchParams.get('projectId');

  // 获取单个对话的消息
  if (conversationId) {
    const conversation = getConversationById(conversationId);
    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 });
    }

    const messages = getMessagesByConversation(conversationId);
    return NextResponse.json({ conversation, messages });
  }

  // 获取项目关联的对话
  if (projectId) {
    const conversation = getOrCreateConversationForProject(user.id, projectId);
    const messages = getMessagesByConversation(conversation.id);
    return NextResponse.json({ conversation, messages });
  }

  // 获取所有对话
  const conversations = getConversationsByUser(user.id);
  return NextResponse.json({ conversations });
}

/**
 * 创建新对话
 */
export async function POST(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { projectId, title } = body;

    const conversation = projectId 
      ? getOrCreateConversationForProject(user.id, projectId, title)
      : createConversation(user.id, undefined, title);

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

/**
 * 添加消息到对话
 */
export async function PUT(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId, role, content, metadata } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // 验证对话所有权
    const conversation = getConversationById(conversationId);
    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 });
    }

    const message = addMessage(conversationId, role, content, metadata);
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Add message error:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}

/**
 * 更新对话或归档
 */
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { conversationId, action, title } = body;

    if (!conversationId) {
      return NextResponse.json({ error: '缺少对话 ID' }, { status: 400 });
    }

    // 验证所有权
    const conversation = getConversationById(conversationId);
    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: '对话不存在' }, { status: 404 });
    }

    if (action === 'archive') {
      const success = archiveConversation(conversationId);
      return NextResponse.json({ success });
    }

    if (action === 'updateTitle' && title) {
      updateConversationTitle(conversationId, title);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}