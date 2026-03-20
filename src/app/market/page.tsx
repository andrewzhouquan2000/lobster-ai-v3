'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { 
  agents, 
  categories, 
  templates, 
  searchAgents, 
  getAgentsByCategory,
  getAgentById,
  type Agent,
  type PastProject,
} from '@/data/agents';
import { skills as predefinedSkills, type Skill } from '@/data/skills';

type ViewMode = 'grid' | 'templates';

// OpenClaw Skills 映射
const skillMap = new Map(predefinedSkills.map(s => [s.id, s]));

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [addedAgents, setAddedAgents] = useState<Set<string>>(new Set());
  
  // Agent 详情 Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAgentId, setDetailAgentId] = useState<string | null>(null);

  // 过滤 Agent
  const filteredAgents = useMemo(() => {
    let result = agents;
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

  // 获取详情 Agent
  const detailAgent = detailAgentId ? getAgentById(detailAgentId) : null;

  // 打开详情 Modal
  const openDetailModal = (agentId: string) => {
    setDetailAgentId(agentId);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* 顶部标题和搜索 */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold text-[#1A1A2E]">AI 员工市场</h1>
              <p className="text-xs text-gray-400">雇佣你的 AI 团队成员</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{addedAgents.size} 已选</span>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setViewMode('templates')}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    viewMode === 'templates' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-gray-500'
                  }`}
                >
                  模板
                </button>
              </div>
            </div>
          </div>
          
          {/* 搜索框 */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <Input
              type="text"
              placeholder="搜索 Agent 名称或技能..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-gray-50 border-0 text-sm"
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
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部 ({agents.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-[#FF6B3D] text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* 模板视图 */}
      {viewMode === 'templates' && (
        <div className="px-4 py-4 space-y-3">
          <div className="text-xs text-gray-400 mb-2">快速组建你的团队</div>
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="font-medium text-[#1A1A2E] text-sm">{template.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{template.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddTemplate(template.agents)}
                  className="px-3 py-1.5 bg-[#FF6B3D] text-white text-xs rounded-lg hover:bg-[#E55A2B] transition-colors"
                >
                  一键添加
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {template.agents.map((agentId) => {
                  const agent = agents.find(a => a.id === agentId);
                  if (!agent) return null;
                  return (
                    <div
                      key={agentId}
                      className="shrink-0 flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => openDetailModal(agentId)}
                    >
                      <span className="text-base">{agent.avatar}</span>
                      <span className="text-xs text-gray-600">{agent.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Agent 列表视图 */}
      {viewMode === 'grid' && (
        <div className="px-4 py-3">
          {/* 子分类筛选 */}
          {selectedCategory && subCategories.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  className="shrink-0 px-2 py-1 rounded-lg text-xs bg-white border border-gray-100 text-gray-600"
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* 结果统计 */}
          <div className="text-xs text-gray-400 mb-3">
            {searchQuery 
              ? `找到 ${filteredAgents.length} 个 Agent` 
              : `共 ${filteredAgents.length} 个 Agent`
            }
          </div>

          {/* Agent 卡片网格 */}
          <div className="grid grid-cols-2 gap-2">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isAdded={addedAgents.has(agent.id)}
                onAdd={() => handleAddAgent(agent.id)}
                onDetail={() => openDetailModal(agent.id)}
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
      )}

      {/* 底部操作栏 */}
      {addedAgents.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {Array.from(addedAgents).slice(0, 4).map((id) => {
                  const agent = agents.find(a => a.id === id);
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

      <BottomNav />

      {/* ==================== Agent 详情 Modal ==================== */}
      {showDetailModal && detailAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
            {/* 头部 */}
            <div className="relative bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] p-6 text-white">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                ✕
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                  {detailAgent.avatar}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{detailAgent.name}</h2>
                  <p className="text-white/80 text-sm mt-1">{detailAgent.subCategory}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      ⭐ {detailAgent.rating}
                    </span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      {(detailAgent.uses / 1000).toFixed(1)}k 使用
                    </span>
                    {detailAgent.trending && (
                      <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">🔥 热门</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* 简介 */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">简介</h3>
                <p className="text-sm text-gray-600">{detailAgent.description}</p>
              </div>

              {/* 性格特征 */}
              {detailAgent.personality && detailAgent.personality.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">💡 性格特征</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailAgent.personality.map((p, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 能力描述 */}
              {detailAgent.capabilities && detailAgent.capabilities.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">⚡ 核心能力</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailAgent.capabilities.map((cap, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 技能标签 */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">🏷️ 技能标签</h3>
                <div className="flex flex-wrap gap-2">
                  {detailAgent.skills.map((skill, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 bg-orange-50 text-[#FF6B3D] rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* OpenClaw Skills */}
              {detailAgent.openclawSkills && detailAgent.openclawSkills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">🔧 OpenClaw Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailAgent.openclawSkills.map((skillId, i) => {
                      const skill = skillMap.get(skillId);
                      return (
                        <span key={i} className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full">
                          {skill?.icon || '📦'} {skill?.displayName || skillId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 过往项目 */}
              {detailAgent.pastProjects && detailAgent.pastProjects.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#1A1A2E] mb-2">📁 过往项目</h3>
                  <div className="space-y-2">
                    {detailAgent.pastProjects.map((project, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <h4 className="text-sm font-medium text-[#1A1A2E]">{project.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{project.description}</p>
                        {project.result && (
                          <p className="text-xs text-green-600 mt-1">✓ {project.result}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 底部操作 */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  handleAddAgent(detailAgent.id);
                  setShowDetailModal(false);
                }}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                  addedAgents.has(detailAgent.id)
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-[#FF6B3D] text-white hover:bg-[#E55A2B]'
                }`}
              >
                {addedAgents.has(detailAgent.id) ? '✓ 已选择' : '添加到团队'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// Agent 卡片组件
function AgentCard({ 
  agent, 
  isAdded, 
  onAdd,
  onDetail,
}: { 
  agent: Agent; 
  isAdded: boolean; 
  onAdd: () => void;
  onDetail: () => void;
}) {
  return (
    <div 
      className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onDetail}
    >
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
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
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
      {/* 能力标签 */}
      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {agent.capabilities.slice(0, 3).map((cap, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
              {cap}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}