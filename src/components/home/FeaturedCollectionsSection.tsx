import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowRight, DollarSign, Flame, Calendar, Gift, Gem, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { Product } from '../../types';

interface FeaturedCollectionsSectionProps {
  onSelectCategory?: (category: string) => void;
  onSelectCollection?: (handle: string) => void;
  onSelectProduct?: (product: Product) => void;
}

interface CuratedCardConfig {
  id: string;
  title: string;
  categoryKey: string;
  badge: string;
  badgeIcon: React.ComponentType<{ className?: string }>;
  tagline: string;
  itemCount: number;
  image: string;
  ctaText: string;
  highlights: string[];
  eyebrow: string;
  theme: 'amber' | 'red' | 'emerald' | 'purple';
}

const DEFAULT_CURATED_CARDS: Record<string, CuratedCardConfig> = {
  halloween: {
    id: 'halloween',
    title: 'Halloween',
    categoryKey: 'Halloween',
    badge: 'Holiday Priority',
    badgeIcon: Flame,
    tagline: 'Limited-edition Halloween reveal candles & bath treats with cash and jewelry inside',
    itemCount: 83,
    image: 'https://cdn.shopify.com/s/files/1/0172/4672/products/4_Mockup_Jewelry_JewelryCandles_37b9e8df-fc51-4b27-9db3-6236ee9d84b6.jpg?v=1602742369',
    ctaText: 'Shop Halloween Collection',
    highlights: ['🎃 Cash or Jewelry Inside', '🕯️ 100% Natural Soy Wax', '⚡ Limited Holiday Release'],
    eyebrow: 'Upcoming Holiday Priority',
    theme: 'amber',
  },
  'christmas-candles-1': {
    id: 'christmas-candles-1',
    title: 'Christmas',
    categoryKey: 'Christmas Candles',
    badge: 'Holiday Priority',
    badgeIcon: Gift,
    tagline: 'Magical Christmas reveal candles and seasonal celebration scents with hidden treasures',
    itemCount: 98,
    image: 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_Jewelry_Candles_9c1f97ea-399f-403a-ae64-3f3afc816a87.jpg?v=1573149158',
    ctaText: 'Shop Christmas Collection',
    highlights: ['🎁 Real Cash Up To $2,500', '💍 Genuine Jewelry Ring', '🎄 Festive Seasonal Aroma'],
    eyebrow: 'Upcoming Holiday Priority',
    theme: 'red',
  },
  'cash-candles': {
    id: 'cash-candles',
    title: 'Cash Candles',
    categoryKey: 'Cash Candles',
    badge: 'Win Up To $2,500',
    badgeIcon: DollarSign,
    tagline: 'Real cash prizes ($2 – $2,500) hidden inside every single candle',
    itemCount: 495,
    image: '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
    ctaText: 'Shop Cash Candles',
    highlights: ['💵 Real Cash Guaranteed', '💰 Up to $2,500 Cash Bill', '⭐ Signature Bestseller'],
    eyebrow: 'Signature Cash Reveal Experience',
    theme: 'emerald',
  },
  'zodiac-cash-money-candles': {
    id: 'zodiac-cash-money-candles',
    title: 'Zodiac Cash Candles',
    categoryKey: 'ZODIAC CASH MONEY CANDLES',
    badge: 'Real Cash Inside',
    badgeIcon: Sparkles,
    tagline: 'Astrology horoscope cash candles with real money prizes up to $2,500',
    itemCount: 12,
    image: '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp',
    ctaText: 'Shop Zodiac Cash Candles',
    highlights: ['♈ All 12 Horoscope Signs', '💵 Real Cash Inside Each', '✨ Perfect Zodiac Gift'],
    eyebrow: 'Signature Cash Reveal Experience',
    theme: 'purple',
  },
};

const THEME_STYLES = {
  amber: {
    border: 'border-amber-500/25',
    hoverBorder: 'group-hover:border-amber-400',
    hoverShadow: 'hover:shadow-[0_20px_50px_-12px_rgba(245,158,11,0.38)]',
    iconColor: 'text-amber-500',
    dotBg: 'bg-amber-400 shadow-[0_0_10px_rgba(251,146,60,0.9)]',
    ctaHover: 'group-hover:bg-amber-500',
    glowSheen: 'from-amber-500/15 via-orange-500/5 to-transparent',
    titleHover: 'group-hover:text-amber-200',
    eyebrowColor: 'text-amber-200',
  },
  red: {
    border: 'border-red-500/25',
    hoverBorder: 'group-hover:border-red-400',
    hoverShadow: 'hover:shadow-[0_20px_50px_-12px_rgba(220,38,38,0.38)]',
    iconColor: 'text-red-500',
    dotBg: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.9)]',
    ctaHover: 'group-hover:bg-[#D30915]',
    glowSheen: 'from-red-500/15 via-rose-500/5 to-transparent',
    titleHover: 'group-hover:text-red-200',
    eyebrowColor: 'text-red-200',
  },
  emerald: {
    border: 'border-emerald-500/25',
    hoverBorder: 'group-hover:border-emerald-400',
    hoverShadow: 'hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.38)]',
    iconColor: 'text-emerald-500',
    dotBg: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]',
    ctaHover: 'group-hover:bg-emerald-600',
    glowSheen: 'from-emerald-500/15 via-teal-500/5 to-transparent',
    titleHover: 'group-hover:text-emerald-200',
    eyebrowColor: 'text-emerald-200',
  },
  purple: {
    border: 'border-purple-500/25',
    hoverBorder: 'group-hover:border-purple-400',
    hoverShadow: 'hover:shadow-[0_20px_50px_-12px_rgba(168,85,247,0.38)]',
    iconColor: 'text-purple-500',
    dotBg: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.9)]',
    ctaHover: 'group-hover:bg-purple-600',
    glowSheen: 'from-purple-500/15 via-indigo-500/5 to-transparent',
    titleHover: 'group-hover:text-purple-200',
    eyebrowColor: 'text-purple-200',
  },
};

