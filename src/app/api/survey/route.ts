import { NextRequest } from 'next/server';
import { fail, json, readBody, safeOrigin, sheet, validToken } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** A guest opens their survey. The Sheet only releases it to guests who were checked in at the event. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!validToken(token)) return json(400, { ok: false, error: 'Invalid survey link' });
  try {
    return json(200, await sheet('surveyForm', { token }));
  } catch (error) {
    return fail(error);
  }
}

/** A guest submits their answers. */
export async function POST(req: NextRequest) {
  if (!safeOrigin(req)) return json(403, { ok: false, error: 'Invalid origin' });
  const body = await readBody(req);
  if (!validToken(body.token)) return json(400, { ok: false, error: 'Invalid survey link' });
  if (!Array.isArray(body.answers) || body.answers.length > 12) return json(400, { ok: false, error: 'Invalid answers' });
  try {
    return json(200, await sheet('surveySubmit', { token: body.token, answers: body.answers }));
  } catch (error) {
    return fail(error);
  }
}
