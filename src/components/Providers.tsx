'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** Honours the visitor's reduced-motion setting across every animation. */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
