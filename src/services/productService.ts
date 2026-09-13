import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Product, SurpriseType, Collection, ProductVariant, ProductOption } from '../types';
import { productsData } from '../data/products';
import { categoriesData } from '../data/categories';
import { deduplicateProducts, rankProductsBySearch } from '../utils/productUtils';

/**
 * Authoritative production Supabase catalog query columns.
 * Selects 1st-class product attributes, joined variant pricing/sku/options, and ordered image gallery.
 */
export const CARD_SELECT_COLUMNS =
  'product_id, handle, title, body_html, total_inventory_qty, category_name, product_variants(variant_id, price, compare_at_price, sku, option1_name, option1_value, option2_name, option2_value, option3_name, option3_value), product_images(image_url, position, alt_text)';


/**
 * In-memory LRU/TTL Query Cache to deliver instant (< 5ms) responses on repeated queries,
 * tab switching, pagination back-and-forth, and filter toggles.
 */
interface QueryCacheEntry {
  result: PaginatedProductsResult;
  timestamp: number;
}
const queryCache = new Map<string, QueryCacheEntry>();
const QUERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * In-memory single product cache by slug & ID for instant product details navigation.
 */
const productSlugCache = new Map<string, Product>();

/**
 * Resolves a product image URL, automatically recovering from 404s, generic Shopify placeholders,
 * or missing image fields by selecting the authentic category or product mockup.
 */
export function resolveProductImage(
  rawImage?: string | null,
  name?: string,
  category?: string
): string {
  const img = (rawImage || '').trim();
  const isBroken =
    !img ||
    img.includes('generic-candle.jpg') ||
    img.includes('placeholder') ||
    img === '/placeholder.svg';

  if (!isBroken) {
    return img;
  }

  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // Special match for "50 and fabulous" series
  if (n.includes('50 and fabulous')) {
    return 'https://cdn.shopify.com/s/files/1/0172/4672/products/37_Mockup_Jewelry_JewelryCandles_133547cc-a1c0-4b24-b2ae-58b15dc9e17c.jpg?v=1654707054';
  }

  // Wax Melts / Bear Melts
  if (n.includes('bear') || n.includes('wax melt') || c.includes('melt')) {
    return '/assets/ilovesurprises/products/Gummy-Bear_Figurines_JWL_wax_melts.jpg';
  }
  // Bath & Body / Bath Bombs
  if (n.includes('bath') || c.includes('bath')) {
    return '/assets/ilovesurprises/products/7_Mockup_JC_c4d7b0a0-8353-4e0c-b8af-eb0ccc5b41d8.jpg';
  }
  // Soaps
  if (n.includes('soap') || c.includes('soap')) {
    return '/assets/ilovesurprises/categories/goats_milk_soaps.jpg';
  }
  // Slimes
  if (n.includes('slime') || c.includes('slime')) {
    return '/assets/ilovesurprises/products/Brown-Sugar-Boba-Cash-Cereal-Slimes.jpg';
  }
  // Zodiac
  if (n.includes('zodiac') || c.includes('zodiac')) {
    return '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp';
  }
  // Cash / Soda Pop Candles
  if (n.includes('cash') || n.includes('soda') || c.includes('cash')) {
    return '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
  }
  // Default Jewelry Candle Mockup
  return '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg';
}

/**
 * Converts a database row to the frontend Product model.
 * Seamlessly maps the authoritative production Shopify schema (product_id, title, handle, etc.)
 * while maintaining backward compatibility with legacy row objects.
 */
