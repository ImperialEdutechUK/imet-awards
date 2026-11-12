'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Html5Qrcode } from 'html5-qrcode';
import { event } from '@/lib/event';
import { ArrowIcon } from './Icons';
import p from './portal.module.css';
import s from './staff.module.css';

type Counts = { total: number; sent: number; received: number; confirmed: number; declined: number; checkedIn: number };
type Result = { kind: 'idle' | 'working' | 'good' | 'warning' | 'bad'; heading: string; text: string };
type ApiError = Error & { status?: number };

const TOKEN_RE = /^[a-f0-9]{32}$/i;
const STATS: [keyof Counts, string][] = [
  ['total', 'On HR list'], ['sent', 'Invitations sent'], ['received', 'Acknowledged'],
  ['confirmed', 'Confirmed'], ['declined', 'Declined'], ['checkedIn', 'Checked in'],
];

async function api<T = Record<string, unknown>>(path: string, method: 'GET' | 'POST' = 'GET', data?: unknown): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method, credentials: 'same-origin', cache: 'no-store',
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await res.json().catch(() => ({ error: 'Unexpected server response' }));
  if (!res.ok || !body.ok) throw Object.assign(new Error(body.error || 'Request failed'), { status: res.status });
  return body as T;
}

/** Accepts a bare token or a full pass link (old or new address format). */
function parsePass(text: string) {
  const value = String(text || '').trim();
  if (TOKEN_RE.test(value)) return value.toLowerCase();
  try {
    const token = new URL(value).searchParams.get('token');
    if (token && TOKEN_RE.test(token)) return token.toLowerCase();
  } catch { /* not a link */ }
  return null;
}

