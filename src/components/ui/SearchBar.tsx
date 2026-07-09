'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  basePricePaise: number;
  images: { url: string }[];
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  // ponytail: 150ms debounce, single effect
  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.products ?? []);
        setActiveIdx(-1);
        setOpen(true);
      } catch {
        /* silent */
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (activeIdx >= 0 && results[activeIdx]) {
      router.push(`/products/${results[activeIdx].slug}`);
      setOpen(false);
      setQuery('');
    } else if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
      setOpen(false);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [open, results.length]);

  const formatPrice = (paise: number) => `\u20B9${(paise / 100).toLocaleString('en-IN')}`;

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7a7974' }} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0 && query.length >= 2) setOpen(true); }}
          placeholder="Search products..."
          style={{
            width: '100%',
            padding: '10px 36px 10px 36px',
            borderRadius: '10px',
            border: '1px solid #dcd9d5',
            fontSize: '14px',
            background: '#f9f8f5',
            outline: 'none',
          }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a7974' }}>
            <X size={14} />
          </button>
        )}
      </form>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(253, 250, 245, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '14px',
          boxShadow: '0 12px 40px rgba(107, 30, 46, 0.12), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(107, 30, 46, 0.08)',
          zIndex: 1000,
          overflow: 'hidden',
          maxHeight: '380px',
          overflowY: 'auto' as const,
        }}>
          {results.length === 0 ? (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((r, i) => {
              const thumb = r.images?.[0]?.url;
              return (
                <Link
                  key={r.id}
                  href={`/products/${r.slug}`}
                  prefetch={true}
                  onClick={() => { setOpen(false); setQuery(''); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    textDecoration: 'none',
                    background: i === activeIdx ? 'rgba(107, 30, 46, 0.06)' : 'transparent',
                    borderBottom: i < results.length - 1 ? '1px solid rgba(107, 30, 46, 0.05)' : 'none',
                    transition: 'background 0.12s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--color-surface, #f3f0ec)',
                    position: 'relative',
                  }}>
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={r.name}
                        width={48}
                        height={48}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    ) : (
                      <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                        <rect width="48" height="48" fill="#f3f0ec" />
                        <text x="24" y="28" textAnchor="middle" fill="#6b1e2e" fontSize="16" fontWeight="600" fontFamily="serif">
                          {(r.brand || r.name).charAt(0).toUpperCase()}
                        </text>
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {r.name}
                    </div>
                    {r.brand && (
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--color-accent)',
                        marginTop: '2px',
                      }}>
                        {r.brand}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}>
                    {formatPrice(r.basePricePaise)}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
