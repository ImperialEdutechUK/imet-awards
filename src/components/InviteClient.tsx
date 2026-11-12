'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { event } from '@/lib/event';
import { ArrowIcon, SparkIcon } from './Icons';
import p from './portal.module.css';

type Guest = { name: string; department?: string; seat?: string; rsvp?: string; receivedAt?: string };
type Action = { action: 'rsvp'; answer: 'Yes' | 'No' } | { action: 'acknowledge' };
const TOKEN_RE = /^[a-f0-9]{32}$/i;

/** A guest's personal RSVP page. The token in the link identifies the guest; nothing is stored in the browser. */
export function InviteClient() {
  const token = useSearchParams().get('token') ?? '';
  const valid = TOKEN_RE.test(token);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; bad?: boolean }>({ text: '' });

  const request = useCallback(async (body?: Action): Promise<Guest> => {
    const res = await fetch(body ? '/api/invite' : `/api/invite?token=${encodeURIComponent(token)}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify({ token, ...body }) : undefined,
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({ error: 'Unexpected server response' }));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Your details could not be loaded');
    return data.guest as Guest;
  }, [token]);

  useEffect(() => {
    if (!valid) return;
    let live = true;
    request().then((g) => live && setGuest(g)).catch((e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [valid, request]);

  const act = async (body: Action) => {
    setBusy(true);
    setMessage({ text: 'Saving your response…' });
    try {
      setGuest(await request(body));
      setMessage({ text: body.action === 'acknowledge' ? 'Thank you. Receipt has been recorded.' : 'Thank you. Your response has been recorded.' });
    } catch (e) {
      setMessage({ text: (e as Error).message, bad: true });
    } finally {
      setBusy(false);
    }
  };

  const problem = !valid ? 'Please open the personal link sent to you by email. Public registration is not available.' : error;
  const rsvp = guest?.rsvp ?? '';
  const seatingPlan = /^https:\/\//i.test(event.seatingPlanUrl) ? event.seatingPlanUrl : '';

  return (
    <>
      <div className={p.intro}>
        <h1 className={p.title}>Your RSVP</h1>
        <p className={p.meta}>
          {event.dayText}, {event.dateText} · {event.timeText}
          <br />
          {event.venue} {event.city}
        </p>
        <p className={p.text}>This page is personal to you. Please keep the link private.</p>
      </div>

      <div className={p.panel}>
        {problem ? (
          <div>
            <SparkIcon className={p.errorMark} />
            <h2 className={p.errorTitle}>We could not find your details</h2>
            <p className={p.text}>{problem}</p>
            <div className={p.actions}>
              <Link href="/" className="btn btn-ghost">Return to the event website</Link>
            </div>
          </div>
        ) : !guest ? (
          <div className={p.loading} role="status">
            <span className={p.spinner} />
            <span>Retrieving your details…</span>
          </div>
        ) : (
          <div>
            <p className={p.overline}>Reserved for</p>
            <h2 className={p.name}>{guest.name}</h2>
            <dl className={p.info}>
              <div><dt>Department</dt><dd>{guest.department || 'Not specified'}</dd></div>
              <div><dt>Seating</dt><dd>{guest.seat || 'To be shared by HR'}</dd></div>
            </dl>
            <p className={`${p.status} ${rsvp === 'Yes' ? p.confirmed : ''}`}>
              {rsvp === 'Yes' ? 'Your attendance is confirmed. We look forward to welcoming you.'
                : rsvp === 'No' ? 'Thank you for letting us know. Your response has been recorded.'
                : 'Kindly confirm whether you will be attending.'}
            </p>
            <div className={p.actions}>
              <button type="button" className="btn btn-gold" disabled={busy} onClick={() => act({ action: 'rsvp', answer: 'Yes' })}>
                {rsvp === 'Yes' ? 'Attendance confirmed' : 'Yes, I will attend'}
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => act({ action: 'rsvp', answer: 'No' })}>
                {rsvp === 'No' ? 'Recorded: unable to attend' : 'Unable to attend'}
              </button>
              {!guest.receivedAt && (
                <button type="button" className={`link-quiet ${p.ack}`} disabled={busy} onClick={() => act({ action: 'acknowledge' })}>
                  I have received my invitation
                </button>
              )}
            </div>

            {rsvp === 'Yes' && (
              <div className={p.pass}>
                <p className={p.overline}>Your entry pass</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={p.qr} src={`/api/qr?token=${encodeURIComponent(token)}`} alt="Your personal QR entry pass" width={240} height={240} />
                <p className={p.caption}>Please present this QR code to the check-in team on arrival. It is personal to you and should not be shared.</p>
                <div className={p.actions}>
                  <Link className="btn btn-wine" href={`/ticket?token=${encodeURIComponent(token)}`}>Open full-screen pass <ArrowIcon /></Link>
                  {seatingPlan && <a className={`link-quiet ${p.ack}`} href={seatingPlan} target="_blank" rel="noopener noreferrer">View the seating plan</a>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p className={`${p.message} ${message.bad ? p.messageError : ''}`} role="status" aria-live="polite">{message.text}</p>
      <p className={p.note}>For questions, or to update your details, please contact the HR or event team.</p>
    </>
  );
}
