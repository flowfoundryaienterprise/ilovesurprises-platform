import React from 'react';
import { User, Check, Sparkles, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';

export const AffiliateSection: React.FC = () => {
  return (
    <section id="affiliate" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-6 sm:py-9">
      {/* Luxury Affiliate Showcase Card */}
      <div className="relative rounded-[28px] sm:rounded-[32px] border border-[#f1dbe8] bg-[radial-gradient(circle_at_80%_25%,rgba(255,203,222,0.45),transparent_40%),linear-gradient(120deg,#fffafb_0%,#fff5f8_50%,#fcf8ff_100%)] p-6 sm:p-10 lg:p-12 shadow-[0_20px_50px_rgba(50,31,63,0.07)] overflow-hidden">
        
        {/* Soft Ambient Radial Backlight */}
        <div className="absolute -top-10 right-1/4 w-[420px] h-[420px] bg-[#ec2f73]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Program Headline, Key Highlights & CTAs */}
          <div className="lg:col-span-5 flex flex-col items-start text-left z-10">
            
            {/* Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fff0f5] border border-[#f5cad7] text-[#ec2f73] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#ec2f73] animate-pulse" />
              <span>Affiliate Program</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#141219] leading-[1.06] tracking-tight m-0 mb-3 font-display">
              Earn More with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec2f73] via-[#ff3b83] to-[#d92467]">
                I Love Surprises
              </span>
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#55505a] leading-[1.65] m-0 mb-5 font-medium">
              Sell products and earn 20%. Refer other reps and earn from customer sales through five sponsor levels.
            </p>

            {/* Checkmark Perks List */}
            <div className="space-y-2.5 mb-6 w-full text-xs sm:text-[13px] text-[#2c2830] font-bold">
              <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-white/70 border border-[#f5e4ee] shadow-2xs hover:bg-white hover:border-[#f1b8cb] transition-all">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span><strong className="text-emerald-700">20%</strong> on your personal customer sales</span>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-white/70 border border-[#f5e4ee] shadow-2xs hover:bg-white hover:border-[#f1b8cb] transition-all">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span><strong className="text-[#141219]">5%</strong> on Level 1 customer sales</span>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-white/70 border border-[#f5e4ee] shadow-2xs hover:bg-white hover:border-[#f1b8cb] transition-all">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span><strong className="text-[#141219]">4%</strong> on Level 2</span>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-white/70 border border-[#f5e4ee] shadow-2xs hover:bg-white hover:border-[#f1b8cb] transition-all">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span><strong className="text-[#141219]">3%</strong> on Level 3</span>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-white/70 border border-[#f5e4ee] shadow-2xs hover:bg-white hover:border-[#f1b8cb] transition-all">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span><strong className="text-[#141219]">2%</strong> on Level 4</span>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-white/70 border border-[#f5e4ee] shadow-2xs hover:bg-white hover:border-[#f1b8cb] transition-all">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span><strong className="text-[#141219]">1%</strong> on Level 5</span>
              </div>

              {/* Maximum Total Payout Pill */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-gradient-to-r from-[#fff0f5] to-[#ffeef4] border border-[#f5cad7] shadow-2xs text-[#ec2f73]">
                <div className="w-5 h-5 rounded-full bg-[#ec2f73] text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="font-black text-[13px]">Maximum total payout: 35%</span>
              </div>
            </div>

            {/* CTAs with Smooth Hover States */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <a
                href="#join"
                className="group inline-flex items-center justify-center gap-2 min-h-[48px] px-7 rounded-[14px] bg-gradient-to-r from-[#ec2f73] to-[#d92467] hover:from-[#d92467] hover:to-[#c21a57] text-white font-black text-xs sm:text-[13px] uppercase tracking-wider shadow-[0_10px_26px_rgba(236,47,115,0.28)] hover:shadow-[0_14px_32px_rgba(236,47,115,0.40)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <span>Join Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="#commission"
                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[14px] bg-white hover:bg-[#fff9fb] border border-[#e8dfe5] hover:border-[#ec2f73] text-[#141219] hover:text-[#ec2f73] font-bold text-xs sm:text-[13px] shadow-2xs hover:shadow-[0_6px_18px_rgba(50,31,63,0.06)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                See Commission Plan
              </a>
            </div>

          </div>

          {/* Middle Column: Commission Structure Table Card */}
          <div id="commission" className="lg:col-span-4 z-10">
            <div className="rounded-[24px] bg-white border border-[#ebdce5] p-5 sm:p-7 shadow-[0_14px_36px_rgba(50,31,63,0.07)] hover:shadow-[0_18px_45px_rgba(50,31,63,0.11)] transition-all duration-300">
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f2e6ee]">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#141219]">
                  <DollarSign className="w-4 h-4 text-[#ec2f73]" />
                  <span>Commission Structure</span>
                </div>
                <span className="text-[10px] font-black text-[#ec2f73] bg-[#fff0f5] px-2 py-0.5 rounded-full border border-[#f5cad7]">
                  Up to 35%
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm font-medium">
                
                {/* Personal Sales */}
                <div className="flex items-center justify-between p-2 rounded-[10px] bg-[#fffafc] border border-[#f7ecf2] hover:bg-[#fff0f5] hover:border-[#f5cad7] transition-all">
                  <span className="font-bold text-[#141219]">Personal Sales</span>
                  <strong className="text-emerald-700 font-black text-sm sm:text-base bg-emerald-50 px-2.5 py-0.5 rounded-[8px] border border-emerald-200">
                    20%
                  </strong>
                </div>

                {/* Level 1 */}
                <div className="flex items-center justify-between p-1.5 px-2.5 rounded-[8px] hover:bg-[#fffafc] transition-all">
                  <span className="text-[#55505a]">Level 1</span>
                  <strong className="text-[#141219] font-black">5%</strong>
                </div>

                {/* Level 2 */}
                <div className="flex items-center justify-between p-1.5 px-2.5 rounded-[8px] hover:bg-[#fffafc] transition-all">
                  <span className="text-[#55505a]">Level 2</span>
                  <strong className="text-[#141219] font-black">4%</strong>
                </div>

                {/* Level 3 */}
                <div className="flex items-center justify-between p-1.5 px-2.5 rounded-[8px] hover:bg-[#fffafc] transition-all">
                  <span className="text-[#55505a]">Level 3</span>
                  <strong className="text-[#141219] font-black">3%</strong>
                </div>

                {/* Level 4 */}
                <div className="flex items-center justify-between p-1.5 px-2.5 rounded-[8px] hover:bg-[#fffafc] transition-all">
                  <span className="text-[#55505a]">Level 4</span>
                  <strong className="text-[#141219] font-black">2%</strong>
                </div>

                {/* Level 5 */}
                <div className="flex items-center justify-between p-1.5 px-2.5 rounded-[8px] hover:bg-[#fffafc] transition-all">
                  <span className="text-[#55505a]">Level 5</span>
                  <strong className="text-[#141219] font-black">1%</strong>
                </div>

                {/* Maximum Total Payout Highlight */}
                <div className="flex items-center justify-between p-3 rounded-[14px] bg-gradient-to-r from-[#fff0f5] to-[#ffeaf2] border border-[#f5cad7] shadow-xs mt-3">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#ec2f73]" />
                    <span className="text-xs font-black text-[#ec2f73] uppercase tracking-wide">
                      Maximum Total Payout
                    </span>
                  </div>
                  <strong className="text-[#ec2f73] font-black text-base sm:text-lg">
                    35%
                  </strong>
                </div>

              </div>

            </div>
          </div>

          {/* Right Column: 3D Tiered Rep Network Illustration */}
          <div className="lg:col-span-3 flex justify-center items-center z-10">
            <div className="w-full max-w-[290px] rounded-[24px] bg-white/75 backdrop-blur-md border border-[#ebdce5] p-5 sm:p-6 shadow-[0_14px_36px_rgba(50,31,63,0.07)] hover:shadow-[0_18px_45px_rgba(50,31,63,0.11)] transition-all duration-300 flex flex-col items-center justify-center">
              
              {/* Stepped Hierarchy Bars Matching Screenshot */}
              <div className="flex items-end justify-center gap-2 h-44 w-full px-1">
                
                {/* Level 5 (1%) */}
                <div className="group/tier flex-1 h-14 rounded-t-[12px] bg-gradient-to-t from-[#f5b3cb] to-[#ffc7da] flex flex-col items-center justify-center p-1 shadow-2xs hover:scale-105 transition-transform cursor-pointer" title="Level 5: 1%">
                  <User className="w-3.5 h-3.5 text-white/95" />
                  <span className="text-[8px] font-bold text-white mt-0.5">1%</span>
                </div>

                {/* Level 4 (2%) */}
                <div className="group/tier flex-1 h-20 rounded-t-[12px] bg-gradient-to-t from-[#f085a8] to-[#f7a2bf] flex flex-col items-center justify-center p-1 shadow-2xs hover:scale-105 transition-transform cursor-pointer" title="Level 4: 2%">
                  <User className="w-4 h-4 text-white/95" />
                  <span className="text-[8px] font-bold text-white mt-0.5">2%</span>
                </div>

                {/* Center / Leader (You - 20%) */}
                <div className="group/tier flex-1 h-36 rounded-t-[14px] bg-gradient-to-t from-[#ec2f73] to-[#ff4081] flex flex-col items-center justify-center p-1 shadow-md ring-4 ring-[#ec2f73]/15 hover:scale-105 transition-transform cursor-pointer relative" title="You: 20%">
                  <div className="w-2.5 h-2.5 rounded-full bg-white absolute -top-1.5 animate-ping" />
                  <User className="w-5 h-5 text-white" />
                  <strong className="text-[10px] font-black text-white uppercase mt-1">You</strong>
                  <span className="text-[9px] font-extrabold text-white/95">20%</span>
                </div>

                {/* Level 2 (4%) */}
                <div className="group/tier flex-1 h-24 rounded-t-[12px] bg-gradient-to-t from-[#f085a8] to-[#f7a2bf] flex flex-col items-center justify-center p-1 shadow-2xs hover:scale-105 transition-transform cursor-pointer" title="Level 2: 4%">
                  <User className="w-4 h-4 text-white/95" />
                  <span className="text-[8px] font-bold text-white mt-0.5">4%</span>
                </div>

                {/* Level 3 (3%) */}
                <div className="group/tier flex-1 h-16 rounded-t-[12px] bg-gradient-to-t from-[#f5b3cb] to-[#ffc7da] flex flex-col items-center justify-center p-1 shadow-2xs hover:scale-105 transition-transform cursor-pointer" title="Level 3: 3%">
                  <User className="w-3.5 h-3.5 text-white/95" />
                  <span className="text-[8px] font-bold text-white mt-0.5">3%</span>
                </div>

              </div>

              {/* Caption */}
              <div className="mt-3 text-center">
                <span className="block text-xs font-black text-[#141219]">
                  5-Tier Sponsor Network
                </span>
                <span className="text-[10px] text-[#716d77] font-medium">
                  Earn overrides on every team sale
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
