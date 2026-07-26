'use client';

import { TextEffect } from '@/components/motion-primitives/text-effect';

export function HeroHeadline({ text }: { text: string }) {
  return (
    <TextEffect preset="slide" per="word" speedReveal={1.1} speedSegment={0.3}>
      {text}
    </TextEffect>
  );
}
