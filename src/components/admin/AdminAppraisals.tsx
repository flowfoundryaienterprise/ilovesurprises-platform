import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Copy,
  Check,
  Tag,
  Trash2,
  Edit2,
  ExternalLink,
  Award,
  Filter,
  RefreshCw,
  X,
  Eye,
} from 'lucide-react';
import type { JewelryAppraisal, JewelryType, AppraisalStatus } from '../../types/appraisal';
import { appraisalService, APPRAISALS_UPDATED_EVENT } from '../../services/appraisalService';

interface AdminAppraisalsProps {
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

const PRESET_IMAGES = [
  { label: 'Diamond Solitaire Ring', url: '/assets/ilovesurprises/appraisals/diamond-solitaire-ring.jpg' },
  { label: 'Gold CZ Stud Earrings', url: '/assets/ilovesurprises/appraisals/gold-cz-stud-earrings.jpg' },
  { label: 'Sterling Silver Halo Ring', url: '/assets/ilovesurprises/appraisals/sterling-silver-halo-ring.jpg' },
  { label: 'Sapphire & Diamond Pendant', url: '/assets/ilovesurprises/appraisals/sapphire-halo-pendant.jpg' },
  { label: '14K Gold Tennis Bracelet', url: '/assets/ilovesurprises/appraisals/gold-tennis-bracelet.jpg' },
];

export const AdminAppraisals: React.FC<AdminAppraisalsProps> = ({ onShowToast }) => {
  const [appraisals, setAppraisals] = useState<JewelryAppraisal[]>(() =>
    appraisalService.getAllAppraisals()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<JewelryAppraisal | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelryAppraisal | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Ring' as JewelryType,
    estimatedValue: 0,
    image: PRESET_IMAGES[0].url,
    material: '',
    stone: '',
    cutSetting: '',
    description: '',
    status: 'active' as AppraisalStatus,
    serialNumber: '',
    inspectedDate: '',
    customerName: '',
    customerEmail: '',
    orderId: '',
    productName: '',
  });

