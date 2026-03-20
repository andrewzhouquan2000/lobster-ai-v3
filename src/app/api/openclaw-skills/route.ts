/**
 * OpenClaw Skills API
 * 读取和展示真实的 OpenClaw skills
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllOpenClawSkills,
  getOpenClawSkillByName,
  getOpenClawSkillsByCategory,
  searchOpenClawSkills,
  getOpenClawSkillsStats,
  getOpenClawSkillReadme,
  skillCategories,
  type OpenClawSkill,
  type SkillCategory,
} from '@/lib/openclaw-skills';

// GET - 获取 OpenClaw Skills
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const name = searchParams.get('name');
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    // 获取单个 Skill 详情
    if (action === 'detail' && name) {
      const skill = getOpenClawSkillByName(name);
      if (!skill) {
        return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
      }
      
      const readme = getOpenClawSkillReadme(name);
      return NextResponse.json({ skill, readme });
    }

    // 搜索 Skills
    if (query) {
      const skills = searchOpenClawSkills(query);
      return NextResponse.json({ skills });
    }

    // 按分类获取 Skills
    if (category) {
      const skills = getOpenClawSkillsByCategory(category as SkillCategory);
      return NextResponse.json({ skills });
    }

    // 获取统计信息
    if (action === 'stats') {
      const stats = getOpenClawSkillsStats();
      return NextResponse.json({ 
        stats,
        categories: skillCategories 
      });
    }

    // 获取所有 Skills
    const skills = getAllOpenClawSkills();
    const stats = getOpenClawSkillsStats();
    
    return NextResponse.json({ 
      skills,
      stats,
      categories: skillCategories,
    });
  } catch (error) {
    console.error('Get OpenClaw skills error:', error);
    return NextResponse.json({ 
      error: 'Failed to load skills',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}