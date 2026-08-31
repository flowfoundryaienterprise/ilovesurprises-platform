import React from 'react';
import { Hero } from '../components/home/Hero';
import { CategorySection } from '../components/home/CategorySection';
import { AffiliateSection } from '../components/home/AffiliateSection';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { ReviewsSection } from '../components/home/ReviewsSection';
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
  return (
    <main className="w-full overflow-x-hidden animate-in fade-in duration-300">
      {/* 1. Hero Showcase Banner */}
      <div className="transition-all duration-300">
        <Hero />
      </div>

      {/* 2. Shop by Surprise (Categories & 4-Item Guarantees Bar) */}
      <div className="transition-all duration-300">
        <CategorySection
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          onViewAllCategories={onViewAllCategories}
        />
      </div>

      {/* 3. Best Sellers / Featured Products */}
      <div className="transition-all duration-300">
        <FeaturedProducts
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
        <AffiliateSection />
      </div>

      {/* 5. Customer Reviews & Social Proof Numbers Strip */}
      <div className="transition-all duration-300">
        <ReviewsSection />
      </div>
    </main>
  );
};
