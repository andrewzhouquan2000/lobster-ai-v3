'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  token?: string;
  url?: string;
  uploadedAt?: string;
}

// 静态演示文件
const demoFiles: FileItem[] = [
  { id: '1', name: 'stock_fetcher.py', type: 'code', size: '2.4KB' },
  { id: '2', name: 'analyzer.py', type: 'code', size: '5.1KB' },
  { id: '3', name: 'report_gen.py', type: 'code', size: '3.2KB' },
];

// 获取文件图标
function getFileIcon(type: string): string {
  switch (type) {
    case 'code':
      return '📄';
    case 'image':
      return '🖼️';
    case 'pdf':
      return '📕';
    case 'doc':
      return '📝';
    default:
      return '📁';
  }
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

export default function ArtifactsPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>('stock_fetcher.py');
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(`正在上传 ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newFile: FileItem = {
          id: `upload-${Date.now()}`,
          name: result.file.name,
          type: result.file.type,
          size: formatFileSize(result.file.size),
          token: result.file.token,
          url: result.file.url,
          uploadedAt: new Date().toLocaleString('zh-CN'),
        };

        setUploadedFiles(prev => [newFile, ...prev]);
        setUploadStatus(`✅ ${file.name} 上传成功！`);
        
        // 3秒后清除状态
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        setUploadStatus(`❌ 上传失败: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`❌ 上传失败，请重试`);
      console.error('上传错误:', error);
    } finally {
      setIsUploading(false);
      // 清空 input 以便重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">📦 项目产出</h1>
        <p className="text-xs text-gray-400 mt-0.5">项目产物与文件</p>
      </div>

      {/* 上传按钮 */}
      <div className="px-4 py-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".py,.js,.ts,.txt,.md,.pdf,.png,.jpg,.jpeg,.gif,.webp,.json,.yaml,.yml,.csv"
        />
        <button
          onClick={handleFileSelect}
          disabled={isUploading}
          className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all ${
            isUploading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8A5B] text-white hover:shadow-lg hover:shadow-orange-200 active:scale-[0.98]'
          }`}
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              上传中...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              上传文件到飞书云空间
            </span>
          )}
        </button>
        
        {/* 上传状态提示 */}
        {uploadStatus && (
          <div className={`mt-2 py-2 px-3 rounded-lg text-sm ${
            uploadStatus.includes('✅') ? 'bg-green-50 text-green-700' : 
            uploadStatus.includes('❌') ? 'bg-red-50 text-red-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            {uploadStatus}
          </div>
        )}
      </div>

      {/* 已上传文件 */}
      {uploadedFiles.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-600">已上传文件</h2>
            <span className="text-xs text-gray-400">{uploadedFiles.length} 个文件</span>
          </div>
          <Card className="border border-orange-100 bg-orange-50/30 rounded-xl">
            <CardContent className="p-0">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={file.id}
                  onClick={() => setSelectedFile(file.name)}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-orange-50/50 ${
                    index !== uploadedFiles.length - 1 ? 'border-b border-orange-100' : ''
                  } ${selectedFile === file.name ? 'bg-orange-100/50' : ''}`}
                >
                  <span className="text-xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A2E] truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{file.size} · {file.uploadedAt}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已上传</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 演示文件 */}
      <div className="px-4 py-2">
        <h2 className="text-sm font-medium text-gray-600 mb-2">项目文件</h2>
        <Card className="border border-gray-100 rounded-xl shadow-sm">
          <CardContent className="p-3">
            {demoFiles.map((file, index) => (
              <div 
                key={file.id}
                onClick={() => setSelectedFile(file.name)}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedFile === file.name ? 'bg-orange-50 border border-[#FF6B3D]/30' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{getFileIcon(file.type)}</span>
                <span className="text-sm flex-1">{file.name}</span>
                <span className="text-xs text-gray-400">{file.size}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 文件预览 */}
      {selectedFile && (
        <div className="px-4">
          <Card className="border border-gray-100 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">{selectedFile}</h3>
                <div className="flex gap-2">
                  <button className="text-xs text-gray-400 hover:text-[#FF6B3D]">下载</button>
                  <button className="text-xs text-gray-400 hover:text-[#FF6B3D]">分享</button>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-300">
                <pre>{`# ${selectedFile}
import requests

def fetch_data(symbol):
    """获取股票数据"""
    url = f"https://api.example.com/{symbol}"
    response = requests.get(url)
    return response.json()

def analyze_stock(symbol):
    data = fetch_data(symbol)
    return calculate_indicators(data)`}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
}