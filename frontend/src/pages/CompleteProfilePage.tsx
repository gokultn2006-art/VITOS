import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  User as UserIcon,
  GraduationCap,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VELLORE_PROGRAMMES_BY_CATEGORY, PROGRAMME_CATEGORY_OPTIONS } from '../data/vitProgrammes';

export const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.name || '');
  const [regNo, setRegNo] = useState(user?.regNo || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [programme, setProgramme] = useState<string>('');
  const [yearSemester, setYearSemester] = useState<string>('1st Year (Semester I)');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill user data when context is loaded
  useEffect(() => {
    if (user) {
      if (!fullName && user.name) setFullName(user.name);
      if (!regNo && user.regNo) setRegNo(user.regNo);

      // If user already has a valid programme, pre-select category
      if (user.program) {
        for (const [cat, progs] of Object.entries(VELLORE_PROGRAMMES_BY_CATEGORY)) {
          if (progs.includes(user.program)) {
            setSelectedCategory(cat);
            setProgramme(user.program);
            break;
          }
        }
      }

      if (user.year) {
        setYearSemester(user.year);
      }
    }
  }, [user]);

  // Determine available Vellore programmes based on category
  const availableProgrammes = selectedCategory
    ? VELLORE_PROGRAMMES_BY_CATEGORY[selectedCategory] || []
    : [];

  const isIntegratedMTech = /integrated\s*m\.?tech/i.test(programme);

  // When category changes, reset programme if incompatible
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setProgramme('');
    if (cat === 'Research Programmes') {
      setYearSemester('Research Scholar (Ph.D)');
    } else {
      setYearSemester('1st Year (Semester I)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!regNo.trim()) {
      setErrorMsg('Please enter your VIT registration number (e.g. 23BCE0512).');
      return;
    }

    if (!selectedCategory) {
      setErrorMsg('Please select a programme type.');
      return;
    }

    if (!programme) {
      setErrorMsg('Please select your specific programme / degree offered in Vellore.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await updateUserProfile({
        fullName: fullName.trim(),
        regNo: regNo.trim().toUpperCase(),
        programme,
        yearSemester,
      });

      if (success) {
        navigate('/dashboard');
      } else {
        setErrorMsg('Failed to update student profile. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] p-8 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9D0208] to-[#DC2F02] border border-amber-300/40 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Compass className="w-8 h-8 text-[#FFBA08] animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Complete Student Profile</h1>
          <p className="text-xs text-[#FFBA08] mt-1 font-medium">
            VIT Vellore Campus Companion — Google Account Setup
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-5">
          {/* Verified Google Account Callout */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-900">Google Workspace Verified</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded-full text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Official Student SSO
                </span>
              </div>
              <p className="text-emerald-800 font-mono text-[11px]">
                {user?.email || 'student@vitstudent.ac.in'}
              </p>
              <p className="text-emerald-700 text-[11px]">
                Your identity is secured by Google. <strong>No password creation is required</strong>. Fill in your academic details below to finish setup.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Name & Registration Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  VIT Registration Number *
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                    placeholder="e.g. 23BCE0512"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs uppercase font-mono tracking-wider text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Cascading Programme Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dropdown 1: Programme Type */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Programme Type *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 w-4 h-4 text-stone-400 pointer-events-none" />
                  <select
                    required
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Select Programme Type --</option>
                    {PROGRAMME_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dropdown 2: Specific Degree (Vellore only) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Programme / Degree (Vellore) *
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-stone-400 pointer-events-none" />
                  <select
                    required
                    disabled={!selectedCategory}
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] ${
                      !selectedCategory
                        ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed opacity-75'
                        : 'bg-stone-50 border-stone-200 text-stone-900 focus:bg-white cursor-pointer'
                    }`}
                  >
                    {!selectedCategory ? (
                      <option value="">-- Select Programme Type First --</option>
                    ) : (
                      <>
                        <option value="">
                          -- Select Programme ({availableProgrammes.length} in Vellore) --
                        </option>
                        {availableProgrammes.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Academic Year / Semester */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Academic Year / Semester *
              </label>
              <select
                value={yearSemester}
                onChange={(e) => setYearSemester(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white cursor-pointer"
              >
                {selectedCategory === 'Research Programmes' ? (
                  <>
                    <option value="Research Scholar (Ph.D)">Research Scholar (Ph.D)</option>
                    <option value="1st Year (Research)">1st Year (Research)</option>
                    <option value="2nd Year (Research)">2nd Year (Research)</option>
                    <option value="3rd Year (Research)">3rd Year (Research)</option>
                  </>
                ) : selectedCategory === 'PG Programmes' ? (
                  <>
                    <option value="1st Year (Semester I)">1st Year (Semester I)</option>
                    <option value="1st Year (Semester II)">1st Year (Semester II)</option>
                    <option value="2nd Year (Semester III)">2nd Year (Semester III)</option>
                    <option value="2nd Year (Semester IV)">2nd Year (Semester IV)</option>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </select>
              {isIntegratedMTech && (
                <p className="text-[11px] text-amber-700 mt-1 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#DC2F02]" />
                  <span>5th Year options enabled for Integrated M.Tech curriculum.</span>
                </p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#9D0208] hover:bg-[#6A040F] active:bg-[#370617] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Complete Registration & Enter CampusOS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
