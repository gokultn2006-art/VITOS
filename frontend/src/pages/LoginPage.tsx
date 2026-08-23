import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, User, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('22BCE1024');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const success = await login(identifier, password);
      if (success) {
        if (role === 'admin' || identifier.includes('admin')) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMsg('Invalid registration number or password. Please try again.');
      }
    } catch {
      setErrorMsg('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoUser = (reg: string, pass: string, isStaff = false) => {
    setIdentifier(reg);
    setPassword(pass);
    setRole(isStaff ? 'admin' : 'student');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[#005F73] p-8 text-center text-white relative">
          <div className="w-12 h-12 rounded-2xl bg-[#0A9396] flex items-center justify-center mx-auto mb-3 shadow-md">
            <Compass className="w-7 h-7 text-white animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">VIT CampusOS</h1>
          <p className="text-xs text-[#94D2BD] mt-1 font-medium">Smart Navigation & Campus Assistance Engine</p>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-4">
          {/* Role Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setRole('student');
                setIdentifier('22BCE1024');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === 'student'
                  ? 'bg-white text-[#005F73] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setIdentifier('admin.campusos@vit.ac.in');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === 'admin'
                  ? 'bg-white text-[#005F73] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {role === 'student' ? 'VIT Registration Number / Email' : 'Staff Admin Email'}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder={role === 'student' ? 'e.g. 22BCE1024' : 'admin.campusos@vit.ac.in'}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-[#005F73] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#005F73] focus:bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2"
              disabled={isLoading}
              icon={isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? 'Signing In...' : 'Sign In to CampusOS'}
            </Button>
          </form>

          {/* Quick Demo Sign In for 3 Multi-User Accounts */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2 text-center">
              Quick Multi-User Account Selector
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoUser('22BCE1024', 'password123')}
                className="px-2 py-1.5 bg-teal-50 border border-teal-200/70 text-[#005F73] rounded-xl text-[10px] font-bold hover:bg-teal-100 transition-colors truncate"
              >
                Chris (22BCE1024)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoUser('23BCE0512', 'password123')}
                className="px-2 py-1.5 bg-blue-50 border border-blue-200/70 text-blue-800 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition-colors truncate"
              >
                Rahul (23BCE0512)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoUser('21BCE0199', 'password123')}
                className="px-2 py-1.5 bg-purple-50 border border-purple-200/70 text-purple-800 rounded-xl text-[10px] font-bold hover:bg-purple-100 transition-colors truncate"
              >
                Ananya (21BCE0199)
              </button>
            </div>
          </div>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">
              New to CampusOS?{' '}
              <Link to="/register" className="font-bold text-[#005F73] hover:text-[#0A9396]">
                Register New Student Account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} title="Reset CampusOS Password">
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Enter your registered VIT student email address to receive password reset instructions.</span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Student Email Address</label>
            <input
              type="email"
              placeholder="e.g. chris.student2022@vitstudent.ac.in"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsForgotModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => {
              alert('Password reset link sent to your VIT student email!');
              setIsForgotModalOpen(false);
            }}>
              Send Reset Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
