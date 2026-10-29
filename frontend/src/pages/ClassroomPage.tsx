import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Search, Footprints } from 'lucide-react';
import { emptyClassrooms, campusLocations } from '../data/mockData';
import { calculateDistanceMeters, calculateWalkingMinutes } from '../utils/geolocation';
import { ClassroomCard } from '../components/ClassroomCard';
import { EmptyState } from '../components/EmptyState';

export const ClassroomPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [minCapacity, setMinCapacity] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('available');
  const [userCoords] = useState({ lat: 12.97095, lng: 79.16390 }); // SJT Current Location

  // Calculate distance for each classroom and sort by proximity
  const roomsWithDistance = emptyClassrooms.map((room) => {
    const buildingLoc = campusLocations.find((l) => l.code === room.buildingCode) || campusLocations[0];
    const distanceMeters = calculateDistanceMeters(userCoords, { lat: buildingLoc.lat, lng: buildingLoc.lng });
    const walkingMinutes = calculateWalkingMinutes(distanceMeters);
    return { ...room, distanceMeters, walkingMinutes };
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);

  const filteredRooms = roomsWithDistance.filter((room) => {
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.buildingName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBlock = selectedBlock === 'all' || room.buildingCode === selectedBlock;
    const matchesCapacity = room.capacity >= minCapacity;
    const matchesStatus = statusFilter === 'all' || room.availabilityStatus === statusFilter;
    return matchesSearch && matchesBlock && matchesCapacity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] rounded-3xl p-6 md:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#FFBA08] mb-2">
              <DoorOpen className="w-3.5 h-3.5 text-[#FFBA08]" />
              <span>Location-Aware Distance Recommendation</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Empty Classroom Finder</h1>
            <p className="text-xs md:text-sm text-stone-200 mt-1">
              Classrooms sorted by proximity to your current location (SJT).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 text-right">
            <span className="text-[10px] uppercase font-bold text-[#FFBA08]">Closest Classroom</span>
            <p className="text-xl font-black text-white">
              {filteredRooms[0]?.roomNumber || 'TT-624'} ({filteredRooms[0]?.walkingMinutes || 4} min walk)
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TT-624, SJT-302, MB-112..."
              className="w-full pl-9 pr-4 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-xs md:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 shrink-0">Block:</span>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
            >
              <option value="all">All Blocks (TT, SJT, MB)</option>
              <option value="TT">Technology Tower (TT)</option>
              <option value="SJT">Silver Jubilee Tower (SJT)</option>
              <option value="MB">Main Building (MB)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
            >
              <option value="available">Available Only</option>
              <option value="all">All Rooms</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-stone-400 uppercase shrink-0">Min Capacity:</span>
          {[0, 50, 70, 85].map((cap) => (
            <button
              key={cap}
              onClick={() => setMinCapacity(cap)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                minCapacity === cap
                  ? 'bg-gradient-to-r from-[#6A040F] to-[#9D0208] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cap === 0 ? 'Any Capacity' : `${cap}+ seats`}
            </button>
          ))}
        </div>
      </div>

      {/* Classroom Grid (Sorted by Distance) */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <div key={room.id} className="relative">
              <div className="absolute top-3 right-3 z-10 bg-amber-100 text-[#9D0208] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300/60">
                <Footprints className="w-3 h-3 text-[#DC2F02]" />
                <span>{room.distanceMeters} m ({room.walkingMinutes} min)</span>
              </div>
              <ClassroomCard
                room={room}
                onNavigate={(r) => navigate(`/map?dest=${r.buildingCode}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No classrooms found"
          description="No available classrooms matched your filter criteria."
          actionText="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedBlock('all');
            setMinCapacity(0);
            setStatusFilter('available');
          }}
        />
      )}
    </div>
  );
};
