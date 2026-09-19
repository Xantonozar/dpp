'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Edit3,
  Share2,
  QrCode,
  Layers,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import PassportView from '@/components/PassportView';
import type { PassportData } from '@/lib/passport-data';
import {
  getAllPassports,
  getPassportById,
  normalizePassportData,
  fetchPassportsFromApi,
  deletePassportFromApi,
  createEmptyPassport
} from '@/lib/passport-data';

export default function ProductPassportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const productId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

  const [allProducts, setAllProducts] = useState<PassportData[]>([]);
  const [remotePassport, setRemotePassport] = useState<PassportData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllProducts(getAllPassports());

    // Also fetch from MongoDB API for fresh data
    if (productId) {
      fetch(`/api/passports/${encodeURIComponent(productId)}`)
        .then(res => {
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return res.json();
        })
        .then(json => {
          if (json && json.passport) {
            setRemotePassport(json.passport);
          }
        })
        .catch(() => {});
    }

    fetchPassportsFromApi().then(res => {
      if (res && Array.isArray(res.passports)) {
        setAllProducts(res.passports);
      }
    });
  }, [productId]);

  const data = useMemo(() => {
    if (remotePassport) {
      return normalizePassportData(remotePassport);
    }
    const list = Array.isArray(allProducts) ? allProducts : [];
    const found = list.find(p => p.general?.projectId === productId);
    if (found) {
      return normalizePassportData(found);
    }
    if (list.length > 0) {
      return normalizePassportData(list[0]);
    }
    return createEmptyPassport(productId || '');
  }, [allProducts, productId, remotePassport]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productId) return;
    setIsDeleting(true);
    try {
      await deletePassportFromApi(productId);
      router.replace('/');
    } catch (err) {
      console.error('Failed to delete passport:', err);
      alert('Failed to delete passport from database.');
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const hasPassport = Boolean(
    remotePassport || (allProducts && allProducts.some(p => p.general?.projectId === productId)) || (data && data.general?.productName)
  );

  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      {/* Top sticky navigation bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E3DECF] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E3DECF] bg-white hover:bg-[#FAF8F3] text-[#17201B] text-xs font-semibold transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-muted group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden xs:inline">Dashboard</span>
            </Link>

            {allProducts.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted font-medium hidden md:inline">Product:</span>
                <div className="relative group">
                  <select
                    aria-label="Select product passport"
                    value={productId}
                    onChange={(e) => router.push(`/dpp/${e.target.value}`)}
                    className="appearance-none bg-[#FAF8F3] border border-[#E3DECF] rounded-lg px-2.5 py-1 pr-7 text-xs font-semibold text-[#17201B] cursor-pointer hover:border-[#17201B]/30 focus:outline-none focus:ring-1 focus:ring-[#2E6B4F] max-w-[130px] sm:max-w-[200px] truncate"
                  >
                    {(allProducts || []).map((p) => (
                      <option key={p.general?.projectId} value={p.general?.projectId}>
                        {p.general?.productName || 'Passport'} (#{p.general?.projectId})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E3DECF] bg-white hover:bg-[#FAF8F3] text-xs font-medium text-[#17201B] transition-colors cursor-pointer"
              title="Copy URL link"
            >
              <Share2 className="w-3.5 h-3.5 text-muted" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            {productId && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                title="Delete passport from database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete DPP</span>
              </button>
            )}

            <Link
              href={productId ? `/editor?id=${productId}` : '/editor'}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#2E6B4F] text-white text-xs font-bold hover:bg-[#24543E] transition-all shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Passport View or Empty State */}
      <main>
        {!hasPassport && allProducts.length === 0 ? (
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EBF5EE] text-[#24543E] border border-[#CFE8D7] flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-display font-black text-[#17201B] mb-2">Passport Not Found</h2>
            <p className="text-xs sm:text-sm text-muted mb-6 leading-relaxed">
              No digital product passport matches #{productId}. The registry currently contains no saved items.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 rounded-xl border border-[#E3DECF] bg-white hover:bg-[#FAF8F3] text-xs font-bold text-[#17201B] transition-all"
              >
                Back to Dashboard
              </Link>
              <Link
                href="/editor?new=true&autofill=true"
                className="px-4 py-2 rounded-xl bg-[#2E6B4F] hover:bg-[#24543E] text-white text-xs font-bold transition-all shadow-xs"
              >
                AI Auto-Fill (PDF)
              </Link>
            </div>
          </div>
        ) : (
          <PassportView data={data} isCustomActive={false} onResetCustom={() => {}} />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
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
                Are you sure you want to permanently delete DPP <span className="font-bold text-[#17201B]">#{productId}</span> ({data?.general?.productName || 'This passport'}) from the database? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
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
    </div>
  );
}
