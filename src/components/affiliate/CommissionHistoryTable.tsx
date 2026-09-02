import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import type { CommissionRecord, CommissionTierLevel, CommissionStatus } from '../../types';
import { AffiliateCustomSelect, type AffiliateSelectOption } from './AffiliateCustomSelect';

interface CommissionHistoryTableProps {
  commissions: CommissionRecord[];
}

const LEVEL_OPTIONS: AffiliateSelectOption[] = [
  { value: 'all', label: 'All Levels (1-5 + Personal)' },
  { value: 'personal', label: 'Personal Direct', badge: '20%', badgeColor: 'bg-[#fff0f5] text-[#ec2f73]' },
  { value: '1', label: 'Level 1 Direct', badge: '5%', badgeColor: 'bg-pink-50 text-pink-700' },
  { value: '2', label: 'Level 2 Sponsor', badge: '4%', badgeColor: 'bg-purple-50 text-purple-700' },
  { value: '3', label: 'Level 3 Sponsor', badge: '3%', badgeColor: 'bg-blue-50 text-blue-700' },
  { value: '4', label: 'Level 4 Sponsor', badge: '2%', badgeColor: 'bg-amber-50 text-amber-700' },
  { value: '5', label: 'Level 5 Sponsor', badge: '1%', badgeColor: 'bg-emerald-50 text-emerald-700' },
];

