'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { event } from '@/lib/event';
import s from './home.module.css';

const start = Date.parse(event.startISO);
const end = Date.parse(event.endISO);

/** Live countdown to the start of the evening. Renders on the client so the server and browser never disagree. */
export function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (now !== null && now >= start) {
    return <p className={s.countMessage}>{now < end ? 'The evening is under way.' : 'Thank you for celebrating with us.'}</p>;
  }

  const left = now === null ? null : start - now;
  const units: [string, number | null][] = [
    ['Days', left === null ? null : Math.floor(left / 86400000)],
    ['Hours', left === null ? null : Math.floor((left % 86400000) / 3600000)],
    ['Minutes', left === null ? null : Math.floor((left % 3600000) / 60000)],
    ['Seconds', left === null ? null : Math.floor((left % 60000) / 1000)],
  ];

  return (
    <div className={s.countGrid} role="timer" aria-label="Time until the event begins">
      {units.map(([label, value]) => {
        const text = value === null ? '––' : String(value).padStart(2, '0');
        return (
          <div className={s.countUnit} key={label}>
            <strong>
              <motion.span key={text} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
                {text}
              </motion.span>
            </strong>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
