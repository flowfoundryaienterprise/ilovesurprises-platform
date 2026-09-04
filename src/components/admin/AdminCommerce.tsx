import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Tag,
  RotateCcw,
  X,
} from 'lucide-react';
import type {
  AdminProductItem,
  AdminCollectionItem,
  AdminCustomerItem,
  AdminRefundRecord,
  AdminDiscountCode,
} from '../../types/admin';

interface AdminCommerceProps {
  products: AdminProductItem[];
  collections: AdminCollectionItem[];
  customers: AdminCustomerItem[];
  refunds: AdminRefundRecord[];
  discounts: AdminDiscountCode[];
  onProcessRefund: (refund: Omit<AdminRefundRecord, 'id' | 'requestedAt' | 'status'>) => void;
  onCreateDiscount: (discount: Omit<AdminDiscountCode, 'id' | 'usageCount'>) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export type CommerceSubTab = 'products' | 'collections' | 'customers' | 'refunds' | 'discounts';

export const AdminCommerce: React.FC<AdminCommerceProps> = ({
  products,
  collections,
  customers,
  refunds,
  discounts,
  onProcessRefund,
  onCreateDiscount,
  onShowToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CommerceSubTab>('products');
  const [searchQuery, setSearchQuery] = useState('');

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundOrderNumber, setRefundOrderNumber] = useState('ILS-89104-US');
  const [refundCustomerName, setRefundCustomerName] = useState('Sarah Jenkins');
  const [refundCustomerEmail, setRefundCustomerEmail] = useState('sarah.j@yahoo.com');
  const [refundAmount, setRefundAmount] = useState('49.99');
  const [refundReason, setRefundReason] = useState('Customer changed mind - returned intact');
  const [refundRestock, setRefundRestock] = useState(true);

  // Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('15');
  const [minSpend, setMinSpend] = useState('35');
  const [maxUsage, setMaxUsage] = useState('500');

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const handleCreateRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrderNumber || !refundAmount) return;

    onProcessRefund({
      orderId: refundOrderNumber,
      customerName: refundCustomerName,
      customerEmail: refundCustomerEmail,
      amount: parseFloat(refundAmount) || 0,
      reason: refundReason,
      restocked: refundRestock,
      approvedBy: 'Commerce Lead',
    });

    onShowToast(`Refund of $${refundAmount} recorded for order #${refundOrderNumber}!`, {
      title: 'Refund Executed',
      type: 'success',
    });

