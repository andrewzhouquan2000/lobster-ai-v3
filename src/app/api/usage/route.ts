import { NextRequest, NextResponse } from 'next/server';
import {
  createUsageLog,
  getUsageStats,
  getUsageLogsByUser,
} from '@/lib/db/tokens';
import { getUserFromToken } from '@/lib/auth';

// GET - Get usage logs
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs = getUsageLogsByUser(user.id, limit);
    const stats = getUsageStats(user.id);

    return NextResponse.json({ logs, stats });
  } catch (error) {
    console.error('Get usage logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Log usage
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token_id, provider, model, input_tokens, output_tokens, cost_usd, request_type } = body;

    if (!provider || input_tokens === undefined || output_tokens === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const log = createUsageLog(
      user.id,
      provider,
      input_tokens,
      output_tokens,
      token_id,
      model,
      request_type,
      cost_usd
    );

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Create usage log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}