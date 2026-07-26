'use client';

import React from 'react';

interface InfiniteMarqueeProps {
  children: React.ReactNode;
  speed?: number;
  gap?: number;
  pauseOnHover?: boolean;
  className?: string;
}

export function InfiniteMarquee({
  children,
  speed = 30,
  gap = 48,
  pauseOnHover = true,
  className = '',
}: InfiniteMarqueeProps) {
  return (
    <div
      className={`infinite-marquee-wrapper ${className}`}
      style={{
        ['--marquee-speed' as string]: `${speed}s`,
        ['--marquee-gap' as string]: `${gap}px`,
      }}
    >
      <div
        className={`infinite-marquee-track ${pauseOnHover ? 'infinite-marquee-pause-hover' : ''}`}
      >
        <div className="infinite-marquee-content" aria-hidden="false">
          {children}
        </div>
        <div className="infinite-marquee-content" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
