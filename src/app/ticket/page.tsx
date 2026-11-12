import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PortalShell } from '@/components/PortalShell';
import { TicketClient } from '@/components/TicketClient';

export const metadata: Metadata = {
  title: 'Your QR pass',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function TicketPage() {
  return (
    <PortalShell label="Entry pass">
      <Suspense fallback={null}>
        <TicketClient />
      </Suspense>
    </PortalShell>
  );
}
