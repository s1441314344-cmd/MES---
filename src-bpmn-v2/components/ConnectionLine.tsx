import React from 'react';

interface ConnectionLineProps {
  isLast?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ isLast = false }) => {
  if (isLast) return null;

  return (
    <div className="relative flex items-center justify-center py-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-300" />
      <div className="relative z-10">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
};
