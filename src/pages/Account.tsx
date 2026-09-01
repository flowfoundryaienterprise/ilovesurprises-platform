import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  LogOut,
  Package,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Plus,
  ArrowRight,
  Eye,
  X,
  Lock,
  Star,
  Truck,
  Globe,
  Compass,
  Building2,
  Search,
  Copy,
  RotateCw,
  CreditCard,
  Banknote,
  Check,
  Printer,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import type { UserProfile, Order, SavedAddress, Product } from '../types';
import { orderService } from '../services/orderService';
import { accountService } from '../services/accountService';
import { productsData } from '../data/products';
import { isValidMobile } from '../services/auth';
import { MapLocationPickerModal, type MapAddressResult } from '../components/checkout/MapLocationPickerModal';
import { COUNTRIES_DATA, getStatesByCountryName, getDistrictsByState } from '../data/geoData';
import { CustomSearchableSelect, type SelectOption } from '../components/ui/CustomSearchableSelect';

export type AccountTab = 'profile' | 'orders' | 'addresses' | 'wishlist';

interface AccountProps {
  user: UserProfile | null;
  activeTab?: AccountTab;
  highlightOrderId?: string | null;
  wishlistIds: string[];
  onOpenAuth: (mode?: 'login' | 'signup' | 'forgot') => void;
  onLogout: () => void;
  onNavigateToShop: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onWishlistToggle: (product: Product) => void;
  onTabChange?: (tab: AccountTab) => void;
}

