import React from 'react';

export const Hero: React.FC = () => {

  return (
    <section id="hero" className="max-w-[1460px] mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-3">
      {/* Exact Reference Screenshot Main Hero Showcase Banner */}
      <div className="relative rounded-[28px] overflow-hidden border border-[#f1e2e9] bg-[radial-gradient(circle_at_70%_30%,rgba(255,203,222,0.45),transparent_28%),linear-gradient(120deg,#fffafb_0%,#fff4f8_52%,#fcf8ff_100%)] shadow-[0_16px_40px_rgba(50,31,63,0.06)]">

        <div className="grid grid-cols-12 items-center min-h-[520px] lg:min-h-[575px]">

          {/* Left Column: Hero Copy, CTAs, and Badges (Centered on Mobile, Left on Desktop) */}
          <div className="col-span-12 lg:col-span-6 flex flex-col justify-center items-center lg:items-start text-center lg:text-left px-5 sm:px-10 lg:pl-14 lg:pr-6 py-8 sm:py-12 z-10">

            {/* Top Eyebrow Tag with Subtle Sparkle */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ec2f73]/10 border border-[#f5cad7] text-[#ec2f73] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] mb-3 sm:mb-4 self-center lg:self-start shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ec2f73] animate-ping" />
              <span>Every product</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-[36px] sm:text-[48px] lg:text-[62px] leading-[1.02] font-black text-[#141219] tracking-[-0.04em] m-0 mb-4 text-center lg:text-left font-display max-w-[560px]">
              Every Product{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec2f73] via-[#ff3b83] to-[#d92467] drop-shadow-[0_2px_14px_rgba(236,47,115,0.22)] font-black tracking-[-0.04em] inline-block">
                Has a Surprise
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-[14px] sm:text-[16px] text-[#55505a] leading-[1.65] max-w-[520px] m-0 mb-6 font-medium text-center lg:text-left mx-auto lg:mx-0">
              Discover premium candles, wax melts, bath treats and gifts with jewelry, cash and more waiting inside.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-7 w-full sm:w-auto">
              <a
                href="#best-sellers"
                className="inline-flex items-center justify-center min-h-[48px] px-7 rounded-[13px] bg-gradient-to-r from-[#ec2f73] to-[#d92467] hover:from-[#d92467] hover:to-[#c21a57] text-white font-black text-xs sm:text-[13px] uppercase tracking-wider shadow-[0_10px_26px_rgba(236,47,115,0.28)] hover:shadow-[0_14px_32px_rgba(236,47,115,0.40)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Shop Surprises
              </a>

              <a
                href="#affiliate"
                className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-[13px] bg-white hover:bg-[#fff9fb] border border-[#e8dfe5] hover:border-[#ec2f73] text-[#141219] hover:text-[#ec2f73] font-black text-xs sm:text-[13px] uppercase tracking-wider shadow-2xs hover:shadow-[0_6px_18px_rgba(50,31,63,0.06)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Learn More
              </a>
            </div>

            {/* 3 High-Impact Feature Badges (Exact Same Size & Same Line Heights) */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 w-full max-w-[480px] sm:max-w-[560px] mx-auto lg:mx-0 items-stretch">
              {/* Badge 1: Real Jewelry */}
              <div className="group p-2 sm:p-3.5 rounded-[12px] sm:rounded-[15px] bg-white/80 hover:bg-white border border-[#ebdce5] hover:border-[#ec2f73] shadow-[0_4px_16px_rgba(50,31,63,0.03)] hover:shadow-[0_10px_24px_rgba(236,47,115,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center items-center sm:items-start h-full min-h-[58px] sm:min-h-[68px]">
                <strong className="block text-[10px] sm:text-xs font-black text-[#ec2f73] mb-0.5 leading-tight whitespace-nowrap group-hover:translate-x-0.5 transition-transform">
                  ◇ Real Jewelry
                </strong>
                <span className="text-[8px] sm:text-[11px] text-[#716d77] block leading-[1.2] font-medium text-center sm:text-left min-h-[20px] sm:min-h-[26px] flex items-center justify-center sm:justify-start">
                  In selected surprise products
                </span>
              </div>

              {/* Badge 2: Cash Prizes */}
              <div className="group p-2 sm:p-3.5 rounded-[12px] sm:rounded-[15px] bg-white/80 hover:bg-white border border-[#ebdce5] hover:border-emerald-500 shadow-[0_4px_16px_rgba(50,31,63,0.03)] hover:shadow-[0_10px_24px_rgba(16,185,129,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center items-center sm:items-start h-full min-h-[58px] sm:min-h-[68px]">
                <strong className="block text-[10px] sm:text-xs font-black text-emerald-700 mb-0.5 leading-tight whitespace-nowrap group-hover:translate-x-0.5 transition-transform">
                  ▣ Cash Prizes
                </strong>
                <span className="text-[8px] sm:text-[11px] text-[#716d77] block leading-[1.2] font-medium text-center sm:text-left min-h-[20px] sm:min-h-[26px] flex items-center justify-center sm:justify-start">
                  Surprise reveals inside
                </span>
              </div>

              {/* Badge 3: Made in USA */}
              <div className="group p-2 sm:p-3.5 rounded-[12px] sm:rounded-[15px] bg-white/80 hover:bg-white border border-[#ebdce5] hover:border-[#54217f] shadow-[0_4px_16px_rgba(50,31,63,0.03)] hover:shadow-[0_10px_24px_rgba(84,33,127,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center items-center sm:items-start h-full min-h-[58px] sm:min-h-[68px]">
                <strong className="block text-[10px] sm:text-xs font-black text-[#54217f] mb-0.5 leading-tight whitespace-nowrap group-hover:translate-x-0.5 transition-transform">
                  □ Made in USA
                </strong>
                <span className="text-[8px] sm:text-[11px] text-[#716d77] block leading-[1.2] font-medium text-center sm:text-left min-h-[20px] sm:min-h-[26px] flex items-center justify-center sm:justify-start">
                  Premium quality products
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Centered on Mobile, Exact Reference Hero Art with Main Product & 3 Mini PNGs */}
          <div className="col-span-12 lg:col-span-6 relative w-full h-[360px] sm:h-[460px] lg:h-[575px] overflow-hidden">

            {/* Radial White/Pink Backdrop Glow Aura */}
            <div
              className="absolute w-[300px] sm:w-[420px] lg:w-[470px] h-[300px] sm:h-[420px] lg:h-[470px] left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-[8%] top-[6%] sm:top-[8%] rounded-full pointer-events-none animate-aura-glow"
              style={{
                background:
                  'radial-gradient(circle, #ffffff 0%, #ffffff 32%, #ffe6ef 70%, rgba(255, 255, 255, 0) 72%)',
              }}
            />

            {/* Soft Ambient Ground Floor Shadow under Main Candle */}
            <div className="absolute left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-[14%] top-[82%] sm:top-[84%] w-[52%] lg:w-[56%] h-[26px] bg-gradient-to-r from-transparent via-[#2d1223]/22 to-transparent rounded-full blur-[14px] pointer-events-none z-0" />

            {/* Main Product: BetterThanSex Cash Candle with Dollars */}
            <img
              src="/assets/ilovesurprises/hero/hero-main-product.png"
              alt="Premium Cash Candle"
              className="absolute left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-[11%] top-[7%] w-[58%] sm:w-[54%] lg:w-[62%] max-h-[480px] lg:max-h-[525px] object-contain drop-shadow-[0_14px_18px_rgba(35,14,30,0.16)] drop-shadow-[0_30px_42px_rgba(58,25,52,0.24)] drop-shadow-[0_50px_70px_rgba(236,47,115,0.18)] z-10 transition-all duration-500 hover:scale-105 hover:drop-shadow-[0_38px_54px_rgba(236,47,115,0.32)] animate-hero-float"
            />

            {/* Mini Products Ground Contact Shadows */}
            <div className="absolute bottom-[2%] left-[6%] sm:left-[8%] lg:left-[6%] w-[24%] h-[14px] bg-gradient-to-r from-transparent via-[#2d1223]/26 to-transparent rounded-full blur-[8px] pointer-events-none z-10" />
            <div className="absolute bottom-[2%] left-[38%] sm:left-[38%] lg:left-[32%] -translate-x-1/2 lg:translate-x-0 w-[24%] h-[14px] bg-gradient-to-r from-transparent via-[#2d1223]/26 to-transparent rounded-full blur-[8px] pointer-events-none z-10" />
            <div className="absolute bottom-[2%] right-[6%] sm:right-[8%] lg:right-[3%] w-[24%] h-[14px] bg-gradient-to-r from-transparent via-[#2d1223]/26 to-transparent rounded-full blur-[8px] pointer-events-none z-10" />

            {/* Mini Product 1: Cash Bath Bomb */}
            <img
              src="/assets/ilovesurprises/hero/hero-mini-1.png"
              alt="Cash Bath Bomb with Surprise"
              className="absolute bottom-[4%] left-[5%] sm:left-[7%] lg:left-[5%] w-[25%] sm:w-[23%] lg:w-[26%] aspect-square object-contain drop-shadow-[0_8px_12px_rgba(35,14,30,0.14)] drop-shadow-[0_20px_30px_rgba(58,25,52,0.22)] drop-shadow-[0_32px_46px_rgba(236,47,115,0.16)] z-20 hover:scale-110 transition-all duration-300 hover:drop-shadow-[0_26px_38px_rgba(236,47,115,0.32)] animate-mini-float-1"
            />

            {/* Mini Product 2: Birthday Cake Cash Slime */}
            <img
              src="/assets/ilovesurprises/hero/hero-mini-2.png"
              alt="Birthday Cake Slime"
              className="absolute bottom-[4%] left-[37%] sm:left-[37%] lg:left-[31%] -translate-x-1/2 lg:translate-x-0 w-[24%] sm:w-[22%] lg:w-[25%] aspect-square object-contain drop-shadow-[0_8px_12px_rgba(35,14,30,0.14)] drop-shadow-[0_20px_30px_rgba(58,25,52,0.22)] drop-shadow-[0_32px_46px_rgba(236,47,115,0.16)] z-20 hover:scale-110 transition-all duration-300 hover:drop-shadow-[0_26px_38px_rgba(236,47,115,0.32)] animate-mini-float-2"
            />

            {/* Mini Product 3: Rainbow Gummy Bear Melts */}
            <img
              src="/assets/ilovesurprises/hero/hero-mini-3.png"
              alt="Gummy Bear Jewelry Melts"
              className="absolute bottom-[4%] right-[5%] sm:right-[7%] lg:right-[2%] w-[25%] sm:w-[23%] lg:w-[26%] aspect-square object-contain drop-shadow-[0_8px_12px_rgba(35,14,30,0.14)] drop-shadow-[0_20px_30px_rgba(58,25,52,0.22)] drop-shadow-[0_32px_46px_rgba(236,47,115,0.16)] z-20 hover:scale-110 transition-all duration-300 hover:drop-shadow-[0_26px_38px_rgba(236,47,115,0.32)] animate-mini-float-3"
            />

          </div>

        </div>

      </div>
    </section>
  );
};
