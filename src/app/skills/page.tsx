'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

interface OpenClawSkill {
  name: string;
  description: string;
  emoji: string;
  homepage?: string;
  category: string;
  source: 'system' | 'user';
  requires?: {
    bins?: string[];
    env?: string[];
  };
}

interface SkillStats {
  total: number;
  system: number;
  user: number;
  byCategory: Record<string, number>;
}

interface SkillCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<OpenClawSkill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/openclaw-skills');
      
      if (!response.ok) {
        throw new Error('Failed to load skills');
      }
      
      const data = await response.json();
      setSkills(data.skills || []);
      setCategories(data.categories || []);
      setStats(data.stats || null);
      setError(null);
    } catch (err) {
      console.error('Load skills error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  // 过滤 skills
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = !searchQuery || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || skill.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 获取分类名称
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
  };

  // 获取分类图标
  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.icon : '📦';
  };

  // 调用 skill
  const invokeSkill = async (skillName: string) => {
    try {
      const response = await fetch(`/api/skills/${skillName}/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '测试调用' }),
      });
      
      const result = await response.json();
      console.log('Skill invoke result:', result);
      
      // TODO: 显示结果给用户
      alert(`Skill ${skillName} 调用结果:\n${result.result || JSON.stringify(result, null, 2)}`);
    } catch (err) {
      console.error('Invoke skill error:', err);
      alert(`调用失败: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-[#1A1A2E]">Skills 市场</h1>
        <p className="text-xs text-gray-400 mt-0.5">OpenClaw 真实可用技能</p>
      </div>

      {/* 搜索 */}
      <div className="px-4 py-3">
        <input 
          type="text" 
          placeholder="搜索 Skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 text-sm bg-white border border-gray-200 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20"
        />
      </div>

      {/* 统计 */}
      {stats && (
        <div className="px-4 flex gap-3">
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-xl font-bold text-[#1A1A2E]">{stats.total}</div>
            <div className="text-[10px] text-gray-400">可用 Skills</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-xl font-bold text-[#FF6B3D]">{stats.system}</div>
            <div className="text-[10px] text-gray-400">系统内置</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-xl font-bold text-[#1A1A2E]">{stats.user}</div>
            <div className="text-[10px] text-gray-400">用户安装</div>
          </div>
        </div>
      )}

      {/* 分类标签 */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
              selectedCategory === null 
                ? 'bg-[#FF6B3D] text-white' 
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                selectedCategory === cat.id 
                  ? 'bg-[#FF6B3D] text-white' 
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="px-4 py-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#FF6B3D] border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <button 
              onClick={loadSkills}
              className="mt-2 text-xs text-red-400 underline"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* Skills 列表 */}
      {!loading && !error && (
        <div className="px-4 py-2 space-y-2">
          {filteredSkills.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              没有找到匹配的 Skills
            </div>
          ) : (
            filteredSkills.map((skill) => (
              <Card key={skill.name} className="border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B3D] to-[#FF8F6B] flex items-center justify-center text-lg">
                      {skill.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{skill.name}</h3>
                        {skill.source === 'user' && (
                          <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">
                            用户
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">{skill.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-300">
                          {getCategoryIcon(skill.category)} {getCategoryName(skill.category)}
                        </span>
                        {skill.requires?.bins && skill.requires.bins.length > 0 && (
                          <span className="text-[10px] text-gray-300">
                            需要: {skill.requires.bins.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => invokeSkill(skill.name)}
                      className="px-3 py-1.5 text-xs bg-[#FF6B3D] text-white rounded-lg hover:bg-[#E55A2D] transition-colors"
                    >
                      调用
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 底部信息 */}
      {!loading && !error && skills.length > 0 && (
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-gray-400">
            共 {filteredSkills.length} / {skills.length} 个 Skills
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}