import React from 'react';
import { MapPin, Mail, Tag, Navigation2 } from 'lucide-react';
import type { LostItem } from '../types';
import { Button } from './Button';

interface LostItemCardProps {
  item: LostItem;
  onNavigate?: (locationName: string) => void;
}

export const LostItemCard: React.FC<LostItemCardProps> = ({ item, onNavigate }) => {
  const isLost = item.type === 'lost';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      <div>
        {item.imageUrl && (
          <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <span
              className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isLost ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
            </span>
          </div>
        )}

        <div className="p-5">
          {!item.imageUrl && (
            <div className="flex items-center justify-between mb-3">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isLost ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">{item.dateReported}</span>
            </div>
          )}

          <h3 className="font-bold text-slate-800 text-base leading-snug">{item.title}</h3>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
              <Tag className="w-3 h-3 text-[#DC2F02]" />
              {item.category}
            </span>
          </div>

          <p className="text-xs text-stone-600 mt-3 line-clamp-3 leading-relaxed">
            {item.description}
          </p>

          <div className="mt-4 pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#9D0208] shrink-0" />
              <span className="truncate">{item.locationName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Contact: {item.contactName} ({item.contactEmail})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 pt-0">
        {onNavigate && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            icon={<Navigation2 className="w-3.5 h-3.5" />}
            onClick={() => onNavigate(item.locationName)}
          >
            View Location on Map
          </Button>
        )}
      </div>
    </div>
  );
};
