import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '../ui/ProductCardSkeleton';
import { productsData } from '../../data/products';
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
  searchQuery?: string;
}

// Default skeleton count is 15 (covers 3 complete 5-col rows on desktop or 5 complete 3-col rows on tablet)
export const ProductGrid: React.FC<ProductGridProps> = React.memo(({
  products,
  cart = [],
  wishlistIds = [],
  isLoading = false,
  skeletonCount = 15,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
  emptyMessage = 'No surprise products match your selected filters.',
  onResetFilters,
  isFullWidth = false,
  searchQuery = '',
}) => {
  const gridClasses = isFullWidth
    ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
    : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4';

  // Responsive column detection for desktop grid alignment
  const [columns, setColumns] = useState<number>(() => {
    if (typeof window === 'undefined') return isFullWidth ? 5 : 4;
    const w = window.innerWidth;
    if (w >= 1280) return isFullWidth ? 5 : 4;
    if (w >= 1024) return isFullWidth ? 4 : 3;
    if (w >= 768) return 3;
    return 2;
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      let cols = 2;
      if (w >= 1280) cols = isFullWidth ? 5 : 4;
      else if (w >= 1024) cols = isFullWidth ? 4 : 3;
      else if (w >= 768) cols = 3;
      setColumns(cols);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullWidth]);

  // Desktop empty space filler:
  // On desktop (lg & xl >= 1024px), if a search or query leaves exactly 1 empty space on the last row
  // (e.g. 4 items in a 5-column row, 9, 14, 19, 24 items, or 3 items in a 4-column row),
  // OR if searching returns a single product, fill the last line's empty space with a surprise reveal product.
  const displayedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const isDesktop = columns >= 4;
    if (!isDesktop) return products;

    const remainder = products.length % columns;
    const hasOneEmptySpaceOnLastLine = remainder === columns - 1;
    const isSingleSearchResult = Boolean(
      searchQuery && searchQuery.trim().length > 0 && products.length === 1
    );

    if (hasOneEmptySpaceOnLastLine || isSingleSearchResult) {
      const existingIds = new Set(products.map((p) => p.id));
      const candidate =
        productsData.find(
          (p) => !existingIds.has(p.id) && p.inStock !== false && p.isBestSeller
        ) ||
        productsData.find(
          (p) =>
            !existingIds.has(p.id) &&
            p.inStock !== false &&
            (p.surpriseType === 'cash' || p.surpriseType === 'jewelry')
        ) ||
        productsData.find((p) => !existingIds.has(p.id) && p.inStock !== false);

      if (candidate) {
        const fillerProduct: Product = {
          ...candidate,
          badge: candidate.badge || 'Surprise Pick',
        };
        return [...products, fillerProduct];
      }
    }

    return products;
  }, [products, columns, searchQuery]);

  const cartQuantityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < cart.length; i++) {
      map[cart[i].product.id] = cart[i].quantity;
    }
    return map;
  }, [cart]);

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  const handleUpdate = useCallback(
    (productId: string, newQty: number) => {
      const currentQty = cartQuantityMap[productId] || 0;
      onUpdateQuantity(productId, newQty - currentQty);
    },
    [cartQuantityMap, onUpdateQuantity]
  );

  const handleToggle = useCallback(
    (productId: string) => {
      const target = displayedProducts.find((p) => p.id === productId);
      if (target) {
        onWishlistToggle(target);
      }
    },
    [displayedProducts, onWishlistToggle]
  );

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
        <div className="w-14 h-14 rounded-full bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mx-auto mb-3 shadow-xs">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.25)] hover:shadow-[0_12px_24px_rgba(211,9,21,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer"
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
      {displayedProducts.map((product) => {
        const qty = cartQuantityMap[product.id] || 0;
        const isWishlisted = wishlistSet.has(product.id);

        return (
          <ProductCard
            key={product.id}
            product={product}
            cartQuantity={qty}
            onAddToCart={onAddToCart}
            onUpdateQuantity={handleUpdate}
            onToggleWishlist={handleToggle}
            onSelectProduct={onSelectProduct}
            isWishlisted={isWishlisted}
          />
        );
      })}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';
