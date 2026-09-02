import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Layers,
  BarChart2,
  Calendar,
  Flame,
  Info,
} from 'lucide-react';

interface ChartPoint {
  label: string;
  shortLabel: string;
  personal: number; // 20% personal sales earnings
  team: number; // 5-level tier overrides
  orders: number;
}

const MONTHLY_DATA: ChartPoint[] = [
  { label: 'October 2025', shortLabel: 'Oct 2025', personal: 180, team: 90, orders: 22 },
  { label: 'November 2025', shortLabel: 'Nov 2025', personal: 290, team: 150, orders: 36 },
  { label: 'December 2025', shortLabel: 'Dec 2025', personal: 620, team: 380, orders: 78 },
  { label: 'January 2026', shortLabel: 'Jan 2026', personal: 420, team: 260, orders: 48 },
  { label: 'February 2026', shortLabel: 'Feb 2026', personal: 540, team: 340, orders: 64 },
  { label: 'March 2026', shortLabel: 'Mar 2026', personal: 680, team: 420, orders: 86 },
];

const WEEKLY_DATA: ChartPoint[] = [
  { label: 'Week 1 (Mar 1-7)', shortLabel: 'Week 1', personal: 140, team: 85, orders: 18 },
  { label: 'Week 2 (Mar 8-14)', shortLabel: 'Week 2', personal: 190, team: 115, orders: 24 },
  { label: 'Week 3 (Mar 15-21)', shortLabel: 'Week 3', personal: 165, team: 100, orders: 21 },
  { label: 'Week 4 (Mar 22-28)', shortLabel: 'Week 4', personal: 220, team: 145, orders: 29 },
];

const DAILY_DATA: ChartPoint[] = [
  { label: 'Monday', shortLabel: 'Mon', personal: 45, team: 25, orders: 5 },
  { label: 'Tuesday', shortLabel: 'Tue', personal: 38, team: 20, orders: 4 },
  { label: 'Wednesday', shortLabel: 'Wed', personal: 62, team: 38, orders: 7 },
  { label: 'Thursday', shortLabel: 'Thu', personal: 52, team: 30, orders: 6 },
  { label: 'Friday', shortLabel: 'Fri', personal: 84, team: 54, orders: 10 },
  { label: 'Saturday', shortLabel: 'Sat', personal: 98, team: 68, orders: 12 },
  { label: 'Sunday', shortLabel: 'Sun', personal: 90, team: 60, orders: 11 },
];