export const Account: React.FC<AccountProps> = ({
  user,
  activeTab: initialTab = 'profile',
  highlightOrderId,
  wishlistIds,
  onOpenAuth,
  onLogout,
  onNavigateToShop,
  onSelectProduct,
  onAddToCart,
  onWishlistToggle,
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  // Sync tab with props
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => orderService.getOrders());
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(() => {
    if (highlightOrderId) {
      return orderService.getOrderById(highlightOrderId) || null;
    }
    return null;
  });

  // Orders Search & Filter State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered'>('all');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const handleCopyOrderId = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
    }
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      onAddToCart(item.product, item.quantity);
    });
  };

  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'processing' || o.status === 'shipped' || o.status === 'out_for_delivery'
    ).length;
  }, [orders]);

  const deliveredOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'delivered').length;
  }, [orders]);

  const totalCandlesOrdered = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = orderSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.items.some((i) => i.product.name.toLowerCase().includes(q)) ||
        (o.paymentSummary.cardBrand || '').toLowerCase().includes(q) ||
        o.paymentSummary.method.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (orderFilter === 'active') {
        return o.status === 'processing' || o.status === 'shipped' || o.status === 'out_for_delivery';
      }
      if (orderFilter === 'delivered') {
        return o.status === 'delivered';
      }
      return true;
    });
  }, [orders, orderSearch, orderFilter]);

  // Sync highlight order when prop changes
  useEffect(() => {
    if (highlightOrderId) {
      const found = orderService.getOrderById(highlightOrderId);
      if (found) {
        setSelectedOrderDetails(found);
      }
    }
  }, [highlightOrderId]);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => accountService.getSavedAddresses());
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<SavedAddress, 'id'>>({
    fullName: user?.name || '',
    phone: user?.mobile || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    label: 'Home',
    isDefault: false,
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [isAccountMapOpen, setIsAccountMapOpen] = useState(false);

  // Dynamic Country / State / District dropdown lists for Address Modal
  const availableAccountStates = useMemo(() => {
    return getStatesByCountryName(addressForm.country || 'United States');
  }, [addressForm.country]);

  const availableAccountDistricts = useMemo(() => {
    return getDistrictsByState(
      addressForm.country || 'United States',
      addressForm.state || availableAccountStates[0]?.code || availableAccountStates[0]?.name || ''
    );
  }, [addressForm.country, addressForm.state, availableAccountStates]);

  const [selectedAccountDistrict, setSelectedAccountDistrict] = useState<string>('');

  const accountCountryOptions: SelectOption[] = useMemo(() => {
    return COUNTRIES_DATA.map((c) => ({
      value: c.name,
      label: c.name,
      badge: c.code,
    }));
  }, []);

  const accountStateOptions: SelectOption[] = useMemo(() => {
    return availableAccountStates.map((s) => ({
      value: s.code,
      label: s.name,
      badge: s.code,
      subLabel: `${s.districts.length} districts`,
    }));
  }, [availableAccountStates]);

  const accountDistrictOptions: SelectOption[] = useMemo(() => {
    return availableAccountDistricts.map((d) => ({
      value: d.name,
      label: d.name,
      subLabel: d.majorCities?.slice(0, 2).join(', '),
      badge: d.defaultZip ? `ZIP ${d.defaultZip}` : undefined,
    }));
  }, [availableAccountDistricts]);

  const accountCityOptions: SelectOption[] = useMemo(() => {
    const currentDist = availableAccountDistricts.find((d) => d.name === selectedAccountDistrict) || availableAccountDistricts[0];
    const cities = currentDist?.majorCities || [];
    return cities.map((c) => ({
      value: c,
      label: c,
    }));
  }, [availableAccountDistricts, selectedAccountDistrict]);

  const handleAccountCountryChange = (newCountry: string) => {
    const states = getStatesByCountryName(newCountry);
    const firstState = states[0];
    const firstDistrict = firstState?.districts[0];
    setAddressForm((prev) => ({
      ...prev,
      country: newCountry,
      state: firstState?.code || firstState?.name || '',
      city: firstDistrict?.majorCities?.[0] || prev.city,
      zipCode: firstDistrict?.defaultZip || prev.zipCode,
    }));
    setSelectedAccountDistrict(firstDistrict?.name || '');
  };

  const handleAccountStateChange = (newState: string) => {
    const districts = getDistrictsByState(addressForm.country, newState);
    const firstDistrict = districts[0];
    setAddressForm((prev) => ({
      ...prev,
      state: newState,
      city: firstDistrict?.majorCities?.[0] || prev.city,
      zipCode: firstDistrict?.defaultZip || prev.zipCode,
    }));
    setSelectedAccountDistrict(firstDistrict?.name || '');
    if (addressErrors.state) {
      setAddressErrors((prev) => {
        const next = { ...prev };
        delete next.state;
        return next;
      });
    }
  };

  const handleAccountDistrictChange = (districtName: string) => {
    setSelectedAccountDistrict(districtName);
    const district = availableAccountDistricts.find((d) => d.name === districtName);
    if (district) {
      setAddressForm((prev) => ({
        ...prev,
        city: district.majorCities?.[0] || prev.city,
        zipCode: district.defaultZip || prev.zipCode,
      }));
      if (addressErrors.city || addressErrors.zipCode) {
        setAddressErrors((prev) => {
          const next = { ...prev };
          delete next.city;
          delete next.zipCode;
          return next;
        });
      }
    }
  };

  const handleSelectAccountAddressFromMap = (result: MapAddressResult) => {
    setAddressForm((prev) => ({
      ...prev,
      addressLine1: result.addressLine1,
      city: result.city,
      state: result.state,
      zipCode: result.zipCode,
      country: result.country || 'United States',
    }));
  };

  // Sync orders & addresses from storage & listener
  useEffect(() => {
    const handleOrdersUpdate = () => {
      setOrders(orderService.getOrders());
    };
    const handleAddressesUpdate = () => {
      setAddresses(accountService.getSavedAddresses());
    };

    window.addEventListener('ilovesurprises_orders_updated', handleOrdersUpdate);
    window.addEventListener('ilovesurprises_addresses_updated', handleAddressesUpdate);

    return () => {
      window.removeEventListener('ilovesurprises_orders_updated', handleOrdersUpdate);
      window.removeEventListener('ilovesurprises_addresses_updated', handleAddressesUpdate);
    };
  }, []);

  const handleTabSwitch = (tab: AccountTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Wishlist Products Filtered
  const wishlistProducts = useMemo(() => {
    return productsData.filter((p) => wishlistIds.includes(p.id));
  }, [wishlistIds]);

  // Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    accountService.updateStoredUser({
      id: user?.id || `usr-${Date.now()}`,
      name: profileName.trim(),
      email: profileEmail.trim(),
      mobile: profileMobile.trim(),
      role: user?.role || 'customer',
      avatar: user?.avatar,
    });

    setProfileSuccessMsg('Profile changes saved successfully!');
    setIsEditingProfile(false);
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  // Open Address Modal for New
  const handleOpenNewAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      fullName: user?.name || '',
      phone: user?.mobile || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      label: 'Home',
      isDefault: addresses.length === 0,
    });
    setAddressErrors({});
    setIsAddressModalOpen(true);
  };

  // Open Address Modal for Edit
  const handleOpenEditAddress = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      label: addr.label || 'Home',
      isDefault: addr.isDefault,
    });
    setAddressErrors({});
    setIsAddressModalOpen(true);
  };

  // Save Address Form
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!addressForm.fullName.trim()) errors.fullName = 'Name is required';
    if (!addressForm.phone.trim() || !isValidMobile(addressForm.phone)) errors.phone = 'Valid phone is required';
    if (!addressForm.addressLine1.trim()) errors.addressLine1 = 'Street address is required';
    if (!addressForm.city.trim()) errors.city = 'City is required';
    if (!addressForm.state.trim()) errors.state = 'State is required';
    if (!addressForm.zipCode.trim()) errors.zipCode = 'ZIP code is required';

    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      return;
    }

    accountService.saveAddress({
      ...(editingAddress ? { id: editingAddress.id } : {}),
      ...addressForm,
    });

    setIsAddressModalOpen(false);
  };

  const handleDeleteAddress = (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved address?')) {
      accountService.deleteAddress(id);
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    accountService.setDefaultAddress(id);
  };

  // Status color helper
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Delivered & Reveal</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-blue-600 anim-delivery-truck" />
            <span>In Transit</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200 shadow-2xs">
            <Package className="w-3.5 h-3.5 text-purple-600 anim-delivery-package" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'processing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Packing Candle & Prize</span>
          </span>
        );
    }
  };

  const getProgressPercentage = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 100;
      case 'out_for_delivery':
        return 88;
      case 'shipped':
        return 65;
      case 'processing':
        return 38;
      case 'cancelled':
        return 0;
      default:
        return 12;
    }
  };

  // If user is not logged in: Show premium VIP Access prompt
  if (!user) {
    return (
      <div className="min-h-[75vh] bg-[#fcf9fb] py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[28px] p-8 border border-[#eedbe6] shadow-[0_16px_40px_rgba(50,31,63,0.06)]">
            <div className="w-16 h-16 rounded-full bg-[#fff0f5] border-2 border-[#f5cad7] text-[#ec2f73] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <User className="w-8 h-8" />
            </div>

            <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#ec2f73] bg-[#fff0f5] px-3 py-1 rounded-full border border-[#f5cad7] mb-2">
              VIP Customer Portal
            </span>

            <h1 className="text-2xl font-black text-[#141219] mb-2 font-display">
              Sign In to Your Account
            </h1>

            <p className="text-xs sm:text-sm text-[#716d77] mb-6 leading-relaxed">
              Access your surprise order tracker, prize reveal receipts, saved shipping addresses, and curated wishlist.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="w-full h-[46px] rounded-[14px] bg-[#ec2f73] hover:bg-[#d92467] text-white font-black text-xs uppercase tracking-wider shadow-[0_8px_20px_rgba(236,47,115,0.28)] active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In to Continue</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="w-full h-[44px] rounded-[14px] bg-white border border-[#e8dfe5] hover:border-[#ec2f73] hover:text-[#ec2f73] font-black text-xs uppercase tracking-wider text-[#141219] transition-all cursor-pointer"
              >
                Create New VIP Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userDisplayName = user.name || 'Valued Member';

  return (
    <div className="min-h-screen bg-[#fcf9fb] py-8 sm:py-12">
      <div className="max-w-[1320px] mx-auto px-3.5 sm:px-6">

        {/* 1. Account Top Header Card */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)] mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={userDisplayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-3 border-[#ec2f73] shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#ec2f73] to-[#ff4785] text-white text-2xl font-black flex items-center justify-center shadow-xs">
                  {userDisplayName.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] border-2 border-white">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#141219] m-0 font-display">
                  {userDisplayName}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ec2f73] bg-[#fff0f5] px-2.5 py-0.5 rounded-full border border-[#f5cad7]">
                  {user.role === 'representative' ? '★ 20% Rep Partner' : '💎 VIP Club Member'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-0.5">
                {user.email} {user.mobile ? `• ${user.mobile}` : ''}
              </p>
              <div className="flex items-center gap-3 text-[11px] font-bold text-stone-600 mt-2">
                <span className="flex items-center gap-1 text-[#ec2f73]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>100% Win Guarantee Member</span>
                </span>
                <span>•</span>
                <span>{orders.length} Total Orders</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* VIP Cashback Balance Pill */}
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#fff0f5] to-[#fbf2fa] px-3.5 py-2 rounded-[14px] border border-[#f5cad7] shadow-2xs">
              <div className="w-7 h-7 rounded-full bg-[#ec2f73] text-white flex items-center justify-center shadow-xs shrink-0">
                <Star className="w-3.5 h-3.5 fill-white" />
              </div>
              <div>
                <span className="text-[9px] text-[#716d77] font-bold block uppercase tracking-wider">
                  Available Cashback
                </span>
                <strong className="text-xs font-black text-[#ec2f73]">$24.50 (5% VIP)</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="h-[40px] px-4 rounded-[12px] bg-[#fff0f5] hover:bg-red-50 text-red-600 border border-[#f5cad7] hover:border-red-200 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {profileSuccessMsg && (
          <div className="mb-6 p-3.5 rounded-[14px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in flex items-center gap-2">
            <span>✨</span>
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {/* 2. Full-Width Horizontal Navigation Tabs Ribbon */}
        <div className="bg-white rounded-[22px] p-2 sm:p-2.5 border border-[#eedbe6] shadow-[0_4px_18px_rgba(50,31,63,0.03)] mb-7 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Tab: Profile */}
          <button
            type="button"
            onClick={() => handleTabSwitch('profile')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Profile & Settings</span>
          </button>

          {/* Tab: Orders */}
          <button
            type="button"
            onClick={() => handleTabSwitch('orders')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Tracking</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'orders' ? 'bg-white text-[#ec2f73]' : 'bg-[#fff0f5] text-[#ec2f73]'
              }`}
            >
              {orders.length}
            </span>
          </button>

          {/* Tab: Addresses */}
          <button
            type="button"
            onClick={() => handleTabSwitch('addresses')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'addresses' ? 'bg-white text-[#ec2f73]' : 'bg-[#fff0f5] text-[#ec2f73]'
              }`}
            >
              {addresses.length}
            </span>
          </button>

          {/* Tab: Wishlist */}
          <button
            type="button"
            onClick={() => handleTabSwitch('wishlist')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === 'wishlist'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>My Wishlist</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'wishlist' ? 'bg-white text-[#ec2f73]' : 'bg-[#fff0f5] text-[#ec2f73]'
              }`}
            >
              {wishlistProducts.length}
            </span>
          </button>
        </div>

        {/* 3. Main Full-Width Content Container */}
        <div className="w-full">

            {/* ================= TAB 1: PROFILE ================= */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)] animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#f5eaf1] mb-6">
                  <div>
                    <h2 className="text-lg font-black text-[#141219] m-0">Personal Profile & Information</h2>
                    <p className="text-xs text-[#716d77] m-0">Manage your account details and contact preferences</p>
                  </div>
                  {!isEditingProfile && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="h-[38px] px-4 rounded-[11px] bg-[#fff0f5] hover:bg-[#ec2f73] text-[#ec2f73] hover:text-white border border-[#f5cad7] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">
                        Full Name <span className="text-[#ec2f73]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full h-[44px] px-3.5 rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#ec2f73] text-xs sm:text-sm text-[#141219] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#141219] mb-1">
                          Email Address <span className="text-[#ec2f73]">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full h-[44px] px-3.5 rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#ec2f73] text-xs sm:text-sm text-[#141219] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#141219] mb-1">
                          Mobile Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileMobile}
                          onChange={(e) => setProfileMobile(e.target.value)}
                          placeholder="(555) 000-0000"
                          className="w-full h-[44px] px-3.5 rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#ec2f73] text-xs sm:text-sm text-[#141219] outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f5eaf1]">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="h-[42px] px-5 rounded-[12px] border border-[#e8dfe5] text-xs font-bold text-[#716d77] hover:text-[#141219] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="h-[42px] px-6 rounded-[12px] bg-[#ec2f73] hover:bg-[#d92467] text-white font-black text-xs uppercase tracking-wider shadow-xs cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-[16px] bg-[#fffafc] border border-[#eedbe6]">
                        <span className="text-[10px] font-black uppercase text-[#716d77] block mb-0.5">
                          Full Name
                        </span>
                        <strong className="text-sm font-black text-[#141219]">{userDisplayName}</strong>
                      </div>

                      <div className="p-4 rounded-[16px] bg-[#fffafc] border border-[#eedbe6]">
                        <span className="text-[10px] font-black uppercase text-[#716d77] block mb-0.5">
                          Account Role
                        </span>
                        <strong className="text-sm font-black text-[#ec2f73] capitalize">
                          {user.role === 'representative' ? 'Official Representative' : 'VIP Customer'}
                        </strong>
                      </div>

                      <div className="p-4 rounded-[16px] bg-[#fffafc] border border-[#eedbe6]">
                        <span className="text-[10px] font-black uppercase text-[#716d77] block mb-0.5">
                          Email Address
                        </span>
                        <strong className="text-sm font-black text-[#141219] truncate block">
                          {user.email}
                        </strong>
                      </div>

                      <div className="p-4 rounded-[16px] bg-[#fffafc] border border-[#eedbe6]">
                        <span className="text-[10px] font-black uppercase text-[#716d77] block mb-0.5">
                          Phone Number
                        </span>
                        <strong className="text-sm font-black text-[#141219]">
                          {user.mobile || 'Not provided'}
                        </strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-[16px] bg-white border border-[#eedbe6] flex items-center justify-between mt-4">
                      <div>
                        <strong className="text-xs font-black text-[#141219] block">Password & Security</strong>
                        <span className="text-[11px] text-[#716d77]">Last updated 2 months ago</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert('Password reset link sent to ' + user.email)}
                        className="text-xs font-black text-[#ec2f73] hover:underline cursor-pointer"
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: ORDERS & TRACKING ================= */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in fade-in duration-200">

                {/* 1. Quick Stats & Progress Metrics Ribbon */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-white rounded-[20px] p-4.5 border border-[#eedbe6] shadow-[0_4px_16px_rgba(50,31,63,0.03)] flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-[14px] bg-[#fff0f5] text-[#ec2f73] flex items-center justify-center shrink-0 border border-[#f5cad7]">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#716d77] block">
                        Lifetime Orders
                      </span>
                      <strong className="text-lg font-black text-[#141219]">
                        {orders.length} Placed
                      </strong>
                    </div>
                  </div>

                  <div className="bg-white rounded-[20px] p-4.5 border border-[#eedbe6] shadow-[0_4px_16px_rgba(50,31,63,0.03)] flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-[14px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#716d77] block">
                        Active Shipments
                      </span>
                      <strong className="text-lg font-black text-[#141219]">
                        {activeOrdersCount} In Progress
                      </strong>
                    </div>
                  </div>

                  <div className="bg-white rounded-[20px] p-4.5 border border-[#eedbe6] shadow-[0_4px_16px_rgba(50,31,63,0.03)] flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-[14px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#716d77] block">
                        Candles Ordered
                      </span>
                      <strong className="text-lg font-black text-[#141219]">
                        {totalCandlesOrdered} Reveals
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Main Order History Container */}
                <div className="bg-white rounded-[24px] p-5 sm:p-7 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)] space-y-5">

                  {/* Header & Search Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f5eaf1]">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-[#141219] m-0 font-display">
                        Your Order History
                      </h2>
                      <p className="text-xs text-[#716d77] m-0 mt-0.5">
                        Track live courier progress, view item breakdowns, and download receipts
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-[#fbf7fc] p-1 rounded-[13px] border border-[#eedbe6] self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setOrderFilter('all')}
                        className={`px-3 py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer ${orderFilter === 'all'
                            ? 'bg-[#ec2f73] text-white shadow-2xs'
                            : 'text-[#55505a] hover:text-[#ec2f73]'
                          }`}
                      >
                        All ({orders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderFilter('active')}
                        className={`px-3 py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer ${orderFilter === 'active'
                            ? 'bg-[#ec2f73] text-white shadow-2xs'
                            : 'text-[#55505a] hover:text-[#ec2f73]'
                          }`}
                      >
                        Active ({activeOrdersCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderFilter('delivered')}
                        className={`px-3 py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer ${orderFilter === 'delivered'
                            ? 'bg-[#ec2f73] text-white shadow-2xs'
                            : 'text-[#55505a] hover:text-[#ec2f73]'
                          }`}
                      >
                        Delivered ({deliveredOrdersCount})
                      </button>
                    </div>
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#8a858f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search by Order ID (e.g. ILS-423461) or Candle scent..."
                      className="w-full h-[42px] pl-10 pr-10 rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#ec2f73] text-xs text-[#141219] outline-none font-medium placeholder-[#8a858f] transition-all"
                    />
                    {orderSearch && (
                      <button
                        type="button"
                        onClick={() => setOrderSearch('')}
                        className="w-6 h-6 rounded-full hover:bg-stone-200 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Orders List Rendering */}
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-[20px] bg-[#fffafc] border border-dashed border-[#eedbe6]">
                      <Package className="w-12 h-12 text-[#d9cbd5] mx-auto mb-3" />
                      <h4 className="text-base font-black text-[#141219] mb-1">
                        {orderSearch ? 'No Matching Orders Found' : 'No Orders in this View'}
                      </h4>
                      <p className="text-xs text-[#716d77] max-w-sm mx-auto mb-5 leading-relaxed">
                        {orderSearch
                          ? `We couldn't find any orders matching "${orderSearch}". Try a different keyword or clear search.`
                          : 'You currently have no orders in this category.'}
                      </p>
                      {orderSearch ? (
                        <button
                          type="button"
                          onClick={() => setOrderSearch('')}
                          className="h-[38px] px-5 rounded-[11px] bg-[#fff0f5] border border-[#f5cad7] hover:bg-[#ec2f73] hover:text-white text-[#ec2f73] font-black text-xs transition-all cursor-pointer"
                        >
                          Clear Search Filter
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onNavigateToShop}
                          className="h-[40px] px-6 rounded-[12px] bg-[#ec2f73] hover:bg-[#d92467] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                          Discover Candles
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => {
                        const formattedOrderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                        const isCopied = copiedOrderId === order.id;
                        const totalItemCount = order.items.reduce((s, i) => s + i.quantity, 0);

                        return (
                          <div
                            key={order.id}
                            className="rounded-[22px] bg-[#fffafc] border border-[#eedbe6] hover:border-[#ec2f73]/50 transition-all shadow-[0_2px_12px_rgba(50,31,63,0.03)] hover:shadow-[0_6px_20px_rgba(50,31,63,0.06)] overflow-hidden"
                          >
                            {/* Card Top Header */}
                            <div className="bg-[#fff5f9] px-4 sm:px-6 py-3 border-b border-[#f4edf2] flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-black text-[#141219]">
                                    {order.id}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyOrderId(order.id)}
                                    title="Copy Order ID"
                                    className="p-1 rounded-md hover:bg-[#ffeef4] text-[#8a858f] hover:text-[#ec2f73] transition-colors cursor-pointer"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <span className="text-[#eedbe6]">•</span>
                                <span className="text-xs text-[#716d77] font-medium">
                                  {formattedOrderDate}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {getStatusBadge(order.status)}
                              </div>
                            </div>

                            {/* Card Body - Products List */}
                            <div className="p-4 sm:p-5 divide-y divide-[#f7eff4]">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="relative shrink-0">
                                      <div className="w-13 h-13 rounded-[12px] bg-white border border-[#eee2eb] p-1 flex items-center justify-center shadow-2xs overflow-hidden">
                                        <img
                                          src={item.product.image}
                                          alt={item.product.name}
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      {item.quantity > 1 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 rounded-full bg-[#141219] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs z-10">
                                          x{item.quantity}
                                        </span>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-xs sm:text-sm font-black text-[#141219] m-0 truncate">
                                        {item.product.name}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] font-black text-[#ec2f73] bg-[#fff0f5] px-2 py-0.5 rounded-full border border-[#f5cad7]">
                                          {item.selectedSurpriseOption || (item.product.surpriseType === 'cash' ? '✨ Real Cash Prize Inside' : '💎 Guaranteed Jewelry')}
                                        </span>
                                        <span className="text-[11px] text-[#716d77] font-semibold">
                                          Qty: {item.quantity} • ${item.unitPrice.toFixed(2)} ea
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                                    <span className="text-xs sm:text-sm font-black text-[#141219]">
                                      ${item.totalPrice.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Card Footer Bar */}
                            <div className="bg-[#fffdfd] px-4 sm:px-6 py-3 border-t border-[#f4edf2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="text-[10px] text-[#716d77] uppercase font-bold block">
                                    Total ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
                                  </span>
                                  <span className="text-sm sm:text-base font-black text-[#141219]">
                                    ${order.total.toFixed(2)}
                                  </span>
                                </div>
                                <div className="h-6 w-px bg-[#eee2eb]" />
                                <div className="text-[11px] text-[#716d77] font-medium flex items-center gap-1">
                                  {order.paymentSummary.method === 'cod' ? (
                                    <>
                                      <Banknote className="w-3.5 h-3.5 text-amber-700" />
                                      <span>Cash on Delivery</span>
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Paid Online</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleReorder(order)}
                                  className="h-[34px] px-3.5 rounded-[10px] bg-white border border-[#e8dfe5] hover:border-[#ec2f73] hover:text-[#ec2f73] text-[#55505a] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="Add all items back to shopping cart"
                                >
                                  <RotateCw className="w-3 h-3" />
                                  <span>Buy Again</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="h-[34px] px-4 rounded-[10px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(236,47,115,0.22)] cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Details</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ================= TAB 3: ADDRESSES ================= */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-[24px] p-6 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5eaf1] mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-[#141219] m-0">Saved Delivery Addresses</h2>
                      <span className="text-[11px] font-black uppercase text-[#ec2f73] bg-[#fff0f5] px-2.5 py-0.5 rounded-full border border-[#f5cad7]">
                        {addresses.length}/3 Max
                      </span>
                    </div>
                    <p className="text-xs text-[#716d77] m-0 mt-0.5">Manage up to 3 distinct shipping locations. Duplicates are merged automatically.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewAddress}
                    className="h-[38px] px-4 rounded-[11px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addresses.length >= 3 ? 'Replace / Add' : 'Add Address'}</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-[20px] bg-[#fffafc] border border-dashed border-[#eedbe6]">
                    <MapPin className="w-12 h-12 text-[#d9cbd5] mx-auto mb-3" />
                    <h4 className="text-base font-black text-[#141219] mb-1">No Saved Addresses</h4>
                    <p className="text-xs text-[#716d77] max-w-sm mx-auto mb-5 leading-relaxed">
                      Add an address to make checkout faster on your surprise unboxing orders.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenNewAddress}
                      className="h-[40px] px-6 rounded-[12px] bg-[#ec2f73] hover:bg-[#d92467] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 rounded-[18px] border-2 transition-all flex flex-col justify-between ${addr.isDefault
                          ? 'bg-[#fffafc] border-[#ec2f73] shadow-xs'
                          : 'bg-white border-[#eedbe6] hover:border-[#f5cad7]'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-[#141219] flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#ec2f73]" />
                              <span>{addr.label || 'Saved Location'}</span>
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Default Address
                              </span>
                            )}
                          </div>

                          <strong className="block text-xs font-bold text-[#141219]">
                            {addr.fullName}
                          </strong>
                          <p className="text-xs text-[#716d77] m-0 mt-0.5 leading-relaxed">
                            {addr.addressLine1}
                            {addr.addressLine2 && `, ${addr.addressLine2}`}
                            <br />
                            {addr.city}, {addr.state} {addr.zipCode}
                            <br />
                            {addr.country}
                          </p>
                          <p className="text-[11px] text-[#8a858f] mt-1 m-0">Phone: {addr.phone}</p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-[#f4edf2] flex items-center justify-between text-xs">
                          {!addr.isDefault ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[11px] font-black text-[#ec2f73] hover:underline cursor-pointer"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#716d77] font-semibold">Primary Address</span>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAddress(addr)}
                              className="p-1 rounded text-[#716d77] hover:text-[#ec2f73] cursor-pointer"
                              title="Edit Address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1 rounded text-[#a39ea8] hover:text-red-600 cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 4: WISHLIST ================= */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-[24px] p-6 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)]">
                <div className="flex items-center justify-between pb-3 border-b border-[#f5eaf1] mb-5">
                  <div>
                    <h2 className="text-lg font-black text-[#141219] m-0">My Saved Wishlist</h2>
                    <p className="text-xs text-[#716d77] m-0">Candles & surprises you want to reveal later</p>
                  </div>
                  <span className="text-xs font-black text-[#ec2f73]">
                    {wishlistProducts.length} Items
                  </span>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-[#f5cad7] mx-auto mb-3" />
                    <h4 className="text-base font-black text-[#141219] mb-1">Your Wishlist is Empty</h4>
                    <p className="text-xs text-[#716d77] max-w-xs mx-auto mb-4">
                      Save your favorite surprise scents to keep track of mystery reveals.
                    </p>
                    <button
                      type="button"
                      onClick={onNavigateToShop}
                      className="h-[42px] px-6 rounded-[12px] bg-[#ec2f73] text-white font-black text-xs uppercase"
                    >
                      Explore Candles
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3.5 rounded-[18px] bg-[#fffafc] border border-[#eedbe6] hover:border-[#f5cad7] transition-all flex flex-col justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => onSelectProduct(prod)}
                            className="w-18 h-18 rounded-[14px] bg-white border border-[#eee2eb] p-1 shrink-0 cursor-pointer overflow-hidden flex items-center justify-center"
                          >
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4
                              onClick={() => onSelectProduct(prod)}
                              className="text-xs sm:text-sm font-bold text-[#141219] m-0 truncate hover:text-[#ec2f73] cursor-pointer"
                            >
                              {prod.name}
                            </h4>
                            <p className="text-[10px] text-emerald-700 font-bold m-0 mt-0.5 truncate">
                              {prod.surpriseType === 'cash' ? '💵 Real Cash Inside' : '💍 Jewelry Inside'}
                            </p>
                            <span className="text-sm font-black text-[#141219] block mt-1">
                              ${prod.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-[#f4edf2] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onWishlistToggle(prod)}
                            className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>

                          <button
                            type="button"
                            onClick={() => onAddToCart(prod, 1)}
                            className="h-[34px] px-3.5 rounded-[10px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

        </div>

        {/* 4. Trending Mystery Surprise Candles Showcase */}
        {productsData.length >= 4 && (
          <div className="mt-12 pt-8 border-t border-[#eedbe6] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ec2f73] flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Curated for You</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#141219] m-0 font-display">
                  Trending Mystery Cash & Jewelry Candles
                </h3>
              </div>
              <button
                type="button"
                onClick={onNavigateToShop}
                className="h-[38px] px-5 rounded-[12px] bg-white border border-[#eedbe6] hover:border-[#ec2f73] hover:text-[#ec2f73] text-xs font-black text-[#141219] transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
              >
                <span>View Full Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {productsData.slice(0, 4).map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-[22px] p-4.5 border border-[#eedbe6] hover:border-[#ec2f73]/40 shadow-[0_4px_18px_rgba(50,31,63,0.04)] hover:shadow-[0_8px_26px_rgba(236,47,115,0.12)] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div
                      onClick={() => onSelectProduct(prod)}
                      className="relative w-full aspect-square rounded-[16px] bg-[#fffafc] border border-[#f5cad7]/50 p-2 overflow-hidden flex items-center justify-center cursor-pointer mb-3.5"
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {prod.badge && (
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#ec2f73] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                          {prod.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onWishlistToggle(prod);
                        }}
                        className={`w-7 h-7 rounded-full absolute top-2.5 right-2.5 flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                          wishlistIds.includes(prod.id)
                            ? 'bg-[#ec2f73] text-white'
                            : 'bg-white/90 hover:bg-white text-[#716d77] hover:text-[#ec2f73]'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${wishlistIds.includes(prod.id) ? 'fill-white' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{prod.rating}</span>
                      <span className="text-[#8a858f] font-normal">({prod.reviewCount})</span>
                    </div>

                    <h4
                      onClick={() => onSelectProduct(prod)}
                      className="text-xs sm:text-sm font-black text-[#141219] m-0 line-clamp-2 hover:text-[#ec2f73] cursor-pointer"
                    >
                      {prod.name}
                    </h4>

                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      {prod.surpriseType === 'cash' ? '💵 Real Cash $2 - $2,500 Inside' : '💍 Guaranteed Luxury Jewelry'}
                    </span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#f4edf2] flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-[#141219]">
                      ${prod.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddToCart(prod, 1)}
                      className="h-[34px] px-3.5 rounded-[10px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. The I Love Surprises Trust Pillars */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4.5 rounded-[20px] bg-white border border-[#eedbe6] shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-[#fff0f5] text-[#ec2f73] flex items-center justify-center shrink-0 border border-[#f5cad7]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs font-black text-[#141219] block">100% Natural Soy Wax</strong>
              <span className="text-[11px] text-[#716d77]">Hand-poured clean burn</span>
            </div>
          </div>

          <div className="p-4.5 rounded-[20px] bg-white border border-[#eedbe6] shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs font-black text-[#141219] block">Real Cash $2 - $2,500</strong>
              <span className="text-[11px] text-[#716d77]">Sealed in every cash candle</span>
            </div>
          </div>

          <div className="p-4.5 rounded-[20px] bg-white border border-[#eedbe6] shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs font-black text-[#141219] block">Fast US Dispatch</strong>
              <span className="text-[11px] text-[#716d77]">USPS tracked shipping</span>
            </div>
          </div>

          <div className="p-4.5 rounded-[20px] bg-white border border-[#eedbe6] shadow-2xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs font-black text-[#141219] block">100% Win Guarantee</strong>
              <span className="text-[11px] text-[#716d77]">Every unboxing is a winner</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ORDER DETAILS MODAL POPUP (Viewport Centered Portal) */}
      {selectedOrderDetails && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[88vh] bg-white rounded-[26px] p-5 sm:p-7 border border-[#eedbe6] shadow-2xl flex flex-col overflow-hidden animate-modal-pop my-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f4edf2]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ec2f73] block">
                  Order Details Breakdown
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#141219] m-0">
                  {selectedOrderDetails.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#fff0f5] text-[#716d77] hover:text-[#ec2f73] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Order Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">

              {/* LIVE ANIMATED COURIER & DELIVERY PIPELINE */}
              <div className="p-5 rounded-[22px] bg-gradient-to-b from-[#fff6fa] via-[#fffafc] to-[#ffffff] border border-[#f5cad7] shadow-[0_8px_30px_rgba(236,47,115,0.08)] relative overflow-hidden">
                
                {/* Header with Live Status Pulsing Beacon */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#ec2f73] inline-block animate-ping opacity-75 absolute" />
                      <span className="w-3 h-3 rounded-full bg-[#ec2f73] inline-block relative shadow-[0_0_10px_#ec2f73]" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#ec2f73] font-black uppercase tracking-wider block">
                        Live Delivery Tracker
                      </span>
                      <strong className="text-sm font-black text-[#141219]">
                        {selectedOrderDetails.status === 'delivered'
                          ? 'Package Delivered & Ready to Unbox!'
                          : selectedOrderDetails.status === 'shipped' || selectedOrderDetails.status === 'out_for_delivery'
                          ? 'On the Road with USPS Live Courier'
                          : selectedOrderDetails.status === 'processing'
                          ? 'Hand-Pouring Soy Candle & Sealing Cash Prize'
                          : 'Order Confirmed & Verified'}
                      </strong>
                    </div>
                  </div>
                  {getStatusBadge(selectedOrderDetails.status)}
                </div>

                {/* ANIMATED PROGRESS TRACK WITH MOVING VEHICLE */}
                <div className="relative pt-6 pb-4 px-2">
                  {/* Background Track */}
                  <div className="h-2.5 w-full bg-[#f2e6ee] rounded-full overflow-hidden relative">
                    {/* Animated Dashed Road Effect */}
                    <div
                      className="h-full bg-gradient-to-r from-[#ec2f73] via-[#ff4785] to-[#ec2f73] rounded-full transition-all duration-1000 ease-out relative"
                      style={{ width: `${getProgressPercentage(selectedOrderDetails.status)}%` }}
                    >
                      <div className="absolute inset-0 anim-delivery-road opacity-40" />
                    </div>
                  </div>

                  {/* Animated Courier Truck / Icon along the bar */}
                  <div
                    className="absolute top-0 -translate-x-1/2 transition-all duration-1000 ease-out pointer-events-none"
                    style={{ left: `${getProgressPercentage(selectedOrderDetails.status)}%` }}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#ec2f73] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(236,47,115,0.45)] anim-delivery-truck">
                        {selectedOrderDetails.status === 'delivered' ? (
                          <Gift className="w-4 h-4" />
                        ) : selectedOrderDetails.status === 'shipped' || selectedOrderDetails.status === 'out_for_delivery' ? (
                          <Truck className="w-4 h-4" />
                        ) : selectedOrderDetails.status === 'processing' ? (
                          <Package className="w-4 h-4 anim-delivery-package" />
                        ) : (
                          <Check className="w-4 h-4 stroke-[3]" />
                        )}
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#ec2f73] mt-1 shadow-xs animate-bounce" />
                    </div>
                  </div>

                  {/* 4 STAGE MILESTONE ICONS */}
                  <div className="grid grid-cols-4 gap-1 pt-6 text-center">
                    
                    {/* 1. Placed */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs mb-1.5 ring-4 ring-emerald-100">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[11px] font-black text-[#141219] block">1. Verified</span>
                      <span className="text-[9px] text-[#716d77]">Order Placed</span>
                    </div>

                    {/* 2. Packing */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs mb-1.5 transition-all ${
                          selectedOrderDetails.status === 'processing'
                            ? 'bg-[#ec2f73] text-white ring-4 ring-[#ffe4ee] anim-delivery-glow'
                            : selectedOrderDetails.status === 'shipped' || selectedOrderDetails.status === 'delivered' || selectedOrderDetails.status === 'out_for_delivery'
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {selectedOrderDetails.status === 'shipped' || selectedOrderDetails.status === 'delivered' || selectedOrderDetails.status === 'out_for_delivery' ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Package className="w-4 h-4 anim-delivery-package" />
                        )}
                      </div>
                      <span className="text-[11px] font-black text-[#141219] block">2. Packing</span>
                      <span className="text-[9px] text-[#716d77]">Candle & Prize</span>
                    </div>

                    {/* 3. In Transit */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs mb-1.5 transition-all ${
                          selectedOrderDetails.status === 'shipped' || selectedOrderDetails.status === 'out_for_delivery'
                            ? 'bg-[#ec2f73] text-white ring-4 ring-[#ffe4ee] anim-delivery-glow'
                            : selectedOrderDetails.status === 'delivered'
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {selectedOrderDetails.status === 'delivered' ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Truck className="w-4 h-4 anim-delivery-truck" />
                        )}
                      </div>
                      <span className="text-[11px] font-black text-[#141219] block">3. In Transit</span>
                      <span className="text-[9px] text-[#716d77]">USPS Dispatch</span>
                    </div>

                    {/* 4. Delivered */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs mb-1.5 transition-all ${
                          selectedOrderDetails.status === 'delivered'
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 anim-delivery-glow'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {selectedOrderDetails.status === 'delivered' ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Gift className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-[11px] font-black text-[#141219] block">4. Reveal</span>
                      <span className="text-[9px] text-[#716d77]">Doorstep Unbox</span>
                    </div>

                  </div>
                </div>

                {/* Real-time Tracking Checkpoints Log */}
                <div className="mt-4 pt-3.5 border-t border-[#f5cad7]/60 bg-white/80 rounded-[14px] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#141219] flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 text-[#ec2f73]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Estimated Arrival: <strong>{selectedOrderDetails.estimatedDeliveryDate}</strong></span>
                    </span>
                    {selectedOrderDetails.trackingNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopyOrderId(selectedOrderDetails.trackingNumber || '')}
                        className="text-[11px] font-black text-[#ec2f73] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>USPS: {selectedOrderDetails.trackingNumber} ({copiedOrderId === selectedOrderDetails.trackingNumber ? 'Copied! ✓' : 'Copy'})</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2 text-[11px] text-[#716d77] space-y-1.5 border-t border-[#f7eff4]">
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0 animate-pulse" />
                      <span>
                        <strong>Live Courier Status:</strong>{' '}
                        {selectedOrderDetails.status === 'delivered'
                          ? 'Package safely delivered at front porch. Real cash prize foil pouch ready for reveal unboxing.'
                          : selectedOrderDetails.status === 'shipped' || selectedOrderDetails.status === 'out_for_delivery'
                          ? 'USPS Priority Dispatch in transit. Scanned through Regional Distribution Center.'
                          : 'Order passed quality inspection. Hand-poured with certified soy wax & sealed prize capsule.'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#716d77] mb-2">
                  Items In Package ({selectedOrderDetails.items.length})
                </h4>
                <div className="space-y-2 divide-y divide-[#f7eff4]">
                  {selectedOrderDetails.items.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-11 h-11 rounded-[8px] object-contain border border-[#eee2eb]"
                        />
                        <div>
                          <p className="font-bold text-[#141219] m-0">{item.product.name}</p>
                          <p className="text-[10px] text-[#716d77] m-0">
                            Qty {item.quantity} • ${item.unitPrice.toFixed(2)} ea • {item.selectedSurpriseOption}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-[#141219]">${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Payment Grids */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f4edf2]">
                <div className="p-3 rounded-[14px] bg-[#fffafc] border border-[#eedbe6]">
                  <span className="text-[10px] font-black uppercase text-[#716d77] block mb-1">
                    Shipping Address
                  </span>
                  <p className="font-bold text-[#141219] m-0">{selectedOrderDetails.shippingAddress.fullName}</p>
                  <p className="text-[#716d77] m-0 leading-relaxed">
                    {selectedOrderDetails.shippingAddress.addressLine1}
                    {selectedOrderDetails.shippingAddress.addressLine2 && `, ${selectedOrderDetails.shippingAddress.addressLine2}`}
                    <br />
                    {selectedOrderDetails.shippingAddress.city}, {selectedOrderDetails.shippingAddress.state} {selectedOrderDetails.shippingAddress.zipCode}
                  </p>
                </div>

                <div className="p-3 rounded-[14px] bg-[#fffafc] border border-[#eedbe6]">
                  <span className="text-[10px] font-black uppercase text-[#716d77] block mb-1">
                    Payment Method
                  </span>
                  <p className="font-bold text-[#141219] m-0 capitalize">
                    {selectedOrderDetails.paymentSummary.cardBrand || selectedOrderDetails.paymentSummary.method.replace('_', ' ')}
                  </p>
                  <p className="text-[#716d77] m-0">
                    Status:{' '}
                    {selectedOrderDetails.paymentSummary.method === 'cod' ? (
                      <strong className="text-amber-800">💵 Pay on Delivery (${selectedOrderDetails.total.toFixed(2)})</strong>
                    ) : (
                      <strong className="text-emerald-700">✓ Paid (${selectedOrderDetails.total.toFixed(2)})</strong>
                    )}
                  </p>
                  <p className="text-[10px] text-[#8a858f] m-0 mt-1">
                    Date: {new Date(selectedOrderDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Price Calculations */}
              <div className="p-3 rounded-[14px] bg-stone-50 border border-stone-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold">${selectedOrderDetails.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span>-${selectedOrderDetails.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{selectedOrderDetails.shippingFee === 0 ? 'FREE' : `$${selectedOrderDetails.shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-200 font-black text-sm text-[#141219]">
                  <span>Total Paid</span>
                  <span className="text-[#ec2f73]">${selectedOrderDetails.total.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-3 mt-3 border-t border-[#f4edf2] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="h-[38px] px-4 rounded-[11px] bg-white border border-[#e8dfe5] hover:border-[#ec2f73] text-[#55505a] hover:text-[#ec2f73] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="h-[38px] px-5 rounded-[11px] bg-[#ec2f73] hover:bg-[#d92467] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 4. ADD / EDIT ADDRESS MODAL (Viewport Centered Portal) */}
      {isAddressModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg max-h-[88vh] bg-white rounded-[26px] p-5 sm:p-7 border border-[#eedbe6] shadow-2xl animate-modal-pop my-auto overflow-y-auto">

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#f4edf2]">
              <h3 className="text-base sm:text-lg font-black text-[#141219] m-0">
                {editingAddress ? 'Edit Saved Address' : 'Add New Saved Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#fff0f5] text-[#716d77] hover:text-[#ec2f73] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#fffafc] border border-[#f5cad7]">
                <span className="text-[11px] font-bold text-[#716d77]">Need to pinpoint your address?</span>
                <button
                  type="button"
                  onClick={() => setIsAccountMapOpen(true)}
                  className="h-[30px] px-2.5 rounded-[8px] bg-white hover:bg-[#fff0f5] text-[#ec2f73] border border-[#f5cad7] text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Choose on Map</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1">
                    Label (e.g. Home, Office)
                  </label>
                  <input
                    type="text"
                    value={addressForm.label || ''}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    placeholder="Home"
                    className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1">
                    Full Name <span className="text-[#ec2f73]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none"
                  />
                  {addressErrors.fullName && (
                    <p className="text-[10px] text-red-600 mt-0.5">{addressErrors.fullName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Phone Number <span className="text-[#ec2f73]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none"
                />
                {addressErrors.phone && (
                  <p className="text-[10px] text-red-600 mt-0.5">{addressErrors.phone}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#141219]">
                    Street Address <span className="text-[#ec2f73]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAccountMapOpen(true)}
                    className="text-[10px] font-bold text-[#ec2f73] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <MapPin className="w-2.5 h-2.5" />
                    <span>Map</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="123 Main St"
                  className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none"
                />
                {addressErrors.addressLine1 && (
                  <p className="text-[10px] text-red-600 mt-0.5">{addressErrors.addressLine1}</p>
                )}
              </div>

              {/* Luxury Searchable Country & State Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <CustomSearchableSelect
                  label="Country"
                  required
                  icon={<Globe className="w-3.5 h-3.5" />}
                  options={accountCountryOptions}
                  value={addressForm.country}
                  onChange={handleAccountCountryChange}
                  placeholder="Select Country..."
                  searchPlaceholder="Search country..."
                />

                <CustomSearchableSelect
                  label="State / Province"
                  required
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  options={accountStateOptions}
                  value={addressForm.state}
                  onChange={handleAccountStateChange}
                  placeholder="Select State..."
                  searchPlaceholder="Search state..."
                  error={addressErrors.state}
                />
              </div>

              {/* District & City Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <CustomSearchableSelect
                  label="District / County"
                  icon={<Compass className="w-3.5 h-3.5" />}
                  options={accountDistrictOptions}
                  value={selectedAccountDistrict}
                  onChange={handleAccountDistrictChange}
                  placeholder="District..."
                  searchPlaceholder="Search district..."
                />

                {accountCityOptions.length > 0 ? (
                  <CustomSearchableSelect
                    label="City / Town"
                    required
                    icon={<Building2 className="w-3.5 h-3.5" />}
                    options={accountCityOptions}
                    value={addressForm.city}
                    onChange={(c) => {
                      setAddressForm({ ...addressForm, city: c });
                      if (addressErrors.city) {
                        setAddressErrors((prev) => {
                          const next = { ...prev };
                          delete next.city;
                          return next;
                        });
                      }
                    }}
                    placeholder="City..."
                    searchPlaceholder="Search city..."
                    error={addressErrors.city}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1.5">
                      City / Town <span className="text-[#ec2f73]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* ZIP & Apt / Suite */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1.5">
                    ZIP / Postal Code <span className="text-[#ec2f73]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1.5">
                    Apt / Suite <span className="text-[#8a858f] font-normal">(Opt)</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.addressLine2 || ''}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    placeholder="Apt 4B"
                    className="w-full h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-[#ec2f73] accent-[#ec2f73]"
                />
                <span className="text-xs text-[#55505a] font-bold">
                  Set as default shipping address
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f4edf2]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="h-[40px] px-4 rounded-[11px] border border-[#e8dfe5] text-xs font-bold text-[#716d77] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[40px] px-6 rounded-[11px] bg-[#ec2f73] hover:bg-[#d92467] text-white font-black text-xs uppercase shadow-xs cursor-pointer"
                >
                  Save Address
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* Interactive Map Location Picker Modal */}
      <MapLocationPickerModal
        isOpen={isAccountMapOpen}
        onClose={() => setIsAccountMapOpen(false)}
        onSelectAddress={handleSelectAccountAddressFromMap}
        initialAddress={addressForm}
      />
    </div>
  );
};
