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
  Check,
  Zap,
  Truck,
  LogOut,
  PackageCheck,
  Heart,
  Users,
  UserPlus,
  Menu,
  Home as HomeIcon,
  Flame,
  LayoutGrid,
  Info,
  Headphones,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  Mic,
  TrendingUp,
  Tag,
  Volume2,
} from 'lucide-react';
import type { UserProfile, Product } from '../../types';
import { productsData } from '../../data/products';

export interface HeaderProps {
  cartCount?: number;
  cartSubtotal?: number;
  user?: UserProfile | null;
  onOpenCart?: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
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
  { id: 'experiences', label: 'Experiences', href: '/experiences', targetSectionId: 'experience', icon: Flame },
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
  cartSubtotal: _cartSubtotal = 0,
  user = null,
  onOpenCart,
  onOpenAuth,
  onLogout,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [currentLoc, setCurrentLoc] = useState(availableLocations[0]);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNavId, setActiveNavId] = useState<string>('home');
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  const locationMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Filter matching products for full-screen search view
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

  // Open Search Modal with browser history push state (prevents device back button from exiting website)
  const openSearchModal = () => {
    setIsSearchModalOpen(true);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ modal: 'search' }, '');
    }
  };

  // Close Search Modal safely
  const closeSearchModal = (fromPopState = false) => {
    setIsSearchModalOpen(false);
    if (!fromPopState && typeof window !== 'undefined' && window.history.state?.modal === 'search') {
      window.history.back();
    }
  };

  // Open Mobile Menu with browser history push state
  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ modal: 'menu' }, '');
    }
  };

  // Close Mobile Menu safely
  const closeMobileMenu = (fromPopState = false) => {
    setIsMobileMenuOpen(false);
    if (!fromPopState && typeof window !== 'undefined' && window.history.state?.modal === 'menu') {
      window.history.back();
    }
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
    const handlePopState = (_e: PopStateEvent) => {
      if (isVoiceModalOpen) {
        closeVoiceModal();
        return;
      }
      if (isSearchModalOpen) {
        closeSearchModal(true);
      }
      if (isMobileMenuOpen) {
        closeMobileMenu(true);
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSearchModalOpen, isMobileMenuOpen, isVoiceModalOpen, isListening]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target as Node)) {
        setIsLocationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility: Close mobile drawer, search, and voice modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeVoiceModal();
        closeMobileMenu();
        closeSearchModal();
        setIsLocationOpen(false);
        setIsUserMenuOpen(false);
      }
      // Quick search shortcut (/)
      if (e.key === '/' && !isSearchModalOpen && !isVoiceModalOpen && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        openSearchModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, isSearchModalOpen, isVoiceModalOpen]);

  // Prevent background scrolling while mobile drawer, full-screen search, or voice modal is open
  useEffect(() => {
    if (isMobileMenuOpen || isSearchModalOpen || isVoiceModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, isSearchModalOpen, isVoiceModalOpen]);

  // Auto-focus input when full-screen search modal opens
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchModalOpen]);

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
          productEl.classList.add('ring-4', 'ring-[#ec2f73]', 'scale-[1.02]', 'transition-all');
          setTimeout(() => {
            productEl.classList.remove('ring-4', 'ring-[#ec2f73]', 'scale-[1.02]');
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
    closeVoiceModal();
    closeSearchModal();
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
    closeSearchModal();
    closeMobileMenu();
    scrollToProductOrFeatured(product.id);
  };

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag);
    executeSearch(tag);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    e.preventDefault();
    setActiveNavId(item.id);
    closeMobileMenu();
    closeSearchModal();

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
    }, 50);
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 backdrop-blur-xl border-b border-[#eee7ed] shadow-[0_4px_24px_rgba(50,31,63,0.05)] transition-all">
      
      {/* 1. Top VIP Announcement Ribbon (Hidden on mobile) */}
      <div className="hidden md:block bg-gradient-to-r from-[#fff1f6] via-[#fff8fb] to-[#fbf6ff] border-b border-[#f5e8ef] text-[10px] sm:text-[11px] font-bold text-[#716d77] py-1 sm:py-1.5 px-3 sm:px-4">
        <div className="max-w-[1460px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#141219] truncate">
            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec2f73] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#ec2f73]" />
            </span>
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ec2f73] shrink-0" />
            <span className="truncate">
              Fast Express Dispatch • Guaranteed Real Cash ($2-$2,500) or Jewelry in 100% of Orders
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[#716d77] shrink-0 ml-2">
            <button
              type="button"
              onClick={() => onOpenAuth?.('login')}
              className="flex items-center gap-1 hover:text-[#ec2f73] transition-colors cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Surprise Club Rewards</span>
            </button>
            <span className="text-[#eee7ed]">|</span>
            <span>Free Shipping $50+</span>
            <span className="text-[#eee7ed]">|</span>
            <a
              href="/affiliate"
              onClick={(e) =>
                handleNavClick(e, {
                  id: 'affiliate',
                  label: 'Affiliate',
                  href: '/affiliate',
                  targetSectionId: 'affiliate',
                  icon: Users,
                })
              }
              className="text-[#ec2f73] hover:underline font-black cursor-pointer"
            >
              Earn 20% Reps
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Brand & Navigation Header Bar */}
      <div className="max-w-[1460px] mx-auto px-2.5 sm:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-6">
          
          {/* Left Block: Brand Logo + Mobile Search Bar directly next to it + Desktop Delivery Location */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 lg:flex-initial">
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
                src="/assets/ilovesurprises/logo/i love surprises logo.jpeg"
                alt="I Love Surprises Logo"
                className="h-9 sm:h-11 md:h-12 w-auto max-w-[125px] sm:max-w-[160px] md:max-w-[240px] object-contain transition-transform duration-300 group-hover:scale-102"
                loading="eager"
              />
            </a>

            {/* Mobile Search Bar (Placed directly near the logo) */}
            <div className="lg:hidden flex-1 min-w-0 max-w-[210px] xs:max-w-[240px] sm:max-w-[320px]">
              <div className="w-full h-[34px] rounded-[11px] bg-[#fff9fb] border border-[#ecdbe6] hover:border-[#ec2f73] transition-all flex items-center px-2 shadow-2xs">
                <button
                  type="button"
                  onClick={openSearchModal}
                  className="flex items-center flex-1 min-w-0 text-left cursor-pointer"
                  aria-label="Open search"
                >
                  <Search className="w-3.5 h-3.5 text-[#ec2f73] shrink-0 mr-1.5" />
                  <span className="w-full text-[11px] text-[#817c85] font-medium truncate">
                    {searchQuery || 'Search...'}
                  </span>
                </button>

                {/* Voice Search Button with YouTube Style Trigger */}
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  className="p-1 rounded-full text-[#ec2f73] hover:bg-[#fff0f5] active:scale-90 transition-all cursor-pointer shrink-0 ml-0.5"
                  title="Search with voice"
                  aria-label="Voice search"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Delivery Pill (Desktop >= 1280px) */}
            <div ref={locationMenuRef} className="relative hidden xl:block ml-1">
              <button
                type="button"
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="group flex items-center gap-2 px-3 py-1 rounded-[14px] bg-gradient-to-r from-[#fff3f7] to-[#fff8fb] hover:from-[#ffeaf2] hover:to-[#fff3f7] text-[#141219] border border-[#f5cad7] hover:border-[#ec2f73] shadow-2xs hover:shadow-[0_4px_16px_rgba(236,47,115,0.12)] active:scale-97 transition-all duration-200 cursor-pointer select-none text-left"
                aria-haspopup="true"
                aria-expanded={isLocationOpen}
              >
                <div className="w-6 h-6 rounded-full bg-[#ec2f73] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-106 transition-transform duration-200">
                  <Truck className="w-3 h-3" />
                </div>

                <div className="leading-tight">
                  <div className="text-[9px] font-black text-[#ec2f73] uppercase tracking-wider flex items-center gap-1">
                    <span>{currentLoc.eta}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-[11px] font-black text-[#141219] flex items-center gap-1">
                    <span className="truncate max-w-[90px]">
                      {currentLoc.name}, {currentLoc.zip}
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 text-[#716d77] group-hover:text-[#ec2f73] transition-transform duration-200 ${
                        isLocationOpen ? 'rotate-180 text-[#ec2f73]' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Location Selector Dropdown Modal */}
              {isLocationOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-white rounded-[22px] border border-[#eee7ed] shadow-[0_16px_40px_rgba(50,31,63,0.14)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#f4edf2]">
                    <div>
                      <h4 className="text-xs font-black text-[#141219] m-0">Delivery Location</h4>
                      <p className="text-[10px] text-[#716d77] m-0">Express dispatch to your address</p>
                    </div>
                    <span className="p-1.5 rounded-full bg-[#fff0f5] text-[#ec2f73]">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {availableLocations.map((loc) => {
                      const isSelected = currentLoc.zip === loc.zip;
                      return (
                        <button
                          key={loc.zip}
                          type="button"
                          onClick={() => {
                            setCurrentLoc(loc);
                            setIsLocationOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-[14px] flex items-center justify-between text-left transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-[#fff0f5] border border-[#f5cad7] text-[#ec2f73] shadow-2xs'
                              : 'hover:bg-[#fff9fb] text-[#141219] border border-transparent hover:border-[#f5dce6]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin
                              className={`w-3.5 h-3.5 ${
                                isSelected ? 'text-[#ec2f73]' : 'text-[#817c85]'
                              }`}
                            />
                            <div>
                              <strong className="block text-xs font-bold">
                                {loc.name}, {loc.state} ({loc.zip})
                              </strong>
                              <span className="text-[10px] text-[#716d77]">
                                Transit: {loc.eta} • {loc.tag}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#ec2f73] stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Block: Desktop Primary Horizontal Navigation Menu (Visible on lg >= 1024px) */}
          <nav
            className="hidden lg:flex items-center justify-center gap-1 xl:gap-1.5 bg-white/80 px-2.5 py-1 rounded-[16px] border border-[#f2e7ee] shadow-2xs"
            aria-label="Main Navigation"
          >
            {NAV_LINKS.map((item) => {
              const isActive = activeNavId === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`group relative flex items-center px-3.5 py-1.5 rounded-[12px] text-[13px] xl:text-[14px] font-extrabold transition-all duration-200 select-none whitespace-nowrap ${
                    isActive
                      ? 'text-[#ec2f73] bg-[#fff0f5] border border-[#f5cad7] shadow-2xs'
                      : 'text-[#36323d] hover:text-[#ec2f73] hover:bg-[#fff5f8] border border-transparent'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Header Actions: Desktop Search, Account, Cart & Mobile Hamburger Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Desktop Search Trigger (Clicking opens Full-Screen Search Modal) */}
            <div className="hidden lg:flex items-center w-40 xl:w-48 2xl:w-56 h-[34px] rounded-[11px] bg-[#fff9fb] border border-[#ecdbe6] hover:border-[#ec2f73] transition-all px-2.5 shadow-2xs group">
              <button
                type="button"
                onClick={openSearchModal}
                className="flex items-center flex-1 min-w-0 text-left cursor-pointer"
                aria-label="Open search modal"
              >
                <Search className="w-3.5 h-3.5 text-[#ec2f73] shrink-0 mr-1.5" />
                <span className="w-full text-[11px] text-[#817c85] font-medium truncate">
                  {searchQuery || 'Search products...'}
                </span>
              </button>

              {/* Desktop Voice Search Trigger */}
              <button
                type="button"
                onClick={startVoiceSearch}
                title="Search by voice"
                className="p-1 rounded-full text-[#8a858f] hover:text-[#ec2f73] hover:bg-[#fff0f5] cursor-pointer transition-colors shrink-0"
                aria-label="Voice search"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>

              <span className="text-[8px] font-extrabold uppercase px-1 py-0.5 rounded bg-white text-[#817c85] border border-[#f0e4ec] shrink-0 shadow-2xs ml-1">
                /
              </span>
            </div>

            {/* When NOT logged in: Sign In & Sign Up Buttons (Desktop only) */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className="flex items-center gap-1 h-[38px] px-3 rounded-[13px] bg-[#fffafb] border border-[#f0e4ec] hover:border-[#ec2f73] hover:text-[#ec2f73] text-xs font-black text-[#141219] transition-all shadow-2xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#716d77]" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth?.('signup')}
                  className="hidden md:flex items-center gap-1 h-[38px] px-3 rounded-[13px] bg-[#fff0f5] border border-[#f5cad7] hover:bg-[#ec2f73] hover:text-white text-xs font-black text-[#ec2f73] transition-all shadow-2xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            ) : (
              /* When LOGGED IN: User Profile Pill */
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 h-[38px] p-1 sm:p-1.5 pr-2 rounded-[13px] sm:rounded-[14px] bg-[#fffafc] border border-[#f5cad7] hover:border-[#ec2f73] shadow-2xs transition-all cursor-pointer text-left"
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover border border-[#ec2f73]"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#ec2f73] text-white font-black text-[10px] flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                  )}

                  <div className="leading-tight hidden sm:block">
                    <span className="block text-xs font-black text-[#141219] truncate max-w-[85px]">
                      {user.name.split(' ')[0]}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3 h-3 text-[#716d77] transition-transform ${
                      isUserMenuOpen ? 'rotate-180 text-[#ec2f73]' : ''
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
                      <span className="inline-block mt-1 text-[9px] font-black uppercase text-[#ec2f73] bg-white px-2 py-0.5 rounded-full border border-[#f5cad7]">
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
                          className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff0f5] hover:text-[#ec2f73] transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-[#ec2f73]" />
                          <span>Rep Portal Dashboard</span>
                        </a>
                      )}

                      <a
                        href="/shop"
                        onClick={(e) => {
                          setIsUserMenuOpen(false);
                          handleNavClick(e, {
                            id: 'shop',
                            label: 'Shop',
                            href: '/shop',
                            targetSectionId: 'featured',
                            icon: ShoppingBag,
                          });
                        }}
                        className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff0f5] hover:text-[#ec2f73] transition-colors"
                      >
                        <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>My Surprise Orders</span>
                      </a>

                      <a
                        href="/shop"
                        onClick={(e) => {
                          setIsUserMenuOpen(false);
                          handleNavClick(e, {
                            id: 'shop',
                            label: 'Shop',
                            href: '/shop',
                            targetSectionId: 'featured',
                            icon: ShoppingBag,
                          });
                        }}
                        className="flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#fff0f5] hover:text-[#ec2f73] transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#ec2f73]" />
                        <span>My Wishlist</span>
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

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center justify-center w-[36px] sm:w-[42px] h-[36px] sm:h-[38px] rounded-[11px] sm:rounded-[13px] bg-gradient-to-r from-[#ec2f73] to-[#d92467] hover:from-[#d92467] hover:to-[#c21a57] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)] active:scale-95 transition-all cursor-pointer border border-[#f386ad]"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-white text-[#ec2f73] text-[9px] font-black flex items-center justify-center shadow-xs border border-[#f5cad7]">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile 3-Lines Hamburger Menu Button */}
            <button
              type="button"
              onClick={openMobileMenu}
              className="lg:hidden w-[36px] h-[36px] rounded-[11px] bg-[#fffafb] border border-[#f0e4ec] text-[#141219] hover:text-[#ec2f73] hover:border-[#ec2f73] active:scale-95 transition-all cursor-pointer focus:outline-none flex items-center justify-center shadow-2xs"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
            </button>

          </div>
        </div>
      </div>

      {/* 3. Full-Screen Mobile Navigation Drawer Portal */}
      {typeof document !== 'undefined' && isMobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end">
          {/* Backdrop overlay with blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => closeMobileMenu()}
            aria-hidden="true"
          />

          {/* Slide-in Drawer Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="relative w-[85%] max-w-[340px] h-full bg-white shadow-2xl z-10 flex flex-col justify-between overflow-y-auto border-l border-[#eee7ed] animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Top Header */}
            <div>
              <div className="p-4 border-b border-[#f4edf2] flex items-center justify-between bg-gradient-to-r from-[#fff3f7] to-[#ffffff]">
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
                    src="/assets/ilovesurprises/logo/i love surprises logo.jpeg"
                    alt="I Love Surprises Logo"
                    className="h-9 w-auto object-contain"
                  />
                </a>

                <button
                  type="button"
                  onClick={() => closeMobileMenu()}
                  className="w-9 h-9 rounded-full bg-white border border-[#ecdbe6] hover:bg-[#fff0f5] hover:text-[#ec2f73] text-[#716d77] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Drawer Search Trigger */}
              <div className="p-3 bg-[#fffafc] border-b border-[#f5e8ef]">
                <div className="w-full h-[40px] rounded-[13px] bg-white border border-[#ecdbe6] hover:border-[#ec2f73] flex items-center px-3 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      openSearchModal();
                    }}
                    className="flex items-center flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-[#ec2f73] shrink-0 mr-2" />
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
                    className="p-1 text-[#8a858f] hover:text-[#ec2f73] cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Drawer Navigation Links */}
              <div className="p-3">
                <span className="block text-[10px] font-black uppercase tracking-wider text-[#8a858f] px-3 mb-2">
                  Navigation Menu
                </span>

                <div className="space-y-1">
                  {NAV_LINKS.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeNavId === item.id;
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item)}
                        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-[14px] flex items-center justify-between text-left font-bold text-sm transition-all duration-200 cursor-pointer ${
                          isActive
                            ? 'bg-[#fff0f5] text-[#ec2f73] border border-[#f5cad7] shadow-2xs font-black'
                            : 'hover:bg-[#fff9fb] text-[#141219] border border-transparent'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors ${
                              isActive
                                ? 'bg-[#ec2f73] text-white shadow-xs'
                                : 'bg-[#fff0f5] text-[#ec2f73]'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>

                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive ? 'text-[#ec2f73] translate-x-0.5' : 'text-[#beb8c2]'
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
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#ec2f73] flex items-center gap-1">
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
            <div className="p-4 border-t border-[#f4edf2] bg-gradient-to-b from-[#fffafc] to-[#fff3f7] space-y-3">
              {/* Account Status */}
              {!user ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenAuth?.('login');
                    }}
                    className="h-[40px] px-3 rounded-[12px] bg-white border border-[#eedbe6] text-[#141219] text-xs font-black shadow-2xs hover:border-[#ec2f73] hover:text-[#ec2f73] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-[#716d77]" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      onOpenAuth?.('signup');
                    }}
                    className="h-[40px] px-3 rounded-[12px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs font-black shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-white rounded-[14px] border border-[#f5cad7] shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <strong className="block text-xs font-black text-[#141219] truncate">
                        {user.name}
                      </strong>
                      <span className="text-[10px] text-[#716d77]">{user.email}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase text-[#ec2f73] bg-[#fff0f5] px-2 py-0.5 rounded-full border border-[#f5cad7]">
                      {user.role === 'representative' ? '20% Rep' : 'VIP'}
                    </span>
                  </div>
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
                  className="flex items-center gap-1 hover:text-[#ec2f73] transition-colors"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>1-800-SURPRISE</span>
                </a>
                <a
                  href="mailto:support@ilovesurprises.com"
                  className="flex items-center gap-1 hover:text-[#ec2f73] transition-colors"
                >
                  <Mail className="w-3 h-3 text-[#ec2f73]" />
                  <span>Email Help</span>
                </a>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 4. Full-Screen Luxury Search Experience (Both Desktop and Mobile) */}
      {typeof document !== 'undefined' && isSearchModalOpen && createPortal(
        <div className="fixed inset-0 z-[999999] bg-white/98 backdrop-blur-2xl flex flex-col animate-in fade-in zoom-in-98 duration-150 overflow-hidden">
          {/* Top Search Action Header */}
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-3">
            {/* Top Bar with Close Button (No Logo) */}
            <div className="flex items-center justify-between gap-3 mb-2 sm:mb-4">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#ec2f73]">
                <Sparkles className="w-3.5 h-3.5 fill-[#ec2f73]" />
                <span>Search Catalog</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => closeSearchModal()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff0f5] hover:bg-[#ec2f73] text-[#ec2f73] hover:text-white border border-[#f5cad7] text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                aria-label="Close search"
              >
                <span>Close</span>
                <span className="hidden sm:inline text-[10px] opacity-75">(Esc)</span>
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Form for keyboard Return / Search key */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch();
              }}
              action="#"
              className="relative w-full h-[42px] sm:h-[48px] rounded-[13px] sm:rounded-[16px] bg-[#fff9fb] border-2 border-[#f5cad7] focus-within:border-[#ec2f73] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ec2f73]/15 transition-all flex items-center px-2.5 sm:px-4 shadow-xs"
            >
              {/* Back button on mobile */}
              <button
                type="button"
                onClick={() => closeSearchModal()}
                className="sm:hidden p-1 rounded-full text-[#716d77] hover:text-[#ec2f73] active:scale-90 transition-all cursor-pointer shrink-0 mr-1"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="submit"
                className="p-1 rounded-full text-[#ec2f73] hover:bg-[#fff0f5] active:scale-95 transition-all cursor-pointer shrink-0 mr-1"
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <input
                ref={searchInputRef}
                type="search"
                enterKeyHint="search"
                placeholder="Search candles, jewelry, cash surprises..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full text-xs sm:text-sm text-[#141219] placeholder:text-[#817c85] bg-transparent outline-none border-0 font-bold"
                aria-label="Full-screen Search"
              />

              {/* Voice Search inside Full-screen Search */}
              <button
                type="button"
                onClick={startVoiceSearch}
                title="Search by voice"
                className="p-1.5 rounded-full text-[#8a858f] hover:text-[#ec2f73] hover:bg-[#fff0f5] transition-all cursor-pointer relative shrink-0"
                aria-label="Voice search"
              >
                <Mic className="w-4 h-4 text-[#ec2f73]" />
              </button>

              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-[#716d77] hover:text-[#141219] cursor-pointer shrink-0 ml-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Search Submit Action Button */}
              <button
                type="submit"
                className="ml-1.5 px-3 sm:px-4 h-[30px] sm:h-[34px] rounded-[9px] sm:rounded-[11px] bg-gradient-to-r from-[#ec2f73] to-[#d92467] hover:from-[#d92467] hover:to-[#c21a57] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Full-Screen Scrollable Results Body */}
          <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-3 sm:px-6 pb-8 space-y-3 sm:space-y-5">
            {/* Trending Keyword Pills */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#8a858f] mb-1.5 sm:mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#ec2f73]" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className="px-2.5 sm:px-3 py-1 rounded-[10px] sm:rounded-[11px] bg-white hover:bg-[#ec2f73] text-[#141219] hover:text-white border border-[#eedbe6] hover:border-[#ec2f73] text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 group"
                  >
                    <Tag className="w-3 h-3 text-[#ec2f73] group-hover:text-white transition-colors" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Matching Product Cards Grid */}
            <div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#8a858f] mb-2 sm:mb-3 pb-1.5 border-b border-[#f4edf2]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{searchQuery.trim() ? 'Matching Surprise Items' : 'Featured Bestsellers'}</span>
                </div>
                {matchingProducts.length > 0 && (
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#ec2f73] bg-[#fff0f5] px-2 py-0.5 rounded-full border border-[#f5cad7]">
                    {matchingProducts.length} Found
                  </span>
                )}
              </div>

              {matchingProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {matchingProducts.map((p) => (
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
                      className="p-2 sm:p-3 rounded-[13px] sm:rounded-[16px] bg-white hover:bg-[#fff9fb] border border-[#eee7ed] hover:border-[#f5cad7] shadow-2xs hover:shadow-sm transition-all flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-11 h-11 sm:w-14 sm:h-14 rounded-[9px] sm:rounded-[12px] object-cover border border-[#eee0e8] shrink-0"
                        />
                        <div className="min-w-0">
                          <strong className="block text-xs sm:text-[13px] font-black text-[#141219] truncate group-hover:text-[#ec2f73]">
                            {p.name}
                          </strong>
                          <span className="block text-[10px] sm:text-[11px] text-[#716d77] truncate mt-0.2">
                            {p.category}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs sm:text-[13px] font-black text-[#141219]">
                              ${p.price.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-extrabold text-[#ec2f73] bg-[#fff0f5] px-1.5 py-0.2 rounded-[5px] border border-[#f5cad7]">
                              {p.surpriseType === 'cash' ? '💵 Cash' : '💍 Jewelry'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-[#ec2f73] shrink-0 ml-1.5">
                        <span className="hidden sm:inline text-[11px]">Select</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs sm:text-sm text-[#8a858f] bg-white rounded-[16px] border border-[#eee7ed]">
                  No exact products found for &quot;{searchQuery}&quot;. Try searching &quot;Cash Candle&quot;, &quot;Jewelry&quot;, or &quot;Bath Bomb&quot;.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. YouTube-Style Animated Voice Search Modal Overlay */}
      {typeof document !== 'undefined' && isVoiceModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-md bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-[#f0dae7] text-center flex flex-col items-center overflow-hidden">
            
            {/* Close Button in Top-Right */}
            <button
              type="button"
              onClick={closeVoiceModal}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#fff5f8] hover:bg-[#ec2f73] text-[#716d77] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs border border-[#f5cad7]"
              aria-label="Close voice search"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Voice Status Heading */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#ec2f73] bg-[#fff0f5] px-3 py-1 rounded-full border border-[#f5cad7] mb-2">
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
                className={`absolute w-36 h-36 rounded-full bg-[#ec2f73]/15 transition-all duration-1000 ${
                  isListening ? 'animate-ping' : 'scale-90 opacity-20'
                }`}
              />

              {/* Middle Ripple Wave 2 */}
              <div
                className={`absolute w-28 h-28 rounded-full bg-[#ec2f73]/25 transition-all duration-700 ${
                  isListening ? 'animate-pulse' : 'scale-90 opacity-40'
                }`}
              />

              {/* Center YouTube Mic Button */}
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-[0_10px_30px_rgba(236,47,115,0.45)] transition-transform duration-200 cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-gradient-to-tr from-[#ec2f73] via-[#ff4081] to-[#ff2a6d] scale-105'
                    : 'bg-gradient-to-tr from-[#716d77] to-[#36323d] hover:bg-[#ec2f73]'
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
                <span className="w-1 bg-[#ec2f73] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                <span className="w-1 bg-[#ec2f73] rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.1s] h-6" />
                <span className="w-1 bg-[#ec2f73] rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.2s] h-4" />
                <span className="w-1 bg-[#ec2f73] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.15s] h-5" />
                <span className="w-1 bg-[#ec2f73] rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.3s] h-3" />
              </div>
            )}

            {/* Live Transcribed Speech Feedback */}
            <div className="w-full bg-[#fff9fb] border border-[#f5d8e4] rounded-[18px] p-3.5 min-h-[56px] flex items-center justify-center">
              <p className="text-sm font-bold text-[#141219] break-words">
                {voiceFeedback ? (
                  <span className="text-[#ec2f73] font-black">&ldquo;{voiceFeedback}&rdquo;</span>
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
                    className="px-2.5 py-1 rounded-[10px] bg-white hover:bg-[#ec2f73] text-[#ec2f73] hover:text-white border border-[#f5cad7] text-xs font-bold transition-all shadow-2xs cursor-pointer"
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
