import type { MetadataRoute } from 'next';

/** Lets entry staff install the check-in page on a phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Imperial Excellence Awards: Staff Check-in',
    short_name: 'iMET Check-in',
    description: 'Staff-only QR check-in and attendance dashboard',
    start_url: '/staff',
    scope: '/',
    display: 'standalone',
    background_color: '#050203',
    theme_color: '#050203',
    icons: [
      { src: '/pwa-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
