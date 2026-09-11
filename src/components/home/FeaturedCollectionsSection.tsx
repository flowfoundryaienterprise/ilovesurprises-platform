import React, { useMemo } from 'react';
import { Sparkles, ArrowRight, DollarSign, Flame } from 'lucide-react';
import { categoriesData } from '../../data/categories';
import { productsData } from '../../data/products';
import type { Product } from '../../types';

interface FeaturedCollectionsSectionProps {
  onSelectCategory?: (category: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export const FeaturedCollectionsSection: React.FC<FeaturedCollectionsSectionProps> = ({
  onSelectCategory,
  onSelectProduct: _onSelectProduct,
}) => {
  // Find real category metadata
  const cashCandlesCat = useMemo(
    () => categoriesData.find((c) => c.id === 'cat-cash-candles') || categoriesData[1],
    []
  );

  const zodiacCount = useMemo(
    () =>
      productsData.filter((p) => p.name.toLowerCase().includes('zodiac') && (p.name.toLowerCase().includes('cash') || p.surpriseType === 'cash')).length || 12,
    []
  );

  const collections = [
    {
      id: 'cash-candles',
      title: 'Cash Candles',
      categoryKey: 'Cash Candles',
      badge: 'Win Up To $2,500',
      badgeIcon: DollarSign,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      tagline: 'Real cash prizes ($2 – $2,500) hidden inside every candle',
      itemCount: cashCandlesCat?.itemCount || 10986,
      image:
        cashCandlesCat?.image ||
        '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
      accentBorder: 'hover:border-emerald-400',
      ctaText: 'Shop Cash Candles',
    },
    {
      id: 'trending-collection',
      title: 'Trending Collection',
      categoryKey: 'Trending',
      badge: 'Most Loved Reveals',
      badgeIcon: Flame,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      tagline: 'The most viral & top-rated customer surprise reveals',
      itemCount: productsData.filter((p) => p.isBestSeller).length > 0 ? 500 : 120,
      image: '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
      accentBorder: 'hover:border-amber-400',
      ctaText: 'Explore Trending',
    },
    {
      id: 'zodiac-cash-money-candles',
      title: 'ZODIAC CASH MONEY CANDLES',
      categoryKey: 'ZODIAC CASH MONEY CANDLES',
      badge: 'Real Cash Inside',
      badgeIcon: Sparkles,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      tagline: 'Astrology horoscope cash candles with real money prizes up to $2,500',
      itemCount: zodiacCount,
      image: '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp',
      accentBorder: 'hover:border-[#D30915]',
      ctaText: 'Shop Zodiac Cash Candles',
    },
  ];

  return (
    <section
      id="featured-collections"
      className="w-full max-w-[1280px] mx-auto px-4 py-8 sm:py-12 box-border overflow-hidden"
      style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px', boxSizing: 'border-box' }}
      aria-label="Featured Collections"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-[11px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Highlights
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#141219] tracking-tight font-display m-0">
            Featured Collections
          </h2>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1 max-w-xl">
            Explore our viral reveal collections. Every single item contains real surprise cash bills or authentic certified treasures.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectCategory?.('All Surprises')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D30915] hover:text-[#B60711] hover:underline cursor-pointer transition-all self-start sm:self-end"
        >
          <span>View All Products</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3-Column Full-Cover Luxury Grid - Reduced Compact Size */}
      <div
        className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px',
          width: '100%',
        }}
      >
        {collections.map((col) => {
          const BadgeIcon = col.badgeIcon;
          return (
            <div
              key={col.id}
              onClick={() => onSelectCategory?.(col.categoryKey)}
              className={`group relative rounded-2xl sm:rounded-2xl border border-[#eee7ed] ${col.accentBorder} overflow-hidden shadow-[0_4px_16px_rgba(50,31,63,0.06)] hover:shadow-[0_14px_32px_rgba(211,9,21,0.16)] transition-all duration-300 cursor-pointer flex flex-col justify-between isolate`}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                height: '290px',
                minHeight: '270px',
                maxHeight: '310px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
              }}
            >
              {/* Full-Cover Background Image */}
              <img
                src={col.image}
                alt={col.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-106"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />

              {/* Top Gradient for Badge Legibility */}
              <div
                className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', pointerEvents: 'none' }}
              />

              {/* Bottom Deep Luxury Gradient Scrim for Content Contrast */}
              <div
                className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-black/95 via-black/65 via-35% to-transparent pointer-events-none"
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', pointerEvents: 'none' }}
              />

              {/* Subtle Ambient Hover Sheen */}
              <div
                className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              />

              {/* Top Badges Layer */}
              <div className="relative z-10 p-3 sm:p-3.5 flex items-center justify-between gap-2 pointer-events-none">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black shadow-md backdrop-blur-md bg-white/95 text-[#141219] border border-white/80">
                  <BadgeIcon className="w-3 h-3 text-[#D30915]" />
                  <span>{col.badge}</span>
                </div>

                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-white bg-black/60 backdrop-blur-md border border-white/10 shadow-sm">
                  {col.itemCount.toLocaleString()} items
                </div>
              </div>

              {/* Bottom Content Layer */}
              <div className="relative z-10 p-3.5 sm:p-4 mt-auto flex flex-col justify-end pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#fecdd3] mb-0.5 block drop-shadow-sm">
                  {col.badge === 'Win Up To $2,500' ? 'Cash Reveal Candle' : col.badge === 'Real Cash Inside' ? 'Astrology Cash Reveal' : 'Customer Favorite'}
                </span>

                <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug m-0 font-display drop-shadow-md group-hover:text-[#fecdd3] transition-colors">
                  {col.title}
                </h3>

                <p className="text-[11px] sm:text-xs text-white/90 mt-1 line-clamp-1 leading-relaxed m-0 drop-shadow-sm font-medium">
                  {col.tagline}
                </p>

                {/* Bottom Action Row */}
                <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white transition-colors">
                    {col.ctaText}
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 group-hover:bg-[#D30915] text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

