'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.products ?? []);
        setOpen(true);
      } catch (err) {
        console.error("Autocomplete search failed:", err);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

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
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7a7974' }} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          <button type="button" onClick={() => { setQuery(''); setResults([]); }}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a7974' }}>
            <X size={14} />
          </button>
        )}
      </form>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'white', borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #dcd9d5', zIndex: 1000, overflow: 'hidden',
        }}>
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { router.push(`/products/${r.slug}`); setOpen(false); setQuery(''); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 16px', fontSize: '14px', background: 'none',
                border: 'none', cursor: 'pointer', borderBottom: '1px solid #f3f0ec',
                color: '#28251d',
              }}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
