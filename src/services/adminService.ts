import type {
  AdminRole,
  AdminRoleDefinition,
  AdminTab,
  AdminKPIs,
  AdminActivityItem,
  RepresentativeAdminRecord,
  RepStatus,
  MembershipAdminRecord,
  AdminProductItem,
  AdminCollectionItem,
  AdminCustomerItem,
  AdminRefundRecord,
  AdminDiscountCode,
  AdminCommissionRecord,
  CommissionLedgerStatus,
  AdminReportData,
  AdminSettingsData,
} from '../types/admin';
import { productsData } from '../data/products';
import { categoriesData } from '../data/categories';

const ADMIN_ROLE_KEY = 'ils_admin_current_role_v1';
const ADMIN_REPS_KEY = 'ils_admin_representatives_v1';
const ADMIN_MEMBERSHIPS_KEY = 'ils_admin_memberships_v1';
const ADMIN_COMMISSIONS_KEY = 'ils_admin_commissions_v1';
const ADMIN_REFUNDS_KEY = 'ils_admin_refunds_v1';
const ADMIN_DISCOUNTS_KEY = 'ils_admin_discounts_v1';
const ADMIN_SETTINGS_KEY = 'ils_admin_settings_v1';

export const ADMIN_ROLES_CONFIG: Record<AdminRole, AdminRoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Administrator',
    badge: 'Full Access',
    description: 'Unrestricted control over commerce, reps, payouts, settings, and permissions.',
    allowedTabs: ['overview', 'representatives', 'memberships', 'commerce', 'commissions', 'reports', 'settings', 'permissions'],
    canEdit: true,
    canApprovePayouts: true,
    canManageSettings: true,
  },
  store_manager: {
    id: 'store_manager',
    name: 'Store Manager',
    badge: 'Commerce & Ops',
    description: 'Manages catalog, inventory, order refunds, discount promotions, and sales reports.',
    allowedTabs: ['overview', 'commerce', 'reports'],
    canEdit: true,
    canApprovePayouts: false,
    canManageSettings: false,
  },
  affiliate_manager: {
    id: 'affiliate_manager',
    name: 'Affiliate & Rep Director',
    badge: 'Downline & Comms',
    description: 'Manages reps, approvals, memberships, downline tiers, and commission ledgers.',
    allowedTabs: ['overview', 'representatives', 'memberships', 'commissions', 'reports'],
    canEdit: true,
    canApprovePayouts: true,
    canManageSettings: false,
  },
  support_rep: {
    id: 'support_rep',
    name: 'Customer Support Lead',
    badge: 'Read & Assist',
    description: 'Access to customer orders, lookup reps, memberships, and refunds processing.',
    allowedTabs: ['overview', 'representatives', 'memberships', 'commerce'],
    canEdit: false,
    canApprovePayouts: false,
    canManageSettings: false,
  },
};