    setIsRefundModalOpen(false);
  };

  const handleCreateDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode) return;

    onCreateDiscount({
      code: promoCode.trim().toUpperCase(),
      discountPercent: parseInt(discountPercent, 10) || 10,
      minSpend: parseFloat(minSpend) || 0,
      maxUsage: parseInt(maxUsage, 10) || undefined,
      expiresAt: '2026-12-31',
      active: true,
    });

    onShowToast(`Promo code ${promoCode.toUpperCase()} activated!`, {
      title: 'Promo Created',
      type: 'success',
    });

    setPromoCode('');
    setIsDiscountModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Navigation Pills */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D30915]" />
              <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
                Commerce & Merchandising
              </h2>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Catalog items, inventory thresholds, customer registry, orders refund ledger, and promotional discount codes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'refunds' && (
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Issue Order Refund</span>
              </button>
            )}

            {activeSubTab === 'discounts' && (
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Promo Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs switch */}
        <div className="flex items-center gap-1.5 border-b border-[#f0e2ec] pb-1 overflow-x-auto">
          {[
            { id: 'products', label: 'Products & Inventory', count: products.length },
            { id: 'collections', label: 'Collections', count: collections.length },
            { id: 'customers', label: 'Customers', count: customers.length },
            { id: 'refunds', label: 'Refunds & Returns', count: refunds.length },
            { id: 'discounts', label: 'Discounts & Codes', count: discounts.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as CommerceSubTab)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeSubTab === tab.id
                  ? 'bg-[#D30915] text-white shadow-xs'
                  : 'text-[#55505a] hover:bg-[#fff1f2] hover:text-[#D30915]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  activeSubTab === tab.id ? 'bg-white text-[#D30915]' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab 1: Products & Inventory */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#eedbe6] shadow-xs">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog by name, category, or SKU..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
              />
              <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="text-xs text-[#716d77]">
              Total Products: <strong className="text-[#141219]">{filteredProducts.length}</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#eedbe6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#141219]">
                <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-3">SKU & Category</th>
                    <th className="py-3.5 px-3">Price</th>
                    <th className="py-3.5 px-3">Surprise Included</th>
                    <th className="py-3.5 px-3">Stock Level</th>
                    <th className="py-3.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fffbfd] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#eedbe6] shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-[#141219] block truncate max-w-[220px]">
                              {p.name}
                            </span>
                            {p.isBestSeller && (
                              <span className="text-[9px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-1 py-0.2 rounded">
                                Best Seller
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono text-xs text-[#716d77]">{p.sku}</div>
                        <div className="text-xs font-bold text-[#54217f]">{p.category}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-black text-xs text-[#141219]">${p.price.toFixed(2)}</div>
                        {p.originalPrice && (
                          <div className="text-[10px] text-[#8a858f] line-through">
                            ${p.originalPrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-purple-50 text-purple-700 border border-purple-200">
                          {p.surpriseType}
                        </span>
                        {p.surpriseValue && (
                          <div className="text-[10px] text-[#716d77] truncate max-w-[150px] mt-0.5">
                            {p.surpriseValue}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-[#141219]">{p.stock} units</span>
                          {p.stock < p.lowStockThreshold && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Collections */}
      {activeSubTab === 'collections' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-[#eedbe6] p-4 shadow-xs flex items-center gap-4 hover:border-[#D30915] transition-all"
            >
              <img
                src={c.image}
                alt={c.name}
                className="w-16 h-16 rounded-2xl object-cover border border-[#eedbe6] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-[#141219] m-0 truncate">{c.name}</h4>
                  {c.featured && (
                    <span className="text-[9px] font-bold text-[#D30915] bg-[#fff1f2] px-1.5 py-0.2 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#716d77] m-0 mt-0.5 truncate">{c.tagline}</p>
                <div className="text-[11px] font-bold text-[#D30915] mt-2">
                  {c.productCount} Active Surprise Products
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab 3: Customers */}
      {activeSubTab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#eedbe6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#141219]">
                <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-3">Phone</th>
                    <th className="py-3.5 px-3">Referred By</th>
                    <th className="py-3.5 px-3">Orders Count</th>
                    <th className="py-3.5 px-3">Lifetime Value</th>
                    <th className="py-3.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-[#fffbfd] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#141219]">{cust.name}</div>
                        <div className="text-[11px] text-[#716d77]">{cust.email}</div>
                      </td>
                      <td className="py-3 px-3 text-[#716d77]">{cust.phone}</td>
                      <td className="py-3 px-3">
                        {cust.repReferredBy ? (
                          <span className="text-xs font-bold text-[#D30915]">@{cust.repReferredBy}</span>
                        ) : (
                          <span className="text-xs text-[#8a858f]">Organic / Direct</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#141219]">{cust.ordersCount} orders</td>
                      <td className="py-3 px-3 font-black text-[#141219]">
                        ${cust.totalSpent.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Refunds & Returns */}
      {activeSubTab === 'refunds' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#eedbe6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#141219]">
                <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-3">Customer</th>
                    <th className="py-3.5 px-3">Refund Amount</th>
                    <th className="py-3.5 px-3">Reason</th>
                    <th className="py-3.5 px-3">Restocked?</th>
                    <th className="py-3.5 px-3">Approved By</th>
                    <th className="py-3.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fffbfd] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#141219]">{r.orderId}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#141219]">{r.customerName}</div>
                        <div className="text-[11px] text-[#716d77]">{r.customerEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-black text-rose-600">
                        ${r.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-[#716d77] max-w-[200px] truncate">{r.reason}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.restocked ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {r.restocked ? 'Restocked' : 'Scrapped'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#716d77]">{r.approvedBy || 'Admin'}</td>
                      <td className="py-3 px-3 text-[#8a858f]">{r.requestedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 5: Discounts & Codes */}
      {activeSubTab === 'discounts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {discounts.map((disc) => (
              <div
                key={disc.id}
                className="bg-white rounded-2xl border border-[#eedbe6] p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-base text-[#D30915] bg-[#fff1f2] px-2.5 py-1 rounded-xl border border-[#D30915]/20">
                    {disc.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    {disc.active ? 'Active' : 'Expired'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Discount:</span>
                    <span className="font-bold text-[#141219]">{disc.discountPercent}% OFF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Minimum Spend:</span>
                    <span className="font-bold text-[#141219]">${disc.minSpend.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Times Used:</span>
                    <span className="font-bold text-[#54217f]">{disc.usageCount} times</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Expires:</span>
                    <span className="font-bold text-[#141219]">{disc.expiresAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#eedbe6] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-base text-[#141219] hero-title-font m-0">
                  Process Order Refund
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-[#716d77] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRefundSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#141219] mb-1">Order Identifier</label>
                <input
                  type="text"
                  required
                  value={refundOrderNumber}
                  onChange={(e) => setRefundOrderNumber(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#141219] mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={refundCustomerName}
                    onChange={(e) => setRefundCustomerName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] focus:outline-none focus:border-[#D30915]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#141219] mb-1">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={refundCustomerEmail}
                    onChange={(e) => setRefundCustomerEmail(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] focus:outline-none focus:border-[#D30915]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#141219] mb-1">Refund Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#141219] mb-1">Refund Reason</label>
                <textarea
                  required
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#faf7f9] border border-[#eedbe6] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restock-item"
                  checked={refundRestock}
                  onChange={(e) => setRefundRestock(e.target.checked)}
                  className="accent-[#D30915] cursor-pointer"
                />
                <label htmlFor="restock-item" className="text-xs text-[#141219] cursor-pointer">
                  Return undamaged items to sellable inventory stock
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#716d77] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#eedbe6] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#D30915]" />
                <h3 className="font-black text-base text-[#141219] hero-title-font m-0">
                  Create Promotional Discount
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-[#716d77] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscountSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#141219] mb-1">Coupon Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH25, SPRINGREVEAL"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] uppercase font-mono font-bold focus:outline-none focus:border-[#D30915]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#141219] mb-1">Discount %</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] focus:outline-none focus:border-[#D30915]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#141219] mb-1">Min Spend ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] focus:outline-none focus:border-[#D30915]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#141219] mb-1">Maximum Usage Limit</label>
                <input
                  type="number"
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#716d77] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Activate Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
