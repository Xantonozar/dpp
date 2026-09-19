'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Droplets,
  Zap,
  Leaf,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  RotateCw,
  Sparkles,
  ExternalLink,
  Edit3,
  Globe2,
  FileCheck,
  Building2,
  ChevronRight,
  CheckCircle2,
  Info,
  Trash2,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react';
import type { PassportData } from '@/lib/passport-data';
import {
  getAllPassports,
  fetchPassportsFromApi,
  deletePassportFromApi,
  clearAllPassportsFromApi
} from '@/lib/passport-data';

export default function DashboardPage() {
  const [products, setProducts] = useState<PassportData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [passportToDelete, setPassportToDelete] = useState<PassportData | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetchPassportsFromApi();
      if (res && Array.isArray(res.passports)) {
        setProducts(res.passports);
      } else {
        setProducts(getAllPassports());
      }
      if (isManualRefresh) {
        showToast('Registry synchronized with database');
      }
    } catch (err) {
      console.warn('Failed to fetch passports:', err);
      setProducts(getAllPassports());
    } finally {
      setIsLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Compute category list
  const categories = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => {
      if (p.general?.category) set.add(p.general.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Compute seasons
  const seasons = useMemo(() => {
    const set = new Set<string>();
    (products || []).forEach((p) => {
      if (p.general?.season) set.add(p.general.season);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        (p.general?.productName || '').toLowerCase().includes(q) ||
        (p.general?.projectId || '').toLowerCase().includes(q) ||
        (p.general?.orderNo || '').toLowerCase().includes(q) ||
        (p.general?.originCountry || '').toLowerCase().includes(q) ||
        (p.general?.subtitle || '').toLowerCase().includes(q);

      const matchCat =
        selectedCategory === 'ALL' ||
        (p.general?.category && p.general.category.toUpperCase() === selectedCategory.toUpperCase());

      const matchSeason =
        selectedSeason === 'ALL' || p.general?.season === selectedSeason;

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'VERIFIED' && (p.general?.status === 'VERIFIED' || !p.general?.status)) ||
        (selectedStatus === 'AUDIT PENDING' && p.general?.status === 'AUDIT PENDING');

      return matchQuery && matchCat && matchSeason && matchStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedSeason, selectedStatus]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = (products || []).length;
    if (total === 0) {
      return { total: 0, verifiedCount: 0, avgCompleteness: 0, avgCarbon: '0.0' };
    }
    const verifiedCount = (products || []).filter(
      (p) => !p.general?.status || p.general?.status === 'VERIFIED'
    ).length;
    const avgCompleteness = Math.round(
      (products || []).reduce((acc, p) => acc + (p.general?.completeness || 90), 0) / total
    );
    const avgCarbon = (
      (products || []).reduce((acc, p) => acc + (p.general?.carbonKg || 0), 0) / total
    ).toFixed(1);

    return { total, verifiedCount, avgCompleteness, avgCarbon };
  }, [products]);

  const handleConfirmDelete = async () => {
    if (!passportToDelete) return;
    const id = passportToDelete.general.projectId;
    const name = passportToDelete.general.productName || id;
    setIsDeleting(true);

    try {
      const res = await deletePassportFromApi(id);
      setProducts((prev) => prev.filter((p) => p.general.projectId !== id));
      showToast(`DPP #${id} (${name}) deleted from database.`);
    } catch (err) {
      console.error('Failed to delete passport:', err);
      showToast(`Failed to delete DPP #${id}. Please try again.`);
    } finally {
      setIsDeleting(false);
      setPassportToDelete(null);
    }
  };

  const handleConfirmClearAll = async () => {
    setIsClearingAll(true);
    try {
      await clearAllPassportsFromApi();
      setProducts([]);
      showToast('All passports have been cleared from the database.');
    } catch (err) {
      console.error('Failed to clear database:', err);
      showToast('Failed to clear database.');
    } finally {
      setIsClearingAll(false);
      setIsClearAllModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#17201B]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E3DECF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B3B2B] to-[#2E6B4F] flex items-center justify-center text-white font-serif font-bold text-xl shadow-xs">
                T
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-[16px] tracking-tight text-[#17201B] group-hover:text-[#2E6B4F] transition-colors">
                    TCHIBO DPP REGISTRY
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#24543E] border border-[#CFE8D7]">
                    EU ESPR v2.4
                  </span>
                </div>
                <p className="text-[12px] text-muted font-medium hidden sm:block">
                  Digital Product Passport Governance & Circular Compliance
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3DECF] bg-[#FAF8F3] hover:bg-white text-muted hover:text-[#17201B] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Refresh passports from database"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2E6B4F]' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {products.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all cursor-pointer"
                title="Delete all passports from database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Database</span>
              </button>
            )}

            <Link
              href="/editor?new=true&autofill=true"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#2E6B4F] text-white hover:bg-[#24543E] text-xs font-bold transition-all shadow-xs shrink-0"
              title="Auto-fill a digital product passport by uploading a technical specification or test report PDF"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#A2E2BD]" />
              <span className="hidden sm:inline">AI Auto-Fill (PDF)</span>
              <span className="sm:hidden">Auto-Fill</span>
            </Link>

            <Link
              href="/editor?new=true"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] hover:bg-white text-[#17201B] text-xs font-bold transition-all shrink-0"
              title="Add a new blank digital product passport"
            >
              <Plus className="w-3.5 h-3.5 text-[#2E6B4F]" />
              <span className="hidden sm:inline">+ Blank Entry</span>
              <span className="sm:hidden">+ Blank</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Banner Section */}
        <section className="mb-5 sm:mb-8 bg-white border border-[#E3DECF] rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#EBF5EE] rounded-full filter blur-3xl opacity-50 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E3DECF] text-[10.5px] sm:text-[11px] font-bold text-[#24543E] mb-2 sm:mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E6B4F]" />
                <span>Standardized Ecodesign Data Carriers (EU 2024/1781)</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-tight text-[#17201B] mb-1.5 sm:mb-2">
                Digital Product Passports (DPP)
              </h1>
              <p className="text-xs sm:text-[14px] text-muted leading-relaxed">
                Centralized registry of verified textile passports. Inspect supply chain traceability, fiber composition, laboratory certificates, and circular recovery specifications.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <Link
                href="/editor?new=true&autofill=true"
                className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#2E6B4F] text-white hover:bg-[#24543E] text-xs font-bold transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#A2E2BD]" />
                <span>AI Auto-Fill from PDF</span>
              </Link>
              <Link
                href="/editor?new=true"
                className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#17201B] text-[#D4AF37] hover:bg-[#2A3830] text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Blank Entry</span>
              </Link>
              <Link
                href="/editor"
                className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E3DECF] bg-white hover:bg-[#FAF8F3] text-[#17201B] text-xs font-bold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-muted" />
                <span>Open Data Entry Studio</span>
              </Link>
            </div>
          </div>
        </section>

        {/* High-Level Metric Tiles */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-8">
          <div className="bg-white border border-[#E3DECF] rounded-xl p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-muted">Passports</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EBF5EE] text-[#24543E] flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-display font-black text-[#17201B]">
              {isLoading ? '...' : metrics.total}
            </div>
            <span className="text-[10.5px] sm:text-[11.5px] text-muted font-medium mt-0.5 sm:mt-1 inline-block">
              {metrics.total === 0 ? 'No active records' : `${metrics.verifiedCount} verified in registry`}
            </span>
          </div>

          <div className="bg-white border border-[#E3DECF] rounded-xl p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-muted">Completeness</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EBF5EE] text-[#24543E] flex items-center justify-center">
                <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-display font-black text-[#2E6B4F]">
              {isLoading ? '...' : `${metrics.avgCompleteness}%`}
            </div>
            <span className="text-[10.5px] sm:text-[11.5px] text-muted font-medium mt-0.5 sm:mt-1 inline-block">
              Target: &gt;90% for EU
            </span>
          </div>

          <div className="bg-white border border-[#E3DECF] rounded-xl p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-muted">Avg. Carbon</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FEF6E8] text-[#8C6014] flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-display font-black text-[#17201B]">
              {isLoading ? '...' : metrics.avgCarbon}{' '}
              <span className="text-xs sm:text-sm font-sans font-medium text-muted">kg CO₂e</span>
            </div>
            <span className="text-[10.5px] sm:text-[11.5px] text-muted font-medium mt-0.5 sm:mt-1 inline-block">
              ISO 14067 cradle-gate
            </span>
          </div>

          <div className="bg-white border border-[#E3DECF] rounded-xl p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-muted">Traceability</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EBF5EE] text-[#24543E] flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-display font-black text-[#17201B]">
              {metrics.total === 0 ? 'N/A' : 'Tier 1–3'}
            </div>
            <span className="text-[10.5px] sm:text-[11.5px] text-muted font-medium mt-0.5 sm:mt-1 inline-block">
              Spinning, Knitting, CMT
            </span>
          </div>
        </section>

        {/* Filter, Search & View Toolbar */}
        {products.length > 0 && (
          <section className="bg-white border border-[#E3DECF] rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search product, project ID, fiber..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF8F3] border border-[#E3DECF] rounded-lg text-xs font-medium text-[#17201B] placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[#2E6B4F] focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
              {/* Category */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F3] border border-[#E3DECF] rounded-lg px-2 sm:px-2.5 py-1 text-xs flex-1 sm:flex-initial">
                <span className="text-muted font-medium text-[10.5px] sm:text-[11px]">Category:</span>
                <select
                  aria-label="Filter by category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-[#17201B] font-semibold focus:outline-none cursor-pointer text-xs w-full sm:w-auto"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F3] border border-[#E3DECF] rounded-lg px-2 sm:px-2.5 py-1 text-xs flex-1 sm:flex-initial">
                <span className="text-muted font-medium text-[10.5px] sm:text-[11px]">Season:</span>
                <select
                  aria-label="Filter by season"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-transparent text-[#17201B] font-semibold focus:outline-none cursor-pointer text-xs w-full sm:w-auto"
                >
                  {seasons.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F3] border border-[#E3DECF] rounded-lg px-2 sm:px-2.5 py-1 text-xs flex-1 sm:flex-initial">
                <span className="text-muted font-medium text-[10.5px] sm:text-[11px]">Status:</span>
                <select
                  aria-label="Filter by status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-[#17201B] font-semibold focus:outline-none cursor-pointer text-xs w-full sm:w-auto"
                >
                  <option value="ALL">All Status</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="AUDIT PENDING">Audit Pending</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#FAF8F3] border border-[#E3DECF] rounded-lg p-0.5 ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-[#17201B] shadow-2xs' : 'text-muted hover:text-[#17201B]'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-[#17201B] shadow-2xs' : 'text-muted hover:text-[#17201B]'
                  }`}
                  title="Table view"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white border border-[#E3DECF] rounded-2xl p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 text-[#2E6B4F] animate-spin mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#17201B] mb-1">Loading Digital Product Passports...</h3>
            <p className="text-xs text-muted">Retrieving passport records from the database.</p>
          </div>
        ) : products.length === 0 ? (
          /* Empty Database State */
          <div className="bg-white border border-[#E3DECF] rounded-2xl p-8 sm:p-14 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#EBF5EE] text-[#24543E] border border-[#CFE8D7] flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-display font-black text-[#17201B] mb-2">
              Digital Product Passport Registry is Empty
            </h2>
            <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto mb-6 leading-relaxed">
              There are currently no product passports stored in the database. You can auto-generate a complete passport from a technical PDF test report/specification, or create a blank specification entry.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Link
                href="/editor?new=true&autofill=true"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E6B4F] text-white hover:bg-[#24543E] text-xs font-bold transition-all shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#A2E2BD]" />
                <span>AI Auto-Fill from PDF</span>
              </Link>
              <Link
                href="/editor?new=true"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] hover:bg-white text-[#17201B] text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4 text-[#2E6B4F]" />
                <span>+ Create Blank DPP</span>
              </Link>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Filter Returned 0 Results */
          <div className="bg-white border border-[#E3DECF] rounded-2xl p-12 text-center shadow-xs">
            <AlertCircle className="w-10 h-10 text-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#17201B] mb-1">No products match your filter</h3>
            <p className="text-xs text-muted mb-4">Try clearing your search query or resetting category and season filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedSeason('ALL');
                setSelectedStatus('ALL');
              }}
              className="px-4 py-2 rounded-lg bg-[#FAF8F3] border border-[#E3DECF] text-xs font-bold text-[#17201B] hover:bg-white cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {filteredProducts.map((p, pIdx) => {
              const isVerified = !p.general?.status || p.general.status === 'VERIFIED';
              const fibers = [
                p.materials?.cotton ? `${p.materials.cotton}% Cotton` : null,
                p.materials?.modal ? `${p.materials.modal}% Modal` : null,
                p.materials?.elastane ? `${p.materials.elastane}% Elastane` : null,
                p.materials?.recycledContent ? `${p.materials.recycledContent}% Recycled` : null
              ].filter(Boolean).join(' · ') || 'Verified fibers';

              return (
                <div
                  key={p.general?.projectId || `grid-prod-${pIdx}`}
                  className="bg-white border border-[#E3DECF] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Image & Header tags */}
                  <div className="relative aspect-[4/3] bg-[#F1EFEA] overflow-hidden">
                    {p.general?.visuals?.cw1Image ? (
                      <Image
                        src={p.general.visuals.cw1Image}
                        alt={p.general?.productName || 'Product'}
                        fill
                        unoptimized
                        referrerPolicy="no-referrer"
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#ECE7DC] text-muted p-4 text-center">
                        <Sparkles className="w-8 h-8 text-[#2E6B4F] mb-1 opacity-80" />
                        <span className="text-xs font-bold text-[#17201B] truncate max-w-[90%]">
                          {p.general.productName || 'Digital Product Passport'}
                        </span>
                        <span className="text-[10.5px] text-muted">Awaiting photo upload</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-wrap gap-1.5">
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold text-[#17201B] border border-[#E3DECF] shadow-xs">
                        #{p.general.projectId}
                      </span>
                      {p.general.season && (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#17201B]/85 backdrop-blur-xs text-[10px] sm:text-[11px] font-semibold text-white">
                          {p.general.season}
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[10.5px] font-bold border shadow-xs ${
                          isVerified
                            ? 'bg-[#EBF5EE]/95 text-[#24543E] border-[#CFE8D7]'
                            : 'bg-[#FEF6E8]/95 text-[#8C6014] border-[#FCE1B6]'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{p.general.status || 'VERIFIED'}</span>
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between text-[10.5px] sm:text-[11px] text-white bg-black/60 backdrop-blur-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg">
                      <span className="font-medium truncate">{p.general.originCountry || 'Traceable'}</span>
                      <span className="font-mono font-bold">{p.general.carbonKg || 0} kg CO₂e</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2E6B4F]">
                          {p.general.category || 'Textile'}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] sm:text-[11.5px] font-bold text-muted">
                          <span>{p.general.completeness || 90}% complete</span>
                        </div>
                      </div>

                      {/* Completeness Bar */}
                      <div className="w-full bg-[#FAF8F3] h-1.5 rounded-full overflow-hidden border border-[#E3DECF] mb-2.5 sm:mb-3">
                        <div
                          className="bg-[#2E6B4F] h-full rounded-full transition-all"
                          style={{ width: `${p.general.completeness || 90}%` }}
                        />
                      </div>

                      <h3 className="font-display font-bold text-base sm:text-lg text-[#17201B] mb-1 group-hover:text-[#2E6B4F] transition-colors leading-snug">
                        {p.general.productName || `DPP #${p.general.projectId}`}
                      </h3>
                      <p className="text-xs text-muted mb-2.5 sm:mb-3 line-clamp-2 leading-relaxed">
                        {p.general.subtitle || 'Verified EU ESPR Digital Product Passport'}
                      </p>

                      {/* Material badges */}
                      <div className="text-[10.5px] sm:text-[11.5px] text-[#425048] bg-[#FAF8F3] border border-[#E3DECF] rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 mb-3 sm:mb-4 font-mono font-medium truncate">
                        {fibers}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 sm:pt-4 border-t border-[#E3DECF] flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPassportToDelete(p)}
                        className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete DPP from database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/editor?id=${p.general.projectId}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-[#17201B] px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-[#FAF8F3] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>

                        <Link
                          href={`/dpp/${p.general.projectId}`}
                          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#2E6B4F] text-white hover:bg-[#24543E] text-xs font-bold transition-all shadow-xs group/btn"
                        >
                          <span>View DPP</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white border border-[#E3DECF] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F3] border-b border-[#E3DECF] text-muted font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Project / Order</th>
                    <th className="py-3.5 px-4">Category & Season</th>
                    <th className="py-3.5 px-4">Country & Carbon</th>
                    <th className="py-3.5 px-4">Completeness</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DECF]">
                  {filteredProducts.map((p, pIdx) => {
                    const isVerified = !p.general?.status || p.general.status === 'VERIFIED';
                    return (
                      <tr key={p.general?.projectId || `tbl-prod-${pIdx}`} className="hover:bg-[#FAF8F3]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#F1EFEA] border border-[#E3DECF] flex items-center justify-center">
                              {p.general?.visuals?.cw1Image ? (
                                <Image
                                  src={p.general.visuals.cw1Image}
                                  alt=""
                                  fill
                                  unoptimized
                                  referrerPolicy="no-referrer"
                                  className="object-cover"
                                />
                              ) : (
                                <Sparkles className="w-4 h-4 text-[#2E6B4F]" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[#17201B] text-[13px]">{p.general?.productName || `DPP #${p.general?.projectId}`}</div>
                              <div className="text-muted text-[11px]">{p.general?.subtitle || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-[#17201B]">
                          <div>#{p.general?.projectId || ''}</div>
                          {p.general?.orderNo && <div className="text-muted text-[10.5px]">Ord: {p.general.orderNo}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#17201B]">{p.general?.category || 'Textile'}</div>
                          <div className="text-muted text-[11px]">{p.general?.season || ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#17201B]">{p.general?.originCountry || 'N/A'}</div>
                          <div className="text-muted text-[11px] font-mono">{p.general?.carbonKg || 0} kg CO₂e</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[#FAF8F3] h-1.5 rounded-full overflow-hidden border border-[#E3DECF]">
                              <div
                                className="bg-[#2E6B4F] h-full rounded-full"
                                style={{ width: `${p.general?.completeness || 90}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold text-[#17201B]">
                              {p.general?.completeness || 90}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                              isVerified
                                ? 'bg-[#EBF5EE] text-[#24543E] border-[#CFE8D7]'
                                : 'bg-[#FEF6E8] text-[#8C6014] border-[#FCE1B6]'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>{p.general.status || 'VERIFIED'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPassportToDelete(p)}
                              className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete DPP from database"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/editor?id=${p.general.projectId}`}
                              className="p-1.5 text-muted hover:text-[#17201B] rounded-lg hover:bg-[#FAF8F3] transition-colors"
                              title="Edit Data"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/dpp/${p.general.projectId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2E6B4F] text-white hover:bg-[#24543E] font-bold text-[11.5px] transition-all shadow-xs"
                            >
                              <span>View DPP</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Regulatory Information */}
        <footer className="mt-16 pt-8 border-t border-[#E3DECF] text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2E6B4F]" />
            <span>Tchibo GmbH Sustainability Division · Digital Product Passport Registry</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/editor" className="hover:text-[#17201B] transition-colors font-medium">
              Data Entry Studio
            </Link>
            <span className="text-muted/40">•</span>
            <Link href="/editor?new=true&autofill=true" className="hover:text-[#17201B] transition-colors font-medium">
              AI Auto-Fill (PDF)
            </Link>
            <span className="text-muted/40">•</span>
            <span>EU CIRPASS v2 Architecture</span>
          </div>
        </footer>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {passportToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E3DECF]"
            >
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-[#17201B]">Delete DPP from Database?</h3>
                  <p className="text-xs text-muted">Permanent database deletion</p>
                </div>
              </div>

              <p className="text-xs text-muted mb-6 leading-relaxed">
                Are you sure you want to permanently delete DPP <span className="font-bold text-[#17201B]">#{passportToDelete.general?.projectId}</span> ({passportToDelete.general?.productName || 'Unnamed passport'}) from the database? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setPassportToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-[#E3DECF] bg-[#FAF8F3] hover:bg-white text-xs font-bold text-[#17201B] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete from Database</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clear All Modal */}
      <AnimatePresence>
        {isClearAllModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E3DECF]"
            >
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-[#17201B]">Clear All Passports?</h3>
                  <p className="text-xs text-muted">Delete all {products.length} records</p>
                </div>
              </div>

              <p className="text-xs text-muted mb-6 leading-relaxed">
                This will delete <span className="font-bold text-[#17201B]">all {products.length} product passports</span> from the database. The registry will be reset to an empty state.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsClearAllModalOpen(false)}
                  disabled={isClearingAll}
                  className="px-4 py-2 rounded-xl border border-[#E3DECF] bg-[#FAF8F3] hover:bg-white text-xs font-bold text-[#17201B] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClearAll}
                  disabled={isClearingAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isClearingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All Passports</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#17201B] text-white rounded-xl shadow-xl text-xs font-medium border border-white/10"
          >
            <CheckCircle2 className="w-4 h-4 text-[#A2E2BD] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
