'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { 
  agents as marketAgents, 
  categories, 
  templates, 
  searchAgents, 
  getAgentsByCategory,
  type Agent 
} from '@/data/agents';

// 团队成员类型
interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  avatar: string;
  skills: string[];
  active: boolean;
  addedAt: number;
}

// 初始团队成员
const initialTeamMembers: TeamMember[] = [
  { id: 'ceo-lobster', name: 'CEO Lobster', role: '任务拆解 · 资源调配', status: 'online', avatar: '🦞', skills: ['项目管理', '决策分析', '团队协调'], active: true, addedAt: Date.now() },
  { id: 'coder-lobster', name: 'Coder Lobster', role: '代码开发 · 功能实现', status: 'busy', avatar: '💻', skills: ['Python', 'TypeScript', 'React'], active: true, addedAt: Date.now() },
  { id: 'designer-lobster', name: 'Designer Lobster', role: 'UI/UX 设计', status: 'online', avatar: '🎨', skills: ['Figma', '设计系统', 'CSS'], active: true, addedAt: Date.now() },
  { id: 'devops-lobster', name: 'DevOps Lobster', role: '部署运维 · 监控告警', status: 'offline', avatar: '⚙️', skills: ['Docker', 'K8s', 'CI/CD'], active: true, addedAt: Date.now() },
];

const STORAGE_KEY = 'lobster-team-members';

