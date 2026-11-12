'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { event } from '@/lib/event';
import { isPassCode, readSavedPass, savePass } from '@/lib/guestPass';
import p from './portal.module.css';

/** Full-screen QR pass for confirmed guests. */
export function TicketClient() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const valid = isPassCode(token);
  const [saved, setSaved] = useState<'checking' | 'none' | 'found'>('checking');
  const [guest, setGuest] = useState<{ name: string; seat?: string } | null>(null);
  const [error, setError] = useState('');

  // Opened without a personal link: use the pass saved on this device, if there is one.
  useEffect(() => {
    if (valid) return;
    const remembered = readSavedPass();
    if (remembered) {
      setSaved('found');
      router.replace(`/ticket?token=${encodeURIComponent(remembered)}`);
    } else {
      setSaved('none');
    }
  }, [valid, router]);

  useEffect(() => {
    if (!valid) return;
    let live = true;
    (async () => {
      try {
        const res = await fetch(`/api/invite?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Pass unavailable');
        if (data.guest.rsvp !== 'Yes') throw new Error('Please confirm your attendance to activate your pass.');
        if (live) { setGuest(data.guest); savePass(token); }
      } catch (e) {
        if (live) setError((e as Error).message);
      }
    })();
    return () => { live = false; };
  }, [valid, token]);

  const waiting = !valid && saved !== 'none';
  const problem = waiting ? '' : !valid ? 'Please open the personal pass link from your email.' : error;

  return (
    <div className={p.panel}>
      <p className={p.overline}>Official event pass</p>
      <h1 className={p.name}>{guest?.name ?? 'Your entry pass'}</h1>
      <p className={p.meta}>
        {event.dayText}, {event.dateText} · {event.timeText}
        <br />
        {event.venue} {event.city}
      </p>
      {problem ? (
        <p className={`${p.status} ${p.messageError}`} role="alert">{problem}</p>
      ) : !guest ? (
        <div className={p.loading} role="status"><span className={p.spinner} /><span>Retrieving your pass…</span></div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={`${p.qr} ${p.qrLarge}`} src={`/api/qr?token=${encodeURIComponent(token)}`} alt="QR code for the check-in team to scan" width={320} height={320} />
          <p className={p.status}>{guest.seat ? `Assigned seat: ${guest.seat}` : 'Seating details will be shared by HR.'}</p>
          <p className={p.caption}>Present this QR code to the check-in team on arrival. Your pass is personal and should not be shared.</p>
        </>
      )}
      <div className={p.actions}>
        <Link className="link-quiet" href={valid ? `/invite?token=${encodeURIComponent(token)}` : '/'}>
          {valid ? 'Back to your RSVP' : 'Return to the event website'}
        </Link>
      </div>
    </div>
  );
}
