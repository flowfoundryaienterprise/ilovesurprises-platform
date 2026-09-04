import React, { useState, useEffect } from 'react';
import {
  Menu,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  AdminTab,
  AdminRole,
  AdminKPIs,
  AdminActivityItem,
  RepresentativeAdminRecord,
  MembershipAdminRecord,
  AdminProductItem,
  AdminCollectionItem,
  AdminCustomerItem,
  AdminRefundRecord,
  AdminDiscountCode,
  AdminCommissionRecord,
  AdminReportData,
  AdminSettingsData,
} from '../types/admin';
import { adminService, ADMIN_ROLES_CONFIG } from '../services/adminService';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminRepresentatives } from '../components/admin/AdminRepresentatives';
import { AdminMemberships } from '../components/admin/AdminMemberships';
import { AdminCommerce } from '../components/admin/AdminCommerce';
import { AdminCommissions } from '../components/admin/AdminCommissions';
import { AdminReports } from '../components/admin/AdminReports';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AdminPermissions } from '../components/admin/AdminPermissions';
import { AdminPermissionDenied } from '../components/admin/AdminPermissionDenied';
import { AdminKpiSkeleton, AdminTableSkeleton } from '../components/admin/AdminSkeleton';

interface AdminDashboardProps {
  initialTab?: AdminTab;
  onNavigateToHome: () => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialTab = 'overview',
  onNavigateToHome,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [currentRole, setCurrentRole] = useState<AdminRole>(() => adminService.getCurrentRole());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Live state from service
  const [kpis, setKpis] = useState<AdminKPIs>(() => adminService.getKPIs());
  const [activities, setActivities] = useState<AdminActivityItem[]>(() => adminService.getRecentActivity());
  const [representatives, setRepresentatives] = useState<RepresentativeAdminRecord[]>(() =>
    adminService.getRepresentatives()
  );
  const [memberships, setMemberships] = useState<MembershipAdminRecord[]>(() =>
    adminService.getMemberships()
  );
  const [products] = useState<AdminProductItem[]>(() => adminService.getCommerceProducts());
  const [collections] = useState<AdminCollectionItem[]>(() => adminService.getCollections());
  const [customers] = useState<AdminCustomerItem[]>(() => adminService.getCustomers());
  const [refunds, setRefunds] = useState<AdminRefundRecord[]>(() => adminService.getRefunds());
  const [discounts, setDiscounts] = useState<AdminDiscountCode[]>(() => adminService.getDiscounts());
  const [commissions, setCommissions] = useState<AdminCommissionRecord[]>(() =>
    adminService.getCommissionLedger()
  );
  const [reportData, setReportData] = useState<AdminReportData>(() => adminService.getReportsData('30d'));
  const [settings, setSettings] = useState<AdminSettingsData>(() => adminService.getSettings());

  // Subscribe to service updates
  useEffect(() => {
    const handleUpdate = () => {
      setCurrentRole(adminService.getCurrentRole());
      setKpis(adminService.getKPIs());
      setActivities(adminService.getRecentActivity());
      setRepresentatives(adminService.getRepresentatives());
      setMemberships(adminService.getMemberships());
      setRefunds(adminService.getRefunds());
      setDiscounts(adminService.getDiscounts());
      setCommissions(adminService.getCommissionLedger());
      setSettings(adminService.getSettings());
    };

    window.addEventListener('ils_admin_updated', handleUpdate);
    return () => window.removeEventListener('ils_admin_updated', handleUpdate);
  }, []);

