import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, User, Mail, BookOpen, GraduationCap, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, KeyRound, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Button } from '../components/Button';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { VELLORE_PROGRAMMES_BY_CATEGORY, PROGRAMME_CATEGORY_OPTIONS } from '../data/vitProgrammes';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2-level cascading programme selection:
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [programme, setProgramme] = useState<string>('');
  const [yearSemester, setYearSemester] = useState<string>('1st Year (Semester I)');

  const availableProgrammes = selectedCategory
    ? VELLORE_PROGRAMMES_BY_CATEGORY[selectedCategory] || []
    : [];

  const isIntegratedMTech = /integrated\s*m\.?tech/i.test(programme);

  // OTP Email Verification State
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer effect
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Reset verification if user changes email
  const handleEmailChange = (newVal: string) => {
    setEmail(newVal);
    if (isEmailVerified) {
      setIsEmailVerified(false);
      setOtpSent(false);
      setOtpCode('');
      setOtpMessage('');
    }
  };

  const handleSendOtp = async () => {
    setOtpError('');
    setOtpMessage('');
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setOtpError('Please enter your @vitstudent.ac.in email address first.');
      return;
    }

    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      setOtpError('Registration is restricted to official VIT student emails ending with @vitstudent.ac.in.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await authService.sendOtp(cleanEmail);
      setOtpSent(true);
      setOtpMessage(res.message || `Verification code sent to ${cleanEmail}`);
      setOtpCountdown(60);
    } catch (err: any) {
      setOtpError(err.response?.data?.error || err.message || 'Failed to dispatch verification code. Please verify the email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpMessage('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await authService.verifyOtp(cleanEmail, cleanCode);
      if (res.verified) {
        setIsEmailVerified(true);
        setOtpMessage('✓ Email address verified successfully!');
        setOtpError('');
      } else {
        setOtpError('Verification failed. Please check the code.');
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.error || err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isEmailVerified) {
      setErrorMsg('Please verify your @vitstudent.ac.in student email with the 6-digit code first.');
      return;
    }

    if (!selectedCategory) {
      setErrorMsg('Please select a programme type (e.g. Engineering, UG, PG, Integrated, Research).');
      return;
    }

    if (!programme) {
      setErrorMsg('Please select your specific programme offered at VIT Vellore.');
      return;
    }

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
      const cleanEmail = email.trim().toLowerCase();
      const success = await register({
        fullName: fullName.trim(),
        regNo: regNo.trim().toUpperCase(),
        email: cleanEmail,
        password,
        programme,
        yearSemester
      });

      if (success) {
        setSuccessMsg('Account created successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setErrorMsg('Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#370617] via-[#6A040F] to-[#9D0208] p-6 text-center text-white relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9D0208] to-[#DC2F02] border border-amber-300/40 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Compass className="w-7 h-7 text-[#FFBA08] animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Student Account</h1>
          <p className="text-xs text-[#FFBA08] mt-1 font-medium">VIT Vellore Campus Companion</p>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8 space-y-4">
          {/* Google Sign-in Option */}
          <div>
            <GoogleAuthButton
              label="Sign up with Google (@vitstudent.ac.in)"
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
                  or register with student email
                </span>
              </div>
            </div>
          </div>

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
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
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
                <label className="block text-xs font-bold text-stone-700 mb-1">VIT Registration Number *</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    placeholder="e.g. 23BCE0512"
                    className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Email Field & OTP Verification Block */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                VIT Student Email Address *
              </label>

              {!isEmailVerified ? (
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="yourname.regno@vitstudent.ac.in"
                        className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isSendingOtp || otpCountdown > 0 || !email.trim().toLowerCase().endsWith('@vitstudent.ac.in')}
                      onClick={handleSendOtp}
                      className="px-3.5 py-2.5 bg-[#9D0208] hover:bg-[#6A040F] disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {isSendingOtp ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {otpCountdown > 0
                          ? `Resend (${otpCountdown}s)`
                          : otpSent
                          ? 'Resend Code'
                          : 'Send Code'}
                      </span>
                    </button>
                  </div>

                  {/* Domain Requirement Hint */}
                  <p className="text-[11px] text-stone-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#9D0208]" />
                    <span>Must end with <strong>@vitstudent.ac.in</strong> to receive verification code.</span>
                  </p>

                  {/* OTP Code Entry Card */}
                  {otpSent && (
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#9D0208] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#DC2F02]" />
                          <span>Enter 6-Digit Verification Code</span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium">Valid for 10 minutes</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-center text-sm font-mono font-bold tracking-widest text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208]"
                        />
                        <button
                          type="button"
                          disabled={isVerifyingOtp || otpCode.length !== 6}
                          onClick={handleVerifyOtp}
                          className="px-4 py-2 bg-[#9D0208] hover:bg-[#6A040F] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
                        </button>
                      </div>

                      {otpMessage && (
                        <p className="text-[11px] font-semibold text-emerald-700">{otpMessage}</p>
                      )}
                      {otpError && (
                        <p className="text-[11px] font-semibold text-rose-700">{otpError}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Email Verified: <strong className="font-mono">{email}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailVerified(false);
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Programme Selection (2 Linked Dropdown Menus) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Programme Type *</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <select
                    required
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setProgramme('');
                    }}
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

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Programme / Degree (Vellore) *
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
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
              <label className="block text-xs font-bold text-stone-700 mb-1">Academic Year / Semester *</label>
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
                <p className="text-[10px] text-[#9D0208] font-bold mt-1">
                  ✓ Integrated M.Tech selected — 5th Year (Semesters IX & X) available.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9D0208] focus:border-[#9D0208] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2"
              disabled={isLoading || !isEmailVerified}
              icon={isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            >
              {isLoading
                ? 'Creating Account...'
                : !isEmailVerified
                ? 'Verify Email to Register'
                : 'Complete Registration'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-500">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#9D0208] hover:text-[#DC2F02]">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
