"use client";

import Link, { LinkProps } from "next/link";
import { trackEvent } from "@/lib/analytics/ga4";

interface TrackedLinkProps extends LinkProps {
  eventName: string;
  eventParams?: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export function TrackedLink({ eventName, eventParams, children, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(eventName, eventParams);
        if (onClick) onClick(e);
      }}
    >
      {children}
    </Link>
  );
}
