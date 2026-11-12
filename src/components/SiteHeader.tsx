'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { event } from '@/lib/event';
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
          <strong>{event.shortName}</strong>
          <small>{label ?? `${event.title.sub} ${event.title.year}`}</small>
        </Link>
        {variant === 'home' ? (
          <>
            <nav className={s.nav} aria-label="Main menu">
              <a href="#evening">The evening</a>
              <a href="#programme">Programme</a>
              <a href="#details">Details</a>
            </nav>
            <Link className={s.cta} href="/invite">Your RSVP</Link>
          </>
        ) : (
          <Link className={s.cta} href="/">Event website</Link>
        )}
      </div>
    </header>
  );
}