export default function AgentsPage() {
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'team' | 'market'>('team');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // 从 localStorage 加载团队成员
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTeamList(parsed);
      } catch {
        setTeamList(initialTeamMembers);
      }
    } else {
      setTeamList(initialTeamMembers);
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (teamList.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teamList));
    }
  }, [teamList]);

  // 显示 Toast 提示
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  // 切换团队成员状态（启用/禁用）
  const toggleTeamMember = (id: string) => {
    setTeamList(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  // 移除团队成员
  const removeTeamMember = (id: string) => {
    setTeamList(prev => prev.filter(a => a.id !== id));
    showToast('已从团队移除', 'info');
  };

  // 检查 Agent 是否已在团队中
  const isInTeam = (agentId: string) => teamList.some(m => m.id === agentId);

  // 添加 Agent 到团队
  const handleAddAgent = (agent: Agent) => {
    if (isInTeam(agent.id)) {
      showToast('该 Agent 已在团队中', 'info');
      return;
    }
    
    const newMember: TeamMember = {
      id: agent.id,
      name: agent.name,
      role: agent.description,
      status: 'online',
      avatar: agent.avatar,
      skills: agent.skills,
      active: true,
      addedAt: Date.now(),
    };
    
    setTeamList(prev => [...prev, newMember]);
    showToast(`已添加 ${agent.name} 到团队`, 'success');
  };

  // 批量添加模板中的 Agent
  const handleAddTemplate = (templateAgents: string[]) => {
    const agentsToAdd = templateAgents
      .map(id => marketAgents.find(a => a.id === id))
      .filter((a): a is Agent => a !== undefined && !isInTeam(a.id));
    
    if (agentsToAdd.length === 0) {
      showToast('模板中的 Agent 已全部在团队中', 'info');
      return;
    }
    
    const newMembers: TeamMember[] = agentsToAdd.map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.description,
      status: 'online' as const,
      avatar: agent.avatar,
      skills: agent.skills,
      active: true,
      addedAt: Date.now(),
    }));
    
    setTeamList(prev => [...prev, ...newMembers]);
    showToast(`已添加 ${agentsToAdd.length} 个 Agent 到团队`, 'success');
  };

  // 过滤市场 Agent
  const filteredAgents = useMemo(() => {
    let result = marketAgents;
    if (searchQuery) {
      result = searchAgents(searchQuery);
    }
    if (selectedCategory) {
      result = result.filter(a => a.category === selectedCategory);
    }
    return result;
  }, [searchQuery, selectedCategory]);

  // 获取选中分类的子分类
  const subCategories = useMemo(() => {
    if (!selectedCategory) return [];
    const categoryAgents = getAgentsByCategory(selectedCategory);
    const subs = [...new Set(categoryAgents.map(a => a.subCategory))];
    return subs;
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* 顶部标题 */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">🦞 团队</h1>
        <p className="text-xs text-gray-400 mt-0.5">管理团队 · 招聘新成员</p>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 sticky top-0 z-40">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('team')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'team' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-gray-500'
            }`}
          >
            我的团队 ({teamList.length})
          </button>
          <button
            onClick={() => setViewMode('market')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'market' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-gray-500'
            }`}
          >
            市场招聘
          </button>
        </div>
      </div>

      {/* ==================== 团队视图 ==================== */}
      {viewMode === 'team' && (
        <>
          {/* 统计卡片 */}
          <div className="px-4 py-3 flex gap-3">
            <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-bold text-[#1A1A2E]">{teamList.length}</div>
              <div className="text-[10px] text-gray-400">总成员</div>
            </div>
            <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-bold text-green-500">{teamList.filter(a => a.status === 'online').length}</div>
              <div className="text-[10px] text-gray-400">在线</div>
            </div>
            <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-bold text-[#FF6B3D]">{teamList.filter(a => a.active).length}</div>
              <div className="text-[10px] text-gray-400">已启用</div>
            </div>
          </div>

          {/* Agent 列表 */}
          <div className="px-4 space-y-3">
            {teamList.map((agent) => (
              <Card key={agent.id} className="border border-gray-100 rounded-xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-xl">
                        {agent.avatar}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        agent.status === 'online' ? 'bg-green-400' : agent.status === 'busy' ? 'bg-orange-400' : 'bg-gray-300'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-[#1A1A2E] text-sm">{agent.name}</h3>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => removeTeamMember(agent.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                          >
                            移除
                          </button>
                          <button 
                            onClick={() => toggleTeamMember(agent.id)}
                            className={`w-9 h-5 rounded-full transition-colors ${agent.active ? 'bg-[#FF6B3D]' : 'bg-gray-200'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${agent.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{agent.role}</p>
                      <div className="flex gap-1 mt-2">
                        {agent.skills.slice(0, 3).map((skill, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-[#FF6B3D] rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {teamList.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-3xl mb-2 block">🦞</span>
                <p className="text-sm">团队暂无成员</p>
                <p className="text-xs mt-1">前往「市场招聘」添加 Agent</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== 市场视图 ==================== */}
      {viewMode === 'market' && (
        <>
          {/* 搜索框 */}
          <div className="px-4 py-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <Input
                type="text"
                placeholder="搜索 Agent 名称或技能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white border border-gray-100 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 分类标签 */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === null 
                  ? 'bg-[#FF6B3D] text-white' 
                  : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              全部 ({marketAgents.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.id 
                    ? 'bg-[#FF6B3D] text-white' 
                    : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat.icon} {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* 模板推荐 */}
          {!searchQuery && !selectedCategory && (
            <div className="px-4 py-2">
              <div className="text-xs text-gray-400 mb-2">⚡ 快速组建团队</div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {templates.slice(0, 3).map((template) => (
                  <div
                    key={template.id}
                    className="shrink-0 bg-white rounded-xl p-3 border border-gray-100 w-44"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{template.icon}</span>
                      <span className="text-xs font-medium text-[#1A1A2E]">{template.name}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2 line-clamp-2">{template.description}</p>
                    <button
                      onClick={() => handleAddTemplate(template.agents)}
                      className="w-full py-1.5 bg-[#FF6B3D] text-white text-xs rounded-lg hover:bg-[#E55A2B] transition-colors"
                    >
                      一键添加
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 结果统计 */}
          <div className="px-4 text-xs text-gray-400 mb-2">
            {searchQuery 
              ? `找到 ${filteredAgents.length} 个 Agent` 
              : `共 ${filteredAgents.length} 个 Agent 可招聘`
            }
          </div>

          {/* Agent 卡片网格 */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isInTeam={isInTeam(agent.id)}
                  onAdd={() => handleAddAgent(agent)}
                />
              ))}
            </div>

            {filteredAgents.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-3xl mb-2 block">🔍</span>
                没有找到匹配的 Agent
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav />

      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-800 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Agent 卡片组件
function AgentCard({ 
  agent, 
  isInTeam, 
  onAdd 
}: { 
  agent: Agent; 
  isInTeam: boolean; 
  onAdd: () => void;
}) {
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B3D]/10 to-[#FF8F6B]/10 flex items-center justify-center text-lg">
            {agent.avatar}
          </div>
          {agent.trending && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B3D] rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white">🔥</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-[#1A1A2E] text-xs truncate">{agent.name}</h3>
            <button
              onClick={onAdd}
              disabled={isInTeam}
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isInTeam 
                  ? 'bg-green-500 text-white cursor-default' 
                  : 'bg-gray-100 text-gray-400 hover:bg-[#FF6B3D] hover:text-white'
              }`}
            >
              {isInTeam ? '✓' : '+'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{agent.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-yellow-500">★</span>
              <span className="text-[10px] text-gray-500">{agent.rating}</span>
            </div>
            <span className="text-[10px] text-gray-300">|</span>
            <span className="text-[10px] text-gray-400">{(agent.uses / 1000).toFixed(1)}k 使用</span>
          </div>
        </div>
      </div>
      <div className="flex gap-1 mt-2 flex-wrap">
        {agent.skills.slice(0, 3).map((skill, i) => (
          <span
            key={i}
            className="text-[9px] px-1.5 py-0.5 bg-orange-50 text-[#FF6B3D] rounded"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}