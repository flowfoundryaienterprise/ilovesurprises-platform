import type { Order, OrderStatus, OrderItem, ShippingAddress, DeliveryMethod, PaymentSummary } from '../types';
import { supabase } from './supabaseClient';
import { attributionService } from './attributionService';
import { commissionService } from './commissionService';
import { representativeService } from './representativeService';

const ORDERS_STORAGE_KEY = 'ilovesurprises_orders_v1';

/**
 * Generates an authentic formatted Order ID
 * Example: ILS-749201-US
 */
export function generateOrderId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `ILS-${randomNum}-US`;
}

/**
 * Generates an authentic tracking number
 * Example: 94001118995628392012
 */
export function generateTrackingNumber(): string {
  const prefix = '9400';
  const suffix = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}${suffix}`;
}

/**
 * Calculates estimated delivery date formatted cleanly
 */
export function calculateEstimatedDelivery(daysToAdd: number): string {
  const date = new Date();
  let added = 0;
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    // Skip Sundays for standard business delivery
    if (date.getDay() !== 0) {
      added++;
    }
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Order Service layer - ready for backend REST API endpoints:
 * POST /api/orders/create
 * GET /api/orders
 * GET /api/orders/:orderId
 */
export const orderService = {
  /**
   * Loads all orders from storage
   */
  getOrders(): Order[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves single order by ID
   */
  getOrderById(orderId: string): Order | undefined {
    const orders = this.getOrders();
    return orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
  },

  /**
   * Creates and persists a new order with Lifetime Attribution & 5-Level Commission Generation
   */
  async createOrder(params: {
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    deliveryMethod: DeliveryMethod;
    paymentSummary: PaymentSummary;
    subtotal: number;
    discount: number;
    promoCode?: string;
    shippingFee: number;
    total: number;
    attributedRep?: {
      name: string;
      repUsername: string;
    };
    userId?: string;
  }): Promise<Order> {
    // Simulating realistic backend order creation latency (350ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    const customerEmail = params.shippingAddress.email?.toLowerCase().trim() || '';
    const customerName = params.shippingAddress.fullName || 'Valued Customer';

    // 1. Resolve Lifetime Attribution:
    // If customer already has a permanent assigned representative, use that permanent representative!
    let finalAttributedRep = params.attributedRep;
    const attributionResolution = await attributionService.resolveAttributionForCheckout({
      customerEmail,
      userId: params.userId,
      currentSessionRep: params.attributedRep?.repUsername,
    });

    if (attributionResolution.repUsername) {
      const repDetails = representativeService.lookupRepresentative(attributionResolution.repUsername);
      finalAttributedRep = {
        name: repDetails?.name || attributionResolution.repUsername,
        repUsername: attributionResolution.repUsername,
      };
    }

    const orderId = generateOrderId();
    const createdAtIso = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      createdAt: createdAtIso,
      status: 'processing',
      trackingNumber: generateTrackingNumber(),
      estimatedDeliveryDate: params.deliveryMethod.estimatedDeliveryDate,
      items: params.items,
      shippingAddress: params.shippingAddress,
      deliveryMethod: params.deliveryMethod,
      paymentSummary: params.paymentSummary,
      subtotal: params.subtotal,
      discount: params.discount,
      promoCode: params.promoCode,
      shippingFee: params.shippingFee,
      total: params.total,
      attributedRep: finalAttributedRep,
    };

    // 2. Persist to Local Storage
    const existing = this.getOrders();
    const updated = [newOrder, ...existing];

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ilovesurprises_orders_updated'));
      } catch (err) {
        console.error('Failed to save order to localStorage', err);
      }
    }

    // 3. Persist to Supabase Database (orders table)
    try {
      let repProfileUuid: string | null = null;
      if (finalAttributedRep?.repUsername) {
        try {
          const { data: repProf } = await supabase
            .from('profiles')
            .select('id')
            .eq('rep_username', finalAttributedRep.repUsername.toLowerCase().trim())
            .maybeSingle();
          if (repProf?.id) {
            repProfileUuid = repProf.id;
          }
        } catch {
          // fallback
        }
      }

      await supabase.from('orders').insert({
        id: newOrder.id,
        user_id: params.userId || null,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        shipping_fee: newOrder.shippingFee,
        total: newOrder.total,
        status: newOrder.status,
        payment_method: newOrder.paymentSummary.method,
        payment_status: 'paid',
        shipping_address: {
          ...(newOrder.shippingAddress as unknown as Record<string, unknown>),
          attributed_rep: finalAttributedRep?.repUsername || null,
        } as any,
        delivery_method: newOrder.deliveryMethod as any,
        estimated_delivery_date: newOrder.estimatedDeliveryDate || null,
        tracking_number: newOrder.trackingNumber,
        attributed_rep_id: repProfileUuid,
        notes: finalAttributedRep?.repUsername ? `rep:${finalAttributedRep.repUsername}` : null,
        created_at: createdAtIso,
      });

      // Insert order items
      if (params.items && params.items.length > 0) {
        const itemInserts = params.items.map((item) => ({
          order_id: newOrder.id,
          product_id: item.product.id,
          quantity: item.quantity,
          selected_surprise_option: item.selectedSurpriseOption || null,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
        }));
        await supabase.from('order_items').insert(itemInserts);
      }
    } catch (err) {
      console.warn('Supabase order creation sync warning:', err);
    }

    // 4. Generate 5-Level MLM Commissions (Idempotent & Lifetime Assured)
    if (finalAttributedRep && params.subtotal > 0) {
      const primaryProductName = params.items.length > 0 ? params.items[0].product.name : 'Candle Order';
      try {
        await commissionService.processOrderCommissions({
          orderId: newOrder.id,
          orderAmount: params.subtotal,
          customerName,
          customerEmail,
          userId: params.userId,
          productName: primaryProductName,
          sessionRepUsername: finalAttributedRep.repUsername,
        });
      } catch (commErr) {
        console.error('Commission processing warning:', commErr);
      }
    }

    return newOrder;
  },

  /**
   * Updates order status (useful for mock testing)
   */
  updateOrderStatus(orderId: string, status: OrderStatus): Order | undefined {
    const orders = this.getOrders();
    const target = orders.find((o) => o.id === orderId);
    if (!target) return undefined;

    target.status = status;
    if (typeof window !== 'undefined') {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('ilovesurprises_orders_updated'));
    }
    return target;
  },
};

