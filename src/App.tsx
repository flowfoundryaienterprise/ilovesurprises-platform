import { useState, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { RepresentativeSubscriptionModal } from './components/affiliate/RepresentativeSubscriptionModal';
import { ToastNotification, type ToastData } from './components/ui/ToastNotification';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Categories } from './pages/Categories';
import { ProductDetails } from './pages/ProductDetails';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Account, type AccountTab } from './pages/Account';
import { AffiliateDashboard } from './pages/AffiliateDashboard';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Rewards } from './pages/Rewards';
import { AdminDashboard } from './pages/AdminDashboard';
import type { Product, CartItem, UserProfile, Order } from './types';
import type { AdminTab } from './types/admin';
import { productsData } from './data/products';
import { accountService } from './services/accountService';
import { representativeService } from './services/representativeService';

export type AppView =
  | 'home'
  | 'shop'
  | 'categories'
  | 'product-details'
  | 'checkout'
  | 'order-confirmation'
  | 'account'
  | 'affiliate'
  | 'about'
  | 'contact'
  | 'rewards'
  | 'admin';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/shop') return 'shop';
    if (path === '/categories') return 'categories';
    if (path.startsWith('/product/')) return 'product-details';
    if (path === '/checkout') return 'checkout';
    if (path.startsWith('/order-confirmation/')) return 'order-confirmation';
    if (path === '/account') return 'account';
    if (path === '/affiliate') return 'affiliate';
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';
    if (path === '/rewards') return 'rewards';

    // Check for representative in path or query
    const trimmedPath = path.startsWith('/rep/') ? path.replace('/rep/', '') : path.slice(1);
    if (
      trimmedPath &&
      !['admin', 'shop', 'categories', 'checkout', 'order-confirmation', 'account', 'affiliate', 'about', 'contact', 'rewards'].includes(
        trimmedPath
      ) &&
      !trimmedPath.includes('/')
    ) {
      representativeService.setAttributedRepresentative(trimmedPath);
    }

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
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>(() => {
    if (typeof window === 'undefined') return 'overview';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (
      tab &&
      ['overview', 'representatives', 'memberships', 'commerce', 'commissions', 'reports', 'settings', 'permissions'].includes(
        tab
      )
    ) {
      return tab as AdminTab;
    }
    return 'overview';
  });
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
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward'>('forward');

  // Track scroll position per page for smooth return navigation
  const scrollPositions = useRef<Record<string, number>>({});

  // Sync user profile if consultant status or profile changes in storage
  useEffect(() => {
    const handleUserUpdated = () => {
      const stored = accountService.getStoredUser();
      if (stored) {
        setUser(stored);
      }
    };
    window.addEventListener('ilovesurprises_user_updated', handleUserUpdated);
    window.addEventListener('ils_consultant_subscribed', handleUserUpdated);
    return () => {
      window.removeEventListener('ilovesurprises_user_updated', handleUserUpdated);
      window.removeEventListener('ils_consultant_subscribed', handleUserUpdated);
    };
  }, []);

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

  // Dynamic SEO management per view & product
  useEffect(() => {
    const titles: Record<AppView, string> = {
      home: 'ILoveSurprises.com | Luxury Jewelry & Real Cash Reveal Candles',
      shop: 'Shop Surprise Candles & Melts | ILoveSurprises.com',
      categories: 'Browse Surprise Categories | Candles, Melts & Bath | ILoveSurprises.com',
      'product-details': selectedProduct ? `${selectedProduct.name} | ILoveSurprises.com` : 'Product Details | ILoveSurprises.com',
      checkout: 'Secure SSL Checkout | ILoveSurprises.com',
      'order-confirmation': 'Order Confirmation | ILoveSurprises.com',
      account: 'My Account & Order History | ILoveSurprises.com',
      affiliate: 'Surprise Consultant Portal & Earnings | ILoveSurprises.com',
      about: 'About Us | The Story of ILoveSurprises.com',
      contact: 'Contact & VIP Concierge | ILoveSurprises.com',
      rewards: 'Surprise Club™ VIP Rewards & Loyalty | ILoveSurprises.com',
      admin: 'Admin Control Center | ILoveSurprises.com',
    };

    const descriptions: Record<AppView, string> = {
      home: 'Discover hand-poured soy candles and luxury bath treats with real cash ($2 - $2,500) or fine jewelry hidden inside every item.',
      shop: 'Explore our full collection of aroma soy candles, bath bombs, wax melts, and mystery boxes with genuine surprise reveals.',
      categories: 'Shop by surprise category: Cash Candles, Jewelry Candles, Wax Melts, and Curated Monthly Surprise Boxes.',
      'product-details': selectedProduct?.description || 'Handcrafted luxury soy candle with guaranteed hidden surprises inside.',
      checkout: 'Complete your purchase with 256-bit SSL encrypted checkout and 100% win guarantee protection.',
      'order-confirmation': 'Your surprise package has been ordered and is preparing for express delivery.',
      account: 'Manage your profile, tracked shipping addresses, orders, and consultant status.',
      affiliate: 'Earn 20% direct customer commissions plus 5 levels of team overrides up to 35% total compensation.',
      about: 'Learn about our passion for unforgettable unboxing moments, clean natural ingredients, and verified reveals.',
      contact: 'Get in touch with the ILoveSurprises concierge team for order support, custom gifts, or partnership inquiries.',
      rewards: 'Earn 10 points per $1 spent on cash reveal candles and fine jewelry. Redeem points for discount vouchers, free candles, and VIP perks.',
      admin: 'Secure internal management system for store commerce, representatives, memberships, and commissions.',
    };

    document.title = titles[currentView] || 'ILoveSurprises.com';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', descriptions[currentView] || descriptions.home);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ilovesurprises.com';
    canonical.setAttribute('href', `${currentOrigin}${window.location.pathname}`);
  }, [currentView, selectedProduct]);

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
          if (
            ['overview', 'representatives', 'memberships', 'commerce', 'commissions', 'reports', 'settings', 'permissions'].includes(
              e.state.tab
            )
          ) {
            setAdminActiveTab(e.state.tab as AdminTab);
          }
        }

        // Restore scroll position
        const targetScroll = scrollPositions.current[targetView] || 0;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      } else {
        const path = window.location.pathname;
        if (path === '/admin') {
          const params = new URLSearchParams(window.location.search);
          const tab = params.get('tab');
          if (
            tab &&
            ['overview', 'representatives', 'memberships', 'commerce', 'commissions', 'reports', 'settings', 'permissions'].includes(
              tab
            )
          ) {
            setAdminActiveTab(tab as AdminTab);
          }
          setCurrentView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (path === '/shop') {
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
        } else if (path === '/affiliate') {
          setCurrentView('affiliate');
          window.scrollTo({ top: scrollPositions.current['affiliate'] || 0, behavior: 'smooth' });
        } else if (path === '/about') {
          setCurrentView('about');
          window.scrollTo({ top: scrollPositions.current['about'] || 0, behavior: 'smooth' });
        } else if (path === '/contact') {
          setCurrentView('contact');
          window.scrollTo({ top: scrollPositions.current['contact'] || 0, behavior: 'smooth' });
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

  const handleNavigateToAffiliate = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('affiliate');
    const targetScroll = direction === 'backward' ? scrollPositions.current['affiliate'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'affiliate' }, '', '/affiliate');
    }
  };

  const handleNavigateToAbout = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('about');
    const targetScroll = direction === 'backward' ? scrollPositions.current['about'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'about' }, '', '/about');
    }
  };

  const handleNavigateToContact = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('contact');
    const targetScroll = direction === 'backward' ? scrollPositions.current['contact'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'contact' }, '', '/contact');
    }
  };

  const handleNavigateToRewards = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('rewards');
    const targetScroll = direction === 'backward' ? scrollPositions.current['rewards'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'rewards' }, '', '/rewards');
    }
  };

  const handleNavigateToAdmin = (tab: AdminTab = 'overview') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection('forward');
    setAdminActiveTab(tab);
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'admin', tab }, '', `/admin?tab=${tab}`);
    }
  };

  const handleNavigate = (route: 'home' | 'shop' | 'categories' | 'affiliate' | 'about' | 'contact' | 'rewards' | 'admin') => {
    if (route === 'admin') {
      handleNavigateToAdmin('overview');
    } else if (route === 'shop') {
      handleNavigateToShop(undefined, 'forward');
    } else if (route === 'categories') {
      handleNavigateToCategories('forward');
    } else if (route === 'affiliate') {
      handleNavigateToAffiliate('forward');
    } else if (route === 'about') {
      handleNavigateToAbout('forward');
    } else if (route === 'contact') {
      handleNavigateToContact('forward');
    } else if (route === 'rewards') {
      handleNavigateToRewards('forward');
    } else {
      handleNavigateToHome('forward');
    }
  };

  const transitionClass = navDirection === 'backward' ? 'page-transition-backward' : 'page-transition-forward';

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#141219]">
      {currentView === 'admin' ? (
        <div key="page-admin" className="flex-1 w-full min-h-screen bg-[#fcf9fb]">
          <AdminDashboard
            initialTab={adminActiveTab}
            onNavigateToHome={() => handleNavigateToHome('backward')}
            onShowToast={showToast}
          />
        </div>
      ) : (
        <>
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
            onNavigateToAffiliate={handleNavigateToAffiliate}
            onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
            onNavigateToAdmin={() => handleNavigateToAdmin('overview')}
            onSelectProduct={handleSelectProduct}
            onSelectCategory={(category) => handleNavigateToShop(category)}
          />

          {/* Main Dynamic View: Home | Shop | Categories | Product Details | Checkout | Order Confirmation | Account | Affiliate */}
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
                  onNavigateToAffiliate={handleNavigateToAffiliate}
                />
              </div>
            )}

            {currentView === 'affiliate' && (
              <div key="page-affiliate" className={transitionClass}>
                <AffiliateDashboard
                  user={user}
                  onNavigateToHome={() => handleNavigateToHome('backward')}
                  onNavigateToAccount={() => handleNavigateToAccount('profile')}
                  onShowToast={showToast}
                />
              </div>
            )}

            {currentView === 'about' && (
              <div key="page-about" className={transitionClass}>
                <About
                  onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
                  onNavigateToAffiliate={() => handleNavigateToAffiliate('forward')}
                />
              </div>
            )}

            {currentView === 'contact' && (
              <div key="page-contact" className={transitionClass}>
                <Contact />
              </div>
            )}

            {currentView === 'rewards' && (
              <div key="page-rewards" className={transitionClass}>
                <Rewards
                  user={user}
                  onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
                  onOpenAuth={handleOpenAuth}
                  onShowToast={showToast}
                />
              </div>
            )}
          </main>

          {/* Footer */}
          <Footer onNavigate={handleNavigate} />
        </>
      )}

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

      {/* Representative Consultant Subscription & Enrollment Modal */}
      <RepresentativeSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        user={user}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSuccess={() => {
          const fresh = accountService.getStoredUser();
          if (fresh) setUser(fresh);
          handleNavigateToAffiliate('forward');
        }}
        onShowToast={showToast}
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
