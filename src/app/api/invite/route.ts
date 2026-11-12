import { NextRequest } from 'next/server';
import { fail, json, readBody, safeOrigin, sheet, validToken } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** Looks up one guest by their private token. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!validToken(token)) return json(400, { ok: false, error: 'Invalid invitation link' });
  try {
    return json(200, await sheet('lookup', { token }));
  } catch (error) {
    return fail(error);
  }
}

/** Records a guest's acknowledgement or RSVP in the HR sheet. */
export async function POST(req: NextRequest) {
  if (!safeOrigin(req)) return json(403, { ok: false, error: 'Invalid origin' });
  const body = await readBody(req);
  const token = body.token;
  if (!validToken(token)) return json(400, { ok: false, error: 'Invalid invitation link' });
  try {
    if (body.action === 'acknowledge') return json(200, await sheet('acknowledge', { token }));
    if (body.action === 'rsvp' && (body.answer === 'Yes' || body.answer === 'No'))
      return json(200, await sheet('rsvp', { token, answer: body.answer }));
    return json(400, { ok: false, error: 'Invalid response' });
  } catch (error) {
    return fail(error);
  }
}
