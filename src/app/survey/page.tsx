import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PortalShell } from '@/components/PortalShell';
import { SurveyClient } from '@/components/SurveyClient';

export const metadata: Metadata = {
  title: 'Event survey',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function SurveyPage() {
  return (
    <PortalShell label="Event survey">
      <Suspense fallback={null}>
        <SurveyClient />
      </Suspense>
    </PortalShell>
  );
}
