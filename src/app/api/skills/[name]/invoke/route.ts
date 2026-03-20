/**
 * OpenClaw Skill 调用 API
 * 通过 OpenClaw Gateway 执行 skill
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOpenClawSkillByName } from '@/lib/openclaw-skills';

// Gateway 配置
const GATEWAY_URL = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_GATEWAY_TOKEN || '';

interface InvokeRequest {
  prompt?: string;      // 用户提示词
  context?: string;     // 额外上下文
  params?: Record<string, any>;  // 技能参数
}

/**
 * POST - 调用 Skill
 * 
 * 请求体:
 * {
 *   "prompt": "天气怎么样",
 *   "context": "用户在北京",
 *   "params": { "location": "北京" }
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: skillName } = await params;
    const body: InvokeRequest = await request.json().catch(() => ({}));
    
    // 验证 skill 存在
    const skill = getOpenClawSkillByName(skillName);
    if (!skill) {
      return NextResponse.json({ 
        error: 'Skill not found',
        available: false 
      }, { status: 404 });
    }

    // 构建调用消息
    // OpenClaw 会根据消息内容自动激活对应的 skill
    const userMessage = body.prompt || body.context || '';
    
    if (!userMessage) {
      return NextResponse.json({ 
        error: 'Prompt is required' 
      }, { status: 400 });
    }

    // 添加 skill 前缀提示，帮助 OpenClaw 识别要使用的 skill
    const skillHint = `[使用 ${skill.name} skill] `;
    const fullPrompt = skillHint + userMessage;

    // 调用 OpenClaw Gateway
    const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GATEWAY_TOKEN && { 'Authorization': `Bearer ${GATEWAY_TOKEN}` }),
      },
      body: JSON.stringify({
        model: 'default',
        messages: [
          { role: 'user', content: fullPrompt }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Skill Invoke] Gateway error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Gateway error',
        status: response.status,
        details: errorText
      }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      skill: skillName,
      result: content,
      raw: data,
    });

  } catch (error) {
    console.error('Skill invoke error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET - 获取 Skill 信息和可用性
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: skillName } = await params;
    const skill = getOpenClawSkillByName(skillName);
    
    if (!skill) {
      return NextResponse.json({ 
        error: 'Skill not found',
        available: false 
      }, { status: 404 });
    }

    // 检查 Gateway 连接状态
    let gatewayStatus = 'unknown';
    try {
      const healthCheck = await fetch(`${GATEWAY_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      gatewayStatus = healthCheck.ok ? 'connected' : 'error';
    } catch {
      gatewayStatus = 'disconnected';
    }

    return NextResponse.json({
      skill,
      available: gatewayStatus === 'connected',
      gateway: {
        url: GATEWAY_URL,
        status: gatewayStatus,
      },
    });

  } catch (error) {
    console.error('Get skill info error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}