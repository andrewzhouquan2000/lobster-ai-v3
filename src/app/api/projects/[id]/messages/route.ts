import { NextRequest, NextResponse } from 'next/server';
import { getMessagesByProject } from '@/lib/db/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  
  try {
    const messages = getMessagesByProject(projectId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 });
  }
}