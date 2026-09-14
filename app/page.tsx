'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  RotateCcw,
  Sparkles,
  ExternalLink,
  Edit3,
  Globe2,
  FileCheck,
  Building2,
  ChevronRight,
  CheckCircle2,
  Info
} from 'lucide-react';
import type { PassportData } from '@/lib/passport-data';
import {
  getAllPassports,
  resetAllPassports,
  DEFAULT_CATALOG,
  fetchPassportsFromApi
} from '@/lib/passport-data';

export default function DashboardPage() {
  const [products, setProducts] = useState<PassportData[]>(DEFAULT_CATALOG);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducts(getAllPassports());

    // Fetch from MongoDB database API
    fetchPassportsFromApi().then(res => {
      if (res.passports && res.passports.length > 0) {
        setProducts(res.passports);
      }
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isResetting, setIsResetting] = useState(false);

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
    const verifiedCount = (products || []).filter(
      (p) => !p.general?.status || p.general?.status === 'VERIFIED'
    ).length;
    const avgCompleteness = Math.round(
      (products || []).reduce((acc, p) => acc + (p.general?.completeness || 90), 0) / (total || 1)
    );
    const avgCarbon = (
      (products || []).reduce((acc, p) => acc + (p.general?.carbonKg || 4), 0) / (total || 1)
    ).toFixed(1);

    return { total, verifiedCount, avgCompleteness, avgCarbon };
  }, [products]);

  const handleResetCatalog = () => {
    if (confirm('Reset entire catalog back to Tchibo default sample passports?')) {
      setIsResetting(true);
      resetAllPassports();
      setProducts(DEFAULT_CATALOG);
      setTimeout(() => setIsResetting(false), 800);
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
                  <span className="font-display font-black text-[16px] tracking-tight text-ink group-hover:text-green transition-colors">
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
              onClick={handleResetCatalog}
              disabled={isResetting}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3DECF] bg-[#FAF8F3] hover:bg-white text-muted hover:text-ink text-xs font-semibold transition-all cursor-pointer"
              title="Restore standard catalog"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Catalog</span>
            </button>

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
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] hover:bg-white text-ink text-xs font-bold transition-all shrink-0"
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
                <ShieldCheck className="w-3.5 h-3.5 text-green" />
                <span>Standardized Ecodesign Data Carriers (EU 2024/1781)</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-tight text-[#17201B] mb-1.5 sm:mb-2">
                Digital Product Passports (DPP)
              </h1>
              <p className="text-xs sm:text-[14px] text-muted leading-relaxed">
                Centralized registry of verified textile passports. Select any product to inspect its complete supply chain traceability, fiber composition, laboratory certificates, and circular end-of-life recovery instructions.
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
                className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E3DECF] bg-white hover:bg-[#FAF8F3] text-ink text-xs font-bold transition-all"
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
              {metrics.total}
            </div>
            <span className="text-[10.5px] sm:text-[11.5px] text-muted font-medium mt-0.5 sm:mt-1 inline-block">
              {metrics.verifiedCount} verified in registry
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
              {metrics.avgCompleteness}%
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
              {metrics.avgCarbon} <span className="text-xs sm:text-sm font-sans font-medium text-muted">kg CO₂e</span>
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
              Tier 1–3
            </div>
            <span className="text-[10.5px] sm:text-[11.5px] text-muted font-medium mt-0.5 sm:mt-1 inline-block">
              Spinning, Knitting, CMT
            </span>
          </div>
        </section>

        {/* Filter, Search & View Toolbar */}
        <section className="bg-white border border-[#E3DECF] rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search product, project ID, fiber..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F3] border border-[#E3DECF] rounded-lg text-xs font-medium text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-green focus:bg-white transition-all"
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
                className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer text-xs w-full sm:w-auto"
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
                className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer text-xs w-full sm:w-auto"
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
                className="bg-transparent text-ink font-semibold focus:outline-none cursor-pointer text-xs w-full sm:w-auto"
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
                  viewMode === 'grid' ? 'bg-white text-ink shadow-2xs' : 'text-muted hover:text-ink'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-ink shadow-2xs' : 'text-muted hover:text-ink'
                }`}
                title="Table view"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Product Listing */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E3DECF] rounded-2xl p-12 text-center">
            <AlertCircle className="w-10 h-10 text-muted mx-auto mb-3" />
            <h3 className="text-lg font-bold text-ink mb-1">No products match your filter</h3>
            <p className="text-sm text-muted mb-4">Try clearing your search query or selecting &apos;All&apos; in filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedSeason('ALL');
                setSelectedStatus('ALL');
              }}
              className="px-4 py-2 rounded-lg bg-[#FAF8F3] border border-[#E3DECF] text-xs font-bold text-ink hover:bg-white"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {(filteredProducts || []).map((p, pIdx) => {
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
                        <Sparkles className="w-8 h-8 text-green mb-1 opacity-80" />
                        <span className="text-xs font-bold text-ink truncate max-w-[90%]">
                          {p.general.productName || 'Blank DPP Specification'}
                        </span>
                        <span className="text-[10.5px] text-muted">Awaiting photo upload</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex flex-wrap gap-1.5">
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold text-ink border border-[#E3DECF] shadow-xs">
                        #{p.general.projectId}
                      </span>
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#17201B]/85 backdrop-blur-xs text-[10px] sm:text-[11px] font-semibold text-white">
                        {p.general.season}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
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
                      <span className="font-medium truncate">{p.general.originCountry}</span>
                      <span className="font-mono font-bold">{p.general.carbonKg} kg CO₂e</span>
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
                          <span>{p.general.completeness || 92}% complete</span>
                        </div>
                      </div>

                      {/* Completeness Bar */}
                      <div className="w-full bg-[#FAF8F3] h-1.5 rounded-full overflow-hidden border border-[#E3DECF] mb-2.5 sm:mb-3">
                        <div
                          className="bg-[#2E6B4F] h-full rounded-full transition-all"
                          style={{ width: `${p.general.completeness || 92}%` }}
                        />
                      </div>

                      <h3 className="font-display font-bold text-base sm:text-lg text-[#17201B] mb-1 group-hover:text-green transition-colors leading-snug">
                        {p.general.productName}
                      </h3>
                      <p className="text-xs text-muted mb-2.5 sm:mb-3 line-clamp-2 leading-relaxed">
                        {p.general.subtitle}
                      </p>

                      {/* Material badges */}
                      <div className="text-[10.5px] sm:text-[11.5px] text-[#425048] bg-[#FAF8F3] border border-[#E3DECF] rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 mb-3 sm:mb-4 font-mono font-medium">
                        {fibers}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 sm:pt-4 border-t border-[#E3DECF] flex items-center justify-between gap-2">
                      <Link
                        href={`/editor?id=${p.general.projectId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-[#FAF8F3] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Data</span>
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
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3DECF]">
                  {(filteredProducts || []).map((p, pIdx) => {
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
                                <Sparkles className="w-4 h-4 text-green" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-ink text-[13px]">{p.general?.productName || 'Blank DPP Specification'}</div>
                              <div className="text-muted text-[11px]">{p.general?.subtitle || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-ink">
                          <div>#{p.general?.projectId || ''}</div>
                          <div className="text-muted text-[10.5px]">Ord: {p.general?.orderNo || ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-ink">{p.general?.category || 'Textile'}</div>
                          <div className="text-muted text-[11px]">{p.general?.season || ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-ink">{p.general?.originCountry || 'N/A'}</div>
                          <div className="text-muted text-[11px] font-mono">{p.general?.carbonKg || 0} kg CO₂e</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[#FAF8F3] h-1.5 rounded-full overflow-hidden border border-[#E3DECF]">
                              <div
                                className="bg-[#2E6B4F] h-full rounded-full"
                                style={{ width: `${p.general?.completeness || 92}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-bold text-ink">
                              {p.general?.completeness || 92}%
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
                            <Link
                              href={`/editor?id=${p.general.projectId}`}
                              className="p-1.5 text-muted hover:text-ink rounded-lg hover:bg-surface-2 transition-colors"
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
            <span className="w-2 h-2 rounded-full bg-green" />
            <span>Tchibo GmbH Sustainability Division · Digital Product Passport Prototype</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/editor" className="hover:text-ink transition-colors font-medium">
              Data Entry Studio
            </Link>
            <span className="text-muted/40">•</span>
            <Link href="/dpp/151546" className="hover:text-ink transition-colors font-medium">
              Flagship Passport
            </Link>
            <span className="text-muted/40">•</span>
            <span>EU CIRPASS v2 Architecture</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
