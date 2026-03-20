import { NextRequest, NextResponse } from 'next/server';
import {
  createToken,
  getTokensByUser,
  deleteToken,
  getTokenById,
  updateTokenStatus,
  getUsageStats,
  getOrCreateResourceQuota,
  TokenType,
} from '@/lib/db/tokens';
import { getUserFromToken } from '@/lib/auth';

// GET - List tokens and stats
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = getTokensByUser(user.id);
    const stats = getUsageStats(user.id);
    const quota = getOrCreateResourceQuota(user.id);

    // Mask sensitive data
    const safeTokens = tokens.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      status: t.status,
      last_used_at: t.last_used_at,
      created_at: t.created_at,
    }));

    return NextResponse.json({
      tokens: safeTokens,
      stats,
      quota: {
        aliyun_balance: quota.aliyun_balance,
        total_tokens_used: quota.total_tokens_used,
        total_cost_usd: quota.total_cost_usd,
      },
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new token
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, key } = body;

    if (!name || !type || !key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes: TokenType[] = ['github', 'aliyun_oss', 'feishu', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 400 });
    }

    const token = createToken(user.id, name, type, key);

    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        name: token.name,
        type: token.type,
        status: token.status,
        created_at: token.created_at,
      },
    });
  } catch (error) {
    console.error('Create token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a token
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    // Verify token belongs to user
    const token = getTokenById(id);
    if (!token || token.user_id !== user.id) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const deleted = deleteToken(id);

    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('Delete token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update token status
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify token belongs to user
    const token = getTokenById(id);
    if (!token || token.user_id !== user.id) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const validStatuses = ['active', 'expired', 'revoked'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = updateTokenStatus(id, status);

    return NextResponse.json({
      success: true,
      token: updated ? {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        status: updated.status,
      } : null,
    });
  } catch (error) {
    console.error('Update token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}