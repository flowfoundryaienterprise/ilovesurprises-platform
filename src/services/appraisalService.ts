import type {
  JewelryAppraisal,
  PublicAppraisalResult,
  AppraisalLookupResponse,
} from '../types/appraisal';

const STORAGE_KEY = 'ils_jewelry_appraisals_v2';
export const APPRAISALS_UPDATED_EVENT = 'ils_appraisals_updated';

const DEFAULT_APPRAISALS: JewelryAppraisal[] = [
  {
    id: 'appr-01',
    code: 'ILS-DIAMOND-7500',
    name: '14K Solid White Gold 2.0ct Lab Diamond Solitaire Ring',
    type: 'Ring',
    estimatedValue: 7500.0,
    image: '/assets/ilovesurprises/appraisals/diamond-solitaire-ring.jpg',
    material: 'Solid 14K White Gold (Stamped 14K)',
    stone: '2.0ct Brilliant Round Lab Diamond (VVS1 Clarity, E Color)',
    cutSetting: 'Six-Prong Crown Solitaire with Hand-Engraved Gallery',
    description:
      'A breathtaking pinnacle reveal. Hand-poured into our ultra-rare mystery candles, this solid 14K white gold heirloom features a certified 2.00-carat brilliant round lab-grown diamond with superlative scintillation, fire, and precision symmetry.',
    status: 'active',
    serialNumber: 'ILS-VAL-994821',
    inspectedDate: 'February 2026',
    createdAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'appr-02',
    code: 'ILS-GOLD-5000',
    name: '14K Yellow Gold Diamond Pavé Bezel Tennis Bracelet',
    type: 'Bracelet',
    estimatedValue: 5000.0,
    image: '/assets/ilovesurprises/appraisals/gold-tennis-bracelet.jpg',
    material: 'Solid 14K Yellow Gold',
    stone: '5.5 ctw Brilliant Round Cut Diamonds (VS2 Clarity, F-G Color)',
    cutSetting: 'Individual Bezel Collet Links with Double Safety Clasp',
    description:
      'Timeless red-carpet luxury. A continuous strand of hand-matched brilliant diamonds individually secured in mirror-polished 14k yellow gold bezel collets with heavy-duty dual latch safety clasp.',
    status: 'active',
    serialNumber: 'ILS-VAL-881903',
    inspectedDate: 'February 2026',
    createdAt: '2026-02-14T11:30:00Z',
  },
  {
    id: 'appr-03',
    code: 'ILS-SAPPHIRE-2500',
    name: '14K White Gold Ceylon Sapphire & Diamond Halo Pendant',
    type: 'Pendant',
    estimatedValue: 2500.0,
    image: '/assets/ilovesurprises/appraisals/sapphire-halo-pendant.jpg',
    material: 'Solid 14K White Gold',
    stone: '1.85ct Royal Blue Ceylon Sapphire & 0.45 ctw Diamond Halo',
    cutSetting: 'Cushion Cut Four-Prong Halo on 18" 14K Cable Chain',
    description:
      'An iconic royal statement. An intense velvet-blue cushion-cut sapphire framed by a shimmering halo of natural white diamonds, suspended from a delicate 14K white gold cable chain.',
    status: 'active',
    serialNumber: 'ILS-VAL-773412',
    inspectedDate: 'January 2026',
    createdAt: '2026-01-20T09:15:00Z',
  },
  {
    id: 'appr-04',
    code: 'ILS-EMERALD-1200',
    name: '14K Yellow Gold Emerald Cut Colombian Emerald Drop Necklace',
    type: 'Necklace',
    estimatedValue: 1200.0,
    image: '/assets/ilovesurprises/appraisals/sapphire-halo-pendant.jpg',
    material: 'Solid 14K Yellow Gold',
    stone: '1.20ct Vivid Green Emerald Cut Gemstone & Diamond Accents',
    cutSetting: 'Corner Prong Step-Cut Setting on 18" Rope Chain',
    description:
      'Lush verdant brilliance. High-purity emerald cut focal gemstone crowned with fine diamond accents, set in warm 14k yellow gold with artisan milgrain details.',
    status: 'active',
    serialNumber: 'ILS-VAL-441289',
    inspectedDate: 'February 2026',
    createdAt: '2026-02-22T14:45:00Z',
  },
  {
    id: 'appr-05',
    code: 'ILS-GOLD-550',
    name: '14K Solid Yellow Gold CZ Brilliant Stud Earrings',
    type: 'Earrings',
    estimatedValue: 550.0,
    image: '/assets/ilovesurprises/appraisals/gold-cz-stud-earrings.jpg',
    material: 'Solid 14K Yellow Gold (Stamped 14K)',
    stone: '2.0 ctw (1.0ct each) Hearts & Arrows Cut AAA Cubic Zirconia',
    cutSetting: 'Heavy Basket 4-Prong Setting with Secure Friction Backs',
    description:
      'Effortless luxury for daily wear. Solid 14k yellow gold basket settings holding ultra-clean hearts and arrows cut stones with light dispersion matching genuine fine diamonds.',
    status: 'active',
    serialNumber: 'ILS-VAL-552194',
    inspectedDate: 'March 2026',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'appr-06',
    code: 'ILS-SILVER-250',
    name: 'Solid .925 Sterling Silver Teardrop Pear Halo Ring',
    type: 'Ring',
    estimatedValue: 250.0,
    image: '/assets/ilovesurprises/appraisals/sterling-silver-halo-ring.jpg',
    material: 'Solid .925 Sterling Silver (Stamped 925, Rhodium Plated)',
    stone: '1.5ct Teardrop Pear Cut Center with Micro-Pavé Halo',
    cutSetting: 'V-Tip Prong Setting with Pavé Shank',
    description:
      'Romantic silhouette crafted in genuine solid .925 sterling silver and finished with a durable rhodium electroplate for mirror-finish platinum luster and anti-tarnish protection.',
    status: 'active',
    serialNumber: 'ILS-VAL-339108',
    inspectedDate: 'March 2026',
    createdAt: '2026-03-02T16:20:00Z',
  },
  {
    id: 'appr-07',
    code: 'ILS-AMETHYST-100',
    name: 'Solid .925 Sterling Silver Royal Amethyst Cluster Ring',
    type: 'Ring',
    estimatedValue: 100.0,
    image: '/assets/ilovesurprises/appraisals/sterling-silver-halo-ring.jpg',
    material: 'Solid .925 Sterling Silver',
    stone: '0.90ct Natural Brazilian Amethyst & White Zircon Halo',
    cutSetting: 'Classic Four-Prong Oval Solitaire',
    description:
      'Vivid royal purple tones set against polished solid sterling silver. Each piece is individually stamped .925 and features natural gemstone facets that glow in candlelight.',
    status: 'active',
    serialNumber: 'ILS-VAL-228301',
    inspectedDate: 'January 2026',
    createdAt: '2026-01-25T12:00:00Z',
  },
  {
    id: 'appr-08',
    code: 'ILS-PEARL-75',
    name: 'Solid .925 Sterling Silver Cultured Freshwater Pearl Pendant',
    type: 'Pendant',
    estimatedValue: 75.0,
    image: '/assets/ilovesurprises/appraisals/sapphire-halo-pendant.jpg',
    material: 'Solid .925 Sterling Silver',
    stone: '8mm Genuine Cultured Freshwater Pearl (AAA Luster)',
    cutSetting: 'Peg & Cap Bail on 18" Sterling Silver Chain',
    description:
      'Soft luminous glow with natural orient luster. Cultured organic freshwater pearl suspended from a high-polish solid .925 sterling silver bail and chain.',
    status: 'active',
    serialNumber: 'ILS-VAL-118492',
    inspectedDate: 'February 2026',
    createdAt: '2026-02-18T10:10:00Z',
  },
  {
    id: 'appr-09',
    code: 'ILS-ROSE-50',
    name: '18K Rose Gold Plated Sterling Silver Sparkle Eternity Band',
    type: 'Ring',
    estimatedValue: 50.0,
    image: '/assets/ilovesurprises/appraisals/diamond-solitaire-ring.jpg',
    material: '18K Rose Gold over .925 Sterling Silver',
    stone: 'AAA Brilliant Micro-Pavé Cubic Zirconia',
    cutSetting: 'Shared-Prong Full Eternity Band',
    description:
      'Warm blush tones and continuous glimmer. Designed to stack effortlessly with wedding bands or wear alone for delicate sparkle.',
    status: 'active',
    serialNumber: 'ILS-VAL-095123',
    inspectedDate: 'February 2026',
    createdAt: '2026-02-28T09:40:00Z',
  },
  {
    id: 'appr-10',
    code: 'ILS-TOPAZ-35',
    name: 'Solid .925 Sterling Silver Sky Blue Topaz Petite Studs',
    type: 'Earrings',
    estimatedValue: 35.0,
    image: '/assets/ilovesurprises/appraisals/gold-cz-stud-earrings.jpg',
    material: 'Solid .925 Sterling Silver',
    stone: '0.50 ctw Natural Sky Blue Topaz',
    cutSetting: 'Petite 4-Prong Basket Studs',
    description:
      'Crisp celestial blue stones crafted in hypoallergenic solid sterling silver with butterfly push backs.',
    status: 'active',
    serialNumber: 'ILS-VAL-042819',
    inspectedDate: 'March 2026',
    createdAt: '2026-03-03T11:00:00Z',
  },
];

