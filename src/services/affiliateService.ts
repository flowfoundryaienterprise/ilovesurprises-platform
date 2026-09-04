import type {
  AffiliateStats,
  CommissionRecord,
  PayoutRecord,
  PayoutMethod,
  ReferralMember,
} from '../types';

const AFFILIATE_STATS_KEY = 'ilovesurprises_affiliate_stats_v1';
const COMMISSIONS_KEY = 'ilovesurprises_commissions_v1';
const PAYOUTS_KEY = 'ilovesurprises_payouts_v1';
const GENEALOGY_TREE_KEY = 'ilovesurprises_genealogy_tree_v1';

// Initial realistic default 5-tier genealogy tree
const DEFAULT_GENEALOGY_TREE: ReferralMember[] = [
  {
    id: 'rep-l1-01',
    name: 'Emily Watson',
    email: 'emily.w@sparkles.com',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    repUsername: 'emily_sparkles',
    level: 1,
    rank: 'Diamond Ambassador',
    joinDate: '2025-11-14',
    status: 'active',
    personalSales: 4850.0,
    teamSales: 18240.0,
    totalTeamMembers: 14,
    commissionGenerated: 495.20,
    children: [
      {
        id: 'rep-l2-01',
        name: 'Jessica Miller',
        email: 'jess.m@scentlovers.com',
        avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
        repUsername: 'jess_candles',
        level: 2,
        rank: 'Gold Leader',
        joinDate: '2025-12-02',
        status: 'active',
        personalSales: 2940.0,
        teamSales: 7890.0,
        totalTeamMembers: 6,
        commissionGenerated: 165.60,
        children: [
          {
            id: 'rep-l3-01',
            name: 'Chloe Bennett',
            email: 'chloe.b@aroma.io',
            avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
            repUsername: 'chloe_glow',
            level: 3,
            rank: 'Silver Representative',
            joinDate: '2026-01-10',
            status: 'active',
            personalSales: 1420.0,
            teamSales: 3200.0,
            totalTeamMembers: 3,
            commissionGenerated: 78.40,
            children: [
              {
                id: 'rep-l4-01',
                name: 'Samantha Ray',
                email: 'sam.ray@candleclub.net',
                avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
                repUsername: 'sam_unbox',
                level: 4,
                rank: 'VIP Partner',
                joinDate: '2026-02-05',
                status: 'active',
                personalSales: 890.0,
                teamSales: 1100.0,
                totalTeamMembers: 1,
                commissionGenerated: 24.80,
                children: [
                  {
                    id: 'rep-l5-01',
                    name: 'Taylor Brooks',
                    email: 'taylor.b@gmail.com',
                    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
                    repUsername: 'taylor_spark',
                    level: 5,
                    rank: 'VIP Partner',
                    joinDate: '2026-02-18',
                    status: 'active',
                    personalSales: 450.0,
                    teamSales: 0.0,
                    totalTeamMembers: 0,
                    commissionGenerated: 9.50,
                  },
                ],
              },
            ],
          },
          {
            id: 'rep-l3-02',
            name: 'David Foster',
            email: 'david.foster@gmail.com',
            avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
            repUsername: 'dave_surprises',
            level: 3,
            rank: 'VIP Partner',
            joinDate: '2026-01-22',
            status: 'active',
            personalSales: 960.0,
            teamSales: 0.0,
            totalTeamMembers: 0,
            commissionGenerated: 38.40,
          },
        ],
      },
      {
        id: 'rep-l2-02',
        name: 'Rachel Adams',
        email: 'rachel.adams@cozyhome.com',
        avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
        repUsername: 'rachel_cozy',
        level: 2,
        rank: 'Silver Representative',
        joinDate: '2025-12-19',
        status: 'active',
        personalSales: 1850.0,
        teamSales: 2100.0,
        totalTeamMembers: 2,
        commissionGenerated: 94.00,
        children: [
          {
            id: 'rep-l3-03',
            name: 'Oliver King',
            email: 'oliver.king@outlook.com',
            avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
            repUsername: 'oliver_wax',
            level: 3,
            rank: 'VIP Partner',
            joinDate: '2026-02-01',
            status: 'inactive',
            personalSales: 320.0,
            teamSales: 0.0,
            totalTeamMembers: 0,
            commissionGenerated: 12.80,
          },
        ],
      },
    ],
  },
  {
    id: 'rep-l1-02',
    name: 'Marcus Sterling',
    email: 'marcus.s@luxuryglow.com',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    repUsername: 'marcus_vip',
    level: 1,
    rank: 'Gold Leader',
    joinDate: '2025-11-28',
    status: 'active',
    personalSales: 3420.0,
    teamSales: 6200.0,
    totalTeamMembers: 5,
    commissionGenerated: 285.50,
    children: [
      {
        id: 'rep-l2-03',
        name: 'Grace Kelly',
        email: 'grace.k@candles.com',
        avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
        repUsername: 'grace_reveals',
        level: 2,
        rank: 'Silver Representative',
        joinDate: '2026-01-08',
        status: 'active',
        personalSales: 1650.0,
        teamSales: 1200.0,
        totalTeamMembers: 1,
        commissionGenerated: 78.00,
        children: [
          {
            id: 'rep-l3-04',
            name: 'Hannah Scott',
            email: 'hannah.scott@gmail.com',
            avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
            repUsername: 'hannah_gifts',
            level: 3,
            rank: 'VIP Partner',
            joinDate: '2026-02-12',
            status: 'active',
            personalSales: 780.0,
            teamSales: 0.0,
            totalTeamMembers: 0,
            commissionGenerated: 31.20,
          },
        ],
      },
    ],
  },
  {
    id: 'rep-l1-03',
    name: 'Olivia Martinez',
    email: 'olivia.m@mysticwick.com',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    repUsername: 'olivia_jewels',
    level: 1,
    rank: 'Silver Representative',
    joinDate: '2026-01-15',
    status: 'active',
    personalSales: 1980.0,
    teamSales: 0.0,
    totalTeamMembers: 0,
    commissionGenerated: 148.50,
  },
];

