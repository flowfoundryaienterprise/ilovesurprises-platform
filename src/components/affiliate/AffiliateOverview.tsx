import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Award,
  CreditCard,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calculator,
  Sliders,
  Flame,
} from 'lucide-react';
import type { AffiliateStats } from '../../types';

interface AffiliateOverviewProps {
  stats: AffiliateStats;
  onOpenWithdraw: () => void;
  onNavigateTab: (tab: any) => void;
}

export const AffiliateOverview: React.FC<AffiliateOverviewProps> = ({
  stats,
  onOpenWithdraw,
  onNavigateTab,
}) => {
  // Income Potential Simulator Sliders
  const [personalCandlesSold, setPersonalCandlesSold] = useState(20);
  const [level1Reps, setLevel1Reps] = useState(4);
  const [avgTeamCandlesSold, setAvgTeamCandlesSold] = useState(15);

  const CANDLE_AVG_PRICE = 39.99;

  const simulation = useMemo(() => {
    // 1. Personal Sales: 20%
    const personalVolume = personalCandlesSold * CANDLE_AVG_PRICE;
    const personalEarned = personalVolume * 0.20;

    // 2. Level 1 Overrides: 5% (level1Reps * avgTeamCandlesSold)
    const l1Volume = level1Reps * avgTeamCandlesSold * CANDLE_AVG_PRICE;
    const l1Earned = l1Volume * 0.05;

    // 3. Level 2 Overrides: 4% (Assuming each L1 sponsors 2 L2s)
    const l2Reps = level1Reps * 2;
    const l2Volume = l2Reps * avgTeamCandlesSold * CANDLE_AVG_PRICE;
    const l2Earned = l2Volume * 0.04;

    // 4. Level 3 Overrides: 3% (Assuming each L2 sponsors 2 L3s)
    const l3Reps = l2Reps * 2;
    const l3Volume = l3Reps * avgTeamCandlesSold * CANDLE_AVG_PRICE;
    const l3Earned = l3Volume * 0.03;

    // 5. Level 4 Overrides: 2%
    const l4Reps = l3Reps * 1.5;
    const l4Volume = l4Reps * avgTeamCandlesSold * CANDLE_AVG_PRICE;
    const l4Earned = l4Volume * 0.02;

    // 6. Level 5 Overrides: 1%
    const l5Reps = l4Reps * 1.5;
    const l5Volume = l5Reps * avgTeamCandlesSold * CANDLE_AVG_PRICE;
    const l5Earned = l5Volume * 0.01;

    const totalTeamEarned = l1Earned + l2Earned + l3Earned + l4Earned + l5Earned;
    const grandTotal = personalEarned + totalTeamEarned;
    const totalDownlineReps = Math.round(level1Reps + l2Reps + l3Reps + l4Reps + l5Reps);

    return {
      personalVolume,
      personalEarned,
      l1Earned,
      l2Earned,
      l3Earned,
      l4Earned,
      l5Earned,
      totalTeamEarned,
      grandTotal,
      totalDownlineReps,
    };
  }, [personalCandlesSold, level1Reps, avgTeamCandlesSold]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* 1. Top KPI Metrics Grid (2x2 on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Lifetime Earnings */}
        <div className="bg-white rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 border border-[#eedbe6] shadow-[0_4px_20px_rgba(50,31,63,0.03)] flex flex-col justify-between group hover:border-[#D30915]/40 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#716d77]">
              Total Earnings
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform shadow-xs shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="relative z-10">
            <strong className="text-lg sm:text-2xl lg:text-[28px] font-black text-[#141219] tracking-tight block truncate">
              ${stats.totalEarnings.toFixed(2)}
            </strong>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-emerald-700 font-bold mt-1 sm:mt-1.5 flex-wrap">
              <span className="bg-emerald-100 text-emerald-800 px-1.5 sm:px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 sm:gap-1">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                +18.4%
              </span>
              <span className="text-[#8a858f] hidden xs:inline">vs last month</span>
            </div>
          </div>
        </div>

        {/* Available Balance & Withdraw Button */}
        <div className="bg-gradient-to-br from-[#fff6fa] via-[#fff1f2] to-[#ffeef4] rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 border-2 border-[#fecdd3] shadow-[0_8px_24px_rgba(211, 9, 21,0.08)] flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D30915]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#D30915] flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Available</span>
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-[#D30915] text-white flex items-center justify-center shadow-xs shrink-0">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="relative z-10">
            <strong className="text-lg sm:text-2xl lg:text-[28px] font-black text-[#141219] tracking-tight block truncate">
              ${stats.availableBalance.toFixed(2)}
            </strong>

            <button
              type="button"
              onClick={onOpenWithdraw}
              className="mt-1.5 sm:mt-2.5 w-full h-[32px] sm:h-[38px] rounded-[10px] sm:rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(211, 9, 21,0.25)] transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-97"
            >
              <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Withdraw</span>
            </button>
          </div>
        </div>

        {/* Total & Active Referrals */}
        <div className="bg-white rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 border border-[#eedbe6] shadow-[0_4px_20px_rgba(50,31,63,0.03)] flex flex-col justify-between group hover:border-[#D30915]/40 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#716d77]">
              5-Tier Network
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 group-hover:scale-105 transition-transform shadow-xs shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="relative z-10">
            <strong className="text-lg sm:text-2xl lg:text-[28px] font-black text-[#141219] tracking-tight block truncate">
              {stats.totalReferrals} Reps
            </strong>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] text-purple-700 font-bold mt-1 sm:mt-1.5 flex-wrap">
              <span className="bg-purple-100 text-purple-900 px-1.5 sm:px-2 py-0.5 rounded-full font-black">
                {stats.activeReferrals} Active
              </span>
              <span className="text-[#8a858f] hidden xs:inline">across 5 tiers</span>
            </div>
          </div>
        </div>

        {/* Conversion Rate & Current Rank */}
        <div className="bg-white rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-5 lg:p-6 border border-[#eedbe6] shadow-[0_4px_20px_rgba(50,31,63,0.03)] flex flex-col justify-between group hover:border-[#D30915]/40 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2 sm:mb-3 relative z-10">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#716d77]">
              Current Rank
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 group-hover:scale-105 transition-transform shadow-xs shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="relative z-10">
            <strong className="text-sm sm:text-lg lg:text-xl font-black text-[#141219] truncate block">
              {stats.currentRank}
            </strong>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold mt-1 sm:mt-1.5 flex-wrap">
              <span className="text-amber-900 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-full font-black">
                {stats.conversionRate}%
              </span>
              <span className="text-[#8a858f]">conversion</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 5-Tier Compensation Overview Banner */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 lg:p-7 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5eaf1]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D30915]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Representative Plan Structure</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
              5-Level Sponsor Compensation & Overrides
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('tree')}
              className="h-[34px] sm:h-[36px] px-3.5 sm:px-4 rounded-[12px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer w-full sm:w-auto"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspect 5-Level Tree</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 6 Step Commission Tiles (2-col on mobile, 3-col on tablet, 6-col on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 text-center">
          {/* Personal */}
          <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-gradient-to-b from-[#fff1f2] to-[#ffeef4] border-2 border-[#D30915] shadow-xs flex flex-col justify-between">
            <span className="text-[9px] sm:text-[10px] uppercase font-black text-[#D30915] block">
              Personal Sales
            </span>
            <strong className="text-xl sm:text-2xl font-black text-[#D30915] block my-0.5 sm:my-1">20%</strong>
            <span className="text-[9px] text-[#716d77] font-medium">Direct Customer Orders</span>
          </div>

          {/* Level 1 */}
          <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-[#fffafc] border border-[#eedbe6] hover:border-[#D30915]/40 transition-colors flex flex-col justify-between">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-red-700 block">
              Level 1
            </span>
            <strong className="text-lg sm:text-xl font-black text-[#141219] block my-0.5 sm:my-1">5%</strong>
            <span className="text-[9px] text-[#716d77]">Direct Rep Referrals</span>
          </div>

          {/* Level 2 */}
          <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-[#fffafc] border border-[#eedbe6] hover:border-purple-300 transition-colors flex flex-col justify-between">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-purple-700 block">
              Level 2
            </span>
            <strong className="text-lg sm:text-xl font-black text-[#141219] block my-0.5 sm:my-1">4%</strong>
            <span className="text-[9px] text-[#716d77]">L1 Downlines</span>
          </div>

          {/* Level 3 */}
          <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-[#fffafc] border border-[#eedbe6] hover:border-blue-300 transition-colors flex flex-col justify-between">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-700 block">
              Level 3
            </span>
            <strong className="text-lg sm:text-xl font-black text-[#141219] block my-0.5 sm:my-1">3%</strong>
            <span className="text-[9px] text-[#716d77]">L2 Downlines</span>
          </div>

          {/* Level 4 */}
          <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-[#fffafc] border border-[#eedbe6] hover:border-amber-300 transition-colors flex flex-col justify-between">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-700 block">
              Level 4
            </span>
            <strong className="text-lg sm:text-xl font-black text-[#141219] block my-0.5 sm:my-1">2%</strong>
            <span className="text-[9px] text-[#716d77]">L3 Downlines</span>
          </div>

          {/* Level 5 */}
          <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-[#fffafc] border border-[#eedbe6] hover:border-emerald-300 transition-colors flex flex-col justify-between">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-700 block">
              Level 5
            </span>
            <strong className="text-lg sm:text-xl font-black text-[#141219] block my-0.5 sm:my-1">1%</strong>
            <span className="text-[9px] text-[#716d77]">L4 Downlines</span>
          </div>
        </div>

        {/* Max Payout Callout */}
        <div className="p-3 sm:p-3.5 rounded-[14px] sm:rounded-[16px] bg-gradient-to-r from-[#fff1f2] via-[#fff7fa] to-[#fbf4ff] border border-[#fecdd3] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-[#D30915]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D30915] shrink-0" />
            <span className="text-[11px] sm:text-xs">Maximum total multi-tier payout: <strong className="text-[#141219]">35%</strong> (20% Personal + 15% Overrides)</span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 self-start sm:self-auto shrink-0">
            100% Guaranteed Payouts
          </span>
        </div>
      </div>

      {/* 3. Interactive Rep Income Potential Simulator (Interactive WOW Feature) */}
      <div className="bg-gradient-to-br from-white via-[#fffcfd] to-[#fff5f9] rounded-[20px] sm:rounded-[24px] p-4 sm:p-7 lg:p-8 border border-[#fecdd3] shadow-[0_8px_30px_rgba(211, 9, 21,0.06)] space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[#f5eaf1]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D30915]">
              <Calculator className="w-3.5 h-3.5" />
              <span>Interactive Growth Simulator</span>
            </div>
            <h3 className="text-base sm:text-xl font-black text-[#141219] m-0 font-display">
              Calculate Your 5-Tier Monthly Earning Potential
            </h3>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Adjust sliders below to simulate your income based on personal customer sales and 5-tier team duplication.
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-[12px] sm:rounded-[14px] bg-[#fff1f2] border border-[#fecdd3] text-left sm:text-right">
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#716d77] block">Simulated Monthly Total</span>
            <strong className="text-xl sm:text-2xl font-black text-[#D30915]">
              ${simulation.grandTotal.toFixed(2)}/mo
            </strong>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
          {/* Slider 1: Personal Candle Sales */}
          <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-white border border-[#eedbe6] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#141219] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#D30915]" />
                <span>Your Direct Sales</span>
              </span>
              <span className="text-xs font-black text-[#D30915] bg-[#fff1f2] px-2.5 py-0.5 rounded-full border border-[#fecdd3]">
                {personalCandlesSold} Candles
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={personalCandlesSold}
              onChange={(e) => setPersonalCandlesSold(parseInt(e.target.value))}
              className="w-full accent-[#D30915] cursor-pointer touch-none"
            />
            <div className="flex items-center justify-between text-[10px] text-[#8a858f]">
              <span>1 Candle</span>
              <span className="text-emerald-700 font-bold">20% Direct: ${simulation.personalEarned.toFixed(2)}</span>
              <span>100</span>
            </div>
          </div>

          {/* Slider 2: Level 1 Reps Sponsored */}
          <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-white border border-[#eedbe6] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#141219] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Direct Reps Sponsored</span>
              </span>
              <span className="text-xs font-black text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                {level1Reps} Reps (L1)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={level1Reps}
              onChange={(e) => setLevel1Reps(parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer touch-none"
            />
            <div className="flex items-center justify-between text-[10px] text-[#8a858f]">
              <span>1 Rep</span>
              <span className="text-purple-700 font-bold">5% L1: ${simulation.l1Earned.toFixed(2)}</span>
              <span>20</span>
            </div>
          </div>

          {/* Slider 3: Average Candles per Team Rep */}
          <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-white border border-[#eedbe6] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#141219] flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Avg Candles per Rep</span>
              </span>
              <span className="text-xs font-black text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {avgTeamCandlesSold} Candles/Rep
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={avgTeamCandlesSold}
              onChange={(e) => setAvgTeamCandlesSold(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer touch-none"
            />
            <div className="flex items-center justify-between text-[10px] text-[#8a858f]">
              <span>5</span>
              <span className="text-blue-700 font-bold">Team Volume: ~{simulation.totalDownlineReps} Reps</span>
              <span>50</span>
            </div>
          </div>
        </div>

        {/* Breakdown Results Strip (2x2 on mobile, 4-col on desktop) */}
        <div className="p-3 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-white border border-[#eedbe6] grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#716d77] block">Personal 20% Profit</span>
            <strong className="text-xs sm:text-base font-black text-[#D30915]">
              +${simulation.personalEarned.toFixed(2)}
            </strong>
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#716d77] block">5-Tier Overrides (1-5%)</span>
            <strong className="text-xs sm:text-base font-black text-purple-700">
              +${simulation.totalTeamEarned.toFixed(2)}
            </strong>
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#716d77] block">Total Downline Reps</span>
            <strong className="text-xs sm:text-base font-black text-[#141219]">
              ~{simulation.totalDownlineReps} Reps
            </strong>
          </div>
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#716d77] block">Projected Annual Run-Rate</span>
            <strong className="text-xs sm:text-base font-black text-emerald-700">
              ${(simulation.grandTotal * 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
