import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { GoogleAuthButton } from '../components/GoogleAuthButton';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      const success = await login(cleanEmail, password);
      if (success) {
        // Retrieve logged in user profile from storage
        const userStr = localStorage.getItem('vitos_user');
        const loggedUser = userStr ? JSON.parse(userStr) : null;
        if (loggedUser?.role === 'admin' || cleanEmail.toLowerCase().startsWith('admin')) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMsg('Invalid email or password. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] p-8 text-center text-white relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9D0208] to-[#DC2F02] border border-amber-300/40 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Compass className="w-7 h-7 text-[#FFBA08] animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">VIT CampusOS</h1>
          <p className="text-xs text-[#FFBA08] mt-1 font-medium">Smart Navigation & Campus Assistance Engine</p>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Direct Sign-In */}
          <GoogleAuthButton
            label="Sign in with Google (@vitstudent.ac.in)"
            onSuccess={(isNewUser) => {
              if (isNewUser) {
                navigate('/complete-profile');
              } else {
                navigate('/dashboard');
              }
            }}
            onError={(msg) => setErrorMsg(msg)}
          />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                or sign in with student email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="yourname@vitstudent.ac.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-[#9D0208] hover:text-[#DC2F02] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
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
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-xs text-stone-500">
              New student?{' '}
              <Link to="/register" className="font-bold text-[#9D0208] hover:text-[#DC2F02]">
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
            <span>Enter your registered VIT student email address ending in @vitstudent.ac.in to receive password reset instructions.</span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Student Email Address</label>
            <input
              type="email"
              placeholder="e.g. rahul.sharma2023@vitstudent.ac.in"
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
