'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Edit3,
  Share2,
  QrCode,
  Layers,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import PassportView from '@/components/PassportView';
import type { PassportData } from '@/lib/passport-data';
import {
  DEFAULT_PASSPORT_DATA,
  DEFAULT_CATALOG,
  getAllPassports,
  getPassportById,
  normalizePassportData,
  fetchPassportsFromApi
} from '@/lib/passport-data';

export default function ProductPassportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const productId = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '151546';

  const [allProducts, setAllProducts] = useState<PassportData[]>(DEFAULT_CATALOG);
  const [remotePassport, setRemotePassport] = useState<PassportData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllProducts(getAllPassports());

    // Also fetch from MongoDB API for fresh data / cross-browser persistence
    fetch(`/api/passports/${productId}`)
      .then(res => res.json())
      .then(json => {
        if (json && json.passport) {
          setRemotePassport(json.passport);
        }
      })
      .catch(() => {});
  }, [productId]);

  const data = useMemo(() => {
    if (remotePassport) {
      return normalizePassportData(remotePassport);
    }
    const list = Array.isArray(allProducts) ? allProducts : [];
    const found = list.find(p => p.general?.projectId === productId) || list[0] || DEFAULT_PASSPORT_DATA;
    return normalizePassportData(found);
  }, [allProducts, productId, remotePassport]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Top sticky navigation bar for Dashboard & Actions */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink text-xs font-semibold transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-muted group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden xs:inline">Dashboard</span>
            </Link>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted font-medium hidden md:inline">Product:</span>
              <div className="relative group">
                <select
                  aria-label="Select product passport"
                  value={productId}
                  onChange={(e) => router.push(`/dpp/${e.target.value}`)}
                  className="appearance-none bg-surface-2 border border-line rounded-lg px-2.5 py-1 pr-7 text-xs font-semibold text-ink cursor-pointer hover:border-ink/30 focus:outline-none focus:ring-1 focus:ring-green max-w-[130px] sm:max-w-[200px] truncate"
                >
                  {(allProducts || []).map((p) => (
                    <option key={p.general?.projectId} value={p.general?.projectId}>
                      {p.general?.productName || 'Blank Passport'} (#{p.general?.projectId})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-surface-2 text-xs font-medium text-ink transition-colors cursor-pointer"
              title="Copy URL link"
            >
              <Share2 className="w-3.5 h-3.5 text-muted" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <Link
              href={`/editor?id=${productId}`}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-green text-surface text-xs font-bold hover:bg-green-dark transition-all shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Passport View */}
      <main>
        <PassportView data={data} isCustomActive={false} onResetCustom={() => {}} />
      </main>
    </div>
  );
}