const STATUS_OPTIONS: AffiliateSelectOption[] = [
  { value: 'all', label: 'All Payout Statuses' },
  { value: 'paid', label: 'Paid & Transferred', badge: 'Paid', badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
  { value: 'processing', label: 'Processing Payout', badge: 'Processing', badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200' },
  { value: 'pending', label: 'Pending Hold', badge: '30-Day Hold', badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200' },
];

export const CommissionHistoryTable: React.FC<CommissionHistoryTableProps> = ({
  commissions,
}) => {
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.orderId.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.productName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedLevel !== 'all') {
        if (selectedLevel === 'personal' && c.level !== 'personal') return false;
        if (selectedLevel !== 'personal' && c.level !== parseInt(selectedLevel)) return false;
      }

      if (selectedStatus !== 'all' && c.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [commissions, search, selectedLevel, selectedStatus]);

  const totalFilteredEarned = useMemo(() => {
    return filteredCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  }, [filteredCommissions]);

  const handleExportCSV = () => {
    const headers = ['Record ID', 'Order ID', 'Date', 'Customer', 'Product', 'Tier Level', 'Order Amount', 'Commission Rate', 'Commission Amount', 'Status'];
    const rows = filteredCommissions.map((c) => [
      c.id,
      c.orderId,
      c.orderDate,
      `"${c.customerName}"`,
      `"${c.productName}"`,
      `"${c.levelLabel}"`,
      c.orderAmount.toFixed(2),
      `${(c.commissionRate * 100).toFixed(0)}%`,
      c.commissionAmount.toFixed(2),
      c.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ILoveSurprises_Commissions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: CommissionStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Paid</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase text-blue-800 bg-blue-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Processing</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Pending Hold</span>
          </span>
        );
    }
  };

  const getTierPill = (level: CommissionTierLevel) => {
    if (level === 'personal') {
      return (
        <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#ec2f73] bg-[#fff0f5] px-2 py-0.5 rounded-md border border-[#f5cad7]">
          Personal 20%
        </span>
      );
    }
    return (
      <span className="text-[9px] sm:text-[10px] font-black uppercase text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
        Level {level} ({level === 1 ? '5%' : level === 2 ? '4%' : level === 3 ? '3%' : level === 4 ? '2%' : '1%'})
      </span>
    );
  };

  return (
    <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-7 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] space-y-4 animate-in fade-in duration-200">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5eaf1]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#ec2f73]">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Commissions Ledger</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
            Detailed Commission Earnings History
          </h3>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Total Filtered Payout: <strong className="text-emerald-700 font-black">${totalFilteredEarned.toFixed(2)}</strong> ({filteredCommissions.length} transactions)
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={filteredCommissions.length === 0}
          className="h-[36px] sm:h-[38px] px-3.5 sm:px-4 rounded-[12px] bg-white border border-[#eedbe6] hover:border-[#ec2f73] text-[#55505a] hover:text-[#ec2f73] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-50 w-full sm:w-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters & Search Row with Custom Luxury Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, customer name, or scent..."
            className="w-full h-[40px] sm:h-[42px] pl-9 pr-8 rounded-[13px] bg-white border border-[#eedbe6] focus:border-[#ec2f73] focus:ring-2 focus:ring-[#ec2f73]/10 text-xs text-[#141219] outline-none shadow-2xs transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Custom Level Filter Dropdown */}
        <div className="sm:col-span-4">
          <AffiliateCustomSelect
            options={LEVEL_OPTIONS}
            value={selectedLevel}
            onChange={setSelectedLevel}
            icon={<Filter className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Custom Status Filter Dropdown */}
        <div className="sm:col-span-3">
          <AffiliateCustomSelect
            options={STATUS_OPTIONS}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
        </div>
      </div>

      {/* Content Area */}
      {filteredCommissions.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-[18px] bg-[#fffafc] border border-dashed border-[#eedbe6]">
          <DollarSign className="w-10 h-10 text-[#d9cbd5] mx-auto mb-2" />
          <h4 className="text-sm font-black text-[#141219] mb-1">No Commissions Matching Filters</h4>
          <p className="text-xs text-[#716d77]">
            Try adjusting your search keywords or tier level dropdown.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (< md) */}
          <div className="block md:hidden space-y-2.5">
            {filteredCommissions.map((record) => (
              <div
                key={record.id}
                className="p-3.5 rounded-[16px] bg-[#fffcfd] border border-[#eedbe6] space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-[#141219]">
                    {record.orderId}
                  </span>
                  {getStatusBadge(record.status)}
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-[#141219] block">
                      {record.customerName}
                    </span>
                    <span className="text-[11px] text-[#716d77]">
                      {record.productName}
                    </span>
                  </div>
                  <div className="text-right">
                    <strong className="font-black text-sm text-emerald-700 block">
                      +${record.commissionAmount.toFixed(2)}
                    </strong>
                    <span className="text-[10px] text-[#8a858f]">
                      ${record.orderAmount.toFixed(2)} order
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#f5eaf1] flex items-center justify-between text-[10px]">
                  {getTierPill(record.level)}
                  <span className="text-[#8a858f]">{record.orderDate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto rounded-[18px] border border-[#eedbe6]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fff5f9] border-b border-[#eedbe6] text-[#716d77] font-black uppercase text-[10px] tracking-wider">
                  <th className="p-3 pl-4">Order / Date</th>
                  <th className="p-3">Customer & Scent</th>
                  <th className="p-3">Sponsor Level</th>
                  <th className="p-3 text-right">Order Total</th>
                  <th className="p-3 text-right">Commission</th>
                  <th className="p-3 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7eff4]">
                {filteredCommissions.map((record) => (
                  <tr key={record.id} className="hover:bg-[#fffafc] transition-colors">
                    <td className="p-3 pl-4">
                      <span className="font-mono font-bold text-[#141219] block">
                        {record.orderId}
                      </span>
                      <span className="text-[10px] text-[#8a858f]">
                        {record.orderDate}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-[#141219] block">
                        {record.customerName}
                      </span>
                      <span className="text-[10px] text-[#716d77] truncate max-w-[180px] block">
                        {record.productName}
                      </span>
                    </td>

                    <td className="p-3">
                      {getTierPill(record.level)}
                    </td>

                    <td className="p-3 text-right font-medium text-[#55505a]">
                      ${record.orderAmount.toFixed(2)}
                    </td>

                    <td className="p-3 text-right">
                      <strong className="font-black text-emerald-700 block">
                        +${record.commissionAmount.toFixed(2)}
                      </strong>
                      <span className="text-[10px] text-[#8a858f]">
                        ({(record.commissionRate * 100).toFixed(0)}%)
                      </span>
                    </td>

                    <td className="p-3 pr-4 text-right">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
