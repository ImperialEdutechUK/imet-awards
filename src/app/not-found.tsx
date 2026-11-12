import Link from 'next/link';
import { PortalShell } from '@/components/PortalShell';
import p from '@/components/portal.module.css';

export default function NotFound() {
  return (
    <PortalShell label="Page not found">
      <div className={p.panel}>
        <h1 className={p.title}>This page is not available</h1>
        <p className={p.text}>The address may be mistyped, or the page may have moved.</p>
        <div className={p.actions}>
          <Link href="/" className="btn btn-gold">Return to the event website</Link>
        </div>
      </div>
    </PortalShell>
  );
}
