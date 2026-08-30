import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles, DollarSign, TrendingUp, PackageCheck, Zap, Copy, CheckCheck, Users } from 'lucide-react';

export const AffiliateSection: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText('https://ilovesurprises.com/rep/sparkle');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="affiliate" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-hidden">
      
      {/* State-of-the-Art Partner & Earn Portal Card */}
      <div className="relative rounded-[24px] sm:rounded-[30px] border border-[#ebd2e2] bg-gradient-to-br from-[#fff2f7] via-[#fffafc] to-[#fbf5ff] p-5 sm:p-7 lg:p-8 shadow-[0_16px_45px_rgba(50,31,63,0.08)] overflow-hidden">
        
        {/* Soft Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#ec2f73]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Column: Partnership Program Details & Perks */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-start z-10 w-full">
            
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#ec2f73]/10 text-[#ec2f73] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Partner & Earn</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#141219] tracking-tight leading-snug hero-title-font m-0 mb-2">
              Earn 20% Commission with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec2f73] via-[#ff3b83] to-[#d92467]">
                I Love Surprises
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm lg:text-[14px] text-[#55505a] leading-relaxed max-w-xl m-0 mb-4 font-medium">
              Share viral cash candles & jewelry reveal surprises with your personal vanity link. Earn <strong className="text-[#141219] font-black">20% direct retail commission</strong> plus 5 levels of sponsor team overrides (<strong className="text-[#ec2f73] font-black">5%, 4%, 3%, 2%, 1%</strong>).
            </p>

            {/* 4 Representative Advantage Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mb-4">
              
              <div className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-white/95 backdrop-blur-xs border border-[#f0e2ec] shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <DollarSign className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-xs font-black text-[#141219] truncate">20% Direct Commission</strong>
                  <span className="text-[10px] text-[#716d77] truncate block">Instant tracking on every retail order</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-white/95 backdrop-blur-xs border border-[#f0e2ec] shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-xs font-black text-[#141219] truncate">5-Tier Sponsor Overrides</strong>
                  <span className="text-[10px] text-[#716d77] truncate block">5%, 4%, 3%, 2%, 1% team bonuses</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-white/95 backdrop-blur-xs border border-[#f0e2ec] shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-[#ec2f73] flex items-center justify-center shrink-0">
                  <PackageCheck className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-xs font-black text-[#141219] truncate">Zero Inventory Required</strong>
                  <span className="text-[10px] text-[#716d77] truncate block">We pack, ship & deliver nationwide</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-white/95 backdrop-blur-xs border border-[#f0e2ec] shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <strong className="block text-xs font-black text-[#141219] truncate">Weekly Automated Payouts</strong>
                  <span className="text-[10px] text-[#716d77] truncate block">Direct deposit to Bank or PayPal</span>
                </div>
              </div>

            </div>

            {/* Simulated Vanity Link Pill */}
            <div className="w-full max-w-lg mb-5 p-1.5 rounded-[14px] bg-white border border-[#ebdce5] flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 px-2 min-w-0 overflow-hidden">
                <span className="text-[9px] font-black uppercase text-[#ec2f73] bg-[#fff0f5] px-2 py-0.5 rounded-full shrink-0">
                  Your Link
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-[#141219] truncate font-mono">
                  ilovesurprises.com/rep/<span className="text-[#ec2f73]">yourname</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="h-[28px] sm:h-[30px] px-3 rounded-[9px] bg-[#fff3f7] hover:bg-[#ec2f73] text-[#ec2f73] hover:text-white border border-[#f5cad7] hover:border-[#ec2f73] text-[10px] sm:text-[11px] font-black uppercase flex items-center gap-1 transition-all duration-200 cursor-pointer shrink-0"
              >
                {copied ? <CheckCheck className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#featured"
                className="group inline-flex items-center justify-center gap-2 h-[42px] sm:h-[44px] px-6 rounded-[13px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(236,47,115,0.28)] hover:shadow-[0_12px_28px_rgba(236,47,115,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Join as a Representative</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>

              <a
                href="#featured"
                className="text-xs font-bold text-[#716d77] hover:text-[#ec2f73] transition-colors py-1.5 px-2 hover:underline"
              >
                View Full Compensation Plan →
              </a>
            </div>

          </div>

          {/* Right Column: Perfectly Proportioned 1:1 Representative Community Visual */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-[310px] sm:max-w-[330px] rounded-[22px] overflow-hidden border border-[#eedbe6] bg-white p-3 shadow-[0_12px_32px_rgba(50,31,63,0.08)] group flex flex-col justify-between isolate">
              
              {/* 1:1 Aspect Ratio Container - 100% Proportional Fit with Zero Overflow */}
              <div className="relative w-full aspect-square rounded-[16px] overflow-hidden bg-stone-50">
                <img
                  src="/assets/ilovesurprises/affiliate/WhatsApp_Image_2026-08-19_at_3.42.29_PM_1.jpg"
                  alt="I Love Surprises Representative Community"
                  className="w-full h-full object-cover rounded-[16px] transition-transform duration-500 group-hover:scale-104 will-change-transform"
                  loading="lazy"
                />

                {/* Floating Top Badge: Weekly Payout */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-emerald-200 shadow-xs text-[9px] sm:text-[10px] font-black text-emerald-800 pointer-events-none">
                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  <span>Weekly Direct Deposit</span>
                </div>

                {/* Floating Bottom Badge: Overrides */}
                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-[#f5cad7] shadow-xs text-[9px] sm:text-[10px] font-black text-[#ec2f73] pointer-events-none">
                  <Sparkles className="w-3 h-3 text-[#ec2f73]" />
                  <span>5-Level Overrides</span>
                </div>
              </div>

              {/* Bottom Information Card */}
              <div className="mt-2.5 pt-2 border-t border-[#f4edf2] flex items-center justify-between text-left">
                <div className="min-w-0 pr-2">
                  <strong className="block text-xs font-black text-[#141219] truncate">Top Reps Earn $1,200+/Mo</strong>
                  <span className="text-[10px] text-[#716d77] truncate block">Free store link & marketing toolkit</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-[#ec2f73] bg-[#fff0f5] px-2.5 py-1 rounded-full uppercase shrink-0">
                  Join Free
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
