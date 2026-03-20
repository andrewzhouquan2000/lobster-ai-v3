'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

interface ProjectData {
  projectId: string;
  files: string[];
  mainFiles: Record<string, string>;
  previewUrl: string;
}

export default function PreviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    fetchProject();
  }, [resolvedParams.projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/preview/${resolvedParams.projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        
        // 自动选择第一个主要文件
        const mainFiles = Object.keys(data.mainFiles);
        if (mainFiles.length > 0) {
          setSelectedFile(mainFiles[0]);
          setFileContent(data.mainFiles[mainFiles[0]]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    
    // 如果已经在 mainFiles 中，直接使用
    if (project?.mainFiles[filePath]) {
      setFileContent(project.mainFiles[filePath]);
      return;
    }

    // 否则从服务器获取
    try {
      const res = await fetch(`/api/preview/${resolvedParams.projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
      }
    } catch (error) {
      console.error('Failed to fetch file:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">加载项目预览...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">📁</p>
          <p className="text-gray-400">项目不存在或还没有生成文件</p>
          <p className="text-sm text-gray-500 mt-2">ID: {resolvedParams.projectId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦞</span>
            <div>
              <h1 className="font-semibold">项目预览</h1>
              <p className="text-xs text-gray-400">{project.projectId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {project.files.length} 个文件
            </span>
            <a
              href="/dashboard"
              className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
            >
              返回
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* File Tree */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 overflow-auto">
          <div className="p-2">
            <p className="text-xs text-gray-400 px-2 py-1">文件列表</p>
            {project.files.map((file) => (
              <button
                key={file}
                onClick={() => handleFileSelect(file)}
                className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors ${
                  selectedFile === file ? 'bg-gray-700 text-orange-400' : 'text-gray-300'
                }`}
              >
                <span>{getFileIcon(file)}</span>
                <span className="truncate">{file}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-auto">
          {selectedFile && fileContent ? (
            <div className="p-4">
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-4 py-2 text-sm text-gray-300 border-b border-gray-600">
                  {selectedFile}
                </div>
                <pre className="p-4 text-sm overflow-auto">
                  <code className="text-gray-300">{fileContent}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-4xl mb-2">📄</p>
                <p>选择文件查看内容</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    tsx: '⚛️',
    ts: '📘',
    jsx: '⚛️',
    js: '📄',
    css: '🎨',
    json: '📋',
    html: '🌐',
    md: '📝',
    py: '🐍',
    go: '🔵',
  };
  return icons[ext || ''] || '📄';
}