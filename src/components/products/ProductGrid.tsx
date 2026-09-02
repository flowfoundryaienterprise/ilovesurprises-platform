import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '../ui/ProductCardSkeleton';
import type { Product, CartItem } from '../../types';

interface ProductGridProps {
  products: Product[];
  cart?: CartItem[];
  wishlistIds?: string[];
  isLoading?: boolean;
  skeletonCount?: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  emptyMessage?: string;
  onResetFilters?: () => void;
  isFullWidth?: boolean;
}

// Default skeleton count is 11 (Existing 8 count + 3 additional skeleton cards)
export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  cart = [],
  wishlistIds = [],
  isLoading = false,
  skeletonCount = 11,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
  emptyMessage = 'No surprise products match your selected filters.',
  onResetFilters,
  isFullWidth = false,
}) => {
  const gridClasses = isFullWidth
    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
    : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4';

  if (isLoading) {
    return (
      <div
        className={`grid gap-3.5 sm:gap-4 lg:gap-5 w-full transition-all duration-300 ${gridClasses}`}
        role="status"
        aria-label="Loading products"
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full py-16 px-4 text-center rounded-[24px] bg-[#fffafc] border border-[#f1dbe8] my-6">
        <div className="w-14 h-14 rounded-full bg-[#fff0f5] text-[#ec2f73] border border-[#f5cad7] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-[#141219] mb-1 font-display">
          No Products Found
        </h3>
        <p className="text-xs sm:text-sm text-[#716d77] max-w-md mx-auto mb-5 font-medium">
          {emptyMessage}
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(236,47,115,0.25)] active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-3.5 sm:gap-4 lg:gap-5 w-full transition-all duration-300 ${gridClasses}`}>
      {products.map((product) => {
        const cartItem = cart.find((item) => item.product.id === product.id);
        const isWishlisted = wishlistIds.includes(product.id);

        return (
          <ProductCard
            key={product.id}
            product={product}
            cartQuantity={cartItem?.quantity || 0}
            onAddToCart={onAddToCart}
            onUpdateQuantity={(id, qty) => {
              const currentQty = cartItem?.quantity || 0;
              onUpdateQuantity(id, qty - currentQty);
            }}
            onToggleWishlist={() => onWishlistToggle(product)}
            onSelectProduct={onSelectProduct}
            isWishlisted={isWishlisted}
          />
        );
      })}
    </div>
  );
};
