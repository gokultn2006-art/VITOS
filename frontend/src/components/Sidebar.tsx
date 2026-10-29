import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Bot,
  Calendar,
  BookOpen,
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
    { label: 'Campus Directory', path: '/directory', icon: BookOpen },
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
        <div className="flex items-center justify-between px-6 h-16 border-b border-amber-950/20 bg-[#03071E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9D0208] to-[#DC2F02] flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5 animate-pulse text-[#FFBA08]" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-none">VIT CampusOS</h1>
              <span className="text-[10px] uppercase font-bold text-[#FFBA08] tracking-wider">Vellore Companion</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-amber-200 hover:text-white p-1 rounded-lg"
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
                      ? 'bg-gradient-to-r from-[#6A040F] to-[#9D0208] text-white shadow-sm'
                      : 'text-[#03071E]/80 hover:bg-amber-50/80 hover:text-[#9D0208]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-[#FFBA08]' : 'text-stone-400 group-hover:text-[#DC2F02]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-[#FFBA08] text-[#03071E]'
                            : 'bg-amber-100 text-[#9D0208] border border-amber-300/60'
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

        {/* User Profile Card in Sidebar Footer */}
        {user && (
          <div className="p-3 border-t border-amber-100/80 bg-amber-50/40">
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#6A040F] to-[#9D0208] text-white shadow-sm'
                    : 'hover:bg-amber-100/60 text-[#03071E]'
                }`
              }
              title="View Profile"
            >
              {({ isActive }) => (
                <>
                  <img
                    src={user?.avatar || '/default-avatar.png'}
                    alt={user?.name || 'Profile'}
                    className="w-9 h-9 rounded-xl object-cover border border-amber-200/80 shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-[#03071E]'}`}>
                      {user?.name || 'Student Account'}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-[#FFBA08] font-medium' : 'text-stone-500'}`}>
                      {user?.regNo} • {user?.role === 'admin' ? 'Staff' : 'Student'}
                    </p>
                  </div>
                </>
              )}
            </NavLink>
          </div>
        )}
      </aside>
    </>
  );
};
