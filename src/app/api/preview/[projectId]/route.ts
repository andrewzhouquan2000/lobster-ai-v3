import { NextRequest, NextResponse } from 'next/server';
import { CoderAgent } from '@/lib/agents/coder-agent';
import path from 'path';
import fs from 'fs';

const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), 'generated-projects');

/**
 * 预览 API - 获取项目信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // 获取项目文件列表
  const files = CoderAgent.getProjectFiles(projectId);

  if (files.length === 0) {
    return NextResponse.json({
      error: '项目不存在或没有文件',
      projectId,
    }, { status: 404 });
  }

  // 读取主要文件
  const mainFiles: Record<string, string> = {};
  
  // 优先读取入口文件
  const entryFiles = [
    'src/app/page.tsx',
    'src/app/page.jsx',
    'src/pages/index.tsx',
    'src/pages/index.js',
    'index.html',
    'package.json',
  ];

  for (const entry of entryFiles) {
    const content = CoderAgent.readProjectFile(projectId, entry);
    if (content) {
      mainFiles[entry] = content;
    }
  }

  // 如果没有入口文件，读取第一个文件
  if (Object.keys(mainFiles).length === 0 && files.length > 0) {
    const firstFile = files[0];
    const content = CoderAgent.readProjectFile(projectId, firstFile);
    if (content) {
      mainFiles[firstFile] = content;
    }
  }

  return NextResponse.json({
    projectId,
    files,
    mainFiles,
    previewUrl: `/preview/${projectId}/view`,
  });
}

/**
 * 获取单个文件内容
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  
  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json({ error: '缺少文件路径' }, { status: 400 });
    }

    const content = CoderAgent.readProjectFile(projectId, filePath);
    
    if (content === null) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    return NextResponse.json({
      filePath,
      content,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : '读取失败',
    }, { status: 500 });
  }
}