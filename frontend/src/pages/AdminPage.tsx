import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Trash2,
  Edit,
  CheckCircle2,
  Users,
  Search,
  Clock,
  Layers,
  MapPin,
  Plus
} from 'lucide-react';
import { buildings } from '../data/mockData';
import { adminService } from '../services/api';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'slot-classes' | 'buildings'>('users');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Buildings State
  const [buildingsList, setBuildingsList] = useState<any[]>(buildings);
  const [buildingSearch, setBuildingSearch] = useState('');
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<any | null>(null);
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    code: '',
    lat: 12.97061,
    lng: 79.15951,
    totalFloors: 5,
    roomsCount: 60,
  });
  const [savingBuilding, setSavingBuilding] = useState(false);

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

  // Buildings Management Actions
  const handleOpenAddBuilding = () => {
    setEditingBuilding(null);
    setBuildingForm({
      name: '',
      code: '',
      lat: 12.97061,
      lng: 79.15951,
      totalFloors: 5,
      roomsCount: 60,
    });
    setIsBuildingModalOpen(true);
  };

  const handleOpenEditBuilding = (b: any) => {
    setEditingBuilding(b);
    setBuildingForm({
      name: b.name || '',
      code: b.code || '',
      lat: Number(b.lat) || 12.97061,
      lng: Number(b.lng) || 79.15951,
      totalFloors: Number(b.totalFloors || b.total_floors) || 1,
      roomsCount: Number(b.roomsCount || b.rooms_count) || 0,
    });
    setIsBuildingModalOpen(true);
  };

  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingForm.name.trim() || !buildingForm.code.trim()) {
      alert('Building name and code are required.');
      return;
    }

    setSavingBuilding(true);
    try {
      if (editingBuilding) {
        // Edit existing building
        const targetId = editingBuilding.id || editingBuilding.code;
        const res = await adminService.updateBuilding(targetId, buildingForm);
        if (res.success) {
          setStatusNotice(`Building "${buildingForm.name}" (${buildingForm.code}) updated successfully.`);
          setBuildingsList((prev) =>
            prev.map((item) =>
              (item.id === editingBuilding.id || item.code === editingBuilding.code)
                ? { ...item, ...buildingForm, code: buildingForm.code.toUpperCase() }
                : item
            )
          );
          setIsBuildingModalOpen(false);
        } else {
          setStatusNotice(res.error || 'Failed to update building.');
        }
      } else {
        // Create new building
        const res = await adminService.createBuilding(buildingForm);
        if (res.success) {
          const newB = res.data || {
            id: `b_${buildingForm.code.toLowerCase()}`,
            ...buildingForm,
            code: buildingForm.code.toUpperCase()
          };
          setStatusNotice(`Building "${buildingForm.name}" (${buildingForm.code}) created successfully.`);
          setBuildingsList((prev) => [newB, ...prev]);
          setIsBuildingModalOpen(false);
        } else {
          setStatusNotice(res.error || 'Failed to create building.');
        }
      }
    } finally {
      setSavingBuilding(false);
    }
  };

  const handleDeleteBuilding = async (b: any) => {
    if (window.confirm(`Are you sure you want to delete building "${b.name}" (${b.code})? This action cannot be undone.`)) {
      const targetId = b.id || b.code;
      const res = await adminService.deleteBuilding(targetId);
      if (res.success) {
        setStatusNotice(`Building "${b.name}" (${b.code}) was deleted successfully.`);
        setBuildingsList((prev) => prev.filter((item) => item.id !== b.id && item.code !== b.code));
      } else {
        setStatusNotice(res.error || 'Failed to delete building.');
      }
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

  // Filter buildings by search
  const filteredBuildings = buildingsList.filter((b) => {
    const q = buildingSearch.toLowerCase();
    return (
      (b.name || '').toLowerCase().includes(q) ||
      (b.code || '').toLowerCase().includes(q)
    );
  });

  const stats = [
    { title: 'Registered Users', count: usersList.length, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Slot Class Matrix', count: `${slotsList.length} Slots`, icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
    { title: 'Campus Buildings', count: `${buildingsList.length} Buildings`, icon: Building2, color: 'text-amber-600 bg-amber-50' },
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
            Manage registered accounts, inspect student timetable slot distributions, and maintain campus buildings.
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
          <button onClick={() => setStatusNotice(null)} className="font-bold underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'slot-classes' ? 'bg-white text-[#9D0208] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Slot Class Finder</span>
            </button>

            <button
              onClick={() => setActiveTab('buildings')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'buildings' ? 'bg-white text-[#9D0208] shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Campus Buildings</span>
              <span className="text-[10px] bg-amber-100 text-[#9D0208] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {buildingsList.length}
              </span>
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

        {/* TAB 2: SLOT CLASS FINDER (Filled based on student uploaded timetables) */}
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
                    Aggregated directly from timetables uploaded and registered by students across campus.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase">Classes Running</p>
                    <p className="text-sm font-extrabold text-[#9D0208]">{slotData.total_classes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase">Students Enrolled</p>
                    <p className="text-sm font-extrabold text-slate-800">
                      {slotData.total_students_enrolled} Enrolled
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
                    <th className="py-3 px-4">Enrolled Students (Uploaded)</th>
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
                        {cls.slot_combination && (
                          <span className="block font-mono text-[10px] text-stone-400 mt-0.5">
                            Slot: {cls.slot_combination}
                          </span>
                        )}
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
                        {cls.students && cls.students.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {cls.students.map((st: any) => (
                                <span
                                  key={st.id || st.reg_no}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>{st.name}</span>
                                  <span className="text-[10px] text-emerald-600 font-mono">({st.reg_no})</span>
                                </span>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Uploaded by {cls.students.length} student{cls.students.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No student uploaded timetable yet
                          </span>
                        )}
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
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                        <div className="max-w-md mx-auto space-y-2">
                          <p className="font-bold text-slate-600 text-sm">No Student Timetables Uploaded for Slot {selectedSlot}</p>
                          <p className="text-slate-400">
                            When students upload or import their VTOP timetable slips containing slot {selectedSlot}, their classes, enrolled student names, and venues will automatically populate here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CAMPUS BUILDINGS (With Working Edit & Delete Actions) */}
        {activeTab === 'buildings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  value={buildingSearch}
                  onChange={(e) => setBuildingSearch(e.target.value)}
                  placeholder="Filter by building name or code..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs text-slate-500 font-medium">
                  Showing <strong className="text-slate-800">{filteredBuildings.length}</strong> of {buildingsList.length} buildings
                </span>
                <Button
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleOpenAddBuilding}
                  className="shrink-0"
                >
                  Add Building
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4">Building Name</th>
                    <th className="py-3 px-4">Building Code</th>
                    <th className="py-3 px-4">Capacity & Structure</th>
                    <th className="py-3 px-4">GPS Coordinates</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredBuildings.map((b) => (
                    <tr key={b.id || b.code} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#9D0208]" />
                        <span>{b.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold bg-amber-50 text-[#9D0208] px-2 py-0.5 rounded border border-amber-200/80 text-[11px]">
                          {b.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.totalFloors || b.total_floors || 1} Floors • {b.roomsCount || b.rooms_count || 0} Rooms / Labs
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {Number(b.lat).toFixed(5)}, {Number(b.lng).toFixed(5)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditBuilding(b)}
                            title={`Edit ${b.name}`}
                            className="p-1.5 text-slate-500 hover:text-[#9D0208] hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBuilding(b)}
                            title={`Delete ${b.name}`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBuildings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                        No buildings match your filter query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* ADD / EDIT BUILDING MODAL */}
      <Modal
        isOpen={isBuildingModalOpen}
        onClose={() => setIsBuildingModalOpen(false)}
        title={editingBuilding ? `Edit Building: ${editingBuilding.name}` : 'Add New Campus Building'}
      >
        <form onSubmit={handleSaveBuilding} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Building Full Name</label>
            <input
              type="text"
              required
              value={buildingForm.name}
              onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
              placeholder="e.g. Pearl Research Park"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Building Code</label>
              <input
                type="text"
                required
                value={buildingForm.code}
                onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PRP"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono uppercase text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Total Floors</label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={buildingForm.totalFloors}
                onChange={(e) => setBuildingForm({ ...buildingForm, totalFloors: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Rooms / Labs</label>
              <input
                type="number"
                min="0"
                max="1000"
                required
                value={buildingForm.roomsCount}
                onChange={(e) => setBuildingForm({ ...buildingForm, roomsCount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Latitude</label>
              <input
                type="number"
                step="0.00001"
                required
                value={buildingForm.lat}
                onChange={(e) => setBuildingForm({ ...buildingForm, lat: parseFloat(e.target.value) || 12.97061 })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Longitude</label>
              <input
                type="number"
                step="0.00001"
                required
                value={buildingForm.lng}
                onChange={(e) => setBuildingForm({ ...buildingForm, lng: parseFloat(e.target.value) || 79.15951 })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBuildingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={savingBuilding}
            >
              {savingBuilding ? 'Saving...' : (editingBuilding ? 'Update Building' : 'Add Building')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
