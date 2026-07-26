'use client';

import { InfiniteMarquee } from '@/components/motion-primitives/infinite-marquee';

const TRUST_ITEMS = [
  '0% Platform Fees',
  'Curated Local Stores',
  'Free Delivery',
  'Trusted by Shoppers Across India',
  'Cash on Delivery',
  'Zero Markup',
];

export function SocialProofMarquee() {
  return (
    <InfiniteMarquee speed={25} gap={56}>
      {TRUST_ITEMS.map((item, i) => (
        <span
          key={i}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ color: 'var(--color-accent)', fontSize: '16px' }}>✦</span>
          {item}
        </span>
      ))}
    </InfiniteMarquee>
  );
}
