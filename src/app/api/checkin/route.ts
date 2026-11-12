import { NextRequest } from 'next/server';
import { fail, isAdmin, json, readBody, safeOrigin, sheet, staffRequired, validToken } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!safeOrigin(req)) return json(403, { ok: false, error: 'Invalid origin' });
  if (!isAdmin(req)) return staffRequired();
  const { token } = await readBody(req);
  if (!validToken(token)) return json(400, { ok: false, error: 'Not a valid event pass' });
  try {
    return json(200, await sheet('checkin', { token }));
  } catch (error) {
    return fail(error);
  }
}
