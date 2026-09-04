import React from 'react';
import { User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

interface AffiliateSectionProps {
  isLoading?: boolean;
}

export const AffiliateSection: React.FC<AffiliateSectionProps> = ({ isLoading = false }) => {
  if (isLoading) {
    return (
      <section id="affiliate" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-6 sm:py-9 select-none" role="status" aria-label="Loading affiliate program">
        <div className="relative rounded-[28px] sm:rounded-[32px] border border-[#f1dbe8] bg-[radial-gradient(circle_at_80%_25%,rgba(255,203,222,0.45),transparent_40%),linear-gradient(120deg,#fffafb_0%,#fff5f8_50%,#fcf8ff_100%)] p-6 sm:p-10 lg:p-12 shadow-[0_20px_50px_rgba(50,31,63,0.07)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-5 flex flex-col items-start space-y-4">
              <Skeleton className="h-6 w-36 rounded-full" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-9 sm:h-11 w-4/5 rounded-xl" />
                <Skeleton className="h-9 sm:h-11 w-3/5 rounded-xl" />
              </div>
              <Skeleton className="h-4 w-full rounded-md" />
              <div className="space-y-2 w-full pt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-[12px]" />
                ))}
              </div>
              <div className="flex gap-3 pt-3">
                <Skeleton className="h-[48px] w-32 rounded-[14px]" />
                <Skeleton className="h-[48px] w-40 rounded-[14px]" />
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="lg:col-span-7">
              <div className="rounded-[24px] bg-white border border-[#eee7ed] p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-40 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-3 pt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-[10px]" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="affiliate" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-6 sm:py-9">
      {/* Luxury Affiliate Showcase Card */}
      <div className="relative rounded-[28px] sm:rounded-[32px] border border-[#f1dbe8] bg-[radial-gradient(circle_at_80%_25%,rgba(255,203,222,0.45),transparent_40%),linear-gradient(120deg,#fffafb_0%,#fff5f8_50%,#fcf8ff_100%)] p-6 sm:p-10 lg:p-12 shadow-[0_20px_50px_rgba(50,31,63,0.07)] overflow-hidden">
        
        {/* Soft Ambient Radial Backlight */}
        <div className="absolute -top-10 right-1/4 w-[420px] h-[420px] bg-[#D30915]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Program Headline, Key Highlights & CTAs */}
          <div className="lg:col-span-5 flex flex-col items-start text-left z-10">
            
            {/* Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D30915] animate-pulse" />
              <span>Independent Consultant Opportunity</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-[#141219] leading-[1.08] tracking-tight m-0 mb-3 font-display">
              Become an Independent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] via-[#E51D29] to-[#B60711]">
                Surprise Consultant
              </span>
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#55505a] leading-[1.65] m-0 mb-5 font-medium">
              Turn your love for surprises into income. Start your business today for just <strong className="text-[#141219] font-black">$19.99/month</strong>.
            </p>

            {/* 4 Consultant Pillar Cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-6 w-full">
              <div className="p-2.5 rounded-[13px] bg-white/90 border border-[#f5e4ee] shadow-2xs">
                <span className="text-xs font-black text-[#D30915] block leading-tight">$19.99/month</span>
                <strong className="text-[11px] font-bold text-[#141219] block mt-0.5">Low Start-Up</strong>
                <span className="text-[10px] text-[#716d77] block leading-tight">Big opportunity</span>
              </div>

              <div className="p-2.5 rounded-[13px] bg-white/90 border border-[#f5e4ee] shadow-2xs">
                <span className="text-xs font-black text-emerald-700 block leading-tight">20% Personal</span>
                <strong className="text-[11px] font-bold text-[#141219] block mt-0.5">Sales Commission</strong>
                <span className="text-[10px] text-[#716d77] block leading-tight">Earn on every sale</span>
              </div>

              <div className="p-2.5 rounded-[13px] bg-white/90 border border-[#f5e4ee] shadow-2xs">
                <span className="text-xs font-black text-purple-700 block leading-tight">5 Team Levels</span>
                <strong className="text-[11px] font-bold text-[#141219] block mt-0.5">Team Overrides</strong>
                <span className="text-[10px] text-[#716d77] block leading-tight">Earn multiple ways</span>
              </div>

              <div className="p-2.5 rounded-[13px] bg-white/90 border border-[#f5e4ee] shadow-2xs">
                <span className="text-xs font-black text-amber-700 block leading-tight">Personal Link</span>
                <strong className="text-[11px] font-bold text-[#141219] block mt-0.5">Your Storefront</strong>
                <span className="text-[10px] text-[#716d77] block leading-tight">Your own brand</span>
              </div>
            </div>

            {/* CTAs with Smooth Hover States */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <a
                href="/affiliate"
                className="group inline-flex items-center justify-center gap-2 min-h-[48px] px-7 rounded-[14px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96060e] text-white font-black text-xs sm:text-[13px] uppercase tracking-wider shadow-[0_10px_26px_rgba(211, 9, 21,0.28)] hover:shadow-[0_14px_32px_rgba(211, 9, 21,0.40)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <span>Join for $19.99/month</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="/affiliate"
                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[14px] bg-white hover:bg-[#fff9fb] border border-[#ebdce5] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] font-black text-xs sm:text-[13px] uppercase tracking-wider shadow-2xs hover:shadow-[0_6px_18px_rgba(50,31,63,0.06)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Learn More
              </a>
            </div>

          </div>

          {/* Right Column: Visual 5-Tier Compensation Diagram */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="relative rounded-[24px] sm:rounded-[28px] bg-white/95 border border-[#eee0e9] p-5 sm:p-7 shadow-[0_12px_36px_rgba(50,31,63,0.05)] backdrop-blur-xs">
              
              {/* Header inside Card */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#f4ebf1]">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#141219] hero-title-font m-0">
                    Commission Structure
                  </h3>
                  <span className="text-xs text-[#716d77] font-medium block mt-0.5">
                    Earn on every unboxing across your network
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200 shadow-2xs">
                  Up to 35%
                </div>
              </div>

              {/* Commission Stack Breakdown Rows */}
              <div className="space-y-2.5">
                
                {/* Personal Sales Row (Highlight) */}
                <div className="flex items-center justify-between p-3 rounded-[15px] bg-gradient-to-r from-[#fff1f2] to-[#fff8fb] border border-[#fecdd3] shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-[10px] bg-[#D30915] text-white flex items-center justify-center font-black text-xs shadow-2xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-black text-[#141219] block">
                        Personal Sales
                      </strong>
                      <span className="text-[10px] sm:text-[11px] text-[#716d77] block font-medium">
                        Your direct retail customer orders
                      </span>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#D30915] hero-title-font">
                    20%
                  </div>
                </div>

                {/* Level 1 Referral */}
                <div className="flex items-center justify-between p-2.5 px-3 rounded-[14px] bg-[#faf6f9] border border-[#f0e4ec] hover:border-[#D30915] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[8px] bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                      1
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#141219]">
                      Level 1
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-purple-700">5%</span>
                </div>

                {/* Level 2 Referral */}
                <div className="flex items-center justify-between p-2.5 px-3 rounded-[14px] bg-[#faf6f9] border border-[#f0e4ec] hover:border-[#D30915] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[8px] bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#141219]">
                      Level 2
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-purple-700">4%</span>
                </div>

                {/* Level 3 Referral */}
                <div className="flex items-center justify-between p-2.5 px-3 rounded-[14px] bg-[#faf6f9] border border-[#f0e4ec] hover:border-[#D30915] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[8px] bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                      3
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#141219]">
                      Level 3
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-purple-700">3%</span>
                </div>

                {/* Level 4 Referral */}
                <div className="flex items-center justify-between p-2.5 px-3 rounded-[14px] bg-[#faf6f9] border border-[#f0e4ec] hover:border-[#D30915] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[8px] bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                      4
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#141219]">
                      Level 4
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-purple-700">2%</span>
                </div>

                {/* Level 5 Referral */}
                <div className="flex items-center justify-between p-2.5 px-3 rounded-[14px] bg-[#faf6f9] border border-[#f0e4ec] hover:border-[#D30915] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[8px] bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                      5
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#141219]">
                      Level 5
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-purple-700">1%</span>
                </div>

              </div>

              {/* Visual Multi-Tier Payout Summary Bar */}
              <div className="mt-4 pt-3.5 border-t border-[#f4ebf1] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#716d77] block">
                    Maximum Total Payout
                  </span>
                  <strong className="text-sm sm:text-base font-black text-[#141219]">
                    35% of Retail Volume
                  </strong>
                </div>

                {/* Compact Stacked Percent Badges Bar */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#D30915] text-white">
                    You 20%
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-600 text-white">
                    5%
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-500 text-white">
                    4%
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-400 text-white">
                    3%
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-300 text-white">
                    2%
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-200 text-purple-900">
                    1%
                  </span>
                </div>
              </div>

              {/* Sponsor Network Advantage Callout */}
              <div className="mt-3 p-2.5 rounded-[12px] bg-[#fff1f2] border border-[#fecdd3] flex items-center gap-2 text-[11px] font-bold text-[#D30915]">
                <ShieldCheck className="w-4 h-4 text-[#D30915] shrink-0" />
                <span><strong>5-Tier Sponsor Network</strong> — Earn overrides on every team sale with weekly payouts</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
