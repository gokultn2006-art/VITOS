import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Sparkles, MapPin } from 'lucide-react';
import { campusLocations } from '../data/mockData';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { NotificationItem } from '../types';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    notificationService.getNotifications().then((data) => {
      if (isMounted) setNotifications(data);
    });
    return () => { isMounted = false; };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredLocations = campusLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (loc: typeof campusLocations[0]) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/map?destination=${encodeURIComponent(loc.name)}&lat=${loc.lat}&lng=${loc.lng}&loc=${encodeURIComponent(loc.building || loc.name)}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between">
      {/* Left section */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Quick Search */}
        <div className="relative w-full max-w-md">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.trim().length > 0);
              }}
              onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
              placeholder="Search TT, SJT, Library, Medical Centre..."
              className="w-full pl-9 pr-4 py-2 bg-stone-100/80 border border-stone-200 rounded-xl text-xs md:text-sm text-[#03071E] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white transition-all"
            />
          </div>

          {/* Quick Search Autocomplete Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="p-2 border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Matching Campus Locations
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-stone-100">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-amber-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#9D0208] flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#03071E]">{loc.name}</p>
                          <p className="text-[10px] text-stone-500">{loc.building || loc.category}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#DC2F02] bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full">
                        Navigate
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-stone-500">No campus locations match your query</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Assistant AI Button */}
        <button
          onClick={() => navigate('/assistant')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#9D0208] to-[#DC2F02] hover:from-[#6A040F] hover:to-[#9D0208] text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FFBA08]" />
          <span>Ask AI</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-stone-600 hover:text-[#03071E] rounded-xl hover:bg-stone-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2F02] ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="p-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#03071E]">Notifications</h4>
                <span className="text-[10px] bg-amber-100 text-[#9D0208] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              </div>
              <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-amber-50/50 transition-colors">
                      <p className="text-xs font-semibold text-[#03071E]">{n.title}</p>
                      <p className="text-[11px] text-stone-600 mt-0.5">{n.message}</p>
                      <p className="text-[9px] text-stone-400 mt-1">{n.timestamp}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-stone-500">
                    No unread campus notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Button - Exclusive access point to User Profile */}
        <button
          onClick={() => navigate('/profile')}
          className={`relative flex items-center justify-center w-8 h-8 rounded-full overflow-hidden transition-all ring-2 ${
            location.pathname === '/profile'
              ? 'ring-[#9D0208] shadow-sm'
              : 'ring-amber-200/80 hover:ring-[#9D0208]'
          }`}
          title={user?.name ? `${user.name} (${user.role === 'admin' ? 'Admin' : 'Student'}) - Profile` : 'User Profile'}
          aria-label="User Profile"
        >
          <img
            src={user?.avatar || '/default-avatar.png'}
            alt={user?.name || 'User Profile'}
            className="w-full h-full object-cover bg-slate-100"
          />
        </button>
      </div>
    </header>
  );
};
