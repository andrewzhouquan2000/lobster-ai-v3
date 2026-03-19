'use client';

import { useState, useMemo } from 'react';
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

// 当前团队成员
const teamMembers = [
  { id: 1, name: 'CEO Lobster', role: '任务拆解 · 资源调配', status: 'online', avatar: '🦞', skills: ['项目管理', '决策分析', '团队协调'], active: true },
  { id: 2, name: 'Coder Lobster', role: '代码开发 · 功能实现', status: 'busy', avatar: '💻', skills: ['Python', 'TypeScript', 'React'], active: true },
  { id: 3, name: 'Designer Lobster', role: 'UI/UX 设计', status: 'online', avatar: '🎨', skills: ['Figma', '设计系统', 'CSS'], active: true },
  { id: 4, name: 'DevOps Lobster', role: '部署运维 · 监控告警', status: 'offline', avatar: '⚙️', skills: ['Docker', 'K8s', 'CI/CD'], active: true },
];

export default function AgentsPage() {
  const [teamList, setTeamList] = useState(teamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'team' | 'market'>('team');
  const [addedAgents, setAddedAgents] = useState<Set<string>>(new Set());

  // 切换团队成员状态
  const toggleTeamMember = (id: number) => {
    setTeamList(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
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

  // 添加 Agent 到团队
  const handleAddAgent = (agentId: string) => {
    setAddedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  // 添加模板中的所有 Agent
  const handleAddTemplate = (templateAgents: string[]) => {
    setAddedAgents(prev => {
      const newSet = new Set(prev);
      templateAgents.forEach(id => newSet.add(id));
      return newSet;
    });
  };

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
                        <button 
                          onClick={() => toggleTeamMember(agent.id)}
                          className={`w-9 h-5 rounded-full transition-colors ${agent.active ? 'bg-[#FF6B3D]' : 'bg-gray-200'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${agent.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
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
                  isAdded={addedAgents.has(agent.id)}
                  onAdd={() => handleAddAgent(agent.id)}
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

          {/* 底部操作栏 */}
          {addedAgents.size > 0 && (
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {Array.from(addedAgents).slice(0, 4).map((id) => {
                      const agent = marketAgents.find(a => a.id === id);
                      return agent ? (
                        <div
                          key={id}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-sm border-2 border-white"
                        >
                          {agent.avatar}
                        </div>
                      ) : null;
                    })}
                  </div>
                  {addedAgents.size > 4 && (
                    <span className="text-xs text-gray-400">+{addedAgents.size - 4}</span>
                  )}
                </div>
                <button className="px-4 py-2 bg-[#FF6B3D] text-white text-sm font-medium rounded-lg hover:bg-[#E55A2B] transition-colors">
                  添加到团队 ({addedAgents.size})
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <BottomNav />
    </div>
  );
}

// Agent 卡片组件
function AgentCard({ 
  agent, 
  isAdded, 
  onAdd 
}: { 
  agent: Agent; 
  isAdded: boolean; 
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
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isAdded 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 text-gray-400 hover:bg-[#FF6B3D] hover:text-white'
              }`}
            >
              {isAdded ? '✓' : '+'}
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