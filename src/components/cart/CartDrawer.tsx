import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, X, Plus, Minus, ArrowRight, ShieldCheck, Truck, Sparkles, Trash2, Tag, Check, Lock } from 'lucide-react';
import type { CartItem } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  if (typeof document === 'undefined' || !isOpen) return null;

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const rawSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  const discountAmount = appliedPromo ? (rawSubtotal * appliedPromo.discountPercent) / 100 : 0;
  const finalSubtotal = Math.max(0, rawSubtotal - discountAmount);

  const freeShippingThreshold = 50;
  const isFreeShipping = finalSubtotal >= freeShippingThreshold;
  const freeShippingProgress = Math.min(100, (finalSubtotal / freeShippingThreshold) * 100);
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - finalSubtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'VIP15' || code === 'SURPRISE15' || code === 'SPARKLE') {
      setAppliedPromo({ code, discountPercent: 15 });
      setPromoCode('');
    } else if (code === 'WIN20' || code === 'REP20') {
      setAppliedPromo({ code, discountPercent: 20 });
      setPromoCode('');
    } else {
      setPromoError('Invalid code. Try "VIP15" for 15% off!');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-hidden">
      
      {/* Dark Blurred Backdrop with Smooth Fade-in */}
      <div
        className="fixed inset-0 bg-[#141219]/60 backdrop-blur-xs transition-opacity duration-300 ease-out animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel Container with Smooth Slide-in from Right */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto z-10 pointer-events-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-[#eedbe6] animate-in slide-in-from-right duration-300 ease-out">
          
          {/* 1. Header with Mobile Handle */}
          <div className="p-3.5 sm:p-5 border-b border-[#f0e2ec] bg-white sticky top-0 z-10">
            
            {/* Mobile Drag Indicator */}
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-2.5 sm:hidden" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#fff0f5] text-[#ec2f73] border border-[#f5cad7] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#141219] m-0 hero-title-font leading-tight">
                    Your Shopping Bag
                  </h3>
                  <span className="text-[10px] font-bold text-[#716d77]">
                    {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} ready for unboxing
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#fff0f5] text-[#716d77] hover:text-[#ec2f73] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                aria-label="Close cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Dynamic Free Shipping & Prize Guarantee Progress Banner */}
          <div className="px-3.5 sm:px-5 py-2.5 bg-gradient-to-r from-[#fff3f7] via-[#fff8fb] to-[#fbf6ff] border-b border-[#f5e6ee]">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
              <div className="flex items-center gap-1.5 truncate">
                {isFreeShipping ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className="text-emerald-800 font-black truncate">
                      FREE Tracked Shipping Unlocked!
                    </span>
                  </>
                ) : (
                  <>
                    <Truck className="w-3.5 h-3.5 text-[#ec2f73] shrink-0" />
                    <span className="text-[#141219] truncate">
                      Add <strong className="text-[#ec2f73]">${amountToFreeShipping.toFixed(2)}</strong> for Free Shipping
                    </span>
                  </>
                )}
              </div>

              <span className="text-[10px] font-black text-[#ec2f73] bg-white px-2 py-0.5 rounded-full border border-[#f5cad7] shrink-0 ml-1.5">
                {Math.round(freeShippingProgress)}%
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-1.5 bg-[#f0dce6] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-400 rounded-full ${
                  isFreeShipping
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-r from-[#ec2f73] to-[#ff3b83]'
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* 3. Scrollable Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-[#fff0f5] border border-[#f5cad7] text-[#ec2f73] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-[#141219] m-0 mb-1 hero-title-font">Your cart is empty</h4>
                <p className="text-xs text-[#716d77] max-w-xs mx-auto m-0 mb-5 leading-relaxed">
                  Discover aromatic hand-poured soy candles with real cash (<strong className="text-[#141219]">$2 - $2,500</strong>) or luxury jewelry inside!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-[42px] px-6 rounded-[13px] bg-[#ec2f73] hover:bg-[#d92467] text-white font-black text-xs uppercase tracking-wider shadow-[0_6px_18px_rgba(236,47,115,0.28)] active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Unboxing</span>
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-2.5 sm:gap-3.5 p-2.5 sm:p-3 rounded-[18px] bg-[#fffafc] border border-[#eee2eb] hover:border-[#f5cad7] transition-all shadow-2xs group"
                >
                  {/* Product Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] bg-white border border-[#f0e4ec] overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Tiny Surprise Type Chip */}
                    <span className="absolute bottom-1 left-1 right-1 text-[8px] font-black uppercase text-center py-0.5 rounded-[6px] bg-[#141219]/80 text-white backdrop-blur-2xs truncate">
                      {item.product.surpriseType === 'cash' ? '💵 Cash Win' : '💍 Jewelry'}
                    </span>
                  </div>

                  {/* Product Info & Stepper */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs sm:text-[13px] font-bold text-[#141219] m-0 line-clamp-1 leading-snug">
                          {item.product.name}
                        </h4>
                        
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.product.id)}
                          className="p-1 rounded-md text-[#a39ea8] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-[#716d77] font-medium">
                          ${item.product.price.toFixed(2)} each
                        </span>
                        <span className="text-[10px] text-[#eedbe6]">•</span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 truncate">
                          100% Win Guarantee
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper & Line Item Price */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#f7eef3]">
                      
                      {/* Stepper Buttons */}
                      <div className="flex items-center border border-[#e8dfe5] rounded-[10px] bg-white px-1 py-0.5 gap-1.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-[7px] hover:bg-[#fff0f5] text-[#716d77] hover:text-[#ec2f73] flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xs font-black text-[#141219] min-w-[18px] text-center">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-[7px] hover:bg-[#fff0f5] text-[#716d77] hover:text-[#ec2f73] flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total Item Price */}
                      <span className="text-xs sm:text-sm font-black text-[#141219]">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                  </div>
                </div>
              ))
            )}

            {/* Quick Promo Code Accordion */}
            {cart.length > 0 && (
              <div className="pt-1">
                {appliedPromo ? (
                  <div className="p-2.5 rounded-[14px] bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Coupon <strong>{appliedPromo.code}</strong> applied ({appliedPromo.discountPercent}% OFF)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Promo code (try VIP15)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full h-[36px] pl-8 pr-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#ec2f73] text-xs text-[#141219] outline-none"
                      />
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a858f]" />
                    </div>
                    <button
                      type="submit"
                      className="h-[36px] px-3.5 rounded-[11px] bg-white border border-[#e8dfe5] hover:border-[#ec2f73] hover:text-[#ec2f73] text-xs font-bold text-[#141219] shadow-2xs transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoError && (
                  <span className="text-[10px] text-red-600 block mt-1 font-semibold">{promoError}</span>
                )}
              </div>
            )}

          </div>

          {/* 4. Cart Footer & Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-3.5 sm:p-5 border-t border-[#f0e2ec] bg-gradient-to-b from-white to-[#fffafc] space-y-2.5 sticky bottom-0 z-10 shadow-[0_-8px_20px_rgba(50,31,63,0.04)]">
              
              {/* Pricing Breakdown */}
              <div className="space-y-1.5 text-xs text-[#716d77]">
                <div className="flex items-center justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-bold text-[#141219]">${rawSubtotal.toFixed(2)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>Tracked Shipping</span>
                  <span className={`font-bold ${isFreeShipping ? 'text-emerald-700 font-black' : 'text-[#141219]'}`}>
                    {isFreeShipping ? 'FREE' : '$4.99'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#f2e6ee] text-sm sm:text-base font-black text-[#141219]">
                  <span>Total Amount</span>
                  <span className="text-base sm:text-lg text-[#ec2f73]">
                    ${(finalSubtotal + (isFreeShipping ? 0 : 4.99)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Primary Mobile-First Checkout Button */}
              <button
                type="button"
                onClick={onCheckout}
                className="w-full h-[46px] sm:h-[48px] rounded-[14px] bg-[#ec2f73] hover:bg-[#d92467] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_22px_rgba(236,47,115,0.3)] hover:shadow-[0_12px_28px_rgba(236,47,115,0.42)] active:scale-97 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Secure Checkout • ${(finalSubtotal + (isFreeShipping ? 0 : 4.99)).toFixed(2)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Safe Payment Guarantee Badges */}
              <div className="flex items-center justify-between text-[10px] text-[#716d77] pt-1 px-1 font-semibold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Win Guarantee</span>
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#ec2f73]" />
                  <span>256-Bit Encrypted</span>
                </span>
                <span>Express 2-3 Days</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
};