  // Subscribe to service updates
  useEffect(() => {
    const handleUpdate = () => {
      setAppraisals(appraisalService.getAllAppraisals());
    };
    window.addEventListener(APPRAISALS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(APPRAISALS_UPDATED_EVENT, handleUpdate);
  }, []);

  // Filtered appraisals
  const filteredAppraisals = useMemo(() => {
    return appraisals.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        (item.stone && item.stone.toLowerCase().includes(q));

      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [appraisals, searchQuery, selectedType, selectedStatus]);

  // KPIs
  const totalCodes = appraisals.length;
  const activeCodes = appraisals.filter((a) => a.status === 'active').length;
  const totalValuePool = appraisals.reduce((acc, a) => acc + (a.status === 'active' ? a.estimatedValue : 0), 0);
  const avgValue = activeCodes > 0 ? totalValuePool / activeCodes : 0;

  const handleCopyCode = (codeToCopy: string, id: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedId(id);
    onShowToast(`Copied code "${codeToCopy}" to clipboard`, {
      title: 'Code Copied',
      type: 'success',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    const randSerial = `ILS-VAL-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData({
      code: '',
      name: '',
      type: 'Ring',
      estimatedValue: 250,
      image: PRESET_IMAGES[0].url,
      material: 'Solid .925 Sterling Silver',
      stone: 'AAA Cubic Zirconia',
      cutSetting: 'Four-Prong Solitaire',
      description: 'Handcrafted genuine fine jewelry surprise reveal.',
      status: 'active',
      serialNumber: randSerial,
      inspectedDate: 'March 2026',
      customerName: '',
      customerEmail: '',
      orderId: '',
      productName: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: JewelryAppraisal) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
      estimatedValue: item.estimatedValue,
      image: item.image,
      material: item.material,
      stone: item.stone || '',
      cutSetting: item.cutSetting || '',
      description: item.description,
      status: item.status,
      serialNumber: item.serialNumber,
      inspectedDate: item.inspectedDate,
      customerName: item.customerName || '',
      customerEmail: item.customerEmail || '',
      orderId: item.orderId || '',
      productName: item.productName || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveAppraisal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      alert('Please enter a jewelry code');
      return;
    }

    if (editingItem) {
      appraisalService.updateAppraisal(editingItem.id, {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        estimatedValue: Number(formData.estimatedValue),
        image: formData.image,
        material: formData.material,
        stone: formData.stone,
        cutSetting: formData.cutSetting,
        description: formData.description,
        status: formData.status,
        serialNumber: formData.serialNumber,
        inspectedDate: formData.inspectedDate,
        customerName: formData.customerName.trim() || undefined,
        customerEmail: formData.customerEmail.trim() || undefined,
        orderId: formData.orderId.trim() || undefined,
        productName: formData.productName.trim() || undefined,
      });

      onShowToast(`Appraisal code "${formData.code}" updated successfully.`, {
        title: 'Appraisal Updated',
        type: 'success',
      });
    } else {
      appraisalService.addAppraisal({
        code: formData.code,
        name: formData.name,
        type: formData.type,
        estimatedValue: Number(formData.estimatedValue),
        image: formData.image,
        material: formData.material,
        stone: formData.stone,
        cutSetting: formData.cutSetting,
        description: formData.description,
        status: formData.status,
        serialNumber: formData.serialNumber,
        inspectedDate: formData.inspectedDate,
        customerName: formData.customerName.trim() || undefined,
        customerEmail: formData.customerEmail.trim() || undefined,
        orderId: formData.orderId.trim() || undefined,
        productName: formData.productName.trim() || undefined,
      });

      onShowToast(`New appraisal code "${formData.code}" registered!`, {
        title: 'Appraisal Added',
        type: 'success',
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete appraisal code "${code}"?`)) {
      appraisalService.deleteAppraisal(id);
      onShowToast(`Appraisal code "${code}" removed.`, {
        title: 'Code Deleted',
        type: 'info',
      });
    }
  };

  const handleToggleStatus = (item: JewelryAppraisal) => {
    const newStatus = item.status === 'active' ? 'archived' : 'active';
    appraisalService.updateAppraisal(item.id, { status: newStatus });
    onShowToast(`Appraisal "${item.code}" status changed to ${newStatus}.`, {
      type: 'info',
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Clear all local appraisal records?')) {
      appraisalService.resetToDefaults();
      onShowToast('Appraisals catalog cleared.', {
        title: 'Records Cleared',
        type: 'info',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff0f3] text-[#D30915] text-[10px] font-black uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Candle Surprise Valuation Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight">
            Jewelry Appraisal Management
          </h1>
          <p className="text-xs sm:text-sm text-[#716d77]">
            Register and manage authentic jewelry codes printed inside candles for customer appraisal lookup.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="h-[40px] px-3.5 rounded-[12px] bg-white border border-[#eedbe6] hover:bg-stone-50 text-[#55505a] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Clear all local appraisal records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Records</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-[40px] px-4 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appraisal Code</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
            Registered Codes
          </span>
          <div className="text-2xl font-black text-[#141219]">{totalCodes}</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            {activeCodes} Active for Lookup
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
            Total Appraised Value Pool
          </span>
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] to-[#B60711]">
            ${totalValuePool.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-[#716d77] font-medium mt-1 block">
            Active items in circulation
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
            Average Item Value
          </span>
          <div className="text-2xl font-black text-[#141219]">
            ${avgValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-purple-600 font-bold mt-1 block">
            $35 to $7,500 Range
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
            Customer Portal Route
          </span>
          <a
            href="/appraise-your-jewelry"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-black text-[#D30915] hover:underline flex items-center gap-1 mt-1 truncate"
          >
            <span>/appraise-your-jewelry</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            ● Public Lookup Live
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-3 sm:p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, name, metal, gem..."
            className="w-full h-[40px] pl-10 pr-3.5 rounded-[12px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] focus:bg-white text-xs font-medium text-[#141219] outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#8a858f]" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-[38px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] text-xs font-bold text-[#141219] outline-none cursor-pointer"
            >
              <option value="all">All Jewelry Types</option>
              <option value="Ring">Rings</option>
              <option value="Necklace">Necklaces</option>
              <option value="Earrings">Earrings</option>
              <option value="Bracelet">Bracelets</option>
              <option value="Pendant">Pendants</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-[38px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] text-xs font-bold text-[#141219] outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
          </select>
        </div>
      </div>

      {/* 4. Appraisals Data Table */}
      <div className="rounded-[20px] bg-white border border-[#eedbe6] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto w-full max-w-full min-w-0 scrollbar-thin">
          <table className="w-full text-left text-xs text-[#141219] border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#f0e2ec] bg-[#fffafc] text-[10px] font-black uppercase tracking-wider text-[#716d77]">
                <th className="py-3 px-4">Jewelry Item</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Specs &amp; Materials</th>
                <th className="py-3 px-4">Retail Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4edf2]">
              {filteredAppraisals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#716d77]">
                    <Tag className="w-8 h-8 text-[#d3cad1] mx-auto mb-2" />
                    <p className="font-bold">{appraisals.length === 0 ? 'No appraisal records yet' : 'No appraisal records found'}</p>
                    <p className="text-[11px]">{appraisals.length === 0 ? 'Register authentic jewelry appraisal codes printed inside surprise candles for customer certificate verification.' : 'Try adjusting your search query or filter.'}</p>
                  </td>
                </tr>
              ) : (
                filteredAppraisals.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fff9fb] transition-colors">
                    {/* Item Thumbnail & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-11 h-11 rounded-[10px] object-cover bg-stone-100 border border-[#eedfe8] shrink-0"
                        />
                        <div className="min-w-0 max-w-[220px]">
                          <span className="font-bold text-[#141219] block truncate text-xs" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-[#8a858f] block truncate">
                            #{item.serialNumber} • {item.inspectedDate}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Code (Copyable) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#faf5f8] border border-[#f0dfec]">
                        <span className="font-mono font-black text-[#D30915] text-[11px]">{item.code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.code, item.id)}
                          className="text-[#8a858f] hover:text-[#D30915] transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">
                        <Award className="w-3 h-3 text-[#D30915]" />
                        <span>{item.type}</span>
                      </span>
                    </td>

                    {/* Specs & Material */}
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="text-[11px] font-medium text-[#332e38] truncate" title={item.material}>
                        {item.material}
                      </div>
                      {item.stone && (
                        <div className="text-[10px] text-[#8a858f] truncate" title={item.stone}>
                          {item.stone}
                        </div>
                      )}
                    </td>

                    {/* Value */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-sm font-black text-[#D30915]">
                        ${item.estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-600' : 'bg-stone-500'}`} />
                        <span>{item.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingCertificate(item)}
                          className="p-1.5 rounded-lg text-[#55505a] hover:text-[#D30915] hover:bg-[#fff0f3] transition-colors cursor-pointer"
                          title="View Official Certificate Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-[#55505a] hover:text-[#D30915] hover:bg-[#fff0f3] transition-colors cursor-pointer"
                          title="Edit Appraisal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.code)}
                          className="p-1.5 rounded-lg text-[#55505a] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add / Edit Appraisal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[24px] bg-white border border-[#eedbe6] shadow-2xl p-5 sm:p-7 relative animate-in fade-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] block mb-1">
                {editingItem ? 'Edit Existing Record' : 'Register New Item'}
              </span>
              <h2 className="text-xl font-black text-[#141219]">
                {editingItem ? 'Edit Jewelry Appraisal' : 'New Jewelry Appraisal Code'}
              </h2>
            </div>

            <form onSubmit={handleSaveAppraisal} className="space-y-4 text-xs font-bold text-[#141219]">
              {/* Code & Value Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Jewelry Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ILS-RUBY-500"
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] focus:bg-white text-xs font-mono font-black text-[#D30915] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Estimated Value ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] focus:bg-white text-xs font-black text-[#141219] outline-none"
                  />
                </div>
              </div>

              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Jewelry Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. 14K Gold CZ Halo Ring"
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] focus:bg-white text-xs font-medium text-[#141219] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Jewelry Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as JewelryType })}
                    className="w-full h-[40px] px-2.5 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] text-xs font-bold text-[#141219] outline-none"
                  >
                    <option value="Ring">Ring</option>
                    <option value="Necklace">Necklace</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Bracelet">Bracelet</option>
                    <option value="Pendant">Pendant</option>
                  </select>
                </div>
              </div>

              {/* Material & Stone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Precious Metal / Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="e.g. Solid .925 Sterling Silver"
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] text-xs font-medium text-[#141219] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Stone / Gemstone Details
                  </label>
                  <input
                    type="text"
                    value={formData.stone}
                    onChange={(e) => setFormData({ ...formData, stone: e.target.value })}
                    placeholder="e.g. AAA Cubic Zirconia"
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] text-xs font-medium text-[#141219] outline-none"
                  />
                </div>
              </div>

              {/* Image Preset Select */}
              <div>
                <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                  Jewelry Image Preset
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.url })}
                      className={`relative aspect-square rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer ${
                        formData.image === preset.url
                          ? 'border-[#D30915] ring-2 ring-[#D30915]/30'
                          : 'border-[#eedbe6] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Customer, Order, and Product Traceability */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                  Customer & Order Traceability (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase text-[#716d77] mb-1">Customer Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#e5dfe5] text-xs font-medium outline-none focus:border-[#D30915]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#716d77] mb-1">Customer Email</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#e5dfe5] text-xs font-medium outline-none focus:border-[#D30915]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase text-[#716d77] mb-1">Order Number / ID</label>
                    <input
                      type="text"
                      placeholder="e.g. ILS-89104-US"
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#e5dfe5] text-xs font-medium outline-none focus:border-[#D30915]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#716d77] mb-1">Source Candle / Product</label>
                    <input
                      type="text"
                      placeholder="e.g. Midnight Amber Cash Candle"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#e5dfe5] text-xs font-medium outline-none focus:border-[#D30915]"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                  Artisan Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the surprise piece revealed inside the candle..."
                  className="w-full p-2.5 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] text-xs font-medium text-[#141219] outline-none resize-none"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-[10px] uppercase text-[#716d77]">Status:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    className="accent-[#D30915]"
                  />
                  <span>Active (Visible in Lookup)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'archived'}
                    onChange={() => setFormData({ ...formData, status: 'archived' })}
                    className="accent-[#D30915]"
                  />
                  <span>Archived</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f4edf2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-[40px] px-4 rounded-[12px] border border-[#eedbe6] bg-white text-xs font-bold text-[#55505a] hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[40px] px-5 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  {editingItem ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Certificate Details Modal */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[28px] bg-white border-2 border-[#eedbe6] shadow-2xl p-6 sm:p-8 relative my-auto space-y-5">
            <button
              type="button"
              onClick={() => setViewingCertificate(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Certificate Header Banner */}
            <div className="text-center pb-4 border-b border-stone-100">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-2">
                <Award className="w-6 h-6 text-[#D30915]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D30915] block">
                Official Certification of Authenticity & Valuation
              </span>
              <h3 className="text-xl font-black text-[#141219] mt-0.5">
                {viewingCertificate.name}
              </h3>
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-stone-500 mt-1">
                <span>Cert #{viewingCertificate.serialNumber}</span>
                <span>•</span>
                <span className="font-bold text-[#D30915]">Code: {viewingCertificate.code}</span>
              </div>
            </div>

            {/* Certificate Card Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <img
                  src={viewingCertificate.image}
                  alt={viewingCertificate.name}
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">
                    Certified Estimated Replacement Value
                  </span>
                  <span className="text-2xl font-black text-[#D30915]">
                    ${viewingCertificate.estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5 font-medium">
                    Inspected: {viewingCertificate.inspectedDate}
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#fffbfd] p-3 rounded-2xl border border-[#eedbe6]">
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block">Material & Metal</span>
                  <span className="font-bold text-[#141219]">{viewingCertificate.material}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block">Stone & Clarity</span>
                  <span className="font-bold text-[#141219]">{viewingCertificate.stone || 'Natural Accents'}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-[#f7eff4]">
                  <span className="text-[10px] font-bold text-stone-500 block">Setting & Cut</span>
                  <span className="font-bold text-[#141219]">{viewingCertificate.cutSetting || 'Artisan Prong Setting'}</span>
                </div>
              </div>

              {/* Customer / Order / Product Traceability */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600 block">
                  Traceability & Record Connection
                </span>
                <div className="flex items-center justify-between text-stone-700">
                  <span className="text-stone-500">Linked Customer:</span>
                  <span className="font-bold text-[#141219]">
                    {viewingCertificate.customerName
                      ? `${viewingCertificate.customerName} (${viewingCertificate.customerEmail || ''})`
                      : 'Inventory Pool / Unclaimed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <span className="text-stone-500">Linked Order ID:</span>
                  <span className="font-mono font-bold text-[#D30915]">
                    {viewingCertificate.orderId || 'Stock Item'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <span className="text-stone-500">Source Candle / Product:</span>
                  <span className="font-bold text-[#141219]">
                    {viewingCertificate.productName || 'Fine Jewelry Cash Candle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <a
                href={`/appraise-your-jewelry?code=${encodeURIComponent(viewingCertificate.code)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-[42px] px-4 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <span>Open Public Certificate Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setViewingCertificate(null)}
                className="h-[42px] px-4 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
