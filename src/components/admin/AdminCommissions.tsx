import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import type { AdminCommissionRecord, CommissionLedgerStatus, AdminCommissionTierLevel } from '../../types/admin';

interface AdminCommissionsProps {
  commissions: AdminCommissionRecord[];
  onUpdateStatus: (id: string, status: CommissionLedgerStatus) => void;
  onBatchApprove: () => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminCommissions: React.FC<AdminCommissionsProps> = ({
  commissions,
  onUpdateStatus,
  onBatchApprove,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CommissionLedgerStatus>('all');
  const [tierFilter, setTierFilter] = useState<'all' | AdminCommissionTierLevel>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Approved Commission Rate Matrix
  const APPROVED_TIERS = [
    { label: 'Selling Representative', rate: '20%', badge: 'Direct Sale', color: 'text-[#D30915] bg-[#fff1f2] border-[#D30915]/20' },
    { label: 'Level 1 Downline', rate: '5%', badge: 'Tier 1 Sponsor', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { label: 'Level 2 Downline', rate: '4%', badge: 'Tier 2 Leader', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { label: 'Level 3 Downline', rate: '3%', badge: 'Tier 3 Partner', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { label: 'Level 4 Downline', rate: '2%', badge: 'Tier 4 Network', color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { label: 'Level 5 Downline', rate: '1%', badge: 'Tier 5 Infinity', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ];

  // Filter commissions
  const filtered = useMemo(() => {
    return commissions.filter((comm) => {
      const matchSearch =
        comm.repName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.repUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comm.customerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || comm.status === statusFilter;
      const matchTier = tierFilter === 'all' || comm.tier === tierFilter;

      return matchSearch && matchStatus && matchTier;
    });
  }, [commissions, searchQuery, statusFilter, tierFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingCount = commissions.filter((c) => c.status === 'pending').length;
  const pendingAmount = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const getStatusBadge = (status: CommissionLedgerStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
            <Clock className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
      case 'reversed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
            <RotateCcw className="w-3 h-3" />
            <span>Reversed</span>
          </span>
        );
    }
  };

  const handleBatchApproveClick = () => {
    onBatchApprove();
    onShowToast(`Batch approved all pending commission entries!`, {
      title: 'Ledger Updated',
      type: 'success',
    });
  };

  const handleExportCSV = () => {
    onShowToast('Exporting commission ledger to CSV file...', {
      title: 'Export Started',
      type: 'info',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Approved Tier Structure Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#D30915]" />
              <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
                Commission Central & Ledger
              </h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                35% Max Distribution Cap
              </span>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Verified 5-tier downline compensation, unilevel commission ledger, batch payouts, and clawback tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#eedbe6] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D30915]" />
              <span>Export Ledger</span>
            </button>

            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleBatchApproveClick}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve All Pending ({pendingCount} • ${pendingAmount.toFixed(2)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Approved Commission Tier Matrix Visual Grid */}
        <div className="bg-[#faf7f9] p-3 sm:p-4 rounded-2xl border border-[#eedbe6] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#141219] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D30915]" />
              <span>Approved Multi-Tier Commission Schedule</span>
            </span>
            <span className="text-[11px] font-bold text-[#D30915]">
              20% + 5% + 4% + 3% + 2% + 1% = 35%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {APPROVED_TIERS.map((tier) => (
              <div
                key={tier.label}
                className={`p-2.5 rounded-xl bg-white border ${tier.color} text-center space-y-0.5`}
              >
                <span className="block text-[10px] font-extrabold uppercase text-[#716d77] truncate">
                  {tier.badge}
                </span>
                <span className="block text-lg font-black text-[#141219] hero-title-font">
                  {tier.rate}
                </span>
                <span className="block text-[10px] text-[#716d77] truncate font-medium">
                  {tier.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#eedbe6] shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search rep, order #ILS, or customer..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
          />
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | CommissionLedgerStatus);
              setCurrentPage(1);
            }}
            className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] font-medium focus:outline-none focus:border-[#D30915] cursor-pointer"
          >
            <option value="all">All Ledger Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved for Payout</option>
            <option value="paid">Paid & Settled</option>
            <option value="reversed">Reversed / Refund Clawback</option>
          </select>
        </div>

        <div>
          <select
            value={tierFilter}
            onChange={(e) => {
              const val = e.target.value;
              setTierFilter(val === 'all' || val === 'selling_rep' ? val : (parseInt(val, 10) as AdminCommissionTierLevel));
              setCurrentPage(1);
            }}
            className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] font-medium focus:outline-none focus:border-[#D30915] cursor-pointer"
          >
            <option value="all">All Tiers (Direct & L1–L5)</option>
            <option value="selling_rep">Selling Rep (20%)</option>
            <option value="1">Level 1 (5%)</option>
            <option value="2">Level 2 (4%)</option>
            <option value="3">Level 3 (3%)</option>
            <option value="4">Level 4 (2%)</option>
            <option value="5">Level 5 (1%)</option>
          </select>
        </div>
      </div>

      {/* 3. Commission Ledger Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141219]">
            <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Representative</th>
                <th className="py-3.5 px-3">Order & Customer</th>
                <th className="py-3.5 px-3">Tier Level</th>
                <th className="py-3.5 px-3">Order Volume</th>
                <th className="py-3.5 px-3">Commission Earned</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#716d77]">
                    <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#141219] m-0">No commissions matching filters</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fffbfd] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#141219]">{c.repName}</div>
                      <div className="text-[11px] text-[#D30915] font-bold">@{c.repUsername}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#141219]">{c.orderId}</div>
                      <div className="text-[11px] text-[#716d77]">{c.customerName}</div>
                      <div className="text-[10px] text-[#8a858f]">{c.date}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.tier === 'selling_rep'
                          ? 'bg-red-50 text-[#D30915] border border-red-200'
                          : 'bg-purple-50 text-[#54217f] border border-purple-200'
                      }`}>
                        {c.tierLabel}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold text-[#141219]">
                      ${c.orderAmount.toFixed(2)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-black text-xs text-[#141219]">
                        ${c.commissionAmount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#716d77]">{c.ratePercent}% payout</div>
                    </td>

                    <td className="py-3 px-3">{getStatusBadge(c.status)}</td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(c.id, 'approved');
                              onShowToast(`Commission #${c.id} approved.`, { type: 'success' });
                            }}
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {c.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(c.id, 'paid');
                              onShowToast(`Commission #${c.id} marked as Paid.`, { type: 'success' });
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        {c.status !== 'reversed' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(c.id, 'reversed');
                              onShowToast(`Commission #${c.id} reversed.`, { type: 'info' });
                            }}
                            className="px-2 py-1 rounded-lg border border-gray-200 hover:bg-rose-50 hover:text-rose-700 text-[11px] font-bold cursor-pointer text-[#716d77]"
                            title="Clawback / Reverse"
                          >
                            Reverse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#716d77]">
          <span>
            Page <strong className="text-[#141219]">{currentPage}</strong> of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#eedbe6] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#eedbe6] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mobile Responsive Cards View (< 768px) */}
      <div className="md:hidden space-y-3">
        {paginatedItems.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-[#eedbe6] p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-sm text-[#141219] block">{c.repName}</span>
                <span className="text-xs font-bold text-[#D30915]">@{c.repUsername}</span>
              </div>
              <div>{getStatusBadge(c.status)}</div>
            </div>

            <div className="bg-[#fdf8fa] rounded-xl p-2.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#716d77]">Order ID:</span>
                <span className="font-mono font-bold text-[#141219]">{c.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Tier Level:</span>
                <span className="font-bold text-[#54217f]">{c.tierLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Order Value:</span>
                <span className="font-bold text-[#141219]">${c.orderAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-100">
                <span className="text-[#716d77] font-bold">Commission Earned:</span>
                <span className="font-black text-[#D30915] text-sm">${c.commissionAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1">
              {c.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(c.id, 'approved')}
                  className="flex-1 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Approve
                </button>
              )}
              {c.status === 'approved' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(c.id, 'paid')}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Mark Paid
                </button>
              )}
              {c.status !== 'reversed' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(c.id, 'reversed')}
                  className="py-1.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-[#716d77]"
                >
                  Reverse
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
