import type { Order, OrderStatus, OrderItem, ShippingAddress, DeliveryMethod, PaymentSummary } from '../types';

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
   * Creates and persists a new order
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
  }): Promise<Order> {
    // Simulating realistic backend order creation latency (450ms)
    await new Promise((resolve) => setTimeout(resolve, 450));

    const newOrder: Order = {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
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
      attributedRep: params.attributedRep,
    };

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
