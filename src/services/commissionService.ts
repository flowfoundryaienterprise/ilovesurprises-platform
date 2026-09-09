import { supabase } from './supabaseClient';
import { representativeService } from './representativeService';
import { attributionService } from './attributionService';
import { sponsorService } from './sponsorService';
import type { CommissionRecord, CommissionTierLevel, ReferralMember } from '../types';

export interface ProcessOrderCommissionsParams {
  orderId: string;
  orderAmount: number; // Subtotal (eligible product sales amount)
  customerName: string;
  customerEmail?: string;
  userId?: string;
  productName?: string;
  sessionRepUsername?: string;
}

export interface UplineNode {
  level: CommissionTierLevel;
  tierIndex: number; // 0 for personal, 1-5 for overrides
  repUsername: string;
  name: string;
  repId: string;
  ratePercent: number; // 20, 5, 4, 3, 2, 1
}

// 5-Level Commission Hierarchy Rates
export const COMMISSION_RATES = {
  PERSONAL: 20.0, // 20%
  LEVEL_1: 5.0,   // 5%
  LEVEL_2: 4.0,   // 4%
  LEVEL_3: 3.0,   // 3%
  LEVEL_4: 2.0,   // 2%
  LEVEL_5: 1.0,   // 1%
};

const COMMISSIONS_STORAGE_KEY = 'ilovesurprises_commissions_v1';
const GENEALOGY_TREE_KEY = 'ilovesurprises_genealogy_tree_v1';