export const FeaturedCollectionsSection: React.FC<FeaturedCollectionsSectionProps> = ({
  onSelectCategory,
  onSelectCollection,
  onSelectProduct: _onSelectProduct,
}) => {
  const [homepageConfig, setHomepageConfig] = useState(() => adminService.getHomepageContent());

  useEffect(() => {
    const handleUpdate = () => {
      setHomepageConfig(adminService.getHomepageContent());
    };
    window.addEventListener('ils_homepage_content_updated', handleUpdate);
    return () => window.removeEventListener('ils_homepage_content_updated', handleUpdate);
  }, []);

  // Guarantee Founder Hierarchy:
  // Row 1: Halloween & Christmas (Upcoming Holiday Priority)
  // Row 2: Cash Candles & Zodiac Cash Candles (Signature Cash Reveals)
  const { row1Cards, row2Cards } = useMemo(() => {
    const cards = homepageConfig.featuredCards || [];

    const resolveCard = (id: string, defaultCard: CuratedCardConfig): CuratedCardConfig => {
      const found = cards.find((c) => c.id === id);
      if (!found) return defaultCard;
      return {
        ...defaultCard,
        title: found.title || defaultCard.title,
        badge: found.badge || defaultCard.badge,
        tagline: found.tagline || defaultCard.tagline,
        ctaText: found.ctaText || defaultCard.ctaText,
        image: found.image || defaultCard.image,
        itemCount: found.itemCount || defaultCard.itemCount,
      };
    };

    const halloween = resolveCard('halloween', DEFAULT_CURATED_CARDS.halloween);
    const christmas = resolveCard('christmas-candles-1', DEFAULT_CURATED_CARDS['christmas-candles-1']);
    const cash = resolveCard('cash-candles', DEFAULT_CURATED_CARDS['cash-candles']);
    const zodiac = resolveCard('zodiac-cash-money-candles', DEFAULT_CURATED_CARDS['zodiac-cash-money-candles']);

    return {
      row1Cards: [halloween, christmas],
      row2Cards: [cash, zodiac],
    };
  }, [homepageConfig]);

  const renderCard = (col: CuratedCardConfig, _index: number, _rowNum: number) => {
    const BadgeIcon = col.badgeIcon;
    const cardTestId = `featured-collection-${col.id}`;
    const themeStyles = THEME_STYLES[col.theme];

    return (
      <div
        key={col.id}
        id={cardTestId}
        data-testid={cardTestId}
        onClick={() => {
          if (onSelectCollection) {
            onSelectCollection(col.id);
          } else if (onSelectCategory) {
            onSelectCategory(col.categoryKey);
          }
        }}
        className={`group relative rounded-none overflow-hidden cursor-pointer transition-all duration-300 ease-out isolate border ${themeStyles.border} ${themeStyles.hoverBorder} ${themeStyles.hoverShadow} bg-white flex flex-col justify-between shadow-md hover:shadow-xl aspect-square md:aspect-auto md:h-[360px] lg:h-[380px] w-full`}
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          borderRadius: '0px',
        }}
      >
        {/* Full-Cover Background Image - Zero Internal Edges */}
        <img
          src={col.image}
          alt={col.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block',
          }}
          onError={(e) => {
            // High quality fallback if CDN image has connectivity issue
            if (col.id.includes('halloween')) {
              (e.target as HTMLImageElement).src = '/assets/ilovesurprises/categories/Cat-2_Figurines_JWL_wax_melts.jpg';
            } else if (col.id.includes('christmas')) {
              (e.target as HTMLImageElement).src = '/assets/ilovesurprises/categories/Heartfelt-Hugs.jpg';
            } else {
              (e.target as HTMLImageElement).src = '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
            }
          }}
        />

        {/* Top Vignette Gradient for Badges Legibility */}
        <div
          className="absolute inset-x-0 top-0 h-14 sm:h-20 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' }}
        />

        {/* Bottom Deep Luxury Gradient Scrim for Content Contrast */}
        <div
          className="absolute inset-x-0 bottom-0 h-[62%] sm:h-[58%] bg-gradient-to-t from-[#0c0914] via-[#0c0914]/90 via-45% to-transparent pointer-events-none"
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none' }}
        />

        {/* Ambient Theme Glow on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${themeStyles.glowSheen} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />

        {/* TOP BADGES LAYER */}
        <div className="relative z-10 p-2 sm:p-3 md:p-3.5 flex items-center justify-between gap-1 sm:gap-2 pointer-events-none">
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] min-[360px]:text-[9px] sm:text-xs font-black shadow-md backdrop-blur-md bg-white/95 text-[#141219] border border-white/90 truncate">
            <BadgeIcon className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0 ${themeStyles.iconColor}`} />
            <span className="truncate">{col.badge}</span>
          </div>

          <div className="inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] min-[360px]:text-[9px] sm:text-[11px] font-bold text-white/95 bg-black/60 backdrop-blur-md border border-white/20 shadow-sm shrink-0">
            <span>{col.itemCount.toLocaleString()}</span>
            <span className="hidden min-[380px]:inline ml-0.5">items</span>
          </div>
        </div>

        {/* BOTTOM CONTENT LAYER */}
        <div className="relative z-10 p-2 sm:p-3 md:p-3.5 mt-auto flex flex-col justify-end pointer-events-none">
          {/* Eyebrow Label with Glowing Status Dot */}
          <div className="flex items-center gap-1 mb-0.5">
            <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${themeStyles.dotBg} animate-pulse shrink-0`} />
            <span className={`text-[7.5px] min-[360px]:text-[8.5px] sm:text-[10px] md:text-[11px] font-black uppercase tracking-wider ${themeStyles.eyebrowColor} drop-shadow-sm truncate`}>
              {col.eyebrow}
            </span>
          </div>

          {/* Collection Title */}
          <h3 className={`text-xs sm:text-base md:text-lg lg:text-xl font-black text-white tracking-tight leading-tight m-0 font-display drop-shadow-md ${themeStyles.titleHover} transition-colors truncate`}>
            {col.title}
          </h3>

          {/* Tagline / Description - shown on tablet and desktop, cleanly hidden on small mobile to stay short */}
          <p className="hidden sm:block text-[11px] md:text-xs text-white/90 mt-0.5 sm:mt-1 line-clamp-1 leading-relaxed m-0 drop-shadow-sm font-medium">
            {col.tagline}
          </p>

          {/* Bottom Action CTA Row */}
          <div className="mt-1 sm:mt-2 pt-1 sm:pt-1.5 border-t border-white/15 flex items-center justify-between gap-1.5">
            <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-white group-hover:text-white transition-colors truncate">
              <span className="hidden sm:inline">{col.ctaText}</span>
              <span className="sm:hidden">Shop Collection</span>
            </span>
            <div className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-white/20 ${themeStyles.ctaHover} text-white flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm group-hover:scale-110`}>
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      id="featured-collections"
      className="w-full max-w-[1040px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-12 box-border overflow-hidden"
      aria-label="Featured Collections"
    >
      {/* Section Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-7 md:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-purple-500/10 border border-rose-200/80 text-[#D30915] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 sm:mb-2 shadow-2xs">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D30915] animate-pulse" />
            <span>Founder Curated Collections</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#141219] tracking-tight font-display m-0">
            Featured Collections
          </h2>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-0.5 sm:mt-1 max-w-2xl leading-relaxed">
            Prioritized upcoming holiday specials & signature cash reveals. Real cash or jewelry in every item.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-end">
          <div className="hidden min-[480px]:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] sm:text-xs font-bold border border-emerald-200">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
            <span>Cash & Jewelry Verified</span>
          </div>

          <button
            type="button"
            onClick={() => onSelectCategory?.('All Surprises')}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-rose-50 text-[#D30915] border border-rose-200 text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* ROW 1: Upcoming Holiday Collections (Halloween & Christmas) */}
      <div className="mb-5 sm:mb-7 md:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-3.5 pb-1.5 sm:pb-2 border-b border-[#eedbe6]/70">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shadow-2xs shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-[#141219] uppercase tracking-wider font-display m-0">
              Row 1: Upcoming Holiday Collections
            </h3>
          </div>

          <div className="hidden min-[480px]:inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-amber-200">
            <Flame className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Limited Seasonal Editions • Holiday Priority</span>
          </div>
        </div>

        {/* 2 cards per line on mobile: grid-cols-2 at all breakpoints */}
        <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-5 md:gap-6">
          {row1Cards.map((col, idx) => renderCard(col, idx, 1))}
        </div>
      </div>

      {/* ROW 2: Signature Cash Candles (Cash Candles & Zodiac Cash Candles) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-2.5 sm:mb-3.5 pb-1.5 sm:pb-2 border-b border-[#eedbe6]/70">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-[#141219] uppercase tracking-wider font-display m-0">
              Row 2: Signature Cash Candles
            </h3>
          </div>

          <div className="hidden min-[480px]:inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200">
            <Gem className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Guaranteed Real Cash Inside ($2 – $2,500)</span>
          </div>
        </div>

        {/* 2 cards per line on mobile: grid-cols-2 at all breakpoints */}
        <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-5 md:gap-6">
          {row2Cards.map((col, idx) => renderCard(col, idx, 2))}
        </div>
      </div>
    </section>
  );
};
