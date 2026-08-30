import React from 'react';
import { categoriesData } from '../../data/categories';

interface CategorySectionProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-2 sm:py-3">
      
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm sm:text-base font-black text-[#141219] uppercase tracking-wider flex items-center gap-1.5 font-display">
          <span>Explore Categories</span>
          <span className="text-[11px] font-bold text-[#ec2f73] lowercase">({categoriesData.length} surprise collections)</span>
        </h2>

        <a
          href="#featured"
          className="text-xs font-bold text-[#ec2f73] hover:underline"
        >
          View All →
        </a>
      </div>

      {/* Horizontal Scroll on Mobile / Dense Grid on Desktop with Safe Vertical Padding to Prevent Hover Clipping */}
      <div className="flex sm:grid sm:grid-cols-6 gap-2.5 sm:gap-3.5 overflow-x-auto sm:overflow-visible pt-1.5 pb-3 px-0.5 scrollbar-none snap-x">
        {categoriesData.map((category) => {
          const isSelected = selectedCategory === category.name || selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory?.(category.name)}
              className={`flex-1 min-w-[100px] sm:min-w-0 p-3 rounded-[18px] border transition-all duration-200 flex flex-col items-center text-center cursor-pointer snap-start shrink-0 group hover:-translate-y-1 active:translate-y-0 active:scale-95 ${
                isSelected
                  ? 'border-[#ec2f73] bg-[#fff0f5] shadow-[0_6px_20px_rgba(236,47,115,0.2)]'
                  : 'border-[#eee7ed] bg-white hover:border-[#f1b8cb] hover:bg-[#fff9fb] shadow-2xs hover:shadow-[0_8px_24px_rgba(50,31,63,0.08)]'
              }`}
            >
              {/* Compact Circular Image Capsule with Strict Rounded Containment */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-to-b from-[#fffafb] to-[#fff1f6] border border-[#f5e4ec] p-1 flex items-center justify-center mb-2 shadow-2xs isolate">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110 will-change-transform"
                />
              </div>

              {/* Title */}
              <span className={`text-[11px] sm:text-xs font-black leading-tight line-clamp-1 ${
                isSelected ? 'text-[#ec2f73]' : 'text-[#141219] group-hover:text-[#ec2f73]'
              }`}>
                {category.name}
              </span>

              <span className="text-[9px] text-[#716d77] mt-0.5 hidden sm:block truncate max-w-full font-medium">
                {category.tagline.split(' ')[0]} inside
              </span>
            </button>
          );
        })}
      </div>

    </section>
  );
};
