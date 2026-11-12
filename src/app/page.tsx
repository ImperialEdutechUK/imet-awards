import Link from 'next/link';
import { CalendarButton } from '@/components/CalendarButton';
import { Countdown } from '@/components/Countdown';
import { Hero } from '@/components/Hero';
import { ArrowIcon, CalendarIcon, ClockIcon, PinIcon, SparkIcon, StarMark } from '@/components/Icons';
import { Programme } from '@/components/Programme';
import { Reveal } from '@/components/Reveal';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import s from '@/components/home.module.css';
import { event } from '@/lib/event';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />

        <section className={s.countBand} aria-labelledby="count-title">
          <div className={`container ${s.countInner}`}>
            <Reveal>
              <h2 id="count-title" className={s.countTitle}>The countdown to awards night</h2>
              <p className={s.countCaption}>
                Doors open {event.dayText}, {event.dateText} at 6:00 PM, Sri Lanka time.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <Countdown />
            </Reveal>
          </div>
        </section>

        <section className={s.evening} id="evening" aria-labelledby="evening-title">
          <div className={`container ${s.eveningGrid}`}>
            <div>
              <Reveal>
                <h2 id="evening-title" className={s.heading}>An evening in honour of our people</h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className={s.lead}>{event.intro}</p>
              </Reveal>
              <Reveal delay={0.18}>
                <p className={s.body}>{event.closing}</p>
              </Reveal>
            </div>
            <ul className={s.pillars}>
              {event.pillars.map((pillar, i) => (
                <li key={pillar.title}>
                  <Reveal delay={0.1 + i * 0.12} className={s.pillar}>
                    <StarMark />
                    <div>
                      <h3>{pillar.title}</h3>
                      <p>{pillar.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={s.programme} id="programme" aria-labelledby="programme-title">
          <div className="container">
            <Reveal className={s.sectionHead}>
              <h2 id="programme-title" className={s.heading}>The order of the evening</h2>
              <p className={s.body}>{event.programmeNote}</p>
            </Reveal>
            <Programme />
          </div>
        </section>

        <section className={s.details} id="details" aria-labelledby="details-title">
          <div className="container">
            <Reveal className={s.sectionHead}>
              <h2 id="details-title" className={s.heading}>The details</h2>
            </Reveal>
            <Reveal>
              <dl className={s.detailFrame}>
                <div className={s.detail}>
                  <CalendarIcon />
                  <dt>Date</dt>
                  <dd>{event.dateText}<small>{event.dayText}</small></dd>
                </div>
                <div className={s.detail}>
                  <ClockIcon />
                  <dt>Time</dt>
                  <dd>{event.timeText}<small>{event.timezoneText}</small></dd>
                </div>
                <div className={s.detail}>
                  <PinIcon />
                  <dt>Venue</dt>
                  <dd>{event.venue} {event.city}<small>{event.location}</small></dd>
                </div>
                <div className={s.detail}>
                  <SparkIcon />
                  <dt>{event.themeLabel}</dt>
                  <dd>
                    {event.theme.map((t) => t.name).join(' | ')}
                    <span className={s.swatches} aria-hidden="true">
                      {event.theme.map((t) => <i key={t.name} style={{ background: t.colour }} />)}
                    </span>
                  </dd>
                </div>
              </dl>
            </Reveal>
            <Reveal className={s.notes} delay={0.1}>
              <p>{event.notes.join(' ')}</p>
              <CalendarButton />
            </Reveal>
          </div>
        </section>

        <section className={s.rsvp} aria-labelledby="rsvp-title">
          <div className={`container ${s.rsvpInner}`}>
            <Reveal>
              <h2 id="rsvp-title" className={s.rsvpTitle}>Confirm your attendance</h2>
              <p className={s.rsvpText}>
                Each guest receives a personal link by email from HR. Open it to confirm your attendance, view your assigned seat and collect your QR entry pass.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <Link href="/invite" className="btn btn-gold">Open your RSVP <ArrowIcon /></Link>
            </Reveal>
          </div>
        </section>

        <section className={s.signoff} aria-label="Closing">
          <Reveal>
            <p className={s.script}>{event.signoff}</p>
            <svg className={s.flourish} viewBox="0 0 330 14" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="flourish" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#c0284b" stopOpacity="0" /><stop offset=".2" stopColor="#c0284b" /><stop offset=".75" stopColor="#8f1838" /><stop offset="1" stopColor="#8f1838" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M4 11C70 3 150 1 214 5C258 8 296 9 326 6" fill="none" stroke="url(#flourish)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
