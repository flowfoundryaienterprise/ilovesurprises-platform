import React from 'react';
import {
  Home as HomeIcon,
  LayoutGrid,
  Sparkles,
  User,
  ShoppingBag,
  ArrowRight,
  Truck,
} from 'lucide-react';
import type { AppView } from '../../App';
import type { UserProfile } from '../../types';

interface MobileBottomNavProps {
  activeView: AppView;
  cartCount: number;
  cartSubtotal: number;
  user: UserProfile | null;
  onNavigate: (route: 'home' | 'shop' | 'categories') => void;
  onNavigateToAccount: () => void;
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  cartCount,
  cartSubtotal,
  user: _user,
  onNavigate,
  onNavigateToAccount,
  onOpenCart,
}) => {
  // Hide bottom nav on checkout or order confirmation pages so it doesn't conflict with checkout flow
  if (activeView === 'checkout' || activeView === 'order-confirmation') {
    return null;
  }

  const freeShippingThreshold = 50;
  const isFreeShipping = cartSubtotal >= freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartSubtotal);

  return (
    <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      
      {/* 1. BLINKIT / AMAZON STYLE FLOATING QUICK-CART BAR (Visible when items in cart) */}
      {cartCount > 0 && activeView !== 'product-details' && (
        <div className="px-3 pb-2 pointer-events-auto">
          <div
            onClick={onOpenCart}
            className="w-full p-2.5 sm:p-3 rounded-[18px] bg-gradient-to-r from-[#141219] via-[#241a29] to-[#141219] text-white shadow-[0_8px_25px_rgba(20,18,25,0.4)] border border-white/10 flex items-center justify-between gap-2.5 cursor-pointer active:scale-[0.98] transition-all duration-200"
          >
            {/* Left: Cart items & price */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-[10px] bg-[#ec2f73] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 rounded-full bg-white text-[#ec2f73] text-[9px] font-black flex items-center justify-center border border-[#ec2f73] shadow-xs">
                  {cartCount}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">
                    ${cartSubtotal.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold block truncate flex items-center gap-1">
                  <Truck className="w-2.5 h-2.5" />
                  {isFreeShipping ? 'FREE Express Delivery Unlocked! 🎉' : `Add $${amountToFreeShipping.toFixed(2)} for FREE Delivery`}
                </span>
              </div>
            </div>

            {/* Right: View Cart Button */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-[12px] bg-gradient-to-r from-[#ec2f73] to-[#d92467] text-white text-xs font-black uppercase tracking-wider shadow-xs shrink-0">
              <span>View Bag</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* 2. REAL APP MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto bg-white/95 backdrop-blur-xl border-t border-[#eedbe6] px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(50,31,63,0.08)] flex items-center justify-around"
      >
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 cursor-pointer ${
            activeView === 'home'
              ? 'text-[#ec2f73] font-black'
              : 'text-[#716d77] hover:text-[#141219]'
          }`}
        >
          <div className="relative">
            <HomeIcon className={`w-5 h-5 transition-transform ${activeView === 'home' ? 'scale-110' : ''}`} />
            {activeView === 'home' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ec2f73]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-bold">Home</span>
        </button>

        {/* Tab 2: Categories */}
        <button
          type="button"
          onClick={() => onNavigate('categories')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 cursor-pointer ${
            activeView === 'categories'
              ? 'text-[#ec2f73] font-black'
              : 'text-[#716d77] hover:text-[#141219]'
          }`}
        >
          <div className="relative">
            <LayoutGrid className={`w-5 h-5 transition-transform ${activeView === 'categories' ? 'scale-110' : ''}`} />
            {activeView === 'categories' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ec2f73]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-bold">Categories</span>
        </button>

        {/* Tab 3: Shop / Explore */}
        <button
          type="button"
          onClick={() => onNavigate('shop')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 cursor-pointer ${
            activeView === 'shop'
              ? 'text-[#ec2f73] font-black'
              : 'text-[#716d77] hover:text-[#141219]'
          }`}
        >
          <div className="relative">
            <Sparkles className={`w-5 h-5 transition-transform ${activeView === 'shop' ? 'scale-110 text-[#ec2f73]' : ''}`} />
            {activeView === 'shop' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ec2f73]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-bold">Shop</span>
        </button>

        {/* Tab 4: Account / Profile */}
        <button
          type="button"
          onClick={onNavigateToAccount}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 cursor-pointer ${
            activeView === 'account'
              ? 'text-[#ec2f73] font-black'
              : 'text-[#716d77] hover:text-[#141219]'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 transition-transform ${activeView === 'account' ? 'scale-110' : ''}`} />
            {activeView === 'account' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ec2f73]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-bold">Account</span>
        </button>

        {/* Tab 5: Cart (Opens Cart Drawer) */}
        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-90 cursor-pointer text-[#716d77] hover:text-[#ec2f73]"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[17px] h-4 px-1 rounded-full bg-[#ec2f73] text-white text-[9px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-bold">Bag</span>
        </button>
      </nav>
    </div>
  );
};
