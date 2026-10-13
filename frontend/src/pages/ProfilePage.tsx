import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Mail, BookOpen, MapPin, Navigation2, LogOut, CheckCircle2, AlertCircle, Edit, Save, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { campusLocations } from '../data/mockData';
import { profileService } from '../services/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';

const DEFAULT_AVATAR = '/default-avatar.png';

const getCleanAvatar = (avatar?: string) => {
  if (!avatar || avatar.includes('images.unsplash.com')) {
    return DEFAULT_AVATAR;
  }
  return avatar;
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUserProfile, deleteAccount } = useAuth();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    fullName: user?.name || '',
    programme: user?.program || 'B.Tech Computer Science and Engineering',
    school: user?.school || 'SCOPE (School of Computer Science and Engineering)',
    yearSemester: user?.year || '3rd Year (Semester VI)',
    avatarUrl: getCleanAvatar(user?.avatar),
  });

  const isAdminUser =
    user?.role === 'admin' ||
    user?.email === 'admin@vitstudent.ac.in' ||
    Boolean(user?.name?.toLowerCase().includes('admin'));

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteAccount();
      setIsDeleteModalOpen(false);
      if (res.success) {
        setIsEditModalOpen(false);
        navigate('/login');
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to delete student account.',
        });
      }
    } catch (err: any) {
      setIsDeleteModalOpen(false);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'An error occurred while deleting your account.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = () => {
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    setEditForm({
      fullName: user?.name || '',
      programme: user?.program || 'B.Tech Computer Science and Engineering',
      school: user?.school || 'SCOPE (School of Computer Science and Engineering)',
      yearSemester: user?.year || '3rd Year (Semester VI)',
      avatarUrl: getCleanAvatar(user?.avatar),
    });
    setIsEditModalOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({
          type: 'error',
          text: 'Image file size exceeds maximum limit of 5MB.',
        });
        return;
      }
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setEditForm((prev) => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefaultPhoto = () => {
    setSelectedPhotoFile(null);
    setPhotoPreview(DEFAULT_AVATAR);
    setEditForm((prev) => ({ ...prev, avatarUrl: DEFAULT_AVATAR }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedPhotoFile) {
        try {
          await profileService.uploadPhoto(selectedPhotoFile);
        } catch (err) {
          console.warn('Backend photo upload note:', err);
        }
      }

      const finalAvatarUrl = photoPreview || editForm.avatarUrl || DEFAULT_AVATAR;

      const ok = await updateUserProfile({
        fullName: editForm.fullName.trim(),
        programme: editForm.programme.trim(),
        school: editForm.school.trim(),
        yearSemester: editForm.yearSemester.trim(),
        avatarUrl: finalAvatarUrl,
      });

      if (ok) {
        setIsEditModalOpen(false);
        setStatusMessage({
          type: 'success',
          text: 'Profile details updated and synchronized with the database successfully!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Failed to update profile. Please try again.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'An error occurred while updating your profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const savedLocations = campusLocations.filter((l) => (user?.savedLocationIds || ['loc_tt', 'loc_lib']).includes(l.id));

  // Determine if Programme contains Integrated M.Tech (case-insensitive)
  const isIntegratedMTech = /integrated\s*m\.?tech/i.test(editForm.programme);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
          <button onClick={() => setStatusMessage(null)} className="font-bold underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Student Identity Card Banner */}
      <div className="bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left flex-1">
          <div
            className="relative group cursor-pointer"
            onClick={openEditModal}
            title="Edit Profile"
          >
            <img
              src={getCleanAvatar(user?.avatar)}
              alt={user?.name}
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-white/10 border-2 border-amber-300/40 shadow-md group-hover:border-[#FFBA08] group-hover:scale-105 transition-all"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditModal();
              }}
              title="Edit Profile"
              className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-white text-[#9D0208] rounded-lg shadow-md hover:scale-110 transition-transform cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black tracking-tight">{user?.name || 'Student Account'}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-mono font-bold text-[#FFBA08]">
                {user?.regNo}
              </span>
            </div>

            <p className="text-xs md:text-sm text-stone-200 font-medium">{user?.program || 'B.Tech Computer Science and Engineering'}</p>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 pt-1 text-xs text-stone-200">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#FFBA08]" /> {user?.school || 'SCOPE'}
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Mail className="w-3.5 h-3.5 text-[#FFBA08]" /> {user?.email || 'student@vitstudent.ac.in'}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-stretch gap-3 w-full md:w-56">
          <div className="bg-white/10 backdrop-blur-xs px-5 py-3 rounded-2xl border border-white/20 text-center w-full">
            <span className="text-[10px] uppercase font-bold text-[#FFBA08]">Academic Status</span>
            <p className="text-xs md:text-sm font-bold text-white mt-0.5">{user?.year || '3rd Year'}</p>
          </div>

          <Button
            variant="danger"
            size="md"
            className="w-full py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            icon={<LogOut className="w-4 h-4" />}
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
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-bold text-[#03071E] text-sm flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#9D0208]" />
              <span>Saved Places ({savedLocations.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-stone-400 uppercase">Personal Favorites</span>
          </div>

          <div className="space-y-2.5">
            {savedLocations.map((loc) => (
              <div
                key={loc.id}
                onClick={() => navigate(`/map?dest=${loc.code}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/60 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-[#9D0208]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#03071E] group-hover:text-[#9D0208] transition-colors">{loc.name}</div>
                    <div className="text-[10px] text-stone-500">{loc.category} • Code: {loc.code}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#9D0208]">
                  <span>Navigate</span>
                  <Navigation2 className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Account Details & Security Boundaries */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-bold text-[#03071E] text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#9D0208]" />
              <span>Academic Details</span>
            </h3>
            <span className="text-[10px] font-bold text-stone-400 uppercase">Vellore Institute</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Programme & Branch</span>
              <span className="font-bold text-slate-800">{user?.program || 'B.Tech CSE'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">School</span>
              <span className="font-bold text-slate-800">{user?.school || 'SCOPE'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Active Semester</span>
              <span className="font-bold text-slate-800">{user?.year || 'Winter 2025 - 2026'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Security Isolation</span>
              <span className="font-bold text-emerald-700">Authenticated Session Active</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <p className="text-xs text-slate-500">
            Update your profile details. Changes will synchronize immediately across your account and the database.
          </p>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
              placeholder="e.g. Varun Kumar"
            />
          </div>

          {/* Programme */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Programme & Degree
            </label>
            <input
              type="text"
              required
              value={editForm.programme}
              onChange={(e) => setEditForm({ ...editForm, programme: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
              placeholder="e.g. B.Tech Computer Science and Engineering"
            />
          </div>

          {/* School */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              School
            </label>
            <select
              value={editForm.school}
              onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
            >
              <option value="SCOPE (School of Computer Science and Engineering)">SCOPE (School of Computer Science and Engineering)</option>
              <option value="SENSE (School of Electronics Engineering)">SENSE (School of Electronics Engineering)</option>
              <option value="SITE (School of Information Technology and Engineering)">SITE (School of Information Technology and Engineering)</option>
              <option value="SELECT (School of Electrical Engineering)">SELECT (School of Electrical Engineering)</option>
              <option value="SMEC (School of Mechanical Engineering)">SMEC (School of Mechanical Engineering)</option>
              <option value="SAS (School of Advanced Sciences)">SAS (School of Advanced Sciences)</option>
              <option value="VSB (VIT School of Business)">VSB (VIT School of Business)</option>
              <option value="CampusOS Administration">CampusOS Administration</option>
            </select>
          </div>

          {/* Academic Year / Semester */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Year & Semester
            </label>
            <select
              value={editForm.yearSemester}
              onChange={(e) => setEditForm({ ...editForm, yearSemester: e.target.value })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
            >
              <option value="1st Year (Semester I)">1st Year (Semester I)</option>
              <option value="1st Year (Semester II)">1st Year (Semester II)</option>
              <option value="2nd Year (Semester III)">2nd Year (Semester III)</option>
              <option value="2nd Year (Semester IV)">2nd Year (Semester IV)</option>
              <option value="3rd Year (Semester V)">3rd Year (Semester V)</option>
              <option value="3rd Year (Semester VI)">3rd Year (Semester VI)</option>
              <option value="4th Year (Semester VII)">4th Year (Semester VII)</option>
              <option value="4th Year (Semester VIII)">4th Year (Semester VIII)</option>
              {isIntegratedMTech && (
                <>
                  <option value="5th Year (Semester IX)">5th Year (Semester IX)</option>
                  <option value="5th Year (Semester X)">5th Year (Semester X)</option>
                </>
              )}
              <option value="Staff / Faculty">Staff / Faculty</option>
            </select>
            {isIntegratedMTech ? (
              <p className="text-[11px] text-[#9D0208] font-bold mt-1">
                ✓ Integrated M.Tech detected — 5th Year (Semesters IX & X) available.
              </p>
            ) : (
              <p className="text-[11px] text-stone-400 mt-1">
                Note: 5th Year options are only available for Integrated M.Tech programmes.
              </p>
            )}
          </div>

          {/* Profile Photo Upload Section */}
          <div className="pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <img
                src={photoPreview || editForm.avatarUrl || DEFAULT_AVATAR}
                alt="Profile Preview"
                className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-300 shadow-xs shrink-0"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    icon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Photo
                  </Button>
                  {((photoPreview && photoPreview !== DEFAULT_AVATAR) || (editForm.avatarUrl && editForm.avatarUrl !== DEFAULT_AVATAR)) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                      onClick={handleResetToDefaultPhoto}
                    >
                      Use Plain Photo
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload your own photo (PNG, JPG, max 5MB) or keep the default plain photo.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone: Delete Account (Allowed for all profiles EXCEPT Admin) */}
          {!isAdminUser && (
            <div className="pt-3 border-t border-rose-200">
              <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete Account</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Permanently delete your student profile and all associated data from the campus database.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isDeleting}
                  className="shrink-0 text-xs py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
              icon={<Save className="w-3.5 h-3.5" />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
      >
        <div className="space-y-4 text-xs text-stone-600">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-950">
                Are you sure you want to permanently delete your student account?
              </p>
              <p className="text-rose-700 text-[11px]">
                This will permanently delete the account for <strong>{user?.name} ({user?.regNo})</strong>. All your saved locations, profile information, and timetable data will be removed. This action cannot be reversed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isDeleting}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

