'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/clientApi';
import { event } from '@/lib/event';
import { MAX_QUESTIONS, QUESTION_TYPES, starterSurvey, type QuestionType, type Survey, type SurveyOverview } from '@/lib/survey';
import staff from './staff.module.css';
import s from './survey.module.css';

/**
 * Staff tool for the post-event survey: write the questions, email it to guests who were
 * checked in at the event (and only those), and read the results.
 */
export function SurveyManager({ checkedIn }: { checkedIn: number }) {
  const [overview, setOverview] = useState<SurveyOverview | null>(null);
  const [draft, setDraft] = useState<Survey>(() => starterSurvey(event.name));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<'' | 'save' | 'send'>('');
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState<{ text: string; bad?: boolean }>({ text: '' });

  const load = useCallback(async () => {
    try {
      const data = await api<SurveyOverview>('survey/manage');
      setOverview(data);
      if (data.survey) { setDraft(data.survey); setDirty(false); }
    } catch (e) {
      setNote({ text: (e as Error).message, bad: true });
    }
  }, []);
  // Reload when the number of checked-in guests changes, so the counts stay current.
  useEffect(() => { load(); }, [load, checkedIn]);

  const change = (next: Survey) => { setDraft(next); setDirty(true); setConfirming(false); };
  const setQuestion = (index: number, patch: Partial<Survey['questions'][number]>) =>
    change({ ...draft, questions: draft.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) });

  const save = async () => {
    setBusy('save'); setNote({ text: 'Saving…' });
    try {
      const data = await api<SurveyOverview>('survey/manage', 'POST', { action: 'save', survey: draft });
      setOverview(data); if (data.survey) setDraft(data.survey);
      setDirty(false); setNote({ text: 'Survey saved. It has not been sent yet.' });
    } catch (e) {
      setNote({ text: (e as Error).message, bad: true });
    } finally { setBusy(''); }
  };

  // Emails go out a few at a time; keep asking until every attendee has been sent one.
  const send = async () => {
    setConfirming(false); setBusy('send');
    let total = 0, failed = 0;
    try {
      for (let round = 0; round < 80; round++) {
        setNote({ text: total ? `Sending… ${total} sent so far.` : 'Sending…' });
        const data = await api<SurveyOverview>('survey/manage', 'POST', { action: 'send' });
        setOverview(data); total += data.sent ?? 0; failed += data.failed ?? 0;
        const waiting = data.remaining ?? 0;
        if (!waiting) { setNote({ text: total ? `Survey emailed to ${total} ${total === 1 ? 'guest' : 'guests'} who attended.` : 'Everyone who attended has already been sent the survey.' }); break; }
        if (!data.sent) {
          setNote({ bad: true, text: data.quotaLeft === 0
            ? `Google's daily email limit has been reached. ${total} sent; ${waiting} still waiting. Send again tomorrow.`
            : `${failed || waiting} ${(failed || waiting) === 1 ? 'guest' : 'guests'} could not be emailed. Check the LastError column in the Guests sheet, then send again.` });
          break;
        }
      }
    } catch (e) {
      setNote({ bad: true, text: `${(e as Error).message}${total ? ` (${total} sent before this.)` : ''}` });
    } finally { setBusy(''); }
  };

  const stats = overview?.stats;
  const waiting = stats ? stats.attended - stats.sent : 0;
  const locked = Boolean(overview?.locked);

  return (
    <section className={`${staff.card} ${s.manager}`} aria-labelledby="survey-title">
      <h2 id="survey-title">Post-event survey</h2>
      <p>
        Write the survey here, then email it. It is sent only to guests who were checked in at the event; guests who did not attend never receive it and cannot open it.
      </p>

      {!overview ? (
        <p className={s.muted}>{note.bad ? note.text : 'Loading the survey…'}</p>
      ) : (
        <>
          <dl className={s.stats}>
            <div><dt>Attended</dt><dd>{stats!.attended}</dd></div>
            <div><dt>Survey sent</dt><dd>{stats!.sent}</dd></div>
            <div><dt>Answered</dt><dd>{stats!.responses}</dd></div>
          </dl>

          {locked ? (
            <div className={s.readOnly}>
              <h3>{overview.survey!.title}</h3>
              {overview.survey!.message && <p>{overview.survey!.message}</p>}
              <p className={s.muted}>The survey has been sent, so its questions can no longer be changed.</p>
            </div>
          ) : (
            <div className={staff.form}>
              <label htmlFor="survey-name">Survey title</label>
              <input id="survey-name" value={draft.title} maxLength={120} onChange={(e) => change({ ...draft, title: e.target.value })} />
              <label htmlFor="survey-message">Message in the email</label>
              <textarea id="survey-message" rows={3} maxLength={600} value={draft.message} onChange={(e) => change({ ...draft, message: e.target.value })} />

              <p className={s.listLabel}>Questions</p>
              <ol className={s.questions}>
                {draft.questions.map((q, i) => (
                  <li key={i}>
                    <span className={s.number} aria-hidden="true">{i + 1}</span>
                    <input aria-label={`Question ${i + 1}`} value={q.text} maxLength={200} placeholder="Type the question" onChange={(e) => setQuestion(i, { text: e.target.value })} />
                    <select aria-label={`Answer type for question ${i + 1}`} value={q.type} onChange={(e) => setQuestion(i, { type: e.target.value as QuestionType })}>
                      {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button type="button" className="link-quiet" onClick={() => change({ ...draft, questions: draft.questions.filter((_, n) => n !== i) })} aria-label={`Remove question ${i + 1}`}>Remove</button>
                  </li>
                ))}
              </ol>
              <div className={s.row}>
                <button type="button" className="btn btn-ghost" disabled={draft.questions.length >= MAX_QUESTIONS} onClick={() => change({ ...draft, questions: [...draft.questions, { text: '', type: 'rating' }] })}>Add a question</button>
                <button type="button" className="btn btn-wine" disabled={busy !== '' || (!dirty && Boolean(overview.survey))} onClick={save}>
                  {!dirty && overview.survey ? 'Saved' : 'Save survey'}
                </button>
              </div>
            </div>
          )}

          <div className={s.send}>
            {confirming ? (
              <>
                <p>
                  Email the survey to {waiting} {waiting === 1 ? 'guest' : 'guests'} who attended?
                  {!locked && ' After it is sent, the questions cannot be changed.'}
                </p>
                <div className={s.row}>
                  <button type="button" className="btn btn-gold" onClick={send}>Send now</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                {(!locked || waiting > 0) && (
                  <button type="button" className="btn btn-gold" disabled={busy !== '' || !overview.survey || dirty || waiting < 1} onClick={() => setConfirming(true)}>
                    {locked ? `Send to ${waiting} more ${waiting === 1 ? 'guest' : 'guests'}` : `Send to ${waiting} ${waiting === 1 ? 'guest' : 'guests'} who attended`}
                  </button>
                )}
                <p className={s.muted}>
                  {!overview.survey || dirty ? 'Save the survey before sending it.'
                    : stats!.attended < 1 ? 'No guests have been checked in yet, so there is no one to send it to.'
                    : waiting < 1 ? 'Everyone who attended has been sent the survey. Guests checked in later can be sent it from here.'
                    : 'Each guest is emailed once, with a link that is personal to them.'}
                </p>
              </>
            )}
          </div>

          <p className={`${s.note} ${note.bad ? s.noteBad : ''}`} role="status" aria-live="polite">{note.text}</p>

          {locked && (
            <div className={s.results}>
              <div className={s.resultsHead}>
                <h3>Results so far</h3>
                <button type="button" className="link-quiet" onClick={load}>Refresh results</button>
              </div>
              {stats!.responses < 1 ? (
                <p className={s.muted}>No answers yet. They also appear in the &quot;Survey responses&quot; tab of the Sheet.</p>
              ) : (
                <ol className={s.resultList}>
                  {overview.results.map((r, i) => (
                    <li key={i}>
                      <h4>{r.text}</h4>
                      {r.type === 'rating' && (
                        <>
                          <p className={s.figure}>{r.average ?? '–'} <small>out of 5, from {r.count} {r.count === 1 ? 'answer' : 'answers'}</small></p>
                          <div className={s.bars}>
                            {[5, 4, 3, 2, 1].map((n) => {
                              const votes = r.spread?.[n - 1] ?? 0;
                              return (
                                <div key={n} className={s.bar}>
                                  <span>{n}</span>
                                  <i><b style={{ width: `${r.count ? (votes / r.count) * 100 : 0}%` }} /></i>
                                  <span>{votes}</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {r.type === 'yesno' && <p className={s.figure}>Yes {r.yes} <small>and No {r.no}, from {r.count} {r.count === 1 ? 'answer' : 'answers'}</small></p>}
                      {r.type === 'text' && (r.comments?.length ? (
                        <ul className={s.comments}>{r.comments.map((c, n) => <li key={n}>{c}</li>)}</ul>
                      ) : <p className={s.muted}>No written answers yet.</p>)}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
