'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BottomNav from '@/components/BottomNav';

interface Project {
  id: number;
  name: string;
  status: 'active' | 'done' | 'paused';
  progress: number;
  updated: string;
  createdAt: number;
}

const defaultProjects: Project[] = [
  { id: 1, name: '股票分析工具', status: 'active', progress: 75, updated: '2小时前', createdAt: Date.now() - 7200000 },
  { id: 2, name: 'AI 新闻播客', status: 'done', progress: 100, updated: '今天 08:00', createdAt: Date.now() - 86400000 },
  { id: 3, name: '客户线索挖掘', status: 'paused', progress: 30, updated: '昨天', createdAt: Date.now() - 172800000 },
];

// Status badge configuration
const getStatusConfig = (status: Project['status']) => {
  switch (status) {
    case 'active':
      return { label: '进行中', color: 'bg-orange-100 text-orange-600 border-orange-200', dot: 'bg-orange-400' };
    case 'done':
      return { label: '已完成', color: 'bg-green-100 text-green-600 border-green-200', dot: 'bg-green-400' };
    case 'paused':
      return { label: '已暂停', color: 'bg-yellow-100 text-yellow-600 border-yellow-200', dot: 'bg-yellow-400' };
  }
};

const agents = [
  { id: 1, name: 'Coder', avatar: '💻', status: 'online' },
  { id: 2, name: 'DevOps', avatar: '⚙️', status: 'busy' },
  { id: 3, name: 'Designer', avatar: '🎨', status: 'online' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('');
  const [editName, setEditName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<Project['status']>('active');

  // Load projects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lobster-projects');
    if (saved) {
      setProjects(JSON.parse(saved));
    } else {
      setProjects(defaultProjects);
      localStorage.setItem('lobster-projects', JSON.stringify(defaultProjects));
    }
  }, []);

  // Save projects to localStorage whenever they change
  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    localStorage.setItem('lobster-projects', JSON.stringify(newProjects));
  };

  const handleCreateProject = () => {
    if (projectName.trim()) {
      // Create new project in localStorage
      const newProject: Project = {
        id: Date.now(),
        name: projectName.trim(),
        status: 'active',
        progress: 0,
        updated: '刚刚',
        createdAt: Date.now(),
      };
      saveProjects([newProject, ...projects]);
      // Navigate to chat with new project
      router.push(`/chat?new=true&name=${encodeURIComponent(projectName.trim())}`);
    } else {
      // Quick create - go directly to chat
      router.push('/chat?new=true');
    }
  };

  const handleEditProject = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    if (project && editName.trim()) {
      const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, name: editName.trim(), status: editStatus, updated: '刚刚' } : p
      );
      saveProjects(updatedProjects);
    }
    setShowEditProject(null);
    setEditName('');
  };

  const handleDeleteProject = (projectId: number) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
    setShowDeleteConfirm(null);
  };

  const openEditDialog = (project: Project) => {
    setShowEditProject(project.id);
    setEditName(project.name);
    setEditStatus(project.status);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center">
              <span className="text-lg">🦞</span>
            </div>
            <div>
              <p className="text-xs text-gray-400">早上好</p>
              <h1 className="text-lg font-semibold text-[#1A1A2E]">董事长</h1>
            </div>
          </div>
          {/* New Project Button */}
          <button 
            onClick={() => setShowNewProject(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-white text-xl font-light shadow-md hover:shadow-lg transition-shadow"
          >
            +
          </button>
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

      {/* AI 团队 - 点击跳转到 Agents */}
      <Link href="/agents" className="block px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400">AI 团队</h2>
          <span className="text-xs text-[#FF6B3D]">查看全部 →</span>
        </div>
        <div className="flex gap-3">
          {agents.map((agent) => (
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

      {/* 项目列表 - 点击跳转到 Chat */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400">项目</h2>
          <span className="text-xs text-[#FF6B3D]">共 {projects.length} 个</span>
        </div>
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="relative group">
              <Link href={`/chat?name=${encodeURIComponent(project.name)}`} className="block">
                <Card className={`border rounded-xl shadow-sm hover:border-[#FF6B3D]/30 transition-colors cursor-pointer ${
                  project.status === 'active' ? 'border-[#FF6B3D]/30 bg-gradient-to-br from-orange-50/50 to-white' :
                  project.status === 'done' ? 'border-green-200 bg-gradient-to-br from-green-50/30 to-white' :
                  'border-yellow-200 bg-gradient-to-br from-yellow-50/30 to-white'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[#1A1A2E] text-sm">{project.name}</h3>
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusConfig(project.status).color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(project.status).dot}`} />
                          {getStatusConfig(project.status).label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.preventDefault(); openEditDialog(project); }}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(project.id); }}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{project.updated}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div className={`h-full rounded-full ${project.progress === 100 ? 'bg-green-400' : project.status === 'paused' ? 'bg-yellow-400' : 'bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B]'}`} style={{ width: `${project.progress}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
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

      {/* Token 使用量 - 点击跳转到 Tokens */}
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

      {/* Edit Project Dialog */}
      <Dialog open={showEditProject !== null} onOpenChange={() => setShowEditProject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">✏️</span>
              编辑项目
            </DialogTitle>
            <DialogDescription>
              修改项目名称和状态
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">项目名称</label>
              <input 
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入新名称"
                className="w-full h-10 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 focus:outline-none focus:border-[#FF6B3D] focus:ring-1 focus:ring-[#FF6B3D]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && showEditProject !== null) {
                    handleEditProject(showEditProject);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">项目状态</label>
              <div className="flex gap-2">
                {(['active', 'done', 'paused'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setEditStatus(status)}
                    className={`flex-1 h-9 text-xs font-medium rounded-lg border transition-all ${
                      editStatus === status 
                        ? status === 'active' 
                          ? 'bg-orange-100 text-orange-600 border-orange-300' 
                          : status === 'done' 
                          ? 'bg-green-100 text-green-600 border-green-300' 
                          : 'bg-yellow-100 text-yellow-600 border-yellow-300'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {status === 'active' ? '🔄 进行中' : status === 'done' ? '✅ 已完成' : '⏸️ 已暂停'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowEditProject(null); setEditName(''); }}
                className="flex-1 h-10 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => showEditProject !== null && handleEditProject(showEditProject)}
                className="flex-1 h-10 text-sm text-white bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm !== null} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">🗑️</span>
              删除项目
            </DialogTitle>
            <DialogDescription>
              确定要删除这个项目吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 h-10 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button 
              onClick={() => showDeleteConfirm !== null && handleDeleteProject(showDeleteConfirm)}
              className="flex-1 h-10 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              删除
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}