import React from 'react';
import { SearchX } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Try adjusting your search query or filters to find what you are looking for.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-stone-50/60 rounded-2xl border border-dashed border-stone-200">
      <div className="w-14 h-14 bg-amber-100 text-[#9D0208] rounded-2xl flex items-center justify-center mb-4">
        {icon || <SearchX className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-stone-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