export function mapRowToProduct(row: any): Product {
  const id = String(row.product_id || row.id || '');
  const name = String(row.title || row.name || 'Surprise Product');
  const slug = String(row.handle || row.slug || '');
  const description = row.body_html || row.description || undefined;

  // Resolve category name from category_name or category_id
  let categoryName = row.category_name || '';
  if (!categoryName && row.category_id) {
    const matchedCategory = categoriesData.find((c) => c.id === row.category_id);
    categoryName = matchedCategory ? matchedCategory.name : 'Candles';
  }
  if (!categoryName) {
    categoryName = 'Candles';
  }

  // Variant pricing & SKU resolution
  let price = 0;
  let originalPrice: number | undefined = undefined;
  let sku: string | undefined = undefined;

  if (Array.isArray(row.product_variants) && row.product_variants.length > 0) {
    const validVariants = row.product_variants.filter((v: any) => v && typeof v.price === 'number' && v.price > 0);
    const chosenVariant = validVariants[0] || row.product_variants[0];
    price = Number(chosenVariant?.price) || 0;
    if (chosenVariant?.compare_at_price) {
      originalPrice = Number(chosenVariant.compare_at_price);
    }
    sku = chosenVariant?.sku || undefined;
  } else {
    price = Number(row.price) || 0;
    originalPrice = row.original_price ? Number(row.original_price) : undefined;
    sku = row.sku || undefined;
  }

  // Image resolution from product_images relation or fallback
  let rawImage: string | null = null;
  let allImages: string[] = [];
  if (Array.isArray(row.product_images) && row.product_images.length > 0) {
    const sortedImages = [...row.product_images].sort(
      (a: any, b: any) => (a.position || 0) - (b.position || 0)
    );
    rawImage = sortedImages[0]?.image_url || null;
    allImages = sortedImages.map((img: any) => img.image_url).filter(Boolean);
  }
  if (!rawImage && row.image) {
    rawImage = row.image;
    allImages = [row.image];
  }
  const resolvedImage = resolveProductImage(rawImage, name, categoryName);
  if (allImages.length === 0 && resolvedImage) {
    allImages = [resolvedImage];
  }

  // Variant list and option values mapping
  let variants: ProductVariant[] | undefined = undefined;
  let options: ProductOption[] | undefined = undefined;

  if (Array.isArray(row.product_variants) && row.product_variants.length > 0) {
    variants = row.product_variants.map((v: any) => ({
      variantId: String(v.variant_id || ''),
      productId: id,
      title: v.title || [v.option1_value, v.option2_value, v.option3_value].filter(Boolean).join(' / ') || undefined,
      price: Number(v.price) || price,
      compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : undefined,
      sku: v.sku || undefined,
      inStock: v.inventory_qty !== undefined && v.inventory_qty !== null ? v.inventory_qty > 0 : true,
      option1Name: v.option1_name || undefined,
      option1Value: v.option1_value || undefined,
      option2Name: v.option2_name || undefined,
      option2Value: v.option2_value || undefined,
      option3Name: v.option3_name || undefined,
      option3Value: v.option3_value || undefined,
    }));

    const optMap = new Map<string, { name: string; position: number; values: Set<string> }>();
    if (variants) {
      variants.forEach((v) => {
        if (v.option1Name && v.option1Value && v.option1Value !== 'Default Title') {
          if (!optMap.has(v.option1Name)) optMap.set(v.option1Name, { name: v.option1Name, position: 1, values: new Set() });
          optMap.get(v.option1Name)!.values.add(v.option1Value);
        }
        if (v.option2Name && v.option2Value) {
          if (!optMap.has(v.option2Name)) optMap.set(v.option2Name, { name: v.option2Name, position: 2, values: new Set() });
          optMap.get(v.option2Name)!.values.add(v.option2Value);
        }
        if (v.option3Name && v.option3Value) {
          if (!optMap.has(v.option3Name)) optMap.set(v.option3Name, { name: v.option3Name, position: 3, values: new Set() });
          optMap.get(v.option3Name)!.values.add(v.option3Value);
        }
      });
    }
    if (optMap.size > 0) {
      options = Array.from(optMap.values()).map((o) => ({
        name: o.name,
        position: o.position,
        values: Array.from(o.values),
      }));
    }
  }

  // In-stock determination from total_inventory_qty or boolean
  let inStock = true;
  if (typeof row.total_inventory_qty === 'number') {
    inStock = row.total_inventory_qty > 0;
  } else if (typeof row.in_stock === 'boolean') {
    inStock = row.in_stock;
  }

  // Scent notes
  let scentNotesArray: string[] | undefined = undefined;
  if (Array.isArray(row.scent_notes)) {
    scentNotesArray = row.scent_notes.map((s: any) => String(s));
  } else if (typeof row.scent_notes === 'string') {
    scentNotesArray = [row.scent_notes];
  }

  // Determine surprise type
  let surpriseType: SurpriseType = (row.surprise_type as SurpriseType) || 'mystery';
  const nameLower = name.toLowerCase();
  if (!row.surprise_type) {
    if (nameLower.includes('cash') || nameLower.includes('money')) {
      surpriseType = 'cash';
    } else if (
      nameLower.includes('jewelry') ||
      nameLower.includes('ring') ||
      nameLower.includes('necklace') ||
      nameLower.includes('diamond')
    ) {
      surpriseType = 'jewelry';
    } else if (nameLower.includes('charm')) {
      surpriseType = 'charm';
    } else {
      surpriseType = 'mystery';
    }
  }

  const prod: Product = {
    id,
    name,
    slug,
    category: categoryName,
    price,
    originalPrice,
    surpriseType,
    surpriseValue:
      row.surprise_value ||
      (surpriseType === 'cash'
        ? 'Real Cash $2 - $2,500 inside'
        : 'Jewelry inside worth $10 - $7,500'),
    rating: Number(row.rating) || 4.8,
    reviewCount: Number(row.review_count) || 24,
    image: resolvedImage,
    images: allImages,
    variants,
    options,
    badge:
      row.badge ||
      (inStock && price > 0
        ? nameLower.includes('diamond')
          ? 'Best Seller'
          : undefined
        : undefined),
    isNew: row.is_new !== undefined ? Boolean(row.is_new) : false,
    isBestSeller:
      row.is_best_seller !== undefined
        ? Boolean(row.is_best_seller)
        : nameLower.includes('diamond') || nameLower.includes('cash'),
    inStock,
    scentNotes: scentNotesArray,
    description,
    sku,
  };

  if (prod.slug) productSlugCache.set(prod.slug.toLowerCase(), prod);
  if (prod.id) productSlugCache.set(prod.id.toLowerCase(), prod);

  return prod;
}

