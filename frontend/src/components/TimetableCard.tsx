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
          ? 'bg-gradient-to-br from-[#005F73] to-[#0A9396] text-white border-transparent shadow-md'
          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                entry.isNext ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#005F73]'
              }`}
            >
              {entry.courseCode}
            </span>
            {entry.isNext && (
              <span className="text-[10px] uppercase font-bold bg-[#94D2BD] text-[#005F73] px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                NEXT CLASS
              </span>
            )}
          </div>
          <h3 className={`font-bold text-sm md:text-base mt-1.5 ${entry.isNext ? 'text-white' : 'text-slate-800'}`}>
            {entry.courseName}
          </h3>
        </div>

        <div className="text-right shrink-0">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${entry.isNext ? 'text-teal-100' : 'text-slate-600'}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{entry.startTime} - {entry.endTime}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className={`flex items-center gap-1.5 ${entry.isNext ? 'text-teal-50' : 'text-slate-600'}`}>
            <MapPin className={`w-3.5 h-3.5 ${entry.isNext ? 'text-[#94D2BD]' : 'text-[#0A9396]'}`} />
            <span className="font-bold">{entry.roomNumber}</span>
            <span className="opacity-80">({entry.buildingName})</span>
          </div>

          <div className={`flex items-center gap-1.5 ${entry.isNext ? 'text-teal-100' : 'text-slate-500'}`}>
            <User className="w-3.5 h-3.5 opacity-70" />
            <span>{entry.faculty}</span>
          </div>

          <div className={`text-[11px] font-semibold ${entry.isNext ? 'text-[#94D2BD]' : 'text-slate-500'}`}>
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
