import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';
import { categoriesData } from '../../data/categories';
import { CategorySkeleton } from '../ui/CategorySkeleton';

interface CategorySectionProps {
  selectedCategory?: string;
  isLoading?: boolean;
  onSelectCategory?: (categoryId: string) => void;
  onViewAllCategories?: () => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  selectedCategory,
  isLoading = false,
  onSelectCategory,
  onViewAllCategories,
}) => {
  return (
    <section id="categories" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-6 sm:py-8">

      {/* Section Header Matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
        <div>
          <span className="block text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-[#D30915] mb-1">
            Explore
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#141219] tracking-tight m-0 font-display">
            Shop by Surprise
          </h2>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1">
            Choose your favorite way to reveal something unexpected.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onViewAllCategories ? onViewAllCategories() : onSelectCategory?.('All Surprises')}
          className="text-xs sm:text-sm font-bold text-[#D30915] hover:underline self-start sm:self-end cursor-pointer"
        >
          View all collections →
        </button>
      </div>

      {/* 6 Category Cards Grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8"
          role="status"
          aria-label="Loading categories"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <CategorySkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {categoriesData.map((category) => {
            const isSelected = selectedCategory === category.name || selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory?.(category.name)}
                className={`p-3.5 sm:p-4 rounded-[20px] border transition-all duration-300 flex flex-col items-center text-center cursor-pointer group hover:-translate-y-1.5 active:translate-y-0 active:scale-95 ${isSelected
                  ? 'border-[#D30915] bg-[#fff1f2] shadow-[0_8px_24px_rgba(211, 9, 21,0.18)]'
                  : 'border-[#eee7ed] bg-white hover:border-[#f1b8cb] hover:bg-[#fff9fb] shadow-[0_4px_16px_rgba(50,31,63,0.03)] hover:shadow-[0_12px_28px_rgba(50,31,63,0.08)]'
                  }`}
              >
                {/* Category Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] overflow-hidden bg-gradient-to-b from-[#fffafb] to-[#fff1f6] p-1 flex items-center justify-center mb-3 shadow-2xs isolate">
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 will-change-transform"
                  />
                </div>

                {/* Title */}
                <strong className={`block text-xs sm:text-[13px] font-black leading-tight mb-1 ${isSelected ? 'text-[#D30915]' : 'text-[#141219] group-hover:text-[#D30915]'
                  }`}>
                  {category.name}
                </strong>

                {/* Tagline */}
                <span className="text-[10px] sm:text-[11px] text-[#716d77] leading-tight line-clamp-2 font-medium">
                  {category.tagline}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4-Item Guarantees Trust Bar (2 per line on mobile, exact same size and line heights) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 items-stretch w-full">
        {/* Item 1 */}
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-white border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-2xs h-full min-h-[58px] sm:min-h-[68px]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate leading-tight">
              100% Guarantee
            </strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate leading-tight mt-0.5 font-medium">
              Love it or make it right
            </span>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-white border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-2xs h-full min-h-[58px] sm:min-h-[68px]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate leading-tight">
              Free Shipping $75+
            </strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate leading-tight mt-0.5 font-medium">
              Fast & reliable delivery
            </span>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-white border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-2xs h-full min-h-[58px] sm:min-h-[68px]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate leading-tight">
              30-Day Returns
            </strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate leading-tight mt-0.5 font-medium">
              Hassle-free process
            </span>
          </div>
        </div>

        {/* Item 4 */}
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-white border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-2xs h-full min-h-[58px] sm:min-h-[68px]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate leading-tight">
              Secure Checkout
            </strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate leading-tight mt-0.5 font-medium">
              Safe & encrypted
            </span>
          </div>
        </div>
      </div>

    </section>
  );
};
