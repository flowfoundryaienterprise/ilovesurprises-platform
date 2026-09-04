import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  ShoppingBag,
  User,
  MapPin,
  ChevronDown,
  Sparkles,
  X,
  Star,
  Truck,
  LogOut,
  PackageCheck,
  Heart,
  Users,
  Store,
  Menu,
  Home as HomeIcon,
  LayoutGrid,
  Info,
  Headphones,
  ArrowRight,
  Phone,
  Mail,
  Mic,
  Volume2,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import type { UserProfile, Product } from '../../types';
import { productsData } from '../../data/products';
import { categoriesData } from '../../data/categories';

const categoryMeta: Record<string, { badge: string; color: string; bg: string; border: string; fromPrice: string }> = {
  'cat-jewelry-candles': { badge: '★ Best Seller', color: 'text-[#D30915]', bg: 'bg-[#fff0f3]', border: 'border-[#fecdd3]', fromPrice: '$28.99' },
  'cat-cash-candles': { badge: '💵 Cash Inside', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', fromPrice: '$29.99' },
  'cat-wax-melts': { badge: '✨ Hidden Gem', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', fromPrice: '$14.99' },
  'cat-bath-body': { badge: '🌸 Spa Ritual', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200', fromPrice: '$16.99' },
  'cat-soaps': { badge: '🌿 Organic', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', fromPrice: '$9.99' },
  'cat-slimes': { badge: '🎉 Surprise Toy', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', fromPrice: '$12.99' },
};

export interface HeaderProps {
  cartCount?: number;
  cartSubtotal?: number;
  user?: UserProfile | null;
  activeView?: 'home' | 'shop' | 'categories' | 'product-details' | 'checkout' | 'order-confirmation' | 'account' | 'affiliate' | 'about' | 'contact' | 'rewards' | 'admin';
  onOpenCart?: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup' | 'forgot') => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
  onNavigate?: (route: 'home' | 'shop' | 'categories' | 'affiliate' | 'about' | 'contact' | 'rewards' | 'admin') => void;
  onNavigateToAccount?: (tab?: 'profile' | 'orders' | 'addresses' | 'wishlist' | 'settings' | 'affiliate') => void;
  onNavigateToAffiliate?: () => void;
  onOpenSubscription?: () => void;
  onNavigateToAdmin?: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCategory?: (category: string) => void;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  targetSectionId: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_LINKS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', targetSectionId: 'hero', icon: HomeIcon },
  { id: 'shop', label: 'Shop', href: '/shop', targetSectionId: 'featured', icon: ShoppingBag },
  { id: 'categories', label: 'Categories', href: '/categories', targetSectionId: 'categories', icon: LayoutGrid },
  { id: 'rewards', label: 'VIP Rewards', href: '/rewards', targetSectionId: 'rewards', icon: Star },
  { id: 'affiliate', label: 'Affiliate', href: '/affiliate', targetSectionId: 'affiliate', icon: Users },
  { id: 'about', label: 'About', href: '/about', targetSectionId: 'about', icon: Info },
  { id: 'contact', label: 'Contact', href: '/contact', targetSectionId: 'contact', icon: Headphones },
];

const availableLocations = [
  { name: 'New York', zip: '10001', state: 'NY', eta: '2-3 Days', tag: 'Fast Dispatch' },
  { name: 'Los Angeles', zip: '90001', state: 'CA', eta: '2-3 Days', tag: 'Fast Dispatch' },
  { name: 'Chicago', zip: '60601', state: 'IL', eta: '2 Days', tag: 'Next Day Available' },
  { name: 'Austin', zip: '78701', state: 'TX', eta: '2 Days', tag: 'Express Hub' },
  { name: 'Miami', zip: '33101', state: 'FL', eta: '2-3 Days', tag: 'Fast Dispatch' },
  { name: 'Seattle', zip: '98101', state: 'WA', eta: '3 Days', tag: 'Standard Transit' },
];

const POPULAR_TAGS = [
  'Cash Candles',
  'Diamond Jewelry',
  'Cola Soda Candle',
  'Bath Bomb Cash',
  'Citrus Fizz',
  'Wax Melts',
];

export const Header: React.FC<HeaderProps> = ({
  cartCount = 0,
  cartSubtotal = 0,
  user = null,
  activeView,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onSearch,
  onNavigate,
  onNavigateToAccount,
  onNavigateToAffiliate,
  onOpenSubscription,
  onNavigateToAdmin,
  onSelectProduct,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [currentLoc] = useState(availableLocations[0]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNavId, setActiveNavId] = useState<string>('home');
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Track if current visitor or logged-in user is an active subscribed consultant
  const [isConsultantSubscribed, setIsConsultantSubscribed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      user?.role === 'representative' ||
      localStorage.getItem('ils_consultant_subscribed') === 'true'
    );
  });

  useEffect(() => {
    const checkStatus = () => {
      const isSub = (
        user?.role === 'representative' ||
        localStorage.getItem('ils_consultant_subscribed') === 'true'
      );
      setIsConsultantSubscribed(isSub);
    };
    checkStatus();
    window.addEventListener('ils_consultant_subscribed', checkStatus);
    window.addEventListener('ilovesurprises_user_updated', checkStatus);
    window.addEventListener('storage', checkStatus);
    return () => {
      window.removeEventListener('ils_consultant_subscribed', checkStatus);
      window.removeEventListener('ilovesurprises_user_updated', checkStatus);
      window.removeEventListener('storage', checkStatus);
    };
  }, [user]);

  // Keyboard shortcut: Ctrl+K or Cmd+K opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const shopDropdownRef = useRef<HTMLDivElement>(null);
  const searchPopupRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Filter matching products for popup search view
  const matchingProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return productsData.filter((p) => p.isBestSeller).slice(0, 8);
    }
    const q = searchQuery.toLowerCase().trim();
    return productsData
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.surpriseValue?.toLowerCase().includes(q) ?? false) ||
          (p.scentNotes?.some((s) => s.toLowerCase().includes(q)) ?? false)
      )
      .slice(0, 12);
  }, [searchQuery]);

  // Open Mobile Menu safely
  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  // Close Mobile Menu safely
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close Voice Modal safely
  const closeVoiceModal = () => {
    setIsVoiceModalOpen(false);
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
  };

  // Handle device hardware return/back button (popstate event)
  useEffect(() => {
    const handlePopState = () => {
      if (isVoiceModalOpen) {
        closeVoiceModal();
      }
      if (isSearchOpen) {
        setIsSearchOpen(false);
      }
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSearchOpen, isMobileMenuOpen, isVoiceModalOpen, isListening]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (shopDropdownRef.current && !shopDropdownRef.current.contains(e.target as Node)) {
        setIsShopDropdownOpen(false);
      }
      if (
        searchPopupRef.current &&
        !searchPopupRef.current.contains(e.target as Node) &&
        searchButtonRef.current &&
        !searchButtonRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility: Close mobile drawer, search popup, and voice modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        closeVoiceModal();
        closeMobileMenu();
        setIsUserMenuOpen(false);
      }
      // Quick search shortcut (/)
      if (e.key === '/' && !isSearchOpen && !isVoiceModalOpen && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, isSearchOpen, isVoiceModalOpen]);

  // Auto-focus input when search popup opens
  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Scroll spy to update active navigation state dynamically
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headerOffset = 140;

      for (let i = NAV_LINKS.length - 1; i >= 0; i--) {
        const item = NAV_LINKS[i];
        const el = document.getElementById(item.targetSectionId);
        if (el) {
          const top = el.offsetTop - headerOffset;
          if (scrollY >= top) {
            setActiveNavId(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper to scroll to and highlight a product or section
  const scrollToProductOrFeatured = (productId?: string) => {
    setTimeout(() => {
      if (productId) {
        const productEl = document.getElementById(`product-${productId}`);
        if (productEl) {
          const navOffset = 90;
          const elementTop = productEl.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: Math.max(0, elementTop - navOffset),
            behavior: 'smooth',
          });
          productEl.classList.add('ring-4', 'ring-[#D30915]', 'scale-[1.02]', 'transition-all');
          setTimeout(() => {
            productEl.classList.remove('ring-4', 'ring-[#D30915]', 'scale-[1.02]');
          }, 2400);
          return;
        }
      }

      const targetEl = document.getElementById('featured');
      if (targetEl) {
        const navOffset = 90;
        const elementTop = targetEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementTop - navOffset),
          behavior: 'smooth',
        });
      }
    }, 120);
  };

  // Execute Search action
  const executeSearch = (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q) return;

    onSearch?.(q);
    setIsSearchOpen(false);
    closeVoiceModal();
    closeMobileMenu();

    // Find best matched product
    const matched = productsData.find(
      (p) =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.category.toLowerCase().includes(q.toLowerCase()) ||
        (p.scentNotes?.some((s) => s.toLowerCase().includes(q.toLowerCase())) ?? false)
    );

    scrollToProductOrFeatured(matched?.id);
  };

  // Web Speech API Voice Search Handler (With YouTube-style Animation Modal)
  const startVoiceSearch = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    setIsVoiceModalOpen(true);
    setVoiceFeedback('Listening...');

    if (!SpeechRecognition) {
      setVoiceFeedback('Voice recognition is not supported in this browser. Try on Chrome, Edge, or Android.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('Listening... Say something');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setSearchQuery(transcript);
          setVoiceFeedback(transcript);

          const isFinal = event.results?.[0]?.isFinal;
          if (isFinal) {
            onSearch?.(transcript);
            setTimeout(() => {
              executeSearch(transcript);
            }, 600);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceFeedback('Microphone permission denied.');
        } else {
          setVoiceFeedback("Didn't catch that. Tap the mic to try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceFeedback('Microphone is busy. Please try again.');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onSearch?.(q);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch?.('');
  };

  const handleSelectProduct = (product: Product) => {
    setSearchQuery(product.name);
    onSearch?.(product.name);
    setIsSearchOpen(false);
    closeMobileMenu();
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      scrollToProductOrFeatured(product.id);
    }
  };

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag);
    executeSearch(tag);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    e.preventDefault();
    setActiveNavId(item.id);
    closeMobileMenu();
    setIsSearchOpen(false);

    if (item.id === 'shop') {
      onNavigate?.('shop');
      return;
    } else if (item.id === 'categories') {
      onNavigate?.('categories');
      return;
    } else if (item.id === 'affiliate') {
      if (onNavigateToAffiliate) {
        onNavigateToAffiliate();
      } else {
        onNavigate?.('affiliate');
      }
      return;
    } else if (item.id === 'rewards') {
      onNavigate?.('rewards');
      return;
    } else if (item.id === 'about') {
      onNavigate?.('about');
      return;
    } else if (item.id === 'contact') {
      onNavigate?.('contact');
      return;
    } else if (item.id === 'home') {
      onNavigate?.('home');
      return;
    }

    if (activeView && activeView !== 'home') {
      onNavigate?.('home');
    }

    if (window.history.pushState) {
      window.history.pushState(null, '', item.href);
    }

    setTimeout(() => {
      const targetEl = document.getElementById(item.targetSectionId);
      if (targetEl) {
        const navOffset = 80;
        const elementTop = targetEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: Math.max(0, elementTop - navOffset),
          behavior: 'smooth',
        });
      } else if (item.id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 backdrop-blur-xl border-b border-[#eee7ed] shadow-[0_4px_24px_rgba(50,31,63,0.05)] transition-all">

      {/* 1. Top VIP Announcement Ribbon (Hidden on mobile) */}
      <div className="hidden md:block bg-gradient-to-r from-[#fff1f6] via-[#fff8fb] to-[#fbf6ff] border-b border-[#f5e8ef] text-[10px] sm:text-[11px] font-bold text-[#716d77] py-1 sm:py-1.5 px-3 sm:px-4">
        <div className="max-w-[1460px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#141219] truncate">
            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D30915] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#D30915]" />
            </span>
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D30915] shrink-0" />
            <span className="truncate">
              Fast Express Dispatch • Guaranteed Real Cash ($2-$2,500) or Jewelry in 100% of Orders
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[#716d77] shrink-0 ml-2">
            <button
              type="button"
              onClick={() => onNavigate?.('rewards')}
              className="flex items-center gap-1 hover:text-[#D30915] transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Surprise Club Rewards</span>
            </button>
            <span className="text-[#eee7ed]">|</span>
            <span>Free Shipping $50+</span>
            <span className="text-[#eee7ed]">|</span>
            <a
              href="/affiliate"
              onClick={(e) => {
                e.preventDefault();
                if (isConsultantSubscribed) {
                  if (onNavigateToAffiliate) {
                    onNavigateToAffiliate();
                  } else {
                    handleNavClick(e, {
                      id: 'affiliate',
                      label: 'Affiliate',
                      href: '/affiliate',
                      targetSectionId: 'affiliate',
                      icon: Users,
                    });
                  }
                } else if (onOpenSubscription) {
                  onOpenSubscription();
                } else if (onNavigateToAffiliate) {
                  onNavigateToAffiliate();
                } else {
                  handleNavClick(e, {
                    id: 'affiliate',
                    label: 'Affiliate',
                    href: '/affiliate',
                    targetSectionId: 'affiliate',
                    icon: Users,
                  });
                }
              }}
              className="text-[#D30915] hover:underline font-black cursor-pointer inline-flex items-center gap-1"
            >
              {isConsultantSubscribed ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>My Storefront</span>
                </>
              ) : (
                <span>Earn 20% Reps</span>
              )}
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Brand & Navigation Header Bar */}
      <div className="relative w-full max-w-[1460px] mx-auto px-2.5 sm:px-4 lg:px-6 py-2 sm:py-2.5">
        <div className="relative flex items-center justify-between gap-2 xl:gap-3 2xl:gap-6">

          {/* Left Block: Brand Logo + Desktop Delivery Location */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Brand Logo */}
            <a
              href="/"
              onClick={(e) =>
                handleNavClick(e, {
                  id: 'home',
                  label: 'Home',
                  href: '/',
                  targetSectionId: 'hero',
                  icon: HomeIcon,
                })
              }
              className="flex items-center shrink-0 group focus:outline-none"
              aria-label="ILoveSurprises Home"
            >
              <img
                src="/assets/ilovesurprises/logo/New logo.jpeg"
                alt="I Love Surprises Logo"
                className="h-[44px] sm:h-[50px] md:h-[58px] lg:h-[64px] w-auto max-w-[180px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[290px] object-contain transition-transform duration-300 group-hover:scale-102"
                loading="eager"
              />
            </a>
          </div>

          {/* Center Block: Reference Primary Horizontal Navigation Menu matching Client Reference UI */}
          <nav
            className="hidden xl:flex items-center justify-center gap-0.5 2xl:gap-1.5 px-1 py-1 rounded-[16px] z-20 xl:absolute xl:left-1/2 xl:-translate-x-1/2"
            aria-label="Main Navigation"
          >
            {/* Home */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.('home');
              }}
              className={`px-2 xl:px-2.5 py-1.5 rounded-[12px] text-[12.5px] xl:text-[13px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap ${activeView === 'home'
                ? 'text-[#D30915]'
                : 'text-[#141219] hover:text-[#D30915]'
                }`}
            >
              Home
            </a>

            {/* 1. Shop ∨ Dropdown Trigger */}
            <div
              ref={shopDropdownRef}
              className="relative"
              onMouseEnter={() => setIsShopDropdownOpen(true)}
              onMouseLeave={() => setIsShopDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => {
                  onNavigate?.('shop');
                  setIsShopDropdownOpen(false);
                }}
                className={`group flex items-center gap-1 px-2 xl:px-2.5 py-1.5 rounded-[12px] text-[12.5px] xl:text-[13px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap ${activeView === 'shop' || isShopDropdownOpen
                  ? 'text-[#D30915]'
                  : 'text-[#141219] hover:text-[#D30915]'
                  }`}
              >
                <span>Shop</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isShopDropdownOpen ? 'rotate-180 text-[#D30915]' : 'text-[#716d77] group-hover:text-[#D30915]'}`} />
              </button>

              {/* Luxury Mega Dropdown for Shop */}
              {isShopDropdownOpen && (
                <div className="absolute -left-12 lg:-left-20 top-full pt-2 w-[720px] xl:w-[760px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                  {/* Pointer Beak */}
                  <div className="absolute top-0.5 left-16 w-3.5 h-3.5 bg-white border-t border-l border-[#f0dae7] rotate-45 z-20" />

                  {/* Dropdown Card */}
                  <div className="relative p-5 bg-white/98 backdrop-blur-2xl rounded-[26px] border border-[#f0dae7] shadow-[0_24px_65px_rgba(50,20,35,0.15),0_4px_12px_rgba(211,9,21,0.04)] overflow-hidden">
                    {/* Header Row inside Dropdown */}
                    <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#f4edf2]">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D30915] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D30915]" />
                        </span>
                        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-[#D30915]">
                          Surprise Collections & Reveals
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsShopDropdownOpen(false);
                          onNavigate?.('shop');
                        }}
                        className="group/all text-xs font-bold text-[#716d77] hover:text-[#D30915] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>View All 80+ Products</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/all:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Content: Balanced Left Grid + Right Editorial Card */}
                    <div className="grid grid-cols-12 gap-4">
                      {/* Left Section (7 cols): Neat 2-Column Grid of 6 Categories */}
                      <div className="col-span-7 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-2">
                          {categoriesData.map((cat) => {
                            const meta = categoryMeta[cat.id];
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setIsShopDropdownOpen(false);
                                  if (onSelectCategory) {
                                    onSelectCategory(cat.name);
                                  } else {
                                    onNavigate?.('shop');
                                  }
                                }}
                                className="group/cat flex items-center gap-2.5 p-2 rounded-[14px] hover:bg-[#fff5f8] border border-transparent hover:border-[#fecdd3] hover:shadow-2xs transition-all cursor-pointer text-left"
                              >
                                {/* Category Thumbnail */}
                                <div className="w-10 h-10 rounded-[11px] bg-[#fffafb] border border-[#f3e1eb] group-hover/cat:border-[#D30915]/30 group-hover/cat:scale-105 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs transition-all">
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-full object-contain rounded-[7px]"
                                    loading="lazy"
                                  />
                                </div>

                                {/* Category Info */}
                                <div className="min-w-0 flex-1">
                                  <strong className="block text-[12.5px] font-bold text-[#141219] group-hover/cat:text-[#D30915] leading-tight tracking-tight transition-colors truncate">
                                    {cat.name}
                                  </strong>
                                  <span className="block text-[10.5px] text-[#716d77] group-hover/cat:text-[#454249] leading-tight font-medium truncate mt-0.5">
                                    {cat.tagline}
                                  </span>
                                  <span className="inline-block text-[10px] font-bold text-[#D30915] mt-0.5">
                                    From {meta?.fromPrice || '$19.99'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick Trending Searches Bar */}
                        <div className="pt-2.5 mt-2 border-t border-[#f7edf3] flex items-center gap-1.5 text-[10.5px] text-[#716d77]">
                          <span className="font-bold text-[#D30915] shrink-0">🔥 Trending:</span>
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            {['Diamond Rings', 'Soda Pop Cash', 'Figurine Melts', 'Gift Sets'].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  setIsShopDropdownOpen(false);
                                  onSearch?.(tag);
                                }}
                                className="px-2 py-0.5 rounded-full bg-[#faf5f8] hover:bg-[#fff0f3] hover:text-[#D30915] border border-[#f0e2eb] text-[9.5px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right Section (5 cols): Single High-End Editorial Featured Card */}
                      <div className="col-span-5 flex flex-col">
                        <div
                          onClick={() => {
                            setIsShopDropdownOpen(false);
                            if (onSelectCategory) {
                              onSelectCategory('Surprise Boxes');
                            } else {
                              onNavigate?.('shop');
                            }
                          }}
                          className="h-full rounded-[20px] bg-gradient-to-br from-[#fff7f9] via-[#ffedf2] to-[#fde5eb] border border-[#fcd5df] p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer group/spotlight relative overflow-hidden"
                        >
                          <div>
                            {/* Top Badge & Callout */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D30915] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5" />
                                ★ Top Reveal
                              </span>
                              <span className="text-[9.5px] font-black text-[#D30915] bg-white/90 border border-[#fbdde4] px-2 py-0.5 rounded-full">
                                Win Up to $7,500
                              </span>
                            </div>

                            {/* Product Image */}
                            <div className="w-full h-[110px] rounded-[13px] overflow-hidden mb-2.5 shadow-2xs border border-white/80 bg-white">
                              <img
                                src="/assets/ilovesurprises/hero/hero-lifestyle-reveal.jpg"
                                alt="Mystery Box Spotlight"
                                className="w-full h-full object-cover group-hover/spotlight:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <strong className="block text-[13px] font-black text-[#141219] leading-tight mb-1 group-hover/spotlight:text-[#D30915] transition-colors">
                              Mystery Jewelry Box
                            </strong>
                            <p className="text-[10.5px] text-[#716d77] leading-snug m-0 font-medium line-clamp-2">
                              Guaranteed genuine diamond or gold jewelry revealed inside every box.
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-[#f7d3dd] flex items-center justify-between">
                            <div>
                              <span className="block text-[8.5px] font-bold uppercase text-[#9e97a2] tracking-wider leading-none">Starts At</span>
                              <span className="text-[13px] font-black text-[#D30915] leading-none">$39.99</span>
                            </div>
                            <span className="text-[10px] font-bold text-white bg-[#D30915] group-hover/spotlight:bg-[#b60711] group-hover/spotlight:scale-102 px-3 py-1.5 rounded-full shadow-2xs transition-all flex items-center gap-1">
                              <span>Shop Now</span>
                              <ArrowRight className="w-3 h-3 group-hover/spotlight:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Strip: 4 Key Guarantees */}
                    <div className="mt-3.5 pt-2.5 border-t border-[#f4edf2] flex items-center justify-between text-[10.5px] font-bold text-[#635f6a] bg-[#faf5f8] -mx-5 -mb-5 px-5 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[#D30915]">💎</span>
                        <span>Real Jewelry Inside</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-[#D30915]" />
                        <span>Free Shipping $75+</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-[#D30915]" />
                        <span>Gift-Ready Box</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D30915]" />
                        <span>100% Guaranteed</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Candles */}
            <button
              type="button"
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory('Jewelry Candles');
                } else {
                  onNavigate?.('shop');
                }
              }}
              className="px-2 xl:px-2.5 py-1.5 rounded-[12px] text-[12.5px] xl:text-[13px] font-bold text-[#141219] hover:text-[#D30915] transition-colors cursor-pointer select-none whitespace-nowrap"
            >
              Candles
            </button>

            {/* 3. Surprise Boxes (placed near Candles) */}
            <button
              type="button"
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory('Surprise Boxes');
                } else {
                  onNavigate?.('shop');
                }
              }}
              className="px-2 xl:px-2.5 py-1.5 rounded-[12px] text-[12.5px] xl:text-[13px] font-bold text-[#141219] hover:text-[#D30915] transition-colors cursor-pointer select-none whitespace-nowrap"
            >
              Surprise Boxes
            </button>

            {/* 4. Mystery Jewelry */}
            <button
              type="button"
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory('Cash Jewelry');
                } else {
                  onNavigate?.('shop');
                }
              }}
              className="px-2 xl:px-2.5 py-1.5 rounded-[12px] text-[12.5px] xl:text-[13px] font-bold text-[#141219] hover:text-[#D30915] transition-colors cursor-pointer select-none whitespace-nowrap"
            >
              Mystery Jewelry
            </button>

            {/* 5. Rewards */}
            <button
              type="button"
              onClick={() => {
                onNavigate?.('rewards');
              }}
              className={`px-2 xl:px-2.5 py-1.5 rounded-[12px] text-[12.5px] xl:text-[13px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap ${activeView === 'rewards'
                ? 'text-[#D30915] font-black'
                : 'text-[#141219] hover:text-[#D30915]'
                }`}
            >
              Rewards
            </button>
          </nav>

          {/* Right Header Actions: Search, Login, Join for $20/mo Button, Cart & Hamburger */}
          <div className="relative z-30 flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Search Icon Trigger Button - High Contrast & Guaranteed Visibility */}
            <button
              ref={searchButtonRef}
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className={`flex items-center justify-center w-[36px] sm:w-[38px] h-[36px] sm:h-[38px] rounded-full border transition-all duration-200 cursor-pointer shadow-xs ${isSearchOpen
                ? 'bg-[#fff1f2] border-[#D30915] text-[#D30915] ring-2 ring-[#D30915]/20'
                : 'bg-white border-[#e8dfe5] text-[#141219] hover:text-[#D30915] hover:border-[#D30915] hover:bg-[#fff9fb]'
                }`}
              title={isSearchOpen ? 'Close search' : 'Search catalog'}
              aria-label={isSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={isSearchOpen}
            >
              {isSearchOpen ? (
                <X className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Search className="w-4 h-4 sm:w-[17px] sm:h-[17px] stroke-[2.5]" />
              )}
            </button>

            {/* When NOT logged in: Login Button matching Reference */}
            {!user ? (
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="hidden sm:flex items-center gap-1.5 h-[36px] sm:h-[38px] px-2.5 sm:px-3 rounded-full hover:bg-[#fff1f2] text-xs sm:text-[13px] font-bold text-[#141219] hover:text-[#D30915] transition-colors cursor-pointer select-none shrink-0"
              >
                <User className="w-3.5 h-3.5 text-[#141219]" />
                <span>Login</span>
              </button>
            ) : (
              /* When LOGGED IN: User Profile Pill */
              <div ref={userMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 h-[36px] sm:h-[38px] p-1 sm:p-1.5 pr-2 rounded-[13px] sm:rounded-[14px] bg-[#fffafc] border border-[#fecdd3] hover:border-[#D30915] shadow-2xs transition-all cursor-pointer text-left"
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                >
                  <img
                    src={user.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#D30915]"
                  />

                  <div className="leading-tight hidden 2xl:block">
                    <span className="block text-xs font-black text-[#141219] truncate max-w-[85px]">
                      {user.name.split(' ')[0]}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3 h-3 text-[#716d77] transition-transform ${isUserMenuOpen ? 'rotate-180 text-[#D30915]' : ''
                      }`}
                  />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white rounded-[20px] border border-[#eee7ed] shadow-[0_16px_40px_rgba(50,31,63,0.15)] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2 mb-2 bg-[#fff8fb] rounded-[14px] border border-[#f5e4ec]">
                      <strong className="block text-xs font-black text-[#141219] truncate">
                        {user.name}
                      </strong>
                      <span className="text-[10px] text-[#716d77] block truncate">{user.email}</span>
                      <span className="inline-block mt-1 text-[9px] font-black uppercase text-[#D30915] bg-white px-2 py-0.5 rounded-full border border-[#fecdd3]">
                        {user.role === 'representative' ? '★ Active Representative' : '💎 VIP Member'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-bold text-[#55505a]">
                      {user.role === 'representative' && (
                        <a
                          href="/affiliate"
                          onClick={(e) => {
                            setIsUserMenuOpen(false);
                            handleNavClick(e, {
                              id: 'affiliate',
                              label: 'Affiliate',
                              href: '/affiliate',
                              targetSectionId: 'affiliate',
                              icon: Users,
                            });
                          }}
                          className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-[#D30915]" />
                          <span>Rep Portal Dashboard</span>
                        </a>
                      )}

                      <a
                        href="/account"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsUserMenuOpen(false);
                          if (onNavigateToAccount) {
                            onNavigateToAccount('profile');
                          } else {
                            onNavigate?.('home');
                          }
                        }}
                        className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#D30915]" />
                        <span>My Account & Profile</span>
                      </a>

                      <a
                        href="/account"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsUserMenuOpen(false);
                          if (onNavigateToAccount) {
                            onNavigateToAccount('orders');
                          } else {
                            onNavigate?.('home');
                          }
                        }}
                        className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>My Surprise Orders</span>
                      </a>

                      <a
                        href="/account"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsUserMenuOpen(false);
                          if (onNavigateToAccount) {
                            onNavigateToAccount('addresses');
                          } else {
                            onNavigate?.('home');
                          }
                        }}
                        className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        <span>Saved Addresses</span>
                      </a>

                      <a
                        href="/account"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsUserMenuOpen(false);
                          if (onNavigateToAccount) {
                            onNavigateToAccount('wishlist');
                          } else {
                            onNavigate?.('home');
                          }
                        }}
                        className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#D30915]" />
                        <span>My Wishlist</span>
                      </a>

                      <a
                        href="/account"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsUserMenuOpen(false);
                          if (onNavigateToAccount) {
                            onNavigateToAccount('settings');
                          } else {
                            onNavigate?.('home');
                          }
                        }}
                        className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>Account Settings</span>
                      </a>

                      <a
                        href="/admin"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsUserMenuOpen(false);
                          if (onNavigateToAdmin) {
                            onNavigateToAdmin();
                          } else {
                            onNavigate?.('admin');
                          }
                        }}
                        className="flex items-center gap-2 p-2 rounded-[10px] bg-[#fffbfd] hover:bg-[#fff1f2] text-[#D30915] font-black transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D30915]" />
                        <span>Admin Suite Portal</span>
                      </a>

                      <div className="pt-1.5 border-t border-[#f4edf2]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout?.();
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-[10px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Join for $19.99/mo CTA Button OR My Storefront when Subscribed */}
            {isConsultantSubscribed ? (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToAffiliate) {
                    onNavigateToAffiliate();
                  } else {
                    onNavigate?.('affiliate');
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 h-[36px] sm:h-[38px] px-3 sm:px-3.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-[13px] font-bold shadow-2xs hover:shadow-[0_4px_16px_rgba(5,150,105,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer whitespace-nowrap select-none shrink-0"
                title="Go to My Consultant Storefront Portal"
              >
                <Store className="w-3.5 h-3.5" />
                <span>My Storefront</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onOpenSubscription) {
                    onOpenSubscription();
                  } else if (onNavigateToAffiliate) {
                    onNavigateToAffiliate();
                  } else {
                    onNavigate?.('affiliate');
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 h-[36px] sm:h-[38px] px-3 sm:px-3.5 rounded-full bg-[#D30915] hover:bg-[#b60711] text-white text-xs sm:text-[13px] font-bold shadow-2xs hover:shadow-[0_6px_20px_rgba(211,9,21,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer whitespace-nowrap select-none shrink-0"
                title="Join for $19.99/month"
              >
                <span>Join for $19.99/mo</span>
                <Users className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Shopping Cart Button right near Join for $20/month button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center justify-center gap-1.5 sm:gap-2 h-[36px] sm:h-[38px] px-3 sm:px-3.5 rounded-full bg-[#fffafc] hover:bg-[#fff0f3] text-[#141219] hover:text-[#D30915] border border-[#fecdd3] hover:border-[#D30915] shadow-2xs hover:shadow-[0_4px_16px_rgba(211,9,21,0.15)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer select-none shrink-0"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-[#D30915] shrink-0" />
              <span className="text-xs sm:text-[13px] font-extrabold tracking-tight">
                Cart
              </span>
              <span
                key={cartCount}
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black transition-colors shrink-0 ${cartCount > 0
                  ? 'bg-[#D30915] text-white shadow-xs'
                  : 'bg-[#f5e8ef] text-[#716d77]'
                  }`}
              >
                {cartCount}
              </span>
            </button>

            {/* Mobile 3-Lines Hamburger Menu Button */}
            <button
              type="button"
              onClick={openMobileMenu}
              className="xl:hidden w-[36px] h-[36px] rounded-[11px] bg-[#fffafb] border border-[#f0e4ec] text-[#141219] hover:text-[#D30915] hover:border-[#D30915] active:scale-95 transition-all cursor-pointer focus:outline-none flex items-center justify-center shadow-2xs shrink-0"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </button>

          </div>
        </div>

        {/* Expandable / Popup Search Interface (Opens smoothly when Search icon is clicked) */}
        {isSearchOpen && (
          <div
            ref={searchPopupRef}
            className="absolute top-full right-2 sm:right-6 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 mt-1.5 w-[calc(100vw-20px)] sm:w-[500px] md:w-[580px] max-w-[620px] bg-white/98 backdrop-blur-xl rounded-[20px] border-2 border-[#fecdd3] shadow-[0_16px_40px_rgba(50,31,63,0.18)] p-3 sm:p-4 z-50 animate-in fade-in zoom-in-95 duration-200 ease-out isolate"
            role="search"
            aria-label="Site Search"
          >
            {/* Search Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch();
              }}
              className="relative flex items-center w-full h-[44px] rounded-[14px] bg-[#fff9fb] border border-[#eedbe6] focus-within:border-[#D30915] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#D30915]/15 transition-all px-3 shadow-2xs"
            >
              <Search className="w-4 h-4 text-[#D30915] shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search candles, jewelry, cash surprises..."
                className="w-full text-xs sm:text-sm text-[#141219] placeholder:text-[#8a858f] bg-transparent outline-none border-0 font-bold"
                aria-label="Search keywords"
              />

              {/* Voice Search inside popup */}
              <button
                type="button"
                onClick={startVoiceSearch}
                title="Search by voice"
                className="p-1 rounded-full text-[#8a858f] hover:text-[#D30915] hover:bg-[#fff1f2] transition-colors shrink-0 ml-1 cursor-pointer"
                aria-label="Voice search"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-[#8a858f] hover:text-[#141219] cursor-pointer shrink-0 ml-0.5"
                  aria-label="Clear search text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                className="ml-2 px-3.5 py-1.5 rounded-[10px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
              >
                Search
              </button>
            </form>

            {/* Quick Trending Searches */}
            <div className="mt-2.5 pt-2.5 border-t border-[#f4edf2]">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-1.5">
                <Sparkles className="w-3 h-3 text-[#D30915]" />
                <span>Popular Searches:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="px-2.5 py-1 rounded-[8px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Quick Results inside popup if search query present */}
            {searchQuery.trim() && matchingProducts.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-[#f4edf2] max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-1 flex items-center justify-between">
                  <span>Matching Products</span>
                  <span className="text-[#D30915] font-bold">{matchingProducts.length} items</span>
                </div>
                {matchingProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectProduct(p)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectProduct(p);
                      }
                    }}
                    className="p-1.5 sm:p-2 rounded-[10px] hover:bg-[#fff1f2] flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-9 h-9 rounded-[8px] object-cover shrink-0 border border-[#eee0e8]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#141219] group-hover:text-[#D30915] truncate m-0">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-[#716d77] m-0">
                          ${p.price.toFixed(2)} • {p.category} • {p.surpriseType === 'cash' ? '💵 Cash' : '💍 Jewelry'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D30915] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Close hint */}
            <div className="mt-2 pt-2 border-t border-[#f4edf2] flex items-center justify-between text-[10px] text-[#8a858f]">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-stone-100 border border-stone-300 font-mono text-[9px]">Esc</kbd> to close</span>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-[#D30915] font-bold hover:underline cursor-pointer"
              >
                Close Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Full-Screen Mobile Navigation Drawer Portal */}
      {typeof document !== 'undefined' && isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end">
          {/* Backdrop overlay with blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-backdrop-fade"
            onClick={() => closeMobileMenu()}
            aria-hidden="true"
          />

          {/* Slide-in Drawer Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="relative w-[85%] max-w-[340px] h-full bg-white shadow-2xl z-10 flex flex-col justify-between overflow-y-auto border-l border-[#eee7ed] animate-drawer-in"
          >
            {/* Drawer Top Header */}
            <div>
              <div className="p-4 border-b border-[#f4edf2] flex items-center justify-between bg-gradient-to-r from-[#fff5f5] to-[#ffffff]">
                <a
                  href="/"
                  onClick={(e) =>
                    handleNavClick(e, {
                      id: 'home',
                      label: 'Home',
                      href: '/',
                      targetSectionId: 'hero',
                      icon: HomeIcon,
                    })
                  }
                  className="flex items-center"
                  aria-label="Home"
                >
                  <img
                    src="/assets/ilovesurprises/logo/New logo.jpeg"
                    alt="I Love Surprises Logo"
                    className="h-[41px] w-auto max-w-[195px] object-contain"
                  />
                </a>

                <button
                  type="button"
                  onClick={() => closeMobileMenu()}
                  className="w-9 h-9 rounded-full bg-white border border-[#ecdbe6] hover:bg-[#fff1f2] hover:text-[#D30915] text-[#716d77] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Drawer Search Trigger */}
              <div className="p-3 bg-[#fffafc] border-b border-[#f5e8ef]">
                <div className="w-full h-[40px] rounded-[13px] bg-white border border-[#ecdbe6] hover:border-[#D30915] flex items-center px-3 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      setIsSearchOpen(true);
                    }}
                    className="flex items-center flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-[#D30915] shrink-0 mr-2" />
                    <span className="w-full text-xs text-[#817c85] font-medium truncate">
                      {searchQuery || 'Search all surprise products...'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      startVoiceSearch();
                    }}
                    className="p-1 text-[#8a858f] hover:text-[#D30915] cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Drawer Cart Quick Link */}
              <div className="px-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    onOpenCart?.();
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-[14px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96050e] text-white flex items-center justify-between font-bold text-sm shadow-md active:scale-98 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shopping Cart</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-white text-[#D30915] text-xs font-black px-2 py-0.5 rounded-full shadow-xs">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'}
                    </span>
                    {cartSubtotal > 0 && (
                      <span className="text-white/90 text-xs font-bold">
                        ${cartSubtotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <div className="p-3">
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#8a858f] px-3 mb-2">
                  Navigation Menu
                </span>

                <div className="space-y-1">
                  {NAV_LINKS.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = (activeView && activeView === item.id) || (!activeView && activeNavId === item.id);
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item)}
                        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-[14px] flex items-center justify-between text-left font-bold text-sm transition-all duration-200 cursor-pointer ${isActive
                          ? 'bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] shadow-2xs font-black'
                          : 'hover:bg-[#fff9fb] text-[#141219] border border-transparent'
                          }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors ${isActive
                              ? 'bg-[#D30915] text-white shadow-xs'
                              : 'bg-[#fff1f2] text-[#D30915]'
                              }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>

                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-[#D30915] translate-x-0.5' : 'text-[#beb8c2]'
                            }`}
                        />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Express Shipping Hub Location */}
              <div className="p-3 border-t border-[#f4edf2]">
                <div className="p-2.5 rounded-[14px] bg-[#fff8fb] border border-[#f5e4ec]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>Express Shipping Hub</span>
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                      {currentLoc.eta}
                    </span>
                  </div>
                  <div className="text-xs font-black text-[#141219] truncate">
                    {currentLoc.name}, {currentLoc.state} ({currentLoc.zip})
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer: Account Actions & Support */}
            <div className="p-4 border-t border-[#f4edf2] bg-gradient-to-b from-[#fffafc] to-[#fff5f5] space-y-3">
              {/* Account Status */}
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    onOpenAuth?.('login');
                  }}
                  className="w-full h-[42px] px-3.5 rounded-[12px] bg-[#fff1f2] border border-[#fecdd3] hover:border-[#D30915] hover:bg-[#D30915] hover:text-white text-[#D30915] text-xs font-black shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 select-none"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              ) : (
                <div className="p-2.5 bg-white rounded-[14px] border border-[#fecdd3] shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={user.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#D30915] shrink-0"
                      />
                      <div className="min-w-0">
                        <strong className="block text-xs font-black text-[#141219] truncate">
                          {user.name}
                        </strong>
                        <span className="text-[10px] text-[#716d77] block truncate">{user.email}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full border border-[#fecdd3] shrink-0">
                      {user.role === 'representative' ? '20% Rep' : 'VIP'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#f4edf2] text-[11px] font-bold text-[#55505a]">
                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        if (onNavigateToAccount) {
                          onNavigateToAccount('profile');
                        } else {
                          onNavigate?.('home');
                        }
                      }}
                      className="p-1.5 rounded-[8px] bg-[#fffafc] hover:bg-[#fff1f2] hover:text-[#D30915] flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <User className="w-3 h-3 text-[#D30915]" />
                      <span>Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        if (onNavigateToAccount) {
                          onNavigateToAccount('orders');
                        } else {
                          onNavigate?.('home');
                        }
                      }}
                      className="p-1.5 rounded-[8px] bg-[#fffafc] hover:bg-[#fff1f2] hover:text-[#D30915] flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <PackageCheck className="w-3 h-3 text-emerald-600" />
                      <span>Orders</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        if (onNavigateToAccount) {
                          onNavigateToAccount('addresses');
                        } else {
                          onNavigate?.('home');
                        }
                      }}
                      className="p-1.5 rounded-[8px] bg-[#fffafc] hover:bg-[#fff1f2] hover:text-[#D30915] flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <MapPin className="w-3 h-3 text-purple-600" />
                      <span>Addresses</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeMobileMenu();
                        if (onNavigateToAccount) {
                          onNavigateToAccount('wishlist');
                        } else {
                          onNavigate?.('home');
                        }
                      }}
                      className="p-1.5 rounded-[8px] bg-[#fffafc] hover:bg-[#fff1f2] hover:text-[#D30915] flex items-center gap-1.5 cursor-pointer text-left"
                    >
                      <Heart className="w-3 h-3 text-[#D30915]" />
                      <span>Wishlist</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      if (onNavigateToAdmin) {
                        onNavigateToAdmin();
                      } else {
                        onNavigate?.('admin');
                      }
                    }}
                    className="w-full h-[32px] rounded-[10px] bg-[#fff1f2] text-[#D30915] hover:bg-[#ffe5ef] text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Admin Suite Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onLogout?.();
                    }}
                    className="w-full h-[32px] rounded-[10px] bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}

              {/* Direct Support Contact Links */}
              <div className="pt-2 border-t border-[#f2e6ee] flex items-center justify-between text-[10px] font-bold text-[#716d77]">
                <a
                  href="tel:18007877747"
                  className="flex items-center gap-1 hover:text-[#D30915] transition-colors"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>1-800-SURPRISE</span>
                </a>
                <a
                  href="mailto:support@ilovesurprises.com"
                  className="flex items-center gap-1 hover:text-[#D30915] transition-colors"
                >
                  <Mail className="w-3 h-3 text-[#D30915]" />
                  <span>Email Help</span>
                </a>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 4. YouTube-Style Animated Voice Search Modal Overlay */}
      {typeof document !== 'undefined' && isVoiceModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-[#f0dae7] text-center flex flex-col items-center overflow-hidden">

            {/* Close Button in Top-Right */}
            <button
              type="button"
              onClick={closeVoiceModal}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#fff5f8] hover:bg-[#D30915] text-[#716d77] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs border border-[#fecdd3]"
              aria-label="Close voice search"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Voice Status Heading */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3] mb-2">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Voice Search</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#141219]">
                {isListening ? 'Listening...' : 'Try saying something'}
              </h3>
              <p className="text-xs sm:text-sm text-[#716d77] mt-1 max-w-[280px]">
                Say a candle scent, jewelry surprise, or cash prize
              </p>
            </div>

            {/* YouTube Animated Ripple Pulse & Equalizer */}
            <div className="relative my-4 flex items-center justify-center w-40 h-40">
              {/* Outer Ripple Wave 1 */}
              <div
                className={`absolute w-36 h-36 rounded-full bg-[#D30915]/15 transition-all duration-1000 ${isListening ? 'animate-ping' : 'scale-90 opacity-20'
                  }`}
              />

              {/* Middle Ripple Wave 2 */}
              <div
                className={`absolute w-28 h-28 rounded-full bg-[#D30915]/25 transition-all duration-700 ${isListening ? 'animate-pulse' : 'scale-90 opacity-40'
                  }`}
              />

              {/* Center YouTube Mic Button */}
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(211, 9, 21,0.45)] transition-transform duration-200 cursor-pointer active:scale-95 ${isListening
                  ? 'bg-gradient-to-tr from-[#D30915] via-[#ff4081] to-[#ff2a6d] scale-105'
                  : 'bg-gradient-to-tr from-[#716d77] to-[#36323d] hover:bg-[#D30915]'
                  }`}
                title={isListening ? 'Listening... Tap to stop' : 'Tap to start speaking'}
                aria-label="Toggle voice search"
              >
                <Mic className={`w-8 h-8 ${isListening ? 'animate-bounce text-white' : 'text-white'}`} />
              </button>
            </div>

            {/* Sound Equalizer Waveform Bars */}
            {isListening && (
              <div className="flex items-center gap-1.5 h-6 mb-4">
                <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.1s] h-6" />
                <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.2s] h-4" />
                <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.15s] h-5" />
                <span className="w-1 bg-[#D30915] rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.3s] h-3" />
              </div>
            )}

            {/* Live Transcribed Speech Feedback */}
            <div className="w-full bg-[#fff9fb] border border-[#f5d8e4] rounded-[18px] p-3.5 min-h-[56px] flex items-center justify-center">
              <p className="text-sm font-bold text-[#141219] break-words">
                {voiceFeedback ? (
                  <span className="text-[#D30915] font-black">&ldquo;{voiceFeedback}&rdquo;</span>
                ) : (
                  <span className="text-[#8a858f] text-xs">Speak now... e.g. &ldquo;Classic Cola Cash Candle&rdquo;</span>
                )}
              </p>
            </div>

            {/* Quick Test Voice Tags */}
            <div className="mt-4 pt-3 border-t border-[#f4edf2] w-full">
              <span className="block text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-2">
                Or tap a popular phrase
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {['Cash Candles', 'Diamond Ring', 'Cola Soda', 'Bath Bomb Cash'].map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => {
                      setVoiceFeedback(phrase);
                      executeSearch(phrase);
                    }}
                    className="px-2.5 py-1 rounded-[10px] bg-white hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    &ldquo;{phrase}&rdquo;
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </header>
  );
};