class AppraisalService {
  private appraisals: JewelryAppraisal[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') {
      this.appraisals = [...DEFAULT_APPRAISALS];
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.appraisals = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored appraisals from localStorage', e);
    }

    this.appraisals = [...DEFAULT_APPRAISALS];
    this.saveToStorage();
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.appraisals));
      window.dispatchEvent(new CustomEvent(APPRAISALS_UPDATED_EVENT));
    } catch (e) {
      console.error('Failed to persist appraisals to localStorage', e);
    }
  }

  /**
   * Normalizes a customer-entered code (trims whitespace, converts to uppercase)
   */
  public normalizeCode(code: string): string {
    return (code || '').trim().toUpperCase();
  }

  /**
   * Customer-facing jewelry appraisal lookup.
   * Centralized service: Backend API call will replace this internal mock later.
   * Simulates network/verification delay for suspense.
   */
  public async lookupJewelryCode(rawCode: string): Promise<AppraisalLookupResponse> {
    const cleanCode = this.normalizeCode(rawCode);

    if (!cleanCode) {
      return {
        success: false,
        error: 'Please enter your jewelry code to check its appraised value.',
      };
    }

    // Realistic suspense delay for authentic appraisal feel
    await new Promise((resolve) => setTimeout(resolve, 650));

    // Case-insensitive exact lookup against active appraisals
    const matched = this.appraisals.find(
      (a) => this.normalizeCode(a.code) === cleanCode && a.status === 'active'
    );

    if (!matched) {
      return {
        success: false,
        error: "We couldn't find that jewelry code. Please check the code and try again.",
      };
    }

    // Public sanitized representation (does not leak supplier, cost, or internal notes)
    const publicResult: PublicAppraisalResult = {
      code: matched.code,
      name: matched.name,
      type: matched.type,
      estimatedValue: matched.estimatedValue,
      image: matched.image,
      material: matched.material,
      stone: matched.stone,
      cutSetting: matched.cutSetting,
      description: matched.description,
      serialNumber: matched.serialNumber,
      inspectedDate: matched.inspectedDate,
    };

    return {
      success: true,
      data: publicResult,
    };
  }

  /**
   * Admin: Get all appraisals
   */
  public getAllAppraisals(): JewelryAppraisal[] {
    return [...this.appraisals];
  }

  /**
   * Admin: Add new appraisal code
   */
  public addAppraisal(
    item: Omit<JewelryAppraisal, 'id' | 'createdAt'>
  ): JewelryAppraisal {
    const newItem: JewelryAppraisal = {
      ...item,
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: this.normalizeCode(item.code),
      createdAt: new Date().toISOString(),
    };

    this.appraisals = [newItem, ...this.appraisals];
    this.saveToStorage();
    return newItem;
  }

  /**
   * Admin: Update appraisal item
   */
  public updateAppraisal(id: string, updates: Partial<JewelryAppraisal>): boolean {
    const index = this.appraisals.findIndex((a) => a.id === id);
    if (index === -1) return false;

    if (updates.code) {
      updates.code = this.normalizeCode(updates.code);
    }

    this.appraisals[index] = {
      ...this.appraisals[index],
      ...updates,
    };
    this.saveToStorage();
    return true;
  }

  /**
   * Admin: Delete appraisal item
   */
  public deleteAppraisal(id: string): boolean {
    const before = this.appraisals.length;
    this.appraisals = this.appraisals.filter((a) => a.id !== id);
    if (this.appraisals.length !== before) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Admin: Reset to default factory items
   */
  public resetToDefaults(): void {
    this.appraisals = [...DEFAULT_APPRAISALS];
    this.saveToStorage();
  }
}

export const appraisalService = new AppraisalService();
