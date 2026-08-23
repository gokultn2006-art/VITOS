import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Sparkles, MapPin } from 'lucide-react';
import { notificationsList, currentUser, campusLocations } from '../data/mockData';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const unreadCount = notificationsList.filter((n) => !n.isRead).length;

  const filteredLocations = campusLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (code: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/map?dest=${code}`);
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
              className="w-full pl-9 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white transition-all"
            />
          </div>

          {/* Quick Search Autocomplete Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="p-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Campus Locations
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc.code)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#005F73] flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{loc.name}</p>
                          <p className="text-[10px] text-slate-500">{loc.building || loc.category}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#0A9396] bg-teal-50 px-2 py-0.5 rounded-full">
                        Navigate
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No campus locations match your query</div>
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
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#005F73] to-[#0A9396] text-white rounded-xl text-xs font-semibold shadow-xs hover:opacity-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">Notifications</h4>
                <span className="text-[10px] bg-teal-100 text-[#005F73] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notificationsList.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{n.timestamp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Thumbnail */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-all"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-[#0A9396]/20"
          />
        </button>
      </div>
    </header>
  );
};
