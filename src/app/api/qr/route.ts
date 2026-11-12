import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { json, validToken } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** Returns the guest's QR entry pass as a PNG. The code holds only the pass link, never a name or email. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!validToken(token)) return json(400, { ok: false, error: 'Invalid event pass' });

  let base: URL;
  try {
    base = new URL(process.env.PUBLIC_BASE_URL || `https://${req.headers.get('host')}`);
    if (!['https:', 'http:'].includes(base.protocol)) throw new Error('protocol');
  } catch {
    return json(500, { ok: false, error: 'Event URL not configured' });
  }
  base.pathname = '/ticket';
  base.search = new URLSearchParams({ token }).toString();

  // Black on pale gold: on theme, and dark-on-light so every scanner reads it.
  const buffer = await QRCode.toBuffer(base.toString(), {
    type: 'png',
    errorCorrectionLevel: 'M',
    width: 420,
    margin: 2,
    color: { dark: '#050203', light: '#f8e6b8' },
  });
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'private, no-store' },
  });
}
