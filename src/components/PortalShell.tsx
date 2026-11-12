import type { ReactNode } from 'react';
import { Embers } from './Embers';
import { Silk } from './Silk';
import { SiteHeader } from './SiteHeader';
import p from './portal.module.css';

/** Shared frame for the guest and staff pages: header, silk backdrop and a centred column. */
export function PortalShell({ children, label, wide = false }: { children: ReactNode; label: string; wide?: boolean }) {
  return (
    <div className={p.shell}>
      <SiteHeader variant="portal" label={label} />
      <div className={p.backdrop} aria-hidden="true">
        <Silk variant="corner" />
      </div>
      <Embers className={p.embers} density={0.5} />
      <main className={`${p.main} ${wide ? p.wide : ''}`}>{children}</main>
    </div>
  );
}
