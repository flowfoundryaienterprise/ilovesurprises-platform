import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  DollarSign,
  Gem,
  CheckCircle2,
} from 'lucide-react';
import { ProductGallery } from '../components/products/ProductGallery';
import { ProductCard } from '../components/products/ProductCard';
import { productsData } from '../data/products';
import type { Product, CartItem } from '../types';

interface ProductDetailsProps {
  product: Product;
  cart?: CartItem[];
  wishlistIds?: string[];
  onBackToShop: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onOpenCart?: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  cart = [],
  wishlistIds = [],
  onBackToShop,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
  onOpenCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('Classic 14oz');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product.id]);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Related products from the same category
  const relatedProducts = productsData
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const alternateImages = relatedProducts.slice(0, 3).map((p) => p.image);

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
  };

  const handleBuyNowClick = () => {
    onAddToCart(product, quantity);
    onOpenCart?.();
  };

  return (
    <div className="w-full max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-8 overflow-hidden animate-in fade-in duration-300">

      {/* Breadcrumb Navigation & Back to Shop Action */}
      <div className="flex items-center justify-between gap-2 mb-6 pb-3 border-b border-[#f2edf1] w-full max-w-full overflow-hidden">
        <button
          type="button"
          onClick={onBackToShop}
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#ec2f73] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Surprises</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#716d77] font-medium">
          <span>Home</span>
          <span>/</span>
          <span>Shop</span>
          <span>/</span>
          <span className="text-[#141219] font-bold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Main Product Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 mb-14 w-full max-w-full overflow-hidden items-start">

        {/* Left Column: Interactive Image Gallery with Hover Zoom & Lightbox */}
        <div className="lg:col-span-6 xl:col-span-5 w-full max-w-full overflow-hidden lg:sticky lg:top-[110px]">
          <ProductGallery
            mainImage={product.image}
            productName={product.name}
            alternateImages={alternateImages}
            badge={product.badge}
            surpriseValue={product.surpriseValue}
          />
        </div>

        {/* Right Column: Product Info, Surprise Card & Purchase Controls */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between w-full max-w-full overflow-hidden">
          <div>

            {/* Category & Ratings Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#ec2f73] bg-[#fff0f5] px-3 py-1 rounded-full border border-[#f5cad7]">
                {product.category}
              </span>

              <div className="flex items-center gap-1 text-xs font-extrabold text-[#141219]">
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span>{product.rating.toFixed(1)}</span>
                <span className="text-[#8a858f] font-normal">({product.reviewCount} verified reviews)</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#141219] tracking-tight leading-tight m-0 mb-3 font-display">
              {product.name}
            </h1>

            {/* Price & Savings Pill */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
              <div className="text-2xl sm:text-3xl font-black text-[#141219]">
                ${product.price.toFixed(2)}
              </div>

              {product.originalPrice && (
                <div className="text-sm sm:text-base text-[#8a858f] line-through font-medium">
                  ${product.originalPrice.toFixed(2)}
                </div>
              )}

              {discountPercent && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#ec2f73] text-white text-[10.5px] sm:text-xs font-black uppercase tracking-wider shrink-0 shadow-2xs">
                  Save {discountPercent}%
                </span>
              )}

              <span className="text-[10.5px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                In Stock & Ready to Ship
              </span>
            </div>

            {/* Surprise Reveal Guarantee Feature Card */}
            <div className="p-4 rounded-[18px] bg-gradient-to-r from-[#fff3f7] via-[#fff8fb] to-[#fff3f7] border border-[#f5cad7] mb-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-[#ec2f73] text-white flex items-center justify-center shrink-0">
                  {product.surpriseType === 'cash' ? (
                    <DollarSign className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Gem className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#141219] m-0 leading-tight">
                    {product.surpriseType === 'cash'
                      ? 'Guaranteed Real Cash Prize Inside'
                      : 'Guaranteed Fine Jewelry Inside'}
                  </h4>
                  <p className="text-[11px] text-[#ec2f73] font-black m-0">
                    {product.surpriseValue || 'Authentic Reveal in Every Jar'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#55505a] leading-relaxed m-0 font-medium pl-9">
                Every single handcrafted product holds a sealed, waterproof, heat-resistant capsule with your guaranteed surprise. Burn or unwrap to reveal your treasure!
              </p>
            </div>

            {/* Scent Notes & Aroma Profile */}
            {product.scentNotes && product.scentNotes.length > 0 && (
              <div className="mb-5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#8a858f] mb-2">
                  Aromatic Scent Notes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.scentNotes.map((note, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-[10px] bg-white border border-[#ebdce5] text-xs font-bold text-[#141219] shadow-2xs"
                    >
                      🌸 {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Size / Jar Selection */}
            <div className="mb-6">
              <span className="block text-[11px] font-black uppercase tracking-wider text-[#8a858f] mb-2">
                Select Option / Size
              </span>
              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                {[
                  { label: 'Classic 14oz', value: 'Classic 14oz', sub: 'Standard' },
                  { label: 'Deluxe 21oz', value: 'Deluxe 21oz (+$8)', sub: '+$8.00' },
                  { label: 'Travel 8oz', value: 'Mini Travel 8oz (-$6)', sub: '-$6.00' },
                ].map((sizeItem) => (
                  <button
                    key={sizeItem.value}
                    type="button"
                    onClick={() => setSelectedSize(sizeItem.value)}
                    className={`py-2 px-1.5 sm:px-3.5 rounded-[12px] text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${selectedSize === sizeItem.value
                      ? 'border-[#ec2f73] bg-[#fff0f5] text-[#ec2f73] font-black shadow-xs ring-2 ring-[#ec2f73]/15'
                      : 'border-[#ebdce5] bg-white text-[#55505a] hover:border-[#f1b8cb]'
                      }`}
                  >
                    <span className="text-[11px] sm:text-xs font-bold truncate max-w-full">
                      {sizeItem.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] opacity-75 font-medium">
                      {sizeItem.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <span className="block text-[11px] font-black uppercase tracking-wider text-[#8a858f] mb-1.5">
                Product Details & Experience
              </span>
              <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed m-0 font-medium">
                {product.description ||
                  'Crafted with 100% natural organic soy wax, clean aromatic oils, and lead-free cotton wicks for a long-lasting, clean burn. Hand-poured in the USA.'}
              </p>
            </div>

            {/* Quantity Stepper & Add to Cart Controls - Responsive & Mobile-Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 mb-6 pt-4 border-t border-[#f2edf1]">

              {/* Row 1 on Mobile: Stepper (- 1 +) side-by-side directly next to [Add to Cart] */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Stepper with Large Accessible Tap Targets */}
                <div className="flex items-center shrink-0 h-[48px] rounded-[16px] bg-[#f8f5f7] border border-[#ebdce5] p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className={`w-9 sm:w-10 h-full rounded-[12px] flex items-center justify-center font-black transition-all cursor-pointer shadow-2xs active:scale-90 ${quantity <= 1
                      ? 'bg-white/60 text-[#a8a3ad] cursor-not-allowed opacity-60'
                      : 'bg-white hover:bg-[#fff0f5] text-[#141219] hover:text-[#ec2f73] hover:shadow-xs'
                      }`}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                  </button>

                  <span className="w-8 sm:w-10 text-center font-black text-xs sm:text-sm text-[#141219] select-none">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 sm:w-10 h-full rounded-[12px] bg-white hover:bg-[#fff0f5] text-[#141219] hover:text-[#ec2f73] flex items-center justify-center font-black transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-90"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className="flex-1 min-h-[48px] px-3 sm:px-6 rounded-[16px] bg-[#fff0f5] hover:bg-[#ec2f73] text-[#ec2f73] hover:text-white border-2 border-[#ec2f73] text-xs sm:text-sm font-black uppercase tracking-wider shadow-2xs hover:shadow-[0_8px_24px_rgba(236,47,115,0.3)] active:scale-97 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 min-w-0"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span className="truncate">Add to Cart — ${(product.price * quantity).toFixed(2)}</span>
                </button>
              </div>

              {/* Row 2 on Mobile / Inline on Desktop: Ultra-Premium Buy Now CTA */}
              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  className="w-full sm:w-auto min-h-[50px] px-6 sm:px-8 rounded-[16px] bg-gradient-to-r from-[#ec2f73] via-[#ff2e79] to-[#d92467] hover:from-[#d92467] hover:to-[#b81850] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_10px_28px_rgba(236,47,115,0.38)] hover:shadow-[0_14px_36px_rgba(236,47,115,0.52)] active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  {/* Subtle Shimmer Light Sweep */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                  <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                  </div>

                  <span>Buy Now — Fast Checkout</span>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/15 text-white font-extrabold tracking-normal ml-0.5 border border-white/25">
                    1-Click
                  </span>
                </button>
              </div>
            </div>

            {/* 4 Guarantees Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-[16px] bg-[#fffafc] border border-[#f2e6ee] text-[11px] font-bold text-[#55505a]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Win Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Free Shipping $50+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span>30-Day Returns</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#ec2f73] shrink-0" />
                <span>Made in USA</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-[#f2edf1]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="block text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#ec2f73] mb-1">
                More in {product.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#141219] m-0 font-display">
                You May Also Love
              </h3>
            </div>
            <button
              type="button"
              onClick={onBackToShop}
              className="text-xs sm:text-sm font-bold text-[#ec2f73] hover:underline cursor-pointer"
            >
              View Full Collection →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {relatedProducts.map((relProduct) => {
              const relCartItem = cart.find((item) => item.product.id === relProduct.id);
              const relWishlisted = wishlistIds.includes(relProduct.id);

              return (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  cartQuantity={relCartItem?.quantity || 0}
                  onAddToCart={onAddToCart}
                  onUpdateQuantity={(id, qty) => {
                    const currentQty = relCartItem?.quantity || 0;
                    onUpdateQuantity(id, qty - currentQty);
                  }}
                  onToggleWishlist={() => onWishlistToggle(relProduct)}
                  onSelectProduct={onSelectProduct}
                  isWishlisted={relWishlisted}
                />
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
