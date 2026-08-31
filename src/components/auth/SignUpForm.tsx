import React, { useState } from 'react';
import { User, Mail, Phone, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import {
  authService,
  evaluatePasswordStrength,
  isValidEmail,
  isValidMobile,
} from '../../services/auth';
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
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    mobile?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await authService.register({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password,
        role,
        repUsername: role === 'representative' ? repUsername : undefined,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrors({ general: res.error || 'Registration failed. Please try again.' });
      }
    } catch {
      setErrors({ general: 'Network error. Please try again in a moment.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Centered Logo & Header */}
      <div className="text-center mb-4">
        <img
          src="/assets/ilovesurprises/logo/i love surprises logo.jpeg"
          alt="I Love Surprises Logo"
          className="h-10 sm:h-12 w-auto max-w-[180px] sm:max-w-[210px] mx-auto object-contain mb-2"
          loading="eager"
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

      {/* Account Type Toggle */}
      <div className="grid grid-cols-2 p-1 rounded-[13px] bg-[#fff0f5] border border-[#f5cad7] mb-3.5">
        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer ${
            role === 'customer'
              ? 'bg-white text-[#ec2f73] shadow-xs'
              : 'text-[#716d77] hover:text-[#141219]'
          }`}
        >
          Shopper VIP
        </button>
        <button
          type="button"
          onClick={() => setRole('representative')}
          className={`py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer ${
            role === 'representative'
              ? 'bg-white text-[#ec2f73] shadow-xs'
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
            Full Name <span className="text-[#ec2f73]">*</span>
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
              placeholder="e.g. Sarah Jenkins"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`w-full h-[40px] sm:h-[42px] pl-10 pr-3 rounded-[12px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${
                errors.name
                  ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                  : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#ec2f73] focus:bg-white focus:ring-2 focus:ring-[#ec2f73]/10'
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
            Email Address <span className="text-[#ec2f73]">*</span>
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
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`w-full h-[40px] sm:h-[42px] pl-10 pr-3 rounded-[12px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${
                errors.email
                  ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                  : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#ec2f73] focus:bg-white focus:ring-2 focus:ring-[#ec2f73]/10'
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
            Mobile Number <span className="text-[#ec2f73]">*</span>
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
              placeholder="e.g. 555-123-4567"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
              }}
              className={`w-full h-[40px] sm:h-[42px] pl-10 pr-3 rounded-[12px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${
                errors.mobile
                  ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                  : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#ec2f73] focus:bg-white focus:ring-2 focus:ring-[#ec2f73]/10'
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

        {/* Representative Handle if Rep selected */}
        {role === 'representative' && (
          <div>
            <label htmlFor="signup-rep" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
              Vanity URL Handle
            </label>
            <div className="flex items-center rounded-[12px] bg-[#fffafb] border border-[#ebdce5] focus-within:border-[#ec2f73] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ec2f73]/10 overflow-hidden">
              <span className="px-2.5 py-2 text-[10px] font-mono text-[#716d77] bg-stone-100 border-r border-[#ebdce5] select-none">
                ilovesurprises.com/rep/
              </span>
              <input
                id="signup-rep"
                type="text"
                placeholder="yourname"
                value={repUsername}
                onChange={(e) => setRepUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                className="w-full h-[38px] px-2.5 bg-transparent text-xs font-bold text-[#ec2f73] outline-none font-mono"
              />
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
          className="w-full h-[44px] sm:h-[46px] rounded-[14px] bg-gradient-to-r from-[#ec2f73] to-[#d92467] hover:from-[#d92467] hover:to-[#c21a57] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_22px_rgba(236,47,115,0.28)] hover:shadow-[0_12px_28px_rgba(236,47,115,0.38)] active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-3.5"
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
            className="text-xs font-black text-[#ec2f73] hover:underline focus:outline-none cursor-pointer ml-1"
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
