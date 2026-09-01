import { useState, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { ToastNotification, type ToastData } from './components/ui/ToastNotification';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Categories } from './pages/Categories';
import { ProductDetails } from './pages/ProductDetails';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Account, type AccountTab } from './pages/Account';
import type { Product, CartItem, UserProfile, Order } from './types';
import { productsData } from './data/products';
import { accountService } from './services/accountService';

export type AppView =
  | 'home'
  | 'shop'
  | 'categories'
  | 'product-details'
  | 'checkout'
  | 'order-confirmation'
  | 'account';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    if (path === '/shop') return 'shop';
    if (path === '/categories') return 'categories';
    if (path.startsWith('/product/')) return 'product-details';
    if (path === '/checkout') return 'checkout';
    if (path.startsWith('/order-confirmation/')) return 'order-confirmation';
    if (path === '/account') return 'account';
    return 'home';
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (path.startsWith('/product/')) {
      const slug = path.replace('/product/', '');
      return productsData.find((p) => p.slug === slug || p.id === slug) || null;
    }
    return null;
  });

  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (path.startsWith('/order-confirmation/')) {
      return path.replace('/order-confirmation/', '');
    }
    return null;
  });

  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);
  const [accountActiveTab, setAccountActiveTab] = useState<AccountTab>('profile');
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [appliedCheckoutPromo, setAppliedCheckoutPromo] = useState<string | null>(null);

  // Persistent user profile state
  const [user, setUser] = useState<UserProfile | null>(() => {
    return accountService.getStoredUser();
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Surprises');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward'>('forward');

  // Track scroll position per page for smooth return navigation
  const scrollPositions = useRef<Record<string, number>>({});

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const showToast = (
    message: string,
    options?: {
      title?: string;
      type?: 'cart' | 'wishlist' | 'order' | 'success' | 'info';
      actionLabel?: string;
      onAction?: () => void;
      duration?: number;
    }
  ) => {
    setToast({
      id: Math.random().toString(),
      message,
      title: options?.title,
      type: options?.type || 'info',
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      duration: options?.duration || 3200,
    });
  };

  // Browser history popstate handler with back detection & drawer interception
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If modal/cart is open, close it first on mobile back
      if (isCartOpen) {
        setIsCartOpen(false);
        return;
      }
      if (isAuthOpen) {
        setIsAuthOpen(false);
        return;
      }

      setNavDirection('backward');

      if (e.state?.view) {
        const targetView = e.state.view as AppView;
        setCurrentView(targetView);
        if (e.state.category) setSelectedCategory(e.state.category);
        if (e.state.productId) {
          const matched = productsData.find((p) => p.id === e.state.productId);
          if (matched) setSelectedProduct(matched);
        }
        if (e.state.orderId) {
          setConfirmedOrderId(e.state.orderId);
        }
        if (e.state.tab) {
          setAccountActiveTab(e.state.tab);
        }

        // Restore scroll position
        const targetScroll = scrollPositions.current[targetView] || 0;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      } else {
        const path = window.location.pathname;
        if (path === '/shop') {
          setCurrentView('shop');
          window.scrollTo({ top: scrollPositions.current['shop'] || 0, behavior: 'smooth' });
        } else if (path === '/categories') {
          setCurrentView('categories');
          window.scrollTo({ top: scrollPositions.current['categories'] || 0, behavior: 'smooth' });
        } else if (path === '/checkout') {
          setCurrentView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (path.startsWith('/order-confirmation/')) {
          const id = path.replace('/order-confirmation/', '');
          setConfirmedOrderId(id);
          setCurrentView('order-confirmation');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (path === '/account') {
          setCurrentView('account');
          window.scrollTo({ top: scrollPositions.current['account'] || 0, behavior: 'smooth' });
        } else if (path.startsWith('/product/')) {
          const slug = path.replace('/product/', '');
          const matched = productsData.find((p) => p.slug === slug || p.id === slug);
          if (matched) {
            setSelectedProduct(matched);
            setCurrentView('product-details');
          }
        } else {
          setCurrentView('home');
          window.scrollTo({ top: scrollPositions.current['home'] || 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCartOpen, isAuthOpen]);

  const handleOpenAuth = (mode: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    accountService.updateStoredUser(authenticatedUser);
    showToast(`Welcome back, ${authenticatedUser.name}!`, {
      title: 'Signed In',
      type: 'success',
    });
  };

  const handleLogout = () => {
    setUser(null);
    accountService.updateStoredUser(null);
    showToast('You have signed out successfully.', {
      title: 'Signed Out',
      type: 'info',
    });
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}"${product.name}" to your bag`, {
      title: 'Added to Bag',
      type: 'cart',
      actionLabel: 'View Bag',
      onAction: () => setIsCartOpen(true),
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from bag', {
      title: 'Bag Updated',
      type: 'info',
    });
  };

  const handleTriggerCheckout = (promoCode?: string) => {
    setIsCartOpen(false);
    setAppliedCheckoutPromo(promoCode || null);
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection('forward');
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'checkout' }, '', '/checkout');
    }
  };

  const handleOrderCompleted = (createdOrder: Order) => {
    setCart([]); // Clear cart upon successful order
    setLatestPlacedOrder(createdOrder);
    setConfirmedOrderId(createdOrder.id);
    setNavDirection('forward');
    setCurrentView('order-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState(
        { view: 'order-confirmation', orderId: createdOrder.id },
        '',
        `/order-confirmation/${createdOrder.id}`
      );
    }
    showToast(`Order #${createdOrder.id} confirmed!`, {
      title: '🎉 Order Placed',
      type: 'order',
      actionLabel: 'Track Order',
      onAction: () => handleNavigateToAccount('orders', createdOrder.id),
      duration: 4500,
    });
  };

  const handleNavigateToAccount = (tab: AccountTab = 'profile', targetOrderId?: string) => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection('forward');
    setAccountActiveTab(tab);
    if (targetOrderId) {
      setHighlightOrderId(targetOrderId);
    }
    setCurrentView('account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'account', tab }, '', `/account?tab=${tab}`);
    }
  };

  const handleWishlistToggle = (product: Product) => {
    setWishlistIds((prev) => {
      const isAlready = prev.includes(product.id);
      if (isAlready) {
        showToast(`Removed "${product.name}" from wishlist`, {
          title: 'Wishlist Updated',
          type: 'wishlist',
        });
        return prev.filter((id) => id !== product.id);
      } else {
        showToast(`Saved "${product.name}" to your wishlist`, {
          title: 'Wishlisted',
          type: 'wishlist',
          actionLabel: 'View Wishlist',
          onAction: () => handleNavigateToAccount('wishlist'),
        });
        return [...prev, product.id];
      }
    });
  };

  const handleSelectProduct = (product: Product) => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection('forward');
    setSelectedProduct(product);
    setCurrentView('product-details');
    window.scrollTo(0, 0);
    if (window.history.pushState) {
      window.history.pushState({ view: 'product-details', productId: product.id }, '', `/product/${product.slug}`);
    }
  };

  const handleNavigateToShop = (category?: string, direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    if (category) {
      setSelectedCategory(category);
    }
    setCurrentView('shop');
    const targetScroll = direction === 'backward' ? scrollPositions.current['shop'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'shop', category: category || selectedCategory }, '', '/shop');
    }
  };

  const handleNavigateToCategories = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('categories');
    const targetScroll = direction === 'backward' ? scrollPositions.current['categories'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'categories' }, '', '/categories');
    }
  };

  const handleNavigateToHome = (direction: 'forward' | 'backward' = 'backward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('home');
    const targetScroll = direction === 'backward' ? scrollPositions.current['home'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'home' }, '', '/');
    }
  };

  const handleNavigate = (route: 'home' | 'shop' | 'categories') => {
    if (route === 'shop') {
      handleNavigateToShop(undefined, 'forward');
    } else if (route === 'categories') {
      handleNavigateToCategories('forward');
    } else {
      handleNavigateToHome('forward');
    }
  };

  const transitionClass = navDirection === 'backward' ? 'page-transition-backward' : 'page-transition-forward';

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#141219]">
      {/* 1. Header / Navbar with Active Highlighting, Search, Location, User Menu & Cart */}
      <Header
        cartCount={totalCartCount}
        cartSubtotal={cartSubtotal}
        user={user}
        activeView={currentView}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onSearch={(q) => {
          setSearchQuery(q);
          if (q.trim()) {
            setCurrentView('shop');
          }
        }}
        onNavigate={handleNavigate}
        onNavigateToAccount={handleNavigateToAccount}
        onSelectProduct={handleSelectProduct}
      />

      {/* Main Dynamic View: Home | Shop | Categories | Product Details | Checkout | Order Confirmation | Account */}
      <main className="flex-1 w-full overflow-hidden">
        {currentView === 'home' && (
          <div key="page-home" className={transitionClass}>
            <Home
              cart={cart}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => handleNavigateToShop(cat, 'forward')}
              onViewAllCategories={() => handleNavigateToCategories('forward')}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onWishlistToggle={handleWishlistToggle}
              onSelectProduct={handleSelectProduct}
            />
          </div>
        )}

        {currentView === 'categories' && (
          <div key="page-categories" className={transitionClass}>
            <Categories
              onSelectCategory={(cat) => handleNavigateToShop(cat, 'forward')}
              onBackToHome={() => handleNavigateToHome('backward')}
            />
          </div>
        )}

        {currentView === 'shop' && (
          <div key="page-shop" className={transitionClass}>
            <Shop
              cart={cart}
              wishlistIds={wishlistIds}
              initialCategory={selectedCategory}
              initialSearchQuery={searchQuery}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onWishlistToggle={handleWishlistToggle}
              onSelectProduct={handleSelectProduct}
            />
          </div>
        )}

        {currentView === 'product-details' && selectedProduct && (
          <div key={`page-product-${selectedProduct.id}`} className={transitionClass}>
            <ProductDetails
              product={selectedProduct}
              cart={cart}
              wishlistIds={wishlistIds}
              onBackToShop={() => handleNavigateToShop(undefined, 'backward')}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onWishlistToggle={handleWishlistToggle}
              onSelectProduct={handleSelectProduct}
              onOpenCart={() => setIsCartOpen(true)}
            />
          </div>
        )}

        {currentView === 'checkout' && (
          <div key="page-checkout" className={transitionClass}>
            <Checkout
              cart={cart}
              user={user}
              appliedPromoCode={appliedCheckoutPromo}
              onOrderCompleted={handleOrderCompleted}
              onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
              onBackToCart={() => setIsCartOpen(true)}
            />
          </div>
        )}

        {currentView === 'order-confirmation' && (
          <div key={`page-order-confirmation-${confirmedOrderId || 'latest'}`} className={transitionClass}>
            <OrderConfirmation
              orderId={confirmedOrderId || undefined}
              latestOrder={latestPlacedOrder}
              onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
              onNavigateToAccountOrders={(orderId) => handleNavigateToAccount('orders', orderId)}
            />
          </div>
        )}

        {currentView === 'account' && (
          <div key={`page-account-${accountActiveTab}`} className={transitionClass}>
            <Account
              user={user}
              activeTab={accountActiveTab}
              highlightOrderId={highlightOrderId}
              wishlistIds={wishlistIds}
              onOpenAuth={handleOpenAuth}
              onLogout={handleLogout}
              onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
              onWishlistToggle={handleWishlistToggle}
              onTabChange={(tab) => setAccountActiveTab(tab)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Sign In & Login / Create Account Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Luxury Quick-Commerce Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleTriggerCheckout}
      />

      {/* State-of-the-Art Luxury Toast Notification (Dynamic Top Island & Glow) */}
      <ToastNotification
        toast={toast}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

export default App;
