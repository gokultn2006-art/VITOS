import React from 'react';
import { Calendar, PackageSearch, Info, Check } from 'lucide-react';
import type { NotificationItem } from '../types';

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead?: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkRead,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'timetable':
        return <Calendar className="w-4 h-4 text-[#9D0208]" />;
      case 'lost_found':
        return <PackageSearch className="w-4 h-4 text-[#DC2F02]" />;
      default:
        return <Info className="w-4 h-4 text-[#E85D04]" />;
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        notification.isRead
          ? 'bg-white border-stone-200/70 text-stone-600'
          : 'bg-amber-50/70 border-amber-200 text-[#03071E] font-medium'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-stone-100 flex items-center justify-center shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-[#03071E] truncate">{notification.title}</h4>
            <span className="text-[10px] text-stone-400 shrink-0">{notification.timestamp}</span>
          </div>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">{notification.message}</p>
        </div>
        {onMarkRead && !notification.isRead && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="text-stone-400 hover:text-[#9D0208] p-1 rounded-lg hover:bg-white transition-colors shrink-0"
            title="Mark as Read"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
