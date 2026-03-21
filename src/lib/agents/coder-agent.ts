/**
 * Coder Agent - 实际执行开发任务的 AI Agent
 * 
 * 负责：
 * 1. 接收 CEO 分配的任务
 * 2. 使用 LLM 生成代码
 * 3. 创建项目文件
 * 4. 返回开发结果
 */
import { updateAgentTaskStatus, getAgentTaskById } from '@/lib/db/project-state';
import { createMessage, getMessagesByProject } from '@/lib/db/projects';
import fs from 'fs';
import path from 'path';

const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || '';
const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), 'generated-projects');

// Coder Agent 系统提示
const CODER_SYSTEM_PROMPT = `你是一位资深全栈工程师，负责根据需求生成高质量的代码。

## 你的能力
- 前端：React、Next.js、Vue、Tailwind CSS
- 后端：Node.js、Python、Go
- 数据库：PostgreSQL、MongoDB、SQLite
- 部署：Vercel、Netlify、Docker

## 输出格式
当需要生成代码时，使用以下格式：

\`\`\`file:path/to/file.ext
// 文件内容
\`\`\`

例如：
\`\`\`file:src/app/page.tsx
export default function Home() {
  return <div>Hello World</div>
}
\`\`\`

## 工作原则
1. 生成可运行的代码
2. 遵循最佳实践
3. 添加必要的注释
4. 确保代码安全性`;

/**
 * Coder Agent 类
 */
export class CoderAgent {
  private projectId: string;
  private taskId: string;
  private projectDir: string;

  constructor(projectId: string, taskId: string) {
    this.projectId = projectId;
    this.taskId = taskId;
    this.projectDir = path.join(PROJECTS_DIR, projectId);
  }

