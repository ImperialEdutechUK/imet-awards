import 'server-only';
import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

/** Server-side helpers shared by the API routes. Secrets stay in environment variables. */

const TOKEN_RE = /^[a-f0-9]{32}$/i;
export const ADMIN_COOKIE = 'evt_admin';
const SESSION_SECONDS = 8 * 60 * 60;

type HttpError = Error & { status?: number };
const httpError = (message: string, status: number): HttpError => Object.assign(new Error(message), { status });

export function json(status: number, data: unknown) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function validToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_RE.test(token);
}

/** Browser requests that change data must come from this site itself. */
export function safeOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser API clients
  try {
    const url = new URL(origin);
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    return url.host === host && (url.protocol === 'https:' || (local && url.protocol === 'http:'));
  } catch {
    return false;
  }
}

/** Calls the Apps Script web app that reads and writes HR's private Google Sheet. */
export async function sheet(action: string, fields: Record<string, unknown> = {}, timeoutMs = 15000) {
  const url = process.env.SHEET_WEBHOOK_URL;
  const secret = process.env.SHEET_WEBHOOK_SECRET;
  if (!url || !secret || url.includes('REPLACE_ME')) throw httpError('Google Sheet integration is not configured yet.', 503);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ secret, action, ...fields }),
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw httpError('Google Sheets service unavailable', 502);

  let data: { ok?: boolean; error?: string; status?: number } & Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    throw httpError('Invalid Google Sheets response', 502);
  }
  if (!data.ok) throw httpError(data.error || 'Request unsuccessful', data.status || 400);
  return data;
}

function sign(payload: string) {
  return crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'invalid').update(payload).digest('hex');
}

export function createSession() {
  const payload = `v1:${Date.now() + SESSION_SECONDS * 1000}`;
  return `${payload}:${sign(payload)}`;
}

export function sessionCookie(value: string, maxAge = SESSION_SECONDS) {
  return {
    name: ADMIN_COOKIE,
    value,
    path: '/',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge,
    secure: Boolean(process.env.VERCEL),
  };
}

export function isAdmin(req: NextRequest) {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const value = req.cookies.get(ADMIN_COOKIE)?.value;
  if (typeof value !== 'string') return false;
  const match = /^(v1:\d+):([a-f0-9]{64})$/.exec(value);
  if (!match) return false;
  const expires = Number(match[1].split(':')[1]);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  return crypto.timingSafeEqual(Buffer.from(match[2]), Buffer.from(sign(match[1])));
}

export const staffRequired = () => json(401, { ok: false, error: 'Staff sign-in required' });

/** Never returns secrets or stack traces to the browser. */
export function fail(error: unknown) {
  const err = error as HttpError;
  const status = err?.status && err.status >= 400 && err.status <= 599 ? err.status : 500;
  const message = err?.message && !/secret|token|key/i.test(err.message) ? err.message : 'Request failed';
  return json(status, { ok: false, error: message });
}

export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
