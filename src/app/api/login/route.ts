import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { createSession, json, readBody, safeOrigin, sessionCookie } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!safeOrigin(req)) return json(403, { ok: false, error: 'Invalid origin' });
  const body = await readBody(req);
  const provided = String(body.password || '');
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || !process.env.ADMIN_SESSION_SECRET || provided.length > 200)
    return json(503, { ok: false, error: 'Staff access is not configured' });

  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  if (!crypto.timingSafeEqual(a, b)) return json(401, { ok: false, error: 'Incorrect staff password' });

  const response = json(200, { ok: true });
  response.cookies.set(sessionCookie(createSession()));
  return response;
}
