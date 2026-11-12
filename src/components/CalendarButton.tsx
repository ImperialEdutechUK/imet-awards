'use client';

import { event } from '@/lib/event';

/** Downloads a calendar file for the event, built from the dates in src/lib/event.ts. */
export function CalendarButton({ className = 'btn btn-ghost' }: { className?: string }) {
  const download = () => {
    const start = new Date(event.startISO);
    const end = new Date(event.endISO);
    const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//iMET//Imperial Excellence Awards//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', `UID:${stamp(start)}-awards@imet-event`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(event.name)}`, `LOCATION:${esc(`${event.venue} ${event.city}, ${event.location}`)}`,
      `DESCRIPTION:${esc([event.intro, ...event.notes].join(' '))}`, 'END:VEVENT', 'END:VCALENDAR',
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'imperial-excellence-awards.ics';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  return <button type="button" className={className} onClick={download}>Add to calendar</button>;
}