const INITIAL_REPRESENTATIVES: RepresentativeAdminRecord[] = [
  {
    id: 'rep-adm-01',
    name: 'Emily Watson',
    repUsername: 'emily_sparkles',
    email: 'emily.w@sparkles.com',
    phone: '(555) 342-9182',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    sponsorUsername: 'corporate',
    sponsorName: 'ILoveSurprises Head Office',
    status: 'active',
    approvalStatus: 'approved',
    currentRank: 'Diamond Ambassador',
    membershipStatus: 'active',
    membershipPlan: '12-Month Prepaid ($203.90/yr)',
    joinDate: '2025-11-14',
    lifetimeSales: 48500.0,
    personalSalesMonth: 4850.0,
    teamSalesMonth: 18240.0,
    teamSize: 14,
    totalCommissionsEarned: 4950.2,
  },
  {
    id: 'rep-adm-02',
    name: 'Jessica Miller',
    repUsername: 'jess_candles',
    email: 'jess.m@scentlovers.com',
    phone: '(555) 489-1120',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    sponsorUsername: 'emily_sparkles',
    sponsorName: 'Emily Watson',
    status: 'active',
    approvalStatus: 'approved',
    currentRank: 'Gold Leader',
    membershipStatus: 'active',
    membershipPlan: '6-Month Prepaid ($107.95)',
    joinDate: '2025-12-02',
    lifetimeSales: 29400.0,
    personalSalesMonth: 2940.0,
    teamSalesMonth: 7890.0,
    teamSize: 6,
    totalCommissionsEarned: 2410.5,
  },
  {
    id: 'rep-adm-03',
    name: 'Chloe Bennett',
    repUsername: 'chloe_glow',
    email: 'chloe.b@aroma.io',
    phone: '(555) 782-9931',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    sponsorUsername: 'jess_candles',
    sponsorName: 'Jessica Miller',
    status: 'past_due',
    approvalStatus: 'approved',
    currentRank: 'Silver Representative',
    membershipStatus: 'past_due',
    membershipPlan: 'Monthly Active ($19.99/mo)',
    joinDate: '2026-01-10',
    lifetimeSales: 8900.0,
    personalSalesMonth: 1420.0,
    teamSalesMonth: 3200.0,
    teamSize: 3,
    totalCommissionsEarned: 890.0,
  },
  {
    id: 'rep-adm-04',
    name: 'Samantha Ray',
    repUsername: 'sam_unbox',
    email: 'sam.ray@candleclub.net',
    phone: '(555) 612-4409',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    sponsorUsername: 'chloe_glow',
    sponsorName: 'Chloe Bennett',
    status: 'active',
    approvalStatus: 'approved',
    currentRank: 'VIP Partner',
    membershipStatus: 'active',
    membershipPlan: 'Monthly Active ($19.99/mo)',
    joinDate: '2026-02-05',
    lifetimeSales: 4200.0,
    personalSalesMonth: 890.0,
    teamSalesMonth: 1100.0,
    teamSize: 1,
    totalCommissionsEarned: 380.0,
  },
  {
    id: 'rep-adm-05',
    name: 'David Foster',
    repUsername: 'dave_surprises',
    email: 'david.f@homearoma.org',
    phone: '(555) 914-7721',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    sponsorUsername: 'jess_candles',
    sponsorName: 'Jessica Miller',
    status: 'suspended',
    approvalStatus: 'approved',
    currentRank: 'VIP Partner',
    membershipStatus: 'suspended',
    membershipPlan: 'Monthly Active ($19.99/mo)',
    joinDate: '2026-01-22',
    lifetimeSales: 3100.0,
    personalSalesMonth: 210.0,
    teamSalesMonth: 450.0,
    teamSize: 1,
    totalCommissionsEarned: 240.0,
  },
  {
    id: 'rep-adm-06',
    name: 'Morgan Blake',
    repUsername: 'morgan_lux',
    email: 'morgan.blake@luxscents.com',
    phone: '(555) 234-8890',
    avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    sponsorUsername: 'emily_sparkles',
    sponsorName: 'Emily Watson',
    status: 'active',
    approvalStatus: 'pending',
    currentRank: 'Pending Review',
    membershipStatus: 'active',
    membershipPlan: '6-Month Prepaid ($107.95)',
    joinDate: '2026-03-01',
    lifetimeSales: 620.0,
    personalSalesMonth: 620.0,
    teamSalesMonth: 0.0,
    teamSize: 0,
    totalCommissionsEarned: 124.0,
  },
];

