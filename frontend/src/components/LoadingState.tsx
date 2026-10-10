import React from 'react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading campus data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
      <div className="w-10 h-10 border-3 border-[#FAA307]/30 border-t-[#9D0208] rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};
