import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  DoorOpen,
  PackageSearch,
  Plus,
  Trash2,
  Edit,
  CheckCircle2
} from 'lucide-react';
import { buildings, emptyClassrooms, lostItemsList } from '../data/mockData';
import { adminService } from '../services/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'availability' | 'buildings' | 'rooms' | 'directory' | 'lostfound'>('availability');
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    loadAvailabilities();
  }, []);

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

  const stats = [
    { title: 'Classroom Availability', count: availabilities.length, icon: DoorOpen, color: 'text-teal-600 bg-teal-50' },
    { title: 'Campus Buildings', count: buildings.length, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { title: 'Classrooms Managed', count: emptyClassrooms.length, icon: DoorOpen, color: 'text-amber-600 bg-amber-50' },
    { title: 'Active Lost Items', count: lostItemsList.length, icon: PackageSearch, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-[#005F73] to-[#0A9396] rounded-3xl p-6 md:p-8 text-white shadow-md flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-teal-100 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#94D2BD]" />
            <span>VIT Vellore Administrative Console</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">System Management Panel</h1>
          <p className="text-xs md:text-sm text-teal-100/90 mt-1">
            Manually review classroom availability, edit campus graph nodes, and manage academic resources.
          </p>
        </div>
      </div>

      {/* Notification Banner */}
      {statusNotice && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
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
                <p className="text-[10px] uppercase font-bold text-slate-400">{st.title}</p>
                <p className="text-lg font-black text-slate-800">{st.count}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Admin Management Section */}
      <Card className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['availability', 'buildings', 'rooms', 'directory', 'lostfound'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white text-[#005F73] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'availability' ? 'Classroom Review' : tab === 'lostfound' ? 'Lost & Found' : tab}
              </button>
            ))}
          </div>

          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
            Add Entry
          </Button>
        </div>

        {/* Classroom Availability Review Table */}
        {activeTab === 'availability' ? (
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
        ) : (
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
                {buildings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{b.name}</td>
                    <td className="py-3 px-4 font-mono">{b.code}</td>
                    <td className="py-3 px-4">{b.totalFloors} Floors • {b.roomsCount} Rooms</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-slate-500 hover:text-[#005F73]">
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
      </Card>
    </div>
  );
};