export const commissionService = {
  /**
   * Resolves the 5-level sponsor upline for a representative
   */
  resolveUpline(directRepUsername: string): UplineNode[] {
    const cleanDirect = directRepUsername.toLowerCase().trim().replace(/^@/, '');
    const nodes: UplineNode[] = [];

    // 1. Level 0: Direct Representative (Personal 20%)
    const directRep = representativeService.lookupRepresentative(cleanDirect) || {
      id: `rep-${cleanDirect}`,
      name: cleanDirect.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      repUsername: cleanDirect,
      avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
      tagline: '',
      rank: 'VIP Partner',
      joinedYear: '2026',
      storeUrl: '',
      favoriteProduct: '',
    };

    if (!representativeService.isRepresentativeSuspended(cleanDirect)) {
      nodes.push({
        level: 'personal',
        tierIndex: 0,
        repUsername: directRep.repUsername,
        name: directRep.name,
        repId: directRep.id,
        ratePercent: COMMISSION_RATES.PERSONAL,
      });
    }

    // 2. Resolve 5-Level Upline Sponsors from Genealogy Map
    const uplineSponsors = this.findSponsorsInGenealogy(cleanDirect);
    const tierRates = [
      COMMISSION_RATES.LEVEL_1,
      COMMISSION_RATES.LEVEL_2,
      COMMISSION_RATES.LEVEL_3,
      COMMISSION_RATES.LEVEL_4,
      COMMISSION_RATES.LEVEL_5,
    ];

    uplineSponsors.slice(0, 5).forEach((sponsor, idx) => {
      if (!representativeService.isRepresentativeSuspended(sponsor.repUsername)) {
        nodes.push({
          level: (idx + 1) as CommissionTierLevel,
          tierIndex: idx + 1,
          repUsername: sponsor.repUsername,
          name: sponsor.name,
          repId: sponsor.id,
          ratePercent: tierRates[idx],
        });
      }
    });

    return nodes;
  },

  /**
   * Traverses genealogy to locate up to 5 parent sponsors
   */
  findSponsorsInGenealogy(targetRepUsername: string): { id: string; name: string; repUsername: string }[] {
    const cleanTarget = targetRepUsername.toLowerCase().trim().replace(/^@/, '');

    // 1. Check sponsorService registry for registered 5-level upline
    const registeredSponsor = sponsorService.getStoredRegistry()[cleanTarget];
    if (registeredSponsor && registeredSponsor.upline && registeredSponsor.upline.length > 0) {
      return registeredSponsor.upline.slice(0, 5).map((sponsorUser) => {
        const repInfo = representativeService.lookupRepresentative(sponsorUser) || {
          id: `rep-${sponsorUser}`,
          name: sponsorUser.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          repUsername: sponsorUser,
        };
        return {
          id: repInfo.id,
          name: repInfo.name,
          repUsername: repInfo.repUsername,
        };
      });
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(GENEALOGY_TREE_KEY);
        if (stored) {
          const tree: ReferralMember[] = JSON.parse(stored);
          if (Array.isArray(tree) && tree.length > 0) {
            const path: ReferralMember[] = [];
            const findPath = (nodes: ReferralMember[], target: string): boolean => {
              for (const node of nodes) {
                if (node.repUsername.toLowerCase() === target.toLowerCase()) {
                  return true;
                }
                if (node.children && node.children.length > 0) {
                  path.push(node);
                  if (findPath(node.children, target)) {
                    return true;
                  }
                  path.pop();
                }
              }
              return false;
            };

            if (findPath(tree, targetRepUsername) && path.length > 0) {
              return path.slice(-5).reverse().map((m) => ({
                id: m.id,
                name: m.name,
                repUsername: m.repUsername,
              }));
            }
          }
        }
      } catch {
        // fallback
      }
    }

    // If no custom tree, use default top leaders hierarchy (6 leaders so 5 upline levels always resolve)
    const defaultSponsorChain = [
      { id: 'rep-01', name: 'Emily Watson', repUsername: 'emily_sparkles' },
      { id: 'rep-02', name: 'Jessica Miller', repUsername: 'jess_candles' },
      { id: 'rep-03', name: 'Marcus Sterling', repUsername: 'marcus_vip' },
      { id: 'rep-04', name: 'Rachel Adams', repUsername: 'rachel_cozy' },
      { id: 'rep-05', name: 'Grace Kelly', repUsername: 'grace_reveals' },
      { id: 'rep-06', name: 'Sophia Bennett', repUsername: 'sophia_luxe' },
    ];

    // Filter out the direct rep from their own upline
    return defaultSponsorChain.filter((s) => s.repUsername.toLowerCase() !== targetRepUsername.toLowerCase());
  },

  /**
   * IDEMPOTENT Commission Processor:
   * 1. Resolves permanent lifetime attribution for customer.
   * 2. Checks if commissions for this orderId already exist (prevents duplicates).
   * 3. Calculates exact 20% personal + 5-tier overrides (up to 35% total).
   * 4. Persists to Supabase `commissions` and local ledger.
   */
  async processOrderCommissions(params: ProcessOrderCommissionsParams): Promise<CommissionRecord[]> {
    const { orderId, orderAmount, customerName, customerEmail, userId, productName, sessionRepUsername } = params;

    if (!orderId || orderAmount <= 0) {
      return [];
    }

    // Step 1: Idempotency Check (Check if commissions already generated for this order)
    const existingLocal = this.getStoredCommissions().filter((c) => c.orderId.toLowerCase() === orderId.toLowerCase());
    if (existingLocal.length > 0) {
      return existingLocal;
    }

    // Check Supabase commissions table
    try {
      const { data: existingDb } = await supabase
        .from('commissions')
        .select('*')
        .eq('order_id', orderId);

      if (existingDb && existingDb.length > 0) {
        return existingDb.map((row) => ({
          id: row.id,
          orderId: row.order_id || orderId,
          orderDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          customerName,
          productName: productName || 'Surprise Product',
          level: row.tier_level === 'personal' ? 'personal' : (parseInt(row.tier_level.replace(/\D/g, ''), 10) as CommissionTierLevel) || 'personal',
          levelLabel: row.tier_level === 'personal' ? 'Personal Sale (20%)' : `Level ${row.tier_level} Override (${row.rate_percent}%)`,
          orderAmount: row.order_amount,
          commissionRate: row.rate_percent / 100,
          commissionAmount: row.commission_amount,
          status: (row.status as any) || 'pending',
        }));
      }
    } catch {
      // Offline fallback
    }

    // Step 2: Lifetime Attribution Resolution
    const { repUsername: attributedRep } = await attributionService.resolveAttributionForCheckout({
      customerEmail,
      userId,
      currentSessionRep: sessionRepUsername,
    });

    if (!attributedRep) {
      // Unattributed customer order -> zero commissions
      return [];
    }

    // If first attributed purchase, establish permanent lifetime attribution
    if (customerEmail) {
      await attributionService.setPermanentAttribution({
        customerEmail,
        repUsername: attributedRep,
        userId,
        orderId,
      });
    }

    // Step 3: Resolve 5-Level Upline Nodes
    const uplineNodes = this.resolveUpline(attributedRep);
    if (uplineNodes.length === 0) {
      return [];
    }

    // Step 4: Calculate Commissions with 100% precision
    const generatedCommissions: CommissionRecord[] = [];
    const dbInserts = [];

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    for (const node of uplineNodes) {
      const rateDecimal = node.ratePercent / 100;
      const amount = parseFloat((orderAmount * rateDecimal).toFixed(2));

      const commRecord: CommissionRecord = {
        id: `comm-${orderId}-${node.level}-${Date.now()}`,
        orderId,
        orderDate: todayDate,
        customerName: customerName || 'Valued Customer',
        productName: productName || 'Surprise Cash & Jewelry Candle Order',
        level: node.level,
        levelLabel:
          node.level === 'personal'
            ? `Personal Sale (${node.ratePercent}%)`
            : `Level ${node.level}: ${node.name} (${node.ratePercent}%)`,
        orderAmount,
        commissionRate: rateDecimal,
        commissionAmount: amount,
        status: 'pending',
      };

      generatedCommissions.push(commRecord);

      // Resolve representative profile UUID from Supabase profiles if exists
      let repProfileUuid: string | null = null;
      try {
        const { data: repProf } = await supabase
          .from('profiles')
          .select('id')
          .eq('rep_username', node.repUsername.toLowerCase().trim())
          .maybeSingle();
        if (repProf?.id) {
          repProfileUuid = repProf.id;
        }
      } catch {
        // fallback
      }

      dbInserts.push({
        rep_id: repProfileUuid,
        order_id: orderId,
        order_amount: orderAmount,
        tier_level: node.level === 'personal' ? 'personal' : `level_${node.level}`,
        rate_percent: node.ratePercent,
        commission_amount: amount,
        status: 'pending',
        created_at: nowIso,
      });
    }

    // Step 5: Persist to Supabase and Local Ledger
    try {
      if (dbInserts.length > 0) {
        await supabase.from('commissions').insert(dbInserts);
      }
    } catch (err) {
      console.warn('Failed to insert commissions to Supabase:', err);
    }

    this.saveCommissionsToStorage(generatedCommissions);

    return generatedCommissions;
  },

  /**
   * Helper to retrieve stored commissions from localStorage
   */
  getStoredCommissions(): CommissionRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(COMMISSIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Helper to append commissions to local storage
   */
  saveCommissionsToStorage(newRecords: CommissionRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getStoredCommissions();
      const combined = [...newRecords, ...existing];
      localStorage.setItem(COMMISSIONS_STORAGE_KEY, JSON.stringify(combined));
      window.dispatchEvent(new CustomEvent('ilovesurprises_commissions_updated'));
    } catch {
      // ignore
    }
  },
};
