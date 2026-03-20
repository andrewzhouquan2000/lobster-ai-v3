'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

// ==================== 类型定义 ====================
type TokenType = 'github' | 'aliyun_oss' | 'feishu' | 'other';

interface Token {
  id: string;
  name: string;
  type: TokenType;
  status: string;
  last_used_at: string | null;
  created_at: string;
}

interface UsageStats {
  totalCalls: number;
  totalTokens: number;
  todayCalls: number;
  todayTokens: number;
  weekCalls: number;
  weekTokens: number;
  monthCalls: number;
  monthTokens: number;
}

interface Quota {
  aliyun_balance: number;
  total_tokens_used: number;
  total_cost_usd: number;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

interface Skill {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  permissions: string[];
}

interface SkillCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const TOKEN_TYPES: TokenType[] = ['github', 'aliyun_oss', 'feishu', 'other'];

function getTokenTypeInfo(type: TokenType): { icon: string; label: string } {
  const typeMap: Record<TokenType, { icon: string; label: string }> = {
    github: { icon: '🐙', label: 'GitHub' },
    aliyun_oss: { icon: '☁️', label: 'Aliyun OSS' },
    feishu: { icon: '📄', label: '飞书' },
    other: { icon: '🔑', label: '其他' },
  };
  return typeMap[type];
}

export default function SettingsPage() {
  // ==================== 状态 ====================
  const [activeTab, setActiveTab] = useState<'tokens' | 'resources' | 'skills'>('tokens');
  
  // Tokens
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [newToken, setNewToken] = useState({ name: '', type: 'github' as TokenType, key: '' });
  const [saving, setSaving] = useState(false);
  
  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [newResource, setNewResource] = useState({ name: '', type: 'github', config: {} as Record<string, string> });
  const [resourceTypes, setResourceTypes] = useState<any[]>([]);
  
  // Skills
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Loading
  const [loading, setLoading] = useState(true);

  // ==================== 数据加载 ====================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [tokensRes, resourcesRes, skillsRes] = await Promise.all([
        fetch('/api/tokens'),
        fetch('/api/resources'),
        fetch('/api/skills'),
      ]);

      if (tokensRes.ok) {
        const data = await tokensRes.json();
        setTokens(data.tokens);
        setStats(data.stats);
        setQuota(data.quota);
      }

      if (resourcesRes.ok) {
        const data = await resourcesRes.json();
        setResources(data.resources);
        setResourceTypes(data.types || []);
      }

      if (skillsRes.ok) {
        const data = await skillsRes.json();
        setSkills(data.skills);
        // 提取分类
        const cats = [...new Set(data.skills.map((s: Skill) => s.category))] as string[];
        setSkillCategories(cats.map(c => ({
          id: c,
          name: getCategoryName(c),
          icon: getCategoryIcon(c),
          description: '',
        })));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Token 操作 ====================
  const handleAddToken = async () => {
    if (!newToken.name || !newToken.key) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newToken),
      });
      if (res.ok) {
        setShowAddTokenModal(false);
        setNewToken({ name: '', type: 'github', key: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Add token error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteToken = async (id: string) => {
    if (!confirm('确定要删除这个 Token 吗？')) return;
    try {
      const res = await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Delete token error:', error);
    }
  };

  // ==================== Resource 操作 ====================
  const handleAddResource = async () => {
    if (!newResource.name || !newResource.type) return;
    setSaving(true);
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource),
      });
      if (res.ok) {
        setShowAddResourceModal(false);
        setNewResource({ name: '', type: 'github', config: {} });
        fetchData();
      }
    } catch (error) {
      console.error('Add resource error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('确定要删除这个资源配置吗？')) return;
    try {
      const res = await fetch(`/api/resources?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Delete resource error:', error);
    }
  };

  // ==================== 工具函数 ====================
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '从未';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return formatDate(dateStr);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getResourceTypeInfo = (type: string) => {
    return resourceTypes.find(r => r.id === type) || { name: type, icon: '🔧' };
  };

  function getCategoryName(category: string): string {
    const names: Record<string, string> = {
      code: '代码仓库',
      deploy: '部署平台',
      storage: '云存储',
      ai: 'AI模型',
      social: '社交媒体',
      tools: '工具服务',
      admin: '管理权限',
    };
    return names[category] || category;
  }

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      code: '💻',
      deploy: '🚀',
      storage: '☁️',
      ai: '🤖',
      social: '📱',
      tools: '🔧',
      admin: '👑',
    };
    return icons[category] || '🔑';
  }

  // ==================== 渲染 ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">⚙️ 设置</h1>
        <p className="text-xs text-gray-400 mt-0.5">Token · 资源 · Skills 管理</p>
      </div>

      {/* Tabs */}
      <div className="bg-white px-4 py-2 flex gap-1 border-b border-gray-100 sticky top-0 z-40">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'tokens'
              ? 'bg-[#FF6B3D] text-white'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          🔑 Token
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'resources'
              ? 'bg-[#FF6B3D] text-white'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          ☁️ 资源
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'skills'
              ? 'bg-[#FF6B3D] text-white'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          ⚡ Skills
        </button>
      </div>

      {/* ==================== Tokens Tab ==================== */}
      {activeTab === 'tokens' && (
        <div className="px-4 py-3">
          {/* 统计卡片 */}
          {stats && (
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
                <div className="text-xl font-bold text-[#1A1A2E]">{formatNumber(stats.todayTokens)}</div>
                <div className="text-[10px] text-gray-400">今日Token</div>
              </div>
              <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
                <div className="text-xl font-bold text-[#FF6B3D]">{formatNumber(stats.monthTokens)}</div>
                <div className="text-[10px] text-gray-400">本月Token</div>
              </div>
              <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
                <div className="text-xl font-bold text-green-500">{tokens.filter(t => t.status === 'active').length}</div>
                <div className="text-[10px] text-gray-400">活跃Token</div>
              </div>
            </div>
          )}

          {/* 添加按钮 */}
          <button
            onClick={() => setShowAddTokenModal(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white font-medium mb-4"
          >
            + 添加 Token
          </button>

          {/* Token 列表 */}
          <div className="space-y-2">
            {tokens.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-100">
                <span className="text-3xl block mb-2">🔑</span>
                暂无 Token，点击上方按钮添加
              </div>
            ) : (
              tokens.map((token) => {
                const typeInfo = getTokenTypeInfo(token.type);
                return (
                  <Card key={token.id} className="border border-gray-100 rounded-xl shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                          {typeInfo.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm text-[#1A1A2E]">{token.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              token.status === 'active' ? 'bg-green-50 text-green-600' :
                              token.status === 'expired' ? 'bg-red-50 text-red-500' :
                              'bg-gray-50 text-gray-500'
                            }`}>
                              {token.status === 'active' ? '✓ 活跃' : token.status === 'expired' ? '✗ 过期' : '已撤销'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {typeInfo.label} · 创建: {formatDate(token.created_at)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          className="text-red-400 text-xs hover:text-red-600 px-2 py-1"
                        >
                          删除
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* 阿里云余额 */}
          {quota && (
            <div className="mt-4 bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">阿里云余额</span>
                <span className="text-white/60 text-xs">可用余额</span>
              </div>
              <div className="text-white text-2xl font-bold">
                ¥ {quota.aliyun_balance.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== Resources Tab ==================== */}
      {activeTab === 'resources' && (
        <div className="px-4 py-3">
          {/* 统计 */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-bold text-[#1A1A2E]">{resources.length}</div>
              <div className="text-[10px] text-gray-400">已配置资源</div>
            </div>
            <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
              <div className="text-xl font-bold text-green-500">{resources.filter(r => r.status === 'active').length}</div>
              <div className="text-[10px] text-gray-400">活跃资源</div>
            </div>
          </div>

          {/* 添加按钮 */}
          <button
            onClick={() => setShowAddResourceModal(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B3D] to-[#FF8F6B] text-white font-medium mb-4"
          >
            + 添加资源
          </button>

          {/* 资源列表 */}
          <div className="space-y-2">
            {resources.length === 0 ? (
              <div className="text-center text-gray-400 py-8 bg-white rounded-xl border border-gray-100">
                <span className="text-3xl block mb-2">☁️</span>
                暂无资源配置，点击上方按钮添加
              </div>
            ) : (
              resources.map((resource) => {
                const typeInfo = getResourceTypeInfo(resource.type);
                return (
                  <Card key={resource.id} className="border border-gray-100 rounded-xl shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">
                          {typeInfo.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm text-[#1A1A2E]">{resource.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              resource.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
                            }`}>
                              {resource.status === 'active' ? '✓ 活跃' : '已禁用'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {typeInfo.name} · 创建: {formatDate(resource.created_at)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="text-red-400 text-xs hover:text-red-600 px-2 py-1"
                        >
                          删除
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* 资源类型提示 */}
          <div className="mt-4 bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-500">ℹ️</span>
              <div className="text-sm text-blue-600">
                <p className="font-medium">支持的资源类型</p>
                <p className="text-xs mt-1 text-blue-500">
                  GitHub、GitLab、Vercel、Netlify、阿里云OSS、AWS S3、OpenAI、飞书、Notion等
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Skills Tab ==================== */}
      {activeTab === 'skills' && (
        <div className="px-4 py-3">
          {/* Skills 概念说明 */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl p-4 mb-4 text-white">
            <div className="font-medium mb-1">⚡ Skills = 能力 + 权限</div>
            <div className="text-xs text-white/80">
              为 Agent 分配 Skills，让它具备相应的操作能力
            </div>
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-[#FF6B3D] text-white'
                  : 'bg-white border border-gray-100 text-gray-600'
              }`}
            >
              全部 ({skills.length})
            </button>
            {skillCategories.map((cat) => {
              const count = skills.filter(s => s.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#FF6B3D] text-white'
                      : 'bg-white border border-gray-100 text-gray-600'
                  }`}
                >
                  {cat.icon} {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Skills 列表 */}
          <div className="space-y-2">
            {skills
              .filter(s => !selectedCategory || s.category === selectedCategory)
              .map((skill) => (
                <Card key={skill.id} className="border border-gray-100 rounded-xl shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg shrink-0">
                        {skill.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm text-[#1A1A2E]">{skill.displayName}</h3>
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">
                            {skill.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {skill.permissions.slice(0, 3).map((perm, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded">
                              {perm}
                            </span>
                          ))}
                          {skill.permissions.length > 3 && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded">
                              +{skill.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* ==================== Add Token Modal ==================== */}
      {showAddTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">添加 Token</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">名称</label>
                <input
                  type="text"
                  value={newToken.name}
                  onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                  placeholder="如：我的 GitHub Token"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20 focus:border-[#FF6B3D]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">类型</label>
                <select
                  value={newToken.type}
                  onChange={(e) => setNewToken({ ...newToken, type: e.target.value as TokenType })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {TOKEN_TYPES.map((type) => {
                    const info = getTokenTypeInfo(type);
                    return (
                      <option key={type} value={type}>
                        {info.icon} {info.label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">密钥</label>
                <input
                  type="password"
                  value={newToken.key}
                  onChange={(e) => setNewToken({ ...newToken, key: e.target.value })}
                  placeholder="输入 API Key 或 Token"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTokenModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAddToken}
                disabled={saving || !newToken.name || !newToken.key}
                className="flex-1 py-2.5 rounded-lg bg-[#FF6B3D] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Add Resource Modal ==================== */}
      {showAddResourceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">添加资源</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">名称</label>
                <input
                  type="text"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                  placeholder="如：我的 GitHub"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">类型</label>
                <select
                  value={newResource.type}
                  onChange={(e) => setNewResource({ ...newResource, type: e.target.value, config: {} })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {resourceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* 动态配置字段 */}
              {resourceTypes.find(t => t.id === newResource.type)?.configFields.map((field: any) => (
                <div key={field.key}>
                  <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={newResource.config[field.key] || ''}
                    onChange={(e) => setNewResource({
                      ...newResource,
                      config: { ...newResource.config, [field.key]: e.target.value }
                    })}
                    placeholder={`输入${field.label}`}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddResourceModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAddResource}
                disabled={saving || !newResource.name}
                className="flex-1 py-2.5 rounded-lg bg-[#FF6B3D] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}