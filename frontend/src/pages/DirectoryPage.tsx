import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Clock,
  MapPin,
  Navigation2,
  Phone,
  Activity,
  Printer,
  CreditCard,
  Briefcase,
  FileCheck,
  Footprints
} from 'lucide-react';
import { directoryEntries, campusLocations } from '../data/mockData';
import { calculateDistanceMeters, calculateWalkingMinutes } from '../utils/geolocation';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';

export const DirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userCoords] = useState({ lat: 12.9718, lng: 79.1633 }); // SJT Location

  const categories = [
    'all',
    'Medical Services',
    'Academic Facilities',
    'Student Utilities',
    'Banking & ATMs',
    'Administrative Offices',
    'Career & Placements'
  ];

  // Calculate distance for each directory entry and sort by proximity
  const entriesWithDistance = directoryEntries.map((entry) => {
    const loc = campusLocations.find((l) => l.code === entry.buildingCode || l.id === entry.locationId) || campusLocations[0];
    const distanceMeters = calculateDistanceMeters(userCoords, { lat: loc.lat, lng: loc.lng });
    const walkingMinutes = calculateWalkingMinutes(distanceMeters);
    return { ...entry, distanceMeters, walkingMinutes };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);

  const filteredEntries = entriesWithDistance.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Medical Services':
        return <Activity className="w-5 h-5 text-emerald-600" />;
      case 'Academic Facilities':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'Student Utilities':
        return <Printer className="w-5 h-5 text-purple-600" />;
      case 'Banking & ATMs':
        return <CreditCard className="w-5 h-5 text-amber-600" />;
      case 'Career & Placements':
        return <Briefcase className="w-5 h-5 text-[#005F73]" />;
      default:
        return <FileCheck className="w-5 h-5 text-[#0A9396]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#005F73] to-[#0A9396] rounded-3xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-teal-100 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-[#94D2BD]" />
              <span>Location-Sorted Campus Services</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Campus Services Directory</h1>
            <p className="text-xs md:text-sm text-teal-100/90 mt-1">
              Find administrative offices, health services, printing cells, ATMs, sorted by walking distance.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 text-right">
            <span className="text-[10px] uppercase font-bold text-teal-200">Nearest Service</span>
            <p className="text-xl font-black text-white">
              {filteredEntries[0]?.name.split(' ')[0] || 'Printing'} ({filteredEntries[0]?.distanceMeters || 180} m)
            </p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Medical Centre, Examination Cell, Printing, SBI ATM..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#005F73] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Services' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid (Sorted by Distance) */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="flex flex-col justify-between hover:border-[#0A9396]/50">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60">
                      {getCategoryIcon(entry.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#0A9396] uppercase tracking-wider">
                        {entry.category}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{entry.name}</h3>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#005F73] bg-teal-50 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <Footprints className="w-3 h-3 text-[#0A9396]" />
                    <span>{entry.distanceMeters} m</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">{entry.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#005F73] shrink-0" />
                    <span>{entry.locationName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0A9396] shrink-0" />
                    <span>{entry.openingHours}</span>
                  </div>
                  {entry.contact && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{entry.contact}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Navigation2 className="w-3.5 h-3.5" />}
                  onClick={() =>
                    navigate(`/map?dest=${entry.locationId || entry.buildingCode || encodeURIComponent(entry.name)}`)
                  }
                >
                  Navigate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No directory records found"
          description="No campus services match your search query."
          actionText="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      )}
    </div>
  );
};
