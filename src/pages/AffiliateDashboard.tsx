import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  DollarSign,
  Users,
  CreditCard,
  ArrowLeft,
  TrendingUp,
  Award,
  Copy,
  Check,
  Briefcase,
  Flame,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import type { UserProfile, AffiliateStats, CommissionRecord, PayoutRecord } from '../types';
import { affiliateService } from '../services/affiliateService';
import { AffiliateOverview } from '../components/affiliate/AffiliateOverview';
import { ReferralLinkCard } from '../components/affiliate/ReferralLinkCard';
import { EarningsChart } from '../components/affiliate/EarningsChart';
import { CommissionHistoryTable } from '../components/affiliate/CommissionHistoryTable';
import { ReferralTeamList } from '../components/affiliate/ReferralTeamList';
import { GenealogyTree } from '../components/affiliate/GenealogyTree';
import { WithdrawModal } from '../components/affiliate/WithdrawModal';
import { MarketingKitSection } from '../components/affiliate/MarketingKitSection';
import { AffiliateCustomSelect, type AffiliateSelectOption } from '../components/affiliate/AffiliateCustomSelect';

export type AffiliateTab = 'overview' | 'tree' | 'ledger' | 'team' | 'marketing';

interface AffiliateDashboardProps {
  user?: UserProfile | null;
  initialTab?: AffiliateTab;
  onNavigateToHome?: () => void;
  onNavigateToAccount?: () => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({
  user: _user,
  initialTab = 'overview',
  onNavigateToHome,
  onNavigateToAccount: _onNavigateToAccount,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AffiliateTab>(initialTab);
  const [stats, setStats] = useState<AffiliateStats>(() => affiliateService.getStats());
  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => affiliateService.getCommissions());
  const [payouts, setPayouts] = useState<PayoutRecord[]>(() => affiliateService.getPayouts());
  const [treeData] = useState(() => affiliateService.getGenealogyTree());
  const [flatMembers] = useState(() => affiliateService.getAllReferralsFlat());
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);

  // Sync listener for affiliate data updates
  useEffect(() => {
    const handleUpdate = () => {
      setStats(affiliateService.getStats());
      setCommissions(affiliateService.getCommissions());
      setPayouts(affiliateService.getPayouts());
    };

    window.addEventListener('ils_affiliate_updated', handleUpdate);
    return () => window.removeEventListener('ils_affiliate_updated', handleUpdate);
  }, []);

