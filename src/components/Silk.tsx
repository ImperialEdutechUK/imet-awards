/** Burgundy silk ribbons that frame each page, echoing the event artwork. */
export function Silk({ className, variant = 'hero' }: { className?: string; variant?: 'hero' | 'corner' }) {
  const id = `silk-${variant}`;
  return (
    <svg className={className} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a11c40" /><stop offset=".5" stopColor="#6d1029" /><stop offset="1" stopColor="#1d060c" /></linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#8f1838" /><stop offset=".55" stopColor="#3a0915" /><stop offset="1" stopColor="#0d0608" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-c`} x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8f1838" stopOpacity=".95" /><stop offset=".6" stopColor="#3a0915" stopOpacity=".7" /><stop offset="1" stopColor="#0d0608" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3d9a0" stopOpacity=".7" /><stop offset=".5" stopColor="#c0284b" stopOpacity=".8" /><stop offset="1" stopColor="#c0284b" stopOpacity="0" /></linearGradient>
      </defs>
      {/* top left */}
      <path d="M-40-30H420C300 20 190 110 120 240C70 330 20 400-40 450Z" fill={`url(#${id}-a)`} />
      <path d="M-40-30H250C180 30 110 120 70 220C40 290 0 340-40 380Z" fill="#050203" opacity=".5" />
      <path d="M420-30C300 20 190 110 120 240C70 330 20 400-40 450" fill="none" stroke={`url(#${id}-edge)`} strokeWidth="1.6" />
      {/* right */}
      <path d="M1480 60C1340 190 1270 360 1300 540C1320 660 1390 760 1480 840Z" fill={`url(#${id}-c)`} />
      <path d="M1480 60C1340 190 1270 360 1300 540C1320 660 1390 760 1480 840" fill="none" stroke="#c0284b" strokeOpacity=".55" strokeWidth="1.2" />
      {variant === 'hero' && (
        <>
          {/* bottom sweep */}
          <path d="M-40 700C200 720 420 800 600 940H-40Z" fill={`url(#${id}-b)`} />
          <path d="M-40 700C200 720 420 800 600 940" fill="none" stroke="#c0284b" strokeOpacity=".7" strokeWidth="1.4" />
          <path d="M1480 720C1200 800 900 850 560 940H1480Z" fill={`url(#${id}-a)`} opacity=".55" />
          <path d="M1480 720C1200 800 900 850 560 940" fill="none" stroke="#e2b866" strokeOpacity=".4" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}