// Initial realistic commissions ledger
const DEFAULT_COMMISSION_RECORDS: CommissionRecord[] = [
  {
    id: 'comm-101',
    orderId: 'ILS-849201-US',
    orderDate: '2026-02-28',
    customerName: 'Victoria Price',
    productName: 'Tahitian Vanilla & Gold Cash Candle',
    level: 'personal',
    levelLabel: 'Personal Sale (20%)',
    orderAmount: 89.98,
    commissionRate: 0.20,
    commissionAmount: 18.00,
    status: 'paid',
    payoutDate: '2026-03-01',
  },
  {
    id: 'comm-102',
    orderId: 'ILS-723140-US',
    orderDate: '2026-02-27',
    customerName: 'Brandon Walsh',
    productName: 'Midnight Amber Diamond Ring Candle',
    level: 1,
    levelLabel: 'Level 1: Emily Watson (5%)',
    orderAmount: 149.95,
    commissionRate: 0.05,
    commissionAmount: 7.50,
    status: 'paid',
    payoutDate: '2026-03-01',
  },
  {
    id: 'comm-103',
    orderId: 'ILS-619283-US',
    orderDate: '2026-02-26',
    customerName: 'Kylie Jenks',
    productName: 'Lavender Dream Real Cash Bath Bomb',
    level: 2,
    levelLabel: 'Level 2: Jessica Miller (4%)',
    orderAmount: 64.99,
    commissionRate: 0.04,
    commissionAmount: 2.60,
    status: 'paid',
    payoutDate: '2026-03-01',
  },
  {
    id: 'comm-104',
    orderId: 'ILS-591024-US',
    orderDate: '2026-02-24',
    customerName: 'Samantha Chen',
    productName: 'Pink Champagne Cash Candle Trio',
    level: 'personal',
    levelLabel: 'Personal Sale (20%)',
    orderAmount: 119.97,
    commissionRate: 0.20,
    commissionAmount: 23.99,
    status: 'paid',
    payoutDate: '2026-03-01',
  },
  {
    id: 'comm-105',
    orderId: 'ILS-482910-US',
    orderDate: '2026-02-22',
    customerName: 'Ethan Wright',
    productName: 'Eucalyptus Mint Cash Melts',
    level: 3,
    levelLabel: 'Level 3: Chloe Bennett (3%)',
    orderAmount: 49.99,
    commissionRate: 0.03,
    commissionAmount: 1.50,
    status: 'processing',
  },
  {
    id: 'comm-106',
    orderId: 'ILS-394812-US',
    orderDate: '2026-02-20',
    customerName: 'Morgan Freeman',
    productName: 'Rose Quartz & Emerald Cash Candle',
    level: 1,
    levelLabel: 'Level 1: Marcus Sterling (5%)',
    orderAmount: 79.99,
    commissionRate: 0.05,
    commissionAmount: 4.00,
    status: 'processing',
  },
  {
    id: 'comm-107',
    orderId: 'ILS-284918-US',
    orderDate: '2026-02-18',
    customerName: 'Ashley Cooper',
    productName: 'Sparkling Citrus Surprise Bath Bomb',
    level: 4,
    levelLabel: 'Level 4: Samantha Ray (2%)',
    orderAmount: 54.95,
    commissionRate: 0.02,
    commissionAmount: 1.10,
    status: 'pending',
  },
  {
    id: 'comm-108',
    orderId: 'ILS-192834-US',
    orderDate: '2026-02-16',
    customerName: 'Derek Jordan',
    productName: 'Wild Berry Cash Bubble Scoop',
    level: 5,
    levelLabel: 'Level 5: Taylor Brooks (1%)',
    orderAmount: 42.50,
    commissionRate: 0.01,
    commissionAmount: 0.43,
    status: 'pending',
  },
];

