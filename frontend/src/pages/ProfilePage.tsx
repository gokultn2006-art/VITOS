import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Mail, BookOpen, MapPin, Navigation2, LogOut, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { campusLocations } from '../data/mockData';
import { profileService } from '../services/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const savedLocations = campusLocations.filter((l) => (user?.savedLocationIds || ['loc_tt', 'loc_lib']).includes(l.id));

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME format (JPG, PNG, WEBP)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      setStatusMessage({ type: 'error', text: 'Invalid image format. Only JPG, JPEG, PNG, and WEBP files are allowed.' });
      return;
    }

    // Validate size limit <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'File size exceeds maximum limit of 5MB.' });
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);

    const res = await profileService.uploadPhoto(file);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Profile photo uploaded and saved successfully to database!' });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to upload profile photo.' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hidden File Input for Profile Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </span>
          <button onClick={() => setStatusMessage(null)} className="font-bold underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Student Identity Card Banner */}
      <div className="bg-gradient-to-r from-[#005F73] to-[#0A9396] rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <img
            src={avatarPreview || profileService.getPhotoUrl() || user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
            alt={user?.name || 'Student Profile'}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-white/30 shadow-lg group-hover:opacity-80 transition-opacity"
            onError={(e) => {
              (e.target as HTMLImageElement).src = user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';
            }}
          />
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#005F73] text-white border-2 border-white shadow-md">
            <Camera className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{user?.name || 'Student Account'}</h1>
            <span className="text-xs font-mono font-bold bg-[#94D2BD] text-[#005F73] px-2.5 py-0.5 rounded-full">
              {user?.regNo || '22BCE1024'}
            </span>
          </div>

          <p className="text-xs md:text-sm text-teal-100 mt-1">{user?.program || 'B.Tech Computer Science and Engineering'}</p>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-xs text-teal-100">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-[#94D2BD]" /> {user?.school || 'SCOPE'}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#94D2BD]" /> {user?.email || 'student@vitstudent.ac.in'}
            </span>
          </div>

          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 border border-white/20 text-xs"
              icon={<Camera className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Profile Photo
            </Button>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-3">
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/20 text-center w-full">
            <span className="text-[10px] uppercase font-bold text-teal-200">Academic Status</span>
            <p className="text-sm font-bold text-white mt-0.5">{user?.year || '3rd Year'}</p>
          </div>

          <Button
            variant="danger"
            size="sm"
            className="w-full"
            icon={<LogOut className="w-3.5 h-3.5" />}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Locations */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#005F73]" />
              <span>Saved Places ({savedLocations.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Personal Favorites</span>
          </div>

          <div className="space-y-2.5">
            {savedLocations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => navigate(`/map?dest=${loc.code}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-100/60 text-[#005F73]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-[#005F73] transition-colors">{loc.name}</div>
                    <div className="text-[10px] text-slate-500">{loc.category} • Code: {loc.code}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#005F73]">
                  <span>Navigate</span>
                  <Navigation2 className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Account Details & Security Boundaries */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#005F73]" />
              <span>Academic Details</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vellore Institute</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Registration Number</span>
              <span className="font-mono font-bold text-slate-800">{user?.regNo || '22BCE1024'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Programme & Branch</span>
              <span className="font-bold text-slate-800">{user?.program || 'B.Tech CSE'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">School</span>
              <span className="font-bold text-slate-800">School of Computer Science & Eng.</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Active Semester</span>
              <span className="font-bold text-slate-800">Winter 2025 - 2026</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Security Isolation</span>
              <span className="font-bold text-emerald-700">Authenticated Session Active</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
