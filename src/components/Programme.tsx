'use client';

import { motion, useScroll, useSpring, type MotionStyle } from 'motion/react';
import { useRef } from 'react';
import { event } from '@/lib/event';
import s from './home.module.css';

const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** The order of the evening. The gold line draws itself as the section scrolls through the window. */
export function Programme() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 92%', 'end 78%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <ol className={s.steps} ref={ref}>
      <motion.span className={s.stepsLine} style={{ '--draw': progress } as MotionStyle} aria-hidden="true" />
      {event.programme.map((item, i) => (
        <motion.li
          key={item.heading}
          className={s.step}
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, delay: i * 0.14, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <span className={s.numeral} aria-hidden="true">{numerals[i]}</span>
          <h3>{item.heading}</h3>
          <p>{item.detail}</p>
        </motion.li>
      ))}
    </ol>
  );
}
