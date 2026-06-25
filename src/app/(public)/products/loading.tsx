import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      {/* Filter sidebar placeholder (left, 240px wide on desktop) */}
      <div className="w-full md:w-[240px] flex-shrink-0 flex flex-col gap-6 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/2" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-3/4" />
          ))}
        </div>
      </div>

      {/* 12-item product grid */}
      <div className="flex-grow">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="bg-gray-100 rounded-xl aspect-square w-full" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
