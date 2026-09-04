import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { productsData } from '../../data/products';
import { ProductCard } from '../products/ProductCard';
import { ProductCardSkeleton } from '../ui/ProductCardSkeleton';
import type { Product, CartItem } from '../../types';

interface FeaturedProductsProps {
  cart?: CartItem[];
  searchQuery?: string;
  selectedCategory?: string;
  isLoading?: boolean;
  onSelectCategory?: (category: string) => void;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  onWishlistToggle?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

const filterChips = [
  'All Surprises',
  'Cash Candles',
  'Jewelry Candles',
  'Bath & Body',
  'Wax Melts',
  'Soaps',
  'Slimes',
];

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  cart = [],
  searchQuery = '',
  selectedCategory = 'All Surprises',
  isLoading = false,
  onSelectCategory,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
}) => {
  const activeChip = selectedCategory || 'All Surprises';

  const handleChipClick = (chip: string) => {
    onSelectCategory?.(chip);
  };

  const filteredProducts = useMemo(() => {
    return productsData.filter((product) => {
      // Category filter
      const matchesCategory =
        activeChip === 'All Surprises' ||
        activeChip === 'All' ||
        product.category.toLowerCase() === activeChip.toLowerCase();

      // Search filter
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.surpriseValue && product.surpriseValue.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [activeChip, searchQuery]);

  const getProductQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <section id="featured" data-section="best-sellers" className="relative max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div id="best-sellers" className="absolute -top-20" />

      {/* Header & Quick Category Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-xl font-black text-[#141219] uppercase tracking-wide flex items-center gap-2 m-0 font-display">
            <span>Trending Best Sellers</span>
            {!isLoading && (
              <span className="text-xs font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full lowercase">
                {filteredProducts.length} items
              </span>
            )}
          </h2>
        </div>

        {/* Quick Filter Chips with Tactile Hover Effects */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {filterChips.map((chip) => {
            const isActive = activeChip.toLowerCase() === chip.toLowerCase() || (activeChip === 'All' && chip === 'All Surprises');
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${isActive
                  ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.35)] scale-102'
                  : 'bg-white border border-[#eee7ed] text-[#716d77] hover:border-[#fecdd3] hover:bg-[#fff5f8] hover:text-[#D30915] hover:shadow-2xs'
                  }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dense Quick-Commerce Product Grid (2 mobile / 3 tablet / 4 desktop / 5 xl) */}
      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5 w-full transition-all duration-300"
          role="status"
          aria-label="Loading products"
        >
          {Array.from({ length: 11 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#eee7ed] p-6 shadow-2xs">
          <Sparkles className="w-8 h-8 text-[#D30915] mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-[#141219]">No surprises found matching your filter</h3>
          <p className="text-xs text-[#716d77] mt-1">Try selecting "All Surprises" or clearing your search term.</p>
          <button
            type="button"
            onClick={() => handleChipClick('All Surprises')}
            className="mt-3 px-5 py-2 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-bold shadow-[0_6px_16px_rgba(211, 9, 21,0.28)] hover:shadow-[0_10px_24px_rgba(211, 9, 21,0.38)] hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5 w-full transition-all duration-300">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={getProductQuantity(product.id)}
              onAddToCart={onAddToCart}
              onUpdateQuantity={(id, qty) => onUpdateQuantity?.(id, qty - getProductQuantity(id))}
              onToggleWishlist={() => onWishlistToggle?.(product)}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      )}

    </section>
  );
};
