import { NextRequest } from 'next/server';
import { json, safeOrigin, sessionCookie } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!safeOrigin(req)) return json(403, { ok: false, error: 'Invalid origin' });
  const response = json(200, { ok: true });
  response.cookies.set(sessionCookie('', 0));
  return response;
}
