import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Product, SurpriseType } from '../types';
import { productsData } from '../data/products';
import { categoriesData } from '../data/categories';
import type { Database } from '../types/supabase';

type ProductRow = Database['public']['Tables']['products']['Row'];

/**
 * Converts a database row to the frontend Product model
 */
export function mapRowToProduct(row: ProductRow): Product {
  // Resolve category name from category_id
  const matchedCategory = categoriesData.find((c) => c.id === row.category_id);
  const categoryName = matchedCategory ? matchedCategory.name : 'Candles';

  let scentNotesArray: string[] | undefined = undefined;
  if (Array.isArray(row.scent_notes)) {
    scentNotesArray = row.scent_notes.map((s) => String(s));
  } else if (typeof row.scent_notes === 'string') {
    scentNotesArray = [row.scent_notes];
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: categoryName,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    surpriseType: (row.surprise_type as SurpriseType) || 'mystery',
    surpriseValue: row.surprise_value || undefined,
    rating: Number(row.rating) || 4.8,
    reviewCount: Number(row.review_count) || 0,
    image: row.image,
    badge: row.badge || undefined,
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
    inStock: Boolean(row.in_stock),
    scentNotes: scentNotesArray,
    description: row.description || undefined,
  };
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  searchQuery?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  surpriseTypes?: SurpriseType[];
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'best-sellers';
}

export interface PaginatedProductsResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export const productService = {
  /**
   * Fetches paginated products with server-side filtering when Supabase is available,
   * otherwise falls back to local data gracefully.
   */
  async getProducts(params: GetProductsParams = {}): Promise<PaginatedProductsResult> {
    const page = Math.max(1, params.page || 1);
    const limit = params.limit || 25;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' });

        // Category filter
        if (params.category && params.category !== 'All Surprises' && params.category !== 'All') {
          const matchedCategory = categoriesData.find(
            (c) => c.name.toLowerCase() === params.category!.toLowerCase()
          );
          if (matchedCategory) {
            query = query.eq('category_id', matchedCategory.id);
          }
        }

        // Search query
        if (params.searchQuery?.trim()) {
          query = query.ilike('name', `%${params.searchQuery.trim()}%`);
        }

        // Price range
        if (params.minPrice !== undefined && params.minPrice !== null) {
          query = query.gte('price', params.minPrice);
        }
        if (params.maxPrice !== undefined && params.maxPrice !== null) {
          query = query.lte('price', params.maxPrice);
        }

        // Surprise type filter
        if (params.surpriseTypes && params.surpriseTypes.length > 0) {
          query = query.in('surprise_type', params.surpriseTypes);
        }

        // Sorting
        switch (params.sort) {
          case 'price-asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price-desc':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'newest':
            query = query.order('is_new', { ascending: false }).order('created_at', { ascending: false });
            break;
          case 'best-sellers':
            query = query.order('is_best_seller', { ascending: false }).order('review_count', { ascending: false });
            break;
          case 'featured':
          default:
            query = query.order('is_best_seller', { ascending: false }).order('rating', { ascending: false });
            break;
        }

        const { data, error, count } = await query.range(from, to);

        if (!error && data && data.length > 0) {
          const products = data.map(mapRowToProduct);
          const total = count ?? products.length;
          return {
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit),
          };
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to static dataset:', err);
      }
    }

    // Fallback in-memory pagination and filtering
    let filtered = [...productsData];

    if (params.category && params.category !== 'All Surprises' && params.category !== 'All') {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === params.category!.toLowerCase()
      );
    }

    if (params.searchQuery?.trim()) {
      const q = params.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (params.minPrice !== undefined && params.minPrice !== null) {
      filtered = filtered.filter((p) => p.price >= params.minPrice!);
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      filtered = filtered.filter((p) => p.price <= params.maxPrice!);
    }

    if (params.surpriseTypes && params.surpriseTypes.length > 0) {
      filtered = filtered.filter((p) => params.surpriseTypes!.includes(p.surpriseType));
    }

    // Sort
    switch (params.sort) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'best-sellers':
        filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.reviewCount - a.reviewCount);
        break;
      default:
        filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    const total = filtered.length;
    const paginated = filtered.slice(from, to + 1);

    return {
      products: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Retrieves single product by slug or ID
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .maybeSingle();

        if (!error && data) {
          return mapRowToProduct(data);
        }
      } catch (err) {
        console.warn('Supabase getProductBySlug error, using fallback:', err);
      }
    }

    // Static fallback
    return productsData.find((p) => p.slug === slug || p.id === slug) || null;
  },

  /**
   * Retrieves featured bestseller products
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_best_seller', true)
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data.map(mapRowToProduct);
        }
      } catch (err) {
        console.warn('Supabase getFeaturedProducts error, using fallback:', err);
      }
    }

    return productsData.filter((p) => p.isBestSeller).slice(0, limit);
  },
};
