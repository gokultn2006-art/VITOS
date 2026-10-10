import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  DoorOpen,
  PackageSearch,
  Trash2,
  Edit,
  CheckCircle2,
  Users,
  Search,
  Clock,
  Layers,
  MapPin
} from 'lucide-react';
import { buildings, lostItemsList } from '../data/mockData';
import { adminService } from '../services/api';
import { Card } from '../components/Card';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'slot-classes' | 'availability' | 'buildings' | 'lostfound'>('users');
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Buildings State
  const [buildingsList, setBuildingsList] = useState<any[]>(buildings);

  // Slot Class Explorer State
  const [selectedSlot, setSelectedSlot] = useState('A1');
  const [slotData, setSlotData] = useState<any>(null);
  const [slotsList, setSlotsList] = useState<string[]>([
    'A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1',
    'TA1', 'TB1', 'TC1', 'TD1', 'TE1', 'TF1', 'TG1',
    'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2',
    'TA2', 'TB2', 'TC2', 'TD2', 'TE2', 'TF2', 'TG2',
    'L1+L2', 'L3+L4', 'L5+L6', 'L7+L8', 'L9+L10', 'L11+L12',
    'L13+L14', 'L15+L16', 'L19+L20', 'L21+L22', 'L31+L32', 'L33+L34'
  ]);

  useEffect(() => {
    loadUsers();
    loadSlotClasses('A1');
    loadAvailabilities();
    loadBuildings();
    adminService.getSlots().then((slots) => {
      if (slots && slots.length > 0) setSlotsList(slots);
    });
  }, []);

  const loadBuildings = async () => {
    try {
      const data = await adminService.getBuildings();
      if (data && data.length > 0) {
        setBuildingsList(data);
      }
    } catch {
      // Keep initial mockData buildings
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (u.role === 'admin' || u.email === 'admin@vitstudent.ac.in') {
      setStatusNotice('Cannot delete master administrator account.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user ${u.fullName} (${u.email})? This action cannot be undone.`)) {
      const res = await adminService.deleteUser(u.id);
      if (res.success) {
        setStatusNotice(`User ${u.fullName} (${u.email}) was deleted successfully.`);
        setUsersList((prev) => prev.filter((item) => item.id !== u.id));
      } else {
        setStatusNotice(res.error || 'Failed to delete user.');
      }
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setUsersList(data);
    } catch {
      // Keep existing state
    }
  };

  const loadSlotClasses = async (slotCode: string) => {
    setSelectedSlot(slotCode);
    try {
      const data = await adminService.getSlotClasses(slotCode);
      setSlotData(data);
    } catch {
      // Keep existing state
    }
  };

  const loadAvailabilities = async () => {
    const data = await adminService.getClassroomAvailability();
    setAvailabilities(data);
  };

  const handleUpdateStatus = async (item: any, newStatus: string) => {
    const res = await adminService.reviewAvailability(item.id, item.classroom, newStatus, 'Manually reviewed by Admin');
    if (res.success) {
      setStatusNotice(`Classroom ${item.classroom} updated to ${newStatus}`);
      loadAvailabilities();
    } else {
      setStatusNotice(res.error || 'Forbidden: Only admin users can modify classroom availability.');
    }
  };

  // Filter users by search
  const filteredUsers = usersList.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.regNo || '').toLowerCase().includes(q) ||
      (u.programme || '').toLowerCase().includes(q)
    );
  });

  const stats = [
    { title: 'Registered Users', count: usersList.length, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Slot Class Matrix', count: `${slotsList.length} Slots`, icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
    { title: 'Classroom Availability', count: availabilities.length, icon: DoorOpen, color: 'text-[#9D0208] bg-amber-50' },
    { title: 'Active Lost Items', count: lostItemsList.length, icon: PackageSearch, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] rounded-3xl p-6 md:p-8 text-white shadow-md flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#FFBA08] mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFBA08]" />
            <span>VIT Vellore Administrative Console</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">System Management Panel</h1>
          <p className="text-xs md:text-sm text-stone-200 mt-1">
            Manage registered accounts, inspect courses across timetable slots, and review campus resources.
          </p>
        </div>
      </div>

      {/* Notification Banner */}
      {statusNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-[#03071E] rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#9D0208] shrink-0" />
            <span>{statusNotice}</span>
          </span>
          <button onClick={() => setStatusNotice(null)} className="font-bold underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((st, i) => {
          const Icon = st.icon;
          return (
            <Card key={i} className="flex items-center gap-3 p-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${st.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400">{st.title}</p>
                <p className="text-lg font-black text-stone-800">{st.count}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Admin Management Section */}
      <Card className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="flex bg-stone-100 p-1 rounded-xl flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-white text-[#9D0208] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Directory</span>
              <span className="text-[10px] bg-amber-100 text-[#9D0208] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('slot-classes')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'slot-classes' ? 'bg-white text-[#9D0208] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Slot Class Finder</span>
            </button>

            <button
              onClick={() => setActiveTab('availability')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'availability' ? 'bg-white text-[#9D0208] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Classroom Review</span>
            </button>

            <button
              onClick={() => setActiveTab('buildings')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'buildings' ? 'bg-white text-[#9D0208] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Buildings</span>
            </button>

            <button
              onClick={() => setActiveTab('lostfound')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'lostfound' ? 'bg-white text-[#9D0208] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <PackageSearch className="w-3.5 h-3.5" />
              <span>Lost & Found</span>
            </button>
          </div>
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter by name, reg no, or email..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:bg-white"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{filteredUsers.length}</strong> of {usersList.length} registered accounts
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">VIT Student Email</th>
                    <th className="py-3 px-4">Registration No</th>
                    <th className="py-3 px-4">Programme & Semester</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2.5">
                        <img
                          src={(u.avatarUrl && !u.avatarUrl.includes('images.unsplash.com')) ? u.avatarUrl : '/default-avatar.png'}
                          alt={u.fullName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <span>{u.fullName}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#9D0208]">
                        {u.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                          {u.regNo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <p className="font-semibold text-slate-800 text-[11px]">{u.programme}</p>
                        <p className="text-[10px] text-slate-400">{u.yearSemester}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-[#9D0208] border border-amber-200'
                          }`}
                        >
                          {u.role === 'admin' ? 'Administrator' : 'Student'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {u.dateJoined}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'admin' && u.email !== 'admin@vitstudent.ac.in' ? (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title={`Delete ${u.fullName}`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                            Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                        No registered users match your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SLOT CLASS FINDER */}
        {activeTab === 'slot-classes' && (
          <div className="space-y-4">
            {/* Slot Selector Chips */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Select Timetable Slot Code:
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200/80">
                {slotsList.map((slotCode) => (
                  <button
                    key={slotCode}
                    onClick={() => loadSlotClasses(slotCode)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      selectedSlot === slotCode
                        ? 'bg-[#9D0208] text-white shadow-xs scale-105'
                        : 'bg-white text-slate-600 hover:bg-amber-50 hover:text-[#9D0208] border border-slate-200/60'
                    }`}
                  >
                    {slotCode}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Slot Summary Card */}
            {slotData && (
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#9D0208] text-white font-mono font-bold text-xs">
                      Slot {slotData.slot}
                    </span>
                    <span className="text-xs font-bold text-[#9D0208] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#DC2F02]" />
                      {slotData.timing}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Showing all lecture halls, faculty, and academic courses scheduled for this specific slot across campus.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase">Classes Running</p>
                    <p className="text-sm font-extrabold text-[#9D0208]">{slotData.total_classes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase">Seat Occupancy</p>
                    <p className="text-sm font-extrabold text-slate-800">
                      {slotData.total_students_enrolled} / {slotData.total_capacity}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Classes Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Faculty</th>
                    <th className="py-3 px-4">Venue & Block</th>
                    <th className="py-3 px-4">School</th>
                    <th className="py-3 px-4">Enrollment</th>
                    <th className="py-3 px-4 text-right">Map Route</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {slotData && slotData.classes && slotData.classes.map((cls: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#9D0208] text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 mr-1.5">
                          {cls.course_code}
                        </span>
                        <span className="font-bold text-slate-800">{cls.course_name}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {cls.faculty}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800 text-xs">{cls.venue}</p>
                        <p className="text-[10px] text-slate-500">{cls.building}</p>
                      </td>
                      <td className="py-3 px-4 text-[11px] font-medium text-slate-600">
                        {cls.school}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                            <span>{cls.enrolled} Enrolled</span>
                            <span>{cls.capacity} Max</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#9D0208] h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.round((cls.enrolled / cls.capacity) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/map?destName=${encodeURIComponent(cls.venue)}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#9D0208] rounded-lg text-[11px] font-bold border border-amber-200/80 transition-all cursor-pointer"
                        >
                          <MapPin className="w-3 h-3 text-[#DC2F02]" />
                          <span>Locate</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!slotData || !slotData.classes || slotData.classes.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                        No scheduled classes found for slot {selectedSlot}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CLASSROOM REVIEW */}
        {activeTab === 'availability' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Classroom</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Decision Source</th>
                  <th className="py-3 px-4 text-right">Admin Decision Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {availabilities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{item.classroom}</td>
                    <td className="py-3 px-4 font-mono">{item.date} ({item.startTime} - {item.endTime})</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'OCCUPIED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.source || 'UNCONFIRMED'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(item, 'AVAILABLE')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                        >
                          Mark Available
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item, 'OCCUPIED')}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold"
                        >
                          Mark Occupied
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item, 'UNCONFIRMED')}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-bold"
                        >
                          Unconfirm
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: BUILDINGS */}
        {activeTab === 'buildings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Name / ID</th>
                  <th className="py-3 px-4">Building Code</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {buildingsList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{b.name}</td>
                    <td className="py-3 px-4 font-mono">{b.code}</td>
                    <td className="py-3 px-4">{b.totalFloors} Floors • {b.roomsCount} Rooms</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-slate-500 hover:text-[#9D0208]">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-slate-500 hover:text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: LOST AND FOUND */}
        {activeTab === 'lostfound' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Reported Date</th>
                  <th className="py-3 px-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {lostItemsList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{item.title}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.type === 'lost' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.locationName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{item.dateReported}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#9D0208]">{item.contactEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
