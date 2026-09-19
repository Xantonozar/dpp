'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import type {
  PassportData,
  Size,
  StyleType,
  MeasurementRow,
  TraceabilityNode,
  LabCardItem
} from '@/lib/passport-data';
import {
  DEFAULT_PASSPORT_DATA,
  DEFAULT_CATALOG,
  BABY_WEAR_PASSPORT_PRESET,
  BABY_WEAR_QUALITY_TESTS,
  ensureFullSupplyChainNodes,
  ensureFullQualityLabCards,
  getAllPassports,
  getPassportById,
  savePassport,
  resetAllPassports,
  createEmptyPassport,
  normalizePassportData,
  normalizeExtractedPassportData,
  fetchPassportsFromApi,
  savePassportToApi,
  deletePassportFromApi
} from '@/lib/passport-data';
import PassportView from '@/components/PassportView';
import PdfAutoFillModal from '@/components/PdfAutoFillModal';
import { compressImageClientSide } from '@/lib/pdf-extractor';
import { CARE_SYMBOLS, CareIconRenderer } from '@/lib/care-icons';
import {
  Save,
  RotateCcw,
  Eye,
  Columns,
  FileCode,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Ruler,
  Navigation,
  HeartHandshake,
  Recycle,
  Leaf,
  FileCheck,
  ArrowLeft,
  ChevronDown,
  UploadCloud,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Database,
  Cloud,
  Barcode,
  Palette
} from 'lucide-react';

const SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL'];

function createNewPassportTemplate(): PassportData {
  return createEmptyPassport();
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F4F1EA]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted text-xs font-semibold">Loading DPP Studio...</p>
          </div>
        </div>
      }
    >
      <EditorContainer />
    </Suspense>
  );
}

function EditorContainer() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');
  const isNewParam = searchParams.get('new');
  const autoFillParam = searchParams.get('autofill');
  const key = queryId ? `id-${queryId}` : isNewParam === 'true' ? 'new' : 'default';

  return <EditorInner key={key} queryId={queryId} isNewParam={isNewParam} autoFillParam={autoFillParam} />;
}