  const handleTabSelect = (tab: AdminTab) => {
    setIsLoading(true);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser URL query if possible
    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({ view: 'admin', tab }, '', `/admin?tab=${tab}`);
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 180);
  };

  const handleSwitchRole = (newRole: AdminRole) => {
    adminService.setCurrentRole(newRole);
    setCurrentRole(newRole);
  };

  const handleUpdateRepStatus = (id: string, status: any) => {
    adminService.updateRepresentativeStatus(id, status);
  };

  const handleApproveRep = (id: string) => {
    adminService.approveRepresentative(id);
  };

  const handleRejectRep = (id: string) => {
    adminService.rejectRepresentative(id);
  };

  const handleUpdateMembershipStatus = (id: string, status: any) => {
    adminService.updateMembershipStatus(id, status);
  };

  const handleProcessRefund = (refund: Omit<AdminRefundRecord, 'id' | 'requestedAt' | 'status'>) => {
    adminService.processRefund(refund);
  };

  const handleCreateDiscount = (discount: Omit<AdminDiscountCode, 'id' | 'usageCount'>) => {
    adminService.createDiscount(discount);
  };

  const handleUpdateCommissionStatus = (id: string, status: any) => {
    adminService.updateCommissionStatus(id, status);
  };

  const handleBatchApproveCommissions = () => {
    adminService.batchApproveCommissions();
  };

  const handleTimeframeChange = (tf: any) => {
    setReportData(adminService.getReportsData(tf));
  };

  const handleSaveSettings = (newSettings: AdminSettingsData) => {
    adminService.saveSettings(newSettings);
  };

  const hasAccess = adminService.hasTabAccess(activeTab, currentRole);
  const currentRoleConfig = ADMIN_ROLES_CONFIG[currentRole];

  return (
    <div className="min-h-screen bg-[#fcf9fb] flex flex-col lg:flex-row text-[#141219] overflow-x-hidden">
      {/* 1. Sidebar Navigation (Desktop sticky, mobile drawer) */}
      <AdminSidebar
        currentTab={activeTab}
        currentRole={currentRole}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onSelectTab={handleTabSelect}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onSwitchRole={handleSwitchRole}
        onReturnToStore={onNavigateToHome}
        pendingCommissionsCount={commissions.filter((c) => c.status === 'pending').length}
        pendingRepsCount={representatives.filter((r) => r.approvalStatus === 'pending').length}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#eedbe6] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#eedbe6] text-[#716d77] hover:text-[#141219] hover:bg-gray-50 cursor-pointer"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-[#716d77] min-w-0">
              <span className="font-semibold hidden sm:inline">Admin</span>
              <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
              <span className="font-extrabold capitalize text-[#141219] truncate">
                {activeTab.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Role Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf7f9] border border-[#eedbe6] text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D30915]" />
              <span className="font-bold text-[#141219]">{currentRoleConfig.name}</span>
            </div>

            {/* Exit to Store Button */}
            <button
              type="button"
              onClick={onNavigateToHome}
              className="px-3 py-1.5 rounded-xl border border-[#eedbe6] hover:border-[#D30915] bg-white text-xs font-bold text-[#141219] hover:text-[#D30915] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </button>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1460px] w-full mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              <AdminKpiSkeleton />
              <AdminTableSkeleton rows={4} />
            </div>
          ) : !hasAccess ? (
            <AdminPermissionDenied
              requiredTab={activeTab}
              currentRole={currentRole}
              onSwitchRole={handleSwitchRole}
              onNavigateToOverview={() => handleTabSelect('overview')}
            />
          ) : (
            <>
              {activeTab === 'overview' && (
                <AdminOverview
                  kpis={kpis}
                  activities={activities}
                  onNavigateTab={handleTabSelect}
                  onShowToast={onShowToast}
                />
              )}

              {activeTab === 'representatives' && (
                <AdminRepresentatives
                  representatives={representatives}
                  onUpdateStatus={handleUpdateRepStatus}
                  onApprove={handleApproveRep}
                  onReject={handleRejectRep}
                  onShowToast={onShowToast}
                />
              )}

              {activeTab === 'memberships' && (
                <AdminMemberships
                  memberships={memberships}
                  onUpdateStatus={handleUpdateMembershipStatus}
                  onShowToast={onShowToast}
                />
              )}

              {activeTab === 'commerce' && (
                <AdminCommerce
                  products={products}
                  collections={collections}
                  customers={customers}
                  refunds={refunds}
                  discounts={discounts}
                  onProcessRefund={handleProcessRefund}
                  onCreateDiscount={handleCreateDiscount}
                  onShowToast={onShowToast}
                />
              )}

              {activeTab === 'commissions' && (
                <AdminCommissions
                  commissions={commissions}
                  onUpdateStatus={handleUpdateCommissionStatus}
                  onBatchApprove={handleBatchApproveCommissions}
                  onShowToast={onShowToast}
                />
              )}

              {activeTab === 'reports' && (
                <AdminReports
                  reportData={reportData}
                  onTimeframeChange={handleTimeframeChange}
                  onShowToast={onShowToast}
                />
              )}

              {activeTab === 'settings' && (
                <AdminSettings
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onShowToast={onShowToast}
                />
              )}

              {activeTab === 'permissions' && (
                <AdminPermissions
                  currentRole={currentRole}
                  onSwitchRole={handleSwitchRole}
                  onNavigateTab={handleTabSelect}
                  onShowToast={onShowToast}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
