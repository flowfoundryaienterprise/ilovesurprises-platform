import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Category } from '../types';
import { categoriesData } from '../data/categories';
import type { Database } from '../types/supabase';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline || '',
    description: row.description || '',
    itemCount: row.item_count || 0,
    image: row.image || '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
    featured: Boolean(row.featured),
    accentColor: row.accent_color || undefined,
  };
}

export const categoryService = {
  /**
   * Retrieves all categories from Supabase, or local categoriesData fallback
   */
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('featured', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(mapRowToCategory);
        }
      } catch (err) {
        console.warn('Supabase getCategories error, using fallback:', err);
      }
    }

    return categoriesData;
  },

  /**
   * Retrieves a single category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) {
          return mapRowToCategory(data);
        }
      } catch (err) {
        console.warn('Supabase getCategoryBySlug error, using fallback:', err);
      }
    }

    return categoriesData.find((c) => c.slug === slug || c.id === slug) || null;
  },
};
