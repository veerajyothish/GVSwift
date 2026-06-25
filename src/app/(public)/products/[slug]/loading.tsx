import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Left: large square image placeholder */}
      <div className="bg-gray-100 rounded-2xl aspect-square w-full animate-pulse" />

      {/* Right: details pane */}
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Title bar (40% width) */}
        <div className="h-8 bg-gray-100 rounded w-2/5" />
        
        {/* Price bar (20% width) */}
        <div className="h-6 bg-gray-100 rounded w-1/5" />
        
        <div className="border-t border-b border-gray-100 py-6 flex flex-col gap-3">
          {/* 3 description lines */}
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-11/12" />
          <div className="h-4 bg-gray-100 rounded w-4/5" />
        </div>

        {/* Size selector row */}
        <div className="flex flex-col gap-3">
          <div className="h-4 bg-gray-100 rounded w-1/6" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>

        {/* 2 action button placeholders */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="h-12 bg-gray-100 rounded-xl w-full" />
          <div className="h-12 bg-gray-100 rounded-xl w-full" />
        </div>
      </div>
    </div>
  );
}
