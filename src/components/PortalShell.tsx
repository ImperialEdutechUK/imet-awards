import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import p from './portal.module.css';

/** Shared frame for the guest and staff pages: header and a centred column on the wall. */
export function PortalShell({ children, label, wide = false }: { children: ReactNode; label: string; wide?: boolean }) {
  return (
    <div className={p.shell}>
      <SiteHeader variant="portal" label={label} />
      <main className={`${p.main} ${wide ? p.wide : ''}`}>{children}</main>
    </div>
  );
}