const INITIAL_MEMBERSHIPS: MembershipAdminRecord[] = [
  {
    id: 'mem-001',
    representativeId: 'rep-adm-01',
    repName: 'Emily Watson',
    repUsername: 'emily_sparkles',
    repAvatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    plan: 'twelve_month',
    planName: '12-Month Prepaid VIP Partner',
    price: 203.90,
    billingFrequency: 'annually',
    discountNotice: '15% Prepaid Discount Applied',
    paymentStatus: 'paid',
    status: 'active',
    nextBillingDate: '2026-11-14',
    renewalStatus: 'auto_renew',
    cancellationStatus: 'none',
    startedAt: '2025-11-14',
    paymentMethodSnippet: 'Visa •••• 4242',
  },
  {
    id: 'mem-002',
    representativeId: 'rep-adm-02',
    repName: 'Jessica Miller',
    repUsername: 'jess_candles',
    repAvatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    plan: 'six_month',
    planName: '6-Month Prepaid Partner',
    price: 107.95,
    billingFrequency: 'every_6_months',
    discountNotice: '10% Prepaid Discount Applied',
    paymentStatus: 'paid',
    status: 'active',
    nextBillingDate: '2026-06-02',
    renewalStatus: 'auto_renew',
    cancellationStatus: 'none',
    startedAt: '2025-12-02',
    paymentMethodSnippet: 'Mastercard •••• 8812',
  },
  {
    id: 'mem-003',
    representativeId: 'rep-adm-03',
    repName: 'Chloe Bennett',
    repUsername: 'chloe_glow',
    repAvatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    plan: 'monthly',
    planName: 'Monthly Active Representative',
    price: 19.99,
    billingFrequency: 'monthly',
    paymentStatus: 'failed',
    status: 'past_due',
    nextBillingDate: '2026-03-10',
    renewalStatus: 'failing',
    cancellationStatus: 'none',
    startedAt: '2026-01-10',
    paymentMethodSnippet: 'Amex •••• 1004',
  },
  {
    id: 'mem-004',
    representativeId: 'rep-adm-04',
    repName: 'Samantha Ray',
    repUsername: 'sam_unbox',
    repAvatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    plan: 'monthly',
    planName: 'Monthly Active Representative',
    price: 19.99,
    billingFrequency: 'monthly',
    paymentStatus: 'paid',
    status: 'active',
    nextBillingDate: '2026-03-28',
    renewalStatus: 'auto_renew',
    cancellationStatus: 'none',
    startedAt: '2026-02-05',
    paymentMethodSnippet: 'Visa •••• 9931',
  },
  {
    id: 'mem-005',
    representativeId: 'rep-adm-05',
    repName: 'David Foster',
    repUsername: 'dave_surprises',
    repAvatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    plan: 'monthly',
    planName: 'Monthly Active Representative',
    price: 19.99,
    billingFrequency: 'monthly',
    paymentStatus: 'failed',
    status: 'suspended',
    nextBillingDate: '2026-02-22',
    renewalStatus: 'failing',
    cancellationStatus: 'pending_end_of_period',
    startedAt: '2026-01-22',
    paymentMethodSnippet: 'Mastercard •••• 5520',
  },
];

