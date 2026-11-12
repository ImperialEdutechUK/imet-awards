import type { Metadata } from 'next';
import { PortalShell } from '@/components/PortalShell';
import { StaffClient } from '@/components/StaffClient';

export const metadata: Metadata = {
  title: 'Staff check-in',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'iMET Check-in', statusBarStyle: 'black-translucent' },
};

export default function StaffPage() {
  return (
    <PortalShell label="Staff check-in" wide>
      <StaffClient />
    </PortalShell>
  );
}
