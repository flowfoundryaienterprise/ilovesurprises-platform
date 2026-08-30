import React from 'react';
import { ArrowRight, Sparkles, DollarSign, Gem } from 'lucide-react';

interface PromoBannersProps {
  onSelectCategory?: (category: string) => void;
}

export const PromoBanners: React.FC<PromoBannersProps> = ({ onSelectCategory }) => {
  return (
    <section className="max-w-[1460px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
      
      {/* 2 DISTINCT PROMOTIONAL BANNERS WITH DEEP PREMIUM SHADOWS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* BANNER 01: The Cash Fortune Drop */}
        <div className="relative rounded-[24px] overflow-hidden border border-[#cde8d1] bg-gradient-to-br from-[#fff4f8] via-[#f7fcf8] to-[#edfbf2] p-5 sm:p-6 lg:p-7 flex items-center justify-between shadow-[0_12px_32px_rgba(20,90,45,0.09)] hover:shadow-[0_20px_48px_rgba(20,90,45,0.15)] hover:-translate-y-1 transition-all duration-300 group min-h-[195px] sm:min-h-[215px]">
          
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

          {/* Left Text & CTA */}
          <div className="flex-1 pr-3 sm:pr-5 z-10">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-sm">
              <DollarSign className="w-3.5 h-3.5 stroke-[3]" />
              <span>Real Cash Inside $2 – $2,500</span>
            </div>

            <h3 className="text-lg sm:text-xl lg:text-[22px] font-black text-[#141219] m-0 mb-2 leading-snug font-display">
              Cash Money <span className="text-emerald-700">Candles Drop</span>
            </h3>

            <p className="text-xs sm:text-[13px] text-[#4a524c] m-0 mb-4 line-clamp-2 leading-relaxed max-w-sm">
              Burn to discover a sealed waterproof pouch holding real dollar bills from <strong className="text-[#141219] font-black">$2 up to $2,500</strong>.
            </p>

            <button
              type="button"
              onClick={() => onSelectCategory?.('Cash Candles')}
              className="inline-flex items-center gap-2 h-[40px] sm:h-[42px] px-5 sm:px-6 rounded-[13px] bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-[13px] font-extrabold uppercase tracking-wide shadow-[0_6px_18px_rgba(4,120,87,0.28)] hover:shadow-[0_12px_28px_rgba(4,120,87,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-250 cursor-pointer"
            >
              <span>Shop Cash Drops</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-250 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Right Banner Image with Distinct Drop Shadow */}
          <div className="w-[125px] sm:w-[155px] lg:w-[185px] shrink-0 flex items-center justify-center">
            <img
              src="/assets/ilovesurprises/banners/guad1.png"
              alt="Cash Candle Surprise Banner"
              className="w-full h-auto max-h-[145px] sm:max-h-[175px] object-contain drop-shadow-[0_18px_26px_rgba(20,80,40,0.28)] transition-transform duration-300 group-hover:scale-108 group-hover:drop-shadow-[0_22px_32px_rgba(20,80,40,0.35)]"
              loading="lazy"
            />
          </div>

        </div>

        {/* BANNER 02: Luxury Jewelry Reveal */}
        <div className="relative rounded-[24px] overflow-hidden border border-[#ebd0f0] bg-gradient-to-br from-[#fdf7ff] via-[#fff4f8] to-[#fffbfc] p-5 sm:p-6 lg:p-7 flex items-center justify-between shadow-[0_12px_32px_rgba(236,47,115,0.09)] hover:shadow-[0_20px_48px_rgba(236,47,115,0.15)] hover:-translate-y-1 transition-all duration-300 group min-h-[195px] sm:min-h-[215px]">
          
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-[#ec2f73]/15 blur-2xl pointer-events-none" />

          {/* Left Text & CTA */}
          <div className="flex-1 pr-3 sm:pr-5 z-10">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ec2f73] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-sm">
              <Gem className="w-3.5 h-3.5" />
              <span>Valued Up to $7,500</span>
            </div>

            <h3 className="text-lg sm:text-xl lg:text-[22px] font-black text-[#141219] m-0 mb-2 leading-snug font-display">
              Luxury Jewelry <span className="text-[#ec2f73]">Reveal Series</span>
            </h3>

            <p className="text-xs sm:text-[13px] text-[#554f59] m-0 mb-4 line-clamp-2 leading-relaxed max-w-sm">
              Melt into a fragrant soy pool to reveal solid gold, 925 sterling silver rings, or diamond necklaces.
            </p>

            <button
              type="button"
              onClick={() => onSelectCategory?.('Jewelry Candles')}
              className="inline-flex items-center gap-2 h-[40px] sm:h-[42px] px-5 sm:px-6 rounded-[13px] bg-[#141219] hover:bg-[#ec2f73] text-white text-xs sm:text-[13px] font-extrabold uppercase tracking-wide shadow-[0_6px_18px_rgba(20,18,25,0.28)] hover:shadow-[0_12px_28px_rgba(236,47,115,0.42)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-250 cursor-pointer"
            >
              <span>Reveal Jewelry</span>
              <Sparkles className="w-3.5 h-3.5 transition-transform duration-250 group-hover:rotate-12" />
            </button>
          </div>

          {/* Right Banner Image with Distinct Drop Shadow */}
          <div className="w-[125px] sm:w-[155px] lg:w-[185px] shrink-0 flex items-center justify-center">
            <img
              src="/assets/ilovesurprises/banners/mjb.png"
              alt="Jewelry Candle Reveal Banner"
              className="w-full h-auto max-h-[145px] sm:max-h-[175px] object-contain drop-shadow-[0_18px_26px_rgba(84,33,127,0.28)] transition-transform duration-300 group-hover:scale-108 group-hover:drop-shadow-[0_22px_32px_rgba(84,33,127,0.35)]"
              loading="lazy"
            />
          </div>

        </div>

      </div>

    </section>
  );
};
