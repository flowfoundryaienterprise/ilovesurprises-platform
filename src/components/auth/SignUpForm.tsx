import React, { useState } from 'react';
import { User, Mail, Phone, ArrowRight, AlertCircle, ShieldCheck, CheckCircle2, RefreshCw, Users, Link2 } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { GoogleIcon } from './GoogleIcon';
import {
  authService,
  evaluatePasswordStrength,
  isValidEmail,
  isValidMobile,
} from '../../services/auth';
import { sponsorService } from '../../services/sponsorService';
import type { UserProfile } from '../../types';

interface SignUpFormProps {
  onSuccess: (user: UserProfile) => void;
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'representative'>('customer');
  const [repUsername, setRepUsername] = useState('');
  const [sponsorUsername, setSponsorUsername] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paramSponsor = urlParams.get('rep') || urlParams.get('ref') || urlParams.get('sponsor');
      if (paramSponsor) return sponsorService.normalizeUsername(paramSponsor);
      try {
        const stored = localStorage.getItem('ilovesurprises_attributed_rep_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.repUsername) return sponsorService.normalizeUsername(parsed.repUsername);
        }
      } catch {
        // ignore
      }
    }
    return '';
  });
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    mobile?: string;
    password?: string;
    confirmPassword?: string;
    repUsername?: string;
    sponsorUsername?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrors({});
    try {
      const res = await authService.loginWithGoogle();
      if (!res.success) {
        setErrors({ general: res.error || 'Failed to initialize Google sign-up. Please try again.' });
        setIsGoogleLoading(false);
      }
    } catch {
      setErrors({ general: 'Network error occurred while connecting with Google.' });
      setIsGoogleLoading(false);
    }
  };

  const passwordStrength = evaluatePasswordStrength(password);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required.';
    } else if (!isValidMobile(mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (role === 'representative') {
      if (!repUsername.trim()) {
        newErrors.repUsername = 'Please choose a representative handle.';
      } else {
        const normalizedRep = sponsorService.normalizeUsername(repUsername);
        const validation = sponsorService.validateUsername(normalizedRep);
        if (!validation.valid) {
          newErrors.repUsername = validation.error;
        } else if (sponsorUsername.trim()) {
          const normalizedSponsor = sponsorService.normalizeUsername(sponsorUsername);
          if (normalizedSponsor === normalizedRep) {
            newErrors.sponsorUsername = 'You cannot sponsor yourself.';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await authService.register({
        name: name.trim(),
        email: cleanEmail,
        mobile: mobile.trim(),
        password,
        role,
        repUsername: role === 'representative' ? sponsorService.normalizeUsername(repUsername) : undefined,
        sponsorUsername: role === 'representative' && sponsorUsername.trim() ? sponsorService.normalizeUsername(sponsorUsername) : undefined,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else if (res.success && res.requiresVerification) {
        setVerificationSentEmail(cleanEmail);
      } else {
        setErrors({ general: res.error || 'Registration failed. Please try again.' });
      }
    } catch {
      setErrors({ general: 'Network error. Please try again in a moment.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationSentEmail || isResending) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification(verificationSentEmail);
      if (res.success) {
        setResendStatus('A new verification email has been sent. Please check your inbox!');
      } else {
        setResendStatus(res.error || 'Failed to resend. Please try again shortly.');
      }
    } catch {
      setResendStatus('Network error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (verificationSentEmail) {
    return (
      <div className="w-full text-center py-3 space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <img
          src="/assets/ilovesurprises/logo/logo-16k.png"
          alt="I Love Surprises Logo"
          width={8192}
          height={2728}
          className="h-[42px] sm:h-[50px] w-auto max-w-[195px] sm:max-w-[230px] mx-auto object-contain mb-2"
        />

        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <Mail className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div>
          <span className="inline-block text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
            Verification Required
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight m-0 font-display">
            Check Your Inbox
          </h2>
          <p className="text-xs text-[#55505a] mt-2 leading-relaxed max-w-xs mx-auto font-medium">
            We've sent a verification link to <strong className="text-[#141219]">{verificationSentEmail}</strong>.
            Please click the link in your email to verify your account before logging in.
          </p>
        </div>

        {resendStatus && (
          <div className="p-3 rounded-[13px] bg-[#fff1f2] border border-[#fecdd3] text-xs font-bold text-[#D30915] text-left flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{resendStatus}</span>
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full h-[44px] rounded-[13px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full h-[40px] rounded-[13px] bg-white border border-[#e8dfe5] hover:border-[#D30915] text-[#716d77] hover:text-[#D30915] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Resending Link...</span>
              </>
            ) : (
              <span>Resend Verification Email</span>
            )}
          </button>
        </div>

        <div className="pt-2 text-[10px] text-[#8a858f] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Unverified accounts cannot access order tracking or VIP discounts</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Centered Logo & Header */}
      <div className="text-center mb-4">
        <img
          src="/assets/ilovesurprises/logo/logo-16k.png"
          alt="I Love Surprises Logo"
          width={8192}
          height={2728}
          className="h-[42px] min-[360px]:h-[46px] min-[390px]:h-[50px] min-[420px]:h-[52px] sm:h-[57px] w-auto max-w-[170px] min-[360px]:max-w-[195px] min-[390px]:max-w-[215px] min-[420px]:max-w-[230px] sm:max-w-[265px] mx-auto object-contain mb-2.5"
          loading="eager"
          style={{
            imageRendering: '-webkit-optimize-contrast',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
        />
        <h2 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight m-0 font-display">
          Create your account
        </h2>
        <p className="text-xs text-[#716d77] mt-1 m-0">
          Join for instant 15% off and surprise prize reveals
        </p>
      </div>

      {/* General Error Banner */}
      {errors.general && (
        <div className="mb-3.5 p-3 rounded-[13px] bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isLoading || isGoogleLoading}
        className="w-full h-[42px] sm:h-[44px] rounded-[13px] bg-white hover:bg-stone-50 border border-[#e5dfe5] hover:border-[#cfc6d0] text-[#141219] text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-98 mb-3"
        aria-label="Continue with Google"
      >
        {isGoogleLoading ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#716d77]">
            <span className="w-4 h-4 border-2 border-[#D30915] border-t-transparent rounded-full animate-spin" />
            <span>Connecting to Google...</span>
          </div>
        ) : (
          <>
            <GoogleIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-3 flex items-center justify-center">
        <div className="border-t border-[#ebdce5] w-full" />
        <span className="bg-white px-2.5 text-[10px] sm:text-[11px] font-bold text-[#8a858f] uppercase tracking-wider shrink-0">
          or register with email
        </span>
      </div>

      {/* Account Type Toggle */}
      <div className="grid grid-cols-2 p-1 rounded-[13px] bg-[#fff1f2] border border-[#fecdd3] mb-3.5">
        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer ${role === 'customer'
            ? 'bg-white text-[#D30915] shadow-xs'
            : 'text-[#716d77] hover:text-[#141219]'
            }`}
        >
          Shopper VIP
        </button>
        <button
          type="button"
          onClick={() => setRole('representative')}
          className={`py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer ${role === 'representative'
            ? 'bg-white text-[#D30915] shadow-xs'
            : 'text-[#716d77] hover:text-[#141219]'
            }`}
        >
          20% Rep Affiliate
        </button>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {/* Full Name */}
        <div>
          <label htmlFor="signup-name" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
            Full Name <span className="text-[#D30915]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a858f] pointer-events-none">
              <User className="w-4 h-4" />
            </div>
            <input
              id="signup-name"
              type="text"
              name="name"
              required
              disabled={isLoading}
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`w-full h-[40px] sm:h-[42px] pl-10 pr-3 rounded-[12px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${errors.name
                ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#D30915] focus:bg-white focus:ring-2 focus:ring-[#D30915]/10'
                }`}
            />
          </div>
          {errors.name && (
            <p className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
              <span>⚠️</span>
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="signup-email" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
            Email Address <span className="text-[#D30915]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a858f] pointer-events-none">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              disabled={isLoading}
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`w-full h-[40px] sm:h-[42px] pl-10 pr-3 rounded-[12px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${errors.email
                ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#D30915] focus:bg-white focus:ring-2 focus:ring-[#D30915]/10'
                }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
              <span>⚠️</span>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label htmlFor="signup-mobile" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
            Mobile Number <span className="text-[#D30915]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a858f] pointer-events-none">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="signup-mobile"
              type="tel"
              name="mobile"
              autoComplete="tel"
              required
              disabled={isLoading}
              placeholder="e.g. (555) 000-0000"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
              }}
              className={`w-full h-[40px] sm:h-[42px] pl-10 pr-3 rounded-[12px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${errors.mobile
                ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#D30915] focus:bg-white focus:ring-2 focus:ring-[#D30915]/10'
                }`}
            />
          </div>
          {errors.mobile && (
            <p className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
              <span>⚠️</span>
              <span>{errors.mobile}</span>
            </p>
          )}
        </div>

        {/* Representative Handle & Sponsor if Rep selected */}
        {role === 'representative' && (
          <div className="p-3 rounded-[13px] bg-[#fff5f6] border border-[#fecdd3] space-y-3">
            <div>
              <label htmlFor="signup-rep" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
                Unique Vanity URL Handle <span className="text-[#D30915]">*</span>
              </label>
              <div
                className={`flex items-center rounded-[12px] bg-white border overflow-hidden transition-all ${
                  errors.repUsername
                    ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100'
                    : 'border-[#ebdce5] focus-within:border-[#D30915] focus-within:ring-2 focus-within:ring-[#D30915]/10'
                }`}
              >
                <span className="px-2.5 py-2 text-[10px] font-mono text-[#716d77] bg-stone-100 border-r border-[#ebdce5] select-none shrink-0 flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-[#D30915]" />
                  <span>ilovesurprises.com/rep/</span>
                </span>
                <input
                  id="signup-rep"
                  type="text"
                  placeholder="your_handle"
                  value={repUsername}
                  onChange={(e) => {
                    setRepUsername(sponsorService.normalizeUsername(e.target.value));
                    if (errors.repUsername) setErrors((prev) => ({ ...prev, repUsername: undefined }));
                  }}
                  className="w-full h-[38px] px-2.5 bg-transparent text-xs font-bold text-[#D30915] outline-none font-mono"
                />
              </div>
              {errors.repUsername ? (
                <p className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{errors.repUsername}</span>
                </p>
              ) : (
                <p className="text-[10px] text-[#716d77] mt-1 font-medium">
                  3–30 characters, letters, numbers, and underscores only.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="signup-sponsor" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
                Sponsor / Referrer Handle <span className="text-[10px] font-normal text-[#8a858f]">(Optional)</span>
              </label>
              <div
                className={`flex items-center rounded-[12px] bg-white border overflow-hidden transition-all ${
                  errors.sponsorUsername
                    ? 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100'
                    : 'border-[#ebdce5] focus-within:border-[#D30915] focus-within:ring-2 focus-within:ring-[#D30915]/10'
                }`}
              >
                <span className="px-2.5 py-2 text-[10px] font-mono text-[#716d77] bg-stone-100 border-r border-[#ebdce5] select-none shrink-0 flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#716d77]" />
                  <span>@</span>
                </span>
                <input
                  id="signup-sponsor"
                  type="text"
                  placeholder="sponsor_username"
                  value={sponsorUsername}
                  onChange={(e) => {
                    setSponsorUsername(sponsorService.normalizeUsername(e.target.value));
                    if (errors.sponsorUsername) setErrors((prev) => ({ ...prev, sponsorUsername: undefined }));
                  }}
                  className="w-full h-[38px] px-2.5 bg-transparent text-xs font-bold text-[#141219] outline-none font-mono"
                />
              </div>
              {errors.sponsorUsername ? (
                <p className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{errors.sponsorUsername}</span>
                </p>
              ) : (
                <p className="text-[10px] text-[#716d77] mt-1 font-medium">
                  Enter the handle of the representative who invited you to connect your 5-level upline tree.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Password */}
        <div>
          <PasswordInput
            id="signup-password"
            name="password"
            label="Password"
            required
            disabled={isLoading}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <div className="mt-1.5 px-0.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#716d77] mb-1">
                <span>Password strength</span>
                <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${passwordStrength.percentage}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <PasswordInput
          id="signup-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          required
          disabled={isLoading}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
        />

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[44px] sm:h-[46px] rounded-[14px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96050e] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_22px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-3.5"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            <>
              <span>CREATE ACCOUNT</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-4 pt-3.5 border-t border-[#f2edf1] text-center">
        <p className="text-xs text-[#716d77] m-0">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs font-black text-[#D30915] hover:text-[#B60711] hover:underline focus:outline-none cursor-pointer ml-1 active:scale-95 transition-all"
          >
            Login
          </button>
        </p>
      </div>

      {/* Security Trust Note */}
      <div className="mt-3 text-center text-[10px] text-[#8a858f] flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Your data is protected under 256-Bit SSL Encryption</span>
      </div>
    </div>
  );
};