/** Password-protected check-in dashboard for entry staff: live totals, camera scanner and manual fallback. */
export function StaffClient() {
  const [phase, setPhase] = useState<'checking' | 'login' | 'dashboard'>('checking');
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loginStatus, setLoginStatus] = useState('');
  const [password, setPassword] = useState('');
  const [manual, setManual] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result>({ kind: 'idle', heading: '', text: 'Check-in results will appear here.' });
  const scanner = useRef<Html5Qrcode | null>(null);
  const busy = useRef(false);
  const lastSeen = useRef('');

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ counts: Counts }>('summary');
      setCounts(data.counts);
      setPhase('dashboard');
    } catch (e) {
      if ((e as ApiError).status === 401) setPhase('login');
      else { setPhase((current) => (current === 'checking' ? 'login' : current)); setResult({ kind: 'bad', heading: 'Totals unavailable', text: (e as Error).message }); setLoginStatus((e as Error).message); }
    }
  }, []);

  useEffect(() => {
    refresh();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, [refresh]);

  const stopScanner = useCallback(async () => {
    if (scanner.current && scanner.current.isScanning) {
      try { await scanner.current.stop(); } catch { /* already stopped */ }
    }
    setScanning(false);
  }, []);
  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const checkIn = useCallback(async (raw: string) => {
    const token = parsePass(raw);
    if (!token) { setResult({ kind: 'bad', heading: 'Pass not recognised', text: 'Scan a valid event QR code or enter the full pass link.' }); return; }
    if (busy.current) return;
    busy.current = true;
    setResult({ kind: 'working', heading: 'Checking the HR list…', text: 'Please keep the pass ready.' });
    try {
      const data = await api<{ guest: { name: string; department?: string; seat?: string }; alreadyCheckedIn?: boolean }>('checkin', 'POST', { token });
      const g = data.guest;
      const details = `${g.department ? `${g.department} · ` : ''}${g.seat ? `Seat ${g.seat}` : 'Seat not assigned'}`;
      setResult(data.alreadyCheckedIn
        ? { kind: 'warning', heading: `Already checked in: ${g.name}`, text: details }
        : { kind: 'good', heading: `Welcome, ${g.name}`, text: details });
      setManual('');
      await refresh();
    } catch (e) {
      setResult({ kind: 'bad', heading: 'Unable to check in', text: (e as Error).message });
    } finally {
      busy.current = false;
    }
  }, [refresh]);

  const toggleScanner = async () => {
    if (scanning) { await stopScanner(); return; }
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      scanner.current = scanner.current ?? new Html5Qrcode('reader');
      await scanner.current.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        async (value) => {
          const token = parsePass(value);
          if (!token || busy.current || token === lastSeen.current) return;
          lastSeen.current = token;
          await checkIn(token);
          setTimeout(() => { if (lastSeen.current === token) lastSeen.current = ''; }, 4500);
        },
        () => {},
      );
      setScanning(true);
    } catch {
      setResult({ kind: 'bad', heading: 'Camera could not start', text: 'Allow camera permission in the browser, or use manual check-in.' });
      await stopScanner();
    }
  };

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoginStatus('Signing in…');
    try {
      await api('login', 'POST', { password });
      setPassword(''); setLoginStatus('');
      await refresh();
    } catch (err) {
      setLoginStatus((err as Error).message);
    }
  };

  const signOut = async () => {
    await stopScanner();
    try { await api('logout', 'POST'); } catch { /* session already ended */ }
    setCounts(null); setPhase('login');
  };

  if (phase === 'checking') {
    return <div className={p.loading} role="status"><span className={p.spinner} /><span>Opening the staff dashboard…</span></div>;
  }

  if (phase === 'login') {
    return (
      <div className={`${p.panel} ${s.login}`}>
        <p className={p.overline}>Private staff access</p>
        <h1 className={p.title}>Staff check-in</h1>
        <p className={p.text}>{event.dateText} · {event.venue} {event.city}. Sign in with the staff password to manage arrivals.</p>
        <form className={s.form} onSubmit={signIn}>
          <label htmlFor="staff-password">Staff password</label>
          <input id="staff-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn btn-gold btn-block" type="submit">Open the dashboard <ArrowIcon /></button>
        </form>
        <p className={`${p.message} ${p.messageError}`} role="status">{loginStatus}</p>
      </div>
    );
  }

  return (
    <div className={s.dashboard}>
      <div className={s.titleRow}>
        <div>
          <h1 className={p.title}>Guest check-in</h1>
          <p className={p.text}>Scan each guest&apos;s QR pass with this device&apos;s camera, or check in by hand below.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={signOut}>Sign out</button>
      </div>

      <dl className={s.stats}>
        {STATS.map(([key, label]) => (
          <div key={key} className={`${s.stat} ${key === 'checkedIn' ? s.statKey : ''}`}>
            <dt>{label}</dt>
            <dd>{counts ? counts[key] : '–'}</dd>
          </div>
        ))}
      </dl>

      <div className={s.columns}>
        <section className={s.card} aria-labelledby="scan-title">
          <h2 id="scan-title">Scan a guest pass</h2>
          <p>Allow camera access when asked, then point the camera at the guest&apos;s QR code.</p>
          <div className={s.reader}>
            <div id="reader" />
            {!scanning && <div className={s.readerOff}><span aria-hidden="true" /><em>Camera is off</em></div>}
          </div>
          <button type="button" className="btn btn-gold btn-block" onClick={toggleScanner}>{scanning ? 'Stop scanner' : 'Start scanner'}</button>
          <p className={s.hint}>For quicker access at the entrance, add this page to your phone&apos;s home screen.</p>
        </section>

        <section className={s.card} aria-labelledby="manual-title">
          <h2 id="manual-title">Manual check-in</h2>
          <p>Use this when a QR code cannot be scanned.</p>
          <form className={s.form} onSubmit={(e) => { e.preventDefault(); checkIn(manual); }}>
            <label htmlFor="guest-token">Guest pass link or 32-character code</label>
            <textarea id="guest-token" rows={3} value={manual} onChange={(e) => setManual(e.target.value)} placeholder="https://…/ticket?token=…" />
            <button className="btn btn-wine btn-block" type="submit">Check in guest <ArrowIcon /></button>
          </form>
          <div className={`${s.result} ${s[result.kind]}`} role="status" aria-live="polite">
            {result.heading && <strong>{result.heading}</strong>}
            <p>{result.text}</p>
          </div>
          <button type="button" className="link-quiet" onClick={refresh}>Refresh attendance totals</button>
        </section>
      </div>
    </div>
  );
}
