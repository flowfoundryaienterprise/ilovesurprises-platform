export interface Category {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  itemCount: number;
  image: string;
  featured?: boolean;
  accentColor?: string;
}

export type SurpriseType = 'jewelry' | 'cash' | 'trinket' | 'charm' | 'mystery';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  surpriseType: SurpriseType;
  surpriseValue?: string; // e.g. "Jewelry inside worth $10 - $7,500" or "Real Cash $2 - $2,500 inside"
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  scentNotes?: string[];
  description?: string;
  sku?: string;
  ringSizes?: number[];
  jewelryTypes?: string[];
}

export interface Review {
  id: string;
  productId?: string;
  author: string;
  location?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  productName: string;
  revealedSurprise?: string;
  avatar?: string;
}

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
  children?: { label: string; href: string; description?: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSurpriseOption?: string;
  selectedRingSize?: number;
  selectedJewelryType?: string;
  selectedSize?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role: 'customer' | 'representative' | 'admin';
  repUsername?: string;
  avatar?: string;
}

export * from './order';
export * from './affiliate';
export * from './admin';
