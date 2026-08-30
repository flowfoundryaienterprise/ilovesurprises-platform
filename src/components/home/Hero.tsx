import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Heart, DollarSign, Gem } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section id="hero" className="max-w-[1460px] mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-2">
      
      {/* Compact Quick-Commerce Hero Showcase Banner with Elevated Card Shadow */}
      <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden border border-[#f1e2e9] bg-gradient-to-r from-[#fff3f7] via-[#fffafb] to-[#fbf8ff] p-5 sm:p-8 lg:p-10 shadow-[0_16px_40px_rgba(50,31,63,0.08)]">
        
        {/* Soft Ambient Radial Background Aura */}
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#ec2f73]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Column: Headlines, Highlights & CTAs */}
          <div className="col-span-12 sm:col-span-7 lg:col-span-7 flex flex-col items-center sm:items-start text-center sm:text-left z-10">
            
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ec2f73]/10 text-[#ec2f73] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Real Surprises In Every Product</span>
            </div>

            {/* Main Headline with Custom Display Font & Vibrant Gradient */}
            <h1 className="text-[28px] sm:text-[36px] lg:text-[46px] leading-[1.08] hero-title-font text-[#141219] tracking-tight m-0 mb-3 text-center sm:text-left w-full sm:w-auto">
              Every Product{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec2f73] via-[#ff3b83] to-[#d92467] drop-shadow-[0_2px_10px_rgba(236,47,115,0.18)]">
                Has a Surprise
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-xs sm:text-sm lg:text-[15px] text-[#55505a] leading-relaxed max-w-xl m-0 mb-5 font-medium text-center sm:text-left">
              Hand-poured aromatic soy candles, bath treats & slimes with hidden real cash (<strong className="text-[#141219] font-black">$2 to $2,500</strong>) or jewelry (<strong className="text-[#141219] font-black">up to $7,500</strong>) inside.
            </p>

            {/* CTAs with Elevated Hover Effects */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
              <a
                href="#featured"
                className="group inline-flex items-center justify-center gap-2 h-[46px] sm:h-[48px] px-6 sm:px-7 rounded-[14px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_24px_rgba(236,47,115,0.28)] hover:shadow-[0_14px_32px_rgba(236,47,115,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-250 cursor-pointer"
              >
                <span>Shop Best Sellers</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-250 group-hover:translate-x-1" />
              </a>

              <a
                href="#affiliate"
                className="group inline-flex items-center justify-center gap-1.5 h-[46px] sm:h-[48px] px-5 sm:px-6 rounded-[14px] bg-white border border-[#e8dfe5] hover:border-[#ec2f73] hover:text-[#ec2f73] text-[#141219] text-xs sm:text-sm font-bold shadow-2xs hover:shadow-[0_8px_24px_rgba(236,47,115,0.14)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-250"
              >
                <Heart className="w-3.5 h-3.5 text-[#ec2f73] transition-transform duration-250 group-hover:scale-120" />
                <span>Earn 20% Reps</span>
              </a>
            </div>

            {/* Micro-Trust Highlights */}
            <div className="hidden md:flex items-center gap-4 mt-6 pt-4 border-t border-[#f2e6ec] text-[11px] font-bold text-[#716d77]">
              <div className="flex items-center gap-1.5 text-[#141219]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Guaranteed Reveal</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-[#141219]">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Express 2-3 Day Dispatch</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-[#141219]">
                <Sparkles className="w-3.5 h-3.5 text-[#ec2f73]" />
                <span>All-Natural Soy Wax</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual with Deep Elevated Image Shadow */}
          <div className="col-span-12 sm:col-span-5 lg:col-span-5 flex justify-center sm:justify-end relative">
            
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[440px] flex items-center justify-center">
              
              {/* Product Hero Image with Deep Shadow & Backdrop Frame */}
              <div className="relative z-10 w-full rounded-[22px] overflow-hidden bg-white/80 backdrop-blur-md p-2.5 sm:p-3.5 border border-[#f5dce6] shadow-[0_18px_45px_rgba(50,31,63,0.14)] transition-all duration-300 hover:shadow-[0_24px_55px_rgba(50,31,63,0.18)]">
                <img
                  src="/assets/ilovesurprises/hero/wowsz.png"
                  alt="I Love Surprises Premium Unboxing Products"
                  className="w-full h-auto max-h-[220px] sm:max-h-[270px] lg:max-h-[300px] object-contain rounded-[16px] drop-shadow-[0_16px_28px_rgba(50,31,63,0.18)] transition-transform duration-500 hover:scale-103"
                  loading="eager"
                />
              </div>

              {/* Floating Top Badge: Cash Prize */}
              <div className="absolute -top-2.5 left-2 z-20 hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-emerald-200 shadow-[0_8px_20px_rgba(4,120,87,0.15)] text-[11px] font-black text-emerald-800 animate-bounce" style={{ animationDuration: '3s' }}>
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>Win $2 – $2,500 Cash</span>
              </div>

              {/* Floating Bottom Badge: Jewelry Reveal */}
              <div className="absolute -bottom-2.5 right-2 z-20 hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#f5cad7] shadow-[0_8px_20px_rgba(236,47,115,0.18)] text-[11px] font-black text-[#ec2f73] animate-pulse">
                <Gem className="w-3.5 h-3.5 text-[#ec2f73]" />
                <span>Up to $7,500 Jewelry</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
