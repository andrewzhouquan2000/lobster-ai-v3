import { NextRequest, NextResponse } from 'next/server';
import {
  createResource,
  getResourcesByUser,
  getResourceById,
  updateResource,
  deleteResource,
  getResourceStats,
  validateResourceConfig,
} from '@/lib/db/resources';
import { getUserFromToken } from '@/lib/auth';
import { resourceTypes, type ResourceType } from '@/data/skills';

// GET - 获取资源列表或类型信息
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const statsOnly = searchParams.get('stats');

    // 只获取统计
    if (statsOnly === 'true') {
      const stats = getResourceStats(user.id);
      return NextResponse.json({ stats });
    }

    // 按类型获取
    if (type) {
      const resources = getResourcesByUser(user.id).filter(r => r.type === type);
      return NextResponse.json({ resources });
    }

    // 获取所有资源
    const resources = getResourcesByUser(user.id);
    return NextResponse.json({ 
      resources,
      types: resourceTypes,
    });
  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - 创建新资源
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, config } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // 验证配置
    const validation = validateResourceConfig(type as ResourceType, config || {});
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    const resource = createResource(user.id, name, type, config || {});

    if (!resource) {
      return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
    }

    // 不返回敏感配置信息
    return NextResponse.json({
      success: true,
      resource: {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        status: resource.status,
        created_at: resource.created_at,
      },
    });
  } catch (error) {
    console.error('Create resource error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - 更新资源
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, config, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
    }

    // 验证资源属于用户
    const existing = getResourceById(id);
    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (config) updates.config = config;
    if (status) updates.status = status;

    const resource = updateResource(id, updates);

    if (!resource) {
      return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resource: {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        status: resource.status,
        updated_at: resource.updated_at,
      },
    });
  } catch (error) {
    console.error('Update resource error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - 删除资源
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
    }

    // 验证资源属于用户
    const existing = getResourceById(id);
    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const deleted = deleteResource(id);

    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('Delete resource error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}