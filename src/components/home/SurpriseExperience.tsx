import React from 'react';
import { Sparkles, ArrowRight, Flame, PackageCheck, Gift, Star, ShieldCheck, Gem, DollarSign } from 'lucide-react';

export const SurpriseExperience: React.FC = () => {
  return (
    <section id="experience" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      
      {/* State-of-the-Art Reveal Process Showcase Card */}
      <div className="relative rounded-[26px] sm:rounded-[30px] border border-[#ebd2e2] bg-gradient-to-br from-[#fff2f7] via-[#fff9fb] to-[#fcf6ff] p-5 sm:p-7 lg:p-9 shadow-[0_16px_45px_rgba(50,31,63,0.08)] overflow-hidden">
        
        {/* Soft Ambient Radial Backlight */}
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#ec2f73]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Description & 4 Interactive Step Cards */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between items-start z-10">
            
            <div>
              {/* Top Eyebrow Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ec2f73]/10 text-[#ec2f73] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>How The Reveal Works</span>
              </div>

              {/* Main Headline */}
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-black text-[#141219] tracking-tight leading-snug hero-title-font m-0 mb-2">
                Unbox, Light & Reveal Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec2f73] via-[#ff3b83] to-[#d92467]">
                  Real Treasure
                </span>
              </h2>

              {/* Subtext */}
              <p className="text-xs sm:text-sm lg:text-[15px] text-[#55505a] leading-relaxed max-w-xl m-0 mb-5 font-medium">
                Every hand-poured candle and bath bomb holds a sealed, heat-resistant capsule containing real cash (<strong className="text-[#141219] font-black">up to $2,500</strong>) or luxury jewelry (<strong className="text-[#141219] font-black">appraised up to $7,500</strong>).
              </p>

              {/* 4 Interactive Process Step Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full mb-5">
                
                {/* STEP 1 */}
                <div className="p-3 rounded-[16px] bg-white/95 backdrop-blur-xs border border-[#f0e0ea] text-left shadow-2xs hover:shadow-[0_8px_24px_rgba(236,47,115,0.12)] hover:-translate-y-1 transition-all duration-200 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#fff0f5] text-[#ec2f73] flex items-center justify-center font-black text-xs border border-[#f5cad7]">
                      1
                    </div>
                    <Flame className="w-4 h-4 text-amber-500 transition-transform group-hover:scale-110" />
                  </div>
                  <strong className="block text-xs sm:text-[13px] font-black text-[#141219] mb-0.5">Light & Melt</strong>
                  <span className="text-[10px] sm:text-[11px] text-[#716d77] leading-tight block">Burn candle or drop in bath</span>
                </div>

                {/* STEP 2 */}
                <div className="p-3 rounded-[16px] bg-white/95 backdrop-blur-xs border border-[#f0e0ea] text-left shadow-2xs hover:shadow-[0_8px_24px_rgba(236,47,115,0.12)] hover:-translate-y-1 transition-all duration-200 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#fff0f5] text-[#ec2f73] flex items-center justify-center font-black text-xs border border-[#f5cad7]">
                      2
                    </div>
                    <PackageCheck className="w-4 h-4 text-emerald-600 transition-transform group-hover:scale-110" />
                  </div>
                  <strong className="block text-xs sm:text-[13px] font-black text-[#141219] mb-0.5">Find Capsule</strong>
                  <span className="text-[10px] sm:text-[11px] text-[#716d77] leading-tight block">Pouch floats to top</span>
                </div>

                {/* STEP 3 */}
                <div className="p-3 rounded-[16px] bg-white/95 backdrop-blur-xs border border-[#f0e0ea] text-left shadow-2xs hover:shadow-[0_8px_24px_rgba(236,47,115,0.12)] hover:-translate-y-1 transition-all duration-200 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#fff0f5] text-[#ec2f73] flex items-center justify-center font-black text-xs border border-[#f5cad7]">
                      3
                    </div>
                    <Gift className="w-4 h-4 text-purple-600 transition-transform group-hover:scale-110" />
                  </div>
                  <strong className="block text-xs sm:text-[13px] font-black text-[#141219] mb-0.5">Unwrap Foil</strong>
                  <span className="text-[10px] sm:text-[11px] text-[#716d77] leading-tight block">Open surprise bag</span>
                </div>

                {/* STEP 4: GRAND FINALE */}
                <div className="p-3 rounded-[16px] bg-gradient-to-br from-[#fff2f7] to-[#fff8fb] border border-[#f3b9cd] text-left shadow-2xs hover:shadow-[0_8px_24px_rgba(236,47,115,0.2)] hover:-translate-y-1 transition-all duration-200 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#ec2f73] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      ★
                    </div>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                  </div>
                  <strong className="block text-xs sm:text-[13px] font-black text-[#ec2f73] mb-0.5">Enjoy Prize!</strong>
                  <span className="text-[10px] sm:text-[11px] text-[#141219] font-bold leading-tight block">Real cash or jewelry</span>
                </div>

              </div>
            </div>

            {/* Action CTA */}
            <div className="flex items-center gap-4 pt-1">
              <a
                href="#featured"
                className="group inline-flex items-center justify-center gap-2 h-[44px] px-6 rounded-[13px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(236,47,115,0.28)] hover:shadow-[0_12px_28px_rgba(236,47,115,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <span>Explore Surprise Candles Now</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>

              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#716d77]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Win Guarantee</span>
              </div>
            </div>

          </div>

          {/* Right Column: Lifestyle Unboxing Visual — identical 1:1 match to Affiliate banner image */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-[310px] sm:max-w-[330px] rounded-[22px] overflow-hidden border border-[#eedbe6] bg-white p-3 shadow-[0_12px_32px_rgba(50,31,63,0.08)] group flex flex-col justify-between isolate">
              
              {/* 1:1 Aspect Ratio Container - 100% Proportional Fit with Zero Overflow */}
              <div className="relative w-full aspect-square rounded-[16px] overflow-hidden bg-gradient-to-b from-[#fff7fa] to-[#fff0f5] flex items-center justify-center">
                <img
                  src="/assets/ilovesurprises/hero/120_1cb28d37-c335-4513-808d-912cb52afde6.png"
                  alt="I Love Surprises cash candle with real money inside"
                  className="w-full h-full object-cover rounded-[16px] transition-transform duration-500 group-hover:scale-104 will-change-transform"
                  loading="lazy"
                />

                {/* Floating Top Badge: Jewelry */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-[#f5cad7] shadow-xs text-[9px] sm:text-[10px] font-black text-[#ec2f73] pointer-events-none">
                  <Gem className="w-3 h-3 text-[#ec2f73]" />
                  <span>Up to $7,500 Jewelry</span>
                </div>

                {/* Floating Bottom Badge: Cash */}
                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-emerald-200 shadow-xs text-[9px] sm:text-[10px] font-black text-emerald-700 pointer-events-none">
                  <DollarSign className="w-3 h-3 text-emerald-600 stroke-[3]" />
                  <span>Win $2,500 Cash</span>
                </div>
              </div>

              {/* Bottom Trust Strip */}
              <div className="mt-2.5 pt-2 border-t border-[#f4edf2] flex items-center justify-between text-left">
                <div className="flex items-center gap-1 text-[11px] font-black text-[#141219]">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Guaranteed Win in Every Order</span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-black text-[#ec2f73] bg-[#fff0f5] px-2.5 py-1 rounded-full uppercase shrink-0">
                  Authentic Soy
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
