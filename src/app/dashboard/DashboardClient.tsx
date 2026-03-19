'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BottomNav from '@/components/BottomNav';
import UserMenu from '@/components/UserMenu';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

interface User {
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface DashboardClientProps {
  user: User;
  initialProjects: Project[];
}

const defaultAgents = [
  { id: 1, name: 'Coder', avatar: '💻', status: 'online' },
  { id: 2, name: 'DevOps', avatar: '⚙️', status: 'busy' },
  { id: 3, name: 'Designer', avatar: '🎨', status: 'online' },
];

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

export default function DashboardClient({ user, initialProjects }: DashboardClientProps) {
  const router = useRouter();
  const [projects] = useState<Project[]>(initialProjects);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');

  const handleCreateProject = () => {
    if (projectName.trim()) {
      router.push(`/chat?new=true&name=${encodeURIComponent(projectName.trim())}`);
    } else {
      router.push('/chat?new=true');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center">
              <span className="text-lg">🦞</span>
            </div>
            <div>
              <p className="text-xs text-gray-400">{getTimeOfDay()}</p>
              <h1 className="text-lg font-semibold text-[#1A1A2E]">{user.display_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserMenu user={user} />
          </div>
        </div>
      </div>

      {/* Quick Create Card */}
      <div className="px-4 py-4">
        <button
          onClick={() => setShowNewProject(true)}
          className="w-full bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-[#FF6B3D] transition-colors p-4 flex items-center justify-center gap-2 text-gray-400 hover:text-[#FF6B3D]"
        >
          <span className="text-2xl">✨</span>
          <span className="text-sm font-medium">创建新项目</span>
        </button>
      </div>

      {/* AI 团队 */}
      <Link href="/agents" className="block px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400">AI 团队</h2>
          <span className="text-xs text-[#FF6B3D]">查看全部 →</span>
        </div>
        <div className="flex gap-3">
          {defaultAgents.map((agent) => (
            <div key={agent.id} className="flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">
                  {agent.avatar}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  agent.status === 'online' ? 'bg-green-400' : 'bg-orange-400'
                }`} />
              </div>
              <span className="text-xs text-gray-500 mt-1">{agent.name}</span>
            </div>
          ))}
        </div>
      </Link>

      {/* 项目列表 */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400">项目</h2>
          <span className="text-xs text-[#FF6B3D]">共 {projects.length} 个</span>
        </div>
        <div className="space-y-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/chat?project=${project.id}`}>
              <Card className="border border-[#FF6B3D]/30 bg-gradient-to-br from-orange-50/50 to-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#1A1A2E] text-sm">{project.name}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-orange-100 text-orange-600 border-orange-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      进行中
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(project.updated_at).toLocaleDateString('zh-CN')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm">暂无项目</p>
              <p className="text-xs mt-1">点击上方创建新项目</p>
            </div>
          )}
        </div>
      </div>

      {/* Token 使用量 */}
      <Link href="/tokens" className="block px-4 mt-4">
        <Card className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Token 使用量</span>
              <span className="text-xs text-[#FF6B3D]">详情 →</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] rounded-full" />
            </div>
            <p className="text-xs text-gray-500 mt-2">$3.42 / $10.00</p>
          </CardContent>
        </Card>
      </Link>

      {/* 快捷操作 */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Link href="/deploy">
          <Card className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">🚀</span>
              <p className="text-sm font-medium mt-2">部署项目</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/logs">
          <Card className="border border-gray-100 rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <span className="text-2xl">📋</span>
              <p className="text-sm font-medium mt-2">执行日志</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              创建新项目
            </DialogTitle>
            <DialogDescription>
              描述你想创建的项目，AI 团队将协助你完成
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">项目名称</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例如：股票分析工具"
                className="w-full h-10 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 focus:outline-none focus:border-[#FF6B3D] focus:ring-1 focus:ring-[#FF6B3D]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewProject(false)}
                className="flex-1 h-10 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                className="flex-1 h-10 text-sm text-white bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                创建并开始
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}