/**
 * Maps a Supabase collections table row to frontend Collection model.
 */
export function mapRowToCollection(row: any): Collection {
  return {
    id: String(row.collection_id || row.id || ''),
    handle: String(row.handle || ''),
    title: String(row.title || 'Collection'),
    bodyHtml: row.body_html || undefined,
    productsCount: Number(row.products_count) || 0,
    imageUrl: row.image_url || undefined,
    sortOrder: row.sort_order || undefined,
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
   * Fast paginated product loader querying the authoritative 57,479-product Supabase catalog.
   * Utilizes in-memory caching, subcategory token matching, and joins for prices and images.
   */
  async getProducts(params: GetProductsParams = {}): Promise<PaginatedProductsResult> {
    const page = Math.max(1, params.page || 1);
    const limit = params.limit || 25;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Generate cache key for params
    const cacheKey = JSON.stringify({
      page,
      limit,
      category: params.category || 'all',
      search: (params.searchQuery || '').trim().toLowerCase(),
      minPrice: params.minPrice ?? null,
      maxPrice: params.maxPrice ?? null,
      surpriseTypes: (params.surpriseTypes || []).slice().sort(),
      sort: params.sort || 'featured',
    });

    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result;
    }

    if (isSupabaseConfigured()) {
      try {
        const isUnfiltered =
          (!params.category || params.category === 'All Surprises' || params.category === 'All') &&
          !params.searchQuery?.trim() &&
          params.minPrice === undefined &&
          params.maxPrice === undefined &&
          (!params.surpriseTypes || params.surpriseTypes.length === 0);

        let query = supabase
          .from('products')
          .select(CARD_SELECT_COLUMNS, { count: 'exact' });

        // Category / Collection filter with intelligent subcategory mapping
        if (params.category && params.category !== 'All Surprises' && params.category !== 'All') {
          const catParam = params.category.toLowerCase().trim();
          if (catParam.includes('zodiac')) {
            query = query.ilike('title', '%zodiac%');
          } else if (catParam.includes('coffee') || catParam.includes('mug')) {
            query = query.ilike('title', '%coffee%');
          } else if (
            catParam.includes('astrology') ||
            catParam.includes('birthdate') ||
            catParam.includes('birthday')
          ) {
            query = query.or('title.ilike.%astrology%,title.ilike.%birthday%');
          } else if (catParam.includes('soda') || catParam.includes('pop')) {
            query = query.or('title.ilike.%soda%,title.ilike.%pop%');
          } else if (catParam.includes('military')) {
            query = query.ilike('title', '%military%');
          } else if (catParam.includes('cereal')) {
            query = query.ilike('title', '%cereal%');
          } else if (catParam.includes('wine')) {
            query = query.ilike('title', '%wine%');
          } else if (catParam.includes('anime')) {
            query = query.ilike('title', '%anime%');
          } else if (catParam.includes('funny')) {
            query = query.ilike('title', '%funny%');
          } else if (
            catParam === 'trending' ||
            catParam === 'best-sellers' ||
            catParam.includes('trending')
          ) {
            query = query.or('tags.ilike.%trending%,tags.ilike.%bestseller%,title.ilike.%diamond%');
          } else {
            const tokens = catParam
              .split(/[\s+/,-]+/)
              .map((t) => t.trim())
              .filter((t) => t.length > 2 && !['and', 'the', 'for', 'candles', 'candle'].includes(t));

            if (tokens.length > 0) {
              const primaryToken = tokens[0];
              const rootWord = primaryToken.replace(/s$/i, '');
              query = query.or(
                `title.ilike.%${primaryToken}%,title.ilike.%${rootWord}%,category_name.ilike.%${primaryToken}%`
              );
            } else {
              const rootWord = catParam.replace(/s$/i, '');
              query = query.or(
                `title.ilike.%${catParam}%,title.ilike.%${rootWord}%,category_name.ilike.%${catParam}%`
              );
            }
          }
        }

        // Search query against title
        if (params.searchQuery?.trim()) {
          const rawSearch = params.searchQuery.trim();
          query = query.ilike('title', `%${rawSearch}%`);
        }

        // Sorting
        switch (params.sort) {
          case 'newest':
            query = query
              .order('created_at', { ascending: false })
              .order('product_id', { ascending: true });
            break;
          default:
            query = query.order('product_id', { ascending: true });
            break;
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
          console.error('❌ Supabase getProducts query error:', error.message, error.details);
        }

        if (!error && data && data.length > 0) {
          const products = deduplicateProducts(data.map(mapRowToProduct));
          const total =
            count !== null && count !== undefined && count > 0
              ? count
              : isUnfiltered
              ? 57479
              : products.length;

          const result: PaginatedProductsResult = {
            products,
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          };

          queryCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        } else if (!error && data && data.length === 0) {
          const result: PaginatedProductsResult = {
            products: [],
            total: 0,
            page,
            totalPages: 1,
          };
          queryCache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      } catch (err) {
        console.warn('❌ Supabase query exception, falling back to static dataset:', err);
      }
    }

    // Fallback in-memory pagination and filtering (only if network offline or Supabase unavailable)
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
        filtered.sort(
          (a, b) =>
            (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.reviewCount - a.reviewCount
        );
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
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  /**
   * Fast real-time product search with Supabase querying against title and handle.
   */
  async searchProducts(query: string, limit = 8): Promise<Product[]> {
    const q = (query || '').trim();
    if (!q) {
      return this.getFeaturedProducts(limit);
    }

    if (isSupabaseConfigured()) {
      try {
        const candidateRows: any[] = [];
        const seenRowIds = new Set<string>();

        // 1. Exact title match check
        const { data: exactRows } = await (supabase as any)
          .from('products')
          .select(CARD_SELECT_COLUMNS)
          .ilike('title', q)
          .limit(5);

        if (exactRows) {
          for (const row of exactRows) {
            const rid = (row as any).product_id || (row as any).id;
            if (rid && !seenRowIds.has(rid)) {
              seenRowIds.add(rid);
              candidateRows.push(row);
            }
          }
        }

        // 2. Exact handle match check
        const normalizedSlug = q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (normalizedSlug) {
          const { data: slugRows } = await (supabase as any)
            .from('products')
            .select(CARD_SELECT_COLUMNS)
            .eq('handle', normalizedSlug)
            .limit(5);

          if (slugRows) {
            for (const row of slugRows) {
              const rid = (row as any).product_id || (row as any).id;
              if (rid && !seenRowIds.has(rid)) {
                seenRowIds.add(rid);
                candidateRows.push(row);
              }
            }
          }
        }

        // 3. Prefix search against title
        const { data: prefixRows } = await (supabase as any)
          .from('products')
          .select(CARD_SELECT_COLUMNS)
          .ilike('title', `${q}%`)
          .limit(limit * 2);

        if (prefixRows) {
          for (const row of prefixRows) {
            const rid = (row as any).product_id || (row as any).id;
            if (rid && !seenRowIds.has(rid)) {
              seenRowIds.add(rid);
              candidateRows.push(row);
            }
          }
        }

        // 4. Substring search if more candidates needed
        if (candidateRows.length < limit * 2) {
          const { data: subRows } = await (supabase as any)
            .from('products')
            .select(CARD_SELECT_COLUMNS)
            .ilike('title', `%${q}%`)
            .limit(limit * 2);

          if (subRows) {
            for (const row of subRows) {
              const rid = (row as any).product_id || (row as any).id;
              if (rid && !seenRowIds.has(rid)) {
                seenRowIds.add(rid);
                candidateRows.push(row);
              }
            }
          }
        }

        const mapped = candidateRows.map(mapRowToProduct);
        const ranked = rankProductsBySearch(mapped, q);
        return ranked.slice(0, limit);
      } catch (err) {
        console.warn('❌ Supabase searchProducts error, falling back to static dataset:', err);
      }
    }

    // Static fallback
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
   * Retrieves single product by handle (slug) or product_id with in-memory cache.
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;
    const cleanSlug = slug.trim();
    const lowerSlug = cleanSlug.toLowerCase();

    // 1. Check in-memory product cache first
    const cached = productSlugCache.get(lowerSlug);
    if (cached) {
      return cached;
    }

    if (isSupabaseConfigured()) {
      try {
        // Check by handle first (exact match)
        const { data: byHandle, error: handleErr } = await supabase
          .from('products')
          .select(CARD_SELECT_COLUMNS)
          .eq('handle', cleanSlug)
          .maybeSingle();

        if (!handleErr && byHandle) {
          return mapRowToProduct(byHandle);
        }

        // Check by case-insensitive handle
        const { data: byIlikeHandle, error: ilikeErr } = await supabase
          .from('products')
          .select(CARD_SELECT_COLUMNS)
          .ilike('handle', cleanSlug)
          .maybeSingle();

        if (!ilikeErr && byIlikeHandle) {
          return mapRowToProduct(byIlikeHandle);
        }

        // Check by product_id
        const { data: byId, error: idErr } = await supabase
          .from('products')
          .select(CARD_SELECT_COLUMNS)
          .eq('product_id', cleanSlug)
          .maybeSingle();

        if (!idErr && byId) {
          return mapRowToProduct(byId);
        }

        // Check by handle formatted as title words
        const titleGuess = cleanSlug.replace(/-/g, ' ');
        const { data: byTitle } = await supabase
          .from('products')
          .select(CARD_SELECT_COLUMNS)
          .ilike('title', `%${titleGuess}%`)
          .limit(1);

        if (byTitle && byTitle.length > 0) {
          return mapRowToProduct(byTitle[0]);
        }
      } catch (err) {
        console.warn('❌ Supabase getProductBySlug error, using fallback:', err);
      }
    }

    // Static fallback (exact slug or ID match only)
    const staticMatch =
      productsData.find((p) => p.slug === cleanSlug || p.id === cleanSlug) || null;
    if (staticMatch) {
      productSlugCache.set(lowerSlug, staticMatch);
    }
    return staticMatch;
  },

  /**
   * Retrieves products by a list of IDs (supports live Supabase products and in-memory cache)
   */
  async getProductsByIds(ids: string[]): Promise<Product[]> {
    if (!ids || ids.length === 0) return [];

    const uniqueIds = Array.from(new Set(ids));
    const result: Product[] = [];
    const missingIds: string[] = [];

    // 1. Check in-memory product cache and static list first
    for (const id of uniqueIds) {
      const cached = productSlugCache.get(id.toLowerCase());
      if (cached) {
        result.push(cached);
      } else {
        const foundStatic = productsData.find((p) => p.id === id);
        if (foundStatic) {
          result.push(foundStatic);
        } else {
          missingIds.push(id);
        }
      }
    }

    // 2. Fetch missing from Supabase
    if (missingIds.length > 0 && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(CARD_SELECT_COLUMNS)
          .in('product_id', missingIds);

        if (!error && data) {
          for (const row of data) {
            const mapped = mapRowToProduct(row);
            productSlugCache.set(mapped.id.toLowerCase(), mapped);
            productSlugCache.set(mapped.slug.toLowerCase(), mapped);
            result.push(mapped);
          }
        }
      } catch (err) {
        console.warn('❌ Error fetching products by IDs from Supabase:', err);
      }
    }

    return deduplicateProducts(result);
  },

  /**
   * Retrieves featured bestseller products directly from live Supabase products
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const cacheKey = `featured_best_sellers_${limit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result.products;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(CARD_SELECT_COLUMNS)
          .or('tags.ilike.%featured%,title.ilike.%diamond%,title.ilike.%cash%')
          .order('product_id', { ascending: true })
          .limit(limit);

        if (!error && data && data.length > 0) {
          const products = deduplicateProducts(data.map(mapRowToProduct));
          queryCache.set(cacheKey, {
            result: { products, total: products.length, page: 1, totalPages: 1 },
            timestamp: Date.now(),
          });
          return products;
        }
      } catch (err) {
        console.warn('❌ Supabase getFeaturedProducts error, falling back to static dataset:', err);
      }
    }

    const fallback = deduplicateProducts(productsData.filter((p) => p.isBestSeller)).slice(0, limit);
    return fallback;
  },

  /**
   * Retrieves live products for the 3 homepage featured collections:
   * 1. 'cash-candles'
   * 2. 'trending'
   * 3. 'zodiac'
   */
  async getHomepageCollectionProducts(
    collection: 'cash-candles' | 'trending' | 'zodiac',
    limit = 8
  ): Promise<Product[]> {
    const cacheKey = `hp_collection_${collection}_${limit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result.products;
    }

    if (isSupabaseConfigured()) {
      try {
        let query = (supabase as any).from('products').select(CARD_SELECT_COLUMNS);

        if (collection === 'cash-candles') {
          query = query
            .ilike('title', '%cash%')
            .order('product_id', { ascending: true });
        } else if (collection === 'trending') {
          query = query
            .or('tags.ilike.%trending%,title.ilike.%jewelry%')
            .order('product_id', { ascending: true });
        } else if (collection === 'zodiac') {
          query = query
            .ilike('title', '%zodiac%')
            .order('title', { ascending: true })
            .order('product_id', { ascending: true });
        }

        const { data, error } = await query.limit(limit);

        if (!error && data && data.length > 0) {
          const products = deduplicateProducts(data.map(mapRowToProduct));
          queryCache.set(cacheKey, {
            result: { products, total: products.length, page: 1, totalPages: 1 },
            timestamp: Date.now(),
          });
          return products;
        }
      } catch (err) {
        console.warn(`❌ Error fetching homepage collection ${collection}:`, err);
      }
    }

    // In-memory fallback
    let fallbackList: Product[] = [];
    if (collection === 'cash-candles') {
      fallbackList = productsData.filter(
        (p) => p.category === 'Cash Candles' || p.surpriseType === 'cash'
      );
    } else if (collection === 'trending') {
      fallbackList = productsData.filter((p) => p.isBestSeller);
    } else if (collection === 'zodiac') {
      fallbackList = productsData.filter((p) => p.name.toLowerCase().includes('zodiac'));
    }

    return deduplicateProducts(fallbackList).slice(0, limit);
  },

  /**
   * Loads 60 diverse, distinct products for the home screen.
   * Round-robin interleaves across all major surprise categories
   * and deduplicates repetitive product series concepts so no two items look identical.
   */
  async getDiverseFeaturedProducts(limit = 60): Promise<Product[]> {
    const cacheKey = `home_diverse_products_${limit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result.products;
    }

    if (isSupabaseConfigured()) {
      try {
        const [zodiacRes, diamondRes, cashRes, jewelryRes, bathRes, apparelRes] = await Promise.all([
          (supabase as any).from('products').select(CARD_SELECT_COLUMNS).ilike('title', '%Zodiac%').limit(15),
          (supabase as any).from('products').select(CARD_SELECT_COLUMNS).ilike('title', '%Diamond Carat%').limit(15),
          (supabase as any).from('products').select(CARD_SELECT_COLUMNS).ilike('title', '%Cash%').limit(15),
          (supabase as any).from('products').select(CARD_SELECT_COLUMNS).ilike('title', '%Jewelry%').limit(15),
          (supabase as any).from('products').select(CARD_SELECT_COLUMNS).ilike('title', '%Bath%').limit(15),
          (supabase as any).from('products').select(CARD_SELECT_COLUMNS).ilike('title', '%Shirt%').limit(15),
        ]);

        const diamondItems = (diamondRes.data || []).map(mapRowToProduct);
        const zodiacItems = (zodiacRes.data || []).map(mapRowToProduct);
        const cashItems = (cashRes.data || []).map(mapRowToProduct);
        const jewelryItems = (jewelryRes.data || []).map(mapRowToProduct);
        const bathItems = (bathRes.data || []).map(mapRowToProduct);
        const apparelItems = (apparelRes.data || []).map(mapRowToProduct);

        const pools = [
          diamondItems,
          zodiacItems,
          cashItems,
          jewelryItems,
          bathItems,
          apparelItems,
        ];

        const getRootConcept = (name: string) => {
          return name
            .toLowerCase()
            .replace(/(\d+)\s*(year|years|oz|pack|piece|pc|clean|sober)/gi, '')
            .replace(
              /(candles|candle|wax melts|wax melt|bath bombs|bath bomb|greeting cards|greeting card|goat milk soaps|goat milk soap|slimes|slime|diamond carat candle)/gi,
              ''
            )
            .replace(/[^a-z0-9]/gi, ' ')
            .trim()
            .slice(0, 14);
        };

        const selected: Product[] = [];
        const seenConcepts = new Set<string>();
        const seenIds = new Set<string>();

        const rounds = 20;
        for (let r = 0; r < rounds; r++) {
          for (const pool of pools) {
            if (selected.length >= limit) break;
            const item = pool.find((p: Product) => {
              if (seenIds.has(p.id)) return false;
              const concept = getRootConcept(p.name);
              if (concept.length > 3 && seenConcepts.has(concept)) return false;
              return true;
            });
            if (item) {
              seenIds.add(item.id);
              const concept = getRootConcept(item.name);
              if (concept.length > 3) seenConcepts.add(concept);
              selected.push(item);
            }
          }
          if (selected.length >= limit) break;
        }

        if (selected.length >= 20) {
          const result: PaginatedProductsResult = {
            products: selected,
            total: 57479,
            page: 1,
            totalPages: Math.ceil(57479 / limit),
          };
          queryCache.set(cacheKey, { result, timestamp: Date.now() });
          return selected;
        }
      } catch (err) {
        console.warn('❌ Error fetching diverse home products:', err);
      }
    }

    // Fallback: standard product fetch
    const fallback = await this.getProducts({ limit });
    return fallback.products;
  },

  /**
   * Retrieves collection metadata by handle or ID from Supabase.
   * Handles alias normalization (e.g., cash-candle -> cash-candles).
   */
  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    if (!handle) return null;
    const clean = handle.trim().toLowerCase();

    // Map common navigation aliases to authoritative database handles
    const ALIAS_MAP: Record<string, string> = {
      'cash-candle': 'cash-candles',
      'cash-candles': 'cash-candles',
      'cash-money-candle': 'cash-money-candles',
      'cash-money-candles': 'cash-money-candles',
      'money-candles': 'money-candles',
      'zodiac-cash-candles': 'zodiac-cash-money-candles',
      'zodiac-cash-money-candles': 'zodiac-cash-money-candles',
      'zodiac': 'zodiac-cash-money-candles',
      'funny-cash-candles': 'funny-candle',
      'funny-candle': 'funny-candle',
      'military-cash-candles': 'military-cash-candles',
      'soda-pop-cash-candles': 'soda-pop-candles-soda-candles-soda-cash-candles-soda-money-candles',
      'cereal-bowl-candles': 'cereal-bowl-candles',
      'cereal-cash-candles': 'cereal-candles-cereal-cash-candles',
      'coffee-mug-cash-candles': 'cash-coffee-candles-coffee-mug-candles',
      'foodie-cash-candles': 'foodie-jewelry-candles-jewelry-candles-for-foodies',
      'wine-bottle-cash-candles': 'wine-bottle-cash-candles',
      'anime-cash-candles': 'cash-anime-candles',
      'astrology-birthdate-cash-candles': 'astrology-birthdate-cash-candles',
      'cash-wax-melts': 'cash-wax-melts',
      'jewelry-wax-melts': 'jewelry-wax-melts',
      'cereal-bowl-wax-melts': 'cereal-bowl-cash-wax-melts-cereal-bowl-melts',
      'wax-melt-bundles': 'cash-wax-melt-surprise-bundles',
      'cash-bath-bombs': 'money-bath-bombs',
      'jewelry-bath-bombs': 'ring-bath-bombs',
      'cash-sugar-scrubs': 'sugar-scrubs',
      'cash-bath-soaks': 'money-bath-salts',
      'cash-candy': 'candy',
      'cash-candy-tubes': 'cash-candy-tubes',
      'candy': 'candy',
      'goat-milk-soaps': 'goat-milk-soaps',
      'money-soaps': 'money-soaps',
      'cash-cereal-slimes': 'cash-cereal-slimes',
      'jewelry-cash-slimes': 'jewelry-cash-slimes',
      'candles': 'candles',
      'wax-melts': 'wax-melts',
      'jewelry': 'jewelry',
      'bath-bombs': 'money-bath-bombs',
    };

    const targetHandle = ALIAS_MAP[clean] || clean;

    if (isSupabaseConfigured()) {
      try {
        // 1. Exact handle match
        const { data: exactCol } = await (supabase as any)
          .from('collections')
          .select('*')
          .eq('handle', targetHandle)
          .maybeSingle();

        if (exactCol) return mapRowToCollection(exactCol);

        // 2. Case-insensitive handle match
        const { data: ilikeCol } = await (supabase as any)
          .from('collections')
          .select('*')
          .ilike('handle', targetHandle)
          .maybeSingle();

        if (ilikeCol) return mapRowToCollection(ilikeCol);

        // 3. Match by collection_id
        const { data: idCol } = await (supabase as any)
          .from('collections')
          .select('*')
          .eq('collection_id', clean)
          .maybeSingle();

        if (idCol) return mapRowToCollection(idCol);

        // 4. Try original handle if targetHandle was an alias that failed
        if (targetHandle !== clean) {
          const { data: origCol } = await (supabase as any)
            .from('collections')
            .select('*')
            .eq('handle', clean)
            .maybeSingle();

          if (origCol) return mapRowToCollection(origCol);
        }
      } catch (err) {
        console.warn('Error fetching collection by handle:', err);
      }
    }

    return null;
  },

  /**
   * Retrieves products belonging strictly to an authoritative collection from Supabase.
   * Utilizes product_collections join to ensure ONLY authentic collection products are returned.
   */
  async getProductsByCollection(
    handleOrId: string,
    params: {
      page?: number;
      limit?: number;
      sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'best-sellers';
    } = {}
  ): Promise<{
    collection: Collection | null;
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = params.limit || 24;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const col = await this.getCollectionByHandle(handleOrId);
    if (!col) {
      return {
        collection: null,
        products: [],
        total: 0,
        page,
        totalPages: 1,
      };
    }

    const cacheKey = `col_prods_${col.id}_${page}_${limit}_${params.sort || 'featured'}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result as any;
    }

    if (isSupabaseConfigured()) {
      try {
        let query = (supabase as any)
          .from('product_collections')
          .select(`product_id, products(${CARD_SELECT_COLUMNS})`, { count: 'exact' })
          .eq('collection_id', col.id);

        if (params.sort === 'newest') {
          query = query.order('product_id', { ascending: false });
        } else {
          query = query.order('product_id', { ascending: true });
        }

        const { data, count, error } = await query.range(from, to);

        if (!error && data) {
          let prods = data
            .map((r: any) => r.products)
            .filter(Boolean)
            .map(mapRowToProduct);

          // Apply client-side sorting for price if requested
          if (params.sort === 'price-asc') {
            prods.sort((a: Product, b: Product) => a.price - b.price);
          } else if (params.sort === 'price-desc') {
            prods.sort((a: Product, b: Product) => b.price - a.price);
          }

          const total = count !== null && count !== undefined ? count : col.productsCount;
          const result = {
            collection: col,
            products: deduplicateProducts(prods),
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          };

          queryCache.set(cacheKey, { result: result as any, timestamp: Date.now() });
          return result;
        }
      } catch (err) {
        console.warn(`Error fetching products for collection ${col.handle}:`, err);
      }
    }

    return {
      collection: col,
      products: [],
      total: 0,
      page,
      totalPages: 1,
    };
  },

  /**
   * Clears the in-memory query cache when items are modified in admin.
   */
  clearCache() {
    queryCache.clear();
  },
};
