/**
 * Representative & Consultant Attribution Service
 * Manages active consultant attribution across products, collections, cart, and checkout.
 * Strict Privacy: Never stores or exposes representative phone numbers publicly.
 */

export interface PublicRepresentative {
  id: string;
  name: string;
  repUsername: string;
  avatar: string;
  tagline: string;
  rank: string;
  joinedYear: string;
  storeUrl: string;
  favoriteProduct: string;
}

const ATTRIBUTION_STORAGE_KEY = 'ilovesurprises_attributed_rep_v1';
const ATTRIBUTION_TIMESTAMP_KEY = 'ilovesurprises_rep_timestamp_v1';
const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 60;

export const DEFAULT_REPRESENTATIVES: PublicRepresentative[] = [
  {
    id: 'rep-01',
    name: 'Emily Watson',
    repUsername: 'emily_sparkles',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    tagline: 'Bringing joy, aromatic scents & real cash reveals to your home ✨',
    rank: 'Diamond Ambassador',
    joinedYear: '2025',
    storeUrl: 'https://ilovesurprises.com/emily_sparkles',
    favoriteProduct: 'Tahitian Vanilla & Gold Cash Candle',
  },
  {
    id: 'rep-02',
    name: 'Jessica Miller',
    repUsername: 'jess_candles',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    tagline: 'Passionate about clean soy candles & genuine jewelry surprises 💍',
    rank: 'Gold Leader',
    joinedYear: '2025',
    storeUrl: 'https://ilovesurprises.com/jess_candles',
    favoriteProduct: 'Midnight Amber Diamond Ring Candle',
  },
  {
    id: 'rep-03',
    name: 'Marcus Sterling',
    repUsername: 'marcus_vip',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    tagline: 'Curating unforgettable unboxing moments & VIP gift experiences 🎁',
    rank: 'Gold Leader',
    joinedYear: '2025',
    storeUrl: 'https://ilovesurprises.com/marcus_vip',
    favoriteProduct: 'Lavender Dream Real Cash Bath Bomb',
  },
];

export const representativeService = {
  /**
   * Retrieves currently attributed representative from localStorage (if still within attribution window)
   */
  getAttributedRepresentative(): PublicRepresentative | null {
    if (typeof window === 'undefined') return DEFAULT_REPRESENTATIVES[0];

    try {
      // Check attribution window expiry
      const timestampStr = localStorage.getItem(ATTRIBUTION_TIMESTAMP_KEY);
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const now = Date.now();
        const maxAge = DEFAULT_ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        if (now - timestamp > maxAge) {
          // Expired
          this.clearAttributedRepresentative();
          return null;
        }
      }

      const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    // Default friendly representative for active customer shopping experience
    return DEFAULT_REPRESENTATIVES[0];
  },

  /**
   * Sets or updates the active representative attribution
   */
  setAttributedRepresentative(repOrUsername: PublicRepresentative | string): PublicRepresentative | null {
    let targetRep: PublicRepresentative | null = null;

    if (typeof repOrUsername === 'string') {
      targetRep = this.lookupRepresentative(repOrUsername) || {
        id: `rep-custom-${Date.now()}`,
        name: repOrUsername.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        repUsername: repOrUsername.toLowerCase().trim(),
        avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
        tagline: 'Your Independent Surprise Consultant ✨',
        rank: 'VIP Partner',
        joinedYear: '2026',
        storeUrl: `https://ilovesurprises.com/${repOrUsername.toLowerCase().trim()}`,
        favoriteProduct: 'Tahitian Vanilla & Gold Cash Candle',
      };
    } else {
      targetRep = repOrUsername;
    }

    if (typeof window !== 'undefined' && targetRep) {
      try {
        localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(targetRep));
        localStorage.setItem(ATTRIBUTION_TIMESTAMP_KEY, Date.now().toString());
        window.dispatchEvent(new CustomEvent('ils_representative_attributed', { detail: targetRep }));
      } catch (err) {
        console.error('Failed to store representative attribution', err);
      }
    }

    return targetRep;
  },

  /**
   * Clears representative attribution
   */
  clearAttributedRepresentative(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      localStorage.removeItem(ATTRIBUTION_TIMESTAMP_KEY);
      window.dispatchEvent(new CustomEvent('ils_representative_attributed', { detail: null }));
    }
  },

  /**
   * Look up representative by username
   */
  lookupRepresentative(username: string): PublicRepresentative | null {
    if (!username) return null;
    const clean = username.toLowerCase().trim().replace(/^@/, '');
    return DEFAULT_REPRESENTATIVES.find((r) => r.repUsername.toLowerCase() === clean) || null;
  },

  /**
   * Returns list of default verified consultants
   */
  getAllActiveRepresentatives(): PublicRepresentative[] {
    return DEFAULT_REPRESENTATIVES;
  },
};
