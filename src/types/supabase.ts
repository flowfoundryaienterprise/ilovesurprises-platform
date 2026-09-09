export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          tagline: string | null;
          description: string | null;
          item_count: number;
          image: string | null;
          featured: boolean;
          accent_color: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          tagline?: string | null;
          description?: string | null;
          item_count?: number;
          image?: string | null;
          featured?: boolean;
          accent_color?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          tagline?: string | null;
          description?: string | null;
          item_count?: number;
          image?: string | null;
          featured?: boolean;
          accent_color?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category_id: string | null;
          price: number;
          original_price: number | null;
          surprise_type: string;
          surprise_value: string | null;
          rating: number;
          review_count: number;
          image: string;
          badge: string | null;
          is_new: boolean;
          is_best_seller: boolean;
          in_stock: boolean;
          scent_notes: Json | null;
          description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          category_id?: string | null;
          price: number;
          original_price?: number | null;
          surprise_type: string;
          surprise_value?: string | null;
          rating?: number;
          review_count?: number;
          image: string;
          badge?: string | null;
          is_new?: boolean;
          is_best_seller?: boolean;
          in_stock?: boolean;
          scent_notes?: Json | null;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          category_id?: string | null;
          price?: number;
          original_price?: number | null;
          surprise_type?: string;
          surprise_value?: string | null;
          rating?: number;
          review_count?: number;
          image?: string;
          badge?: string | null;
          is_new?: boolean;
          is_best_seller?: boolean;
          in_stock?: boolean;
          scent_notes?: Json | null;
          description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          mobile: string | null;
          role: 'customer' | 'representative' | 'admin';
          rep_username: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          mobile?: string | null;
          role?: 'customer' | 'representative' | 'admin';
          rep_username?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          mobile?: string | null;
          role?: 'customer' | 'representative' | 'admin';
          rep_username?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          subtotal: number;
          discount: number;
          shipping_fee: number;
          total: number;
          status: string;
          payment_method: string | null;
          payment_status: string | null;
          shipping_address: Json | null;
          delivery_method: Json | null;
          estimated_delivery_date: string | null;
          tracking_number: string | null;
          attributed_rep_id: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          subtotal: number;
          discount?: number;
          shipping_fee?: number;
          total: number;
          status?: string;
          payment_method?: string | null;
          payment_status?: string | null;
          shipping_address?: Json | null;
          delivery_method?: Json | null;
          estimated_delivery_date?: string | null;
          tracking_number?: string | null;
          attributed_rep_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          subtotal?: number;
          discount?: number;
          shipping_fee?: number;
          total?: number;
          status?: string;
          payment_method?: string | null;
          payment_status?: string | null;
          shipping_address?: Json | null;
          delivery_method?: Json | null;
          estimated_delivery_date?: string | null;
          tracking_number?: string | null;
          attributed_rep_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          selected_surprise_option: string | null;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity?: number;
          selected_surprise_option?: string | null;
          unit_price: number;
          total_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          quantity?: number;
          selected_surprise_option?: string | null;
          unit_price?: number;
          total_price?: number;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string | null;
          user_id: string | null;
          author_name: string;
          location: string | null;
          rating: number;
          title: string;
          comment: string;
          verified: boolean;
          revealed_surprise: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          user_id?: string | null;
          author_name: string;
          location?: string | null;
          rating: number;
          title: string;
          comment: string;
          verified?: boolean;
          revealed_surprise?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          user_id?: string | null;
          author_name?: string;
          location?: string | null;
          rating?: number;
          title?: string;
          comment?: string;
          verified?: boolean;
          revealed_surprise?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      commissions: {
        Row: {
          id: string;
          rep_id: string | null;
          order_id: string | null;
          order_amount: number;
          tier_level: string;
          rate_percent: number;
          commission_amount: number;
          status: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          rep_id?: string | null;
          order_id?: string | null;
          order_amount: number;
          tier_level: string;
          rate_percent: number;
          commission_amount: number;
          status?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          rep_id?: string | null;
          order_id?: string | null;
          order_amount?: number;
          tier_level?: string;
          rate_percent?: number;
          commission_amount?: number;
          status?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
