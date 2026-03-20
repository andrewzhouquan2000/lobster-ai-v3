'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/BottomNav';
import { 
  agents as marketAgents, 
  categories, 
  templates, 
  searchAgents, 
  getAgentsByCategory,
  getAgentById,
  type Agent,
  type PastProject,
} from '@/data/agents';
import { skillCategories, skills as predefinedSkills, type Skill } from '@/data/skills';

// ==================== 类型定义 ====================
interface ApiTeamMember {
  id: string;
  user_id: string;
  agent_id: string;
  status: 'active' | 'inactive';
  added_at: string;
}

interface TeamMemberDisplay {
  id: string;
  agentId: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'offline';
  avatar: string;
  skills: string[];
  active: boolean;
  grantedSkills?: Skill[];
  // 新增字段
  personality?: string[];
  capabilities?: string[];
  pastProjects?: PastProject[];
  openclawSkills?: string[];
}

interface FlyingAgent {
  id: string;
  name: string;
  avatar: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Agent ID 到详细信息的映射
const agentDataMap = new Map(marketAgents.map(a => [a.id, a]));

// OpenClaw Skills 映射
const skillMap = new Map(predefinedSkills.map(s => [s.id, s]));

export default function AgentsPage() {
  // ==================== 状态 ====================
  const [teamList, setTeamList] = useState<TeamMemberDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'team' | 'market'>('team');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [animatingMemberId, setAnimatingMemberId] = useState<string | null>(null);
  const [flyingAgent, setFlyingAgent] = useState<FlyingAgent | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Skills 相关
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  
  // Agent 详情 Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAgentId, setDetailAgentId] = useState<string | null>(null);
  
  const teamTabRef = useRef<HTMLButtonElement>(null);

  // ==================== 数据加载 ====================
  const loadTeamMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        
        // 获取每个 Agent 的 Skills
        const membersWithSkills = await Promise.all(
          data.members
            .filter((m: ApiTeamMember) => m.status === 'active')
            .map(async (m: ApiTeamMember) => {
              const agentInfo = agentDataMap.get(m.agent_id);
              
              // 获取 Agent 的 Skills
              let grantedSkills: Skill[] = [];
              try {
                const skillsRes = await fetch(`/api/skills?agentId=${m.agent_id}`);
                if (skillsRes.ok) {
                  const skillsData = await skillsRes.json();
                  grantedSkills = skillsData.skills || [];
                }
              } catch (e) {
                console.error('Failed to load agent skills:', e);
              }
              
              return {
                id: m.id,
                agentId: m.agent_id,
                name: agentInfo?.name || m.agent_id,
                role: agentInfo?.description || '',
                status: 'online' as const,
                avatar: agentInfo?.avatar || '🤖',
                skills: agentInfo?.skills || [],
                active: m.status === 'active',
                grantedSkills,
                // 新增字段
                personality: agentInfo?.personality,
                capabilities: agentInfo?.capabilities,
                pastProjects: agentInfo?.pastProjects,
                openclawSkills: agentInfo?.openclawSkills,
              };
            })
        );
        
        setTeamList(membersWithSkills);
      }
    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/skills');
      if (res.ok) {
        const data = await res.json();
        setAllSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Failed to load skills:', error);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers();
    loadAllSkills();
  }, [loadTeamMembers, loadAllSkills]);

  // ==================== Toast ====================
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  // ==================== 团队操作 ====================
  const toggleTeamMember = async (agentId: string) => {
    const member = teamList.find(m => m.agentId === agentId);
    if (!member) return;
    
    const newStatus = member.active ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action: 'toggle', status: newStatus }),
      });
      
      if (res.ok) {
        setTeamList(prev => prev.map(m => 
          m.agentId === agentId ? { ...m, active: !m.active } : m
        ));
      }
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const removeTeamMember = async (agentId: string) => {
    try {
      const res = await fetch(`/api/team?agentId=${agentId}`, { method: 'DELETE' });
      if (res.ok) {
        setTeamList(prev => prev.filter(m => m.agentId !== agentId));
        showToast('已从团队移除', 'info');
      }
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  const isInTeam = (agentId: string) => teamList.some(m => m.agentId === agentId);

  const handleAddAgent = async (agent: Agent, event: React.MouseEvent<HTMLButtonElement>) => {
    if (isInTeam(agent.id)) {
      showToast('该 Agent 已在团队中', 'info');
      return;
    }
    
    // 飞行动画
    const button = event.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    const startX = buttonRect.left + buttonRect.width / 2;
    const startY = buttonRect.top + buttonRect.height / 2;
    
    const endX = teamTabRef.current 
      ? teamTabRef.current.getBoundingClientRect().left + teamTabRef.current.getBoundingClientRect().width / 2
      : window.innerWidth / 2;
    const endY = teamTabRef.current
      ? teamTabRef.current.getBoundingClientRect().top + teamTabRef.current.getBoundingClientRect().height / 2
      : 100;
    
    setFlyingAgent({
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar,
      startX,
      startY,
      endX,
      endY,
    });
    
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
      });
      
      if (res.ok) {
        setTimeout(async () => {
          // 加载新成员的 Skills
          let grantedSkills: Skill[] = [];
          try {
            const skillsRes = await fetch(`/api/skills?agentId=${agent.id}`);
            if (skillsRes.ok) {
              const skillsData = await skillsRes.json();
              grantedSkills = skillsData.skills || [];
            }
          } catch (e) {}
          
          const newMember: TeamMemberDisplay = {
            id: Date.now().toString(),
            agentId: agent.id,
            name: agent.name,
            role: agent.description,
            status: 'online',
            avatar: agent.avatar,
            skills: agent.skills,
            active: true,
            grantedSkills,
            personality: agent.personality,
            capabilities: agent.capabilities,
            pastProjects: agent.pastProjects,
            openclawSkills: agent.openclawSkills,
          };
          
          setTeamList(prev => [...prev, newMember]);
          setAnimatingMemberId(agent.id);
          setTimeout(() => setAnimatingMemberId(null), 600);
          showToast(`已添加 ${agent.name} 到团队`, 'success');
        }, 300);
      }
    } catch (error) {
      console.error('Add error:', error);
      showToast('添加失败', 'info');
    }
    
    setTimeout(() => setFlyingAgent(null), 600);
  };

  const handleAddTemplate = async (templateAgents: string[]) => {
    const agentsToAdd = templateAgents.filter(id => !isInTeam(id));
    if (agentsToAdd.length === 0) {
      showToast('模板中的 Agent 已全部在团队中', 'info');
      return;
    }
    
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentIds: agentsToAdd }),
      });
      
      if (res.ok) {
        await loadTeamMembers();
        showToast(`已添加 ${agentsToAdd.length} 个 Agent 到团队`, 'success');
      }
    } catch (error) {
      console.error('Template add error:', error);
    }
  };

  // ==================== Skills 操作 ====================
  const openSkillsModal = (agentId: string) => {
    const member = teamList.find(m => m.agentId === agentId);
    if (!member) return;
    
    setSelectedAgentId(agentId);
    setSelectedSkillIds(member.grantedSkills?.map(s => s.id) || []);
    setShowSkillsModal(true);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const saveSkills = async () => {
    if (!selectedAgentId) return;
    
    setSavingSkills(true);
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          skillIds: selectedSkillIds,
          action: 'update',
        }),
      });
      
      if (res.ok) {
        // 更新本地状态
        setTeamList(prev => prev.map(m => {
          if (m.agentId === selectedAgentId) {
            return {
              ...m,
              grantedSkills: allSkills.filter(s => selectedSkillIds.includes(s.id)),
            };
          }
          return m;
        }));
        
        showToast('Skills 已更新', 'success');
        setShowSkillsModal(false);
      }
    } catch (error) {
      console.error('Save skills error:', error);
      showToast('保存失败', 'info');
    } finally {
      setSavingSkills(false);
    }
  };

  // ==================== Agent 详情 Modal ====================
  const openDetailModal = (agentId: string) => {
    setDetailAgentId(agentId);
    setShowDetailModal(true);
  };

  // ==================== 过滤市场 Agent ====================
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

  // 获取详情 Agent
  const detailAgent = detailAgentId ? getAgentById(detailAgentId) : null;

  // ==================== 渲染 ====================
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* 顶部标题 */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">🦞 团队</h1>
        <p className="text-xs text-gray-400 mt-0.5">管理团队 · Skills分配</p>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 sticky top-0 z-40">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            ref={teamTabRef}
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
              <div className="text-xl font-bold text-[#FF6B3D]">
                {teamList.reduce((sum, a) => sum + (a.grantedSkills?.length || 0), 0)}
              </div>
              <div className="text-[10px] text-gray-400">Skills</div>
            </div>
          </div>

          {/* Agent 列表 */}
          <div className="px-4 space-y-3">
            {loading ? (
              <div className="text-center py-12 text-gray-400">
                <span className="text-2xl">⏳</span>
                <p className="text-sm mt-2">加载中...</p>
              </div>
            ) : teamList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <span className="text-3xl mb-2 block">🦞</span>
                <p className="text-sm">团队暂无成员</p>
                <p className="text-xs mt-1">前往「市场招聘」添加 Agent</p>
              </div>
            ) : (
              teamList.map((agent) => {
                const isNew = animatingMemberId === agent.agentId;
                return (
                  <Card 
                    key={agent.agentId} 
                    className={`border border-gray-100 rounded-xl shadow-sm transition-all duration-500 cursor-pointer ${
                      isNew ? 'scale-105 border-[#FF6B3D]' : ''
                    }`}
                    onClick={() => openDetailModal(agent.agentId)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-lg">
                            {agent.avatar}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            agent.status === 'online' ? 'bg-green-400' : agent.status === 'busy' ? 'bg-orange-400' : 'bg-gray-300'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-[#1A1A2E] text-sm truncate">{agent.name}</h3>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeTeamMember(agent.agentId); }}
                                className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                              >
                                移除
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleTeamMember(agent.agentId); }}
                                className={`w-8 h-4 rounded-full transition-colors ${agent.active ? 'bg-[#FF6B3D]' : 'bg-gray-200'}`}
                              >
                                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${agent.active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{agent.role}</p>
                          
                          {/* 能力标签 */}
                          {agent.capabilities && agent.capabilities.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {agent.capabilities.slice(0, 3).map((cap, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                                  {cap}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Skills 标签 */}
                          <div className="flex gap-1 mt-1.5 flex-wrap items-center">
                            {agent.skills.slice(0, 2).map((skill, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 bg-orange-50 text-[#FF6B3D] rounded">
                                {skill}
                              </span>
                            ))}
                            {/* 已分配的 Skills */}
                            {agent.grantedSkills && agent.grantedSkills.length > 0 && (
                              <>
                                {agent.grantedSkills.slice(0, 2).map((skill, i) => (
                                  <span key={`g-${i}`} className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                                    {skill.icon} {skill.displayName}
                                  </span>
                                ))}
                                {agent.grantedSkills.length > 2 && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                                    +{agent.grantedSkills.length - 2}
                                  </span>
                                )}
                              </>
                            )}
                            {/* 分配Skills按钮 */}
                            <button
                              onClick={(e) => { e.stopPropagation(); openSkillsModal(agent.agentId); }}
                              className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 transition-colors"
                            >
                              ⚡ Skills
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
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
                {cat.icon} {cat.name}
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
                  onAdd={(e) => handleAddAgent(agent, e)}
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
        </>
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
              {isInTeam(detailAgent.id) ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium"
                >
                  ✓ 已在团队中
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    handleAddAgent(detailAgent, e as any);
                    setShowDetailModal(false);
                  }}
                  className="w-full py-3 rounded-xl bg-[#FF6B3D] text-white text-sm font-medium hover:bg-[#E55A2B] transition-colors"
                >
                  添加到团队
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== Skills 分配 Modal ==================== */}
      {showSkillsModal && selectedAgentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">⚡ 分配 Skills</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                为 {teamList.find(m => m.agentId === selectedAgentId)?.name} 分配能力权限
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Skills 分类 */}
              {skillCategories.map((category) => {
                const categorySkills = allSkills.filter(s => s.category === category.id);
                if (categorySkills.length === 0) return null;
                
                return (
                  <div key={category.id} className="mb-4">
                    <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                      <span className="text-gray-300">({categorySkills.length})</span>
                    </div>
                    <div className="space-y-2">
                      {categorySkills.map((skill) => {
                        const isSelected = selectedSkillIds.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            onClick={() => toggleSkill(skill.id)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                              isSelected 
                                ? 'border-[#FF6B3D] bg-orange-50' 
                                : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                isSelected ? 'bg-[#FF6B3D] text-white' : 'bg-gray-100'
                              }`}>
                                {isSelected ? '✓' : ''}
                              </div>
                              <span className="text-base">{skill.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[#1A1A2E] truncate">
                                  {skill.displayName}
                                </div>
                                <div className="text-[10px] text-gray-400 truncate">
                                  {skill.description}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">已选择 {selectedSkillIds.length} 个 Skills</span>
                <button
                  onClick={() => setSelectedSkillIds([])}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  清空
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSkillsModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={saveSkills}
                  disabled={savingSkills}
                  className="flex-1 py-2.5 rounded-lg bg-[#FF6B3D] text-white text-sm font-medium disabled:opacity-50"
                >
                  {savingSkills ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 飞行 Agent 动画 */}
      {flyingAgent && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{
            left: flyingAgent.startX,
            top: flyingAgent.startY,
            transform: 'translate(-50%, -50%)',
            animation: `flyAnimation 0.5s ease-in-out forwards`,
            ['--tx' as string]: `${flyingAgent.endX - flyingAgent.startX}px`,
            ['--ty' as string]: `${flyingAgent.endY - flyingAgent.startY}px`,
          }}
        >
          <style>{`
            @keyframes flyAnimation {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              60% { transform: translate(calc(-50% + var(--tx) * 0.3), calc(-50% + var(--ty) * 0.3 - 40px)) scale(1.2); opacity: 1; }
              100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.3); opacity: 0; }
            }
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
            .animate-slide-up {
              animation: slideUp 0.3s ease-out;
            }
          `}</style>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-xl shadow-xl border-2 border-white">
            {flyingAgent.avatar}
          </div>
        </div>
      )}

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

// ==================== Agent 卡片组件 ====================
function AgentCard({ 
  agent, 
  isInTeam, 
  onAdd,
  onDetail,
}: { 
  agent: Agent; 
  isInTeam: boolean; 
  onAdd: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
              onClick={(e) => { e.stopPropagation(); onAdd(e); }}
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