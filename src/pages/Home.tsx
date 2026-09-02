import React, { useState, useEffect } from 'react';
import { Hero } from '../components/home/Hero';
import { CategorySection } from '../components/home/CategorySection';
import { AffiliateSection } from '../components/home/AffiliateSection';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { ReviewsSection } from '../components/home/ReviewsSection';
import { sessionTracker } from '../utils/sessionTracker';
import type { Product, CartItem } from '../types';

interface HomeProps {
  cart?: CartItem[];
  searchQuery?: string;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onViewAllCategories?: () => void;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

export const Home: React.FC<HomeProps> = ({
  cart = [],
  searchQuery = '',
  selectedCategory = 'All Surprises',
  onSelectCategory,
  onViewAllCategories,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
}) => {
  // Skeleton only shows on first open & page refresh; subsequent visits in same session render immediately
  const [isLoading, setIsLoading] = useState(() => sessionTracker.isFirstVisit('home'));

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <main className="w-full overflow-x-hidden animate-in fade-in duration-300">
      {/* 1. Hero Showcase Banner */}
      <div className="transition-all duration-300">
        <Hero />
      </div>

      {/* 2. Shop by Surprise (Categories & 4-Item Guarantees Bar) */}
      <div className="transition-all duration-300">
        <CategorySection
          isLoading={isLoading}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          onViewAllCategories={onViewAllCategories}
        />
      </div>

      {/* 3. Best Sellers / Featured Products */}
      <div className="transition-all duration-300">
        <FeaturedProducts
          isLoading={isLoading}
          cart={cart}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateQuantity}
          onWishlistToggle={onWishlistToggle}
          onSelectProduct={onSelectProduct}
        />
      </div>

      {/* 4. Affiliate Program (Earn More with I Love Surprises & Commission Structure) */}
      <div className="transition-all duration-300">
        <AffiliateSection isLoading={isLoading} />
      </div>

      {/* 5. Customer Reviews & Social Proof Numbers Strip */}
      <div className="transition-all duration-300">
        <ReviewsSection isLoading={isLoading} />
      </div>
    </main>
  );
};
