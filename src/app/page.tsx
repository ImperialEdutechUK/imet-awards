import Link from 'next/link';
import { CalendarButton } from '@/components/CalendarButton';
import { Countdown } from '@/components/Countdown';
import { CurtainIntro } from '@/components/CurtainIntro';
import { Hero } from '@/components/Hero';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import s from '@/components/home.module.css';
import { event } from '@/lib/event';

const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export default function HomePage() {
  return (
    <CurtainIntro>
      <SiteHeader />
      <main>
        <Hero />

        <section className={s.count} aria-labelledby="count-title">
          <div className={`container ${s.countInner}`}>
            <div>
              <h2 id="count-title" className={s.countTitle}>Until the doors open</h2>
              <p className={s.countCaption}>{event.dayText}, {event.dateText}, 6:00 PM Sri Lanka time</p>
            </div>
            <Countdown />
          </div>
        </section>

        <section className={s.section} id="evening" aria-labelledby="evening-title">
          <div className={`container ${s.eveningGrid}`}>
            <div>
              <h2 id="evening-title" className={s.heading}>An evening in honour of our people</h2>
              <p className={s.lead}>{event.intro}</p>
              <p className={s.body}>{event.closing}</p>
            </div>
            <ul className={s.pillars}>
              {event.pillars.map((pillar) => (
                <li key={pillar.title}>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${s.section} ${s.dark}`} id="programme" aria-labelledby="programme-title">
          <div className="container">
            <div className={s.sectionHead}>
              <h2 id="programme-title" className={s.heading}>The order of the evening</h2>
              <p className={s.body}>{event.programmeNote}</p>
            </div>
            <ol className={s.steps}>
              {event.programme.map((item, i) => (
                <li key={item.heading}>
                  <span className={s.numeral} aria-hidden="true">{numerals[i]}</span>
                  <h3>{item.heading}</h3>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={s.section} id="details" aria-labelledby="details-title">
          <div className="container">
            <div className={s.sectionHead}>
              <h2 id="details-title" className={s.heading}>The details</h2>
            </div>
            <dl className={s.details}>
              <div>
                <dt>Date</dt>
                <dd>{event.dateText}<small>{event.dayText}</small></dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{event.timeText}<small>{event.timezoneText}</small></dd>
              </div>
              <div>
                <dt>Venue</dt>
                <dd>{event.venue} {event.city}<small>{event.location}</small></dd>
              </div>
              <div>
                <dt>{event.themeLabel}</dt>
                <dd>
                  {event.theme.map((t) => t.name).join(' | ')}
                  <span className={s.swatches} aria-hidden="true">
                    {event.theme.map((t) => <i key={t.name} style={{ background: t.colour }} />)}
                  </span>
                </dd>
              </div>
            </dl>
            <div className={s.notes}>
              <p>{event.notes.join(' ')}</p>
              <CalendarButton />
            </div>
          </div>
        </section>

        <section className={`${s.section} ${s.dark} ${s.rsvp}`} aria-labelledby="rsvp-title">
          <div className={`container ${s.rsvpInner}`}>
            <div>
              <h2 id="rsvp-title" className={s.heading}>Confirm your attendance</h2>
              <p className={s.body}>
                Each guest receives a personal link by email from HR. Open it to confirm your attendance, view your assigned seat and collect your QR entry pass.
              </p>
            </div>
            <Link href="/invite" className="btn btn-gold">Open your RSVP</Link>
          </div>
        </section>

        <section className={s.signoff} aria-label="Closing">
          <p className={s.script}>{event.signoff}</p>
        </section>
      </main>
      <SiteFooter />
    </CurtainIntro>
  );
}
