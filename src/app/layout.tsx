import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/cinzel/500.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import '@fontsource/pinyon-script/400.css';
import './globals.css';
import { Providers } from '@/components/Providers';
import { event } from '@/lib/event';

export const metadata: Metadata = {
  title: { default: `${event.name} | ${event.dateText} | ${event.venue} ${event.city}`, template: `%s | ${event.name}` },
  description: `${event.name}: ${event.dayText}, ${event.dateText}, ${event.timeText} at ${event.venue} ${event.city}.`,
};

const curtainMarker = `try{if(sessionStorage.getItem('imet-curtain')==='1')document.documentElement.dataset.curtain='seen'}catch(e){}`;

export const viewport: Viewport = { themeColor: '#050203', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Runs before the page paints, so guests who have already opened the curtain never see it flash. */}
        <script dangerouslySetInnerHTML={{ __html: curtainMarker }} />
        <noscript><style>{'[data-intro-curtain]{display:none!important}'}</style></noscript>
        <div className="wall" aria-hidden="true" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
