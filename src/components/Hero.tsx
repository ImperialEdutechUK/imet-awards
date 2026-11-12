'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { event } from '@/lib/event';
import { CalendarButton } from './CalendarButton';
import { Embers } from './Embers';
import { ArrowIcon, CalendarIcon, PinIcon } from './Icons';
import { Silk } from './Silk';
import { StarTrophy } from './StarTrophy';
import s from './home.module.css';

const ease = [0.2, 0.7, 0.2, 1] as const;
const group = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } } };
const rise = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease } } };
const letters = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };
const letter = { hidden: { opacity: 0, y: '0.35em', filter: 'blur(8px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease } } };

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const silkY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const trophyY = useTransform(scrollYProgress, [0, 1], ['0%', '-10%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section className={s.hero} ref={ref} aria-labelledby="hero-title">
      <motion.div className={s.heroSilk} style={{ y: silkY }} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2.2, ease }}>
        <Silk />
      </motion.div>
      <div className={s.spotlight} aria-hidden="true" />
      <Embers className={s.embers} />

      <div className={`container ${s.heroInner}`}>
        <motion.div className={s.lockup} variants={group} initial="hidden" animate="show" style={{ opacity: fade }}>
          <motion.p className={s.save} variants={rise}>
            <i aria-hidden="true" />
            <span>Save <b>the</b> date</span>
            <i aria-hidden="true" />
          </motion.p>

          <h1 id="hero-title" className={s.title} aria-label={event.name}>
            <motion.span className={s.titleTop} variants={rise} aria-hidden="true">{event.title.top}</motion.span>
            <motion.span className={s.titleMain} variants={letters} aria-hidden="true">
              {event.title.main.split('').map((char, i) => (
                <motion.span key={i} variants={letter}>{char}</motion.span>
              ))}
            </motion.span>
            <motion.span className={s.titleSub} variants={rise} aria-hidden="true">{event.title.sub}</motion.span>
            <motion.span className={s.year} variants={rise} aria-hidden="true">
              <i />
              <span>{event.title.year}</span>
              <i />
            </motion.span>
          </h1>

          <motion.p className={s.tagline} variants={rise}>{event.tagline}</motion.p>

          <motion.dl className={s.facts} variants={rise}>
            <div>
              <CalendarIcon />
              <div>
                <dt className="visually-hidden">Date</dt>
                <dd><small>{event.dayText}</small><strong>{event.dateText}</strong></dd>
              </div>
            </div>
            <div>
              <PinIcon />
              <div>
                <dt className="visually-hidden">Venue</dt>
                <dd><strong>{event.venue}</strong><small>{event.city}</small></dd>
              </div>
            </div>
          </motion.dl>

          <motion.div className={s.heroActions} variants={rise}>
            <a href="#details" className="btn btn-gold">Event details <ArrowIcon /></a>
            <CalendarButton />
          </motion.div>
        </motion.div>

        <motion.div
          className={s.trophy}
          style={{ y: trophyY }}
          initial={{ opacity: 0, scale: 0.86, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.8, delay: 0.5, ease }}
        >
          <div className={s.trophyFloat}><StarTrophy /></div>
        </motion.div>
      </div>

      <a href="#evening" className={s.scrollCue}>
        <span>Scroll</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
