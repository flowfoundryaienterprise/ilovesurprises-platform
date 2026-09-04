import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import type { AdminReportData } from '../../types/admin';

interface AdminReportsProps {
  reportData: AdminReportData;
  onTimeframeChange: (timeframe: '7d' | '30d' | '90d' | 'ytd') => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  reportData,
  onTimeframeChange,
  onShowToast,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');

  const handleTimeframeClick = (tf: '7d' | '30d' | '90d' | 'ytd') => {
    setSelectedTimeframe(tf);
    onTimeframeChange(tf);
    onShowToast(`Report updated for timeframe: ${tf.toUpperCase()}`, { type: 'info' });
  };

  const handleExport = (format: 'CSV' | 'PDF') => {
    onShowToast(`Generating official ${format} executive analytics report...`, {
      title: 'Report Download Started',
      type: 'success',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D30915]" />
              <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
                Analytics, Financials & Reports
              </h2>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Omnichannel sales revenue, shopper conversion funnels, membership MRR, and network commission liabilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Buttons */}
            <div className="flex items-center bg-[#faf7f9] border border-[#eedbe6] p-1 rounded-xl">
              {(['7d', '30d', '90d', 'ytd'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => handleTimeframeClick(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    selectedTimeframe === tf
                      ? 'bg-[#D30915] text-white shadow-2xs'
                      : 'text-[#716d77] hover:text-[#141219]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleExport('CSV')}
                className="px-3 py-2 rounded-xl bg-white border border-[#eedbe6] hover:border-[#D30915] text-xs font-bold text-[#141219] hover:text-[#D30915] transition-all flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D30915]" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('PDF')}
                className="px-3 py-2 rounded-xl bg-[#fff1f2] border border-[#f0d0e2] text-xs font-bold text-[#D30915] hover:bg-[#ffe5ef] transition-all flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Highlights 4-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-[#716d77]">Gross Sales ({selectedTimeframe.toUpperCase()})</span>
          <div className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font">
            ${reportData.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Net Sales: ${reportData.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-[#716d77]">Traffic & Conversion</span>
          <div className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font">
            {reportData.conversionRate}%
          </div>
          <div className="text-[11px] text-[#716d77] font-medium">
            From {reportData.visitors.toLocaleString()} unique web sessions
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-[#716d77]">Membership MRR</span>
          <div className="text-2xl sm:text-3xl font-black text-[#54217f] hero-title-font">
            ${reportData.membershipMRR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#716d77] font-medium">
            Across {reportData.activeRepresentatives} active subscribers
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-1">
          <span className="text-xs font-bold text-[#716d77]">Commission Liability</span>
          <div className="text-2xl sm:text-3xl font-black text-[#D30915] hero-title-font">
            ${reportData.commissionLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">
            ${reportData.totalPayoutsDisbursed.toLocaleString('en-US')} already disbursed
          </div>
        </div>
      </div>

      {/* 3. Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales by Day Chart */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                Revenue Trajectory
              </h3>
              <p className="text-xs text-[#716d77] m-0">Day-by-day gross merchandise volume</p>
            </div>
            <span className="text-xs font-bold text-[#D30915]">AOV: ${reportData.averageOrderValue}</span>
          </div>

          <div className="pt-4 h-52 flex items-end justify-between gap-2 px-2 pb-2 border-b border-gray-100">
            {reportData.salesByDay.map((pt) => (
              <div key={pt.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-bold text-[#716d77] opacity-0 group-hover:opacity-100 transition-opacity">
                  ${(pt.sales / 1000).toFixed(1)}k
                </span>
                <div
                  style={{ height: `${(pt.sales / 10000) * 100}%` }}
                  className="w-full max-w-[36px] bg-gradient-to-t from-[#D30915] to-[#ff7fa9] rounded-t-lg group-hover:brightness-110 transition-all"
                />
                <span className="text-xs font-bold text-[#55505a]">{pt.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic by Day Chart */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                Shopper Sessions vs Checkouts
              </h3>
              <p className="text-xs text-[#716d77] m-0">Traffic volume driving catalog reveals</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              4.7% Avg Conversion
            </span>
          </div>

          <div className="pt-4 h-52 flex items-end justify-between gap-2 px-2 pb-2 border-b border-gray-100">
            {reportData.trafficByDay.map((pt) => (
              <div key={pt.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-bold text-[#716d77] opacity-0 group-hover:opacity-100 transition-opacity">
                  {pt.visitors}
                </span>
                <div
                  style={{ height: `${(pt.visitors / 12000) * 100}%` }}
                  className="w-full max-w-[36px] bg-gradient-to-t from-[#54217f] to-[#8d42d3] rounded-t-lg group-hover:brightness-110 transition-all"
                />
                <span className="text-xs font-bold text-[#55505a]">{pt.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Tier Breakdown & Membership Revenue Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Commission Tier Distribution Table */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
              Commission Distribution by Tier
            </h3>
            <span className="text-xs font-bold text-emerald-700">35% Program Total</span>
          </div>

          <div className="space-y-2 text-xs">
            {reportData.tierDistribution.map((td) => (
              <div
                key={td.tier}
                className="p-2.5 rounded-xl bg-[#faf7f9] border border-[#f0e2ec] flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-[#141219]">{td.tier} ({td.rate})</div>
                  <div className="text-[11px] text-[#716d77]">{td.percentage}% of all commissions paid</div>
                </div>
                <div className="font-black text-sm text-[#141219]">
                  ${td.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Membership Plan Breakdown */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
              Subscription Plan Breakdown
            </h3>
            <span className="text-xs font-bold text-[#D30915]">Recurring Revenue</span>
          </div>

          <div className="space-y-2 text-xs">
            {reportData.membershipBreakdown.map((mb) => (
              <div
                key={mb.plan}
                className="p-3 rounded-xl bg-[#faf7f9] border border-[#f0e2ec] flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-[#141219]">{mb.plan}</div>
                  <div className="text-[11px] text-[#716d77]">{mb.count} active subscribers enrolled</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm text-[#D30915]">
                    ${mb.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#716d77]">Plan volume</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
