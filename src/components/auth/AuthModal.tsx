import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, Sparkles, ArrowRight, Eye, EyeOff, ShieldCheck, Check, DollarSign } from 'lucide-react';
import type { UserProfile } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<'customer' | 'representative'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repUsername, setRepUsername] = useState('');
  const [referralCode] = useState('sparkle');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  if (typeof document === 'undefined' || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const authenticatedUser: UserProfile = {
        id: 'usr-' + Date.now(),
        name: name || (role === 'representative' ? 'Sparkle Rep' : email.split('@')[0] || 'Surprise Fan'),
        email: email || 'user@ilovesurprises.com',
        role: role,
        repUsername: role === 'representative' ? (repUsername || 'sparkle') : undefined,
        avatar: '/assets/ilovesurprises/reviews/WhatsApp_Image_2026-08-19_at_3.42.29_PM.jpg',
      };
      onSuccess(authenticatedUser);
      onClose();
    }, 600);
  };

  const handleQuickDemo = (demoRole: 'customer' | 'representative') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const authenticatedUser: UserProfile = {
        id: 'usr-demo-' + Date.now(),
        name: demoRole === 'representative' ? 'Sarah Jenkins (Top Rep)' : 'Emma Watson (VIP Member)',
        email: demoRole === 'representative' ? 'sarah@ilovesurprises.com' : 'emma@gmail.com',
        role: demoRole,
        repUsername: demoRole === 'representative' ? 'sarahrep' : undefined,
        avatar: '/assets/ilovesurprises/reviews/WhatsApp_Image_2026-08-19_at_3.42.29_PM.jpg',
      };
      onSuccess(authenticatedUser);
      onClose();
    }, 400);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-y-auto p-3 sm:p-4">
      
      {/* Backdrop with Smooth Fade-in */}
      <div
        className="fixed inset-0 bg-[#141219]/60 backdrop-blur-xs transition-opacity duration-300 ease-out animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering Wrapper to Prevent Top/Bottom Mobile Clipping */}
      <div className="min-h-full flex items-center justify-center py-2 sm:py-6 relative z-10 pointer-events-auto">
        
        {/* Auth Card Container with Smooth Zoom & Slide Elevation */}
        <div className="relative w-full max-w-[460px] rounded-[24px] sm:rounded-[28px] bg-white border border-[#eedbe6] p-4 sm:p-6 shadow-[0_20px_50px_rgba(50,31,63,0.22)] z-10 overflow-hidden isolate my-auto animate-in fade-in zoom-in-95 duration-300 ease-out">
          
          {/* Soft Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#ec2f73]/12 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#9333ea]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-stone-100 hover:bg-[#fff0f5] text-[#716d77] hover:text-[#ec2f73] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs z-20"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Logo & Header */}
          <div className="text-center mb-3.5 sm:mb-4">
            <picture className="inline-block mb-2">
              <source srcSet="/assets/ilovesurprises/logo/2_Horizontal_LOGO_I-Love-Surprises_JC.avif" type="image/avif" />
              <img
                src="/assets/ilovesurprises/logo/Layer_4_d788fddc-1d27-4110-805e-8ec512991c7d.png"
                alt="I Love Surprises Logo"
                className="h-7 sm:h-8 w-auto max-w-[155px] mx-auto object-contain"
              />
            </picture>

            <h2 className="text-lg sm:text-2xl font-black text-[#141219] tracking-tight m-0 hero-title-font">
              {mode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
            </h2>
            <p className="text-[11px] sm:text-xs text-[#716d77] mt-0.5 m-0 leading-snug">
              {mode === 'login'
                ? 'Sign in to access your surprise orders, prize reveals & wishlist'
                : 'Join the VIP surprise community & claim instant 15% discount'}
            </p>
          </div>

          {/* Toggle Mode: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 p-1 rounded-[13px] bg-[#fff0f5] border border-[#f5cad7] mb-3">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-1.5 sm:py-2 rounded-[10px] text-xs font-black transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#ec2f73] shadow-xs'
                  : 'text-[#716d77] hover:text-[#141219]'
              }`}
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`py-1.5 sm:py-2 rounded-[10px] text-xs font-black transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#ec2f73] shadow-xs'
                  : 'text-[#716d77] hover:text-[#141219]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Account Type Selector (Customer vs Representative) */}
          <div className="mb-3">
            <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#8a858f] mb-1">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`p-2 sm:p-2.5 rounded-[13px] border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  role === 'customer'
                    ? 'bg-white border-[#ec2f73] ring-2 ring-[#ec2f73]/15 text-[#141219] shadow-2xs'
                    : 'bg-stone-50/70 border-[#eee7ed] text-[#716d77] hover:border-[#ec2f73]/40'
                }`}
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${role === 'customer' ? 'bg-[#fff0f5] text-[#ec2f73]' : 'bg-stone-200 text-stone-600'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-[11px] sm:text-xs font-bold leading-tight truncate">Shopper / VIP</strong>
                  <span className="text-[9px] sm:text-[10px] text-[#716d77] block truncate">Prizes & tracking</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('representative')}
                className={`p-2 sm:p-2.5 rounded-[13px] border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  role === 'representative'
                    ? 'bg-white border-[#ec2f73] ring-2 ring-[#ec2f73]/15 text-[#141219] shadow-2xs'
                    : 'bg-stone-50/70 border-[#eee7ed] text-[#716d77] hover:border-[#ec2f73]/40'
                }`}
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ${role === 'representative' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                  <DollarSign className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-[11px] sm:text-xs font-bold leading-tight truncate">Representative</strong>
                  <span className="text-[9px] sm:text-[10px] text-emerald-700 font-extrabold block truncate">20% commission</span>
                </div>
              </button>

            </div>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
            
            {/* Full Name (Only on Sign Up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-[#141219] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-[40px] sm:h-[44px] pl-9 sm:pl-10 pr-3 rounded-[12px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#ec2f73] focus:bg-white focus:ring-3 focus:ring-[#ec2f73]/10 text-xs text-[#141219] outline-none transition-all"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-[#141219] mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[40px] sm:h-[44px] pl-9 sm:pl-10 pr-3 rounded-[12px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#ec2f73] focus:bg-white focus:ring-3 focus:ring-[#ec2f73]/10 text-xs text-[#141219] outline-none transition-all"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
              </div>
            </div>

            {/* Representative Vanity Username (Only on Rep Sign Up) */}
            {mode === 'signup' && role === 'representative' && (
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-[#141219] mb-1">
                  Store Vanity URL Handle
                </label>
                <div className="flex items-center rounded-[12px] bg-[#fffafb] border border-[#e8dfe5] focus-within:border-[#ec2f73] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#ec2f73]/10 overflow-hidden transition-all">
                  <span className="px-2.5 py-2 text-[10px] sm:text-[11px] font-mono text-[#716d77] bg-stone-100/90 border-r border-[#e8dfe5] shrink-0 select-none">
                    /rep/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="yourname"
                    value={repUsername}
                    onChange={(e) => setRepUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="w-full h-[40px] sm:h-[44px] px-3 bg-transparent text-xs font-bold text-[#ec2f73] outline-none font-mono"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] sm:text-[11px] font-bold text-[#141219]">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('A password reset link has been sent to your email.')}
                    className="text-[10px] text-[#ec2f73] font-bold hover:underline cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[40px] sm:h-[44px] pl-9 sm:pl-10 pr-9 sm:pr-10 rounded-[12px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#ec2f73] focus:bg-white focus:ring-3 focus:ring-[#ec2f73]/10 text-xs text-[#141219] outline-none transition-all"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a858f] hover:text-[#141219] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sponsor Code (Sign Up) */}
            {mode === 'signup' && (
              <div className="pt-0.5">
                <div className="p-2 rounded-[11px] bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <div className="flex items-center gap-1 text-emerald-800 truncate">
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
                    <span className="truncate">Sponsor: <strong>{referralCode}</strong></span>
                  </div>
                  <span className="text-[9px] font-black text-emerald-700 uppercase bg-white px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 ml-1">
                    20% Perk Ready
                  </span>
                </div>
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs pt-0.5">
              <label className="flex items-center gap-1.5 text-[#55505a] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#ec2f73] focus:ring-[#ec2f73] accent-[#ec2f73]"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[42px] sm:h-[46px] rounded-[13px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(236,47,115,0.28)] hover:shadow-[0_12px_28px_rgba(236,47,115,0.42)] active:scale-97 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2.5 sm:mt-3.5"
            >
              {isLoading ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Account' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo 1-Click Login Shortcuts for Easy Testing */}
          <div className="mt-3 pt-2.5 border-t border-[#f2edf1]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#8a858f]">
                ⚡ Instant 1-Click Demo Login
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('customer')}
                className="px-2 py-1.5 rounded-[10px] bg-stone-100 hover:bg-[#fff0f5] text-[#141219] hover:text-[#ec2f73] border border-stone-200 hover:border-[#f5cad7] text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
              >
                <Sparkles className="w-3 h-3 text-[#ec2f73] shrink-0" />
                <span className="truncate">Demo VIP Shopper</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('representative')}
                className="px-2 py-1.5 rounded-[10px] bg-stone-100 hover:bg-emerald-50 text-[#141219] hover:text-emerald-800 border border-stone-200 hover:border-emerald-200 text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer truncate"
              >
                <DollarSign className="w-3 h-3 text-emerald-600 stroke-[3] shrink-0" />
                <span className="truncate">Demo 20% Rep</span>
              </button>
            </div>
          </div>

          {/* Footer Guarantee */}
          <div className="mt-2.5 text-center text-[9px] sm:text-[10px] text-[#8a858f] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>256-Bit SSL Encrypted & Protected Privacy</span>
          </div>

        </div>

      </div>

    </div>,
    document.body
  );
};
