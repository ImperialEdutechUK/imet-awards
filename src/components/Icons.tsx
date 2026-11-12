import type { SVGProps } from 'react';

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" {...props}>
      <rect x="3.5" y="5.5" width="19" height="17" rx="2.5" {...line} />
      <path d="M3.5 10.5h19M8.5 3v5M17.5 3v5M8 14.5h2M12 14.5h2M16 14.5h2M8 18h2M12 18h2" {...line} />
    </svg>
  );
}
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" {...props}>
      <circle cx="13" cy="13" r="9.5" {...line} />
      <path d="M13 7.5V13l3.8 2.4" {...line} />
    </svg>
  );
}
export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" {...props}>
      <path d="M13 23.5s-7.5-7-7.5-12.6a7.5 7.5 0 0 1 15 0C20.5 16.5 13 23.5 13 23.5Z" {...line} />
      <circle cx="13" cy="10.8" r="2.7" {...line} />
    </svg>
  );
}
export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" {...props}>
      <path d="M13 3.5l2.6 6.9 6.9 2.6-6.9 2.6L13 22.5l-2.6-6.9L3.5 13l6.9-2.6Z" {...line} />
    </svg>
  );
}
export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" {...props}>
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" {...line} />
    </svg>
  );
}
/** Four-point star used as the site's mark. */
export function StarMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6Z" fill="currentColor" />
    </svg>
  );
}
