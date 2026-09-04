import React, { useState } from 'react';
import { Mail, Phone, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { authService, isValidEmailOrMobile } from '../../services/auth';
import type { UserProfile } from '../../types';

interface LoginFormProps {
  onSuccess: (user: UserProfile) => void;
  onSwitchToSignUp: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignUp,
  onSwitchToForgotPassword,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const isPhone = /^\+?\d+$/.test(identifier.trim().replace(/[\s-()]/g, '')) && !identifier.includes('@');

  const validate = (): boolean => {
    const newErrors: { identifier?: string; password?: string; general?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Please enter your email or mobile number.';
    } else if (!isValidEmailOrMobile(identifier)) {
      newErrors.identifier = 'Please enter a valid email address or 10-digit mobile number.';
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
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
      const res = await authService.login({
        identifier: identifier.trim(),
        password,
        rememberMe,
      });

      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrors({ general: res.error || 'Unable to sign in. Please verify your credentials.' });
      }
    } catch {
      setErrors({ general: 'Network error. Please try again in a moment.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Centered Logo & Welcome Header */}
      <div className="text-center mb-5">
        <img
          src="/assets/ilovesurprises/logo/New logo.jpeg"
          alt="I Love Surprises Logo"
          className="h-[49px] sm:h-[57px] w-auto max-w-[225px] sm:max-w-[265px] mx-auto object-contain mb-3"
          loading="eager"
        />
        <h2 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight m-0 font-display">
          Welcome Back
        </h2>
        <p className="text-xs text-[#716d77] mt-1 m-0">
          Login to continue shopping and manage your orders
        </p>
      </div>

      {/* General Error Banner */}
      {errors.general && (
        <div className="mb-4 p-3 rounded-[13px] bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {/* Mobile Number / Email */}
        <div>
          <label htmlFor="login-identifier" className="block text-[11px] sm:text-xs font-bold text-[#141219] mb-1">
            Mobile Number / Email <span className="text-[#D30915]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a858f] pointer-events-none">
              {isPhone ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
            </div>
            <input
              id="login-identifier"
              type="text"
              name="identifier"
              autoComplete="username"
              required
              disabled={isLoading}
              placeholder="Enter email or mobile number"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
              }}
              className={`w-full h-[42px] sm:h-[44px] pl-10 pr-3 rounded-[13px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 ${errors.identifier
                ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#D30915] focus:bg-white focus:ring-2 focus:ring-[#D30915]/10'
                }`}
              aria-invalid={!!errors.identifier}
              aria-describedby={errors.identifier ? 'login-identifier-error' : undefined}
            />
          </div>
          {errors.identifier && (
            <p id="login-identifier-error" className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
              <span>⚠️</span>
              <span>{errors.identifier}</span>
            </p>
          )}
        </div>

        {/* Password with Show/Hide & Forgot Password */}
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          required
          disabled={isLoading}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          rightAction={
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-[11px] font-bold text-[#D30915] hover:underline focus:outline-none cursor-pointer"
            >
              Forgot Password?
            </button>
          }
        />

        {/* Remember Me */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 text-[#55505a] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#D30915] focus:ring-[#D30915] accent-[#D30915]"
            />
            <span className="text-[11px] sm:text-xs font-medium">Remember me on this device</span>
          </label>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[44px] sm:h-[46px] rounded-[14px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#c21a57] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_22px_rgba(211, 9, 21,0.28)] hover:shadow-[0_12px_28px_rgba(211, 9, 21,0.38)] active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Logging in...</span>
            </div>
          ) : (
            <>
              <span>LOGIN</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Sign Up */}
      <div className="mt-5 pt-4 border-t border-[#f2edf1] text-center">
        <p className="text-xs text-[#716d77] m-0">
          New to ILoveSurprises?{' '}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-xs font-black text-[#D30915] hover:underline focus:outline-none cursor-pointer ml-1"
          >
            Create Account
          </button>
        </p>
      </div>

      {/* Security Trust Note */}
      <div className="mt-3 text-center text-[10px] text-[#8a858f] flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>256-Bit SSL Encrypted & Protected Privacy</span>
      </div>
    </div>
  );
};
