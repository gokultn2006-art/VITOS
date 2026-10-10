import React from 'react';
import { Clock, MapPin, Navigation2, User } from 'lucide-react';
import type { TimetableEntry } from '../types';
import { Button } from './Button';

interface TimetableCardProps {
  entry: TimetableEntry;
  onNavigate?: (roomNumber: string, buildingCode: string) => void;
}

export const TimetableCard: React.FC<TimetableCardProps> = ({ entry, onNavigate }) => {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        entry.isNext
          ? 'bg-gradient-to-br from-[#370617] via-[#6A040F] to-[#9D0208] text-white border-transparent shadow-md'
          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                entry.isNext ? 'bg-white/20 text-[#FFBA08]' : 'bg-amber-100 text-[#9D0208]'
              }`}
            >
              {entry.courseCode}
            </span>
            {entry.isNext && (
              <span className="text-[10px] uppercase font-bold bg-[#FFBA08] text-[#03071E] px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                NEXT CLASS
              </span>
            )}
          </div>
          <h3 className={`font-bold text-sm md:text-base mt-1.5 ${entry.isNext ? 'text-white' : 'text-slate-800'}`}>
            {entry.courseName}
          </h3>
        </div>

        <div className="text-right shrink-0">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${entry.isNext ? 'text-amber-100' : 'text-slate-600'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{entry.startTime} - {entry.endTime}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className={`flex items-center gap-1.5 ${entry.isNext ? 'text-amber-100' : 'text-slate-600'}`}>
            <MapPin className={`w-3.5 h-3.5 ${entry.isNext ? 'text-[#FFBA08]' : 'text-[#DC2F02]'}`} />
            <span className="font-bold">{entry.roomNumber}</span>
            <span className="opacity-80">({entry.buildingName})</span>
          </div>

          <div className={`flex items-center gap-1.5 ${entry.isNext ? 'text-amber-100' : 'text-slate-500'}`}>
            <User className="w-3.5 h-3.5 opacity-70" />
            <span>{entry.faculty}</span>
          </div>

          <div className={`text-[11px] font-semibold ${entry.isNext ? 'text-[#FFBA08]' : 'text-slate-500'}`}>
            Walking time: {entry.walkingTimeMinutes} min
          </div>
        </div>

        {onNavigate && (
          <Button
            variant={entry.isNext ? 'secondary' : 'primary'}
            size="sm"
            icon={<Navigation2 className="w-3.5 h-3.5" />}
            onClick={() => onNavigate(entry.roomNumber, entry.buildingCode)}
          >
            Navigate
          </Button>
        )}
      </div>
    </div>
  );
};