const INITIAL_COMMISSIONS: AdminCommissionRecord[] = [
  {
    id: 'comm-801',
    repId: 'rep-adm-01',
    repName: 'Emily Watson',
    repUsername: 'emily_sparkles',
    orderId: 'ILS-89104-US',
    orderAmount: 189.90,
    tier: 'selling_rep',
    tierLabel: 'Direct Sale (20%)',
    ratePercent: 20,
    commissionAmount: 37.98,
    status: 'paid',
    date: '2026-03-03',
    customerName: 'Sarah Jenkins',
    payoutReference: 'PO-2026-0301-99',
  },
  {
    id: 'comm-802',
    repId: 'rep-adm-01',
    repName: 'Emily Watson',
    repUsername: 'emily_sparkles',
    orderId: 'ILS-89145-US',
    orderAmount: 94.50,
    tier: 1,
    tierLabel: 'Level 1 Downline (5%)',
    ratePercent: 5,
    commissionAmount: 4.73,
    status: 'approved',
    date: '2026-03-03',
    customerName: 'Marcus Wright',
  },
  {
    id: 'comm-803',
    repId: 'rep-adm-02',
    repName: 'Jessica Miller',
    repUsername: 'jess_candles',
    orderId: 'ILS-89145-US',
    orderAmount: 94.50,
    tier: 'selling_rep',
    tierLabel: 'Direct Sale (20%)',
    ratePercent: 20,
    commissionAmount: 18.90,
    status: 'approved',
    date: '2026-03-03',
    customerName: 'Marcus Wright',
  },
  {
    id: 'comm-804',
    repId: 'rep-adm-01',
    repName: 'Emily Watson',
    repUsername: 'emily_sparkles',
    orderId: 'ILS-89020-US',
    orderAmount: 245.00,
    tier: 2,
    tierLabel: 'Level 2 Downline (4%)',
    ratePercent: 4,
    commissionAmount: 9.80,
    status: 'pending',
    date: '2026-03-02',
    customerName: 'Alicia Keyser',
  },
  {
    id: 'comm-805',
    repId: 'rep-adm-03',
    repName: 'Chloe Bennett',
    repUsername: 'chloe_glow',
    orderId: 'ILS-88990-US',
    orderAmount: 110.00,
    tier: 'selling_rep',
    tierLabel: 'Direct Sale (20%)',
    ratePercent: 20,
    commissionAmount: 22.00,
    status: 'pending',
    date: '2026-03-02',
    customerName: 'Brian Miller',
  },
  {
    id: 'comm-806',
    repId: 'rep-adm-01',
    repName: 'Emily Watson',
    repUsername: 'emily_sparkles',
    orderId: 'ILS-88741-US',
    orderAmount: 75.00,
    tier: 3,
    tierLabel: 'Level 3 Downline (3%)',
    ratePercent: 3,
    commissionAmount: 2.25,
    status: 'paid',
    date: '2026-02-28',
    customerName: 'Hannah Abbott',
    payoutReference: 'PO-2026-0228-44',
  },
  {
    id: 'comm-807',
    repId: 'rep-adm-04',
    repName: 'Samantha Ray',
    repUsername: 'sam_unbox',
    orderId: 'ILS-88612-US',
    orderAmount: 155.00,
    tier: 'selling_rep',
    tierLabel: 'Direct Sale (20%)',
    ratePercent: 20,
    commissionAmount: 31.00,
    status: 'reversed',
    date: '2026-02-27',
    customerName: 'Order Refunded #ILS-88612',
  },
  {
    id: 'comm-808',
    repId: 'rep-adm-01',
    repName: 'Emily Watson',
    repUsername: 'emily_sparkles',
    orderId: 'ILS-88540-US',
    orderAmount: 64.99,
    tier: 4,
    tierLabel: 'Level 4 Downline (2%)',
    ratePercent: 2,
    commissionAmount: 1.30,
    status: 'paid',
    date: '2026-02-25',
    customerName: 'Tyler Gomez',
    payoutReference: 'PO-2026-0225-12',
  },
  {
    id: 'comm-809',
    repId: 'rep-adm-01',
    repName: 'Emily Watson',
    repUsername: 'emily_sparkles',
    orderId: 'ILS-88490-US',
    orderAmount: 89.99,
    tier: 5,
    tierLabel: 'Level 5 Downline (1%)',
    ratePercent: 1,
    commissionAmount: 0.90,
    status: 'paid',
    date: '2026-02-24',
    customerName: 'Olivia Price',
    payoutReference: 'PO-2026-0225-12',
  },
];

const INITIAL_REFUNDS: AdminRefundRecord[] = [
  {
    id: 'ref-01',
    orderId: 'ILS-88612-US',
    customerName: 'Samantha Ray (Buyer)',
    customerEmail: 'sam.ray@candleclub.net',
    amount: 155.00,
    reason: 'Customer returned sealed candle - changed mind',
    status: 'completed',
    requestedAt: '2026-02-27',
    restocked: true,
    approvedBy: 'Store Manager',
  },
  {
    id: 'ref-02',
    orderId: 'ILS-87421-US',
    customerName: 'Gregory House',
    customerEmail: 'ghouse@hospital.org',
    amount: 49.99,
    reason: 'Damaged packaging during carrier transit',
    status: 'completed',
    requestedAt: '2026-02-20',
    restocked: false,
    approvedBy: 'Super Administrator',
  },
];

const INITIAL_DISCOUNTS: AdminDiscountCode[] = [
  {
    id: 'disc-01',
    code: 'SURPRISE15',
    discountPercent: 15,
    minSpend: 40,
    usageCount: 384,
    maxUsage: 1000,
    expiresAt: '2026-12-31',
    active: true,
  },
  {
    id: 'disc-02',
    code: 'VIPGOLD',
    discountPercent: 20,
    minSpend: 75,
    usageCount: 92,
    maxUsage: 500,
    expiresAt: '2026-06-30',
    active: true,
  },
  {
    id: 'disc-03',
    code: 'WELCOME10',
    discountPercent: 10,
    minSpend: 25,
    usageCount: 1420,
    expiresAt: '2026-12-31',
    active: true,
  },
];

