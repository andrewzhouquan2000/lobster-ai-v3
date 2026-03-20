// JWT utilities using jose (Edge Runtime compatible)
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'lobster-ai-secret-key-change-in-production';
const COOKIE_NAME = 'lobster_session';

// Convert secret to Uint8Array for jose
function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function generateToken(userId: string): Promise<string> {
  const secret = getSecretKey();
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  return token;
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string };
  } catch {
    return null;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}