  /**
   * 执行开发任务
   */
  async executeTask(taskDescription: string, context?: {
    projectName?: string;
    requirements?: string;
    existingFiles?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    files?: string[];
    previewUrl?: string;
  }> {
    try {
      // 更新任务状态为进行中
      updateAgentTaskStatus(this.taskId, 'in_progress');

      // 构建提示
      const prompt = this.buildPrompt(taskDescription, context);

      // 调用 LLM 生成代码
      const response = await this.callLlm(prompt);

      // 解析生成的文件
      const files = this.parseGeneratedFiles(response);

      if (files.length === 0) {
        // 没有生成文件，可能只是分析或建议
        updateAgentTaskStatus(this.taskId, 'completed', response);
        return {
          success: true,
          message: response,
        };
      }

      // 写入文件
      await this.writeFiles(files);

      // 更新任务状态为完成
      const fileList = files.map(f => f.path).join('\n');
      updateAgentTaskStatus(this.taskId, 'completed', `已生成以下文件：\n${fileList}`);

      // 生成预览 URL
      const previewUrl = await this.generatePreviewUrl();

      return {
        success: true,
        message: `开发完成！已生成 ${files.length} 个文件。`,
        files: files.map(f => f.path),
        previewUrl,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      updateAgentTaskStatus(this.taskId, 'failed', errorMsg);
      return {
        success: false,
        message: `开发失败：${errorMsg}`,
      };
    }
  }

  /**
   * 构建提示
   */
  private buildPrompt(task: string, context?: {
    projectName?: string;
    requirements?: string;
    existingFiles?: string[];
  }): string {
    let prompt = `## 任务
${task}

`;

    if (context?.projectName) {
      prompt += `## 项目名称
${context.projectName}

`;
    }

    if (context?.requirements) {
      prompt += `## 需求描述
${context.requirements}

`;
    }

    if (context?.existingFiles && context.existingFiles.length > 0) {
      prompt += `## 已有文件
${context.existingFiles.join('\n')}

`;
    }

    prompt += `## 要求
请生成完整的、可运行的代码。使用 Next.js + React + Tailwind CSS 技术栈。
确保包含 package.json 和必要的配置文件。`;

    return prompt;
  }

  /**
   * 调用 LLM
   */
  private async callLlm(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GATEWAY_TOKEN}`,
        },
        body: JSON.stringify({
          model: 'glm-5',
          messages: [
            { role: 'system', content: CODER_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }

      throw new Error(`LLM 调用失败: ${response.status}`);
    } catch (error) {
      console.error('Call LLM error:', error);
      throw error;
    }
  }

  /**
   * 解析生成的文件
   */
  private parseGeneratedFiles(content: string): { path: string; content: string }[] {
    const files: { path: string; content: string }[] = [];
    
    // 匹配 ```file:path 格式的代码块
    const fileRegex = /```file:([^\n]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = fileRegex.exec(content)) !== null) {
      const filePath = match[1].trim();
      const fileContent = match[2].trim();
      files.push({ path: filePath, content: fileContent });
    }

    // 如果没有匹配到 file: 格式，尝试匹配标准代码块并智能推断文件名
    if (files.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let blockMatch;
      let blockIndex = 0;

      while ((blockMatch = codeBlockRegex.exec(content)) !== null) {
        const lang = blockMatch[1] || 'txt';
        const code = blockMatch[2].trim();

        // 根据语言和内容推断文件名
        let fileName = this.inferFileName(lang, code, blockIndex);
        files.push({ path: fileName, content: code });
        blockIndex++;
      }
    }

    return files;
  }

  /**
   * 推断文件名
   */
  private inferFileName(lang: string, content: string, index: number): string {
    // 根据内容特征推断
    if (content.includes('export default') || content.includes('import React')) {
      if (content.includes('page') || content.includes('Page')) {
        return `src/app/page.tsx`;
      }
      if (content.includes('layout') || content.includes('Layout')) {
        return `src/app/layout.tsx`;
      }
      return `src/components/Component${index}.tsx`;
    }

    if (content.includes('"name":') && content.includes('"dependencies"')) {
      return 'package.json';
    }

    if (content.includes('tailwind') || content.includes('module.exports')) {
      return 'tailwind.config.js';
    }

    if (content.includes('nextConfig')) {
      return 'next.config.js';
    }

    // 根据语言推断
    const langMap: Record<string, string> = {
      typescript: `src/index.ts`,
      javascript: `src/index.js`,
      tsx: `src/app/page.tsx`,
      jsx: `src/app/page.jsx`,
      css: `src/app/globals.css`,
      json: 'package.json',
      html: 'index.html',
      python: 'main.py',
      go: 'main.go',
    };

    return langMap[lang] || `file_${index}.${lang}`;
  }

  /**
   * 写入文件
   */
  private async writeFiles(files: { path: string; content: string }[]): Promise<void> {
    // 确保项目目录存在
    if (!fs.existsSync(this.projectDir)) {
      fs.mkdirSync(this.projectDir, { recursive: true });
    }

    for (const file of files) {
      const fullPath = path.join(this.projectDir, file.path);
      const dir = path.dirname(fullPath);

      // 确保目录存在
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(fullPath, file.content, 'utf-8');
      console.log(`Created file: ${fullPath}`);
    }
  }

  /**
   * 生成预览 URL
   */
  private async generatePreviewUrl(): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/preview/${this.projectId}`;
  }

  /**
   * 获取项目文件列表
   */
  static getProjectFiles(projectId: string): string[] {
    const projectDir = path.join(PROJECTS_DIR, projectId);
    if (!fs.existsSync(projectDir)) {
      return [];
    }

    const files: string[] = [];
    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else {
          files.push(path.relative(projectDir, fullPath));
        }
      }
    };
    scanDir(projectDir);
    return files;
  }

  /**
   * 读取项目文件
   */
  static readProjectFile(projectId: string, filePath: string): string | null {
    const fullPath = path.join(PROJECTS_DIR, projectId, filePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }
}

/**
 * 执行 Coder Agent 任务
 */
export async function executeCoderTask(
  projectId: string,
  taskId: string,
  taskDescription: string,
  context?: {
    projectName?: string;
    requirements?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  files?: string[];
  previewUrl?: string;
}> {
  const coder = new CoderAgent(projectId, taskId);
  return await coder.executeTask(taskDescription, context);
}