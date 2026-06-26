'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, Sparkles, Tag } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import Link from 'next/link';

const BANNER_KEY = 'login-banner-dismissed';

export default function LoginBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Only show once per session — if already dismissed, skip
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(BANNER_KEY)) return;

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Only show when logged in
      if (!session) return;

      setMounted(true);
      // Slight delay so it feels intentional, not jarring
      setTimeout(() => setVisible(true), 600);
    };
    init();
  }, []);

  const dismiss = useCallback(() => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(BANNER_KEY, '1');
    }
    setVisible(false);
    setTimeout(() => setMounted(false), 350);
  }, []);

  // Dismiss on Escape key
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, dismiss]);

  // Prevent body scroll while popup is open
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [visible]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop — click to dismiss */}
      <div
        aria-hidden="true"
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.35s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      />

      {/* Popup modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome offer"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 9999,
          width: 'calc(100% - 32px)',
          maxWidth: '480px',
          background: '#FDFAF5',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          transform: visible
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -48%) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition:
            'transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        {/* Wine-red header strip */}
        <div
          style={{
            background: 'linear-gradient(135deg, #6B1E2E 0%, #4A1020 100%)',
            padding: '28px 28px 24px',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          {/* ✕ Close button — top right */}
          <button
            onClick={dismiss}
            aria-label="Close welcome offer"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 7px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              lineHeight: 0,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.28)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)')
            }
          >
            <X size={15} strokeWidth={2.5} />
          </button>

          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <Sparkles size={26} color="white" />
          </div>

          <h2
            style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: 700,
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Welcome back! 🎉
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 }}>
            You have an exclusive deal waiting today.
          </p>
        </div>

        {/* Offer body */}
        <div style={{ padding: '24px 28px 28px' }}>
          {/* Discount pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#FDF3F5',
              border: '1px solid #F0D5DA',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}
          >
            <Tag size={18} color="#6B1E2E" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B1E2E', margin: 0 }}>
                FLAT ₹100 OFF on your first order
              </p>
              <p style={{ fontSize: '12px', color: '#9B6A72', margin: '3px 0 0' }}>
                Valid until July 25 · Applied automatically at checkout
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/products"
              onClick={dismiss}
              style={{
                flex: 1,
                background: '#6B1E2E',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                padding: '13px 20px',
                borderRadius: '10px',
                textDecoration: 'none',
                textAlign: 'center',
                display: 'block',
                transition: 'background 0.2s',
              }}
            >
              Shop Now
            </Link>
            <button
              onClick={dismiss}
              style={{
                flex: 1,
                background: '#F5F0EB',
                color: '#6B1E2E',
                fontWeight: 600,
                fontSize: '14px',
                padding: '13px 20px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
