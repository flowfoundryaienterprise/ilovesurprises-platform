import React, { useState } from 'react';
import { Star, CheckCircle, Sparkles, Gem, DollarSign, PackageCheck, ShieldCheck, Award } from 'lucide-react';
import { reviewsData } from '../../data/reviews';

export const ReviewsSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'cash' | 'jewelry'>('all');

  const filteredReviews = reviewsData.filter((rev) => {
    if (activeFilter === 'cash') {
      return rev.revealedSurprise?.toLowerCase().includes('cash') || rev.revealedSurprise?.includes('$50') || rev.revealedSurprise?.includes('$100');
    }
    if (activeFilter === 'jewelry') {
      return rev.revealedSurprise?.toLowerCase().includes('ring') || rev.revealedSurprise?.toLowerCase().includes('earring') || rev.revealedSurprise?.toLowerCase().includes('jewelry');
    }
    return true;
  });

  const cashCount = reviewsData.filter(r => r.revealedSurprise?.toLowerCase().includes('cash') || r.revealedSurprise?.includes('$50') || r.revealedSurprise?.includes('$100')).length;
  const jewelryCount = reviewsData.filter(r => r.revealedSurprise?.toLowerCase().includes('ring') || r.revealedSurprise?.toLowerCase().includes('earring') || r.revealedSurprise?.toLowerCase().includes('jewelry')).length;

  return (
    <section id="reviews" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-hidden">
      
      {/* Master Customer Reveal & Social Proof Showcase Card */}
      <div className="relative rounded-[24px] sm:rounded-[30px] border border-[#ebd2e2] bg-gradient-to-br from-[#fff2f7] via-[#fffafc] to-[#fbf6ff] p-5 sm:p-7 lg:p-8 shadow-[0_16px_45px_rgba(50,31,63,0.08)] overflow-hidden">
        
        {/* Soft Ambient Radial Backlight */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#ec2f73]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header: Title, Subtitle & Trust Rating Summary */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6 z-10 relative">
          
          <div className="max-w-2xl">
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#ec2f73]/10 text-[#ec2f73] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Real Customer Reveals</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#141219] tracking-tight leading-snug hero-title-font m-0 mb-2">
              Unboxings, Real Cash &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ec2f73] via-[#ff3b83] to-[#d92467]">
                Fine Jewelry Reveals
              </span>
            </h2>

            {/* Subtext */}
            <p className="text-xs sm:text-sm lg:text-[14px] text-[#55505a] leading-relaxed m-0 font-medium">
              Over <strong className="text-[#141219] font-black">50,000+ verified surprises</strong> unboxed. Every hand-poured candle and bath treat has a genuine prize sealed safely inside.
            </p>
          </div>

          {/* Elevated Trust Rating Summary Box */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 sm:p-3.5 rounded-[18px] bg-white/95 backdrop-blur-md border border-[#ebdce6] shadow-sm shrink-0">
            <div className="flex items-center gap-2 pr-3 border-r border-[#f0e4eb]">
              <div className="text-2xl sm:text-3xl font-black text-[#141219] leading-none hero-title-font">
                4.9
              </div>
              <div>
                <div className="flex items-center text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.4)]" />
                  ))}
                </div>
                <span className="text-[10px] font-extrabold text-[#716d77] block mt-0.5">
                  4,850+ Verified Reviews
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[11px] font-bold text-[#141219]">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>100% Win in Every Order</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#ec2f73]">
                <Award className="w-3.5 h-3.5 text-[#ec2f73]" />
                <span>$1.2M+ In Prizes Revealed</span>
              </div>
            </div>
          </div>

        </div>

        {/* Interactive Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer shrink-0 ${
              activeFilter === 'all'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.3)]'
                : 'bg-white text-[#55505a] border border-[#e8dfe5] hover:border-[#ec2f73] hover:text-[#ec2f73]'
            }`}
          >
            All Reveals ({reviewsData.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('cash')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'cash'
                ? 'bg-emerald-600 text-white shadow-[0_4px_14px_rgba(5,150,105,0.3)]'
                : 'bg-white text-[#55505a] border border-[#e8dfe5] hover:border-emerald-500 hover:text-emerald-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Cash Wins ({cashCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('jewelry')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === 'jewelry'
                ? 'bg-purple-600 text-white shadow-[0_4px_14px_rgba(147,51,234,0.3)]'
                : 'bg-white text-[#55505a] border border-[#e8dfe5] hover:border-purple-500 hover:text-purple-700'
            }`}
          >
            <Gem className="w-3.5 h-3.5" />
            <span>Jewelry Reveals ({jewelryCount})</span>
          </button>
        </div>

        {/* Dynamic Responsive Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
          {filteredReviews.map((review) => {
            const isCash = review.revealedSurprise?.toLowerCase().includes('cash') || review.revealedSurprise?.includes('$50') || review.revealedSurprise?.includes('$100');
            const isJewelry = review.revealedSurprise?.toLowerCase().includes('ring') || review.revealedSurprise?.toLowerCase().includes('necklace') || review.revealedSurprise?.toLowerCase().includes('earring');

            return (
              <div
                key={review.id}
                className="p-4 rounded-[20px] bg-white border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] hover:shadow-[0_16px_36px_rgba(236,47,115,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Top Customer Info Row with Real Unboxer Avatar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {review.avatar ? (
                        <img
                          src={review.avatar}
                          alt={review.author}
                          className="w-10 h-10 rounded-full object-cover border border-[#f5cad7] bg-[#fff0f5] shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ec2f73] to-[#ff4b8b] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {review.author.charAt(0)}
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <strong className="text-xs font-black text-[#141219] truncate">
                            {review.author}
                          </strong>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                        </div>
                        <span className="text-[10px] text-[#716d77] block truncate">
                          {review.location} • {review.date}
                        </span>
                      </div>
                    </div>

                    {/* 5-Star Rating Pill */}
                    <div className="flex items-center text-amber-400 bg-amber-50/80 px-1.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Review Title with Quotes */}
                  <h4 className="text-xs sm:text-[13px] font-black text-[#141219] leading-snug m-0 mb-1.5 group-hover:text-[#ec2f73] transition-colors line-clamp-2">
                    "{review.title}"
                  </h4>

                  {/* Review Text */}
                  <p className="text-[11px] sm:text-xs text-[#55505a] leading-relaxed m-0 mb-3.5 line-clamp-3 font-medium">
                    {review.comment}
                  </p>

                </div>

                <div>
                  
                  {/* Prize / Reveal Highlight Banner (Key Focal Element) */}
                  {review.revealedSurprise && (
                    <div
                      className={`mb-3 p-2 rounded-[12px] border flex items-center gap-2 text-[11px] font-black transition-transform duration-200 group-hover:scale-[1.02] ${
                        isCash
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-200 text-emerald-800'
                          : isJewelry
                          ? 'bg-gradient-to-r from-[#fff0f5] to-[#fff7fa] border-[#f5cad7] text-[#ec2f73]'
                          : 'bg-gradient-to-r from-purple-50 to-pink-50/50 border-purple-200 text-purple-800'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isCash
                            ? 'bg-emerald-100 text-emerald-700'
                            : isJewelry
                            ? 'bg-[#ffe4ee] text-[#ec2f73]'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {isCash ? (
                          <DollarSign className="w-3.5 h-3.5 stroke-[3]" />
                        ) : isJewelry ? (
                          <Gem className="w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase tracking-wider block opacity-75 font-bold leading-none mb-0.5">
                          {isCash ? 'Cash Unboxed' : isJewelry ? 'Jewelry Prize' : 'Surprise Charm'}
                        </span>
                        <span className="truncate block leading-tight">
                          {review.revealedSurprise}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Product Unboxed Footer Tag */}
                  <div className="pt-2 border-t border-[#f4edf2] flex items-center justify-between text-[10px] text-[#716d77]">
                    <div className="flex items-center gap-1.5 truncate">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-semibold">{review.productName}</span>
                    </div>
                    <span className="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                      Verified
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Social Proof & Trust Strip */}
        <div className="pt-4 border-t border-[#f0e2ec] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
          
          <div className="p-2.5 rounded-[14px] bg-white/80 border border-[#f2e6ec] flex flex-col items-center justify-center">
            <div className="flex items-center text-amber-500 gap-0.5 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <strong className="text-xs font-black text-[#141219]">4.9 / 5.0 Rating</strong>
            <span className="text-[10px] text-[#716d77]">4,850+ Genuine Unboxers</span>
          </div>

          <div className="p-2.5 rounded-[14px] bg-white/80 border border-[#f2e6ec] flex flex-col items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
            <strong className="text-xs font-black text-[#141219]">100% Win Guarantee</strong>
            <span className="text-[10px] text-[#716d77]">Every product holds a prize</span>
          </div>

          <div className="p-2.5 rounded-[14px] bg-white/80 border border-[#f2e6ec] flex flex-col items-center justify-center">
            <Gem className="w-4 h-4 text-[#ec2f73] mb-1" />
            <strong className="text-xs font-black text-[#141219]">Appraised Jewelry</strong>
            <span className="text-[10px] text-[#716d77]">Sterling Silver & 14K Gold</span>
          </div>

          <div className="p-2.5 rounded-[14px] bg-white/80 border border-[#f2e6ec] flex flex-col items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-600 mb-1 stroke-[3]" />
            <strong className="text-xs font-black text-[#141219]">Real US Currency</strong>
            <span className="text-[10px] text-[#716d77]">Cash bills from $2 to $2,500</span>
          </div>

        </div>

      </div>
    </section>
  );
};

