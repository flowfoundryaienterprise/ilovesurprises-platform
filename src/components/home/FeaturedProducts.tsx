import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { productsData } from '../../data/products';
import { productService } from '../../services/productService';
import { deduplicateProducts } from '../../utils/productUtils';
import { ProductCard } from '../products/ProductCard';
import { ProductCardSkeleton } from '../ui/ProductCardSkeleton';
import type { Product, CartItem } from '../../types';

interface FeaturedProductsProps {
  cart?: CartItem[];
  wishlistIds?: string[];
  searchQuery?: string;
  selectedCategory?: string;
  isLoading?: boolean;
  onSelectCategory?: (category: string) => void;
  onNavigateToShop?: () => void;
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
  wishlistIds = [],
  searchQuery = '',
  selectedCategory = 'All Surprises',
  isLoading = false,
  onSelectCategory,
  onNavigateToShop,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
}) => {
  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);
  // If selectedCategory is an unknown subcategory or empty, normalize to 'All Surprises'
  const isKnownChip = filterChips.some(
    (chip) => chip.toLowerCase() === (selectedCategory || '').toLowerCase()
  );
  const activeChip = isKnownChip ? selectedCategory : 'All Surprises';

  const [liveProducts, setLiveProducts] = useState<Product[] | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(true);
  const chipCacheRef = useRef<Record<string, Product[]>>({});

  useEffect(() => {
    let isCancelled = false;

    // Check in-memory chip cache first
    if (chipCacheRef.current[activeChip]) {
      setLiveProducts(chipCacheRef.current[activeChip]);
      setIsFetchingLive(false);
      return;
    }

    setIsFetchingLive(true);

    const loadProducts = async () => {
      try {
        if (activeChip === 'All Surprises') {
          // Fetch 60 diverse, distinct products interleaved across all categories
          const diverse = await productService.getDiverseFeaturedProducts(60);
          if (!isCancelled) {
            chipCacheRef.current[activeChip] = diverse;
            setLiveProducts(diverse);
            setIsFetchingLive(false);
          }
        } else {
          // Fetch category products and deduplicate repetitive series concepts
          const res = await productService.getProducts({
            category: activeChip,
            limit: 90,
            sort: 'best-sellers',
          });

          if (!isCancelled) {
            if (res && res.products.length > 0) {
              const getRootConcept = (name: string) => {
                return name
                  .toLowerCase()
                  .replace(/(\d+)\s*(year|years|oz|pack|piece|pc|clean|sober)/gi, '')
                  .replace(
                    /(candles|candle|wax melts|wax melt|bath bombs|bath bomb|greeting cards|greeting card|goat milk soaps|goat milk soap|slimes|slime|diamond carat candle)/gi,
                    ''
                  )
                  .replace(/[^a-z0-9]/gi, ' ')
                  .trim()
                  .slice(0, 14);
              };

              const seenConcepts = new Set<string>();
              const seenIds = new Set<string>();
              const diverseCategoryProducts: Product[] = [];

              for (const p of res.products) {
                if (seenIds.has(p.id)) continue;
                const concept = getRootConcept(p.name);
                if (concept.length > 3 && seenConcepts.has(concept)) continue;

                seenIds.add(p.id);
                if (concept.length > 3) seenConcepts.add(concept);
                diverseCategoryProducts.push(p);
                if (diverseCategoryProducts.length >= 60) break;
              }

              // Backfill up to 60 if needed
              if (diverseCategoryProducts.length < 50) {
                for (const p of res.products) {
                  if (!seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    diverseCategoryProducts.push(p);
                    if (diverseCategoryProducts.length >= 60) break;
                  }
                }
              }

              chipCacheRef.current[activeChip] = diverseCategoryProducts;
              setLiveProducts(diverseCategoryProducts);
            } else {
              setLiveProducts([]);
            }
            setIsFetchingLive(false);
          }
        }
      } catch (err) {
        console.warn('Error fetching homepage featured products from Supabase:', err);
        if (!isCancelled) {
          setIsFetchingLive(false);
        }
      }
    };

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [activeChip]);

  const handleChipClick = (chip: string) => {
    onSelectCategory?.(chip);
  };

  // Fallback in-memory list (used only if Supabase request fails or during SSR)
  const fallbackFilteredProducts = useMemo(() => {
    const list = productsData.filter((product) => {
      const matchesCategory =
        !activeChip ||
        activeChip === 'All Surprises' ||
        activeChip === 'All' ||
        product.category.toLowerCase() === activeChip.toLowerCase() ||
        product.name.toLowerCase().includes(activeChip.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(activeChip.toLowerCase())) ||
        (product.scentNotes && product.scentNotes.some((s) => s.toLowerCase().includes(activeChip.toLowerCase())));

      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    return list.length > 0 ? list : productsData;
  }, [activeChip, searchQuery]);

  // Strictly deduplicate products to guarantee unique product cards
  const displayedProducts = useMemo(() => {
    if (liveProducts !== null) {
      return deduplicateProducts(liveProducts);
    }
    return deduplicateProducts(fallbackFilteredProducts);
  }, [liveProducts, fallbackFilteredProducts]);

  const getProductQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const isCardLoading = isLoading || (isFetchingLive && !liveProducts);

  return (
    <section id="featured" data-section="best-sellers" className="relative max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <div id="best-sellers" className="absolute -top-20" />

      {/* Header & Quick Category Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 min-w-0 max-w-full">
        <div>
          <h2 className="text-base sm:text-xl font-black text-[#141219] uppercase tracking-wide flex items-center gap-2 m-0 font-display">
            <span>Trending Best Sellers</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-normal px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#D30915] normal-case">
              <Sparkles className="w-3 h-3" />
              Live Catalog
            </span>
          </h2>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Discover real hidden cash prizes and genuine certified jewelry surprises
          </p>
        </div>

        {/* Scrollable Filter Chips */}
        <div
          role="tablist"
          aria-label="Filter products by category"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full -mx-1 px-1 sm:mx-0 sm:px-0"
        >
          {filterChips.map((chip) => {
            const isActive = activeChip === chip;
            return (
              <button
                key={chip}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleChipClick(chip)}
                className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#141219] text-white shadow-2xs'
                    : 'bg-[#f4edf2] text-[#554f5c] hover:bg-[#ebdce5] hover:text-[#141219]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
          gap: '16px',
        }}
      >
        {isCardLoading
          ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={getProductQuantity(product.id)}
                onAddToCart={onAddToCart}
                onUpdateQuantity={onUpdateQuantity}
                onToggleWishlist={() => onWishlistToggle?.(product)}
                onSelectProduct={onSelectProduct}
                isWishlisted={wishlistSet.has(product.id)}
              />
            ))}
      </div>

      {/* Empty State */}
      {!isCardLoading && displayedProducts.length === 0 && (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-200 mt-4">
          <p className="text-sm font-bold text-gray-700">No surprises found in this category.</p>
          <button
            type="button"
            onClick={() => handleChipClick('All Surprises')}
            className="mt-3 text-xs font-bold text-[#D30915] hover:underline cursor-pointer"
          >
            View All Surprises
          </button>
        </div>
      )}

      {/* Explore Full Catalog Link */}
      {!isCardLoading && displayedProducts.length >= 50 && (
        <div className="mt-8 text-center">
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateToShop) {
                onNavigateToShop();
              } else {
                window.history.pushState({ view: 'shop', category: 'All Surprises' }, '', '/shop');
                window.dispatchEvent(new CustomEvent('ils_route_change', { detail: { route: 'shop' } }));
                window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'shop', category: 'All Surprises' } }));
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#141219] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#D30915] transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            <span>Explore All 57,000+ Surprises in Shop</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      )}
    </section>
  );
};
