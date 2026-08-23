import React from 'react';
import { MapPin, Clock, Bookmark, Navigation2 } from 'lucide-react';
import type { CampusLocation } from '../types';
import { Button } from './Button';

interface LocationCardProps {
  location: CampusLocation;
  onNavigate?: (location: CampusLocation) => void;
  onSaveToggle?: (location: CampusLocation) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  onNavigate,
  onSaveToggle,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      {location.image && (
        <div className="relative h-40 w-full overflow-hidden bg-slate-100">
          <img
            src={location.image}
            alt={location.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#005F73]">
            {location.category}
          </div>
          {onSaveToggle && (
            <button
              onClick={() => onSaveToggle(location)}
              className="absolute top-3 left-3 p-2 rounded-full bg-white/80 backdrop-blur-xs text-slate-700 hover:text-[#0A9396] transition-colors"
            >
              <Bookmark className={`w-4 h-4 ${location.isSaved ? 'fill-[#0A9396] text-[#0A9396]' : ''}`} />
            </button>
          )}
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-sm leading-snug">{location.name}</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold shrink-0">
              {location.code}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {location.description}
          </p>

          {location.openingHours && (
            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-[#0A9396]" />
              <span>{location.openingHours}</span>
            </div>
          )}

          {location.facilities && location.facilities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {location.facilities.slice(0, 3).map((facility, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-[#005F73] font-medium"
                >
                  {facility}
                </span>
              ))}
              {location.facilities.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                  +{location.facilities.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-[#0A9396]" />
            <span>{location.building || 'VIT Campus'}</span>
          </div>

          {onNavigate && (
            <Button
              variant="primary"
              size="sm"
              icon={<Navigation2 className="w-3.5 h-3.5" />}
              onClick={() => onNavigate(location)}
            >
              Navigate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
