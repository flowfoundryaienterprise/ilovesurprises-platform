import React from 'react';
import { Heart, Plus, Minus, Star, Sparkles } from 'lucide-react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  cartQuantity?: number;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onToggleWishlist?: (productId: string) => void;
  onSelectProduct?: (product: Product) => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  cartQuantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  onSelectProduct,
  isWishlisted = false,
}) => {
  const handleCardClick = () => {
    onSelectProduct?.(product);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity?.(product.id, cartQuantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity?.(product.id, Math.max(0, cartQuantity - 1));
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div
      id={`product-${product.id}`}
      onClick={handleCardClick}
      className="group relative rounded-[20px] bg-white border border-[#eee7ed] hover:border-[#f1b8cb] p-3 sm:p-3.5 flex flex-col justify-between shadow-[0_2px_12px_rgba(50,31,63,0.03)] hover:shadow-[0_12px_32px_rgba(50,31,63,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden max-w-full"
    >
      {/* Product Image Container with Hardware-Accelerated Isolated Overflow Clipping */}
      <div className="relative w-full max-w-full aspect-square rounded-[14px] overflow-hidden bg-white border border-[#f5edf2] mb-2.5 flex items-center justify-center isolate">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full max-w-full object-contain p-1.5 transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
          loading="lazy"
        />

        {/* Top-Left Badges Stack with Proper Flex Spacing & No Overlap */}
        <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1 max-w-[calc(100%-36px)] z-10">
          {discountPercent && (
            <span className="px-2 py-0.5 rounded-full bg-[#ec2f73] text-white text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs">
              {discountPercent}% OFF
            </span>
          )}

          {product.badge && !discountPercent && (
            <span className="px-2 py-0.5 rounded-full bg-[#141219] text-white text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs truncate max-w-[90px]">
              {product.badge}
            </span>
          )}
        </div>

        {/* Wishlist Button with Hover Glow */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-90 z-20 ${
            isWishlisted
              ? 'bg-[#ec2f73] text-white shadow-[0_4px_12px_rgba(236,47,115,0.3)]'
              : 'bg-white/90 hover:bg-white text-[#716d77] hover:text-[#ec2f73] hover:shadow-[0_4px_12px_rgba(236,47,115,0.2)] hover:scale-110'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Surprise Pill Tag at Bottom of Image with Strict Truncation and No Overflow */}
        {product.surpriseValue && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-white/95 backdrop-blur-xs rounded-[8px] px-2 py-0.5 border border-[#f2e6ec] flex items-center gap-1 shadow-2xs z-10 pointer-events-none overflow-hidden max-w-[calc(100%-12px)]">
            <Sparkles className="w-2.5 h-2.5 text-[#ec2f73] shrink-0 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-bold text-[#141219] truncate leading-tight">
              {product.surpriseValue}
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          {/* Rating & Category */}
          <div className="flex items-center justify-between gap-1 text-[10px] mb-1">
            <span className="font-bold text-[#716d77] uppercase tracking-wider truncate">
              {product.category}
            </span>
            <div className="flex items-center gap-0.5 font-extrabold text-[#141219] shrink-0">
              <Star className="w-3 h-3 fill-[#ffa000] text-[#ffa000]" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-[#8a858f] font-normal text-[9px]">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-[13px] font-bold text-[#141219] leading-snug line-clamp-2 m-0 mb-1 group-hover:text-[#ec2f73] transition-colors min-h-[2rem]">
            {product.name}
          </h3>
        </div>

        {/* Price & Quick ADD Stepper Row */}
        <div className="mt-2 pt-2 border-t border-[#f5edf2] flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black text-[#141219] leading-none">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] text-[#817c85] line-through mt-0.5">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Quick-Commerce ADD Button with Hover Elevation & Glow */}
          {cartQuantity === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className="h-[32px] sm:h-[34px] px-3.5 rounded-[10px] bg-[#fff3f7] hover:bg-[#ec2f73] text-[#ec2f73] hover:text-white border border-[#f5cad7] hover:border-[#ec2f73] text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs hover:shadow-[0_6px_20px_rgba(236,47,115,0.32)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>ADD</span>
            </button>
          ) : (
            <div className="h-[32px] sm:h-[34px] rounded-[10px] bg-[#ec2f73] text-white flex items-center px-1 font-black text-xs shadow-[0_6px_18px_rgba(236,47,115,0.28)]">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-6 h-6 rounded-[7px] flex items-center justify-center hover:bg-black/15 active:scale-90 transition-all cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <span className="w-6 text-center text-xs font-black select-none">
                {cartQuantity}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                className="w-6 h-6 rounded-[7px] flex items-center justify-center hover:bg-black/15 active:scale-90 transition-all cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
