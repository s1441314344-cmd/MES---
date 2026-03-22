import React from 'react';
import { Plus } from 'lucide-react';

interface InsertButtonProps {
  position: number;
  onClick: (position: number) => void;
}

export const InsertButton: React.FC<InsertButtonProps> = ({ position, onClick }) => {
  return (
    <div className="group relative flex items-center justify-center py-3">
      <div className="absolute inset-x-12 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-70" />
      
      <button
        onClick={() => onClick(position)}
        className={`
          relative z-10 flex h-10 w-10 items-center justify-center rounded-full border
          transition-all duration-200 transform
          bg-white/92 border-slate-200 text-slate-400 shadow-sm
          hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600
          hover:scale-110
          group-hover:shadow-md
          focus:outline-none focus:ring-2 focus:ring-blue-300
        `}
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
};
