import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Bot,
  Calendar,
  DoorOpen,
  BookOpen,
  User,
  ShieldCheck,
  Compass,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Campus Navigation', path: '/map', icon: MapPin },
    { label: 'AI Assistant', path: '/assistant', icon: Bot, badge: 'AI' },
    { label: 'Smart Timetable', path: '/timetable', icon: Calendar },
    { label: 'Empty Classrooms', path: '/classrooms', icon: DoorOpen },
    { label: 'Campus Directory', path: '/directory', icon: BookOpen },
    { label: 'User Profile', path: '/profile', icon: User },
    // Admin Panel — only visible to staff/admin users
    ...(isAdmin ? [{ label: 'Admin Panel', path: '/admin', icon: ShieldCheck, badge: 'Staff' }] : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 bg-[#005F73]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0A9396] flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-none">VIT CampusOS</h1>
              <span className="text-[10px] uppercase font-semibold text-[#94D2BD] tracking-wider">Vellore Companion</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-[#005F73] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-[#94D2BD]' : 'text-slate-400 group-hover:text-[#0A9396]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-[#0A9396] text-white'
                            : 'bg-teal-50 text-[#005F73] border border-teal-200/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
              alt={user?.name || 'User Profile'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0A9396]/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Student'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.regNo || '22BCE1024'}</p>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
