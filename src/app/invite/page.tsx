import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CurtainIntro } from '@/components/CurtainIntro';
import { InviteClient } from '@/components/InviteClient';
import { PortalShell } from '@/components/PortalShell';

export const metadata: Metadata = {
  title: 'Your RSVP',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function InvitePage() {
  return (
    <CurtainIntro>
      <PortalShell label="Personal RSVP">
        <Suspense fallback={null}>
          <InviteClient />
        </Suspense>
      </PortalShell>
    </CurtainIntro>
  );
}
