import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <header className="mb-8">
        <div className="h-8 bg-gray-100 rounded w-1/4 animate-pulse mb-3" />
        <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
      </header>

      <div className="flex flex-col gap-6 w-full">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="border border-gray-100 rounded-xl p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center animate-pulse"
          >
            <div className="flex gap-4 items-center w-full sm:w-auto">
              {/* small square thumbnail */}
              <div className="bg-gray-100 rounded-lg w-20 h-24 flex-shrink-0" />
              {/* 3 text bars */}
              <div className="flex flex-col gap-2 w-full">
                <div className="h-4 bg-gray-100 rounded w-36" />
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
            </div>
            {/* status pill */}
            <div className="h-8 bg-gray-100 rounded-full w-24 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
