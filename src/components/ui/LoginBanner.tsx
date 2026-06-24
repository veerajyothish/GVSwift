'use client';
import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LoginBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const init = async () => {
      const dismissed = sessionStorage.getItem('login-banner-dismissed');
      if (dismissed) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setMounted(true);
      setTimeout(() => setVisible(true), 800); // slight delay feels natural
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('login-banner-dismissed', '1');
    setVisible(false);
    setTimeout(() => setMounted(false), 400);
  };

  if (!mounted) return null;

  return (
    <div
      role="region"
      aria-label="Welcome offer"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '560px',
        transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translateX(-50%) translateY(0)'
          : 'translateX(-50%) translateY(32px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #01696f 0%, #0c4e54 100%)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        color: 'white',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '10px',
          flexShrink: 0,
        }}>
          <Sparkles size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '15px', margin: 0, letterSpacing: '-0.01em' }}>
            Welcome back! 🎉
          </p>
          <p style={{ fontSize: '13px', opacity: 0.85, margin: '3px 0 0', lineHeight: 1.4 }}>
            Check out our latest arrivals and exclusive member deals.
          </p>
        </div>
        <Link
          href="/products"
          onClick={dismiss}
          style={{
            background: 'white',
            color: '#01696f',
            fontWeight: 600,
            fontSize: '13px',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Shop Now
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            color: 'white',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
