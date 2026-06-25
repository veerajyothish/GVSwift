import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <header className="mb-8">
        <div className="h-8 bg-gray-100 rounded w-1/4 animate-pulse mb-3" />
        <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
        {Array.from({ length: 8 }).map((_, i) => (
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