  const handleTabChange = (tab: AffiliateTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickCopyLink = async () => {
    const link = stats.referralLink || `https://8zhcds6b-5174.inc1.devtunnels.ms/shop?rep=${stats.repUsername}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setQuickCopied(true);
      onShowToast('Representative Store Link copied to clipboard! Share to earn 20% direct.', {
        title: 'Store Link Copied',
        type: 'success',
      });
      setTimeout(() => setQuickCopied(false), 2500);
    } catch {
      onShowToast('Link copied to clipboard!', { type: 'success' });
    }
  };

  // Rank progress calculation
  const nextRankTarget = 3000;
  const progressPercent = Math.min(100, Math.round((stats.totalEarnings / nextRankTarget) * 100));

  const tabOptions: AffiliateSelectOption[] = [
    {
      value: 'overview',
      label: 'Dashboard Overview',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      value: 'tree',
      label: '5-Level Genealogy Tree',
      badge: '5 Tiers',
      badgeColor: 'bg-purple-50 text-purple-700',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      value: 'ledger',
      label: 'Commissions History',
      badge: `${commissions.length}`,
      badgeColor: 'bg-[#fff0f5] text-[#ec2f73]',
      icon: <DollarSign className="w-3.5 h-3.5" />,
    },
    {
      value: 'team',
      label: 'Downline Team List',
      badge: `${stats.totalReferrals}`,
      badgeColor: 'bg-blue-50 text-blue-700',
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      value: 'marketing',
      label: 'Rep Toolkit & Media',
      badge: 'New',
      badgeColor: 'bg-amber-100 text-amber-900',
      icon: <Briefcase className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9fb] py-3 sm:py-8 lg:py-10 text-[#141219] overflow-x-hidden">
      <div className="max-w-[1460px] mx-auto px-2.5 sm:px-4 lg:px-6 space-y-4 sm:space-y-6">

        {/* 1. Header Banner & Rank Card */}
        <div className="bg-gradient-to-r from-[#fff0f5] via-[#fff7fa] to-[#fbf4ff] rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 lg:p-8 border border-[#eedbe6] shadow-[0_8px_30px_rgba(236,47,115,0.05)] relative overflow-hidden">
          {/* Soft Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#ec2f73]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {onNavigateToHome && (
                  <button
                    type="button"
                    onClick={onNavigateToHome}
                    className="h-7 px-2.5 rounded-full bg-white border border-[#eedbe6] hover:border-[#ec2f73] text-[#55505a] hover:text-[#ec2f73] text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Shop</span>
                  </button>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#f5cad7] text-[#ec2f73] text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#ec2f73]" />
                  <span>Representative & Partner Hub</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-black uppercase">
                  <Award className="w-3 h-3" />
                  <span>20% Direct + 5 Tiers Active</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#141219] font-display tracking-tight leading-tight m-0">
                Welcome to Your Representative & Partner Portal
              </h1>

              <p className="text-xs sm:text-sm text-[#55505a] max-w-2xl leading-relaxed m-0 font-medium">
                Earn <strong className="text-[#141219] font-black">20% on every customer candle order</strong> plus up to <strong className="text-purple-700 font-black">15% team override commissions</strong> across your 5-tier sponsor organization.
              </p>
            </div>

            {/* Quick Actions & Rank Milestone Meter */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleQuickCopyLink}
                  className="h-[40px] px-3.5 sm:px-4 rounded-[12px] bg-white hover:bg-[#fff0f5] text-[#141219] hover:text-[#ec2f73] border border-[#eedbe6] hover:border-[#f5cad7] font-black text-xs uppercase tracking-wider shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {quickCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#ec2f73]" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(true)}
                  className="h-[40px] px-4 sm:px-5 rounded-[12px] bg-[#ec2f73] hover:bg-[#d92467] text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(236,47,115,0.28)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Withdraw (${stats.availableBalance.toFixed(2)})</span>
                </button>
              </div>

              {/* Next Rank Progress Card */}
              <div className="bg-white/90 backdrop-blur-xs p-2.5 sm:p-3 rounded-[14px] border border-[#eedbe6] shadow-2xs w-full sm:w-72">
                <div className="flex items-center justify-between text-xs font-bold text-[#141219] mb-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Flame className="w-3.5 h-3.5 text-[#ec2f73]" />
                    <span>Next Rank: {stats.currentRank}</span>
                  </span>
                  <span className="text-purple-700 font-mono text-[11px]">{progressPercent}%</span>
                </div>

                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-[#ec2f73] to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#716d77]">
                  <span>${stats.totalEarnings.toFixed(0)} Earned</span>
                  <span className="text-[#ec2f73]">Goal: ${nextRankTarget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Mobile Quick Dropdown Selector (< sm) */}
        <div className="block sm:hidden">
          <label className="flex items-center gap-1 text-[11px] font-black uppercase text-[#716d77] mb-1.5">
            <Navigation className="w-3 h-3 text-[#ec2f73]" />
            <span>Select Dashboard View</span>
          </label>
          <AffiliateCustomSelect
            options={tabOptions}
            value={activeTab}
            onChange={(val) => handleTabChange(val as AffiliateTab)}
          />
        </div>

        {/* 3. Top Navigation Tabs Ribbon (Smooth horizontal desktop & tablet scroll) */}
        <div className="hidden sm:flex bg-white rounded-[18px] sm:rounded-[22px] p-1.5 sm:p-2.5 border border-[#eedbe6] shadow-[0_4px_18px_rgba(50,31,63,0.03)] items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory">
          {/* Tab: Overview */}
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 sm:px-5 py-2 sm:py-3 rounded-[13px] sm:rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 snap-start min-h-[40px] sm:min-h-[44px] ${
              activeTab === 'overview'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          {/* Tab: 5-Level Tree */}
          <button
            type="button"
            onClick={() => handleTabChange('tree')}
            className={`px-3.5 sm:px-5 py-2 sm:py-3 rounded-[13px] sm:rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 snap-start min-h-[40px] sm:min-h-[44px] ${
              activeTab === 'tree'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>5-Level Genealogy Tree</span>
            <span
              className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'tree' ? 'bg-white text-[#ec2f73]' : 'bg-[#fff0f5] text-[#ec2f73]'
              }`}
            >
              5 Tiers
            </span>
          </button>

          {/* Tab: Commissions Ledger */}
          <button
            type="button"
            onClick={() => handleTabChange('ledger')}
            className={`px-3.5 sm:px-5 py-2 sm:py-3 rounded-[13px] sm:rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 snap-start min-h-[40px] sm:min-h-[44px] ${
              activeTab === 'ledger'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Commissions History</span>
            <span
              className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'ledger' ? 'bg-white text-[#ec2f73]' : 'bg-[#fff0f5] text-[#ec2f73]'
              }`}
            >
              {commissions.length}
            </span>
          </button>

          {/* Tab: Team Roster */}
          <button
            type="button"
            onClick={() => handleTabChange('team')}
            className={`px-3.5 sm:px-5 py-2 sm:py-3 rounded-[13px] sm:rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 snap-start min-h-[40px] sm:min-h-[44px] ${
              activeTab === 'team'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Downline Team List</span>
            <span
              className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'team' ? 'bg-white text-[#ec2f73]' : 'bg-[#fff0f5] text-[#ec2f73]'
              }`}
            >
              {stats.totalReferrals}
            </span>
          </button>

          {/* Tab: Marketing Toolkit */}
          <button
            type="button"
            onClick={() => handleTabChange('marketing')}
            className={`px-3.5 sm:px-5 py-2 sm:py-3 rounded-[13px] sm:rounded-[15px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 snap-start min-h-[40px] sm:min-h-[44px] ${
              activeTab === 'marketing'
                ? 'bg-[#ec2f73] text-white shadow-[0_4px_14px_rgba(236,47,115,0.25)]'
                : 'hover:bg-[#fff0f5] text-[#55505a] hover:text-[#ec2f73]'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span>Rep Toolkit & Media</span>
            <span
              className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'marketing' ? 'bg-white text-[#ec2f73]' : 'bg-amber-100 text-amber-900'
              }`}
            >
              New
            </span>
          </button>
        </div>

        {/* 4. Dynamic Tab Content View */}
        <div className="space-y-4 sm:space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Referral Link Quick Share Card */}
              <ReferralLinkCard
                stats={stats}
                onUpdateStats={setStats}
                onShowToast={onShowToast}
              />

              {/* Overview Metrics Cards, 5-Tier Compensation Overview & Interactive Simulator */}
              <AffiliateOverview
                stats={stats}
                onOpenWithdraw={() => setIsWithdrawOpen(true)}
                onNavigateTab={handleTabChange}
              />

              {/* Interactive Performance Graph */}
              <EarningsChart />
            </>
          )}

          {activeTab === 'tree' && (
            <GenealogyTree
              treeData={treeData}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'ledger' && (
            <CommissionHistoryTable commissions={commissions} />
          )}

          {activeTab === 'team' && (
            <ReferralTeamList members={flatMembers} />
          )}

          {activeTab === 'marketing' && (
            <MarketingKitSection
              repUsername={stats.repUsername}
              referralLink={stats.referralLink}
              onShowToast={onShowToast}
            />
          )}
        </div>

        {/* 5. Trust Guarantee Footer Badge */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#eedbe6] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-black text-[#141219] block">
                Official I Love Surprises 5-Level Compensation Plan
              </strong>
              <span className="text-[11px] text-[#716d77]">
                Weekly automated direct withdrawals via PayPal & Bank Transfer with zero payout fees.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWithdrawOpen(true)}
            className="h-[38px] px-5 rounded-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Manage Payouts
          </button>
        </div>

        {/* Withdraw Balance Modal */}
        <WithdrawModal
          isOpen={isWithdrawOpen}
          stats={stats}
          payouts={payouts}
          onClose={() => setIsWithdrawOpen(false)}
          onUpdateStats={setStats}
          onUpdatePayouts={setPayouts}
          onShowToast={onShowToast}
        />

      </div>
    </div>
  );
};
