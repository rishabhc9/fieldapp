import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'admin_session';
const SESSION_HOURS = 12;

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAdminSessionCookieValue(): string {
  const secret = requireSecret();
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `admin:${expiresAt}`;
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function isValidAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const secret = requireSecret();

  const lastDot = cookieValue.lastIndexOf('.');
  if (lastDot === -1) return false;

  const payload = cookieValue.slice(0, lastDot);
  const signature = cookieValue.slice(lastDot + 1);
  const expected = sign(payload, secret);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const [, expiresAtStr] = payload.split(':');
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

function requireSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('Missing ADMIN_SESSION_SECRET environment variable.');
  }
  return secret;
}
