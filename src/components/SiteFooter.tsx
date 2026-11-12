import Link from 'next/link';
import { event } from '@/lib/event';
import { StarMark } from './Icons';
import s from './chrome.module.css';

export function SiteFooter() {
  return (
    <footer className={s.footer}>
      <div className={`container ${s.footerInner}`}>
        <span className={s.footerBrand}><StarMark /> {event.name}</span>
        <span>
          {event.dayText}, {event.dateText} · {event.venue} {event.city}
          {event.contactEmail ? <> · <a href={`mailto:${event.contactEmail}`}>Contact the event team</a></> : null}
        </span>
        <Link href="/staff" className={s.staffLink}>Staff check-in</Link>
      </div>
    </footer>
  );
}
