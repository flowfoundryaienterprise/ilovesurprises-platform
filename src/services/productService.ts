import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Product, SurpriseType } from '../types';
import { productsData } from '../data/products';
import { categoriesData } from '../data/categories';
import { deduplicateProducts, rankProductsBySearch } from '../utils/productUtils';
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

        // Category / Collection filter
        if (params.category && params.category !== 'All Surprises' && params.category !== 'All') {
          const catParam = params.category.toLowerCase().trim();
          const matchedCategory = categoriesData.find(
            (c) =>
              c.name.toLowerCase() === catParam ||
              c.slug.toLowerCase() === catParam ||
              c.id.toLowerCase() === catParam
          );
          if (matchedCategory) {
            query = query.eq('category_id', matchedCategory.id);
          } else if (catParam.includes('zodiac')) {
            query = query.ilike('name', '%zodiac%');
          } else {
            const rootWord = catParam.replace(/s$/i, '');
            query = query.or(`name.ilike.%${catParam}%,name.ilike.%${rootWord}%`);
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

        // Sorting with deterministic ID tie-breaker to prevent pagination overlap/duplicates
        switch (params.sort) {
          case 'price-asc':
            query = query.order('price', { ascending: true }).order('id', { ascending: true });
            break;
          case 'price-desc':
            query = query.order('price', { ascending: false }).order('id', { ascending: true });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false }).order('id', { ascending: true });
            break;
          case 'newest':
            query = query.order('is_new', { ascending: false }).order('created_at', { ascending: false }).order('id', { ascending: true });
            break;
          case 'best-sellers':
            query = query.order('is_best_seller', { ascending: false }).order('review_count', { ascending: false }).order('id', { ascending: true });
            break;
          case 'featured':
          default:
            query = query.order('is_best_seller', { ascending: false }).order('rating', { ascending: false }).order('id', { ascending: true });
            break;
        }

        const { data, error, count } = await query.range(from, to);

        if (!error && data && data.length > 0) {
          const products = deduplicateProducts(data.map(mapRowToProduct));
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
      const catParam = params.category.toLowerCase().trim();
      const matchedCategory = categoriesData.find(
        (c) =>
          c.name.toLowerCase() === catParam ||
          c.slug.toLowerCase() === catParam ||
          c.id.toLowerCase() === catParam
      );
      if (matchedCategory) {
        const targetName = matchedCategory.name.toLowerCase();
        filtered = filtered.filter((p) => p.category.toLowerCase() === targetName);
      } else if (catParam.includes('zodiac')) {
        filtered = filtered.filter((p) => p.name.toLowerCase().includes('zodiac'));
      } else {
        const rootWord = catParam.replace(/s$/i, '');
        filtered = filtered.filter(
          (p) =>
            p.category.toLowerCase() === catParam ||
            p.name.toLowerCase().includes(catParam) ||
            p.name.toLowerCase().includes(rootWord)
        );
      }
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
    const paginated = deduplicateProducts(filtered).slice(from, to + 1);

    return {
      products: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Fast real-time product search with Supabase querying and intelligent ranking
   */
  async searchProducts(query: string, limit = 8): Promise<Product[]> {
    const q = (query || '').trim();
    if (!q) {
      return this.getFeaturedProducts(limit);
    }

    if (isSupabaseConfigured()) {
      try {
        const candidateRows: ProductRow[] = [];
        const seenRowIds = new Set<string>();

        // 1. Exact match check (case-insensitive, instant ~100-200ms)
        const { data: exactRows } = await supabase
          .from('products')
          .select('*')
          .ilike('name', q)
          .limit(5);

        if (exactRows) {
          for (const row of exactRows) {
            if (!seenRowIds.has(row.id)) {
              seenRowIds.add(row.id);
              candidateRows.push(row);
            }
          }
        }

        // 2. Exact slug match check
        const normalizedSlug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (normalizedSlug) {
          const { data: slugRows } = await supabase
            .from('products')
            .select('*')
            .eq('slug', normalizedSlug)
            .limit(5);

          if (slugRows) {
            for (const row of slugRows) {
              if (!seenRowIds.has(row.id)) {
                seenRowIds.add(row.id);
                candidateRows.push(row);
              }
            }
          }
        }

        // 3. Prefix search (B-Tree friendly, fast)
        const { data: prefixRows } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `${q}%`)
          .limit(limit * 2);

        if (prefixRows) {
          for (const row of prefixRows) {
            if (!seenRowIds.has(row.id)) {
              seenRowIds.add(row.id);
              candidateRows.push(row);
            }
          }
        }

        // 4. Substring search if more candidates needed
        if (candidateRows.length < limit * 2) {
          const { data: subRows } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${q}%`)
            .limit(limit * 2);

          if (subRows) {
            for (const row of subRows) {
              if (!seenRowIds.has(row.id)) {
                seenRowIds.add(row.id);
                candidateRows.push(row);
              }
            }
          }
        }

        // Supabase query succeeded: return ranked real catalog results
        // (Even if candidateRows is empty, it means genuine 0 matching products found in the 57k+ catalog)
        const mapped = candidateRows.map(mapRowToProduct);
        const ranked = rankProductsBySearch(mapped, q);
        return ranked.slice(0, limit);
      } catch (err) {
        console.warn('Supabase searchProducts error, falling back to static dataset:', err);
      }
    }

    // Static fallback (only if Supabase is unconfigured or offline network failure)
    const staticMatches = productsData.filter((p) => {
      const name = p.name.toLowerCase();
      const cat = p.category.toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const lowerQ = q.toLowerCase();
      return name.includes(lowerQ) || cat.includes(lowerQ) || desc.includes(lowerQ);
    });

    return rankProductsBySearch(staticMatches, q).slice(0, limit);
  },

  /**
   * Retrieves single product by slug or ID with exact matching and fallback protection
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;
    const cleanSlug = slug.trim();

    if (isSupabaseConfigured()) {
      try {
        // Check by slug first
        const { data: bySlug, error: slugErr } = await supabase
          .from('products')
          .select('*')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (!slugErr && bySlug) {
          return mapRowToProduct(bySlug);
        }

        // Check by id second
        const { data: byId, error: idErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', cleanSlug)
          .maybeSingle();

        if (!idErr && byId) {
          return mapRowToProduct(byId);
        }
      } catch (err) {
        console.warn('Supabase getProductBySlug error, using fallback:', err);
      }
    }

    // Static fallback (exact slug or ID match only)
    return productsData.find((p) => p.slug === cleanSlug || p.id === cleanSlug) || null;
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
          .order('id', { ascending: true })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return deduplicateProducts(data.map(mapRowToProduct));
        }
      } catch (err) {
        console.warn('Supabase getFeaturedProducts error, using fallback:', err);
      }
    }

    return deduplicateProducts(productsData.filter((p) => p.isBestSeller)).slice(0, limit);
  },
};

