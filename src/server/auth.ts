import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/index.ts';

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  'greenova-enterprise-2026-hmac-signing-key-change-in-env';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface AuthTokenPayload {
  sub: number;
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    farmAssigned?: string;
    isEmailVerified?: boolean;
  };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(
  password: string,
  stored: string
): { valid: boolean; needsRehash: boolean } {
  if (!stored) return { valid: false, needsRehash: false };

  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, hashHex] = parts;
    try {
      const derived = crypto.scryptSync(password, salt, 64);
      const expected = Buffer.from(hashHex, 'hex');
      if (derived.length !== expected.length) {
        return { valid: false, needsRehash: false };
      }
      return { valid: crypto.timingSafeEqual(derived, expected), needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Fallback for any legacy plaintext passwords stored in DB before hashing migration
  const a = Buffer.from(password, 'utf8');
  const b = Buffer.from(stored, 'utf8');
  if (a.length !== b.length) return { valid: false, needsRehash: false };
  const valid = crypto.timingSafeEqual(a, b);
  return { valid, needsRehash: valid };
}

export function signAuthToken(user: {
  id: number;
  email: string;
  role: string;
  name: string;
}): string {
  const now = Date.now();
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `gov1.${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  if (!token || !token.startsWith('gov1.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, encodedPayload, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as AuthTokenPayload;
    if (!payload.sub || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        message: 'Authentication required. Please sign in again.',
        code: 'UNAUTHORIZED',
      });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({
        message: 'Session expired or invalid. Please sign in again.',
        code: 'INVALID_TOKEN',
      });
    }

    const userRes = await pool.query(
      'SELECT id, name, email, role, status::text AS status, "farmAssigned", "isEmailVerified" FROM public."user" WHERE id = $1 LIMIT 1',
      [payload.sub]
    );
    const dbUser = userRes.rows[0];
    if (!dbUser) {
      return res.status(401).json({
        message: 'Account not found. Please sign in again.',
        code: 'USER_NOT_FOUND',
      });
    }
    if (dbUser.status !== 'allowed') {
      return res.status(403).json({
        message: 'Your account has been suspended or is pending approval.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    req.authUser = dbUser;
    return next();
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ message: 'Authentication check failed.' });
  }
}

export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const user = req.authUser;
  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({
      message: 'Forbidden: Only Super Administrators can perform this action.',
      code: 'FORBIDDEN',
    });
  }
  return next();
}
