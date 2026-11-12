'use client';

import { motion } from 'motion/react';
import { event } from '@/lib/event';
import { CalendarButton } from './CalendarButton';
import { useIntroRevealed } from './CurtainIntro';
import s from './home.module.css';

const ease = [0.2, 0.7, 0.2, 1] as const;
const group = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } };
const rise = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } };

/** The opening screen: the event title set like a printed invitation on the wall. */
export function Hero() {
  const revealed = useIntroRevealed(); // waits for the curtain to part

  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <motion.div className={`container ${s.lockup}`} variants={group} initial="hidden" animate={revealed ? 'show' : 'hidden'}>
        <motion.p className={s.save} variants={rise}>
          <i aria-hidden="true" />
          <span>Save the date</span>
          <i aria-hidden="true" />
        </motion.p>

        <h1 id="hero-title" className={s.title} aria-label={event.name}>
          <motion.span className={s.titleTop} variants={rise} aria-hidden="true">{event.title.top}</motion.span>
          <motion.span className={s.titleMain} variants={rise} aria-hidden="true">{event.title.main}</motion.span>
          <motion.span className={s.titleSub} variants={rise} aria-hidden="true">{event.title.sub}</motion.span>
          <motion.span className={s.year} variants={rise} aria-hidden="true">{event.title.year}</motion.span>
        </h1>

        <motion.p className={s.tagline} variants={rise}>{event.tagline}</motion.p>

        <motion.dl className={s.facts} variants={rise}>
          <div>
            <dt className="visually-hidden">Date</dt>
            <dd>{event.dayText}, {event.dateText}</dd>
          </div>
          <div>
            <dt className="visually-hidden">Venue</dt>
            <dd>{event.venue}, {event.city}</dd>
          </div>
        </motion.dl>

        <motion.div className={s.heroActions} variants={rise}>
          <a href="#details" className="btn btn-gold">Event details</a>
          <CalendarButton />
        </motion.div>
      </motion.div>
    </section>
  );
}