const INITIAL_SETTINGS: AdminSettingsData = {
  referralAttributionDays: 60,
  restrictedUsernames: [
    'admin',
    'administrator',
    'ilovesurprises',
    'official',
    'support',
    'help',
    'ceo',
    'founder',
    'billing',
    'root',
    'payouts',
    'security',
    'mod',
    'staff',
  ],
  starterKits: [
    {
      id: 'kit-pro',
      name: 'Pro Ambassador Starter Kit',
      price: 99.00,
      includedProductsCount: 8,
      active: true,
      description: 'Contains 4 Best-Selling Cash Candles, 2 Bath Bombs, 2 Wax Melts, Scent Sampler Strips, and 100 Catalogs.',
      sampleItems: ['Cash Candles (2x)', 'Diamond Ring Candles (2x)', 'Aroma Samplers (50x)', 'Branded Swag Bag'],
    },
    {
      id: 'kit-standard',
      name: 'Essential Launch Starter Kit',
      price: 49.00,
      includedProductsCount: 4,
      active: true,
      description: 'Ideal starter inventory to host initial home reveal parties and unboxing live streams.',
      sampleItems: ['Cash Candle (1x)', 'Surprise Ring Candle (1x)', 'Bath Bomb Cash (2x)', 'Quickstart Digital Guide'],
    },
  ],
  emailProvider: 'sendgrid',
  emailSenderName: 'ILoveSurprises Customer Experience',
  emailSenderAddress: 'support@ilovesurprises.com',
  emailApiKeyConfigured: true,
  emailTemplates: [
    { id: 'tpl-1', name: 'Order Confirmation & Tracking', subject: 'Your Surprise is on the way! [Order #{{orderId}}]', trigger: 'order_placed', active: true },
    { id: 'tpl-2', name: 'Representative Welcome & Store Link', subject: 'Welcome to the Team! Here is your 20% Rep Store Link', trigger: 'rep_approved', active: true },
    { id: 'tpl-3', name: 'Commission Approved Notice', subject: 'Cha-ching! You just earned ${{amount}} commission', trigger: 'commission_approved', active: true },
    { id: 'tpl-4', name: 'Membership Renewal Receipt', subject: 'Your Representative Membership Renewal Receipt', trigger: 'membership_renewed', active: true },
    { id: 'tpl-5', name: 'Payment Past Due Alert', subject: 'Action Required: Update your billing method to keep rep privileges', trigger: 'payment_failed', active: true },
  ],
  gateways: {
    stripe: { enabled: true, testMode: false, webhookHealthy: true },
    paypal: { enabled: true, sandbox: false, webhookHealthy: true },
    applePay: { enabled: true },
  },
  siteContent: {
    announcementText: '✨ FREE EXPRESS SHIPPING OVER $50 • GUARANTEED REAL SURPRISE INSIDE EVERY ORDER ✨',
    announcementActive: true,
    promoBannerText: 'VIP Reveal Club: Save 15% with code SURPRISE15 at checkout',
    promoBannerActive: true,
    vipPerkText: 'Up to $7,500 Cash & Fine Diamond Jewelry Hidden in Hand-Poured USA Soy Candles',
  },
};

