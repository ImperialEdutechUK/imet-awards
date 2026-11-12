/** The award: a faceted gold star on a black plinth, drawn in SVG. */
export function StarTrophy({ className }: { className?: string }) {
  const cx = 210, cy = 205, outer = 178, inner = 70;
  const point = (r: number, i: number) => {
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  };
  const fills = ['url(#st-light)', 'url(#st-dark)', 'url(#st-mid)', 'url(#st-wine)', 'url(#st-light)', 'url(#st-dark)', 'url(#st-mid)', 'url(#st-dark)', 'url(#st-light)', 'url(#st-wine)'];
  const facets = Array.from({ length: 10 }, (_, i) => {
    const r1 = i % 2 ? inner : outer, r2 = i % 2 ? outer : inner;
    return <path key={i} d={`M${cx} ${cy}L${point(r1, i)}L${point(r2, i + 1)}Z`} fill={fills[i]} />;
  });
  const outline = Array.from({ length: 10 }, (_, i) => `${i ? 'L' : 'M'}${point(i % 2 ? inner : outer, i)}`).join('') + 'Z';

  return (
    <svg className={className} viewBox="0 0 420 640" aria-hidden="true">
      <defs>
        <linearGradient id="st-light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6dc" /><stop offset=".55" stopColor="#f3d9a0" /><stop offset="1" stopColor="#d6a655" /></linearGradient>
        <linearGradient id="st-mid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9c784" /><stop offset="1" stopColor="#b98a3e" /></linearGradient>
        <linearGradient id="st-dark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b98a3e" /><stop offset="1" stopColor="#6b4a1a" /></linearGradient>
        <linearGradient id="st-wine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c99a48" /><stop offset=".6" stopColor="#8a4a2c" /><stop offset="1" stopColor="#6d1029" /></linearGradient>
        <linearGradient id="st-plinth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1c0d11" /><stop offset=".28" stopColor="#050203" /><stop offset=".62" stopColor="#12080b" /><stop offset=".8" stopColor="#4a0c1c" /><stop offset="1" stopColor="#0d0608" /></linearGradient>
        <linearGradient id="st-band" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8a6226" /><stop offset=".3" stopColor="#f8e6b8" /><stop offset=".6" stopColor="#c99a48" /><stop offset="1" stopColor="#6b4a1a" /></linearGradient>
        <radialGradient id="st-floor" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#8f1838" stopOpacity=".7" /><stop offset=".6" stopColor="#6d1029" stopOpacity=".22" /><stop offset="1" stopColor="#6d1029" stopOpacity="0" /></radialGradient>
        <radialGradient id="st-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#e2b866" stopOpacity=".34" /><stop offset=".55" stopColor="#8f1838" stopOpacity=".14" /><stop offset="1" stopColor="#8f1838" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="210" cy="205" rx="210" ry="205" fill="url(#st-halo)" />
      <ellipse cx="210" cy="598" rx="200" ry="34" fill="url(#st-floor)" />
      {/* plinth */}
      <path d="M96 520h228l14 62H82Z" fill="url(#st-plinth)" />
      <rect x="82" y="578" width="256" height="9" fill="url(#st-band)" />
      <path d="M124 338h172l10 182H114Z" fill="url(#st-plinth)" />
      <rect x="114" y="512" width="192" height="8" fill="url(#st-band)" />
      <rect x="124" y="338" width="172" height="5" fill="url(#st-band)" opacity=".85" />
      {/* star */}
      {facets}
      <path d={outline} fill="none" stroke="#fff6dc" strokeOpacity=".5" strokeWidth="1" />
      <path d="M210 27l3.4 13 13 3.4-13 3.4-3.4 13-3.4-13-13-3.4 13-3.4Z" fill="#fff6dc" />
    </svg>
  );
}
