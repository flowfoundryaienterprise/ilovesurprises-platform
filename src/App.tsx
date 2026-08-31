import { useState, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Categories } from './pages/Categories';
import { ProductDetails } from './pages/ProductDetails';
import type { Product, CartItem, UserProfile } from './types';
import { productsData } from './data/products';

export function App() {
  const [currentView, setCurrentView] = useState<'home' | 'shop' | 'categories' | 'product-details'>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    if (path === '/shop') return 'shop';
    if (path === '/categories') return 'categories';
    if (path.startsWith('/product/')) return 'product-details';
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

  const [cart, setCart] = useState<CartItem[]>([
    { product: productsData[0], quantity: 1 },
    { product: productsData[1], quantity: 1 },
  ]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(['prod-cash-01']);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Surprises');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [navDirection, setNavDirection] = useState<'forward' | 'backward'>('forward');

  // Track scroll position per page for smooth return navigation
  const scrollPositions = useRef<Record<string, number>>({});

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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
        const targetView = e.state.view;
        setCurrentView(targetView);
        if (e.state.category) setSelectedCategory(e.state.category);
        if (e.state.productId) {
          const matched = productsData.find((p) => p.id === e.state.productId);
          if (matched) setSelectedProduct(matched);
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
    showToast(`Welcome back, ${authenticatedUser.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    showToast('You have signed out successfully.');
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
    showToast(`Added ${quantity > 1 ? `${quantity}x ` : ''}"${product.name}" to cart!`);
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
    showToast('Item removed from cart');
  };

  const handleCheckout = () => {
    showToast('Redirecting to secure 256-bit checkout...');
  };

  const handleWishlistToggle = (product: Product) => {
    setWishlistIds((prev) => {
      const isAlready = prev.includes(product.id);
      if (isAlready) {
        showToast(`Removed "${product.name}" from wishlist`);
        return prev.filter((id) => id !== product.id);
      } else {
        showToast(`Saved "${product.name}" to wishlist! ✨`);
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
      {/* 1. Header / Navbar with Active Highlighting, Search, Location & Cart */}
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
        onSelectProduct={handleSelectProduct}
      />

      {/* Main Dynamic View: Home | Store (Shop) | Categories | Product Details */}
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
        onCheckout={handleCheckout}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#171219] text-white px-4 py-2.5 rounded-[14px] shadow-2xl text-xs font-bold animate-toast border border-stone-800 flex items-center gap-2 pointer-events-none">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