export const adminService = {
  getCurrentRole(): AdminRole {
    if (typeof window === 'undefined') return 'super_admin';
    try {
      const stored = localStorage.getItem(ADMIN_ROLE_KEY);
      if (stored && stored in ADMIN_ROLES_CONFIG) {
        return stored as AdminRole;
      }
      return 'super_admin';
    } catch {
      return 'super_admin';
    }
  },

  setCurrentRole(role: AdminRole): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_ROLE_KEY, role);
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to set admin role', err);
      }
    }
  },

  hasTabAccess(tab: AdminTab, role?: AdminRole): boolean {
    const currentRole = role || this.getCurrentRole();
    const config = ADMIN_ROLES_CONFIG[currentRole];
    return config.allowedTabs.includes(tab);
  },

  getKPIs(): AdminKPIs {
    const reps = this.getRepresentatives();
    const activeReps = reps.filter((r) => r.status === 'active').length;
    const commissions = this.getCommissionLedger();
    const pendingLiability = commissions
      .filter((c) => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalPaid = commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    return {
      grossRevenue: 148920.0,
      grossRevenueMoM: 18.4,
      totalOrders: 2314,
      totalOrdersMoM: 12.8,
      totalCustomers: 1890,
      totalCustomersMoM: 14.1,
      activeRepresentatives: activeReps || 42,
      activeRepresentativesMoM: 9.5,
      activeMemberships: 38,
      activeMembershipsMoM: 11.2,
      monthlyRecurringRevenue: 2840.0,
      pendingCommissionLiability: Number(pendingLiability.toFixed(2)),
      totalCommissionsPaid: Number(totalPaid.toFixed(2)),
      averageOrderValue: 64.35,
    };
  },

  getRecentActivity(): AdminActivityItem[] {
    return [
      {
        id: 'act-01',
        timestamp: '10 minutes ago',
        type: 'order',
        title: 'New Store Order #ILS-89145-US',
        description: 'Placed by Marcus Wright for $94.50 (Referred by @jess_candles)',
        badge: 'Order',
        badgeColor: 'bg-emerald-50 text-emerald-700',
        amount: 94.50,
      },
      {
        id: 'act-02',
        timestamp: '32 minutes ago',
        type: 'rep_signup',
        title: 'New Representative Onboarded',
        description: 'Morgan Blake (@morgan_lux) completed registration with 6-Month plan',
        badge: 'New Rep',
        badgeColor: 'bg-red-50 text-[#D30915]',
      },
      {
        id: 'act-03',
        timestamp: '1 hour ago',
        type: 'commission_payout',
        title: 'Batch Commission Payout Executed',
        description: 'Disbursed $495.20 to Emily Watson via PayPal Direct',
        badge: 'Payout',
        badgeColor: 'bg-purple-50 text-purple-700',
        amount: 495.20,
      },
      {
        id: 'act-04',
        timestamp: '3 hours ago',
        type: 'membership_renew',
        title: 'Membership Auto-Renewed',
        description: 'Samantha Ray (@sam_unbox) paid $19.99 monthly active subscription',
        badge: 'Renewed',
        badgeColor: 'bg-blue-50 text-blue-700',
        amount: 19.99,
      },
      {
        id: 'act-05',
        timestamp: '6 hours ago',
        type: 'status_alert',
        title: 'Billing Retry Warning',
        description: 'Chloe Bennett (@chloe_glow) payment failed. Grace period 3 days remaining.',
        badge: 'Past Due',
        badgeColor: 'bg-amber-50 text-amber-700',
      },
    ];
  },

  getRepresentatives(): RepresentativeAdminRecord[] {
    if (typeof window === 'undefined') return INITIAL_REPRESENTATIVES;
    try {
      const stored = localStorage.getItem(ADMIN_REPS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_REPS_KEY, JSON.stringify(INITIAL_REPRESENTATIVES));
      return INITIAL_REPRESENTATIVES;
    } catch {
      return INITIAL_REPRESENTATIVES;
    }
  },

  updateRepresentativeStatus(id: string, status: RepStatus): boolean {
    const list = this.getRepresentatives();
    const target = list.find((r) => r.id === id);
    if (!target) return false;
    target.status = status;
    if (status === 'suspended') {
      target.membershipStatus = 'suspended';
    } else if (status === 'active') {
      target.membershipStatus = 'active';
    } else if (status === 'past_due') {
      target.membershipStatus = 'past_due';
    }
    this.saveRepresentatives(list);
    return true;
  },

  approveRepresentative(id: string): boolean {
    const list = this.getRepresentatives();
    const target = list.find((r) => r.id === id);
    if (!target) return false;
    target.approvalStatus = 'approved';
    target.status = 'active';
    target.currentRank = 'VIP Partner';
    this.saveRepresentatives(list);
    return true;
  },

  rejectRepresentative(id: string): boolean {
    const list = this.getRepresentatives();
    const target = list.find((r) => r.id === id);
    if (!target) return false;
    target.approvalStatus = 'rejected';
    target.status = 'suspended';
    this.saveRepresentatives(list);
    return true;
  },

  saveRepresentatives(data: RepresentativeAdminRecord[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_REPS_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save reps', err);
      }
    }
  },

  getMemberships(): MembershipAdminRecord[] {
    if (typeof window === 'undefined') return INITIAL_MEMBERSHIPS;
    try {
      const stored = localStorage.getItem(ADMIN_MEMBERSHIPS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_MEMBERSHIPS_KEY, JSON.stringify(INITIAL_MEMBERSHIPS));
      return INITIAL_MEMBERSHIPS;
    } catch {
      return INITIAL_MEMBERSHIPS;
    }
  },

  updateMembershipStatus(id: string, status: 'active' | 'past_due' | 'suspended' | 'cancelled'): boolean {
    const list = this.getMemberships();
    const target = list.find((m) => m.id === id);
    if (!target) return false;
    target.status = status;
    if (status === 'active') target.paymentStatus = 'paid';
    if (status === 'past_due') target.paymentStatus = 'failed';
    this.saveMemberships(list);
    return true;
  },

  saveMemberships(data: MembershipAdminRecord[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_MEMBERSHIPS_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save memberships', err);
      }
    }
  },

  getCommerceProducts(): AdminProductItem[] {
    return productsData.map((p, idx) => ({
      id: p.id,
      name: p.name,
      sku: `ILS-SKU-${p.id.slice(0, 4).toUpperCase()}`,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      stock: 35 + (idx * 17) % 65,
      lowStockThreshold: 15,
      surpriseType: p.surpriseType,
      surpriseValue: p.surpriseValue,
      image: p.image,
      rating: p.rating,
      reviewCount: p.reviewCount,
      status: 'active',
      isBestSeller: p.isBestSeller,
    }));
  },

  getCollections(): AdminCollectionItem[] {
    return categoriesData.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c.itemCount,
      featured: !!c.featured,
      image: c.image,
      tagline: c.tagline,
    }));
  },

  getCustomers(): AdminCustomerItem[] {
    return [
      { id: 'c-01', name: 'Marcus Wright', email: 'marcus.w@gmail.com', phone: '(555) 891-2301', ordersCount: 4, totalSpent: 389.50, lastOrderDate: '2026-03-03', repReferredBy: 'jess_candles', status: 'active' },
      { id: 'c-02', name: 'Sarah Jenkins', email: 'sarah.j@yahoo.com', phone: '(555) 772-1049', ordersCount: 6, totalSpent: 512.20, lastOrderDate: '2026-03-03', repReferredBy: 'emily_sparkles', status: 'active' },
      { id: 'c-03', name: 'Alicia Keyser', email: 'alicia.k@hotmail.com', phone: '(555) 349-8812', ordersCount: 2, totalSpent: 245.00, lastOrderDate: '2026-03-02', repReferredBy: 'chloe_glow', status: 'active' },
      { id: 'c-04', name: 'Brian Miller', email: 'bmiller@fastmail.com', phone: '(555) 490-6721', ordersCount: 1, totalSpent: 110.00, lastOrderDate: '2026-03-02', repReferredBy: 'chloe_glow', status: 'active' },
      { id: 'c-05', name: 'Gregory House', email: 'ghouse@hospital.org', phone: '(555) 991-0023', ordersCount: 3, totalSpent: 198.40, lastOrderDate: '2026-02-20', status: 'active' },
    ];
  },

  getRefunds(): AdminRefundRecord[] {
    if (typeof window === 'undefined') return INITIAL_REFUNDS;
    try {
      const stored = localStorage.getItem(ADMIN_REFUNDS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_REFUNDS_KEY, JSON.stringify(INITIAL_REFUNDS));
      return INITIAL_REFUNDS;
    } catch {
      return INITIAL_REFUNDS;
    }
  },

  processRefund(record: Omit<AdminRefundRecord, 'id' | 'requestedAt' | 'status'>): AdminRefundRecord {
    const refunds = this.getRefunds();
    const newRecord: AdminRefundRecord = {
      ...record,
      id: `ref-${Date.now().toString().slice(-4)}`,
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'completed',
    };
    const updated = [newRecord, ...refunds];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_REFUNDS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save refund', err);
      }
    }
    return newRecord;
  },

  getDiscounts(): AdminDiscountCode[] {
    if (typeof window === 'undefined') return INITIAL_DISCOUNTS;
    try {
      const stored = localStorage.getItem(ADMIN_DISCOUNTS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_DISCOUNTS_KEY, JSON.stringify(INITIAL_DISCOUNTS));
      return INITIAL_DISCOUNTS;
    } catch {
      return INITIAL_DISCOUNTS;
    }
  },

  createDiscount(discount: Omit<AdminDiscountCode, 'id' | 'usageCount'>): AdminDiscountCode {
    const list = this.getDiscounts();
    const newDisc: AdminDiscountCode = {
      ...discount,
      id: `disc-${Date.now().toString().slice(-4)}`,
      usageCount: 0,
    };
    const updated = [newDisc, ...list];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_DISCOUNTS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to create discount', err);
      }
    }
    return newDisc;
  },

  getCommissionLedger(): AdminCommissionRecord[] {
    if (typeof window === 'undefined') return INITIAL_COMMISSIONS;
    try {
      const stored = localStorage.getItem(ADMIN_COMMISSIONS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_COMMISSIONS_KEY, JSON.stringify(INITIAL_COMMISSIONS));
      return INITIAL_COMMISSIONS;
    } catch {
      return INITIAL_COMMISSIONS;
    }
  },

  updateCommissionStatus(id: string, status: CommissionLedgerStatus): boolean {
    const list = this.getCommissionLedger();
    const target = list.find((c) => c.id === id);
    if (!target) return false;
    target.status = status;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COMMISSIONS_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to update commission status', err);
      }
    }
    return true;
  },

  batchApproveCommissions(): number {
    const list = this.getCommissionLedger();
    let count = 0;
    for (const item of list) {
      if (item.status === 'pending') {
        item.status = 'approved';
        count++;
      }
    }
    if (count > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COMMISSIONS_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to batch approve', err);
      }
    }
    return count;
  },

  getReportsData(timeframe: '7d' | '30d' | '90d' | 'ytd' = '30d'): AdminReportData {
    return {
      timeframe,
      grossSales: 148920.0,
      netSales: 139450.0,
      ordersCount: 2314,
      averageOrderValue: 64.35,
      visitors: 48900,
      conversionRate: 4.73,
      activeRepresentatives: 42,
      membershipMRR: 2840.0,
      commissionLiability: 12450.0,
      totalPayoutsDisbursed: 42800.0,
      salesByDay: [
        { date: 'Mon', sales: 4200, orders: 65 },
        { date: 'Tue', sales: 5100, orders: 78 },
        { date: 'Wed', sales: 6300, orders: 94 },
        { date: 'Thu', sales: 5800, orders: 86 },
        { date: 'Fri', sales: 7900, orders: 118 },
        { date: 'Sat', sales: 9400, orders: 142 },
        { date: 'Sun', sales: 8800, orders: 134 },
      ],
      trafficByDay: [
        { date: 'Mon', visitors: 6200, orders: 65 },
        { date: 'Tue', visitors: 7100, orders: 78 },
        { date: 'Wed', visitors: 8400, orders: 94 },
        { date: 'Thu', visitors: 7800, orders: 86 },
        { date: 'Fri', visitors: 9600, orders: 118 },
        { date: 'Sat', visitors: 11200, orders: 142 },
        { date: 'Sun', visitors: 10500, orders: 134 },
      ],
      tierDistribution: [
        { tier: 'Selling Representative', rate: '20%', amount: 29780.0, percentage: 57.1 },
        { tier: 'Level 1 Referral', rate: '5%', amount: 7445.0, percentage: 14.3 },
        { tier: 'Level 2 Referral', rate: '4%', amount: 5956.0, percentage: 11.4 },
        { tier: 'Level 3 Referral', rate: '3%', amount: 4467.0, percentage: 8.6 },
        { tier: 'Level 4 Referral', rate: '2%', amount: 2978.0, percentage: 5.7 },
        { tier: 'Level 5 Referral', rate: '1%', amount: 1489.0, percentage: 2.9 },
      ],
      membershipBreakdown: [
        { plan: 'Monthly Active ($19.99)', count: 26, revenue: 519.74 },
        { plan: '6-Month Prepaid ($107.95)', count: 18, revenue: 1943.10 },
        { plan: '12-Month Prepaid ($203.90)', count: 12, revenue: 2446.80 },
      ],
    };
  },

  getSettings(): AdminSettingsData {
    if (typeof window === 'undefined') return INITIAL_SETTINGS;
    try {
      const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: AdminSettingsData): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save settings', err);
      }
    }
  },
};
