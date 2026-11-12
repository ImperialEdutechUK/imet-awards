'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { event } from '@/lib/event';
import { ArrowIcon, StarMark } from './Icons';
import s from './chrome.module.css';

type Props = { variant?: 'home' | 'portal'; label?: string };

export function SiteHeader({ variant = 'home', label }: Props) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${s.header} ${scrolled || variant === 'portal' ? s.solid : ''}`}>
      <div className={`container ${s.bar}`}>
        <Link href="/" className={s.brand} aria-label={`${event.name} home`}>
          <span className={s.mark}><StarMark /></span>
          <span>
            <strong>{event.shortName}</strong>
            <small>{label ?? `${event.organisation} · ${event.title.sub} ${event.title.year}`}</small>
          </span>
        </Link>
        {variant === 'home' ? (
          <>
            <nav className={s.nav} aria-label="Main menu">
              <a href="#evening">The evening</a>
              <a href="#programme">Programme</a>
              <a href="#details">Details</a>
            </nav>
            <Link className={s.cta} href="/invite">Your RSVP <ArrowIcon /></Link>
          </>
        ) : (
          <Link className={s.cta} href="/" aria-label="Event website">
            <span className={s.ctaLong}>Event website</span>
            <span className={s.ctaShort} aria-hidden="true">Home</span>
            <ArrowIcon />
          </Link>
        )}
      </div>
    </header>
  );
}
