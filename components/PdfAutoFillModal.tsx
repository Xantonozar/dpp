'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { PassportData } from '@/lib/passport-data';
import { EXTRACTED_TCHIBO_PASSPORT } from '@/lib/sample-extracted-data';
import {
  Sparkles,
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Ruler,
  FlaskConical,
  RotateCcw,
  Plus,
  Trash2,
  FileCheck2,
  Cpu,
  Zap,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export interface AiModelOption {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  badgeColor: string;
  tagline: string;
  description: string;
  isLowerModel?: boolean;
}

export const AI_MODELS: AiModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    shortName: 'Flash Lite (Ultra Fast)',
    badge: 'Fastest / Recommended',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    tagline: 'Lowest latency & rapid extraction',
    description: 'High-speed document parsing designed for immediate form autofill without delay.',
    isLowerModel: true,
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    shortName: 'Flash 3.8',
    badge: 'Balanced & Accurate',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    tagline: 'Comprehensive multimodal understanding',
    description: 'Deep structural parsing of complex multi-page apparel documents and tech packs.',
    isLowerModel: false,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    shortName: 'Pro 3.1',
    badge: 'Maximum Precision',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    tagline: 'Complex tabular reasoning',
    description: 'Specialized for dense measurement tables and multi-tier chemical tests.',
    isLowerModel: false,
  },
];

interface PdfAutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: PassportData, mode: 'replace' | 'merge') => void;
  currentData: PassportData;
}

const MAX_PDF_COUNT = 3;