function EditorInner({
  queryId,
  isNewParam,
  autoFillParam
}: {
  queryId: string | null;
  isNewParam: string | null;
  autoFillParam?: string | null;
}) {
  const router = useRouter();

  const cw1FileInputRef = React.useRef<HTMLInputElement | null>(null);
  const cw2FileInputRef = React.useRef<HTMLInputElement | null>(null);
  const upcycleFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryUploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState<number | null>(null);

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<{ message: string; isCloudinary?: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('Saved!');

  const handleImageFileUpload = async (
    file: File,
    fieldKey: string,
    callback: (url: string) => void
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP, etc.)');
      return;
    }
    setUploadingField(fieldKey);
    try {
      // Direct in-browser image compression to bypass Vercel 4.5MB limit and Cloudinary size limits
      let fileToUpload = file;
      if (file.size > 500 * 1024) {
        try {
          const compressed = await compressImageClientSide(file, 1400, 0.82);
          fileToUpload = compressed.file;
        } catch (compErr) {
          console.warn('Browser image compression skipped, uploading original:', compErr);
        }
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to upload to server');
      }

      if (json.url) {
        callback(json.url);
        if (json.provider === 'cloudinary') {
          setUploadNotice({
            message: 'Image successfully uploaded to Cloudinary CDN!',
            isCloudinary: true,
          });
        } else {
          setUploadNotice({
            message: 'Image loaded. (Configure Cloudinary keys in Settings to host directly on Cloudinary CDN)',
            isCloudinary: false,
          });
        }
      }
    } catch (err: any) {
      console.warn('Upload API error, falling back to local data URL:', err);
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          callback(result);
          setUploadNotice({
            message: 'Loaded locally (upload error fallback)',
            isCloudinary: false,
          });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingField(null);
      setTimeout(() => setUploadNotice(null), 4000);
    }
  };

  const [productsList, setProductsList] = useState<PassportData[]>([]);
  const [data, setData] = useState<PassportData>(() => createEmptyPassport(''));
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(() => autoFillParam === 'true');
  const [isDeletingPassport, setIsDeletingPassport] = useState<boolean>(false);

  useEffect(() => {
    // Sync with MongoDB API first, falling back to localStorage
    fetchPassportsFromApi().then(res => {
      if (res.passports && Array.isArray(res.passports)) {
        setProductsList(res.passports);
        if (queryId) {
          const found = res.passports.find(p => p.general?.projectId === queryId);
          if (found) setData(found);
        }
      }
    });

    const all = getAllPassports();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProductsList(all);
    if (queryId) {
      setData(getPassportById(queryId));
    } else {
      setData(createEmptyPassport(''));
    }
  }, [queryId, isNewParam]);

  const [activeTab, setActiveTab] = useState<'general' | 'materials' | 'measurements' | 'traceability' | 'quality' | 'care' | 'environmental' | 'compliance'>('general');
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('split');
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [jsonModalOpen, setJsonModalOpen] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleDeleteThisPassport = async () => {
    const id = data.general?.projectId;
    if (!id) return;
    if (confirm(`Are you sure you want to permanently delete DPP #${id} (${data.general?.productName || 'Unnamed'}) from the database?`)) {
      setIsDeletingPassport(true);
      try {
        await deletePassportFromApi(id);
        const updated = getAllPassports();
        setProductsList(updated);
        router.replace('/');
      } catch (err) {
        console.error('Failed to delete passport:', err);
        alert('Failed to delete passport from database.');
      } finally {
        setIsDeletingPassport(false);
      }
    }
  };

  const handleApplyPdfData = (extracted: PassportData, mode: 'replace' | 'merge') => {
    const normExtracted = normalizeExtractedPassportData(extracted, data);
    let finalData: PassportData;

    if (mode === 'replace') {
      finalData = {
        ...normExtracted,
        general: {
          ...normExtracted.general,
          visuals: {
            ...normExtracted.general.visuals,
            cw1Image: normExtracted.general.visuals.cw1Image || data.general.visuals?.cw1Image || '',
            cw2Image: normExtracted.general.visuals.cw2Image || data.general.visuals?.cw2Image || '',
          },
        },
      };
    } else {
      // Merge mode: deeply merge all tabs, preferring newly extracted values
      finalData = normalizePassportData({
        ...normExtracted,
        general: {
          ...data.general,
          ...normExtracted.general,
          projectId: normExtracted.general.projectId || data.general.projectId,
          orderNo: normExtracted.general.orderNo || data.general.orderNo,
          productName: normExtracted.general.productName || data.general.productName,
          brand: normExtracted.general.brand || data.general.brand,
          season: normExtracted.general.season || data.general.season,
          originCountry: normExtracted.general.originCountry || data.general.originCountry,
          category: normExtracted.general.category || data.general.category,
          gender: normExtracted.general.gender || data.general.gender,
          color: normExtracted.general.color || data.general.color,
          fitting: normExtracted.general.fitting || data.general.fitting,
          articleNumbers:
            normExtracted.general.articleNumbers?.uni?.S
              ? normExtracted.general.articleNumbers
              : data.general.articleNumbers,
          packagingInfo: {
            ...data.general.packagingInfo,
            ...normExtracted.general.packagingInfo,
          },
          visuals: {
            ...data.general.visuals,
            ...normExtracted.general.visuals,
            cw1Image: normExtracted.general.visuals.cw1Image || data.general.visuals?.cw1Image || '',
            cw2Image: normExtracted.general.visuals.cw2Image || data.general.visuals?.cw2Image || '',
          },
        },
        materials: {
          ...data.materials,
          ...normExtracted.materials,
          yarnSources: {
            ...data.materials.yarnSources,
            ...normExtracted.materials.yarnSources,
          },
          labAnalysis:
            normExtracted.materials.labAnalysis?.length > 0
              ? normExtracted.materials.labAnalysis
              : data.materials.labAnalysis,
          svhcSubstances:
            normExtracted.materials.svhcSubstances?.length > 0
              ? normExtracted.materials.svhcSubstances
              : data.materials.svhcSubstances,
        },
        measurements: {
          topFit: normExtracted.measurements.topFit || data.measurements.topFit,
          bottomFit: normExtracted.measurements.bottomFit || data.measurements.bottomFit,
          top:
            normExtracted.measurements.top?.length > 0
              ? normExtracted.measurements.top
              : data.measurements.top,
          bottom:
            normExtracted.measurements.bottom?.length > 0
              ? normExtracted.measurements.bottom
              : data.measurements.bottom,
        },
        traceability: {
          ...data.traceability,
          ...normExtracted.traceability,
          origin: { ...data.traceability.origin, ...normExtracted.traceability.origin },
          destination: { ...data.traceability.destination, ...normExtracted.traceability.destination },
          testingLab: { ...data.traceability.testingLab, ...normExtracted.traceability.testingLab },
          nodes:
            normExtracted.traceability.nodes?.length > 0
              ? normExtracted.traceability.nodes
              : data.traceability.nodes,
        },
        quality: {
          ...data.quality,
          ...normExtracted.quality,
          reviewedBy: { ...data.quality.reviewedBy, ...normExtracted.quality.reviewedBy },
          rslItems:
            normExtracted.quality.rslItems?.length > 0
              ? normExtracted.quality.rslItems
              : data.quality.rslItems,
          labCards:
            normExtracted.quality.labCards?.length > 0
              ? normExtracted.quality.labCards
              : data.quality.labCards,
        },
        care: {
          ...data.care,
          ...normExtracted.care,
        },
        circularity: {
          ...data.circularity,
          ...normExtracted.circularity,
          tips:
            normExtracted.circularity.tips?.length > 0
              ? normExtracted.circularity.tips
              : data.circularity.tips,
          upcycleSteps:
            normExtracted.circularity.upcycleSteps?.length > 0
              ? normExtracted.circularity.upcycleSteps
              : data.circularity.upcycleSteps,
          fibreRecyclingFacts:
            normExtracted.circularity.fibreRecyclingFacts?.length > 0
              ? normExtracted.circularity.fibreRecyclingFacts
              : data.circularity.fibreRecyclingFacts,
        },
        environmental: {
          ...data.environmental,
          ...normExtracted.environmental,
          carbonBreakdown:
            (normExtracted.environmental?.carbonBreakdown && normExtracted.environmental.carbonBreakdown.length > 0)
              ? normExtracted.environmental.carbonBreakdown
              : data.environmental?.carbonBreakdown || [],
        },
        compliance: {
          ...data.compliance,
          ...normExtracted.compliance,
          certifications:
            normExtracted.compliance.certifications?.length > 0
              ? normExtracted.compliance.certifications
              : data.compliance.certifications,
        },
      });
    }

    setData(finalData);
    savePassport(finalData);
    savePassportToApi(finalData).then(res => {
      if (res.connected) {
        setSaveMessage('Saved to MongoDB!');
      } else {
        setSaveMessage('Saved!');
      }
    });
    const updated = getAllPassports();
    setProductsList(updated);
    if (finalData.general.projectId) {
      router.replace(`/editor?id=${finalData.general.projectId}`);
    }
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    savePassport(data);
    try {
      const res = await savePassportToApi(data);
      if (res.source === 'mongodb' || res.connected) {
        setSaveMessage('Saved to MongoDB!');
      } else {
        setSaveMessage('Saved!');
      }
    } catch {
      setSaveMessage('Saved!');
    } finally {
      setIsSaving(false);
    }
    const updated = getAllPassports();
    setProductsList(updated);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000);
  };

  const handleCreateNew = () => {
    const fresh = createEmptyPassport('');
    setData(fresh);
    router.replace('/editor');
  };

  const handleClearToBlank = () => {
    const blank = createEmptyPassport('');
    setData(blank);
    savePassport(blank);
    setProductsList(getAllPassports());
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const handleSelectProduct = (id: string) => {
    if (id === 'NEW' || id === '') {
      handleCreateNew();
    } else {
      router.replace(`/editor?id=${id}`);
      setData(getPassportById(id));
    }
  };

  const handleOpenJsonModal = () => {
    setJsonInput(JSON.stringify(data, null, 2));
    setJsonError(null);
    setJsonModalOpen(true);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setData(parsed);
      savePassport(parsed);
      setProductsList(getAllPassports());
      setJsonModalOpen(false);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
    } catch {
      setJsonError('Invalid JSON format. Please check syntax.');
    }
  };

  // Helper updater
  const updateGeneral = <K extends keyof PassportData['general']>(key: K, val: PassportData['general'][K]) => {
    setData(prev => ({ ...prev, general: { ...prev.general, [key]: val } }));
  };

  const updateMaterials = <K extends keyof PassportData['materials']>(key: K, val: PassportData['materials'][K]) => {
    setData(prev => ({ ...prev, materials: { ...prev.materials, [key]: val } }));
  };

  const updateEnvironmental = <K extends keyof PassportData['environmental']>(key: K, val: PassportData['environmental'][K]) => {
    setData(prev => ({ ...prev, environmental: { ...prev.environmental, [key]: val } }));
  };

  const updateCare = <K extends keyof PassportData['care']>(key: K, val: PassportData['care'][K]) => {
    setData(prev => ({ ...prev, care: { ...prev.care, [key]: val } }));
  };

  const updateCompliance = <K extends keyof PassportData['compliance']>(key: K, val: PassportData['compliance'][K]) => {
    setData(prev => ({ ...prev, compliance: { ...prev.compliance, [key]: val } }));
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#17201B] flex flex-col">
      {/* Editor Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E3DECF] px-3 py-2 sm:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E3DECF] bg-white hover:bg-[#FAF8F3] text-ink text-xs font-semibold transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-muted group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden xs:inline">Dashboard</span>
            </Link>

            <span className="text-muted/30">|</span>

            {/* Product Switcher Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider hidden lg:inline">
                Product:
              </span>
              <div className="relative flex items-center">
                <select
                  aria-label="Select product to edit"
                  value={data.general.projectId || ''}
                  onChange={e => handleSelectProduct(e.target.value)}
                  className="appearance-none bg-[#FAF8F3] border border-[#E3DECF] rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-bold text-ink cursor-pointer hover:border-ink/40 focus:outline-none focus:ring-1 focus:ring-green max-w-[110px] xs:max-w-[160px] sm:max-w-[220px] md:max-w-[280px] truncate"
                >
                  <option value="">— Blank Form —</option>
                  {(productsList || []).map((p, pIdx) => (
                    <option key={p?.general?.projectId || `prod-${pIdx}`} value={p?.general?.projectId || ''}>
                      {p?.general?.productName || 'Blank Passport'} (#{p?.general?.projectId || '---'})
                    </option>
                  ))}
                  <option value="NEW">+ Create New (Blank)...</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2 pointer-events-none" />
              </div>

              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#2E6B4F] text-white hover:bg-[#24543E] text-xs font-bold transition-colors shadow-2xs shrink-0"
                title="Create a new completely empty product passport"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ New (Empty)</span>
              </button>
            </div>
          </div>

          {/* View Mode Switcher (Desktop only; mobile uses bottom bar) */}
          <div className="hidden md:flex items-center bg-[#FBFAF6] border border-[#E3DECF] rounded-full p-0.5 sm:p-1 shadow-xs">
            <button
              onClick={() => setViewMode('editor')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11.5px] sm:text-[12px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'editor' ? 'bg-[#17201B] text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              <Layers size={13} />
              <span>Form</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-[#17201B] text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              <Columns size={13} />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11.5px] sm:text-[12px] font-semibold transition-colors cursor-pointer ${
                viewMode === 'preview' ? 'bg-green text-white shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setPdfModalOpen(true)}
              className="inline-flex px-2 sm:px-3 py-1.5 rounded-lg border border-[#2E6B4F] bg-[#2E6B4F] hover:bg-[#24543E] text-white text-[11px] sm:text-[12px] font-bold items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
              title="Auto-fill passport data by uploading up to 3 technical specification or test report PDFs with Gemini AI"
            >
              <Sparkles size={13} className="text-[#A2E2BD]" />
              <span className="hidden sm:inline">AI Auto-Fill (up to 3 PDFs)</span>
              <span className="sm:hidden">Auto-Fill</span>
            </button>

            <button
              onClick={handleClearToBlank}
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg border border-[#E3DECF] bg-white hover:bg-surface-2 text-muted hover:text-ink text-[12px] font-semibold items-center gap-1.5 transition-colors cursor-pointer"
              title="Clear all fields to a blank form"
            >
              <Trash2 size={13} /> <span className="hidden md:inline">Clear to Blank</span>
            </button>

            <button
              onClick={handleOpenJsonModal}
              className="hidden lg:inline-flex px-2.5 py-1.5 rounded-lg border border-[#E3DECF] bg-white hover:bg-surface-2 text-muted hover:text-ink text-[12px] font-semibold items-center gap-1.5 transition-colors cursor-pointer"
              title="View or edit raw JSON"
            >
              <FileCode size={13} /> <span>JSON</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                savedStatus
                  ? 'bg-green text-white border border-green'
                  : 'bg-green text-white hover:bg-green-dark'
              }`}
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : savedStatus ? (
                <Check size={14} />
              ) : (
                <Save size={14} />
              )}
              <span className="hidden xs:inline">{isSaving ? 'Saving...' : savedStatus ? saveMessage : 'Save'}</span>
              <span className="xs:hidden">{isSaving ? '...' : savedStatus ? 'OK' : 'Save'}</span>
            </button>

            {data.general.projectId ? (
              <button
                onClick={handleDeleteThisPassport}
                disabled={isDeletingPassport}
                className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 text-[12px] font-bold items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete this passport from database"
              >
                {isDeletingPassport ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span className="hidden md:inline">Delete DPP</span>
              </button>
            ) : null}

            {data.general.projectId ? (
              <Link
                href={`/dpp/${data.general.projectId}`}
                className="hidden sm:inline-flex px-2.5 sm:px-3 py-1.5 rounded-lg bg-ink text-lime hover:bg-ink/85 text-[12px] font-bold items-center gap-1.5 transition-colors shadow-xs"
                title="View consumer Digital Product Passport"
              >
                <span>View DPP</span>
                <ExternalLink size={13} />
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Upload notification banner */}
      {uploadNotice && (
        <div
          className={`px-4 py-2 border-b flex items-center justify-between text-xs font-semibold ${
            uploadNotice.isCloudinary
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            {uploadNotice.isCloudinary ? (
              <Cloud className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{uploadNotice.message}</span>
          </div>
          <button
            onClick={() => setUploadNotice(null)}
            className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Main Content Area: Editor & Live Preview */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: FORM EDITOR PANEL */}
          {(viewMode === 'editor' || viewMode === 'split') && (
            <div
              className={`flex-1 flex flex-col bg-white border-r border-[#E3DECF] overflow-y-auto ${
                viewMode === 'split' ? 'w-full md:w-1/2 md:max-w-[55%]' : 'w-full max-w-[1200px] mx-auto'
              }`}
            >
              {/* Category Tab Bar */}
              <div className="sticky top-0 z-30 bg-surface border-b border-[#E3DECF] px-2 sm:px-6 py-1.5 sm:py-2 flex gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                {[
                  { id: 'general', label: '1. General & Visuals', icon: Sparkles },
                  { id: 'materials', label: '2. Materials & Composition', icon: Layers },
                  { id: 'measurements', label: '3. Measurements', icon: Ruler },
                  { id: 'traceability', label: '4. Traceability (Tiers 1–4)', icon: Navigation },
                  { id: 'quality', label: '5. Quality & Lab Testing', icon: ShieldCheck },
                  { id: 'care', label: '6. Care & Circularity', icon: Recycle },
                  { id: 'environmental', label: '7. Environmental', icon: Leaf },
                  { id: 'compliance', label: '8. Compliance', icon: FileCheck }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[34px] sm:min-h-[36px] ${
                      activeTab === tab.id
                        ? 'bg-ink text-white shadow-xs'
                        : 'bg-surface-2 border border-line text-muted hover:text-ink hover:border-green'
                    }`}
                  >
                    <tab.icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Form Body */}
              <div className="p-3 sm:p-6 space-y-6 pb-28 md:pb-20">
                {/* Blank State / Quick Action Guidance Banner */}
                <div className="bg-[#FAF8F3] border border-[#E3DECF] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF5EE] text-[#24543E] flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-ink flex items-center gap-2 flex-wrap">
                        <span>{data.general.productName ? data.general.productName : 'Blank Passport Entry'}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#17201B] text-white">
                          #{data.general.projectId}
                        </span>
                        {!data.general.productName && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-soft text-amber border border-amber-line">
                            Blank / Ready For Entry
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
                        {!data.general.productName
                          ? 'This passport was created clean & empty for fresh manual data entry. Fill in details across the 7 tabs below, or load demo sample data anytime.'
                          : 'Editing digital product passport. Real-time changes sync to local storage and live preview.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setPdfModalOpen(true)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#2E6B4F] hover:bg-[#24543E] text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Upload PDF tech pack or test report to auto-fill"
                    >
                      <Sparkles size={12} className="text-[#A2E2BD]" />
                      <span>Auto-Fill from PDF</span>
                    </button>
                    <button
                      onClick={handleClearToBlank}
                      className="px-2.5 py-1.5 rounded-lg border border-[#E3DECF] bg-white hover:bg-surface-2 text-muted hover:text-ink text-[11.5px] font-semibold transition-colors cursor-pointer"
                      title="Wipe form fields back to empty"
                    >
                      Clear to Blank
                    </button>
                  </div>
                </div>
                {/* 1. GENERAL TAB */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[15px] font-bold text-ink mb-1 flex items-center gap-2">
                        <Sparkles size={16} className="text-green" /> Product Identity & Metadata
                      </h3>
                      <p className="text-[12px] text-muted mb-4">
                        Basic passport identifiers, product names, season, and verification status.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Product Title
                          </label>
                          <input
                            type="text"
                            value={data.general.productName || ''}
                            onChange={e => updateGeneral('productName', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Subtitle / Specification
                          </label>
                          <input
                            type="text"
                            value={data.general.subtitle || ''}
                            onChange={e => updateGeneral('subtitle', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Brand Name
                          </label>
                          <input
                            type="text"
                            value={data.general.brand || ''}
                            onChange={e => updateGeneral('brand', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Season
                          </label>
                          <input
                            type="text"
                            value={data.general.season || ''}
                            onChange={e => updateGeneral('season', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Project ID / Internal Ref
                          </label>
                          <input
                            type="text"
                            value={data.general.projectId || ''}
                            onChange={e => updateGeneral('projectId', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-mono outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Order Number
                          </label>
                          <input
                            type="text"
                            value={data.general.orderNo || ''}
                            onChange={e => updateGeneral('orderNo', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-mono outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Passport Version
                          </label>
                          <input
                            type="text"
                            value={data.general.version || ''}
                            onChange={e => updateGeneral('version', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-mono outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Product Category
                          </label>
                          <input
                            type="text"
                            value={data.general.category || ''}
                            onChange={e => updateGeneral('category', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Audit Status
                          </label>
                          <select
                            value={data.general.status || 'DRAFT'}
                            onChange={e => updateGeneral('status', e.target.value as 'VERIFIED' | 'AUDIT PENDING' | 'DRAFT')}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green cursor-pointer font-semibold"
                          >
                            <option value="DRAFT">DRAFT</option>
                            <option value="AUDIT PENDING">AUDIT PENDING</option>
                            <option value="VERIFIED">VERIFIED</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Updated Date
                          </label>
                          <input
                            type="text"
                            value={data.general.updatedDate || ''}
                            onChange={e => updateGeneral('updatedDate', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Completeness Percentage (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={data.general.completeness === 0 ? '' : data.general.completeness}
                            onChange={e => updateGeneral('completeness', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-mono outline-none focus:border-green"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            QR Code Seed String
                          </label>
                          <input
                            type="text"
                            value={data.general.qrCodeSeed || ''}
                            onChange={e => updateGeneral('qrCodeSeed', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-mono outline-none focus:border-green"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Design Description
                          </label>
                          <textarea
                            rows={2}
                            value={data.general.designDescription || ''}
                            onChange={e => updateGeneral('designDescription', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] outline-none focus:border-green"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            QR Verification Note
                          </label>
                          <textarea
                            rows={2}
                            value={data.general.qrCodeLab || ''}
                            onChange={e => updateGeneral('qrCodeLab', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-mono outline-none focus:border-green"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[14px] font-bold text-ink mb-3">Key Product Metrics</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                            Weight (g/m²)
                          </label>
                          <input
                            type="number"
                            value={data.general.weightGsm === 0 ? '' : data.general.weightGsm}
                            onChange={e => updateGeneral('weightGsm', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                            Origin Country
                          </label>
                          <input
                            type="text"
                            value={data.general.originCountry || ''}
                            onChange={e => updateGeneral('originCountry', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                            Target Lifetime
                          </label>
                          <input
                            type="text"
                            value={data.general.lifetimeYears || ''}
                            onChange={e => updateGeneral('lifetimeYears', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                            Impact (kg CO₂e)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={data.general.carbonKg === 0 ? '' : data.general.carbonKg}
                            onChange={e => updateGeneral('carbonKg', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[14px] font-bold text-ink">Certifications & Standard Badges</h3>
                        <button
                          onClick={() => {
                            const b = prompt('Enter badge title:');
                            if (b) updateGeneral('badges', [...(data.general.badges || []), b]);
                          }}
                          className="text-[11.5px] font-semibold text-green-dark bg-green-soft px-2.5 py-1 rounded-md border border-[#BCD8C6] flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} /> Add Badge
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(data.general.badges || []).map((badge, idx) => (
                          <span
                            key={idx}
                            className="bg-white border border-line rounded-full pl-3 pr-2 py-1 text-[12px] font-semibold text-muted flex items-center gap-1.5"
                          >
                            <span>{badge}</span>
                            <button
                              onClick={() => {
                                const copy = [...(data.general.badges || [])];
                                copy.splice(idx, 1);
                                updateGeneral('badges', copy);
                              }}
                              className="hover:text-red transition-colors p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 45-Combination GTIN Matrix (9 Colorways × 5 Sizes) */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div>
                          <h3 className="text-[14px] font-bold text-ink flex items-center gap-2">
                            <Barcode size={16} className="text-green-dark" />
                            45 GTIN / EAN-13 Matrix (9 Colorways × 5 Sizes)
                          </h3>
                          <p className="text-[12px] text-muted">
                            Mandatory GS1 standard 13-digit barcodes for all size and colorway combinations.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const basePrefix = '4061234';
                              const nextGtin: Record<string, Record<string, string>> = {};
                              const nextArticles: Record<string, Record<string, string>> = {};
                              let counter = 730800;

                              for (let i = 1; i <= 9; i++) {
                                const cwKey = `cw${i}`;
                                nextGtin[cwKey] = {};
                                nextArticles[cwKey] = {};
                                SIZES.forEach((sz, sIdx) => {
                                  counter += 1;
                                  nextGtin[cwKey][sz] = `${basePrefix}${counter.toString().padStart(6, '0')}`;
                                  nextArticles[cwKey][sz] = `ART-${i}0${sIdx + 1}-BV`;
                                });
                              }

                              updateGeneral('gtinCodes', nextGtin);
                              updateGeneral('articleNumbers', nextArticles);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#2E6B4F] text-white hover:bg-[#24533e] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Sparkles size={12} /> Auto-Generate 45 Barcodes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateGeneral('gtinCodes', {});
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-red-50 text-red-600 border border-line transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                        {Array.from({ length: 9 }).map((_, idx) => {
                          const cwKey = `cw${idx + 1}`;
                          const cwMeta = data.general.visuals?.colorways?.[idx];
                          const cwName = cwMeta?.name || `Colorway ${idx + 1}`;
                          const hex = cwMeta?.hex || '#666666';

                          return (
                            <div key={cwKey} className="bg-white border border-line rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block shadow-2xs"
                                    style={{ backgroundColor: hex }}
                                  />
                                  <span className="text-[12px] font-bold text-ink">
                                    Slot {idx + 1}: {cwName}
                                  </span>
                                  {cwMeta?.pantone && (
                                    <span className="text-[10px] font-mono text-muted bg-surface-2 px-1.5 py-0.5 rounded">
                                      {cwMeta.pantone}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10.5px] font-mono text-muted">cw{idx + 1}</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {SIZES.map((sz) => {
                                  const gtinVal = data.general?.gtinCodes?.[cwKey]?.[sz] || '';
                                  return (
                                    <div key={sz}>
                                      <label className="text-[10px] font-mono text-muted flex items-center justify-between mb-0.5">
                                        <span>Size {sz}</span>
                                      </label>
                                      <input
                                        type="text"
                                        maxLength={14}
                                        placeholder="13-digit GTIN"
                                        value={gtinVal}
                                        onChange={(e) => {
                                          const next = { ...(data.general?.gtinCodes || {}) };
                                          if (!next[cwKey]) next[cwKey] = {};
                                          next[cwKey] = { ...next[cwKey], [sz]: e.target.value };
                                          updateGeneral('gtinCodes', next);
                                        }}
                                        className="w-full bg-surface-2 border border-line rounded px-2 py-1 text-[11px] font-mono focus:bg-white focus:border-green"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 9 Dedicated Product Image Upload Slots */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div>
                          <h3 className="text-[14px] font-bold text-ink flex items-center gap-2">
                            <Palette size={16} className="text-green-dark" />
                            9 Dedicated Product Image Upload Slots
                          </h3>
                          <p className="text-[12px] text-muted">
                            High-resolution baby wear angles, colour swatches, prints &amp; detail shots.
                          </p>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-green/10 text-green-dark">
                          9 Slots Available
                        </span>
                      </div>

                      {/* Hidden single file input for multi-slot uploading */}
                      <input
                        ref={galleryUploadInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && currentGalleryIndex !== null) {
                            const idx = currentGalleryIndex;
                            handleImageFileUpload(file, `gallery_slot_${idx + 1}`, (url) => {
                              const existingCws = [...(data.general.visuals?.colorways || [])];
                              while (existingCws.length < 9) {
                                existingCws.push({
                                  name: `Colorway ${existingCws.length + 1}`,
                                  pantone: '',
                                  hex: '#4A7C59',
                                  image: '',
                                  side: 'front',
                                  angle: 'front'
                                });
                              }
                              existingCws[idx] = {
                                ...existingCws[idx],
                                image: url
                              };
                              const v = {
                                ...data.general.visuals,
                                colorways: existingCws,
                                ...(idx === 0 ? { cw1Image: url } : {}),
                                ...(idx === 1 ? { cw2Image: url } : {})
                              };
                              updateGeneral('visuals', v);
                            });
                          }
                          e.target.value = '';
                        }}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {Array.from({ length: 9 }).map((_, idx) => {
                          const existingCws = data.general.visuals?.colorways || [];
                          const item = existingCws[idx] || {
                            name: idx === 0 ? (data.general.visuals.cw1Name || 'Jadeite Stripe') : idx === 1 ? (data.general.visuals.cw2Name || 'Forest Leaf AOP') : `Colorway ${idx + 1}`,
                            pantone: '',
                            hex: idx === 0 ? '#5B8C71' : idx === 1 ? '#2E4F3E' : '#666666',
                            image: idx === 0 ? (data.general.visuals.cw1Image || '') : idx === 1 ? (data.general.visuals.cw2Image || '') : '',
                            side: 'front',
                            angle: 'front'
                          };

                          const slotImg = item.image || (idx === 0 ? data.general.visuals.cw1Image : idx === 1 ? data.general.visuals.cw2Image : '') || '';

                          return (
                            <div
                              key={idx}
                              className="bg-white border border-line rounded-xl p-3 flex flex-col justify-between shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                                  <span
                                    className="w-3 h-3 rounded-full border border-black/10 inline-block"
                                    style={{ backgroundColor: item.hex || '#5B8C71' }}
                                  />
                                  Slot {idx + 1}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={uploadingField === `gallery_slot_${idx + 1}`}
                                    onClick={() => {
                                      setCurrentGalleryIndex(idx);
                                      galleryUploadInputRef.current?.click();
                                    }}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2E6B4F]/10 hover:bg-[#2E6B4F]/20 text-[#2E6B4F] flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Upload image to Cloudinary"
                                  >
                                    {uploadingField === `gallery_slot_${idx + 1}` ? (
                                      <>
                                        <Loader2 size={10} className="animate-spin" />
                                        <span>...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Upload size={10} />
                                        <span>Upload</span>
                                      </>
                                    )}
                                  </button>
                                  {slotImg && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cws = [...(data.general.visuals?.colorways || [])];
                                        while (cws.length < 9) {
                                          cws.push({ name: `Colorway ${cws.length + 1}`, pantone: '', hex: '#4A7C59', image: '' });
                                        }
                                        cws[idx] = { ...cws[idx], image: '' };
                                        const v = {
                                          ...data.general.visuals,
                                          colorways: cws,
                                          ...(idx === 0 ? { cw1Image: '' } : {}),
                                          ...(idx === 1 ? { cw2Image: '' } : {})
                                        };
                                        updateGeneral('visuals', v);
                                      }}
                                      className="p-1 rounded text-muted hover:text-red-600 cursor-pointer"
                                      title="Clear image"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Slot Image Preview */}
                              <div className="relative w-full h-28 bg-surface-2 rounded-lg border border-line overflow-hidden flex items-center justify-center">
                                {slotImg ? (
                                  <img
                                    src={slotImg}
                                    alt={`Slot ${idx + 1}`}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <div className="text-center p-2">
                                    <ImageIcon size={22} className="mx-auto text-muted/50 mb-1" />
                                    <span className="text-[10px] text-muted">No image uploaded</span>
                                  </div>
                                )}
                              </div>

                              {/* Name & Pantone inputs */}
                              <div className="space-y-1.5 text-[11px]">
                                <div>
                                  <input
                                    type="text"
                                    placeholder="Colorway / View name"
                                    value={item.name || ''}
                                    onChange={(e) => {
                                      const cws = [...(data.general.visuals?.colorways || [])];
                                      while (cws.length < 9) {
                                        cws.push({ name: `Colorway ${cws.length + 1}`, pantone: '', hex: '#4A7C59', image: '' });
                                      }
                                      cws[idx] = { ...cws[idx], name: e.target.value };
                                      const v = {
                                        ...data.general.visuals,
                                        colorways: cws,
                                        ...(idx === 0 ? { cw1Name: e.target.value } : {}),
                                        ...(idx === 1 ? { cw2Name: e.target.value } : {})
                                      };
                                      updateGeneral('visuals', v);
                                    }}
                                    className="w-full bg-surface-2 border border-line rounded px-2 py-1 text-[11.5px] font-semibold text-ink"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Pantone TCX"
                                    value={item.pantone || ''}
                                    onChange={(e) => {
                                      const cws = [...(data.general.visuals?.colorways || [])];
                                      while (cws.length < 9) {
                                        cws.push({ name: `Colorway ${cws.length + 1}`, pantone: '', hex: '#4A7C59', image: '' });
                                      }
                                      cws[idx] = { ...cws[idx], pantone: e.target.value };
                                      updateGeneral('visuals', { ...data.general.visuals, colorways: cws });
                                    }}
                                    className="w-full bg-surface-2 border border-line rounded px-1.5 py-1 text-[10.5px] font-mono"
                                  />
                                  <div className="flex items-center gap-1 bg-surface-2 border border-line rounded px-1.5 py-0.5">
                                    <input
                                      type="color"
                                      value={item.hex || '#4A7C59'}
                                      onChange={(e) => {
                                        const cws = [...(data.general.visuals?.colorways || [])];
                                        while (cws.length < 9) {
                                          cws.push({ name: `Colorway ${cws.length + 1}`, pantone: '', hex: '#4A7C59', image: '' });
                                        }
                                        cws[idx] = { ...cws[idx], hex: e.target.value };
                                        updateGeneral('visuals', { ...data.general.visuals, colorways: cws });
                                      }}
                                      className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={item.hex || '#4A7C59'}
                                      onChange={(e) => {
                                        const cws = [...(data.general.visuals?.colorways || [])];
                                        while (cws.length < 9) {
                                          cws.push({ name: `Colorway ${cws.length + 1}`, pantone: '', hex: '#4A7C59', image: '' });
                                        }
                                        cws[idx] = { ...cws[idx], hex: e.target.value };
                                        updateGeneral('visuals', { ...data.general.visuals, colorways: cws });
                                      }}
                                      className="w-full text-[10px] font-mono bg-transparent outline-none"
                                    />
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Direct Image URL"
                                  value={slotImg}
                                  onChange={(e) => {
                                    const cws = [...(data.general.visuals?.colorways || [])];
                                    while (cws.length < 9) {
                                      cws.push({ name: `Colorway ${cws.length + 1}`, pantone: '', hex: '#4A7C59', image: '' });
                                    }
                                    cws[idx] = { ...cws[idx], image: e.target.value };
                                    const v = {
                                      ...data.general.visuals,
                                      colorways: cws,
                                      ...(idx === 0 ? { cw1Image: e.target.value } : {}),
                                      ...(idx === 1 ? { cw2Image: e.target.value } : {})
                                    };
                                    updateGeneral('visuals', v);
                                  }}
                                  className="w-full bg-surface-2 border border-line rounded px-2 py-0.5 text-[10px] font-mono"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-3 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            AI Model / Render Engine Info
                          </label>
                          <input
                            type="text"
                            value={data.general.visuals.aiModelInfo || ''}
                            onChange={(e) => {
                              const v = { ...data.general.visuals, aiModelInfo: e.target.value };
                              updateGeneral('visuals', v);
                            }}
                            placeholder="e.g., Stable Diffusion XL / Midjourney v6 (Photorealistic Garment Render)"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Prompt
                          </label>
                          <input
                            type="text"
                            value={data.general.visuals.prompt || ''}
                            onChange={(e) => {
                              const v = { ...data.general.visuals, prompt: e.target.value };
                              updateGeneral('visuals', v);
                            }}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Colour References (Pantone / Coloro)
                          </label>
                          <input
                            type="text"
                            value={data.general.visuals.colors || ''}
                            onChange={(e) => {
                              const v = { ...data.general.visuals, colors: e.target.value };
                              updateGeneral('visuals', v);
                            }}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MATERIALS & RSL TAB */}
                {activeTab === 'materials' && (
                  <div className="space-y-6">
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[15px] font-bold text-ink mb-1 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-green" /> Fiber Composition Breakdown
                      </h3>
                      <p className="text-[12px] text-muted mb-4">
                        Percentage of fibers (must total 100%). Modifying these values immediately adjusts the circular chart in the preview!
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-green-dark uppercase tracking-wider mb-1">
                            Cotton %
                          </label>
                          <input
                            type="number"
                            value={data.materials.cotton === 0 ? '' : data.materials.cotton}
                            onChange={e => updateMaterials('cotton', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 font-mono text-[14px] font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-green-dark uppercase tracking-wider mb-1">
                            Modal %
                          </label>
                          <input
                            type="number"
                            value={data.materials.modal === 0 ? '' : data.materials.modal}
                            onChange={e => updateMaterials('modal', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 font-mono text-[14px] font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-green-dark uppercase tracking-wider mb-1">
                            Elastane %
                          </label>
                          <input
                            type="number"
                            value={data.materials.elastane === 0 ? '' : data.materials.elastane}
                            onChange={e => updateMaterials('elastane', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 font-mono text-[14px] font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Recycled Content %
                          </label>
                          <input
                            type="number"
                            value={data.materials.recycledContent === 0 ? '' : data.materials.recycledContent}
                            onChange={e => updateMaterials('recycledContent', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 font-mono text-[14px]"
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-line text-[12px] flex items-center justify-between">
                        <span className="text-muted">Composition Sum:</span>
                        <span className={`font-mono font-bold ${data.materials.cotton + data.materials.modal + data.materials.elastane === 100 ? 'text-green' : 'text-red'}`}>
                          {data.materials.cotton + data.materials.modal + data.materials.elastane}%
                          {data.materials.cotton + data.materials.modal + data.materials.elastane > 0 && data.materials.cotton + data.materials.modal + data.materials.elastane !== 100 && ' (Recommended: 100%)'}
                        </span>
                      </div>
                    </div>

                    {/* Yarn & Fiber Sources */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[14px] font-bold text-ink mb-3">Yarn Certificates & Sourcing Notes</h3>
                      <div className="space-y-3 text-[13px]">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Cotton Certificate
                          </label>
                          <input
                            type="text"
                            value={data.materials.yarnSources?.cottonCert || ''}
                            onChange={e => {
                              const s = { ...data.materials.yarnSources, cottonCert: e.target.value };
                              updateMaterials('yarnSources', s);
                            }}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Modal Certificate
                          </label>
                          <input
                            type="text"
                            value={data.materials.yarnSources?.modalCert || ''}
                            onChange={e => {
                              const s = { ...data.materials.yarnSources, modalCert: e.target.value };
                              updateMaterials('yarnSources', s);
                            }}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Elastane Certificate
                          </label>
                          <input
                            type="text"
                            value={data.materials.yarnSources?.elastaneCert || ''}
                            onChange={e => {
                              const s = { ...data.materials.yarnSources, elastaneCert: e.target.value };
                              updateMaterials('yarnSources', s);
                            }}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Microfibre Shedding Note
                          </label>
                          <textarea
                            rows={2}
                            value={data.materials.microfibreNote || ''}
                            onChange={e => updateMaterials('microfibreNote', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SVHC Substances Table */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[14px] font-bold text-ink">SVHC Substances Tested</h3>
                        <button
                          onClick={() => {
                            const newSub = {
                              substance: '',
                              cas: '',
                              component: '',
                              status: ''
                            };
                            updateMaterials('svhcSubstances', [...data.materials.svhcSubstances, newSub]);
                          }}
                          className="text-[11px] font-semibold text-green-dark bg-green-soft px-2.5 py-1 rounded-md border border-[#BCD8C6] flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Add Substance
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(data.materials?.svhcSubstances || []).map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-line">
                            <input
                              type="text"
                              value={item.substance || ''}
                              onChange={e => {
                                const list = [...(data.materials?.svhcSubstances || [])];
                                list[idx].substance = e.target.value;
                                updateMaterials('svhcSubstances', list);
                              }}
                              className="flex-2 bg-transparent text-[12px] font-medium border-b border-transparent focus:border-green outline-none"
                            />
                            <input
                              type="text"
                              value={item.cas || ''}
                              onChange={e => {
                                const list = [...(data.materials?.svhcSubstances || [])];
                                list[idx].cas = e.target.value;
                                updateMaterials('svhcSubstances', list);
                              }}
                              className="w-24 bg-transparent text-[11px] font-mono text-muted border-b border-transparent focus:border-green outline-none"
                            />
                            <input
                              type="text"
                              value={item.component || ''}
                              onChange={e => {
                                const list = [...(data.materials?.svhcSubstances || [])];
                                list[idx].component = e.target.value;
                                updateMaterials('svhcSubstances', list);
                              }}
                              className="w-24 bg-transparent text-[11px] text-muted border-b border-transparent focus:border-green outline-none"
                            />
                            <input
                              type="text"
                              value={item.status || ''}
                              onChange={e => {
                                const list = [...(data.materials?.svhcSubstances || [])];
                                list[idx].status = e.target.value;
                                updateMaterials('svhcSubstances', list);
                              }}
                              className="w-28 bg-transparent text-[11px] font-bold text-green-dark border-b border-transparent focus:border-green outline-none"
                            />
                            <button
                              onClick={() => {
                                const list = [...(data.materials?.svhcSubstances || [])];
                                list.splice(idx, 1);
                                updateMaterials('svhcSubstances', list);
                              }}
                              className="text-muted hover:text-red p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RSL Items */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[14px] font-bold text-ink">Restricted Substances (RSL Cat 1)</h3>
                        <button
                          onClick={() => {
                            const newRsl = { name: '', result: '' };
                            setData(prev => ({
                              ...prev,
                              quality: { ...prev.quality, rslItems: [...prev.quality.rslItems, newRsl] }
                            }));
                          }}
                          className="text-[11px] font-semibold text-green-dark bg-green-soft px-2.5 py-1 rounded-md border border-[#BCD8C6] flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Add RSL Item
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(data.quality?.rslItems || []).map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-line">
                            <input
                              type="text"
                              value={item.name || ''}
                              onChange={e => {
                                const list = [...(data.quality?.rslItems || [])];
                                list[idx].name = e.target.value;
                                setData(prev => ({ ...prev, quality: { ...prev.quality, rslItems: list } }));
                              }}
                              className="flex-1 bg-transparent text-[12px] font-medium border-b border-transparent focus:border-green outline-none"
                            />
                            <input
                              type="text"
                              value={item.result || ''}
                              onChange={e => {
                                const list = [...(data.quality?.rslItems || [])];
                                list[idx].result = e.target.value;
                                setData(prev => ({ ...prev, quality: { ...prev.quality, rslItems: list } }));
                              }}
                              className="flex-1 bg-transparent text-[11.5px] font-mono text-muted border-b border-transparent focus:border-green outline-none"
                            />
                            <button
                              onClick={() => {
                                const list = [...(data.quality?.rslItems || [])];
                                list.splice(idx, 1);
                                setData(prev => ({ ...prev, quality: { ...prev.quality, rslItems: list } }));
                              }}
                              className="text-muted hover:text-red p-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MEASUREMENTS TAB */}
                {activeTab === 'measurements' && (
                  <div className="space-y-6">
                    {/* Category Selector */}
                    <div className="border border-line rounded-xl p-4 sm:p-5 bg-white shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-[14.5px] font-bold text-ink flex items-center gap-2">
                            <Ruler size={16} className="text-green" /> Garment Construction &amp; Sizing Category
                          </h3>
                          <p className="text-[12px] text-muted mt-0.5">
                            Select whether this product is a 1-piece baby wear / romper or a 2-piece set.
                          </p>
                        </div>
                        <div className="flex bg-surface-2 border border-line rounded-xl p-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setData(prev => ({
                                ...prev,
                                measurements: {
                                  ...prev.measurements,
                                  categoryType: 'one_piece',
                                  sizeHeaders: ['50/56', '62/68', '74/80', '86/92', '98/104']
                                }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                              data.measurements?.categoryType === 'one_piece'
                                ? 'bg-ink text-lime shadow-xs'
                                : 'text-muted hover:text-ink'
                            }`}
                          >
                            One-Piece (Baby Wear)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setData(prev => ({
                                ...prev,
                                measurements: {
                                  ...prev.measurements,
                                  categoryType: 'two_piece',
                                  sizeHeaders: ['S', 'M', 'L', 'XL', 'XXL']
                                }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                              data.measurements?.categoryType !== 'one_piece'
                                ? 'bg-ink text-lime shadow-xs'
                                : 'text-muted hover:text-ink'
                            }`}
                          >
                            Two-Piece (Top + Bottom)
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Size Headers Configuration */}
                      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-[11.5px] font-bold uppercase tracking-wider text-muted">
                          Active Size Range:
                        </span>
                        <div className="flex gap-1.5 flex-wrap items-center">
                          {(data.measurements?.sizeHeaders || (data.measurements?.categoryType === 'one_piece' ? ['50/56', '62/68', '74/80', '86/92', '98/104'] : ['S', 'M', 'L', 'XL', 'XXL'])).map((sz, i) => (
                            <span
                              key={i}
                              className="font-mono text-[11px] font-bold bg-surface-2 border border-line text-ink px-2.5 py-1 rounded-lg"
                            >
                              {sz}
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const currentSizes = data.measurements?.sizeHeaders || (data.measurements?.categoryType === 'one_piece' ? ['50/56', '62/68', '74/80', '86/92', '98/104'] : ['S', 'M', 'L', 'XL', 'XXL']);
                              const newSz = prompt('Add new size header label (e.g. 110/116 or 3XL):');
                              if (newSz && newSz.trim()) {
                                setData(prev => ({
                                  ...prev,
                                  measurements: {
                                    ...prev.measurements,
                                    sizeHeaders: [...currentSizes, newSz.trim()]
                                  }
                                }));
                              }
                            }}
                            className="text-[11px] font-semibold text-green-dark bg-green-soft hover:bg-green-soft/80 border border-[#BCD8C6] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={12} /> Add Size
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 1. ONE-PIECE MEASUREMENTS (Shown when categoryType === 'one_piece') */}
                    {data.measurements?.categoryType === 'one_piece' ? (
                      <div className="border border-line rounded-xl p-5 bg-surface-2">
                        <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                          <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                            <Ruler size={16} className="text-green" /> One-Piece Measurements (Baby Sleepsuit / Romper in cm)
                          </h3>
                          <span className="text-[11px] font-mono text-green-dark bg-green-soft px-2.5 py-0.5 rounded-full border border-[#BCD8C6] font-semibold">
                            {data.measurements?.onePiece?.length || 0} POMs defined
                          </span>
                        </div>
                        <p className="text-[12px] text-muted mb-4">
                          All 16 Points of Measurement across baby sizes (50/56 to 98/104) in a single unified table. No top/bottom split.
                        </p>

                        <div className="space-y-3">
                          {(data.measurements?.onePiece || []).map((row, idx) => {
                            const activeSizeKeys = data.measurements?.sizeHeaders || ['50/56', '62/68', '74/80', '86/92', '98/104'];
                            return (
                              <div key={idx} className="bg-white p-3.5 rounded-xl border border-line space-y-2.5 shadow-2xs">
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={row.k || ''}
                                    placeholder="POM"
                                    onChange={e => {
                                      const list = [...(data.measurements?.onePiece || [])];
                                      list[idx].k = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, onePiece: list } }));
                                    }}
                                    className="w-14 text-center font-mono font-bold text-green bg-surface-2 border border-line rounded py-1 text-[12px]"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Measurement Name (e.g. 1/2 Chest width)"
                                    value={row.name || ''}
                                    onChange={e => {
                                      const list = [...(data.measurements?.onePiece || [])];
                                      list[idx].name = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, onePiece: list } }));
                                    }}
                                    className="flex-1 font-bold text-[13px] border-b border-transparent focus:border-green outline-none"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Measurement description / method"
                                    value={row.how || ''}
                                    onChange={e => {
                                      const list = [...(data.measurements?.onePiece || [])];
                                      list[idx].how = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, onePiece: list } }));
                                    }}
                                    className="flex-1 text-[12px] text-muted border-b border-transparent focus:border-green outline-none hidden sm:block"
                                  />
                                  <button
                                    onClick={() => {
                                      const list = [...(data.measurements?.onePiece || [])];
                                      list.splice(idx, 1);
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, onePiece: list } }));
                                    }}
                                    className="text-muted hover:text-red p-1 cursor-pointer"
                                    title="Delete row"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-line/60">
                                  {activeSizeKeys.map(sz => (
                                    <div key={sz} className="flex items-center gap-1.5 bg-surface-2 p-1.5 rounded-lg">
                                      <span className="text-[10.5px] font-mono font-bold text-muted min-w-[38px]">{sz}:</span>
                                      <input
                                        type="number"
                                        step="0.1"
                                        placeholder="0"
                                        value={row.vals?.[sz] === 0 || row.vals?.[sz] === undefined ? '' : row.vals[sz]}
                                        onChange={e => {
                                          const list = [...(data.measurements?.onePiece || [])];
                                          if (!list[idx].vals) list[idx].vals = {};
                                          list[idx].vals[sz] = e.target.value === '' ? 0 : Number(e.target.value);
                                          setData(prev => ({ ...prev, measurements: { ...prev.measurements, onePiece: list } }));
                                        }}
                                        className="w-full bg-white border border-line rounded px-2 py-0.5 text-[12px] font-mono font-bold text-right"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                          <button
                            onClick={() => {
                              const current = data.measurements?.onePiece || [];
                              const activeSizeKeys = data.measurements?.sizeHeaders || ['50/56', '62/68', '74/80', '86/92', '98/104'];
                              const initialVals: Record<string, number> = {};
                              activeSizeKeys.forEach(k => { initialVals[k] = 0; });
                              const newRow: MeasurementRow = {
                                k: `P${current.length + 1}`,
                                name: '',
                                how: '',
                                vals: initialVals,
                                tolMinus: 0.5,
                                tolPlus: 0.5,
                                g: null
                              };
                              setData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, onePiece: [...(prev.measurements?.onePiece || []), newRow] }
                              }));
                            }}
                            className="w-full py-2.5 border border-dashed border-line-2 rounded-xl text-[12.5px] font-semibold text-muted hover:text-green-dark hover:border-green flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
                          >
                            <Plus size={14} /> Add One-Piece Measurement Row
                          </button>
                        </div>

                        <div className="mt-4 pt-3 border-t border-line">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Fit Guide / One-Piece Silhouette Description
                          </label>
                          <textarea
                            rows={2}
                            value={data.measurements.onePieceFit || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                measurements: { ...prev.measurements, onePieceFit: e.target.value }
                              }))
                            }
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                          />
                        </div>
                      </div>
                    ) : (
                      /* 2. TWO-PIECE MEASUREMENTS (Shown when categoryType !== 'one_piece') */
                      <div className="space-y-6">
                        <div className="border border-line rounded-xl p-5 bg-surface-2">
                          <h3 className="text-[15px] font-bold text-ink mb-1 flex items-center gap-2">
                            <Ruler size={16} className="text-green" /> Top Measurements (S–XXL in cm)
                          </h3>
                          <p className="text-[12px] text-muted mb-4">
                            Define measurement points and exact centimeter values for each garment size.
                          </p>

                          <div className="space-y-3">
                            {(data.measurements?.top || []).map((row, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-xl border border-line space-y-2">
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={row.k || ''}
                                    onChange={e => {
                                      const list = [...(data.measurements?.top || [])];
                                      list[idx].k = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, top: list } }));
                                    }}
                                    className="w-10 text-center font-mono font-bold text-green bg-surface-2 border border-line rounded py-1 text-[12px]"
                                  />
                                  <input
                                    type="text"
                                    value={row.name || ''}
                                    onChange={e => {
                                      const list = [...(data.measurements?.top || [])];
                                      list[idx].name = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, top: list } }));
                                    }}
                                    className="flex-1 font-bold text-[13px] border-b border-transparent focus:border-green outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={row.how || ''}
                                    onChange={e => {
                                      const list = [...(data.measurements?.top || [])];
                                      list[idx].how = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, top: list } }));
                                    }}
                                    className="flex-1 text-[12px] text-muted border-b border-transparent focus:border-green outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const list = [...(data.measurements?.top || [])];
                                      list.splice(idx, 1);
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, top: list } }));
                                    }}
                                    className="text-muted hover:text-red p-1"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 pt-1 border-t border-line/60">
                                  {SIZES.map(sz => (
                                    <div key={sz} className="flex items-center gap-1.5 bg-surface-2/60 sm:bg-transparent p-1 sm:p-0 rounded-md">
                                      <span className="text-[10px] font-mono font-bold text-muted w-6">{sz}:</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={row.vals?.[sz] === 0 || row.vals?.[sz] === undefined ? '' : row.vals[sz]}
                                        onChange={e => {
                                          const list = [...(data.measurements?.top || [])];
                                          if (!list[idx].vals) {
                                            list[idx].vals = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
                                          }
                                          list[idx].vals[sz] = e.target.value === '' ? 0 : Number(e.target.value);
                                          setData(prev => ({ ...prev, measurements: { ...prev.measurements, top: list } }));
                                        }}
                                        className="w-full bg-surface-2 border border-line rounded px-2 py-0.5 text-[12px] font-mono text-right"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => {
                                const currentTop = data.measurements?.top || [];
                                const newRow: MeasurementRow = {
                                  k: String.fromCharCode(65 + currentTop.length),
                                  name: '',
                                  how: '',
                                  vals: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
                                  g: null
                                };
                                setData(prev => ({
                                  ...prev,
                                  measurements: { ...prev.measurements, top: [...(prev.measurements?.top || []), newRow] }
                                }));
                              }}
                              className="w-full py-2 border border-dashed border-line-2 rounded-xl text-[12px] font-semibold text-muted hover:text-green-dark hover:border-green flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Plus size={14} /> Add Top Measurement Row
                            </button>
                          </div>

                          <div className="mt-4 pt-3 border-t border-line">
                            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                              Top Fit Guide Description
                            </label>
                            <textarea
                              rows={2}
                              value={data.measurements.topFit || ''}
                              onChange={e =>
                                setData(prev => ({
                                  ...prev,
                                  measurements: { ...prev.measurements, topFit: e.target.value }
                                }))
                              }
                              className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                            />
                          </div>
                        </div>

                        {/* Bottom Measurements */}
                        <div className="border border-line rounded-xl p-5 bg-surface-2">
                          <h3 className="text-[15px] font-bold text-ink mb-1 flex items-center gap-2">
                            <Ruler size={16} className="text-green" /> Bottom / Shorts Measurements (S–XXL in cm)
                          </h3>
                          <p className="text-[12px] text-muted mb-4">
                            Points of measurement for the shorts or bottom garment.
                          </p>

                          <div className="space-y-3">
                            {(data.measurements?.bottom || []).map((row, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-xl border border-line space-y-2">
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={row.k || ''}
                                    onChange={e => {
                                      const list = [...(data.measurements?.bottom || [])];
                                      list[idx].k = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, bottom: list } }));
                                    }}
                                    className="w-10 text-center font-mono font-bold text-green bg-surface-2 border border-line rounded py-1 text-[12px]"
                                  />
                                  <input
                                    type="text"
                                    value={row.name || ''}
                                    onChange={e => {
                                      const list = [...(data.measurements?.bottom || [])];
                                      list[idx].name = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, bottom: list } }));
                                    }}
                                    className="flex-1 font-bold text-[13px] border-b border-transparent focus:border-green outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={row.how || ''}
                                    onChange={e => {
                                      const list = [...(data.measurements?.bottom || [])];
                                      list[idx].how = e.target.value;
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, bottom: list } }));
                                    }}
                                    className="flex-1 text-[12px] text-muted border-b border-transparent focus:border-green outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const list = [...(data.measurements?.bottom || [])];
                                      list.splice(idx, 1);
                                      setData(prev => ({ ...prev, measurements: { ...prev.measurements, bottom: list } }));
                                    }}
                                    className="text-muted hover:text-red p-1"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 pt-1 border-t border-line/60">
                                  {SIZES.map(sz => (
                                    <div key={sz} className="flex items-center gap-1.5 bg-surface-2/60 sm:bg-transparent p-1 sm:p-0 rounded-md">
                                      <span className="text-[10px] font-mono font-bold text-muted w-6">{sz}:</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={row.vals?.[sz] === 0 || row.vals?.[sz] === undefined ? '' : row.vals[sz]}
                                        onChange={e => {
                                          const list = [...(data.measurements?.bottom || [])];
                                          if (!list[idx].vals) {
                                            list[idx].vals = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
                                          }
                                          list[idx].vals[sz] = e.target.value === '' ? 0 : Number(e.target.value);
                                          setData(prev => ({ ...prev, measurements: { ...prev.measurements, bottom: list } }));
                                        }}
                                        className="w-full bg-surface-2 border border-line rounded px-2 py-0.5 text-[12px] font-mono text-right"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => {
                                const currentBottom = data.measurements?.bottom || [];
                                const newRow: MeasurementRow = {
                                  k: String.fromCharCode(65 + currentBottom.length),
                                  name: '',
                                  how: '',
                                  vals: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
                                  g: null
                                };
                                setData(prev => ({
                                  ...prev,
                                  measurements: { ...prev.measurements, bottom: [...(prev.measurements?.bottom || []), newRow] }
                                }));
                              }}
                              className="w-full py-2 border border-dashed border-line-2 rounded-xl text-[12px] font-semibold text-muted hover:text-green-dark hover:border-green flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Plus size={14} /> Add Bottom Measurement Row
                            </button>
                          </div>

                          <div className="mt-4 pt-3 border-t border-line">
                            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                              Bottom Fit Guide Description
                            </label>
                            <textarea
                              rows={2}
                              value={data.measurements.bottomFit || ''}
                              onChange={e =>
                                setData(prev => ({
                                  ...prev,
                                  measurements: { ...prev.measurements, bottomFit: e.target.value }
                                }))
                              }
                              className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TRACEABILITY TAB */}
                {activeTab === 'traceability' && (
                  <div className="space-y-6">
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[15px] font-bold text-ink mb-1 flex items-center gap-2">
                        <Navigation size={16} className="text-green" /> Overall Traceability Score
                      </h3>
                      <p className="text-[12px] text-muted mb-4">
                        Verification completeness percentage and summary text.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Traceability %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={data.traceability.percentage === 0 ? '' : data.traceability.percentage}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                traceability: { ...prev.traceability, percentage: e.target.value === '' ? 0 : Number(e.target.value) }
                              }))
                            }
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 font-mono text-[14px] font-bold text-green-dark"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Summary Description
                          </label>
                          <input
                            type="text"
                            value={data.traceability.summary || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                traceability: { ...prev.traceability, summary: e.target.value }
                              }))
                            }
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nodes list */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <div>
                          <h3 className="text-[15px] font-bold text-ink">Supply Chain Tier Nodes (Tiers 1 to 3)</h3>
                          <p className="text-[12px] text-muted">
                            Traceability chain from garment assembly (Tier 1), fabric manufacturing (Tier 2), and fiber/yarn (Tier 3).
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const isBaby =
                                data.measurements?.categoryType === 'one_piece' ||
                                (data.measurements?.onePiece && data.measurements.onePiece.length > 0) ||
                                String(data.general?.category || '').toLowerCase().includes('baby') ||
                                String(data.general?.productName || '').toLowerCase().includes('sleepsuit');
                              const fullNodes = ensureFullSupplyChainNodes(
                                undefined,
                                isBaby,
                                data.traceability?.origin?.facility || data.general?.originCountry
                              );
                              setData(prev => ({
                                ...prev,
                                traceability: {
                                  ...prev.traceability,
                                  nodes: fullNodes,
                                  origin: isBaby ? BABY_WEAR_PASSPORT_PRESET.traceability.origin : prev.traceability.origin,
                                  destination: isBaby ? BABY_WEAR_PASSPORT_PRESET.traceability.destination : prev.traceability.destination,
                                  testingLab: isBaby ? BABY_WEAR_PASSPORT_PRESET.traceability.testingLab : prev.traceability.testingLab,
                                  percentage: 100,
                                  summary: isBaby
                                    ? 'Verified Tier 1 (Garment), Tier 2 (Fabric) & Tier 3 (Yarn) supply chain with accredited lab testing.'
                                    : 'Verified Tier 1 to Tier 3 supply chain with accredited testing records.'
                                }
                              }));
                            }}
                            className="text-[11.5px] font-semibold text-white bg-green hover:bg-green-dark px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                          >
                            <Sparkles size={13} /> Reset Standard 3 Tiers
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setData(prev => ({
                                ...prev,
                                traceability: {
                                  ...prev.traceability,
                                  nodes: BABY_WEAR_PASSPORT_PRESET.traceability.nodes,
                                  origin: BABY_WEAR_PASSPORT_PRESET.traceability.origin,
                                  destination: BABY_WEAR_PASSPORT_PRESET.traceability.destination,
                                  testingLab: BABY_WEAR_PASSPORT_PRESET.traceability.testingLab,
                                  percentage: 100,
                                  summary: 'Verified Tier 1 (Garment), Tier 2 (Fabric) & Tier 3 (Yarn) supply chain.'
                                }
                              }));
                            }}
                            className="text-[11px] font-semibold text-green-dark bg-green-soft hover:bg-green-soft/80 px-2.5 py-1.5 rounded-md border border-[#BCD8C6] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            Baby Wear Preset (3 Tiers)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newNode: TraceabilityNode = {
                                tier: `Tier ${(data.traceability?.nodes?.length || 0) + 1}`,
                                date: '',
                                title: '',
                                subtitle: '',
                                color: 'green',
                                items: [{ label: 'Facility', val: '' }]
                              };
                              setData(prev => ({
                                ...prev,
                                traceability: { ...prev.traceability, nodes: [...(prev.traceability?.nodes || []), newNode] }
                              }));
                            }}
                            className="text-[11.5px] font-semibold text-ink bg-white hover:bg-surface-2 px-3 py-1.5 rounded-md border border-line flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus size={13} /> Add Node
                          </button>
                        </div>
                      </div>

                      {/* Incomplete Tier Warning Banner */}
                      {(!data.traceability?.nodes || data.traceability.nodes.length < 3) && (
                        <div className="mb-4 bg-amber-soft border border-amber-line rounded-xl p-3.5 flex items-start gap-3">
                          <ShieldAlert size={18} className="text-amber shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-[12.5px] font-bold text-amber">
                              Supply Chain Incomplete ({data.traceability?.nodes?.length || 0} of 3 Tiers Listed)
                            </h4>
                            <p className="text-[11.5px] text-muted mt-0.5">
                              Supply chain records require Tier 1 (Garment Assembly), Tier 2 (Fabric/Knitting), and Tier 3 (Spinning/Yarn).
                            </p>
                            <div className="mt-2 flex gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const isBaby =
                                    data.measurements?.categoryType === 'one_piece' ||
                                    (data.measurements?.onePiece && data.measurements.onePiece.length > 0) ||
                                    String(data.general?.category || '').toLowerCase().includes('baby') ||
                                    String(data.general?.productName || '').toLowerCase().includes('sleepsuit');
                                  const fullNodes = ensureFullSupplyChainNodes(
                                    data.traceability?.nodes,
                                    isBaby,
                                    data.traceability?.origin?.facility || data.general?.originCountry
                                  );
                                  setData(prev => ({
                                    ...prev,
                                    traceability: {
                                      ...prev.traceability,
                                      nodes: fullNodes,
                                      percentage: 100
                                    }
                                  }));
                                }}
                                className="text-[11.5px] font-bold text-white bg-green hover:bg-green-dark px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                              >
                                <Sparkles size={12} /> Fill Standard Tiers (1–3)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {(data.traceability?.nodes || []).map((node, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-line space-y-3">
                            <div className="flex gap-2 items-center flex-wrap">
                              <input
                                type="text"
                                value={node.tier || ''}
                                onChange={e => {
                                  const list = [...(data.traceability?.nodes || [])];
                                  list[idx].tier = e.target.value;
                                  setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                }}
                                className="w-24 bg-ink text-lime font-mono text-[11px] font-bold rounded px-2 py-1 text-center"
                              />
                              <input
                                type="text"
                                value={node.date || ''}
                                onChange={e => {
                                  const list = [...(data.traceability?.nodes || [])];
                                  list[idx].date = e.target.value;
                                  setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                }}
                                className="w-28 font-mono text-[11.5px] text-muted border border-line rounded px-2 py-1"
                              />
                              <select
                                value={node.color || 'green'}
                                onChange={e => {
                                  const list = [...(data.traceability?.nodes || [])];
                                  list[idx].color = e.target.value as 'green' | 'amber';
                                  setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                }}
                                className="text-[12px] border border-line rounded px-2 py-1 text-muted"
                              >
                                <option value="green">Status: Verified (Green)</option>
                                <option value="amber">Status: In Progress / Warning (Amber)</option>
                              </select>
                              <button
                                onClick={() => {
                                  const list = [...(data.traceability?.nodes || [])];
                                  list.splice(idx, 1);
                                  setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                }}
                                className="ml-auto text-muted hover:text-red p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div>
                              <input
                                type="text"
                                value={node.title || ''}
                                onChange={e => {
                                  const list = [...(data.traceability?.nodes || [])];
                                  list[idx].title = e.target.value;
                                  setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                }}
                                className="w-full font-bold text-[14px] text-ink border-b border-transparent focus:border-green outline-none"
                              />
                              <input
                                type="text"
                                value={node.subtitle || ''}
                                onChange={e => {
                                  const list = [...(data.traceability?.nodes || [])];
                                  list[idx].subtitle = e.target.value;
                                  setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                }}
                                className="w-full text-[12px] text-muted border-b border-transparent focus:border-green outline-none mt-1"
                              />
                            </div>

                            {/* Node items */}
                            <div className="space-y-1.5 pt-2 border-t border-line/60">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Key Attributes</span>
                                <button
                                  onClick={() => {
                                    const list = [...(data.traceability?.nodes || [])];
                                    if (!list[idx].items) list[idx].items = [];
                                    list[idx].items.push({ label: '', val: '' });
                                    setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                  }}
                                  className="text-[10px] text-green-dark hover:underline font-semibold cursor-pointer"
                                >
                                  + Add Item
                                </button>
                              </div>
                              {(node.items || []).map((item, itemIdx) => (
                                <div key={itemIdx} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={item.label || ''}
                                    onChange={e => {
                                      const list = [...(data.traceability?.nodes || [])];
                                      list[idx].items[itemIdx].label = e.target.value;
                                      setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                    }}
                                    className="w-32 text-[11px] font-semibold text-muted bg-surface-2 border border-line rounded px-2 py-0.5"
                                  />
                                  <input
                                    type="text"
                                    value={item.val || ''}
                                    onChange={e => {
                                      const list = [...(data.traceability?.nodes || [])];
                                      list[idx].items[itemIdx].val = e.target.value;
                                      setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                    }}
                                    className="flex-1 text-[12px] text-ink bg-surface-2 border border-line rounded px-2 py-0.5"
                                  />
                                  <button
                                    onClick={() => {
                                      const list = [...(data.traceability?.nodes || [])];
                                      list[idx].items.splice(itemIdx, 1);
                                      setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                    }}
                                    className="text-muted hover:text-red p-1"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Warning message */}
                            <div>
                              <input
                                type="text"
                                value={node.warning || ''}
                                onChange={e => {
                                  const list = [...data.traceability.nodes];
                                  list[idx].warning = e.target.value || undefined;
                                  setData(prev => ({ ...prev, traceability: { ...prev.traceability, nodes: list } }));
                                }}
                                className="w-full text-[11.5px] text-amber bg-amber-soft/50 border border-dashed border-amber-line rounded px-2.5 py-1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. QUALITY & LAB TESTING TAB */}
                {activeTab === 'quality' && (
                  <div className="space-y-6">
                    {/* Quick Load Standard Tests Banner */}
                    <div className="bg-[#FAFDF9] border border-[#BCD8C6] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <h3 className="text-[14.5px] font-bold text-ink flex items-center gap-2">
                          <ShieldCheck size={18} className="text-green" />
                          Official Quality &amp; Laboratory Testing Suite
                        </h3>
                        <p className="text-[12px] text-muted mt-0.5">
                          ISO 105 color fastness, saliva/sweat resistance (DIN 53160), mechanical safety (DIN EN 71-1, ASTM D4846, EN 16732), and chemical compliance.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            quality: {
                              ...prev.quality,
                              reportNumber: prev.quality.reportNumber || '(9325)295-0371',
                              overallResult: 'PASS',
                              testingLab: prev.quality.testingLab || 'Bureau Veritas Consumer Products Services (BD) Ltd.',
                              rslStandards: 'Tested under EU REACH SVHC, AFIRM Baby RSL Category 1 & German LFGB § 30/31',
                              universalFastnessKey: 'Tested under DIN EN ISO 105 & DIN 53160:2023-07. Grade 5 = Negligible or no staining / color change (Highest standard).',
                              reviewedBy: {
                                name: 'Belal Hossain',
                                designation: 'Senior Manager – Analytical & Physical Testing, Bureau Veritas BD',
                                date: '30 Oct 2025'
                              },
                              labCards: [...BABY_WEAR_QUALITY_TESTS]
                            }
                          }));
                        }}
                        className="px-3.5 py-2 rounded-lg bg-green text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm hover:bg-green-dark cursor-pointer shrink-0 transition-colors"
                      >
                        <Sparkles size={14} />
                        <span>⚡ Load All Baby Wear Test Standards (10 Tests)</span>
                      </button>
                    </div>

                    {/* Laboratory & Audit Report Credentials */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2 space-y-4">
                      <h3 className="text-[14.5px] font-bold text-ink flex items-center gap-2">
                        <FileCheck size={16} className="text-green" /> Accredited Testing Facility &amp; Sign-off
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-[13px]">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Accredited Testing Facility / Lab
                          </label>
                          <input
                            type="text"
                            value={data.quality?.testingLab || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                quality: { ...prev.quality, testingLab: e.target.value }
                              }))
                            }
                            placeholder="e.g., Bureau Veritas Consumer Products Services (BD) Ltd."
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px] font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Lab Report Number
                          </label>
                          <input
                            type="text"
                            value={data.quality?.reportNumber || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                quality: { ...prev.quality, reportNumber: e.target.value }
                              }))
                            }
                            placeholder="(9325)295-0371"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px] font-mono font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Overall Compliance Result
                          </label>
                          <select
                            value={data.quality?.overallResult || 'PASS'}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                quality: { ...prev.quality, overallResult: e.target.value }
                              }))
                            }
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px] font-bold text-green-dark"
                          >
                            <option value="PASS">PASS (Certified Compliant)</option>
                            <option value="VERIFIED">VERIFIED</option>
                            <option value="FAIL">FAIL (Non-compliant)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Reviewed &amp; Approved By (Name)
                          </label>
                          <input
                            type="text"
                            value={data.quality?.reviewedBy?.name || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                quality: {
                                  ...prev.quality,
                                  reviewedBy: {
                                    name: e.target.value,
                                    designation: prev.quality?.reviewedBy?.designation || '',
                                    date: prev.quality?.reviewedBy?.date || ''
                                  }
                                }
                              }))
                            }
                            placeholder="Belal Hossain"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Sign-off Date
                          </label>
                          <input
                            type="text"
                            value={data.quality?.reviewedBy?.date || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                quality: {
                                  ...prev.quality,
                                  reviewedBy: {
                                    name: prev.quality?.reviewedBy?.name || '',
                                    designation: prev.quality?.reviewedBy?.designation || '',
                                    date: e.target.value
                                  }
                                }
                              }))
                            }
                            placeholder="30 Oct 2025"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px] font-mono"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Reviewer Designation / Title
                          </label>
                          <input
                            type="text"
                            value={data.quality?.reviewedBy?.designation || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                quality: {
                                  ...prev.quality,
                                  reviewedBy: {
                                    name: prev.quality?.reviewedBy?.name || '',
                                    designation: e.target.value,
                                    date: prev.quality?.reviewedBy?.date || ''
                                  }
                                }
                              }))
                            }
                            placeholder="Senior Manager – Analytical & Physical Testing, Bureau Veritas BD"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Applicable Quality &amp; RSL Regulatory Scope
                          </label>
                          <input
                            type="text"
                            value={data.quality?.rslStandards || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                quality: { ...prev.quality, rslStandards: e.target.value }
                              }))
                            }
                            placeholder="Tested under EU REACH SVHC, AFIRM Baby RSL Category 1 & German LFGB § 30/31"
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Physical, Fastness & Mechanical Safety Tests */}
                    <div className="border border-line rounded-xl p-5 bg-white shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line">
                        <div>
                          <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                            <span>Physical, Fastness &amp; Mechanical Safety Tests</span>
                            <span className="text-[11px] font-mono font-semibold bg-green-soft text-green-dark px-2 py-0.5 rounded-full border border-[#BCD8C6]">
                              {data.quality?.labCards?.length || 0} Registered Tests
                            </span>
                          </h3>
                          <p className="text-[12px] text-muted">
                            Detailed test standards, quantitative ratings, laboratory methods, and child safety verifications.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const newCard: LabCardItem = {
                              std: 'DIN EN ISO ...',
                              title: 'New Quality Test',
                              val: 'Grade 5 (PASS)',
                              subVal: 'Complies with Standard',
                              desc: 'Standard laboratory test procedure details and observations.',
                              hint: 'Babywear standard certified'
                            };
                            setData(prev => ({
                              ...prev,
                              quality: {
                                ...prev.quality,
                                labCards: [...(prev.quality?.labCards || []), newCard]
                              }
                            }));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-ink hover:border-green text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-colors"
                        >
                          <Plus size={13} />
                          <span>Add Test Standard</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(data.quality?.labCards || []).map((card, idx) => (
                          <div
                            key={idx}
                            className="border border-[#E3DECF] rounded-xl p-4 bg-[#FAF9F5] space-y-2.5 relative group shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono font-bold text-green-dark bg-green-soft px-2 py-0.5 rounded border border-[#BCD8C6]">
                                #{idx + 1}
                              </span>
                              <button
                                onClick={() => {
                                  const list = [...(data.quality?.labCards || [])];
                                  list.splice(idx, 1);
                                  setData(prev => ({
                                    ...prev,
                                    quality: { ...prev.quality, labCards: list }
                                  }));
                                }}
                                className="text-muted hover:text-red p-1 cursor-pointer transition-colors"
                                title="Delete test card"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                              <div>
                                <label className="block text-[10.5px] font-bold text-muted uppercase tracking-wider mb-0.5">
                                  Standard / Method
                                </label>
                                <input
                                  type="text"
                                  value={card.std || ''}
                                  onChange={e => {
                                    const list = [...(data.quality?.labCards || [])];
                                    list[idx] = { ...list[idx], std: e.target.value };
                                    setData(prev => ({ ...prev, quality: { ...prev.quality, labCards: list } }));
                                  }}
                                  className="w-full bg-white border border-line rounded px-2.5 py-1.5 text-[12px] font-mono font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10.5px] font-bold text-muted uppercase tracking-wider mb-0.5">
                                  Test Title
                                </label>
                                <input
                                  type="text"
                                  value={card.title || ''}
                                  onChange={e => {
                                    const list = [...(data.quality?.labCards || [])];
                                    list[idx] = { ...list[idx], title: e.target.value };
                                    setData(prev => ({ ...prev, quality: { ...prev.quality, labCards: list } }));
                                  }}
                                  className="w-full bg-white border border-line rounded px-2.5 py-1.5 text-[12px] font-bold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10.5px] font-bold text-muted uppercase tracking-wider mb-0.5">
                                  Result Value
                                </label>
                                <input
                                  type="text"
                                  value={card.val || ''}
                                  onChange={e => {
                                    const list = [...(data.quality?.labCards || [])];
                                    list[idx] = { ...list[idx], val: e.target.value };
                                    setData(prev => ({ ...prev, quality: { ...prev.quality, labCards: list } }));
                                  }}
                                  className="w-full bg-white border border-line rounded px-2.5 py-1.5 text-[12px] font-bold text-green-dark"
                                />
                              </div>

                              <div>
                                <label className="block text-[10.5px] font-bold text-muted uppercase tracking-wider mb-0.5">
                                  Sub-Value / Parameter
                                </label>
                                <input
                                  type="text"
                                  value={card.subVal || ''}
                                  onChange={e => {
                                    const list = [...(data.quality?.labCards || [])];
                                    list[idx] = { ...list[idx], subVal: e.target.value };
                                    setData(prev => ({ ...prev, quality: { ...prev.quality, labCards: list } }));
                                  }}
                                  className="w-full bg-white border border-line rounded px-2.5 py-1.5 text-[12px]"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10.5px] font-bold text-muted uppercase tracking-wider mb-0.5">
                                  Method Details &amp; Observations
                                </label>
                                <textarea
                                  rows={2}
                                  value={card.desc || ''}
                                  onChange={e => {
                                    const list = [...(data.quality?.labCards || [])];
                                    list[idx] = { ...list[idx], desc: e.target.value };
                                    setData(prev => ({ ...prev, quality: { ...prev.quality, labCards: list } }));
                                  }}
                                  className="w-full bg-white border border-line rounded px-2.5 py-1.5 text-[11.5px]"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10.5px] font-bold text-muted uppercase tracking-wider mb-0.5">
                                  Technical Compliance Badge / Hint
                                </label>
                                <input
                                  type="text"
                                  value={card.hint || ''}
                                  onChange={e => {
                                    const list = [...(data.quality?.labCards || [])];
                                    list[idx] = { ...list[idx], hint: e.target.value };
                                    setData(prev => ({ ...prev, quality: { ...prev.quality, labCards: list } }));
                                  }}
                                  className="w-full bg-white border border-line rounded px-2.5 py-1.5 text-[11.5px] text-green-dark font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Restricted Substances (RSL Category 1) */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2 space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-[14.5px] font-bold text-ink">Restricted Substances (AFIRM RSL Cat 1 &amp; SVHC)</h3>
                          <p className="text-[12px] text-muted">Chemical toxicology testing parameters and detection limits.</p>
                        </div>
                        <button
                          onClick={() => {
                            const newRsl = { name: '', result: 'PASS — ND' };
                            setData(prev => ({
                              ...prev,
                              quality: { ...prev.quality, rslItems: [...(prev.quality?.rslItems || []), newRsl] }
                            }));
                          }}
                          className="text-[11.5px] font-semibold text-green-dark bg-green-soft px-3 py-1.5 rounded-lg border border-[#BCD8C6] flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} /> Add Chemical Parameter
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(data.quality?.rslItems || []).map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-line">
                            <input
                              type="text"
                              value={item.name || ''}
                              onChange={e => {
                                const list = [...(data.quality?.rslItems || [])];
                                list[idx].name = e.target.value;
                                setData(prev => ({ ...prev, quality: { ...prev.quality, rslItems: list } }));
                              }}
                              placeholder="Substance Name / Standard"
                              className="flex-1 bg-transparent text-[12px] font-medium border-b border-transparent focus:border-green outline-none"
                            />
                            <input
                              type="text"
                              value={item.result || ''}
                              onChange={e => {
                                const list = [...(data.quality?.rslItems || [])];
                                list[idx].result = e.target.value;
                                setData(prev => ({ ...prev, quality: { ...prev.quality, rslItems: list } }));
                              }}
                              placeholder="PASS — ND"
                              className="flex-1 bg-transparent text-[11.5px] font-mono text-green-dark font-semibold border-b border-transparent focus:border-green outline-none"
                            />
                            <button
                              onClick={() => {
                                const list = [...(data.quality?.rslItems || [])];
                                list.splice(idx, 1);
                                setData(prev => ({ ...prev, quality: { ...prev.quality, rslItems: list } }));
                              }}
                              className="text-muted hover:text-red p-1 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. CARE & CIRCULARITY TAB */}
                {activeTab === 'care' && (
                  <div className="space-y-6">
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[15px] font-bold text-ink mb-1 flex items-center gap-2">
                        <HeartHandshake size={16} className="text-green" /> Standard Care Instructions
                      </h3>
                      <p className="text-[12px] text-muted mb-4">
                        Care symbols and official label instructions.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                        {/* Washing */}
                        <div className="bg-white p-3 rounded-lg border border-line space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                              Washing Symbol
                            </label>
                            <div className="w-7 h-7 flex items-center justify-center bg-surface-2 rounded border border-line">
                              <CareIconRenderer
                                category="wash"
                                symbolId={data.care.washIcon || 'wash-60'}
                                className="w-5 h-5 text-ink"
                              />
                            </div>
                          </div>
                          <select
                            value={data.care.washIcon || 'wash_60'}
                            onChange={(e) => {
                              const iconId = e.target.value;
                              const match = CARE_SYMBOLS.wash.find((s) => s.id === iconId);
                              updateCare('washIcon', iconId);
                              if (match) updateCare('wash', match.name);
                            }}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1.5 text-[11.5px] font-semibold"
                          >
                            {CARE_SYMBOLS.wash.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Custom text description"
                            value={data.care.wash || ''}
                            onChange={(e) => updateCare('wash', e.target.value)}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1 text-[11px]"
                          />
                        </div>

                        {/* Bleaching */}
                        <div className="bg-white p-3 rounded-lg border border-line space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                              Bleaching Symbol
                            </label>
                            <div className="w-7 h-7 flex items-center justify-center bg-surface-2 rounded border border-line">
                              <CareIconRenderer
                                category="bleach"
                                symbolId={data.care.bleachIcon || 'bleach_do_not'}
                                className="w-5 h-5 text-ink"
                              />
                            </div>
                          </div>
                          <select
                            value={data.care.bleachIcon || 'bleach_do_not'}
                            onChange={(e) => {
                              const iconId = e.target.value;
                              const match = CARE_SYMBOLS.bleach.find((s) => s.id === iconId);
                              updateCare('bleachIcon', iconId);
                              if (match) updateCare('bleach', match.name);
                            }}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1.5 text-[11.5px] font-semibold"
                          >
                            {CARE_SYMBOLS.bleach.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Custom text description"
                            value={data.care.bleach || ''}
                            onChange={(e) => updateCare('bleach', e.target.value)}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1 text-[11px]"
                          />
                        </div>

                        {/* Drying */}
                        <div className="bg-white p-3 rounded-lg border border-line space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                              Tumble Drying
                            </label>
                            <div className="w-7 h-7 flex items-center justify-center bg-surface-2 rounded border border-line">
                              <CareIconRenderer
                                category="dry"
                                symbolId={data.care.dryIcon || 'dry_tumble_low'}
                                className="w-5 h-5 text-ink"
                              />
                            </div>
                          </div>
                          <select
                            value={data.care.dryIcon || 'dry_tumble_low'}
                            onChange={(e) => {
                              const iconId = e.target.value;
                              const match = CARE_SYMBOLS.dry.find((s) => s.id === iconId);
                              updateCare('dryIcon', iconId);
                              if (match) updateCare('dry', match.name);
                            }}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1.5 text-[11.5px] font-semibold"
                          >
                            {CARE_SYMBOLS.dry.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Custom text description"
                            value={data.care.dry || ''}
                            onChange={(e) => updateCare('dry', e.target.value)}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1 text-[11px]"
                          />
                        </div>

                        {/* Ironing */}
                        <div className="bg-white p-3 rounded-lg border border-line space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                              Ironing Symbol
                            </label>
                            <div className="w-7 h-7 flex items-center justify-center bg-surface-2 rounded border border-line">
                              <CareIconRenderer
                                category="iron"
                                symbolId={data.care.ironIcon || 'iron_medium'}
                                className="w-5 h-5 text-ink"
                              />
                            </div>
                          </div>
                          <select
                            value={data.care.ironIcon || 'iron_medium'}
                            onChange={(e) => {
                              const iconId = e.target.value;
                              const match = CARE_SYMBOLS.iron.find((s) => s.id === iconId);
                              updateCare('ironIcon', iconId);
                              if (match) updateCare('iron', match.name);
                            }}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1.5 text-[11.5px] font-semibold"
                          >
                            {CARE_SYMBOLS.iron.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Custom text description"
                            value={data.care.iron || ''}
                            onChange={(e) => updateCare('iron', e.target.value)}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1 text-[11px]"
                          />
                        </div>

                        {/* Professional / Dry Cleaning */}
                        <div className="bg-white p-3 rounded-lg border border-line space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                              Professional Care / Dry Clean
                            </label>
                            <div className="w-7 h-7 flex items-center justify-center bg-surface-2 rounded border border-line">
                              <CareIconRenderer
                                category="dryClean"
                                symbolId={data.care.dryCleanIcon || 'dryclean_do_not'}
                                className="w-5 h-5 text-ink"
                              />
                            </div>
                          </div>
                          <select
                            value={data.care.dryCleanIcon || 'dryclean_do_not'}
                            onChange={(e) => {
                              const iconId = e.target.value;
                              const match = CARE_SYMBOLS.dryClean.find((s) => s.id === iconId);
                              updateCare('dryCleanIcon', iconId);
                              if (match) updateCare('dryClean', match.name);
                            }}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1.5 text-[11.5px] font-semibold"
                          >
                            {CARE_SYMBOLS.dryClean.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Custom text description"
                            value={data.care.dryClean || ''}
                            onChange={(e) => updateCare('dryClean', e.target.value)}
                            className="w-full bg-surface-2 border border-line rounded px-2 py-1 text-[11px]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Care Label Wording / Full Description
                          </label>
                          <textarea
                            rows={3}
                            value={data.care.labelWording || ''}
                            onChange={(e) => updateCare('labelWording', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Circularity Tips */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[14px] font-bold text-ink mb-3">Circularity Tips (4 Highlight Cards)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(data.circularity?.tips || []).map((tip, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-line space-y-1.5">
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={tip.emoji || ''}
                                onChange={e => {
                                  const list = [...(data.circularity?.tips || [])];
                                  list[idx].emoji = e.target.value;
                                  setData(prev => ({ ...prev, circularity: { ...prev.circularity, tips: list } }));
                                }}
                                className="w-10 text-center text-[16px] bg-surface-2 border border-line rounded py-0.5"
                              />
                              <input
                                type="text"
                                value={tip.title || ''}
                                onChange={e => {
                                  const list = [...(data.circularity?.tips || [])];
                                  list[idx].title = e.target.value;
                                  setData(prev => ({ ...prev, circularity: { ...prev.circularity, tips: list } }));
                                }}
                                className="flex-1 font-bold text-[12.5px] border-b border-transparent focus:border-green outline-none"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={tip.text || ''}
                              onChange={e => {
                                const list = [...(data.circularity?.tips || [])];
                                list[idx].text = e.target.value;
                                setData(prev => ({ ...prev, circularity: { ...prev.circularity, tips: list } }));
                              }}
                              className="w-full text-[11.5px] text-muted border border-line/60 rounded px-2 py-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcycling Module */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[14px] font-bold text-ink mb-3">DIY Upcycling Tutorial</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Upcycle Tutorial Title
                          </label>
                          <input
                            type="text"
                            value={data.circularity.upcycleTitle || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                circularity: { ...prev.circularity, upcycleTitle: e.target.value }
                              }))
                            }
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px] font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Upcycle Subtitle
                          </label>
                          <input
                            type="text"
                            value={data.circularity.upcycleSubtitle || ''}
                            onChange={e =>
                              setData(prev => ({
                                ...prev,
                                circularity: { ...prev.circularity, upcycleSubtitle: e.target.value }
                              }))
                            }
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider">
                              Upcycle Image URL / Upload
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                ref={upcycleFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageFileUpload(file, 'upcycleImage', url => {
                                      setData(prev => ({
                                        ...prev,
                                        circularity: { ...prev.circularity, upcycleImage: url }
                                      }));
                                    });
                                  }
                                  e.target.value = '';
                                }}
                              />
                              <button
                                type="button"
                                disabled={uploadingField === 'upcycleImage'}
                                onClick={() => upcycleFileInputRef.current?.click()}
                                className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#2E6B4F]/10 hover:bg-[#2E6B4F]/20 text-[#2E6B4F] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Upload upcycle image to Cloudinary"
                              >
                                {uploadingField === 'upcycleImage' ? (
                                  <>
                                    <Loader2 size={11} className="animate-spin" />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload size={11} />
                                    <span>Upload</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setData(prev => ({
                                    ...prev,
                                    circularity: { ...prev.circularity, upcycleImage: '' }
                                  }));
                                }}
                                className="px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-0.5 transition-colors cursor-pointer"
                                title="Set to blank"
                              >
                                <X size={11} /> Blank
                              </button>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={data.circularity.upcycleImage || ''}
                              placeholder="Paste Cloudinary/image URL, click Upload, or leave blank"
                              onChange={e =>
                                setData(prev => ({
                                  ...prev,
                                  circularity: { ...prev.circularity, upcycleImage: e.target.value }
                                }))
                              }
                              className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12px] font-mono pr-8"
                            />
                            {data.circularity.upcycleImage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setData(prev => ({
                                    ...prev,
                                    circularity: { ...prev.circularity, upcycleImage: '' }
                                  }));
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 cursor-pointer p-0.5"
                                title="Clear image"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                          {data.circularity.upcycleImage ? (
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="w-5 h-5 rounded overflow-hidden bg-gray-100 border border-line shrink-0 inline-block relative">
                                <img
                                  src={data.circularity.upcycleImage}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </span>
                              {data.circularity.upcycleImage.includes('cloudinary.com') ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                                  <Cloud size={10} /> Cloudinary CDN
                                </span>
                              ) : data.circularity.upcycleImage.startsWith('data:') ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <ImageIcon size={10} /> Uploaded Image
                                </span>
                              ) : (
                                <span className="text-[10.5px] text-green-800 font-medium truncate max-w-[200px]">
                                  Image linked
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10.5px] text-muted italic mt-0.5 block">
                              Blank (shows default upcycling craft workshop icon)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. ENVIRONMENTAL TAB */}
                {activeTab === 'environmental' && (
                  <div className="space-y-6">
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[15px] font-bold text-ink mb-1 flex items-center gap-2">
                        <Leaf size={16} className="text-green" /> Carbon Footprint Breakdown (ISO 14067)
                      </h3>
                      <p className="text-[12px] text-muted mb-4">
                        Lifecycle stages percentages and allocated total kilograms of CO₂ equivalent.
                      </p>

                      <div className="mb-4">
                        <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                          Total Carbon Footprint (kg CO₂e)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={data.environmental.totalCarbon === 0 ? '' : data.environmental.totalCarbon}
                          onChange={e => updateEnvironmental('totalCarbon', e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-44 bg-white border border-line rounded-lg px-3 py-2 font-mono text-[16px] font-bold text-green-dark"
                        />
                      </div>

                      <div className="space-y-2">
                        {(data.environmental?.carbonBreakdown || []).map((stage, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-lg border border-line">
                            <input
                              type="color"
                              value={stage.color || '#333333'}
                              onChange={e => {
                                const list = [...(data.environmental?.carbonBreakdown || [])];
                                list[idx].color = e.target.value;
                                updateEnvironmental('carbonBreakdown', list);
                              }}
                              className="w-8 h-8 rounded border border-line cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={stage.label || ''}
                              onChange={e => {
                                const list = [...(data.environmental?.carbonBreakdown || [])];
                                list[idx].label = e.target.value;
                                updateEnvironmental('carbonBreakdown', list);
                              }}
                              className="flex-1 font-semibold text-[13px] border-b border-transparent focus:border-green outline-none"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={stage.value === 0 ? '' : stage.value}
                                onChange={e => {
                                  const list = [...(data.environmental?.carbonBreakdown || [])];
                                  list[idx].value = e.target.value === '' ? 0 : Number(e.target.value);
                                  updateEnvironmental('carbonBreakdown', list);
                                }}
                                className="w-16 text-right font-mono font-bold text-[13px] bg-surface-2 border border-line rounded px-2 py-1"
                              />
                              <span className="text-[12px] text-muted font-bold">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resource Efficiency */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[14px] font-bold text-ink mb-3">Resource Efficiency & Footprint</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
                        <div className="bg-white p-3 rounded-xl border border-line">
                          <label className="block text-[11px] font-bold text-green-dark uppercase tracking-wider mb-1">
                            Water Usage (Liters)
                          </label>
                          <input
                            type="number"
                            value={data.environmental.waterUsage?.value === 0 ? '' : (data.environmental.waterUsage?.value ?? '')}
                            onChange={e =>
                              updateEnvironmental('waterUsage', {
                                max: data.environmental.waterUsage?.max ?? 1500,
                                sub: data.environmental.waterUsage?.sub ?? '',
                                value: e.target.value === '' ? 0 : Number(e.target.value)
                              })
                            }
                            className="w-full border border-line rounded px-2.5 py-1.5 font-mono text-[14px] font-bold"
                          />
                          <input
                            type="text"
                            value={data.environmental.waterUsage?.sub || ''}
                            onChange={e =>
                              updateEnvironmental('waterUsage', {
                                max: data.environmental.waterUsage?.max ?? 1500,
                                value: data.environmental.waterUsage?.value ?? 0,
                                sub: e.target.value
                              })
                            }
                            className="w-full mt-1 text-[11px] text-muted border border-line/60 rounded px-2 py-1"
                          />
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-line">
                          <label className="block text-[11px] font-bold text-[#B9770E] uppercase tracking-wider mb-1">
                            Renewable Energy (%)
                          </label>
                          <input
                            type="number"
                            value={data.environmental.renewableEnergy?.value === 0 ? '' : (data.environmental.renewableEnergy?.value ?? '')}
                            onChange={e =>
                              updateEnvironmental('renewableEnergy', {
                                max: data.environmental.renewableEnergy?.max ?? 100,
                                sub: data.environmental.renewableEnergy?.sub ?? '',
                                value: e.target.value === '' ? 0 : Number(e.target.value)
                              })
                            }
                            className="w-full border border-line rounded px-2.5 py-1.5 font-mono text-[14px] font-bold"
                          />
                          <input
                            type="text"
                            value={data.environmental.renewableEnergy?.sub || ''}
                            onChange={e =>
                              updateEnvironmental('renewableEnergy', {
                                max: data.environmental.renewableEnergy?.max ?? 100,
                                value: data.environmental.renewableEnergy?.value ?? 0,
                                sub: e.target.value
                              })
                            }
                            className="w-full mt-1 text-[11px] text-muted border border-line/60 rounded px-2 py-1"
                          />
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-line">
                          <label className="block text-[11px] font-bold text-green-dark uppercase tracking-wider mb-1">
                            Recycled Packaging (%)
                          </label>
                          <input
                            type="number"
                            value={data.environmental.recycledPackaging?.value === 0 ? '' : (data.environmental.recycledPackaging?.value ?? '')}
                            onChange={e =>
                              updateEnvironmental('recycledPackaging', {
                                max: data.environmental.recycledPackaging?.max ?? 100,
                                sub: data.environmental.recycledPackaging?.sub ?? '',
                                value: e.target.value === '' ? 0 : Number(e.target.value)
                              })
                            }
                            className="w-full border border-line rounded px-2.5 py-1.5 font-mono text-[14px] font-bold"
                          />
                          <input
                            type="text"
                            value={data.environmental.recycledPackaging?.sub || ''}
                            onChange={e =>
                              updateEnvironmental('recycledPackaging', {
                                max: data.environmental.recycledPackaging?.max ?? 100,
                                value: data.environmental.recycledPackaging?.value ?? 0,
                                sub: e.target.value
                              })
                            }
                            className="w-full mt-1 text-[11px] text-muted border border-line/60 rounded px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Packaging Status */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[14px] font-bold text-ink mb-3">Packaging & Policy Alignment</h3>
                      <div className="space-y-3 text-[13px]">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Packaging Recyclability (%)
                          </label>
                          <input
                            type="number"
                            value={data.environmental.packagingRecyclability === 0 ? '' : (data.environmental.packagingRecyclability ?? '')}
                            onChange={e => updateEnvironmental('packagingRecyclability', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-32 bg-white border border-line rounded-lg px-3 py-2 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Packaging Materials Description
                          </label>
                          <textarea
                            rows={2}
                            value={data.environmental.packagingMaterials || ''}
                            onChange={e => updateEnvironmental('packagingMaterials', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            EU Policy Alignment Note
                          </label>
                          <textarea
                            rows={2}
                            value={data.environmental.euPolicyNote || ''}
                            onChange={e => updateEnvironmental('euPolicyNote', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[12.5px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. COMPLIANCE TAB */}
                {activeTab === 'compliance' && (
                  <div className="space-y-6">
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                          <FileCheck size={16} className="text-green" /> Official Certifications & Audits
                        </h3>
                        <button
                          onClick={() => {
                            const newCert = {
                              name: '',
                              scope: '',
                              status: 'VERIFIED'
                            };
                            updateCompliance('certifications', [...data.compliance.certifications, newCert]);
                          }}
                          className="text-[11px] font-semibold text-green-dark bg-green-soft px-2.5 py-1 rounded-md border border-[#BCD8C6] flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Add Certification
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {(data.compliance?.certifications || []).map((cert, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-line space-y-1.5">
                            <div className="flex justify-between items-center gap-2">
                              <input
                                type="text"
                                value={cert.name || ''}
                                onChange={e => {
                                  const list = [...(data.compliance?.certifications || [])];
                                  list[idx].name = e.target.value;
                                  updateCompliance('certifications', list);
                                }}
                                className="flex-1 font-bold text-[13px] border-b border-transparent focus:border-green outline-none"
                              />
                              <input
                                type="text"
                                value={cert.status || ''}
                                onChange={e => {
                                  const list = [...(data.compliance?.certifications || [])];
                                  list[idx].status = e.target.value;
                                  updateCompliance('certifications', list);
                                }}
                                className="w-24 text-right font-bold text-[10px] tracking-wider text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-0.5 rounded-full"
                              />
                              <button
                                onClick={() => {
                                  const list = [...(data.compliance?.certifications || [])];
                                  list.splice(idx, 1);
                                  updateCompliance('certifications', list);
                                }}
                                className="text-muted hover:text-red p-1"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={cert.scope || ''}
                              onChange={e => {
                                const list = [...(data.compliance?.certifications || [])];
                                list[idx].scope = e.target.value;
                                updateCompliance('certifications', list);
                              }}
                              className="w-full text-[11.5px] text-muted border-b border-transparent focus:border-green outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Logistics & Legal */}
                    <div className="border border-line rounded-xl p-5 bg-surface-2">
                      <h3 className="text-[14px] font-bold text-ink mb-3">Logistics, Sales & Issuer Legal Entity</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Sales Channel
                          </label>
                          <input
                            type="text"
                            value={data.compliance.salesChannel || ''}
                            onChange={e => updateCompliance('salesChannel', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Available From
                          </label>
                          <input
                            type="text"
                            value={data.compliance.availableFrom || ''}
                            onChange={e => updateCompliance('availableFrom', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Usage Class
                          </label>
                          <input
                            type="text"
                            value={data.compliance.usageClass || ''}
                            onChange={e => updateCompliance('usageClass', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            After-Sale Support
                          </label>
                          <input
                            type="text"
                            value={data.compliance.afterSale || ''}
                            onChange={e => updateCompliance('afterSale', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Passport Issuer
                          </label>
                          <input
                            type="text"
                            value={data.compliance.issuer || ''}
                            onChange={e => updateCompliance('issuer', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-1">
                            Authorized EU Markets
                          </label>
                          <input
                            type="text"
                            value={data.compliance.markets || ''}
                            onChange={e => updateCompliance('markets', e.target.value)}
                            className="w-full bg-white border border-line rounded-lg px-3 py-2 text-[13px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RIGHT: LIVE INTERACTIVE PREVIEW PANEL */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div
              className={`flex-1 overflow-y-auto ${
                viewMode === 'split' ? 'hidden md:block w-full md:w-1/2 md:max-w-[45%] bg-[#F4F1EA]' : 'w-full bg-[#F4F1EA]'
              }`}
            >
              {/* Preview Header indicator */}
              <div className="sticky top-0 z-30 bg-[#17201B]/90 backdrop-blur-md text-white px-4 py-2 flex items-center justify-between text-[11.5px] border-b border-[#2A362E]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
                  <span className="font-bold tracking-wide">Live Passport Preview</span>
                  <span className="text-white/40 hidden sm:inline">|</span>
                  <span className="text-white/70 hidden sm:inline">
                    Changes made in the form reflect immediately here
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-green hover:bg-green-dark text-white px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  {data.general.projectId ? (
                    <Link
                      href={`/dpp/${data.general.projectId}`}
                      className="text-lime hover:underline font-semibold flex items-center gap-1"
                    >
                      Open Full Page <ExternalLink size={11} />
                    </Link>
                  ) : (
                    <button
                      onClick={handleSave}
                      className="text-lime hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Save to View <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Render Full Passport with current form data */}
              <PassportView data={data} isPreviewMode={true} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sticky Quick Navigation & Action Bar */}
      <div className="md:hidden fixed bottom-2.5 left-2.5 right-2.5 z-40 bg-[#17201B]/95 backdrop-blur-md border border-[#2A362E] rounded-xl p-1.5 px-2.5 shadow-2xl flex items-center justify-between gap-1.5">
        <div className="flex items-center bg-black/40 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'editor' || viewMode === 'split' ? 'bg-white text-ink shadow-xs' : 'text-white/70 hover:text-white'
            }`}
          >
            <Layers size={13} />
            <span>Form</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'preview' ? 'bg-lime text-ink shadow-xs' : 'text-white/70 hover:text-white'
            }`}
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={handleClearToBlank}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold cursor-pointer"
            title="Clear all fields to blank"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green hover:bg-green-dark text-white text-xs font-bold shadow-xs active:scale-95 transition-transform cursor-pointer"
          >
            {savedStatus ? <Check size={13} /> : <Save size={13} />}
            <span>{savedStatus ? 'Saved!' : 'Save'}</span>
          </button>
          <Link
            href={`/dpp/${data.general.projectId}`}
            className="p-1.5 rounded-lg bg-lime text-ink hover:bg-lime/80 transition-colors"
            title="View consumer DPP"
          >
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* JSON Import/Export Modal */}
      {jsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-line overflow-hidden">
            <div className="p-4 border-b border-line flex justify-between items-center bg-surface-2">
              <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
                <FileCode size={16} className="text-green" /> Structured Passport JSON
              </h3>
              <button
                onClick={() => setJsonModalOpen(false)}
                className="text-muted hover:text-ink text-[13px] font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <p className="text-[12px] text-muted mb-2">
                You can copy this JSON to export your data, or paste custom passport JSON and apply it to all fields immediately.
              </p>
              {jsonError && (
                <div className="mb-2 p-2 bg-red-soft text-red text-[11.5px] rounded-lg font-medium">
                  {jsonError}
                </div>
              )}
              <textarea
                value={jsonInput}
                onChange={e => {
                  setJsonInput(e.target.value);
                  setJsonError(null);
                }}
                className="w-full flex-1 bg-ink text-[#B9C4BB] font-mono text-[11px] p-3 rounded-xl resize-none outline-none focus:ring-1 focus:ring-green"
              />
            </div>
            <div className="p-4 border-t border-line flex justify-end gap-2 bg-surface-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonInput);
                  alert('JSON copied to clipboard!');
                }}
                className="px-3 py-1.5 rounded-lg border border-line bg-white text-[12px] font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleApplyJson}
                className="px-4 py-1.5 rounded-lg bg-green hover:bg-green-dark text-white text-[12px] font-bold transition-colors cursor-pointer"
              >
                Apply & Save JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI PDF Auto-Fill Modal */}
      <PdfAutoFillModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        onApplyData={handleApplyPdfData}
        currentData={data}
      />
    </div>
  );
}
