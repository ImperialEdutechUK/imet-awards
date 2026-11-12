import { NextRequest } from 'next/server';
import { fail, isAdmin, json, readBody, safeOrigin, sheet, staffRequired } from '@/lib/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // sending a batch of emails can take a little longer than other requests

/** Staff only: the survey, who it has gone to, and the results so far. */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return staffRequired();
  try {
    return json(200, await sheet('surveyGet'));
  } catch (error) {
    return fail(error);
  }
}

/** Staff only: save the survey, or email it to the next batch of guests who attended. */
export async function POST(req: NextRequest) {
  if (!safeOrigin(req)) return json(403, { ok: false, error: 'Invalid origin' });
  if (!isAdmin(req)) return staffRequired();
  const body = await readBody(req);
  try {
    if (body.action === 'save') return json(200, await sheet('surveySave', { survey: body.survey }));
    if (body.action === 'send') return json(200, await sheet('surveySend', {}, 27000));
    return json(400, { ok: false, error: 'Unknown request' });
  } catch (error) {
    return fail(error);
  }
}
