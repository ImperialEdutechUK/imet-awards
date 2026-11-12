'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/clientApi';
import { isPassCode, readSavedPass } from '@/lib/guestPass';
import type { Survey } from '@/lib/survey';
import p from './portal.module.css';
import s from './survey.module.css';

type Form = { guest: { name: string }; survey: Survey; answered: boolean };

/** The survey a guest fills in after the event. Only guests who were checked in can open it. */
export function SurveyClient() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const valid = isPassCode(token);
  const [saved, setSaved] = useState<'checking' | 'none' | 'found'>('checking');
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<(string | number)[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Opened without a personal link: use the pass saved on this device, if there is one.
  useEffect(() => {
    if (valid) return;
    const remembered = readSavedPass();
    if (remembered) { setSaved('found'); router.replace(`/survey?token=${encodeURIComponent(remembered)}`); } else { setSaved('none'); }
  }, [valid, router]);

  useEffect(() => {
    if (!valid) return;
    let live = true;
    api<Form>(`survey?token=${encodeURIComponent(token)}`)
      .then((data) => { if (live) { setForm(data); setAnswers(data.survey.questions.map(() => '')); } })
      .catch((e: Error) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [valid, token]);

  const setAnswer = (index: number, value: string | number) => { setMessage(''); setAnswers((current) => current.map((a, i) => (i === index ? value : a))); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const missing = form.survey.questions.findIndex((q, i) => q.type !== 'text' && answers[i] === '');
    if (missing >= 0) { setMessage(`Please answer question ${missing + 1}.`); return; }
    setBusy(true); setMessage('Sending your answers…');
    try {
      await api('survey', 'POST', { token, answers });
      setDone(true);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const waiting = !valid && saved !== 'none';
  const problem = waiting ? '' : !valid ? 'Please open the survey link sent to you by email.' : error;

  if (done) {
    return (
      <div className={p.panel}>
        <h1 className={p.title}>Thank you</h1>
        <p className={p.text}>Your answers have been recorded. We appreciate you taking the time.</p>
        <div className={p.actions}><Link href="/" className="btn btn-ghost">Return to the event website</Link></div>
      </div>
    );
  }

  if (problem) {
    return (
      <div className={p.panel}>
        <h1 className={p.errorTitle}>The survey could not be opened</h1>
        <p className={p.text}>{problem}</p>
        <div className={p.actions}><Link href="/" className="btn btn-ghost">Return to the event website</Link></div>
      </div>
    );
  }

  if (!form) {
    return <div className={p.loading} role="status"><span className={p.spinner} /><span>Opening the survey…</span></div>;
  }

  return (
    <>
      <div className={p.intro}>
        <h1 className={p.title}>{form.survey.title}</h1>
        <p className={p.meta}>For {form.guest.name}</p>
        {form.survey.message && <p className={p.text}>{form.survey.message}</p>}
        {form.answered && <p className={p.text}>You have already answered. Sending again replaces your earlier answers.</p>}
      </div>

      <form className={`${p.panel} ${s.form}`} onSubmit={submit} noValidate>
        {form.survey.questions.map((q, i) => (
          <fieldset key={i} className={s.question}>
            <legend><span aria-hidden="true">{i + 1}.</span> {q.text}{q.type === 'text' && <em> (optional)</em>}</legend>
            {q.type === 'rating' && (
              <div className={s.rating}>
                <span className={s.scaleEnd}>Poor</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className={answers[i] === n ? s.picked : ''}>
                    <input type="radio" name={`q${i}`} value={n} checked={answers[i] === n} onChange={() => setAnswer(i, n)} />
                    <span>{n}</span>
                  </label>
                ))}
                <span className={s.scaleEnd}>Excellent</span>
              </div>
            )}
            {q.type === 'yesno' && (
              <div className={s.choice}>
                {['Yes', 'No'].map((v) => (
                  <label key={v} className={answers[i] === v ? s.picked : ''}>
                    <input type="radio" name={`q${i}`} value={v} checked={answers[i] === v} onChange={() => setAnswer(i, v)} />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'text' && (
              <textarea rows={3} maxLength={1000} value={String(answers[i] ?? '')} onChange={(e) => setAnswer(i, e.target.value)} aria-label={q.text} />
            )}
          </fieldset>
        ))}
        <button type="submit" className="btn btn-gold btn-block" disabled={busy}>Send my answers</button>
        <p className={p.message} role="status" aria-live="polite">{message}</p>
      </form>
    </>
  );
}
