import { NextRequest } from 'next/server';
import { fail, isAdmin, json, sheet, staffRequired } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return staffRequired();
  try {
    return json(200, await sheet('summary'));
  } catch (error) {
    return fail(error);
  }
}