export default function PdfAutoFillModal({
  isOpen,
  onClose,
  onApplyData,
  currentData
}: PdfAutoFillModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCapacityError, setIsCapacityError] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dpp_ai_model');
        if (saved && AI_MODELS.some((m) => m.id === saved)) {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'gemini-3.1-flash-lite';
  });
  const [modelUsedInExtraction, setModelUsedInExtraction] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<PassportData | null>(null);
  const [extractionSummary, setExtractionSummary] = useState<string | null>(null);
  const [analyzedFileNames, setAnalyzedFileNames] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    setError(null);
    setIsCapacityError(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dpp_ai_model', modelId);
      } catch {
        // ignore
      }
    }
  };

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const pdfList: File[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        // Prevent duplicates
        if (!files.some((existing) => existing.name === f.name && existing.size === f.size)) {
          pdfList.push(f);
        }
      }
    }

    if (pdfList.length === 0) {
      setError('Please provide valid PDF documents (.pdf).');
      return;
    }

    const combined = [...files, ...pdfList];
    if (combined.length > MAX_PDF_COUNT) {
      setFiles(combined.slice(0, MAX_PDF_COUNT));
      setError(`Maximum ${MAX_PDF_COUNT} PDFs allowed. Kept the first 3 files.`);
    } else {
      setFiles(combined);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // reset input so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setError(null);
  };

  const convertFileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(f);
    });
  };

  const handleStartExtraction = async (overrideModel?: string) => {
    if (files.length === 0) {
      setError('Please select or drag at least 1 PDF file (up to 3).');
      return;
    }

    const modelToUse = overrideModel || selectedModel;
    if (overrideModel) {
      handleSelectModel(overrideModel);
    }

    const modelMeta = AI_MODELS.find((m) => m.id === modelToUse) || AI_MODELS[0];

    setIsLoading(true);
    setError(null);
    setIsCapacityError(false);
    setFallbackNotice(null);
    setLoadingStep(`Reading and preparing ${files.length} PDF document(s)...`);

    try {
      const payloadFiles = await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          fileBase64: await convertFileToBase64(file),
        }))
      );

      setLoadingStep(`Sending ${files.length} document(s) to ${modelMeta.name} for synthesis...`);
      const response = await fetch('/api/extract-passport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: payloadFiles,
          existingData: currentData,
          model: modelToUse,
        }),
      });

      setLoadingStep('Synthesizing specs, lab test cards, measurements, and circularity data...');
      let result: any = null;
      try {
        result = await response.json();
      } catch {
        const text = await response.text();
        result = { error: text || `HTTP ${response.status}: Server returned an error` };
      }

      if (!response.ok || !result || result.error) {
        const errorText = result?.error || `Server request failed with HTTP ${response.status}`;
        if (
          result?.isCapacityIssue ||
          response.status === 503 ||
          errorText.includes('503') ||
          errorText.includes('high demand') ||
          errorText.includes('UNAVAILABLE') ||
          errorText.includes('temporarily unavailable') ||
          errorText.includes('429')
        ) {
          setIsCapacityError(true);
        }
        throw new Error(errorText);
      }

      setExtractedData(result.data);
      setModelUsedInExtraction(result.modelUsed || modelToUse);
      setFallbackNotice(result.fallbackNotice || null);
      setAnalyzedFileNames(result.fileNames || files.map((f) => f.name));
      setExtractionSummary(
        result.extractionSummary ||
          `Synthesized ${files.length} document(s) into complete DPP passport structure.`
      );
      setActiveTab('preview');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Extraction error';
      if (
        message.includes('leaked') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('403')
      ) {
        setError(
          'API_KEY_LEAKED: Google detected your current Gemini API key as leaked on the web and revoked access. Please select or add a new Gemini API key in the AI Studio Settings menu. In the meantime, you can test with the verified sample documents below.'
        );
      } else if (
        message.includes('gemini_apikey') ||
        message.includes('GEMINI_APIKEY') ||
        message.includes('GEMINI_API_KEY')
      ) {
        setError(
          'Gemini API key is required on the server. Please check your AI Studio Settings menu or use the sample documents below.'
        );
      } else if (
        message.includes('503') ||
        message.includes('high demand') ||
        message.includes('UNAVAILABLE')
      ) {
        setIsCapacityError(true);
        setError(
          `Google Model High Demand Notice (503): "${modelMeta.name}" is currently experiencing peak demand. Please select a faster model below (such as Gemini 3.1 Flash Lite) to retry.`
        );
      } else {
        setError(`AI Extraction notice: ${message}`);
      }
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleLoadSample = (sampleMode: 'both' | 'fits' | 'bureau-veritas') => {
    setError(null);
    setExtractedData(EXTRACTED_TCHIBO_PASSPORT);
    if (sampleMode === 'both') {
      setAnalyzedFileNames([
        'Tchibo_FiTS_151546_Technical_Specification.pdf',
        'Bureau_Veritas_6825_298_0551_Test_Report.pdf'
      ]);
      setExtractionSummary(
        'Synthesized 2 multi-source documents: Technical Specification #151546 (measurements, SKUs, yarn nominations) + Bureau Veritas Lab Report (ISO 1833 blend analysis, RSL compliance, and wash colourfastness).'
      );
    } else if (sampleMode === 'fits') {
      setAnalyzedFileNames(['Tchibo_FiTS_151546_Spec.pdf']);
      setExtractionSummary(
        'Loaded data from Tchibo FiTS Spec #151546: 48/47/5 blend, S–XXL measurement grading, 10 article SKUs, CmiA cotton & Birla modal.'
      );
    } else {
      setAnalyzedFileNames(['Bureau_Veritas_Test_Report.pdf']);
      setExtractionSummary(
        'Loaded data from Bureau Veritas Report ((6825)298-0551): ISO 1833 fibre composition, RSL parameter tests, and 5 colourfastness lab cards.'
      );
    }
    setActiveTab('preview');
  };

  const handleApply = (mode: 'replace' | 'merge') => {
    if (!extractedData) return;
    onApplyData(extractedData, mode);
    onClose();
  };

  return (
    <div
      id="pdf-auto-fill-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="pdf-auto-fill-modal-container"
        className="relative w-full max-w-2xl bg-white border border-[#D5CFBF] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#E8E4D8] bg-[#FAF8F3]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/20 flex items-center justify-center text-[#2E6B4F] shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-bold text-[#17201B] flex items-center flex-wrap gap-1.5">
                <span>Auto-fill DPP with Gemini AI</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#2E6B4F] text-white">
                  Up to 3 PDFs
                </span>
              </h3>
              <p className="text-[10.5px] sm:text-[11.5px] text-[#6B726C] truncate sm:whitespace-normal">
                Upload 1 to 3 documents for joint AI synthesis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#6B726C] hover:text-[#17201B] hover:bg-[#EAE5D8] transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Input supporting multiple files */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-3 shadow-xs ${
                error.includes('API_KEY_LEAKED')
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : isCapacityError || error.includes('503') || error.includes('high demand') || error.includes('UNAVAILABLE')
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {isCapacityError || error.includes('503') || error.includes('high demand') || error.includes('UNAVAILABLE') ? (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              ) : (
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    error.includes('API_KEY_LEAKED') ? 'text-rose-600' : 'text-rose-600'
                  }`}
                />
              )}

              <div className="flex-1 space-y-2.5">
                {error.includes('API_KEY_LEAKED') ? (
                  <>
                    <div>
                      <p className="font-bold text-rose-900 text-[12.5px]">
                        Gemini API Key Revoked (Reported as Leaked)
                      </p>
                      <p className="text-[11.5px] text-rose-800 mt-1 leading-relaxed">
                        Google&apos;s security scanners detected the currently configured API key on the public internet and revoked it to protect your account.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white/80 border border-rose-200/80 text-[11px] text-rose-900 space-y-1">
                      <span className="font-bold block">How to resolve:</span>
                      <ol className="list-decimal list-inside space-y-0.5 text-rose-850">
                        <li>Open the AI Studio <strong>Settings</strong> (or Secrets menu).</li>
                        <li>Select or generate a fresh <strong>Gemini API Key</strong>.</li>
                      </ol>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => handleLoadSample('both')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E6B4F] text-white font-bold text-[11px] hover:bg-[#24543E] transition-colors shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#A2E2BD]" />
                        <span>Continue with Sample Documents Demo &rarr;</span>
                      </button>
                    </div>
                  </>
                ) : isCapacityError || error.includes('503') || error.includes('high demand') || error.includes('UNAVAILABLE') ? (
                  <>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-amber-950 text-[12.5px]">
                          Model Capacity Limit (503 High Demand)
                        </p>
                        <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                          Temporary Google Spike
                        </span>
                      </div>
                      <p className="text-[11.5px] text-amber-900 mt-1 leading-relaxed">
                        The requested model is currently experiencing peak server demand from Google. You can switch to a lower or higher availability model below and retry immediately without re-uploading your files:
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartExtraction('gemini-3.1-flash-lite')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Switch to Flash Lite (Fastest) &amp; Retry</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartExtraction('gemini-3.8-flash')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/80 text-amber-950 font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Switch to Gemini 3.8 Flash &amp; Retry</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadSample('both')}
                        className="px-2.5 py-1.5 text-[11px] font-bold text-amber-900 hover:underline cursor-pointer"
                      >
                        Or test with sample data &rarr;
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">{error}</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleStartExtraction()}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E6B4F] hover:underline cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry Extraction
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadSample('both')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E6B4F] underline hover:text-[#17201B] cursor-pointer"
                      >
                        Load verified 2-document sample &rarr;
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <>
              {/* AI Model Selection Section */}
              <div className="p-3.5 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#2E6B4F]" />
                    <span className="text-xs font-bold text-[#17201B]">Gemini AI Model</span>
                    <span className="text-[10px] text-[#6B726C]">Choose a lower model if experiencing 503 spikes</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#24543E] border border-[#CFE8D7]">
                    Active: {AI_MODELS.find((m) => m.id === selectedModel)?.shortName || 'Flash Lite'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AI_MODELS.map((model) => {
                    const isSelected = selectedModel === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleSelectModel(model.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white border-[#2E6B4F] ring-1 ring-[#2E6B4F] shadow-xs'
                            : 'bg-white/70 border-[#D5CFBF] hover:bg-white hover:border-[#2E6B4F]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-[#2E6B4F] bg-[#2E6B4F]' : 'border-[#9E988A] bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#17201B]' : 'text-[#3E4540]'}`}>
                              {model.name}
                            </span>
                          </div>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-sm border shrink-0 ${model.badgeColor}`}>
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-[#6B726C] line-clamp-1 pl-5">
                          {model.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10.5px] text-[#6B726C] pl-1">
                  💡 <strong>Tip:</strong> <strong>Gemini 3.1 Flash Lite</strong> is recommended for maximum extraction speed and minimal latency.
                </p>
              </div>

              {/* Documents Counter & Help */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#17201B]">
                    Attached Documents ({files.length}/{MAX_PDF_COUNT})
                  </span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#24543E] font-semibold border border-[#CFE8D7]">
                    Multi-PDF Synthesis Enabled
                  </span>
                </div>
                {files.length > 0 && files.length < MAX_PDF_COUNT && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11.5px] font-bold text-[#2E6B4F] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add another PDF
                  </button>
                )}
              </div>

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, idx) => (
                    <div
                      key={`${f.name}-${idx}`}
                      className="p-3 rounded-xl border border-[#D5CFBF] bg-[#FAF8F3] flex items-center justify-between gap-3 group transition-all hover:border-[#2E6B4F]/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#2E6B4F]/10 text-[#2E6B4F] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#17201B] truncate max-w-[280px] sm:max-w-md">
                              {f.name}
                            </span>
                            <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded-sm bg-[#E3DECF] text-[#4A524C]">
                              Doc {idx + 1}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-[#6B726C]">
                            {(f.size / (1024 * 1024)).toFixed(2)} MB · PDF
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1.5 rounded-lg text-[#6B726C] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drag and Drop Zone (shown when empty or if under limit) */}
              {files.length < MAX_PDF_COUNT && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    files.length === 0 ? 'min-h-[170px]' : 'min-h-[100px] bg-[#FBFAF7]'
                  } ${
                    isDragging
                      ? 'border-[#2E6B4F] bg-[#2E6B4F]/5 scale-[0.99]'
                      : 'border-[#D5CFBF] hover:border-[#2E6B4F]/60 bg-[#FBFAF7] hover:bg-[#F7F4EB]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EAE5D8] text-[#555C56] flex items-center justify-center mx-auto transition-transform group-hover:scale-105">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#17201B]">
                        {files.length === 0
                          ? 'Drag and drop up to 3 PDFs here, or click to browse'
                          : `Add more documents (${MAX_PDF_COUNT - files.length} remaining)`}
                      </p>
                      <p className="text-[11px] text-[#6B726C] mt-0.5">
                        Combine Tchibo FiTS specifications, lab test reports, or tech packs into one unified DPP
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {files.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => {
                      setFiles([]);
                      setError(null);
                      setIsCapacityError(false);
                    }}
                    className="px-3 py-2 rounded-lg border border-[#D5CFBF] text-xs font-semibold text-[#555C56] hover:bg-[#FAF8F3] cursor-pointer text-center"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => handleStartExtraction()}
                    disabled={isLoading}
                    className="px-4 py-2.5 rounded-lg bg-[#2E6B4F] hover:bg-[#24543E] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing with {AI_MODELS.find((m) => m.id === selectedModel)?.shortName || 'AI'}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#A2E2BD]" />
                        <span>
                          Run AI Auto-Fill ({files.length} PDF{files.length > 1 ? 's' : ''}) · {AI_MODELS.find((m) => m.id === selectedModel)?.shortName}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Progress feedback when analyzing */}
              {isLoading && (
                <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E0DBCF] space-y-2">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#2E6B4F]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{AI_MODELS.find((m) => m.id === selectedModel)?.name || 'Gemini AI'} Processing</span>
                  </div>
                  <p className="text-[11.5px] text-[#555C56]">{loadingStep}</p>
                  <div className="w-full bg-[#E5E0D2] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#2E6B4F] h-full w-3/4 animate-pulse rounded-full" />
                  </div>
                </div>
              )}

              {/* Quick Sample Loaders */}
              <div className="pt-3 border-t border-[#EAE5D8] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#6B726C]">
                    Or test immediately with project sample documents:
                  </span>
                </div>

                {/* Combined 2-PDF Test */}
                <button
                  type="button"
                  onClick={() => handleLoadSample('both')}
                  className="w-full text-left p-3 rounded-xl border border-[#2E6B4F]/40 bg-[#FAF8F3] hover:border-[#2E6B4F] hover:bg-[#F2ECE0] transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#17201B] flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-[#2E6B4F]" />
                      Combine 2 Documents: FiTS Specification + Bureau Veritas Test Report
                      <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-[#2E6B4F] text-white">
                        Recommended
                      </span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#6B726C] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-[#6B726C]">
                    Simulates cross-referencing spec measurements & article numbers with certified lab fiber tests (ISO 1833) and RSL test results.
                  </p>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('fits')}
                    className="text-left p-2.5 rounded-xl border border-[#D5CFBF] bg-white hover:border-[#2E6B4F] hover:bg-[#FAF8F3] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#17201B] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#2E6B4F]" />
                        FiTS Spec #151546
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#6B726C] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[10.5px] text-[#6B726C] line-clamp-1">
                      Measurements S–XXL, 10 SKUs, CmiA/Modal.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSample('bureau-veritas')}
                    className="text-left p-2.5 rounded-xl border border-[#D5CFBF] bg-white hover:border-[#2E6B4F] hover:bg-[#FAF8F3] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#17201B] flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-[#2E6B4F]" />
                        Bureau Veritas Report
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#6B726C] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[10.5px] text-[#6B726C] line-clamp-1">
                      ISO 1833 fibre analysis & colourfastness.
                    </p>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'preview' && extractedData && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#2E6B4F]/10 border border-[#2E6B4F]/20 text-[#2E6B4F] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E6B4F] shrink-0 mt-0.5" />
                <div className="text-xs flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-bold">Extraction & Synthesis Successful</p>
                    <span className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#2E6B4F] text-white font-semibold flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      Extracted with {AI_MODELS.find((m) => m.id === (modelUsedInExtraction || selectedModel))?.name || (modelUsedInExtraction || selectedModel)}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#17201B]/80 mt-1">{extractionSummary}</p>
                </div>
              </div>

              {fallbackNotice && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950">Automatic Model Fallback Activated</span>
                    <p className="text-[11.5px] text-amber-900 mt-0.5 leading-relaxed">{fallbackNotice}</p>
                  </div>
                </div>
              )}

              {/* Analyzed Documents Badges */}
              {(analyzedFileNames || []).length > 0 && (
                <div className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#E0DBCF] flex items-center gap-2 flex-wrap">
                  <span className="text-[10.5px] uppercase font-bold text-[#6B726C] tracking-wide">
                    Processed Documents ({analyzedFileNames?.length || 0}):
                  </span>
                  {(analyzedFileNames || []).map((name, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#D5CFBF] text-[#17201B] flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <FileText className="w-3 h-3 text-[#2E6B4F]" />
                      <span className="truncate">{name}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Overview of what will be filled */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E0DBCF]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B726C] uppercase tracking-wide mb-1">
                    <Layers className="w-3.5 h-3.5 text-[#2E6B4F]" />
                    Product Identity
                  </div>
                  <p className="text-xs font-bold text-[#17201B] truncate">
                    {extractedData.general.productName || '—'}
                  </p>
                  <p className="text-[10.5px] text-[#6B726C] mt-0.5">
                    Order #{extractedData.general.orderNo || '—'} · Project #{extractedData.general.projectId || '—'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E0DBCF]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B726C] uppercase tracking-wide mb-1">
                    <FlaskConical className="w-3.5 h-3.5 text-[#2E6B4F]" />
                    Material Composition
                  </div>
                  <p className="text-xs font-bold text-[#17201B]">
                    {extractedData.materials.cotton}% Cotton · {extractedData.materials.modal}% Modal · {extractedData.materials.elastane}% Elastane
                  </p>
                  <p className="text-[10.5px] text-[#6B726C] mt-0.5">
                    {extractedData.materials.fabricWeight} g/m² · {extractedData.materials.tolerance || '—'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E0DBCF]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B726C] uppercase tracking-wide mb-1">
                    <Ruler className="w-3.5 h-3.5 text-[#2E6B4F]" />
                    Technical Charts
                  </div>
                  <p className="text-xs font-bold text-[#17201B]">
                    {(extractedData.measurements?.top || []).length} Top + {(extractedData.measurements?.bottom || []).length} Bottom Rows
                  </p>
                  <p className="text-[10.5px] text-[#6B726C] mt-0.5">
                    S, M, L, XL, XXL Grading
                  </p>
                </div>
              </div>

              {/* Additional Highlights */}
              <div className="p-3.5 rounded-xl border border-[#E0DBCF] bg-white text-xs space-y-2">
                <span className="font-bold text-[#17201B] block">Extracted Quality & Compliance Data:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#6B726C] block">Overall Status:</span>
                    <span className="font-bold text-[#2E6B4F] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {extractedData.general.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B726C] block">Country of Origin:</span>
                    <span className="font-bold text-[#17201B]">{extractedData.general.originCountry || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B726C] block">Lab Tests (RSL):</span>
                    <span className="font-bold text-[#17201B]">{(extractedData.quality?.rslItems || []).length} Parameters</span>
                  </div>
                  <div>
                    <span className="text-[#6B726C] block">Article Numbers:</span>
                    <span className="font-bold text-[#17201B]">10 Sizes mapped</span>
                  </div>
                </div>
              </div>

              {/* Apply / Back Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-[#EAE5D8]">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="px-3 py-2 rounded-lg border border-[#D5CFBF] text-xs font-semibold text-[#555C56] hover:bg-[#FAF8F3] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Upload Different PDFs</span>
                </button>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApply('merge')}
                    className="px-3.5 py-2 rounded-lg border border-[#2E6B4F] text-[#2E6B4F] hover:bg-[#2E6B4F]/5 text-xs font-bold transition-all cursor-pointer text-center"
                    title="Keep existing non-empty fields and fill in missing values"
                  >
                    Merge with Form
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply('replace')}
                    className="px-4 py-2 rounded-lg bg-[#2E6B4F] hover:bg-[#24543E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    title="Populate the entire passport form with all extracted attributes"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply All to Form</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
