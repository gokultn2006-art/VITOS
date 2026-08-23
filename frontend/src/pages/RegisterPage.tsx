import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, User, Mail, BookOpen, GraduationCap, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [programme, setProgramme] = useState('B.Tech Computer Science and Engineering');
  const [yearSemester, setYearSemester] = useState('3rd Year (Semester VI)');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await register({
        fullName,
        regNo: regNo.toUpperCase(),
        email,
        password,
        programme,
        yearSemester
      });

      if (success) {
        setSuccessMsg('Account created successfully! Redirecting to your personalized dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setErrorMsg('Registration failed. An account with this Reg No or Email may already exist.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Banner Header */}
        <div className="bg-[#005F73] p-6 text-center text-white relative">
          <div className="w-12 h-12 rounded-2xl bg-[#0A9396] flex items-center justify-center mx-auto mb-3 shadow-md">
            <Compass className="w-7 h-7 text-white animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Student Account</h1>
          <p className="text-xs text-[#94D2BD] mt-1 font-medium">Join VIT CampusOS Smart Navigation Engine</p>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">VIT Registration Number *</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="e.g. 23BCE0512"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">VIT Student Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.sharma2023@vitstudent.ac.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Programme / Branch</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={programme}
                    onChange={(e) => setProgramme(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73]"
                  >
                    <option value="B.Tech Computer Science and Engineering">B.Tech CSE</option>
                    <option value="B.Tech Computer Science and Engineering (Data Science)">B.Tech CSE (Data Science)</option>
                    <option value="B.Tech Computer Science and Engineering (AI & ML)">B.Tech CSE (AI & ML)</option>
                    <option value="B.Tech Electronics and Communication Engineering">B.Tech ECE</option>
                    <option value="B.Tech Electrical and Electronics Engineering">B.Tech EEE</option>
                    <option value="B.Tech Mechanical Engineering">B.Tech Mechanical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Academic Year / Semester</label>
                <select
                  value={yearSemester}
                  onChange={(e) => setYearSemester(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73]"
                >
                  <option value="1st Year (Semester I)">1st Year (Semester I)</option>
                  <option value="1st Year (Semester II)">1st Year (Semester II)</option>
                  <option value="2nd Year (Semester III)">2nd Year (Semester III)</option>
                  <option value="2nd Year (Semester IV)">2nd Year (Semester IV)</option>
                  <option value="3rd Year (Semester V)">3rd Year (Semester V)</option>
                  <option value="3rd Year (Semester VI)">3rd Year (Semester VI)</option>
                  <option value="4th Year (Semester VII)">4th Year (Semester VII)</option>
                  <option value="4th Year (Semester VIII)">4th Year (Semester VIII)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2"
              disabled={isLoading}
              icon={isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#005F73] hover:text-[#0A9396]">
                Sign In to CampusOS
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