// Initial realistic payouts history
const DEFAULT_PAYOUT_RECORDS: PayoutRecord[] = [
  {
    id: 'payout-101',
    amount: 250.00,
    fee: 0.00,
    netAmount: 250.00,
    method: 'paypal',
    destinationAccount: 'sarah.vip@gmail.com',
    requestedAt: '2026-02-15T14:30:00Z',
    completedAt: '2026-02-16T10:15:00Z',
    status: 'completed',
    referenceId: 'PAYID-MX89210-ILS',
  },
  {
    id: 'payout-102',
    amount: 180.00,
    fee: 0.00,
    netAmount: 180.00,
    method: 'bank_transfer',
    destinationAccount: 'Chase Bank (•••• 4819)',
    requestedAt: '2026-01-30T09:12:00Z',
    completedAt: '2026-02-01T16:00:00Z',
    status: 'completed',
    referenceId: 'ACH-7829104-US',
  },
];

export const affiliateService = {
  /**
   * Retrieves live affiliate stats and balances
   */
  getStats(): AffiliateStats {
    if (typeof window === 'undefined') {
      return this.getDefaultStats();
    }
    try {
      const stored = localStorage.getItem(AFFILIATE_STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      const initial = this.getDefaultStats();
      localStorage.setItem(AFFILIATE_STATS_KEY, JSON.stringify(initial));
      return initial;
    } catch {
      return this.getDefaultStats();
    }
  },

  getDefaultStats(): AffiliateStats {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ilovesurprises.com';
    return {
      totalEarnings: 842.50,
      availableBalance: 412.50,
      pendingCommissions: 67.80,
      lifetimeSalesVolume: 4212.50,
      personalSalesVolume: 2480.00,
      teamSalesVolume: 27430.00,
      totalReferrals: 19,
      activeReferrals: 16,
      conversionRate: 9.2,
      currentRank: 'Diamond Ambassador',
      personalCommissionRate: 0.20,
      repUsername: 'sarah_sparkles',
      customReferralCode: 'SURPRISE20',
      referralLink: `${origin}/shop?rep=sarah_sparkles`,
    };
  },

  /**
   * Retrieves commission records
   */
  getCommissions(): CommissionRecord[] {
    if (typeof window === 'undefined') return DEFAULT_COMMISSION_RECORDS;
    try {
      const stored = localStorage.getItem(COMMISSIONS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(DEFAULT_COMMISSION_RECORDS));
      return DEFAULT_COMMISSION_RECORDS;
    } catch {
      return DEFAULT_COMMISSION_RECORDS;
    }
  },

  /**
   * Retrieves payout history
   */
  getPayouts(): PayoutRecord[] {
    if (typeof window === 'undefined') return DEFAULT_PAYOUT_RECORDS;
    try {
      const stored = localStorage.getItem(PAYOUTS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(PAYOUTS_KEY, JSON.stringify(DEFAULT_PAYOUT_RECORDS));
      return DEFAULT_PAYOUT_RECORDS;
    } catch {
      return DEFAULT_PAYOUT_RECORDS;
    }
  },

  /**
   * Retrieves the 5-level referral genealogy tree
   */
  getGenealogyTree(): ReferralMember[] {
    if (typeof window === 'undefined') return DEFAULT_GENEALOGY_TREE;
    try {
      const stored = localStorage.getItem(GENEALOGY_TREE_KEY);
      if (stored) {
        const parsed: ReferralMember[] = JSON.parse(stored);
        const sanitizeNode = (node: ReferralMember): ReferralMember => ({
          ...node,
          avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
          children: node.children ? node.children.map(sanitizeNode) : undefined,
        });
        return parsed.map(sanitizeNode);
      }
      localStorage.setItem(GENEALOGY_TREE_KEY, JSON.stringify(DEFAULT_GENEALOGY_TREE));
      return DEFAULT_GENEALOGY_TREE;
    } catch {
      return DEFAULT_GENEALOGY_TREE;
    }
  },

  /**
   * Flattens the 5-level genealogy tree into a list for searching & filtering
   */
  getAllReferralsFlat(): ReferralMember[] {
    const tree = this.getGenealogyTree();
    const result: ReferralMember[] = [];

    const traverse = (node: ReferralMember) => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        node.children.forEach(traverse);
      }
    };

    tree.forEach(traverse);
    return result;
  },

  /**
   * Submits a payout / withdrawal request
   */
  async requestPayout(params: {
    amount: number;
    method: PayoutMethod;
    destinationAccount: string;
  }): Promise<{ success: boolean; payout?: PayoutRecord; error?: string }> {
    // Simulate brief latency (450ms)
    await new Promise((resolve) => setTimeout(resolve, 450));

    const stats = this.getStats();
    if (params.amount < 25) {
      return { success: false, error: 'Minimum withdrawal threshold is $25.00' };
    }
    if (params.amount > stats.availableBalance) {
      return { success: false, error: `Requested amount exceeds available balance ($${stats.availableBalance.toFixed(2)})` };
    }

    const newPayout: PayoutRecord = {
      id: 'payout-' + Date.now(),
      amount: params.amount,
      fee: 0,
      netAmount: params.amount,
      method: params.method,
      destinationAccount: params.destinationAccount,
      requestedAt: new Date().toISOString(),
      status: 'processing',
      referenceId: 'REF-' + Math.floor(100000 + Math.random() * 900000),
    };

    // Update balances
    const updatedStats: AffiliateStats = {
      ...stats,
      availableBalance: stats.availableBalance - params.amount,
    };

    const payouts = this.getPayouts();
    const updatedPayouts = [newPayout, ...payouts];

    if (typeof window !== 'undefined') {
      localStorage.setItem(AFFILIATE_STATS_KEY, JSON.stringify(updatedStats));
      localStorage.setItem(PAYOUTS_KEY, JSON.stringify(updatedPayouts));
      window.dispatchEvent(new CustomEvent('ilovesurprises_affiliate_updated'));
    }

    return { success: true, payout: newPayout };
  },

  /**
   * Updates representative custom username & referral link
   */
  updateRepUsername(newUsername: string): AffiliateStats {
    const cleaned = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const stats = this.getStats();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ilovesurprises.com';

    const updated: AffiliateStats = {
      ...stats,
      repUsername: cleaned,
      referralLink: `${origin}/shop?rep=${cleaned}`,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(AFFILIATE_STATS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ilovesurprises_affiliate_updated'));
    }

    return updated;
  },
};
