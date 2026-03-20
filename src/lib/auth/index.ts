import db from '../db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { generateToken, verifyToken } from './jwt';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'lobster_session';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Re-export JWT functions for convenience
export { generateToken, verifyToken };

// User operations
export function createUser(email: string, password: string, displayName?: string): AuthResult {
  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return { success: false, error: '该邮箱已被注册' };
    }

    const userId = randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name)
      VALUES (?, ?, ?, ?)
    `).run(userId, email, passwordHash, displayName || email.split('@')[0]);

    const user = getUserById(userId);
    return { success: true, user };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: '注册失败，请重试' };
  }
}

export function authenticateUser(email: string, password: string): AuthResult {
  try {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!row) {
      return { success: false, error: '邮箱或密码错误' };
    }

    const isValid = bcrypt.compareSync(password, row.password_hash);
    if (!isValid) {
      return { success: false, error: '邮箱或密码错误' };
    }

    const user: User = {
      id: row.id,
      email: row.email,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return { success: true, user };
  } catch (error) {
    console.error('Authenticate error:', error);
    return { success: false, error: '登录失败，请重试' };
  }
}

export function getUserById(id: string): User | undefined {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!row) return undefined;

  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Session management with cookies
export async function setSession(userId: string) {
  const token = await generateToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // HTTP 环境
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return token;
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded) return null;

    return getUserById(decoded.userId) || null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * 从请求中获取用户信息
 * 支持两种方式：
 * 1. Cookie 中的 session token
 * 2. Authorization header 中的 Bearer token
 */
export async function getUserFromToken(request: NextRequest): Promise<User | null> {
  try {
    // 方式1: 从 Cookie 获取
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
    
    if (sessionToken) {
      const decoded = await verifyToken(sessionToken);
      if (decoded) {
        return getUserById(decoded.userId) || null;
      }
    }
    
    // 方式2: 从 Authorization header 获取
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = await verifyToken(token);
      if (decoded) {
        return getUserById(decoded.userId) || null;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}