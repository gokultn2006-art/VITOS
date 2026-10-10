import React from 'react';
import { DoorOpen, Users, Clock, Navigation2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Room } from '../types';
import { Button } from './Button';

interface ClassroomCardProps {
  room: Room;
  onNavigate?: (room: Room) => void;
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({ room, onNavigate }) => {
  const isAvailable = room.availabilityStatus === 'available';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-[#9D0208] flex items-center justify-center">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#03071E] text-base leading-tight">{room.roomNumber}</h3>
              <p className="text-xs text-stone-500">{room.buildingName} • Floor {room.floor}</p>
            </div>
          </div>

          <span
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-rose-50 text-rose-700 border border-rose-200/80'
            }`}
          >
            {isAvailable ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            <span>{isAvailable ? 'AVAILABLE' : 'OCCUPIED'}</span>
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 bg-stone-50/80 p-3 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Users className="w-4 h-4 text-[#DC2F02]" />
            <div>
              <p className="text-[10px] text-stone-400 font-medium uppercase">Capacity</p>
              <p className="font-semibold text-[#03071E]">{room.capacity} seats</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Clock className="w-4 h-4 text-[#DC2F02]" />
            <div>
              <p className="text-[10px] text-stone-400 font-medium uppercase">Status Window</p>
              <p className="font-semibold text-[#03071E] truncate">{room.availableUntil || 'Full Day'}</p>
            </div>
          </div>
        </div>

        {room.facilities && room.facilities.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Facilities</p>
            <div className="flex flex-wrap gap-1.5">
              {room.facilities.map((fac, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
                >
                  {fac}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          {room.currentCourse ? `Course: ${room.currentCourse}` : 'Ready for quiet study'}
        </span>
        {onNavigate && (
          <Button
            variant="primary"
            size="sm"
            icon={<Navigation2 className="w-3.5 h-3.5" />}
            onClick={() => onNavigate(room)}
          >
            Navigate
          </Button>
        )}
      </div>
    </div>
  );
};