export const EarningsChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [viewStyle, setViewStyle] = useState<'stacked' | 'grouped'>('stacked');
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  const data =
    timeframe === 'monthly'
      ? MONTHLY_DATA
      : timeframe === 'weekly'
      ? WEEKLY_DATA
      : DAILY_DATA;

  // Compute max values for responsive scaling
  const maxCombinedVal = Math.max(...data.map((d) => d.personal + d.team), 100);
  const maxSingleVal = Math.max(...data.map((d) => Math.max(d.personal, d.team)), 100);
  const maxVal = viewStyle === 'stacked' ? maxCombinedVal : maxSingleVal;

  const totalPeriodEarnings = data.reduce((sum, d) => sum + d.personal + d.team, 0);
  const totalPersonalEarnings = data.reduce((sum, d) => sum + d.personal, 0);
  const totalTeamEarnings = data.reduce((sum, d) => sum + d.team, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  // Peak earning period
  const peakPeriod = [...data].sort((a, b) => b.personal + b.team - (a.personal + a.team))[0];

  return (
    <div className="bg-gradient-to-b from-white via-[#fffdfd] to-[#fff8fb] rounded-[20px] sm:rounded-[28px] p-4 sm:p-7 lg:p-9 border-2 border-[#f5cad7] shadow-[0_12px_36px_rgba(236,47,115,0.06)] space-y-4 sm:space-y-7 relative overflow-hidden">
      {/* Soft Ambient Backlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#ec2f73]/8 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Toolbar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-[#f5eaf1]">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#ec2f73] bg-[#fff0f5] px-2.5 sm:px-3 py-1 rounded-full border border-[#f5cad7] inline-flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Revenue & Commission Analytics</span>
            </span>

            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● Live Real-Time Ledger
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black text-[#141219] m-0 font-display">
            Personal & 5-Tier Downline Revenue Growth
          </h3>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1">
            Total Revenue in Selected Period: <strong className="text-emerald-700 font-black">${totalPeriodEarnings.toFixed(2)}</strong> across <strong className="text-[#141219] font-bold">{totalOrders} customer orders</strong>
          </p>
        </div>

        {/* Controls: Timeframe + Bar View Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-start lg:self-auto w-full sm:w-auto">
          {/* View Mode (Stacked vs Grouped) */}
          <div className="flex items-center gap-1 bg-[#fffafc] p-1 rounded-[12px] sm:rounded-[13px] border border-[#eedbe6] shadow-2xs flex-1 sm:flex-initial justify-center">
            <button
              type="button"
              onClick={() => setViewStyle('stacked')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[9px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-initial ${
                viewStyle === 'stacked'
                  ? 'bg-[#ec2f73] text-white font-black shadow-xs'
                  : 'text-[#55505a] hover:text-[#ec2f73]'
              }`}
              title="Stacked Pillar View"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Stacked</span>
            </button>

            <button
              type="button"
              onClick={() => setViewStyle('grouped')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[9px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-initial ${
                viewStyle === 'grouped'
                  ? 'bg-[#ec2f73] text-white font-black shadow-xs'
                  : 'text-[#55505a] hover:text-[#ec2f73]'
              }`}
              title="Side-by-Side Comparison"
            >
              <BarChart2 className="w-3.5 h-3.5 shrink-0" />
              <span>Side-by-Side</span>
            </button>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#fffafc] p-1 rounded-[12px] sm:rounded-[13px] border border-[#eedbe6] shadow-2xs flex-1 sm:flex-initial justify-center">
            <button
              type="button"
              onClick={() => {
                setTimeframe('daily');
                setActiveHoverIndex(null);
              }}
              className={`px-2 sm:px-3 py-1.5 rounded-[9px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                timeframe === 'daily'
                  ? 'bg-[#141219] text-white font-black shadow-xs'
                  : 'text-[#55505a] hover:text-[#ec2f73]'
              }`}
            >
              7 Days
            </button>

            <button
              type="button"
              onClick={() => {
                setTimeframe('weekly');
                setActiveHoverIndex(null);
              }}
              className={`px-2 sm:px-3 py-1.5 rounded-[9px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                timeframe === 'weekly'
                  ? 'bg-[#141219] text-white font-black shadow-xs'
                  : 'text-[#55505a] hover:text-[#ec2f73]'
              }`}
            >
              4 Weeks
            </button>

            <button
              type="button"
              onClick={() => {
                setTimeframe('monthly');
                setActiveHoverIndex(null);
              }}
              className={`px-2 sm:px-3 py-1.5 rounded-[9px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                timeframe === 'monthly'
                  ? 'bg-[#141219] text-white font-black shadow-xs'
                  : 'text-[#55505a] hover:text-[#ec2f73]'
              }`}
            >
              6 Months
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Personal Sales Card */}
        <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-white to-[#fff0f5] border-2 border-[#f5cad7] shadow-xs flex items-center justify-between group hover:border-[#ec2f73] transition-all">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-gradient-to-tr from-[#ec2f73] to-[#ff4785] text-white flex items-center justify-center shadow-xs shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black text-[#ec2f73] block">
                Personal 20% Direct Sales
              </span>
              <strong className="text-base sm:text-xl font-black text-[#141219]">
                ${totalPersonalEarnings.toFixed(2)}
              </strong>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-black text-[#ec2f73] bg-white px-2 sm:px-2.5 py-1 rounded-full border border-[#f5cad7] shadow-2xs shrink-0">
            {((totalPersonalEarnings / totalPeriodEarnings) * 100).toFixed(0)}%
          </span>
        </div>

        {/* 5-Tier Overrides Card */}
        <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-white to-[#fbf5ff] border-2 border-purple-200 shadow-xs flex items-center justify-between group hover:border-purple-400 transition-all">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black text-purple-800 block">
                5-Tier Overrides (1-5%)
              </span>
              <strong className="text-base sm:text-xl font-black text-[#141219]">
                ${totalTeamEarnings.toFixed(2)}
              </strong>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-black text-purple-800 bg-white px-2 sm:px-2.5 py-1 rounded-full border border-purple-200 shadow-2xs shrink-0">
            {((totalTeamEarnings / totalPeriodEarnings) * 100).toFixed(0)}%
          </span>
        </div>

        {/* Momentum & Peak Card */}
        <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-white to-[#f0fdf4] border-2 border-emerald-200 shadow-xs flex items-center justify-between group hover:border-emerald-400 transition-all">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black text-emerald-800 block">
                Peak Velocity
              </span>
              <strong className="text-base sm:text-xl font-black text-[#141219]">
                ${(peakPeriod.personal + peakPeriod.team).toFixed(2)}
              </strong>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 sm:px-2.5 py-1 rounded-full shrink-0">
            ★ {peakPeriod.shortLabel}
          </span>
        </div>
      </div>

      {/* 3. The World-Class Interactive Bar Chart Canvas */}
      <div className="bg-white rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-6 lg:p-7 border border-[#eedbe6] shadow-inner space-y-3 sm:space-y-4">
        {/* Chart Legend */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap text-xs pb-3 border-b border-[#f5eaf1]">
          <div className="flex items-center gap-3 sm:gap-4 font-bold text-[#55505a] flex-wrap text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] sm:rounded-[6px] bg-gradient-to-t from-[#ec2f73] to-[#ff4785] shadow-xs shrink-0" />
              <span className="text-[#141219]">Personal Direct (20%)</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] sm:rounded-[6px] bg-gradient-to-t from-purple-700 to-indigo-500 shadow-xs shrink-0" />
              <span className="text-[#141219]">5-Tier Overrides (1-5%)</span>
            </div>
          </div>

          <span className="text-[10px] sm:text-[11px] text-[#8a858f] font-medium hidden md:inline-flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#ec2f73]" />
            <span>Tap any bar for full tier breakdown</span>
          </span>
        </div>

        {/* Scrollable Stage Wrapper on Ultra-Small Screens */}
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
          <div className="relative pt-6 pb-2 min-w-[320px] sm:min-w-full">
            {/* Y-Axis Horizontal Grid Reference Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-60">
              <div className="border-b border-dashed border-[#ecdbe6] w-full flex items-center justify-end pr-2 text-[9px] font-mono text-[#8a858f]">
                ${maxVal.toFixed(0)}
              </div>
              <div className="border-b border-dashed border-[#ecdbe6] w-full flex items-center justify-end pr-2 text-[9px] font-mono text-[#8a858f]">
                ${(maxVal * 0.75).toFixed(0)}
              </div>
              <div className="border-b border-dashed border-[#ecdbe6] w-full flex items-center justify-end pr-2 text-[9px] font-mono text-[#8a858f]">
                ${(maxVal * 0.5).toFixed(0)}
              </div>
              <div className="border-b border-dashed border-[#ecdbe6] w-full flex items-center justify-end pr-2 text-[9px] font-mono text-[#8a858f]">
                ${(maxVal * 0.25).toFixed(0)}
              </div>
              <div className="border-b border-stone-200 w-full" />
            </div>

            {/* Bars Stage */}
            <div className="h-56 sm:h-76 flex items-end justify-between gap-2 sm:gap-6 px-2 sm:px-6 relative z-10">
              {data.map((item, idx) => {
                const total = item.personal + item.team;
                const totalHeightPercent = (total / maxVal) * 100;
                const personalHeightPercent = (item.personal / maxVal) * 100;
                const teamHeightPercent = (item.team / maxVal) * 100;

                const personalRatio = (item.personal / total) * 100;
                const teamRatio = (item.team / total) * 100;

                const isHovered = activeHoverIndex === idx;

                return (
                  <div
                    key={item.label}
                    onClick={() => setActiveHoverIndex(isHovered ? null : idx)}
                    onMouseEnter={() => setActiveHoverIndex(idx)}
                    onMouseLeave={() => setActiveHoverIndex(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer select-none"
                  >
                    {/* Floating Luxury Tooltip Card */}
                    {isHovered && (
                      <div className="absolute -top-24 sm:-top-22 z-30 bg-[#141219]/95 backdrop-blur-lg text-white p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] shadow-[0_16px_40px_rgba(0,0,0,0.35)] text-xs whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none border border-white/15 min-w-[170px] sm:min-w-[200px]">
                        {/* Tooltip Header */}
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10 text-[9px] sm:text-[10px] text-[#f4d1e2]">
                          <span className="font-bold flex items-center gap-1 truncate max-w-[110px]">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>{item.shortLabel}</span>
                          </span>
                          <span className="bg-white/10 px-1.5 py-0.5 rounded-full font-mono shrink-0">
                            {item.orders} Orders
                          </span>
                        </div>

                        {/* Tooltip Breakdown */}
                        <div className="space-y-0.5 sm:space-y-1 text-[10px] sm:text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-pink-300">
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ec2f73]" />
                              <span>Direct:</span>
                            </span>
                            <strong className="text-white font-mono">${item.personal.toFixed(2)}</strong>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-purple-300">
                              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500" />
                              <span>Overrides:</span>
                            </span>
                            <strong className="text-white font-mono">${item.team.toFixed(2)}</strong>
                          </div>

                          <div className="pt-1 mt-0.5 border-t border-white/10 flex items-center justify-between">
                            <span className="font-black text-emerald-400">Total:</span>
                            <strong className="text-emerald-400 font-mono font-black text-[11px] sm:text-xs">
                              ${total.toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* Tooltip Arrow */}
                        <div className="w-2.5 h-2.5 bg-[#141219] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-white/15" />
                      </div>
                    )}

                    {/* Floating Total Value Pill directly over top of bar */}
                    <div
                      className={`mb-1.5 sm:mb-2 transition-all duration-200 text-[9px] sm:text-[11px] font-black font-mono px-1.5 sm:px-2 py-0.5 rounded-full shadow-2xs ${
                        isHovered
                          ? 'bg-[#ec2f73] text-white scale-110 shadow-md'
                          : 'bg-white/90 text-[#141219] border border-[#eedbe6]'
                      }`}
                    >
                      ${total.toFixed(0)}
                    </div>

                    {/* Light Pillar Track Column */}
                    <div className="w-full max-w-[48px] sm:max-w-[56px] h-full flex items-end justify-center bg-[#fff8fb]/70 rounded-t-[14px] sm:rounded-t-[18px] p-1 sm:p-1.5 transition-all group-hover:bg-[#fff0f5]">
                      {viewStyle === 'stacked' ? (
                        /* Mode 1: 3D Stacked Pillar */
                        <div
                          className={`w-full rounded-t-[10px] sm:rounded-t-[14px] overflow-hidden transition-all duration-300 flex flex-col-reverse shadow-md relative ${
                            isHovered
                              ? 'scale-103 shadow-[0_10px_24px_rgba(236,47,115,0.35)] brightness-105'
                              : ''
                          }`}
                          style={{ height: `${Math.max(14, totalHeightPercent)}%` }}
                        >
                          {/* Top Gloss Highlight Cap */}
                          <div className="absolute top-0 inset-x-0 h-1 bg-white/40 z-10" />

                          {/* Personal Tier (Bottom Stack) */}
                          <div
                            className="bg-gradient-to-t from-[#ec2f73] via-[#ff3b7d] to-[#ff5388] transition-all relative"
                            style={{ height: `${personalRatio}%` }}
                          />

                          {/* Team Overrides Tier (Top Stack) */}
                          <div
                            className="bg-gradient-to-t from-purple-700 via-purple-600 to-indigo-500 transition-all border-b border-white/20"
                            style={{ height: `${teamRatio}%` }}
                          />
                        </div>
                      ) : (
                        /* Mode 2: Side-by-Side Dual Pillars */
                        <div className="w-full h-full flex items-end justify-center gap-1 sm:gap-1.5">
                          {/* Personal Bar */}
                          <div
                            className="flex-1 rounded-t-[8px] sm:rounded-t-[10px] bg-gradient-to-t from-[#ec2f73] to-[#ff4785] transition-all duration-300 relative shadow-xs"
                            style={{ height: `${Math.max(12, personalHeightPercent)}%` }}
                          >
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-white/50" />
                          </div>

                          {/* Team Overrides Bar */}
                          <div
                            className="flex-1 rounded-t-[8px] sm:rounded-t-[10px] bg-gradient-to-t from-purple-700 to-indigo-500 transition-all duration-300 relative shadow-xs"
                            style={{ height: `${Math.max(12, teamHeightPercent)}%` }}
                          >
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-white/50" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Label Tag */}
                    <div className="mt-2 text-center w-full">
                      <span className="block text-[9px] sm:text-xs font-bold text-[#55505a] truncate group-hover:text-[#ec2f73] transition-colors">
                        {item.shortLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Footer Note */}
        <div className="pt-3 border-t border-[#f5eaf1] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#716d77]">
          <span>
            Highest Earning Month: <strong className="text-[#141219]">{peakPeriod.label} (${(peakPeriod.personal + peakPeriod.team).toFixed(2)})</strong>
          </span>
          <span className="text-emerald-700 font-bold">
            ✓ Automated Weekly Direct Payouts Active
          </span>
        </div>
      </div>
    </div>
  );
};
