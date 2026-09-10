import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MinimalCheckoutHeader } from './components/layout/MinimalCheckoutHeader';
import { usePathname, isCheckoutRoute } from './hooks/usePathname';
import { AuthModal } from './components/auth/AuthModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { ToastNotification, type ToastData } from './components/ui/ToastNotification';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetails } from './pages/ProductDetails';
import type { AccountTab } from './pages/Account';
import type { Product, CartItem, UserProfile, Order } from './types';
import type { AdminTab } from './types/admin';
import { productsData } from './data/products';
import { productService } from './services/productService';
import { accountService } from './services/accountService';
import { representativeService } from './services/representativeService';
import { SEOHead } from './components/seo/SEOHead';
import { supabase } from './services/supabaseClient';
import { authService } from './services/auth';
import { Sparkles, ArrowRight } from 'lucide-react';

// Route-level code splitting for rapid initial load and 144Hz responsiveness
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AffiliateDashboard = lazy(() => import('./pages/AffiliateDashboard').then((m) => ({ default: m.AffiliateDashboard })));
const Account = lazy(() => import('./pages/Account').then((m) => ({ default: m.Account })));
const Checkout = lazy(() => import('./pages/Checkout').then((m) => ({ default: m.Checkout })));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation').then((m) => ({ default: m.OrderConfirmation })));
const Categories = lazy(() => import('./pages/Categories').then((m) => ({ default: m.Categories })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const Rewards = lazy(() => import('./pages/Rewards').then((m) => ({ default: m.Rewards })));
const AppraiseJewelry = lazy(() => import('./pages/AppraiseJewelry').then((m) => ({ default: m.AppraiseJewelry })));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy').then((m) => ({ default: m.RefundPolicy })));
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const OfficialRules = lazy(() => import('./pages/OfficialRules').then((m) => ({ default: m.OfficialRules })));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy').then((m) => ({ default: m.ShippingPolicy })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then((m) => ({ default: m.PrivacyPolicy })));
const FAQ = lazy(() => import('./pages/FAQ').then((m) => ({ default: m.FAQ })));
const RepresentativeSubscriptionModal = lazy(() =>
  import('./components/affiliate/RepresentativeSubscriptionModal').then((m) => ({
    default: m.RepresentativeSubscriptionModal,
  }))
);

function PageLoadingFallback() {
  return (
    <div className="w-full max-w-[1460px] mx-auto px-4 py-8 animate-pulse" role="status" aria-label="Loading page">
      <div className="h-8 w-48 bg-stone-200/70 rounded-xl mb-3" />
      <div className="h-4 w-72 bg-stone-100 rounded-lg mb-6" />
      <div className="h-64 w-full bg-stone-100/60 rounded-2xl border border-stone-200/40" />
    </div>
  );
}

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
  | 'admin'
  | 'appraisal'
  | 'refund-policy'
  | 'terms'
  | 'official-rules'
  | 'shipping-policy'
  | 'privacy'
  | 'faqs';

export function App() {
  const pathname = usePathname();

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/shop') return 'shop';
    if (path === '/categories') return 'categories';
    if (path.startsWith('/product/')) return 'product-details';
    if (
      path === '/checkout' ||
      path.startsWith('/checkout/') ||
      path === '/payment' ||
      path === '/buy-now'
    ) {
      return 'checkout';
    }
    if (
      path.startsWith('/order-confirmation/') ||
      path === '/thank-you' ||
      path === '/order-success'
    ) {
      return 'order-confirmation';
    }
    if (path === '/account') return 'account';
    if (path === '/affiliate') return 'affiliate';
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';
    if (path === '/rewards') return 'rewards';
    if (path === '/appraise-your-jewelry' || path === '/appraisal') return 'appraisal';
    if (path === '/refund-policy') return 'refund-policy';
    if (path === '/terms') return 'terms';
    if (path === '/official-rules') return 'official-rules';
    if (path === '/shipping' || path === '/shipping-policy') return 'shipping-policy';
    if (path === '/privacy') return 'privacy';
    if (path === '/faqs' || path === '/faq') return 'faqs';

    // Check for representative in path or query
    const trimmedPath = path.startsWith('/rep/') ? path.replace('/rep/', '') : path.slice(1);
    if (
      trimmedPath &&
      ![
        'admin',
        'shop',
        'categories',
        'checkout',
        'payment',
        'buy-now',
        'order-confirmation',
        'thank-you',
        'order-success',
        'account',
        'affiliate',
        'about',
        'contact',
        'rewards',
        'appraisal',
        'appraise-your-jewelry',
        'refund-policy',
        'terms',
        'official-rules',
        'shipping',
        'shipping-policy',
        'privacy',
        'faqs',
        'faq',
      ].includes(trimmedPath) &&
      !trimmedPath.includes('/')
    ) {
      representativeService.setAttributedRepresentative(trimmedPath);
    }

    return 'home';
  });

  const [isProductLoading, setIsProductLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith('/product/');
  });
  const [productLoadingError, setProductLoadingError] = useState<boolean>(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (path.startsWith('/product/')) {
      const slug = path.replace('/product/', '').trim();
      return productsData.find((p) => p.slug === slug || p.id === slug) || null;
    }
    return null;
  });

  // Dynamically resolve product from Supabase if accessed directly via URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/product/')) {
        const slug = path.replace('/product/', '').trim();
        if (slug) {
          productService.getProductBySlug(slug).then((prod) => {
            if (prod) {
              setSelectedProduct(prod);
              setProductLoadingError(false);
            } else {
              setSelectedProduct(null);
              setProductLoadingError(true);
            }
          }).catch(() => {
            setSelectedProduct(null);
            setProductLoadingError(true);
          }).finally(() => {
            setIsProductLoading(false);
          });
        }
      }
    }
  }, []);

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

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ilovesurprises_cart_v1');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ilovesurprises_cart_v1', JSON.stringify(cart));
      } catch {
        // ignore
      }
    }
  }, [cart]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [appliedCheckoutPromo, setAppliedCheckoutPromo] = useState<string | null>(null);

  // Persistent user profile state
  const [user, setUser] = useState<UserProfile | null>(() => {
    return accountService.getStoredUser();
  });

  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        return true;
      }
    }
    return false;
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        return 'reset';
      }
    }
    return 'login';
  });
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
      setUser(stored);
    };
    window.addEventListener('ilovesurprises_user_updated', handleUserUpdated);
    window.addEventListener('ils_consultant_subscribed', handleUserUpdated);
    return () => {
      window.removeEventListener('ilovesurprises_user_updated', handleUserUpdated);
      window.removeEventListener('ils_consultant_subscribed', handleUserUpdated);
    };
  }, []);

  // Supabase Auth listener for session persistence and recovery link handling
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset');
        setIsAuthOpen(true);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          const freshUser = await authService.syncOAuthUserProfile(session.user);
          if (freshUser) {
            setUser(freshUser);
            accountService.updateStoredUser(freshUser);
            setIsAuthOpen(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        accountService.updateStoredUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
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
      appraisal: 'Free Jewelry Value / Appraisal | ILoveSurprises.com',
      'refund-policy': 'Refund & Return Policy | ILoveSurprises.com',
      terms: 'Terms & Conditions | ILoveSurprises.com',
      'official-rules': 'Official Rules / No Purchase Necessary | ILoveSurprises.com',
      'shipping-policy': 'Shipping Policy | ILoveSurprises.com',
      privacy: 'Privacy Policy | ILoveSurprises.com',
      faqs: 'Frequently Asked Questions | ILoveSurprises.com',
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
      appraisal: 'Found a piece of jewelry in your surprise candle? Enter your jewelry code or submit clear photos for free certified appraisal.',
      'refund-policy': 'Review the official I Love Surprises 60-day return policy and refund guidelines.',
      terms: 'Official Terms & Conditions and store policies for ILoveSurprises.com.',
      'official-rules': 'Official promotion rules and Alternate Method of Entry (AMOE) for I Love Surprises cash reveals.',
      'shipping-policy': 'Fast tracked shipping, handling times, delivery destinations, and carrier guidance for I Love Surprises.',
      privacy: 'Learn how I Love Surprises safeguards personal information, order data, and customer privacy.',
      faqs: 'Frequently asked questions about surprise candles, jewelry, shipping, returns, and support.',
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

  // Synchronize route changes from pathname with currentView and enforce AuthGuard on checkout
  useEffect(() => {
    const clean = (pathname || '').split('?')[0].split('#')[0];
    const isProtectedCheckout =
      clean === '/checkout' ||
      clean.startsWith('/checkout/') ||
      clean === '/checkout/shipping' ||
      clean === '/payment' ||
      clean === '/buy-now';

    if (isProtectedCheckout) {
      if (!user) {
        // Intercept unauthenticated access to checkout flow
        try {
          localStorage.setItem(
            'ils_intended_checkout',
            JSON.stringify({ action: 'route', path: clean })
          );
        } catch {
          // ignore
        }
        setTimeout(() => {
          setAuthMode('login');
          setIsAuthOpen(true);
        }, 0);
        if (window.history.replaceState) {
          window.history.replaceState(
            { view: 'home', redirect: clean },
            '',
            `/login?redirect=${encodeURIComponent(clean)}`
          );
        }
        return;
      }

      if (currentView !== 'checkout') {
        setTimeout(() => setCurrentView('checkout'), 0);
      }
    } else if (
      clean.startsWith('/order-confirmation') ||
      clean === '/thank-you' ||
      clean === '/order-success'
    ) {
      if (currentView !== 'order-confirmation') {
        setTimeout(() => setCurrentView('order-confirmation'), 0);
      }
    }
  }, [pathname, currentView, user]);

  // Handle direct /login route with redirect param on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/login') {
        setTimeout(() => {
          setAuthMode('login');
          setIsAuthOpen(true);
        }, 0);
      }
    }
  }, []);

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
        if (targetView === 'home') {
          setSelectedCategory('All Surprises');
          setSearchQuery('');
          setSelectedProduct(null);
        } else if (e.state.category) {
          setSelectedCategory(e.state.category);
        }
        if (e.state.productId || e.state.productSlug) {
          const identifier = (e.state.productSlug || e.state.productId) as string;
          const matched = productsData.find((p) => p.id === identifier || p.slug === identifier);
          if (matched) {
            setSelectedProduct(matched);
          } else {
            productService.getProductBySlug(identifier).then((prod) => {
              if (prod) setSelectedProduct(prod);
            });
          }
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
        } else if (
          path === '/checkout' ||
          path.startsWith('/checkout/') ||
          path === '/shipping' ||
          path === '/payment' ||
          path === '/buy-now'
        ) {
          setCurrentView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (
          path.startsWith('/order-confirmation/') ||
          path === '/thank-you' ||
          path === '/order-success'
        ) {
          const id = path.startsWith('/order-confirmation/')
            ? path.replace('/order-confirmation/', '')
            : path.startsWith('/thank-you/')
            ? path.replace('/thank-you/', '')
            : path.startsWith('/order-success/')
            ? path.replace('/order-success/', '')
            : null;
          if (id) setConfirmedOrderId(id);
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
        } else if (path === '/appraise-your-jewelry' || path === '/appraisal') {
          setCurrentView('appraisal');
          window.scrollTo({ top: scrollPositions.current['appraisal'] || 0, behavior: 'smooth' });
        } else if (path === '/refund-policy') {
          setCurrentView('refund-policy');
          window.scrollTo({ top: scrollPositions.current['refund-policy'] || 0, behavior: 'smooth' });
        } else if (path === '/terms') {
          setCurrentView('terms');
          window.scrollTo({ top: scrollPositions.current['terms'] || 0, behavior: 'smooth' });
        } else if (path === '/official-rules') {
          setCurrentView('official-rules');
          window.scrollTo({ top: scrollPositions.current['official-rules'] || 0, behavior: 'smooth' });
        } else if (path === '/shipping' || path === '/shipping-policy') {
          setCurrentView('shipping-policy');
          window.scrollTo({ top: scrollPositions.current['shipping-policy'] || 0, behavior: 'smooth' });
        } else if (path === '/privacy') {
          setCurrentView('privacy');
          window.scrollTo({ top: scrollPositions.current['privacy'] || 0, behavior: 'smooth' });
        } else if (path === '/faqs' || path === '/faq') {
          setCurrentView('faqs');
          window.scrollTo({ top: scrollPositions.current['faqs'] || 0, behavior: 'smooth' });
        } else if (path.startsWith('/product/')) {
          const slug = path.replace('/product/', '').trim();
          setIsProductLoading(true);
          setProductLoadingError(false);
          const matched = productsData.find((p) => p.slug === slug || p.id === slug);
          if (matched) {
            setSelectedProduct(matched);
            setIsProductLoading(false);
            setCurrentView('product-details');
          } else {
            productService.getProductBySlug(slug).then((prod) => {
              if (prod) {
                setSelectedProduct(prod);
                setProductLoadingError(false);
              } else {
                setSelectedProduct(null);
                setProductLoadingError(true);
              }
              setCurrentView('product-details');
            }).catch(() => {
              setSelectedProduct(null);
              setProductLoadingError(true);
              setCurrentView('product-details');
            }).finally(() => {
              setIsProductLoading(false);
            });
          }
        } else {
          setSelectedCategory('All Surprises');
          setSearchQuery('');
          setSelectedProduct(null);
          setCurrentView('home');
          window.scrollTo({ top: scrollPositions.current['home'] || 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCartOpen, isAuthOpen]);

  const handleOpenAuth = (mode: 'login' | 'signup' | 'forgot' | 'reset' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      window.history.replaceState({ view: 'home' }, '', '/');
    }
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    accountService.updateStoredUser(authenticatedUser);
    showToast(`Welcome back, ${authenticatedUser.name}!`, {
      title: 'Signed In',
      type: 'success',
    });

    // Check for intended checkout restoration after login
    try {
      const storedIntended = localStorage.getItem('ils_intended_checkout');
      if (storedIntended) {
        localStorage.removeItem('ils_intended_checkout');
        const parsed = JSON.parse(storedIntended);

        if (parsed.action === 'buy-now' && parsed.product) {
          // Add product to cart if not already present, then proceed to checkout
          setCart((prev) => {
            const existing = prev.find((item) => item.product.id === parsed.product.id);
            if (existing) {
              return prev.map((item) =>
                item.product.id === parsed.product.id
                  ? { ...item, quantity: item.quantity + (parsed.quantity || 1) }
                  : item
              );
            }
            return [...prev, { product: parsed.product, quantity: parsed.quantity || 1 }];
          });
          setNavDirection('forward');
          setCurrentView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (window.history.pushState) {
            window.history.pushState({ view: 'checkout' }, '', '/checkout');
          }
          return;
        }

        if (parsed.action === 'checkout') {
          if (parsed.promoCode) {
            setAppliedCheckoutPromo(parsed.promoCode);
          }
          setNavDirection('forward');
          setCurrentView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (window.history.pushState) {
            window.history.pushState({ view: 'checkout' }, '', '/checkout');
          }
          return;
        }

        if (parsed.action === 'route' && parsed.path) {
          setNavDirection('forward');
          setCurrentView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (window.history.pushState) {
            window.history.pushState({ view: 'checkout' }, '', parsed.path);
          }
          return;
        }
      }
    } catch (err) {
      console.error('Failed to restore intended checkout', err);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('ils_consultant_subscribed');
      localStorage.removeItem('ils_consultant_username');
      localStorage.removeItem('ils_consultant_name');
    } catch {
      // ignore
    }
    setUser(null);
    accountService.updateStoredUser(null);
    window.dispatchEvent(new CustomEvent('ils_consultant_subscribed', { detail: { subscribed: false } }));
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

    if (currentView === 'account' || currentView === 'checkout') {
      setCurrentView('home');
      if (window.history.pushState) {
        window.history.pushState({ view: 'home' }, '', '/');
      }
    }

    showToast('You have signed out successfully.', {
      title: 'Signed Out',
      type: 'info',
    });
  };

  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    options?: { selectedRingSize?: number; selectedJewelryType?: string; selectedSize?: string }
  ) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedRingSize === options?.selectedRingSize &&
          item.selectedJewelryType === options?.selectedJewelryType &&
          item.selectedSize === options?.selectedSize
      );
      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity,
          selectedRingSize: options?.selectedRingSize,
          selectedJewelryType: options?.selectedJewelryType,
          selectedSize: options?.selectedSize,
        },
      ];
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

    // Auth Guard: If user is not authenticated, require sign in before entering checkout
    if (!user) {
      try {
        localStorage.setItem(
          'ils_intended_checkout',
          JSON.stringify({ action: 'checkout', promoCode: promoCode || null })
        );
      } catch {
        // ignore
      }
      setAuthMode('login');
      setIsAuthOpen(true);
      if (window.history.pushState) {
        window.history.pushState({ view: 'home' }, '', '/login?redirect=/checkout');
      }
      showToast('Please sign in or create an account to proceed to checkout.', {
        title: 'Sign In Required',
        type: 'info',
      });
      return;
    }

    setAppliedCheckoutPromo(promoCode || null);
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection('forward');
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'checkout' }, '', '/checkout');
    }
  };

  const handleBuyNow = (
    product: Product,
    quantity: number = 1,
    options?: { selectedRingSize?: number; selectedJewelryType?: string; selectedSize?: string }
  ) => {
    // Auth Guard: If user is not authenticated, intercept before adding & checking out
    if (!user) {
      try {
        localStorage.setItem(
          'ils_intended_checkout',
          JSON.stringify({ action: 'buy-now', product, quantity, options })
        );
      } catch {
        // ignore
      }
      setAuthMode('login');
      setIsAuthOpen(true);
      if (window.history.pushState) {
        window.history.pushState({ view: 'home' }, '', '/login?redirect=/checkout');
      }
      showToast('Please sign in or create an account to complete your purchase.', {
        title: 'Sign In Required',
        type: 'info',
      });
      return;
    }

    handleAddToCart(product, quantity, options);
    handleTriggerCheckout();
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
    setIsProductLoading(false);
    setProductLoadingError(false);
    setCurrentView('product-details');
    window.scrollTo(0, 0);
    if (window.history.pushState) {
      window.history.pushState({ view: 'product-details', productId: product.id, productSlug: product.slug }, '', `/product/${product.slug}`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ils_route_change'));
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
    setSelectedCategory('All Surprises');
    setSearchQuery('');
    setSelectedProduct(null);
    setCurrentView('home');
    const targetScroll = direction === 'backward' ? scrollPositions.current['home'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'home', category: 'All Surprises' }, '', '/');
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

  const handleNavigateToAppraisal = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('appraisal');
    const targetScroll = direction === 'backward' ? scrollPositions.current['appraisal'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'appraisal' }, '', '/appraise-your-jewelry');
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

  const handleNavigateToRefundPolicy = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('refund-policy');
    const targetScroll = direction === 'backward' ? scrollPositions.current['refund-policy'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'refund-policy' }, '', '/refund-policy');
    }
  };

  const handleNavigateToTerms = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('terms');
    const targetScroll = direction === 'backward' ? scrollPositions.current['terms'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'terms' }, '', '/terms');
    }
  };

  const handleNavigateToOfficialRules = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('official-rules');
    const targetScroll = direction === 'backward' ? scrollPositions.current['official-rules'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'official-rules' }, '', '/official-rules');
    }
  };

  const handleNavigateToShippingPolicy = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('shipping-policy');
    const targetScroll = direction === 'backward' ? scrollPositions.current['shipping-policy'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'shipping-policy' }, '', '/shipping');
    }
  };

  const handleNavigateToPrivacy = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('privacy');
    const targetScroll = direction === 'backward' ? scrollPositions.current['privacy'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'privacy' }, '', '/privacy');
    }
  };

  const handleNavigateToFAQs = (direction: 'forward' | 'backward' = 'forward') => {
    scrollPositions.current[currentView] = window.scrollY;
    setNavDirection(direction);
    setCurrentView('faqs');
    const targetScroll = direction === 'backward' ? scrollPositions.current['faqs'] || 0 : 0;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    if (window.history.pushState) {
      window.history.pushState({ view: 'faqs' }, '', '/faqs');
    }
  };

  const handleNavigate = (
    route:
      | 'home'
      | 'shop'
      | 'categories'
      | 'affiliate'
      | 'about'
      | 'contact'
      | 'rewards'
      | 'admin'
      | 'appraisal'
      | 'refund-policy'
      | 'terms'
      | 'official-rules'
      | 'shipping-policy'
      | 'privacy'
      | 'faqs'
  ) => {
    if (route === 'admin') {
      handleNavigateToAdmin('overview');
    } else if (route === 'appraisal') {
      handleNavigateToAppraisal('forward');
    } else if (route === 'refund-policy') {
      handleNavigateToRefundPolicy('forward');
    } else if (route === 'terms') {
      handleNavigateToTerms('forward');
    } else if (route === 'official-rules') {
      handleNavigateToOfficialRules('forward');
    } else if (route === 'shipping-policy') {
      handleNavigateToShippingPolicy('forward');
    } else if (route === 'privacy') {
      handleNavigateToPrivacy('forward');
    } else if (route === 'faqs') {
      handleNavigateToFAQs('forward');
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
  const isCheckoutFlow = isCheckoutRoute(pathname, currentView);

  const cleanPath = (pathname || '').split('?')[0].split('#')[0];
  const isExplicitOrderSuccessPath =
    cleanPath.startsWith('/order-confirmation') ||
    cleanPath === '/thank-you' ||
    cleanPath === '/order-success';

  const isExplicitCheckoutStepPath =
    cleanPath === '/checkout' ||
    cleanPath.startsWith('/checkout/') ||
    cleanPath === '/checkout/shipping' ||
    cleanPath === '/payment' ||
    cleanPath === '/buy-now';

  // Shipping, delivery, payment, and checkout steps MUST ALWAYS render the Checkout page, NEVER OrderConfirmation!
  const isOrderConfirmation =
    isExplicitOrderSuccessPath ||
    (currentView === 'order-confirmation' && !isExplicitCheckoutStepPath);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#141219] w-full max-w-full min-w-0">
      <SEOHead
        view={currentView}
        product={selectedProduct}
        category={selectedCategory}
        accountTab={accountActiveTab}
      />
      {currentView === 'admin' ? (
        <div key="page-admin" className="flex-1 w-full min-h-screen bg-[#fcf9fb]">
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminDashboard
              initialTab={adminActiveTab}
              onNavigateToHome={() => handleNavigateToHome('backward')}
              onShowToast={showToast}
            />
          </Suspense>
        </div>
      ) : isCheckoutFlow ? (
        <>
          {/* Minimal Checkout Header: Hidden on shipping, delivery, and payment pages (only page heading shown) */}
          {isOrderConfirmation && (
            <MinimalCheckoutHeader
              onNavigateHome={() => handleNavigateToHome('backward')}
              onBackToShop={() => handleNavigateToShop(undefined, 'backward')}
            />
          )}

          {/* Checkout & Order Confirmation View with zero distractions */}
          <main className="flex-1 w-full overflow-hidden">
            {isOrderConfirmation ? (
              <div key={`page-order-confirmation-${confirmedOrderId || 'latest'}`} className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <OrderConfirmation
                    orderId={confirmedOrderId || undefined}
                    latestOrder={latestPlacedOrder}
                    onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
                    onNavigateToAccountOrders={(orderId) => handleNavigateToAccount('orders', orderId)}
                  />
                </Suspense>
              </div>
            ) : user ? (
              <div key="page-checkout" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Checkout
                    cart={cart}
                    user={user}
                    appliedPromoCode={appliedCheckoutPromo}
                    onOrderCompleted={handleOrderCompleted}
                    onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
                    onBackToCart={() => setIsCartOpen(true)}
                  />
                </Suspense>
              </div>
            ) : (
              <div key="page-checkout-auth-guard" className="min-h-[60vh] flex items-center justify-center p-6 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#fff1f2] border-2 border-[#fecdd3] text-[#D30915] flex items-center justify-center mx-auto shadow-xs">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h2 className="text-xl font-black text-[#141219]">Authentication Required</h2>
                  <p className="text-sm text-[#716d77]">
                    Please sign in or create an account to securely access checkout and shipping details.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAuth('login')}
                    className="h-[44px] px-6 rounded-[14px] bg-[#D30915] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs active:scale-95"
                  >
                    Sign In / Register
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Footer is COMPLETELY HIDDEN on checkout flow */}
        </>
      ) : (
        <>
          {/* Main Header / Navbar ONLY on Shopping Pages & Content Pages */}
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

          {/* Main Dynamic View: Shopping pages (Home, Categories, Shop, Product Details, Account, etc.) */}
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
                <Suspense fallback={<PageLoadingFallback />}>
                  <Categories
                    onSelectCategory={(cat) => handleNavigateToShop(cat, 'forward')}
                    onBackToHome={() => handleNavigateToHome('backward')}
                  />
                </Suspense>
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

            {currentView === 'product-details' && (
              selectedProduct ? (
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
                    onBuyNow={handleBuyNow}
                    onNavigateToAppraisal={() => handleNavigate('appraisal')}
                  />
                </div>
              ) : isProductLoading ? (
                <PageLoadingFallback />
              ) : productLoadingError ? (
                <div className="max-w-[700px] mx-auto px-4 py-20 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] flex items-center justify-center mx-auto mb-4 shadow-xs">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-black text-[#141219] mb-2 font-display">Product Not Found</h2>
                  <p className="text-sm text-[#716d77] max-w-md mx-auto mb-6 font-medium">
                    The requested product could not be found or is no longer available in our catalog. Explore our complete collection of real cash and jewelry reveal surprises!
                  </p>
                  <button
                    type="button"
                    onClick={() => handleNavigateToShop(undefined, 'backward')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D30915] hover:bg-[#b80712] text-white text-xs font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.25)] hover:shadow-[0_12px_24px_rgba(211,9,21,0.35)] transition-all cursor-pointer"
                  >
                    <span>Browse All Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <PageLoadingFallback />
              )
            )}

            {currentView === 'account' && (
              <div key={`page-account-${accountActiveTab}`} className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
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
                </Suspense>
              </div>
            )}

            {currentView === 'affiliate' && (
              <div key="page-affiliate" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <AffiliateDashboard
                    user={user}
                    onNavigateToHome={() => handleNavigateToHome('backward')}
                    onNavigateToAccount={() => handleNavigateToAccount('profile')}
                    onShowToast={showToast}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'about' && (
              <div key="page-about" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <About
                    onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
                    onNavigateToAffiliate={() => handleNavigateToAffiliate('forward')}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'contact' && (
              <div key="page-contact" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Contact />
                </Suspense>
              </div>
            )}

            {currentView === 'rewards' && (
              <div key="page-rewards" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Rewards
                    user={user}
                    onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
                    onOpenAuth={handleOpenAuth}
                    onShowToast={showToast}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'appraisal' && (
              <div key="page-appraisal" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <AppraiseJewelry
                    onNavigateToShop={() => handleNavigateToShop(undefined, 'forward')}
                    onNavigateToHome={() => handleNavigateToHome('backward')}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'refund-policy' && (
              <div key="page-refund-policy" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <RefundPolicy
                    onNavigateToContact={() => handleNavigateToContact('forward')}
                    onNavigateToHome={() => handleNavigateToHome('backward')}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'terms' && (
              <div key="page-terms" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Terms
                    onNavigateToHome={() => handleNavigateToHome('backward')}
                    onNavigateToContact={() => handleNavigateToContact('forward')}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'official-rules' && (
              <div key="page-official-rules" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <OfficialRules
                    onNavigateToHome={() => handleNavigateToHome('backward')}
                    onNavigateToContact={() => handleNavigateToContact('forward')}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'shipping-policy' && (
              <div key="page-shipping-policy" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <ShippingPolicy
                    onNavigateToHome={() => handleNavigateToHome('backward')}
                    onNavigateToContact={() => handleNavigateToContact('forward')}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'privacy' && (
              <div key="page-privacy" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <PrivacyPolicy
                    onNavigateToHome={() => handleNavigateToHome('backward')}
                    onNavigateToContact={() => handleNavigateToContact('forward')}
                  />
                </Suspense>
              </div>
            )}

            {currentView === 'faqs' && (
              <div key="page-faqs" className={transitionClass}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <FAQ
                    onNavigateToHome={() => handleNavigateToHome('backward')}
                    onNavigateToContact={() => handleNavigateToContact('forward')}
                  />
                </Suspense>
              </div>
            )}
          </main>

          {/* Main Footer ONLY on Shopping Pages */}
          <Footer onNavigate={handleNavigate} />
        </>
      )}

      {/* Sign In & Login / Create Account Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={handleCloseAuth}
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
      {isSubscriptionModalOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* State-of-the-Art Luxury Toast Notification (Dynamic Top Island & Glow) */}
      <ToastNotification
        toast={toast}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

export default App;
