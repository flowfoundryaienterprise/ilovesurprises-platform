import React from 'react';
import { Hero } from '../components/home/Hero';
import { PromoBanners } from '../components/home/PromoBanners';
import { CategorySection } from '../components/home/CategorySection';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { SurpriseExperience } from '../components/home/SurpriseExperience';
import { AffiliateSection } from '../components/home/AffiliateSection';
import { ReviewsSection } from '../components/home/ReviewsSection';
import type { Product, CartItem } from '../types';

interface HomeProps {
  cart?: CartItem[];
  searchQuery?: string;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
}

export const Home: React.FC<HomeProps> = ({
  cart = [],
  searchQuery = '',
  selectedCategory = 'All Surprises',
  onSelectCategory,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
}) => {
  return (
    <main className="w-full overflow-x-hidden animate-in fade-in duration-300">
      {/* 2. Hero (Compact Promotional Shopping Banner) */}
      <div className="transition-all duration-300">
        <Hero />
      </div>

      {/* TWO PROMOTIONAL BANNERS (Quick-Commerce Side-by-Side Banners) */}
      <div className="transition-all duration-300">
        <PromoBanners onSelectCategory={onSelectCategory} />
      </div>

      {/* 3. Shop by Category (Compact Quick-Commerce Avatars with Horizontal Scroll) */}
      <div className="transition-all duration-300">
        <CategorySection
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </div>

      {/* 4. Featured / Best Sellers (Dense 2/3/4/5 Grid with Filter Chips & ADD Stepper) */}
      <div className="transition-all duration-300">
        <FeaturedProducts
          cart={cart}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateQuantity}
          onWishlistToggle={onWishlistToggle}
        />
      </div>

      {/* 5. Surprise Experience (Shopping Discovery Banner) */}
      <div className="transition-all duration-300">
        <SurpriseExperience />
      </div>

      {/* 6. Affiliate Program (Compact 20% Rep Promotional Card) */}
      <div className="transition-all duration-300">
        <AffiliateSection />
      </div>

      {/* 7. Customer Reviews / Trust (Compact Testimonial Strip) */}
      <div className="transition-all duration-300">
        <ReviewsSection />
      </div>
    </main>
  );
};
