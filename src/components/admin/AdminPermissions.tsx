import React from 'react';
import {
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import type { AdminRole, AdminTab } from '../../types/admin';
import { ADMIN_ROLES_CONFIG } from '../../services/adminService';

interface AdminPermissionsProps {
  currentRole: AdminRole;
  onSwitchRole: (role: AdminRole) => void;
  onNavigateTab: (tab: AdminTab) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminPermissions: React.FC<AdminPermissionsProps> = ({
  currentRole,
  onSwitchRole,
  onNavigateTab,
  onShowToast,
}) => {
  const ALL_ROLES: AdminRole[] = ['super_admin', 'store_manager', 'affiliate_manager', 'support_rep'];

  const PERMISSION_GROUPS: {
    tab: AdminTab;
    label: string;
    description: string;
  }[] = [
    { tab: 'overview', label: 'Executive Overview', description: 'Platform sales velocity, MRR, live activity feeds' },
    { tab: 'representatives', label: 'Representatives Management', description: 'Downline audit, approval/rejection, account suspension' },
    { tab: 'memberships', label: 'Memberships & Billing', description: '$19.99/mo, 6-mo & 12-mo plans, grace periods' },
    { tab: 'commerce', label: 'Commerce & Orders', description: 'Catalog products, collections, customers, refunds, discount promos' },
    { tab: 'commissions', label: 'Commissions & Ledger', description: '35% multi-tier distribution ledger, payouts, clawbacks' },
    { tab: 'reports', label: 'Analytics & Reports', description: 'Detailed sales reports, traffic conversion, MRR, CSV exports' },
    { tab: 'settings', label: 'System Configuration', description: 'Attribution windows, restricted usernames, starter kits, gateways' },
    { tab: 'permissions', label: 'Roles & Access Control', description: 'Role assignment, security privileges, role simulation' },
  ];

  const handleRoleSelect = (role: AdminRole) => {
    onSwitchRole(role);
    onShowToast(`Simulating session as: ${ADMIN_ROLES_CONFIG[role].name}`, {
      title: 'Role Switched',
      type: 'success',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Current Role Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D30915]" />
              <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
                Administrative Roles & RBAC Matrix
              </h2>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Granular role-based access control, privilege assignments, and interactive session simulation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#716d77] font-medium">Active Session Role:</span>
            <span className="px-3 py-1 rounded-xl bg-[#fff1f2] border border-[#f0d0e2] text-xs font-black text-[#D30915]">
              {ADMIN_ROLES_CONFIG[currentRole].name}
            </span>
          </div>
        </div>

        {/* Live Role Simulation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {ALL_ROLES.map((roleKey) => {
            const r = ADMIN_ROLES_CONFIG[roleKey];
            const isSelected = currentRole === roleKey;

            return (
              <div
                key={roleKey}
                onClick={() => handleRoleSelect(roleKey)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                  isSelected
                    ? 'border-[#D30915] bg-[#fffbfd] shadow-sm ring-2 ring-[#D30915]/10'
                    : 'border-[#eedbe6] bg-white hover:border-[#D30915]/50 hover:bg-[#faf7f9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-[#141219]">{r.name}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#D30915] animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-[#716d77] m-0 leading-relaxed">{r.description}</p>
                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                  <span className="text-[10px] font-bold text-[#D30915] uppercase">{r.badge}</span>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isSelected ? 'bg-[#D30915] text-white' : 'bg-gray-100 text-[#141219]'
                    }`}
                  >
                    {isSelected ? 'Active Role ✓' : 'Switch Here'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RBAC Permissions Matrix Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#eedbe6] flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
              Module Access Matrix
            </h3>
            <p className="text-xs text-[#716d77] m-0">
              Visual map of allowed sections per administrative profile.
            </p>
          </div>
          <span className="text-xs text-[#716d77] font-medium hidden sm:inline">
            Click any module to navigate directly
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141219]">
            <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Admin Module</th>
                <th className="py-3.5 px-3 text-center">Super Admin</th>
                <th className="py-3.5 px-3 text-center">Store Manager</th>
                <th className="py-3.5 px-3 text-center">Affiliate Director</th>
                <th className="py-3.5 px-3 text-center">Support Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {PERMISSION_GROUPS.map((group) => (
                <tr key={group.tab} className="hover:bg-[#fffbfd] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-sm text-[#141219] flex items-center gap-2">
                      <span>{group.label}</span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab(group.tab)}
                        className="text-[10px] text-[#D30915] font-bold hover:underline cursor-pointer"
                      >
                        (Preview Tab)
                      </button>
                    </div>
                    <div className="text-[11px] text-[#716d77]">{group.description}</div>
                  </td>

                  {/* Super Admin */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  </td>

                  {/* Store Manager */}
                  <td className="py-3.5 px-3 text-center">
                    {ADMIN_ROLES_CONFIG.store_manager.allowedTabs.includes(group.tab) ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                        <X className="w-4 h-4" />
                      </span>
                    )}
                  </td>

                  {/* Affiliate Manager */}
                  <td className="py-3.5 px-3 text-center">
                    {ADMIN_ROLES_CONFIG.affiliate_manager.allowedTabs.includes(group.tab) ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                        <X className="w-4 h-4" />
                      </span>
                    )}
                  </td>

                  {/* Support Rep */}
                  <td className="py-3.5 px-3 text-center">
                    {ADMIN_ROLES_CONFIG.support_rep.allowedTabs.includes(group.tab) ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                        <X className="w-4 h-4" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
