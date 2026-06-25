import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-12">
      {/* Top hero rectangle (full width, 420px height) */}
      <div className="w-full h-[420px] bg-gray-100 rounded-2xl animate-pulse" />

      {/* Row of 4 product card skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 animate-pulse">
            <div className="bg-gray-100 rounded-xl aspect-square w-full" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
