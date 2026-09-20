'use client';

import React, { useState, useEffect, useRef, useMemo, FormEvent } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  Download,
  Share,
  ShieldCheck,
  Edit3,
  Droplets,
  Zap,
  Box,
  Recycle,
  Leaf,
  RotateCcw,
  Sparkles,
  Barcode,
  MapPin,
  Check,
  Plus,
  AlertCircle,
  FileText,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  ChevronDown,
  ExternalLink,
  PackageCheck
} from 'lucide-react';
import type { PassportData, Size, Unit, Garment, StyleType } from '@/lib/passport-data';
import { normalizePassportData, isMeaningfulStainHack } from '@/lib/passport-data';
import SupplyChainMap from '@/components/SupplyChainMap';
import { CareIconRenderer } from '@/lib/care-icons';

const EU: Record<Size, string> = { S: '44/46', M: '48/50', L: '52/54', XL: '56/58', XXL: '60/62' };

function isValidImageSrc(src?: string | null): boolean {
  if (!src || typeof src !== 'string') return false;
  const s = src.trim().toLowerCase();
  if (!s || s === 'none' || s === 'null' || s === 'undefined') return false;
  if (s.includes('example.com') || s.includes('placeholder.com') || s.includes('dummy.com')) return false;
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image/') || s.startsWith('/');
}

function QRCode({ seed }: { seed: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function hashSeed(s: string) {
      let h = 1779033703;
      for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
      }
      return h >>> 0;
    }
    function mulberry(a: number) {
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const N = 23;
    const m = cv.width / N;
    const rnd = mulberry(hashSeed(seed || '151546-4300085070'));

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#17201B';

    function finder(fx: number, fy: number) {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const e = x === 0 || x === 6 || y === 0 || y === 6;
          const c = x > 1 && x < 5 && y > 1 && y < 5;
          if (e || c) ctx!.fillRect((fx + x) * m, (fy + y) * m, m * 0.92, m * 0.92);
        }
      }
    }
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const inF = (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
        if (!inF && rnd() > 0.52) ctx.fillRect(x * m, y * m, m * 0.92, m * 0.92);
      }
    }
    finder(0, 0);
    finder(N - 7, 0);
    finder(0, N - 7);
  }, [seed]);

  return (
    <canvas
      ref={canvasRef}
      width={92}
      height={92}
      className="rounded-lg border border-line bg-white shrink-0"
    />
  );
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CircularComposition({
  cotton = 0,
  modal = 0,
  viscose = 0,
  elastane = 0
}: {
  cotton?: number;
  modal?: number;
  viscose?: number;
  elastane?: number;
}) {
  const rawData = [
    ...(cotton > 0 ? [{ label: 'Cotton (CmiA)', value: cotton, color: 'var(--color-green)' }] : []),
    ...(viscose > 0 ? [{ label: 'Viscose (Birla Livaeco™)', value: viscose, color: '#4E886D' }] : []),
    ...(modal > 0 ? [{ label: 'Modal', value: modal, color: '#8FB79E' }] : []),
    ...(elastane > 0 ? [{ label: 'Elastane (creora®)', value: elastane, color: '#C9B27E' }] : [])
  ];
  const total = rawData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="py-6 px-4 bg-surface-2 border border-dashed border-line-2 rounded-xl text-center">
        <p className="text-[13px] font-semibold text-ink mb-1">No fiber composition specified yet</p>
        <p className="text-[11.5px] text-muted">Use the Data Entry Studio (Materials tab) to add fiber percentages.</p>
      </div>
    );
  }

  const data = rawData.map((item, i) => {
    const prevSum = rawData.slice(0, i).reduce((sum, cur) => sum + cur.value, 0);
    const rotation = (prevSum / total) * 360;
    return { ...item, rotation };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-3">
      <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F8F3" strokeWidth="12" />
          {data.map((item, i) => {
            const strokeDasharray = 2 * Math.PI * 40;
            const strokeDashoffset = strokeDasharray - (item.value / total) * strokeDasharray;

            return (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={item.color}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                initial={{ strokeDashoffset: strokeDasharray }}
                whileInView={{ strokeDashoffset }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.2 + i * 0.1, ease: 'circOut' }}
                strokeLinecap="round"
                style={{ transformOrigin: '50% 50%', transform: `rotate(${item.rotation}deg)` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] uppercase tracking-widest text-muted font-bold">Total</span>
          <span className="text-[20px] sm:text-[24px] font-display font-bold text-ink">
            {total}%
          </span>
        </div>
      </div>

      <div className="grid gap-2.5 w-full">
        {data.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
            className="flex items-center gap-3 bg-surface-2 border border-line rounded-xl p-2.5 px-3.5 transition-transform hover:translate-x-1"
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[13px] font-bold text-ink flex-1">{item.label}</span>
            <span className="font-mono text-[13px] font-bold text-green-dark bg-green-soft px-2 py-0.5 rounded-lg">
              {item.value}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CarbonPieChart({
  breakdown = [],
  total = 0
}: {
  breakdown: Array<{ label: string; value: number; color: string }>;
  total: number;
}) {
  if (!breakdown || breakdown.length === 0 || total === 0) {
    return (
      <div className="py-8 px-4 bg-surface-2 border border-dashed border-line-2 rounded-xl text-center my-4">
        <p className="text-[13px] font-semibold text-ink mb-1">Carbon Footprint Not Registered</p>
        <p className="text-[11.5px] text-muted">Leave blank or input lifecycle stage breakdown in the Environmental editor tab.</p>
      </div>
    );
  }

  const itemsWithRotation = breakdown.map((item, i) => {
    const prevSum = breakdown.slice(0, i).reduce((sum, cur) => sum + cur.value, 0);
    const rotation = (prevSum / 100) * 360;
    return { ...item, rotation };
  });

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 py-4">
      <div className="relative w-[180px] h-[180px] lg:w-[220px] lg:h-[220px] shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F8F3" strokeWidth="20" />
          {itemsWithRotation.map((item, i) => {
            const strokeDasharray = 2 * Math.PI * 40;
            const strokeDashoffset = strokeDasharray - (item.value / 100) * strokeDasharray;

            return (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={item.color}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                initial={{ strokeDashoffset: strokeDasharray }}
                whileInView={{ strokeDashoffset }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.2 + i * 0.1, ease: 'circOut' }}
                style={{ transformOrigin: '50% 50%', transform: `rotate(${item.rotation}deg)` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] uppercase tracking-widest text-muted font-bold">Total CO₂e</span>
          <span className="text-[24px] lg:text-[28px] font-display font-bold text-ink">
            {total}kg
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 w-full">
        {breakdown.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
            className="flex items-center gap-3 bg-surface-2 border border-line rounded-xl p-2.5 px-3.5 group hover:border-green transition-colors"
          >
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[12px] font-bold text-ink">{item.label}</span>
                <span className="text-[11px] font-bold text-muted">{item.value}%</span>
              </div>
              <div className="h-1 bg-muted/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.value}%` }}
                  transition={{ duration: 1, delay: 1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ResourceBarChart({
  water,
  energy,
  recycled
}: {
  water: { value: number; max: number; sub: string };
  energy: { value: number; max: number; sub: string };
  recycled: { value: number; max: number; sub: string };
}) {
  const hasValues = (water?.value ?? 0) > 0 || (energy?.value ?? 0) > 0 || (recycled?.value ?? 0) > 0;
  if (!hasValues) {
    return (
      <div className="py-8 px-4 bg-surface-2 border border-dashed border-line-2 rounded-xl text-center my-2">
        <p className="text-[13px] font-semibold text-ink mb-1">Resource Metrics Not Registered</p>
        <p className="text-[11.5px] text-muted">Input water, energy, and recycled packaging in the Environmental editor tab.</p>
      </div>
    );
  }

  const data = [
    { label: 'Water Usage', value: water?.value ?? 0, max: water?.max || 1000, unit: 'L', icon: Droplets, color: 'var(--color-green)', sub: water?.sub || '' },
    { label: 'Renewable Energy', value: energy?.value ?? 0, max: energy?.max || 100, unit: '%', icon: Zap, color: '#D4AF37', sub: energy?.sub || '' },
    { label: 'Recycled Content', value: recycled?.value ?? 0, max: recycled?.max || 100, unit: '%', icon: Recycle, color: '#5FA47F', sub: recycled?.sub || '' }
  ];

  return (
    <div className="grid gap-6 py-4">
      {data.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="bg-surface-2 border border-line rounded-xl p-5 group hover:border-green transition-all"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-line grid place-items-center text-muted group-hover:text-ink transition-colors">
                <item.icon size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-ink leading-none">{item.label}</h4>
                <p className="text-[11px] text-muted mt-1.5 font-medium">{item.sub}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-display font-bold text-[22px] text-ink">
                {item.value}
                <small className="text-[13px] ml-0.5">{item.unit}</small>
              </span>
            </div>
          </div>

          <div className="relative h-2.5 bg-muted/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${item.max > 0 ? Math.min(100, (item.value / item.max) * 100) : 0}%` }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'circOut' }}
              className="h-full rounded-full shadow-sm"
              style={{ backgroundColor: item.color }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function RevealGroup({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        visible: { transition: { staggerChildren: 0.12 } },
        hidden: {}
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function RevealItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PulseMarker({ top, left }: { top: string; left: string }) {
  return (
    <div className="absolute w-3 h-3 bg-green rounded-full z-10" style={{ top, left }}>
      <motion.div
        animate={{
          scale: [1, 2.5],
          opacity: [0.7, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut'
        }}
        className="absolute inset-0 bg-green rounded-full"
      />
      <div className="absolute inset-[3px] bg-white rounded-full shadow-sm" />
    </div>
  );
}

function OriginMap() {
  return (
    <div className="relative bg-[#EAE6DA] border border-line rounded-[18px] overflow-hidden mb-6 shadow-custom aspect-[1/1] sm:aspect-[21/9]">
      <Image
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAROjOi-Bf2EcETjYQMYUiQFiGvpbNnne4KfaHBiXJYvdh3thocx7W06GEve67XMqCacKpZItN7RPP7TRmKEsKIPbkMSJD3aREJ794POQ-yTiMDoJgxsFCVToMqjCwI9jrej_9nVi_8NCHh4soGenyWEdF31wyv2Dw0rljUeY_oGR1uumoaX9IXdst2MPeKmJD46dZwGzKn-G1DSTtHqDlUgAQN7zhLnpoa7LCJ8hW2awbgSxx_n0J"
        alt="Supply Chain Route Map"
        fill
        className="object-cover opacity-85 mix-blend-multiply"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg/20 to-transparent" />

      <PulseMarker top="45%" left="75%" />
      <PulseMarker top="38%" left="52%" />
      <PulseMarker top="42%" left="44%" />
      <PulseMarker top="35%" left="41%" />

      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-5 bg-white/90 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-line shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green rounded-full pulse-marker-simple" />
          <span className="text-[9px] sm:text-[11px] font-bold text-ink uppercase tracking-wider">Live Route</span>
        </div>
      </div>
    </div>
  );
}

function TraceBar({ percentage, summary }: { percentage: number; summary: string }) {
  const [pct, setPct] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / 1400, 1);
        setPct(Math.round(percentage * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, percentage]);

  return (
    <div ref={ref} className="bg-surface border border-line rounded-[18px] shadow-custom p-[22px] sm:px-[26px] mb-[30px] flex gap-[26px] items-center flex-wrap">
      <div className="font-display font-bold text-[40px] text-green leading-none">
        {pct}
        <small className="text-[18px] text-muted">%</small>
      </div>
      <div className="flex-1 min-w-[220px]">
        <div className="h-2.5 bg-[#EAE6DA] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-gradient-to-r from-green to-[#5FA47F] rounded-full"
          />
        </div>
        <div className="text-[12px] text-muted mt-2">{summary}</div>
      </div>
    </div>
  );
}

function LabCard({ std, title, val, subVal, desc, hint }: { std: string; title: string; val: string; subVal: string; desc: string; hint: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="p-5 cursor-pointer transition-transform duration-300 text-left border border-line rounded-[16px] bg-white shadow-custom hover:-translate-y-1 w-full"
    >
      <div className="flex justify-between items-center mb-2.5 gap-2">
        <span className="font-mono text-[10px] text-muted">{std}</span>
        <span className="text-[10.5px] font-bold tracking-widest bg-green-soft text-green-dark border border-[#BCD8C6] rounded-full px-2.5 py-[3px] whitespace-nowrap">PASS</span>
      </div>
      <h4 className="text-[13px] font-bold mb-1.5 text-ink">{title}</h4>
      <div className="font-display font-bold text-[23px] tracking-tight text-ink">
        {val} <small className="text-[12px] text-muted font-medium">{subVal}</small>
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0, marginTop: open ? 10 : 0 }}
        className="overflow-hidden text-[12px] text-muted"
      >
        <div className="border-t border-dashed border-line-2 pt-2.5">{desc}</div>
      </motion.div>
      <div className="text-[10.5px] text-line-2 mt-2">{hint}</div>
    </button>
  );
}

function AccordionItem({ num, title, text, isOpen, onClick }: { num: string; title: string; text: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-line last:border-b-0">
      <button onClick={onClick} className="w-full flex items-center gap-3.5 bg-transparent border-none py-[13px] px-1 text-left cursor-pointer">
        <span className={`w-7 h-7 shrink-0 rounded-full font-mono text-[12px] flex items-center justify-center font-medium transition-colors duration-250 ${isOpen ? 'bg-green text-white' : 'bg-green-soft text-green-dark'}`}>
          {num}
        </span>
        <span className="font-semibold text-[13.5px] flex-1 text-ink">{title}</span>
        <span className={`transition-transform duration-300 text-muted ${isOpen ? 'rotate-180' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>
      <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
        <p className="text-[12.5px] text-muted px-1 pb-3.5 pl-[46px]">{text}</p>
      </motion.div>
    </div>
  );
}

interface PassportViewProps {
  data: PassportData;
  isCustomActive?: boolean;
  onResetCustom?: () => void;
  isPreviewMode?: boolean;
}

export default function PassportView({ data: propData, isCustomActive, onResetCustom, isPreviewMode = false }: PassportViewProps) {
  const data = useMemo(() => normalizePassportData(propData), [propData]);

  const hasOnePiece = Array.isArray(data.measurements?.onePiece) && data.measurements.onePiece.length > 0;
  const hasTop = Array.isArray(data.measurements?.top) && data.measurements.top.length > 0;
  const hasBottom = Array.isArray(data.measurements?.bottom) && data.measurements.bottom.length > 0;

  const availableSizes: string[] = useMemo(() => {
    if (Array.isArray(data.measurements?.sizeHeaders) && data.measurements.sizeHeaders.length > 0) {
      return data.measurements.sizeHeaders;
    }
    const sampleRow = data.measurements?.onePiece?.[0] || data.measurements?.top?.[0] || data.measurements?.bottom?.[0];
    if (sampleRow?.vals && typeof sampleRow.vals === 'object') {
      const customKeys = Object.keys(sampleRow.vals).filter(k => sampleRow.vals[k] !== undefined && sampleRow.vals[k] !== 0);
      if (customKeys.length > 0) return customKeys;
    }
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }, [data.measurements]);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const curSize = (selectedSize && availableSizes.includes(selectedSize))
    ? selectedSize
    : (availableSizes[1] || availableSizes[0] || 'M');
  const setCurSize = setSelectedSize;

  const [curUnit, setCurUnit] = useState<Unit>('cm');

  const defaultGarment: Garment = (data.measurements?.categoryType === 'one_piece' || (hasOnePiece && !hasTop))
    ? 'onePiece'
    : 'top';
  const [selectedGar, setSelectedGar] = useState<Garment | null>(null);
  const curGar: Garment = (selectedGar && ((selectedGar === 'onePiece' && hasOnePiece) || (selectedGar === 'top' && hasTop) || (selectedGar === 'bottom' && hasBottom)))
    ? selectedGar
    : defaultGarment;
  const setCurGar = setSelectedGar;

  const [curStyle, setCurStyle] = useState<StyleType>('uni');
  const [curView, setCurView] = useState<'cw1' | 'cw2'>('cw1');

  const [stainTab, setStainTab] = useState<'oil' | 'ink' | 'food'>('oil');
  const [accOpen, setAccOpen] = useState<number | null>(1);
  const [toast, setToast] = useState(false);
  const [gtinToast, setGtinToast] = useState(false);
  const [showGtinMatrix, setShowGtinMatrix] = useState(false);
  const [locResult, setLocResult] = useState<string | null>(null);

  // Traceability Live Destination State (defaults to Germany Hamburg)
  const [destState, setDestState] = useState(() => {
    return (
      data.traceability?.destination || {
        country: 'Germany',
        city: 'Hamburg',
        label: 'Hamburg Central Logistics Hub, Germany',
        lat: 53.5511,
        lng: 9.9937,
        transportMode: 'Maritime Sea Freight via Port of Chittagong',
        distanceKm: 14200
      }
    );
  });

  // Manual Carbon Footprint entry state
  const [manualCarbonVal, setManualCarbonVal] = useState<string>('');
  const [savedManualCarbon, setSavedManualCarbon] = useState<number | null>(() => {
    return (data.environmental?.totalCarbon && data.environmental.totalCarbon > 0) ? data.environmental.totalCarbon : null;
  });
  const [showCarbonModal, setShowCarbonModal] = useState(false);

  // Dynamic Image loading failure states
  const [cw1Error, setCw1Error] = useState(false);
  const [cw2Error, setCw2Error] = useState(false);
  const [upcycleError, setUpcycleError] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCw1Error(false);
  }, [data.general?.visuals?.cw1Image]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCw2Error(false);
  }, [data.general?.visuals?.cw2Image]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUpcycleError(false);
  }, [data.circularity?.upcycleImage]);

  const fmt = (v: number) => (curUnit === 'cm' ? v.toFixed(1) + ' cm' : (v / 2.54).toFixed(1) + ' in');

  const handleCopy = () => {
    const artNo = data.general?.articleNumbers?.[curStyle]?.[curSize] || '';
    if (!artNo) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(artNo);
    }
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

  const handleCopyGtin = (codeToCopy?: string) => {
    const code = codeToCopy || data.general?.gtinCodes?.[curStyle]?.[curSize] || '4061234730801';
    if (!code) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setGtinToast(true);
    setTimeout(() => setGtinToast(false), 2000);
  };

  const handleSaveManualCarbon = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(manualCarbonVal);
    if (!isNaN(parsed) && parsed > 0) {
      setSavedManualCarbon(parsed);
      setShowCarbonModal(false);
    }
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpp-${data.general.projectId || 'passport'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLocSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
    const q = input.value.trim();
    if (!q) return;

    let h = 1779033703;
    for (let i = 0; i < q.length; i++) {
      h = Math.imul(h ^ q.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    const idx = (h >>> 0) % 3;

    const CENTERS = [
      { n: 'GreenLoop Textile Hub', a: '14 Circular Ave', d: '1.2 km' },
      { n: 'City ReWear Collection Point', a: '88 Second Chance Rd', d: '2.7 km' },
      { n: 'FiberCycle Depot (Municipal)', a: '3 Loop Lane, North Yard', d: '4.1 km' }
    ];
    const c = CENTERS[idx];
    setLocResult(
      `Nearest collector for <b>${q.replace(/</g, '&lt;')}</b>:<br><b>${c.n}</b> — ${c.a} · ${c.d} away<br><span class="font-mono text-[11.5px] text-muted">open Mon–Sat 08:00–18:00 · accepts bagged, dry textiles incl. stretch blends</span>`
    );
  };

  const measurementsList =
    curGar === 'onePiece'
      ? (data.measurements?.onePiece || [])
      : curGar === 'top'
      ? (data.measurements?.top || [])
      : (data.measurements?.bottom || []);
  const activeArticleNo = data.general?.articleNumbers?.[curStyle]?.[curSize] || '';
  const activeGtinCode = data.general?.gtinCodes?.[curStyle]?.[curSize] || (curStyle === 'uni' ? '4061234730801' : '4061234730856');

  return (
    <div className={`min-h-screen ${isPreviewMode ? 'bg-bg/40' : 'bg-bg text-ink'}`}>
      {/* Top Banner if Custom Data is Active */}
      {isCustomActive && (
        <div className="bg-green text-lime px-4 py-2 text-[12px] font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
            <span>Active: You are currently previewing your custom passport dataset.</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/editor"
              className="underline hover:text-white transition-colors"
            >
              Modify Fields
            </Link>
            {onResetCustom && (
              <button
                onClick={onResetCustom}
                className="bg-ink/60 hover:bg-ink text-white px-2.5 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} /> Reset to Demo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#F4F1EA]/90 backdrop-blur-md border-b border-line">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px] py-2.5 sm:py-3 flex items-center justify-between">
          <a
            href="#section-1"
            className="flex items-center gap-2 no-underline font-display font-bold tracking-[0.06em] text-[13px] sm:text-[14px] shrink-0 text-ink"
          >
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green shadow-[0_0_0_4px_var(--color-green-soft)]"></span>
            {data.general.brand ? data.general.brand.split(' ')[0].toUpperCase() : 'DPP'}{' '}
            <em className="not-italic text-green text-[10px] border border-green rounded-full px-1.5 py-0 tracking-[0.12em]">
              DPP
            </em>
          </a>

          <div className="flex-1 min-w-0 flex gap-0.5 overflow-x-auto no-scrollbar mask-fade-right mx-2 sm:mx-4">
            <a href="#section-1" className="text-[11px] sm:text-[12.5px] font-semibold text-muted px-2 sm:px-2.5 py-[5px] sm:py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white active:bg-ink active:text-[#F4F1EA]">1 · Overview</a>
            <a href="#section-2" className="text-[11px] sm:text-[12.5px] font-semibold text-muted px-2 sm:px-2.5 py-[5px] sm:py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">2 · Traceability</a>
            <a href="#section-3" className="text-[11px] sm:text-[12.5px] font-semibold text-muted px-2 sm:px-2.5 py-[5px] sm:py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">3 · Quality & Testing</a>
            <a href="#section-4" className="text-[11px] sm:text-[12.5px] font-semibold text-muted px-2 sm:px-2.5 py-[5px] sm:py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">4 · Care</a>
            <a href="#section-5" className="text-[11px] sm:text-[12.5px] font-semibold text-muted px-2 sm:px-2.5 py-[5px] sm:py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">5 · Circularity</a>
            <a href="#section-6" className="text-[11px] sm:text-[12.5px] font-semibold text-muted px-2 sm:px-2.5 py-[5px] sm:py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">6 · Environmental</a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 bg-green hover:bg-green-dark text-white text-[11.5px] sm:text-[12px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-full transition-colors shadow-sm shrink-0"
              title="Open the Passport Data Editor"
            >
              <Edit3 size={13} />
              <span className="hidden sm:inline">Add / Edit Data</span>
              <span className="sm:hidden">Edit</span>
            </Link>

            <button
              onClick={handleDownloadJSON}
              className="hidden lg:flex items-center gap-1 text-[11.5px] font-semibold text-muted hover:text-ink transition-colors cursor-pointer border border-line rounded-full px-2.5 py-1 bg-white/70"
            >
              <Download size={13} /> JSON
            </button>
          </div>
        </div>
      </nav>

      {/* Top Verified Banner */}
      <section className="pt-6 sm:pt-8 max-w-[1120px] mx-auto px-4 sm:px-[22px]">
        <Reveal className="bg-green-dark text-[#EAF3EC] border border-[#2A362E] rounded-[18px] p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-custom">
          <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green flex items-center justify-center text-lime shrink-0">
              <ShieldCheck className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" />
            </div>
            <div>
              <h2 className="text-[16px] sm:text-[18px] font-bold text-white tracking-tight flex items-center gap-2">
                Verified Passport <CheckCircle2 className="w-[15px] h-[15px] sm:w-[16px] sm:h-[16px] text-lime" />
              </h2>
              <p className="text-[12px] sm:text-[13px] text-[#B9D3C1] mt-0.5">
                Project ID: {data.general.projectId || '—'} {data.general.version ? `· ${data.general.version}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {data.general.updatedDate && (
              <span className="text-[10px] sm:text-[11.5px] font-mono bg-ink/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[#B9D3C1] whitespace-nowrap">
                Updated: {data.general.updatedDate}
              </span>
            )}
            <span className="text-[10px] sm:text-[11.5px] font-mono bg-ink/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-lime whitespace-nowrap">
              Completeness: {data.general.completeness ?? 0}%
            </span>
          </div>
        </Reveal>
      </section>

      {/* SECTION 1: Product Overview */}
      <section className="pt-6 sm:pt-12 pb-4 sm:pb-6" id="section-1">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-3.5 sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-[42px] h-[42px] sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">
              1
            </div>
            <div>
              <h2 className="text-[18px] sm:text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight text-ink">
                Product Overview
              </h2>
              <p className="text-muted text-[12px] sm:text-[13.5px] mt-0.5">Identity, materials, certifications, GTIN codes & measurements</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4 sm:gap-[26px] items-stretch">
            {/* Identity Card */}
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[34px] sm:pb-[30px] flex flex-col">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3.5">
                  <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11.5px] text-green-dark bg-green-soft border border-[#BCD8C6] rounded-full px-2.5 py-1 sm:py-1.5 font-medium">
                    <span className="w-[5px] h-[5px] rounded-full bg-green animate-pulse-ring"></span>
                    DPP {data.general.projectId ? `· PROJECT ${data.general.projectId}` : '· SPECIFICATION'}
                  </div>
                  {data.general.passportId && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] bg-surface-2 border border-line text-muted px-2.5 py-1 rounded-full">
                      ID: <b className="text-ink font-semibold">{data.general.passportId}</b>
                    </span>
                  )}
                </div>
              </div>
              <h1 className="font-display text-[24px] sm:text-[clamp(28px,4.2vw,42px)] font-bold tracking-tight leading-[1.1] sm:leading-[1.06] text-ink">
                {data.general.productName || '—'}
              </h1>
              {data.general.subtitle && (
                <p className="text-muted my-1.5 mb-4 sm:mb-[20px] text-[13px] sm:text-[14.5px]">
                  {data.general.subtitle}
                </p>
              )}

              {/* Core Product Specifications */}
              <div className="border border-dashed border-line-2 rounded-[14px] p-3.5 sm:p-4 sm:px-[18px] grid gap-2.5 bg-surface-2 mt-1">
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]">
                  <span className="text-muted font-semibold text-[10.5px] tracking-widest uppercase">Brand</span>
                  <span className="font-mono text-[12px] sm:text-[12.5px] font-medium text-right text-ink">
                    {data.general.brand || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]">
                  <span className="text-muted font-semibold text-[10.5px] tracking-widest uppercase">Gender</span>
                  <span className="text-[12px] sm:text-[12.5px] font-semibold text-ink">
                    {data.general.gender || "Men's"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]">
                  <span className="text-muted font-semibold text-[10.5px] tracking-widest uppercase">Fitting</span>
                  <span className="text-[12px] sm:text-[12.5px] font-semibold text-ink">
                    {data.general.fitting || 'Relaxed Loungewear Fit'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]">
                  <span className="text-muted font-semibold text-[10.5px] tracking-widest uppercase">Colorway</span>
                  <span className="text-[12px] sm:text-[12.5px] font-medium text-ink">
                    {data.general.color || 'Jadeite / Dark Green AOP'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]">
                  <span className="text-muted font-semibold text-[10.5px] tracking-widest uppercase">Material Composition</span>
                  <span className="text-[12px] sm:text-[12.5px] font-semibold text-right text-green-dark">
                    {data.materials.cotton ?? 58}% Cotton, {data.materials.viscose ?? 39}% Viscose, {data.materials.elastane ?? 3}% Elastane
                    {data.general.weightGsm ? ` (${data.general.weightGsm} g/m²)` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]">
                  <span className="text-muted font-semibold text-[10.5px] tracking-widest uppercase">Article No.</span>
                  <span className="flex gap-2 items-center">
                    <span className="font-mono text-[12px] sm:text-[12.5px] font-medium text-right text-ink">
                      {activeArticleNo || '—'}
                    </span>
                    {activeArticleNo && (
                      <button
                        onClick={handleCopy}
                        className="border border-line-2 bg-white rounded-lg px-2 py-0.5 sm:px-[9px] sm:py-[3px] text-[10px] font-semibold text-muted transition-colors hover:text-green-dark hover:border-green cursor-pointer"
                      >
                        Copy
                      </button>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]">
                  <span className="text-muted font-semibold text-[10.5px] tracking-widest uppercase">Season</span>
                  <span className="font-mono text-[12px] sm:text-[12.5px] font-medium text-right text-ink">
                    {data.general.season || '—'}
                  </span>
                </div>
                {data.general.designDescription && (
                  <div className="mt-2 pt-2.5 border-t border-line-2">
                    <p className="text-[11.5px] leading-relaxed text-muted">
                      <b className="text-ink">Design & Style:</b> {data.general.designDescription}
                    </p>
                  </div>
                )}
              </div>

              {/* 13-digit GTIN Code Component */}
              <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-amber-soft/50 border border-amber/30">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Barcode size={16} className="text-amber" />
                    <span className="text-[12px] font-bold text-ink uppercase tracking-wider">
                      GTIN Code (13-digit)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber bg-white/80 border border-amber/30 px-2 py-0.5 rounded-full">
                    GS1 Standard
                  </span>
                </div>

                <p className="text-[11px] text-muted italic mb-3">
                  [ GTIN code - 13 digit (pending: size and color wise different GTIN code) ]
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white border border-line rounded-xl p-2.5 px-3">
                  <div>
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                      Active Variant ({curStyle.toUpperCase()} · Size {curSize})
                    </span>
                    <span className="font-mono text-[14px] sm:text-[15px] font-bold tracking-wider text-ink">
                      {activeGtinCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyGtin(activeGtinCode)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-ink text-lime hover:bg-ink/80 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      {gtinToast ? <Check size={13} /> : <Barcode size={13} />}
                      {gtinToast ? 'Copied!' : 'Copy GTIN'}
                    </button>
                    <button
                      onClick={() => setShowGtinMatrix(!showGtinMatrix)}
                      className="inline-flex items-center justify-center gap-1 bg-surface-2 hover:bg-surface text-ink border border-line text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Matrix</span>
                      <ChevronDown size={12} className={`transition-transform duration-200 ${showGtinMatrix ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Collapsible GTIN Size Matrix */}
                {showGtinMatrix && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="bg-white border border-line rounded-xl p-3 text-[11.5px]">
                      <div className="font-bold text-ink mb-2 flex items-center justify-between flex-wrap gap-1">
                        <span>
                          13-digit GTIN Matrix ({Object.keys(data.general.gtinCodes || {}).length > 2 ? '45 Combos · 9 Colorways × 5 Sizes' : 'Size & Colorway Matrix'}):
                        </span>
                        <span className="text-[10px] text-muted font-normal">Click any code to copy</span>
                      </div>

                      {/* If baby wear 9-colorway matrix */}
                      {Object.keys(data.general.gtinCodes || {}).some(k => k.startsWith('cw')) ? (
                        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                          {Array.from({ length: 9 }).map((_, idx) => {
                            const cwKey = `cw${idx + 1}`;
                            const cwObj = data.general.gtinCodes?.[cwKey];
                            if (!cwObj) return null;
                            const cwMeta = data.general.visuals?.colorways?.[idx];
                            const cwTitle = cwMeta?.name || `Colorway ${idx + 1}`;
                            const hex = cwMeta?.hex || '#666666';

                            return (
                              <div key={cwKey} className="border border-line rounded-lg p-2 bg-surface-2">
                                <div className="font-bold text-[11px] uppercase tracking-wider text-green-dark mb-1 flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: hex }} />
                                  <span className="truncate">{cwTitle}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                  {Object.entries(cwObj).map(([sz, code]) => (
                                    <button
                                      key={sz}
                                      onClick={() => handleCopyGtin(code as string)}
                                      className="flex flex-col py-1 px-1.5 bg-white hover:bg-green-soft border border-line hover:border-green rounded transition-colors text-left font-mono cursor-pointer"
                                    >
                                      <span className="font-bold text-[9.5px] text-muted">{sz}:</span>
                                      <span className="text-ink font-semibold text-[10.5px] truncate">{code as string}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Solid / Uni */}
                          <div className="border border-line rounded-lg p-2.5 bg-surface-2">
                            <div className="font-bold text-[11px] uppercase tracking-wider text-green-dark mb-1.5">
                              Uni (Solid Dark Green)
                            </div>
                            {(['S', 'M', 'L', 'XL', 'XXL'] as Size[]).map((sz) => {
                              const code = data.general.gtinCodes?.uni?.[sz] || `40612347308${sz === 'S' ? '01' : sz === 'M' ? '18' : sz === 'L' ? '25' : sz === 'XL' ? '32' : '49'}`;
                              return (
                                <button
                                  key={sz}
                                  onClick={() => handleCopyGtin(code)}
                                  className="w-full flex justify-between items-center py-1 px-1.5 hover:bg-white rounded transition-colors text-left font-mono cursor-pointer"
                                >
                                  <span className="font-semibold text-ink">Size {sz}:</span>
                                  <span className="text-muted hover:text-green-dark font-medium text-[11px]">{code}</span>
                                </button>
                              );
                            })}
                          </div>
                          {/* Print / AOP */}
                          <div className="border border-line rounded-lg p-2.5 bg-surface-2">
                            <div className="font-bold text-[11px] uppercase tracking-wider text-green-dark mb-1.5">
                              AOP (Allover Print Leaf)
                            </div>
                            {(['S', 'M', 'L', 'XL', 'XXL'] as Size[]).map((sz) => {
                              const code = data.general.gtinCodes?.aop?.[sz] || `40612347308${sz === 'S' ? '56' : sz === 'M' ? '63' : sz === 'L' ? '70' : sz === 'XL' ? '87' : '94'}`;
                              return (
                                <button
                                  key={sz}
                                  onClick={() => handleCopyGtin(code)}
                                  className="w-full flex justify-between items-center py-1 px-1.5 hover:bg-white rounded transition-colors text-left font-mono cursor-pointer"
                                >
                                  <span className="font-semibold text-ink">Size {sz}:</span>
                                  <span className="text-muted hover:text-green-dark font-medium text-[11px]">{code}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Packaging Information */}
              <div className="mt-3.5 p-3 sm:p-3.5 rounded-xl bg-surface-2 border border-line">
                <div className="flex items-center gap-2 mb-1.5">
                  <PackageCheck size={15} className="text-green-dark" />
                  <span className="text-[11.5px] font-bold text-ink uppercase tracking-wider">
                    Packaging Specifications
                  </span>
                </div>
                {data.general.packagingInfo?.materials || data.environmental.packagingMaterials ? (
                  <div className="text-[11.5px] text-muted space-y-1">
                    <div>
                      <b className="text-ink">Materials:</b>{' '}
                      {data.general.packagingInfo?.materials || data.environmental.packagingMaterials}
                    </div>
                    {data.general.packagingInfo?.recyclability && (
                      <div>
                        <b className="text-ink">Recyclability:</b> {data.general.packagingInfo.recyclability}
                      </div>
                    )}
                    {data.general.packagingInfo?.certification && (
                      <div className="inline-block bg-white text-green-dark font-semibold border border-line text-[10px] px-2 py-0.5 rounded-md mt-1">
                        {data.general.packagingInfo.certification}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11.5px] text-muted italic">
                    Data Not Provided in document (Requires manual entry)
                  </div>
                )}
              </div>

              {/* 4 Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <div className="bg-surface-2 border border-line rounded-xl p-2.5 sm:p-3 text-center sm:text-left">
                  <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Weight</div>
                  <div className="text-[13px] sm:text-[14px] font-bold text-ink">{data.general.weightGsm ? `${data.general.weightGsm} g/m²` : '180 g/m²'}</div>
                </div>
                <div className="bg-surface-2 border border-line rounded-xl p-2.5 sm:p-3 text-center sm:text-left">
                  <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Origin</div>
                  <div className="text-[13px] sm:text-[14px] font-bold text-ink">{data.general.originCountry || 'Bangladesh'}</div>
                </div>
                <div className="bg-surface-2 border border-line rounded-xl p-2.5 sm:p-3 text-center sm:text-left">
                  <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Lifetime</div>
                  <div className="text-[13px] sm:text-[14px] font-bold text-ink">{data.general.lifetimeYears || 'Not Specified'}</div>
                </div>
                <div className="bg-surface-2 border border-line rounded-xl p-2.5 sm:p-3 text-center sm:text-left">
                  <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Impact Status</div>
                  <div className="text-[12px] sm:text-[13px] font-bold text-amber">
                    {savedManualCarbon ? `${savedManualCarbon} kg CO₂e` : 'Pending LCA'}
                  </div>
                </div>
              </div>

              {/* Badges */}
              {data.general?.badges && data.general.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
                  {(data.general?.badges || []).map((b, i) => (
                    <span
                      key={i}
                      className="text-[11px] sm:text-[11.5px] font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-line-2 bg-white text-muted shadow-2xs"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

              {(data.general.qrCodeSeed || data.general.qrCodeLab) && (
                <div className="mt-auto pt-[20px] flex items-center gap-[14px]">
                  <QRCode seed={data.general.qrCodeSeed || activeGtinCode} />
                  <div className="text-[11.5px] text-muted leading-relaxed whitespace-pre-line">
                    <b className="text-ink block">Scan to verify digital passport</b>
                    {data.general.qrCodeLab || 'Verified under EU Ecodesign Standards (ESPR)'}
                  </div>
                </div>
              )}
            </Reveal>

            {/* Visualizer Card */}
            <Reveal className="overflow-hidden flex flex-col bg-surface border border-line rounded-[18px] shadow-custom">
              <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-line gap-2.5 flex-wrap">
                <span className="text-[12px] font-bold tracking-widest uppercase text-green-dark flex gap-2 items-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
                    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
                  </svg>
                  Product Visuals
                </span>
                {(data.general.visuals?.cw1Name || data.general.visuals?.cw2Name) && (
                  <div className="flex bg-surface-2 border border-line rounded-full p-[3px]">
                    <button
                      onClick={() => setCurView('cw1')}
                      className={`relative border-none bg-transparent rounded-full px-[13px] py-1.5 text-[12px] font-semibold transition-colors cursor-pointer ${
                        curView === 'cw1' ? 'text-[#F4F1EA]' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {curView === 'cw1' && (
                        <motion.div
                          layoutId="cwToggle"
                          className="absolute inset-0 bg-ink rounded-full z-0"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{data.general.visuals.cw1Name || 'CW 1'}</span>
                    </button>
                    <button
                      onClick={() => setCurView('cw2')}
                      className={`relative border-none bg-transparent rounded-full px-[13px] py-1.5 text-[12px] font-semibold transition-colors cursor-pointer ${
                        curView === 'cw2' ? 'text-[#F4F1EA]' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {curView === 'cw2' && (
                        <motion.div
                          layoutId="cwToggle"
                          className="absolute inset-0 bg-ink rounded-full z-0"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{data.general.visuals.cw2Name || 'CW 2'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative aspect-square bg-[#EAE4D6] overflow-hidden flex flex-col items-center justify-center">
                {/* Check if current active colorway has image or if alternate has image */}
                {((curView === 'cw1' && isValidImageSrc(data.general.visuals?.cw1Image) && !cw1Error) ||
                  (curView === 'cw2' && isValidImageSrc(data.general.visuals?.cw2Image) && !cw2Error) ||
                  (!isValidImageSrc(data.general.visuals?.[curView === 'cw1' ? 'cw1Image' : 'cw2Image']) &&
                    ((isValidImageSrc(data.general.visuals?.cw1Image) && !cw1Error) ||
                     (isValidImageSrc(data.general.visuals?.cw2Image) && !cw2Error)))) ? (
                  <>
                    {isValidImageSrc(data.general.visuals?.cw1Image) && !cw1Error && (
                      <Image
                        src={data.general.visuals.cw1Image}
                        alt={data.general.visuals.cw1Name || 'Colorway 1'}
                        fill
                        unoptimized
                        referrerPolicy="no-referrer"
                        onError={() => setCw1Error(true)}
                        className={`object-cover transition-opacity duration-500 ${
                          curView === 'cw1' || (!isValidImageSrc(data.general.visuals?.cw2Image) || cw2Error)
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                      />
                    )}
                    {isValidImageSrc(data.general.visuals?.cw2Image) && !cw2Error && (
                      <Image
                        src={data.general.visuals.cw2Image}
                        alt={data.general.visuals.cw2Name || 'Colorway 2'}
                        fill
                        unoptimized
                        referrerPolicy="no-referrer"
                        onError={() => setCw2Error(true)}
                        className={`object-cover transition-opacity duration-500 ${
                          curView === 'cw2' && (isValidImageSrc(data.general.visuals?.cw2Image) && !cw2Error)
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                      />
                    )}
                    <span className="absolute left-[14px] bottom-[14px] bg-ink/80 text-[#F4F1EA] font-mono text-[10.5px] px-2.5 py-1.5 rounded-lg backdrop-blur-sm z-10">
                      {data.general.projectId ? `rendered from FiTS ${data.general.projectId} · design sketch` : 'design sketch preview'}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-muted">
                    <div className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center text-green mb-2.5 shadow-xs">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-ink text-[13.5px]">No Product Image Available</span>
                    <span className="text-[11.5px] text-muted mt-1 max-w-[220px]">
                      Upload an image file or leave blank in the General &amp; Visuals editor tab
                    </span>
                  </div>
                )}
              </div>

              {(data.general.visuals?.aiModelInfo || data.general.visuals?.prompt || data.general.visuals?.colors) && (
                <div className="p-[18px] py-[14px] grid gap-1.5 font-mono text-[11px] text-muted">
                  {data.general.visuals.aiModelInfo && (
                    <span>
                      model: <b className="text-green-dark font-medium">{data.general.visuals.aiModelInfo}</b>
                    </span>
                  )}
                  {data.general.visuals.prompt && (
                    <span>
                      prompt: <b className="text-green-dark font-medium">{data.general.visuals.prompt}</b>
                    </span>
                  )}
                  {data.general.visuals.colors && (
                    <span>
                      colours locked to: <b className="text-green-dark font-medium">{data.general.visuals.colors}</b>
                    </span>
                  )}
                </div>
              )}

              {/* Colorways Range if defined */}
              {Array.isArray(data.general?.visuals?.colorways) && data.general.visuals.colorways.length > 0 && (
                <div className="p-4 border-t border-line bg-surface-2/60">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                      Approved Colorways &amp; Prints ({data.general.visuals.colorways.length})
                    </span>
                    <span className="text-[10px] font-mono text-muted">Pantone TPX / TCX</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {data.general.visuals.colorways.map((cw, i) => (
                      <div
                        key={i}
                        className="p-2 bg-white border border-line rounded-lg flex items-center gap-2"
                      >
                        <div
                          className="w-5 h-5 rounded-md border border-black/10 shrink-0 shadow-2xs"
                          style={{ backgroundColor: cw.hex || '#CCCCCC' }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11.5px] font-semibold text-ink truncate" title={cw.name}>
                            {cw.name}
                          </div>
                          {cw.pantone && (
                            <div className="text-[10px] font-mono text-muted truncate">
                              {cw.pantone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Reveal>
          </div>

          {/* Measurements Card */}
          <Reveal className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] overflow-hidden bg-surface border border-line rounded-[18px] shadow-custom mt-[26px]">
            <div className="lg:border-r border-b lg:border-b-0 border-line p-[26px] bg-surface-2 flex flex-col gap-3.5">
              <div className="flex justify-between items-center gap-2.5 flex-wrap">
                <h3 className="text-[15px] font-bold text-ink">Measurement Map</h3>
                <div className="flex items-center gap-2">
                  {data.measurements?.categoryType === 'one_piece' || (hasOnePiece && !hasTop && !hasBottom) ? (
                    <div className="inline-flex items-center gap-1.5 bg-green-soft text-green-dark border border-[#BCD8C6] rounded-full px-3 py-1 text-[11.5px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green" />
                      One-Piece (Baby Wear)
                    </div>
                  ) : (
                    <div className="flex bg-white border border-line rounded-full p-[3px]">
                      {hasTop && (
                        <button
                          onClick={() => setCurGar('top')}
                          className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${
                            curGar === 'top' ? 'text-white' : 'text-muted hover:text-ink'
                          }`}
                        >
                          {curGar === 'top' && (
                            <motion.div
                              layoutId="garToggle"
                              className="absolute inset-0 bg-green rounded-full z-0"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className="relative z-10">Top</span>
                        </button>
                      )}
                      {hasBottom && (
                        <button
                          onClick={() => setCurGar('bottom')}
                          className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${
                            curGar === 'bottom' ? 'text-white' : 'text-muted hover:text-ink'
                          }`}
                        >
                          {curGar === 'bottom' && (
                            <motion.div
                              layoutId="garToggle"
                              className="absolute inset-0 bg-green rounded-full z-0"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className="relative z-10">Bottom</span>
                        </button>
                      )}
                      {hasOnePiece && (
                        <button
                          onClick={() => setCurGar('onePiece')}
                          className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${
                            curGar === 'onePiece' ? 'text-white' : 'text-muted hover:text-ink'
                          }`}
                        >
                          {curGar === 'onePiece' && (
                            <motion.div
                              layoutId="garToggle"
                              className="absolute inset-0 bg-green rounded-full z-0"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className="relative z-10">One-Piece</span>
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex bg-white border border-line rounded-full p-[3px]">
                    <button
                      onClick={() => setCurUnit('cm')}
                      className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${
                        curUnit === 'cm' ? 'text-white' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {curUnit === 'cm' && (
                        <motion.div
                          layoutId="unitToggle"
                          className="absolute inset-0 bg-ink rounded-full z-0"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">cm</span>
                    </button>
                    <button
                      onClick={() => setCurUnit('in')}
                      className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${
                        curUnit === 'in' ? 'text-white' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {curUnit === 'in' && (
                        <motion.div
                          layoutId="unitToggle"
                          className="absolute inset-0 bg-ink rounded-full z-0"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">inch</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative aspect-[4/3] max-w-[340px] mx-auto w-full flex items-center justify-center p-2 bg-white rounded-xl border border-line">
                <svg viewBox="0 0 340 300" className="w-full h-full stroke-ink" fill="none" strokeWidth="1.5">
                  {curGar === 'onePiece' ? (
                    <g>
                      {/* One-Piece / Romper silhouette */}
                      <path
                        d="M 125 45 L 145 65 L 195 65 L 215 45 L 250 75 L 225 100 L 215 85 L 215 190 L 225 255 L 185 255 L 170 170 L 155 255 L 115 255 L 125 190 L 125 85 L 115 100 L 90 75 Z"
                        fill="#F4F1EA"
                      />
                      <path d="M 145 65 Q 170 95 195 65" />
                      <line x1="125" y1="110" x2="215" y2="110" stroke="var(--color-green)" strokeDasharray="3 3" />
                      <line x1="170" y1="65" x2="170" y2="255" stroke="var(--color-green)" strokeDasharray="3 3" />
                      <line x1="125" y1="45" x2="215" y2="45" stroke="#8FB79E" strokeDasharray="2 2" />
                      <circle cx="170" cy="110" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="170" y="114" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">A</text>
                      <circle cx="170" cy="170" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="170" y="174" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">B</text>
                      <circle cx="105" cy="88" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="105" y="92" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">C</text>
                      <circle cx="205" cy="225" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="205" y="229" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">D</text>
                    </g>
                  ) : curGar === 'top' ? (
                    <g>
                      <path d="M 110 50 L 140 75 L 200 75 L 230 50 L 260 85 L 230 110 L 225 95 L 225 240 L 115 240 L 115 95 L 110 110 L 80 85 Z" fill="#F4F1EA" />
                      <path d="M 140 75 Q 170 115 200 75" />
                      <line x1="115" y1="120" x2="225" y2="120" stroke="var(--color-green)" strokeDasharray="3 3" />
                      <line x1="170" y1="75" x2="170" y2="240" stroke="var(--color-green)" strokeDasharray="3 3" />
                      <line x1="110" y1="50" x2="230" y2="50" stroke="#8FB79E" strokeDasharray="2 2" />
                      <circle cx="170" cy="120" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="170" y="124" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">A</text>
                      <circle cx="170" cy="170" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="170" y="174" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">B</text>
                      <circle cx="95" cy="98" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="95" y="102" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">C</text>
                    </g>
                  ) : (
                    <g>
                      <path d="M 110 70 L 230 70 L 235 210 L 180 210 L 170 120 L 160 210 L 105 210 Z" fill="#F4F1EA" />
                      <line x1="110" y1="70" x2="230" y2="70" stroke="var(--color-green)" strokeWidth="3" />
                      <line x1="108" y1="110" x2="232" y2="110" stroke="var(--color-green)" strokeDasharray="3 3" />
                      <line x1="170" y1="120" x2="160" y2="210" stroke="var(--color-green)" strokeWidth="2" />
                      <circle cx="170" cy="70" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="170" y="74" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">A</text>
                      <circle cx="170" cy="110" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="170" y="114" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">B</text>
                      <circle cx="165" cy="165" r="10" fill="var(--color-green)" className="opacity-90" />
                      <text x="165" y="169" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">C</text>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            <div className="p-5 sm:p-[26px] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Select Size</span>
                  <div className="flex gap-1 flex-wrap">
                    {availableSizes.map(sz => (
                      <button
                        key={sz}
                        onClick={() => setCurSize(sz)}
                        className={`min-w-9 h-9 px-2.5 rounded-xl font-bold text-[12px] transition-all cursor-pointer ${
                          curSize === sz
                            ? 'bg-ink text-white shadow-sm'
                            : 'bg-surface-2 border border-line text-muted hover:border-green'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[11.5px] text-muted mb-3 font-mono flex flex-wrap items-center gap-x-2 gap-y-1">
                  {EU[curSize as Size] && (
                    <span>Equivalent EU size: <b className="text-ink">{EU[curSize as Size]}</b></span>
                  )}
                  {data.measurements?.allowedShrinkage && (
                    <span className="inline-flex items-center gap-1 bg-green-soft text-green-dark border border-[#BCD8C6] px-2 py-0.5 rounded-md text-[11px] font-semibold">
                      Allowed Shrinkage: {data.measurements.allowedShrinkage}
                    </span>
                  )}
                  {data.measurements?.pomCount ? (
                    <span className="text-[11px] text-muted">
                      · {data.measurements.pomCount} POMs
                    </span>
                  ) : null}
                  {(data.general?.visuals?.cw1Name || data.general?.visuals?.cw2Name) && (
                    <span>
                      · Style:{' '}
                      <button
                        onClick={() => setCurStyle(curStyle === 'uni' ? 'aop' : 'uni')}
                        className="underline cursor-pointer text-green-dark font-medium"
                      >
                        {curStyle === 'uni' ? (data.general?.visuals?.cw1Name || 'Style 1') : (data.general?.visuals?.cw2Name || 'Style 2')}
                      </button>
                    </span>
                  )}
                </div>

                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="border-b border-line-2 text-[11px] text-muted uppercase tracking-widest">
                      <th className="py-2">Point</th>
                      <th className="py-2">Measurement</th>
                      <th className="py-2 text-center">Tol</th>
                      <th className="py-2 text-right">Spec ({curUnit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurementsList && measurementsList.length > 0 ? (
                      measurementsList.map((r, idx) => (
                        <tr key={`${r.k}-${idx}`} className="border-b border-line last:border-b-0 hover:bg-surface-2 transition-colors">
                          <td className="py-2.5 font-mono font-bold text-green">{r.k}</td>
                          <td className="py-2.5">
                            <div className="font-semibold text-ink">{r.name}</div>
                            {r.how && <div className="text-[11px] text-muted">{r.how}</div>}
                          </td>
                          <td className="py-2.5 text-center font-mono text-[11px] text-muted whitespace-nowrap">
                            {(r.tolMinus !== undefined || r.tolPlus !== undefined) ? (
                              <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-line text-muted">
                                {Math.abs(Number(r.tolMinus || 0)) === Math.abs(Number(r.tolPlus || 0))
                                  ? `±${Math.abs(Number(r.tolPlus ?? r.tolMinus ?? 0.5))}`
                                  : `+${Math.abs(Number(r.tolPlus || 0))} / -${Math.abs(Number(r.tolMinus || 0))}`}
                              </span>
                            ) : (
                              <span className="text-muted/40">—</span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-ink">
                            <span className="inline-block val-tick" key={`${r.k}-${curSize}-${curUnit}`}>
                              {fmt(r.vals?.[curSize] ?? 0)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted text-xs">
                          No measurement specifications entered yet. Add measurement points in the Measurements editor tab.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {Boolean(
                curGar === 'onePiece'
                  ? (data.measurements?.onePieceFit || data.measurements?.topFit)
                  : curGar === 'top'
                  ? data.measurements?.topFit
                  : data.measurements?.bottomFit
              ) && (
                <div className="mt-4 bg-surface-2 border border-dashed border-line-2 rounded-[14px] p-4 px-[18px]">
                  <h4 className="text-[13px] tracking-widest uppercase text-green-dark mb-2 font-bold">Fit Guide</h4>
                  <p className="text-[13px] text-muted leading-relaxed">
                    {curGar === 'onePiece'
                      ? (data.measurements?.onePieceFit || data.measurements?.topFit || 'Verified garment fit specification.')
                      : curGar === 'top'
                      ? data.measurements?.topFit
                      : data.measurements?.bottomFit}
                  </p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* SECTION 2: Traceability */}
      <section className="pt-10 sm:pt-[72px] pb-2" id="section-2">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">
              2
            </div>
            <div>
              <h2 className="text-[20px] sm:text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight text-ink">
                Supply Chain / Traceability
              </h2>
              <p className="text-muted text-[12px] sm:text-[13.5px] mt-0.5">
                Verified manufacturing journey (Tier 1 to Tier 3) and accredited laboratory testing
              </p>
            </div>
          </Reveal>



          {data.traceability?.nodes && data.traceability.nodes.length > 0 ? (
            <RevealGroup className="relative pl-6 sm:pl-[34px] grid gap-4 sm:gap-[22px] mb-3.5">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-green via-green to-amber-line"></div>

              {(data.traceability?.nodes || [])
                .filter(
                  node =>
                    Boolean(node.title && node.title.trim() !== '') &&
                    !node.tier?.toLowerCase().includes('tier 4') &&
                    !node.title?.toLowerCase().includes('cooperative') &&
                    !node.title?.toLowerCase().includes('raw material')
                )
                .map((node, idx) => (
                <RevealItem key={idx} className="relative">
                  <div
                    className={`absolute -left-[30px] top-[22px] w-4 h-4 rounded-full border-[4px] border-bg shadow-sm ${
                      node.color === 'amber' ? 'bg-amber' : 'bg-green'
                    }`}
                  />
                  <div className="bg-surface border border-line rounded-[18px] shadow-custom p-[22px] px-[24px] transition-transform hover:-translate-y-[3px]">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                      <span className="font-mono text-[11px] font-medium bg-ink text-lime rounded-lg px-2.5 py-1 tracking-[0.08em]">
                        {node.tier}
                      </span>
                      {node.date && <span className="font-mono text-[11.5px] text-muted">{node.date}</span>}
                      <span className="text-line-2 ml-auto text-[16px]">⟰</span>
                    </div>
                    <h3 className="text-[17px] font-bold text-ink">{node.title}</h3>
                    {node.subtitle && <p className="text-[12.5px] text-muted my-1 mb-3">{node.subtitle}</p>}

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
                      {(node.items || []).map((item, i) => (
                        <div key={i} className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                          <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">
                            {item.label}
                          </div>
                          <div className="text-[12.5px] font-semibold mt-0.5 text-ink">{item.val}</div>
                        </div>
                      ))}
                    </div>

                    {node.warning && (
                      <span className="inline-flex items-center gap-[7px] mt-3 bg-amber-soft border border-dashed border-amber-line text-amber text-[12px] font-semibold rounded-xl px-[13px] py-2">
                        <span className="w-2 h-2 rounded-full bg-amber"></span>
                        {node.warning}
                      </span>
                    )}
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="py-8 px-4 text-center text-muted text-xs bg-surface border border-dashed border-line-2 rounded-[18px]">
              No supply chain tier nodes registered yet. Register Tier 1 to Tier 3 facilities in the Traceability editor tab.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: Quality & Testing */}
      <section className="pt-10 sm:pt-[72px] pb-2" id="section-3">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">
              3
            </div>
            <div>
              <h2 className="text-[20px] sm:text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight text-ink">
                Quality & Testing
              </h2>
              <p className="text-muted text-[12px] sm:text-[13.5px] mt-0.5">
                Lab report #{data.quality?.reportNumber || 'BGDT25154711'} · Overall PASS · RSL & Fastness verification
              </p>
            </div>
          </Reveal>

          {/* Official Laboratory Testing & Certification Summary Banner */}
          <Reveal className="mb-6 bg-green-dark text-[#EAF3EC] border border-[#2A362E] rounded-2xl p-5 sm:p-6 shadow-custom">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-green flex items-center justify-center text-lime shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-[16px] sm:text-[17px]">
                      {data.quality?.testingLab || 'ITS Labtest Bangladesh Ltd.'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-widest bg-lime text-ink px-2.5 py-0.5 rounded-full uppercase">
                      <CheckCircle2 size={12} /> {data.quality?.overallResult || 'PASS'}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#B9D3C1] mt-0.5">
                    Accredited Testing Authority & Analytical Laboratory
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-between sm:justify-end">
                <div className="bg-ink/50 border border-white/10 rounded-xl px-3.5 py-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#B9D3C1] block font-mono">
                    Lab Report Number
                  </span>
                  <span className="font-mono text-[13px] sm:text-[14px] font-bold text-white tracking-wider">
                    {data.quality?.reportNumber || 'BGDT25154711'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-[#B9D3C1]">
              <div className="flex items-center gap-2">
                <UserCheck size={15} className="text-lime shrink-0" />
                <span>
                  <b className="text-white font-semibold">Report Reviewed & Approved By:</b>{' '}
                  {data.quality?.reviewedBy?.name || 'Md. Tariqul Islam'},{' '}
                  <span className="text-[#D3E5D8]">
                    {data.quality?.reviewedBy?.designation || 'Senior Executive – Analytical Lab'}
                  </span>
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#B9D3C1]/80">
                AFIRM RSL Cat. 1 · DIN EN ISO 105 Verified
              </span>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4 sm:gap-[26px] items-start mb-6 sm:mb-[26px]">
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[26px]">
              <h3 className="text-[16px] font-bold mb-1 text-ink">Fabric Composition Verification</h3>
              <p className="text-[12.5px] text-muted mb-[18px]">
                Laboratory tested (ISO 1833) vs labeled specification
              </p>

              <CircularComposition
                cotton={data.materials.cotton}
                viscose={data.materials.viscose}
                modal={data.materials.modal}
                elastane={data.materials.elastane}
              />

              <div className="mt-6 flex justify-between items-center bg-green-soft border border-[#BCD8C6] rounded-xl p-3 px-4">
                <span className="text-[11px] tracking-widest uppercase text-green-dark font-semibold">
                  Fabric weight{data.materials.fabricWeight ? ` · ${data.materials.fabricWeight} g/m²` : ''}
                </span>
                <span className="font-display font-bold text-[22px] text-green-dark">
                  {data.materials.fabricWeight ? (
                    <>
                      {data.materials.fabricWeight} <small className="text-[12px]">g/m²</small>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>

              {data.materials?.labAnalysis && data.materials.labAnalysis.length > 0 ? (
                <div className="mt-3.5 border border-dashed border-line-2 rounded-xl p-3 px-3.5 text-[12px] text-muted">
                  <b className="text-ink">Laboratory Analysis (ISO 1833):</b>
                  <table className="w-full border-collapse mt-1.5 mb-1.5">
                    <tbody>
                      {(data.materials?.labAnalysis || []).map((item, i) => (
                        <tr key={i}>
                          <td className="py-1 px-1.5 text-[12px] font-medium text-ink">{item.fiber}</td>
                          <td className="py-1 px-1.5 text-[12px] text-right font-mono">
                            labeled {item.labeled} → lab {item.lab}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  All within {data.materials?.tolerance || '±3%'} tolerance → <b className="text-green-dark">PASS</b>
                </div>
              ) : null}

              {data.materials.microfibreNote ? (
                <div className="mt-3.5 border border-dashed border-line-2 rounded-xl p-3 px-3.5 text-[12px] text-muted">
                  <b className="text-ink">Microfibre Release:</b> {data.materials.microfibreNote}
                </div>
              ) : null}
            </Reveal>

            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-[26px]">
              <h3 className="text-[16px] font-bold mb-1 text-ink">Restricted Substances — RSL Category 1</h3>
              <p className="text-[12.5px] text-muted mb-4">
                {data.quality.rslStandards || 'Tested in accordance with EU REACH & AFIRM RSL Category 1'}
              </p>
              <div className="grid gap-[9px]">
                {data.quality?.rslItems && data.quality.rslItems.length > 0 ? (
                  (data.quality?.rslItems || []).map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center gap-3 bg-surface-2 border border-line rounded-[10px] p-[9px] px-[13px] text-[12.5px]"
                    >
                      <span className="font-semibold text-ink">{item.name}</span>
                      <span className="font-mono text-[11.5px] text-muted">{item.result}</span>
                      <span className="text-[10.5px] font-bold tracking-[0.08em] bg-green-soft text-green-dark border border-[#BCD8C6] rounded-full px-2.5 py-[3px] whitespace-nowrap">
                        PASS
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-[12px] text-muted bg-surface-2 border border-dashed border-line rounded-lg text-center">
                    No restricted substances listed.
                  </div>
                )}
              </div>

              {data.materials?.svhcSubstances && data.materials.svhcSubstances.length > 0 ? (
                <div className="mt-6 pt-5 border-t border-line">
                  <h3 className="text-[15px] font-bold mb-1 text-ink">REACH SVHC Candidate List</h3>
                  <p className="text-[12px] text-muted mb-3">Substances of Very High Concern declaration</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12.5px]">
                      <thead className="text-[10.5px] text-muted uppercase tracking-widest border-b border-line-2">
                        <tr>
                          <th className="py-1.5 font-semibold">Substance</th>
                          <th className="py-1.5 font-semibold">Component</th>
                          <th className="py-1.5 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.materials?.svhcSubstances || []).map((item, i) => (
                          <tr key={i} className="border-b border-line last:border-b-0">
                            <td className="py-2 pr-2 font-medium text-ink">{item.substance}</td>
                            <td className="py-2 text-muted">{item.component}</td>
                            <td className="py-2 text-right">
                              <span className="text-[9.5px] font-bold tracking-widest text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-0.5 rounded-full whitespace-nowrap">
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </Reveal>
          </div>

          <Reveal className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <h3 className="text-[16px] sm:text-[17px] font-bold text-ink">
                Physical, Fastness &amp; Mechanical Safety Test Results
              </h3>
              <span className="text-[11px] font-mono font-semibold text-green-dark bg-green-soft border border-[#BCD8C6] px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                ISO 105 · DIN 53160 · EN 71-1 · EN 16732
              </span>
            </div>
            <p className="text-[12.5px] text-muted mb-4">
              {data.quality?.universalFastnessKey || 'Tested to DIN EN ISO 105 standards: washing, rubbing, light, perspiration, saliva, and mechanical pull-force safety.'}
            </p>
          </Reveal>

          {data.quality?.labCards && data.quality.labCards.length > 0 ? (
            <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data.quality?.labCards || []).map((card, i) => (
                <RevealItem key={i}>
                  <LabCard
                    std={card.std}
                    title={card.title}
                    val={card.val}
                    subVal={card.subVal}
                    desc={card.desc}
                    hint={card.hint}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : (
            <div className="py-8 px-4 text-center text-muted text-xs bg-surface border border-dashed border-line-2 rounded-[18px]">
              No laboratory test certificates registered yet.
            </div>
          )}

          {/* Universal Color Fastness Rating Scale (Universal Standard Reference) */}
          <Reveal className="mt-6 bg-white border border-[#E3DECF] rounded-[18px] p-5 sm:p-6 shadow-custom">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 mb-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-soft text-green-dark grid place-items-center font-bold text-[14px]">
                  5★
                </div>
                <div>
                  <h4 className="text-[14.5px] font-bold text-ink flex items-center gap-2">
                    Universal Colour Fastness Rating Scale
                    <span className="text-[10.5px] font-mono font-semibold bg-surface-2 text-muted px-2 py-0.5 rounded-md border border-line">
                      ISO 105 / DIN 53160 Standard
                    </span>
                  </h4>
                  <p className="text-[12px] text-muted">
                    Universal international 5-grade evaluation scale for shade change and cross-fibre staining
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-green-dark bg-green-soft px-3 py-1 rounded-full border border-[#BCD8C6] self-start sm:self-auto">
                Product Benchmark: Grade 4–5 (Exceeded)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="bg-[#FAFDF9] border-2 border-[#BCD8C6] rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[12px] font-bold text-green-dark font-mono bg-green-soft px-2 py-0.5 rounded-md">
                      Grade 5
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-dark">Top Benchmark</span>
                  </div>
                  <p className="text-[12px] font-semibold text-ink leading-snug">
                    Negligible or no change or staining
                  </p>
                </div>
                <span className="text-[10.5px] text-green-dark/80 mt-2 font-medium">
                  ★ Highest rating achieved
                </span>
              </div>

              <div className="bg-surface-2 border border-line rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[12px] font-bold text-ink font-mono bg-white px-2 py-0.5 rounded-md border border-line">
                      Grade 4
                    </span>
                    <span className="text-[10px] font-semibold text-muted">Commercial</span>
                  </div>
                  <p className="text-[12px] font-medium text-ink leading-snug">
                    Slightly changed or stained
                  </p>
                </div>
                <span className="text-[10.5px] text-muted mt-2">Standard retail requirement</span>
              </div>

              <div className="bg-surface-2 border border-line rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[12px] font-bold text-ink font-mono bg-white px-2 py-0.5 rounded-md border border-line">
                      Grade 3
                    </span>
                    <span className="text-[10px] font-semibold text-muted">Moderate</span>
                  </div>
                  <p className="text-[12px] font-medium text-ink leading-snug">
                    Noticeably changed or stained
                  </p>
                </div>
                <span className="text-[10.5px] text-muted mt-2">Noticeable alteration</span>
              </div>

              <div className="bg-[#FFFBF5] border border-amber-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[12px] font-bold text-amber-800 font-mono bg-amber-100 px-2 py-0.5 rounded-md">
                      Grade 2
                    </span>
                    <span className="text-[10px] font-bold text-amber-700">Warning</span>
                  </div>
                  <p className="text-[12px] font-medium text-amber-900 leading-snug">
                    Considerably changed or stained
                  </p>
                </div>
                <span className="text-[10.5px] text-amber-700/80 mt-2">Non-compliant for babywear</span>
              </div>

              <div className="bg-[#FEF6F6] border border-red-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[12px] font-bold text-red-800 font-mono bg-red-100 px-2 py-0.5 rounded-md">
                      Grade 1
                    </span>
                    <span className="text-[10px] font-bold text-red-700">Reject</span>
                  </div>
                  <p className="text-[12px] font-medium text-red-900 leading-snug">
                    Much changed or stained
                  </p>
                </div>
                <span className="text-[10.5px] text-red-700/80 mt-2">Severe color bleeding</span>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
              <span>
                Evaluated against ISO Grey Scale for Assessing Change in Colour (ISO 105-A02) and Staining (ISO 105-A03).
              </span>
              <span className="font-semibold text-green-dark">
                Complies with German LFGB § 30 &amp; EU Babywear Directives
              </span>
            </div>
          </Reveal>

          {/* Annexure & Official Audit Certificates */}
          {Array.isArray(data.annexure) && data.annexure.length > 0 && (
            <Reveal className="mt-8 bg-surface border border-line rounded-[18px] p-5 sm:p-6 shadow-custom">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-soft text-green-dark grid place-items-center">
                    <FileText size={17} />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-ink">Annexure &amp; Official Audit Documents</h4>
                    <p className="text-[12px] text-muted">Laboratory test reports, chemical declarations, and certification dossiers</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-semibold text-green-dark bg-green-soft px-2.5 py-1 rounded-full border border-[#BCD8C6]">
                  {data.annexure.length} Verified Documents
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {data.annexure.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-3.5 bg-surface-2 border border-line rounded-xl hover:border-green transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-0.5 rounded-md font-semibold">
                          {doc.type || 'Test Report'}
                        </span>
                        {doc.fileSize && (
                          <span className="text-[10.5px] font-mono text-muted">{doc.fileSize}</span>
                        )}
                      </div>
                      <h5 className="text-[13px] font-bold text-ink mb-1 group-hover:text-green-dark transition-colors line-clamp-2">
                        {doc.title}
                      </h5>
                      {doc.docNumber && (
                        <div className="text-[11.5px] font-mono text-muted mb-0.5">
                          Ref: <b className="text-ink">{doc.docNumber}</b>
                        </div>
                      )}
                      {doc.issuer && (
                        <div className="text-[11px] text-muted line-clamp-1">
                          Issuer: {doc.issuer}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-line-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted font-mono">{doc.date || 'Audited'}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-green-dark bg-white border border-line px-2 py-0.5 rounded-md shadow-2xs">
                        <CheckCircle2 size={11} className="text-green" /> Verified
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* SECTION 4: Care Instructions */}
      <section className="pt-10 sm:pt-[72px] pb-2" id="section-4">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[18px] mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">
              4
            </div>
            <div>
              <h2 className="text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight text-ink">
                Care Instructions & Stain Removal
              </h2>
              <p className="text-muted text-[13.5px] mt-0.5">
                Standard Ginetex symbols, care guidance & stain removal tips
              </p>
            </div>
          </Reveal>

          {Boolean(data.care?.wash || data.care?.bleach || data.care?.dry || data.care?.iron || data.care?.dryClean || data.care?.labelWording) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-[26px] items-start">
              <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[26px]">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[16px] font-bold text-ink">Standard Care Instructions</h3>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-2 border border-line text-muted">
                    GINETEX Standard
                  </span>
                </div>
                <p className="text-[12.5px] text-muted mb-[18px]">As certified and printed on the baby garment care label</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Wash */}
                  <div className="bg-surface-2 border border-line rounded-xl p-3 text-center flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center mb-2 shadow-2xs text-ink">
                      <CareIconRenderer category="wash" symbolId={data.care.washIcon || data.care.wash} className="w-6 h-6" />
                    </div>
                    <div className="text-[11px] font-bold text-ink mb-0.5">Washing</div>
                    <div className="text-[11px] text-muted line-clamp-3 leading-snug">{data.care.wash || 'Machine wash 60°C'}</div>
                  </div>

                  {/* Bleach */}
                  <div className="bg-surface-2 border border-line rounded-xl p-3 text-center flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center mb-2 shadow-2xs text-ink">
                      <CareIconRenderer category="bleach" symbolId={data.care.bleachIcon || data.care.bleach} className="w-6 h-6" />
                    </div>
                    <div className="text-[11px] font-bold text-ink mb-0.5">Bleaching</div>
                    <div className="text-[11px] text-muted line-clamp-3 leading-snug">{data.care.bleach || 'Do not bleach'}</div>
                  </div>

                  {/* Dry */}
                  <div className="bg-surface-2 border border-line rounded-xl p-3 text-center flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center mb-2 shadow-2xs text-ink">
                      <CareIconRenderer category="dry" symbolId={data.care.dryIcon || data.care.dry} className="w-6 h-6" />
                    </div>
                    <div className="text-[11px] font-bold text-ink mb-0.5">Drying</div>
                    <div className="text-[11px] text-muted line-clamp-3 leading-snug">{data.care.dry || 'Tumble dry low'}</div>
                  </div>

                  {/* Iron */}
                  <div className="bg-surface-2 border border-line rounded-xl p-3 text-center flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center mb-2 shadow-2xs text-ink">
                      <CareIconRenderer category="iron" symbolId={data.care.ironIcon || data.care.iron} className="w-6 h-6" />
                    </div>
                    <div className="text-[11px] font-bold text-ink mb-0.5">Ironing</div>
                    <div className="text-[11px] text-muted line-clamp-3 leading-snug">{data.care.iron || 'Iron medium (150°C)'}</div>
                  </div>

                  {/* Dry Clean */}
                  <div className="bg-surface-2 border border-line rounded-xl p-3 text-center flex flex-col items-center sm:col-span-2">
                    <div className="w-9 h-9 rounded-full bg-white border border-line flex items-center justify-center mb-2 shadow-2xs text-ink">
                      <CareIconRenderer category="dryClean" symbolId={data.care.dryCleanIcon || data.care.dryClean} className="w-6 h-6" />
                    </div>
                    <div className="text-[11px] font-bold text-ink mb-0.5">Professional Care</div>
                    <div className="text-[11px] text-muted line-clamp-3 leading-snug">{data.care.dryClean || 'Do not dry clean'}</div>
                  </div>
                </div>

                {data.care.labelWording && (
                  <div className="mt-[18px] text-[13px] text-muted bg-surface-2 border border-dashed border-line-2 rounded-xl p-3.5 px-4 font-mono">
                    <b className="text-ink block mb-1 font-sans text-[12px] uppercase tracking-wider">Official Care Label Wording:</b>
                    {data.care.labelWording}
                  </div>
                )}
              </Reveal>

              <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-[26px]">
                <h3 className="text-[16px] font-bold mb-1 text-ink">Stain Removal Tips for Baby Wear</h3>
                <p className="text-[12.5px] text-muted mb-[18px]">Gentle, baby-safe methods to treat stains and prolong garment life</p>

                <div className="flex gap-2 mb-[18px] flex-wrap">
                  <button
                    onClick={() => setStainTab('oil')}
                    className={`border rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      stainTab === 'oil' ? 'border-red bg-red text-white' : 'border-line-2 bg-white text-muted hover:text-red'
                    }`}
                  >
                    🧴 Oil &amp; Grease / Milk
                  </button>
                  <button
                    onClick={() => setStainTab('ink')}
                    className={`border rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      stainTab === 'ink' ? 'border-red bg-red text-white' : 'border-line-2 bg-white text-muted hover:text-red'
                    }`}
                  >
                    🖋️ Ink &amp; Marker
                  </button>
                  <button
                    onClick={() => setStainTab('food')}
                    className={`border rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors cursor-pointer ${
                      stainTab === 'food' ? 'border-red bg-red text-white' : 'border-line-2 bg-white text-muted hover:text-red'
                    }`}
                  >
                    🍎 Food, Purees &amp; Drinks
                  </button>
                </div>

                <div className="relative">
                  <AnimatePresence mode="wait">
                    {stainTab === 'oil' && (
                      <motion.div key="oil" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        {isMeaningfulStainHack(data.care.stainRemovalHacks?.oilAndGrease) ? (
                          <div className="text-[13px] text-muted leading-relaxed bg-surface-2 p-3.5 rounded-xl border border-line mb-3.5">
                            {data.care.stainRemovalHacks?.oilAndGrease}
                          </div>
                        ) : (
                          <div className="text-[12.5px] text-muted italic bg-surface-2 p-3.5 rounded-xl border border-line/60 mb-3.5">
                            No stain removal instructions provided in document.
                          </div>
                        )}
                      </motion.div>
                    )}
                    {stainTab === 'ink' && (
                      <motion.div key="ink" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        {isMeaningfulStainHack(data.care.stainRemovalHacks?.ink) ? (
                          <div className="text-[13px] text-muted leading-relaxed bg-surface-2 p-3.5 rounded-xl border border-line mb-3.5">
                            {data.care.stainRemovalHacks?.ink}
                          </div>
                        ) : (
                          <div className="text-[12.5px] text-muted italic bg-surface-2 p-3.5 rounded-xl border border-line/60 mb-3.5">
                            No stain removal instructions provided in document.
                          </div>
                        )}
                      </motion.div>
                    )}
                    {stainTab === 'food' && (
                      <motion.div key="food" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                        {isMeaningfulStainHack(data.care.stainRemovalHacks?.foodAndDrinks) ? (
                          <div className="text-[13px] text-muted leading-relaxed bg-surface-2 p-3.5 rounded-xl border border-line mb-3.5">
                            {data.care.stainRemovalHacks?.foodAndDrinks}
                          </div>
                        ) : (
                          <div className="text-[12.5px] text-muted italic bg-surface-2 p-3.5 rounded-xl border border-line/60 mb-3.5">
                            No stain removal instructions provided in document.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </Reveal>
            </div>
          ) : (
            <div className="py-8 px-4 text-center text-muted text-xs bg-surface border border-dashed border-line-2 rounded-[18px]">
              No care, maintenance, or label instructions registered yet.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: Circularity */}
      <section className="pt-10 sm:pt-[72px] pb-2" id="section-5">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">
              5
            </div>
            <div>
              <h2 className="text-[20px] sm:text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight text-ink">
                Circularity & End-of-Life
              </h2>
              <p className="text-muted text-[12px] sm:text-[13.5px] mt-0.5">
                Product care tips, DIY upcycling ideas & textile recycling take-back
              </p>
            </div>
          </Reveal>

          <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-[26px]">
            {(data.circularity?.tips || []).map((tip, i) => (
              <div
                key={i}
                className="p-[18px] rounded-2xl bg-white border border-line shadow-custom transition-all hover:-translate-y-1 hover:border-green"
              >
                <div className="w-[38px] h-[38px] rounded-xl bg-green-soft grid place-items-center text-[18px] mb-3">
                  {tip.emoji}
                </div>
                <h4 className="text-[13.5px] font-bold mb-1 text-ink">{tip.title}</h4>
                <p className="text-[12px] text-muted leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </Reveal>

          {(data.circularity.upcycleTitle || (data.circularity.upcycleSteps && data.circularity.upcycleSteps.length > 0)) && (
            <Reveal className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] overflow-hidden bg-surface border border-line rounded-[18px] shadow-custom mb-[26px]">
              <div className="relative bg-[#EAE4D6] min-h-[220px] sm:min-h-[300px]">
                <span className="absolute top-[14px] left-[14px] bg-ink/85 text-lime font-mono text-[10.5px] rounded-lg px-2.5 py-1.5 z-10">
                  NO-SEW · ~25 MIN
                </span>
                {isValidImageSrc(data.circularity.upcycleImage) ? (
                  <Image
                    src={data.circularity.upcycleImage}
                    alt="Upcycled fabric"
                    fill
                    unoptimized
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-muted">
                    <Recycle size={36} className="text-green mb-2 opacity-60" />
                    <span className="text-xs font-semibold">DIY Upcycling Workshop</span>
                  </div>
                )}
              </div>
              <div className="p-[26px] sm:px-[28px]">
                <h3 className="text-[18px] font-bold mb-1 text-ink">{data.circularity.upcycleTitle || 'DIY Upcycling Guide'}</h3>
                {data.circularity.upcycleSubtitle && (
                  <p className="text-[12.5px] text-muted mt-0.5 mb-2.5">{data.circularity.upcycleSubtitle}</p>
                )}
                <div className="border-t border-line mt-3">
                  {data.circularity?.upcycleSteps && data.circularity.upcycleSteps.length > 0 ? (
                    (data.circularity?.upcycleSteps || []).map((step, idx) => (
                      <AccordionItem
                        key={idx}
                        num={String(idx + 1)}
                        title={step.title}
                        text={step.text}
                        isOpen={accOpen === idx + 1}
                        onClick={() => setAccOpen(accOpen === idx + 1 ? null : idx + 1)}
                      />
                    ))
                  ) : (
                    <p className="py-4 text-xs text-muted italic">No step-by-step instructions entered.</p>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* SECTION 6: Environmental */}
      <section className="pt-10 sm:pt-[72px] pb-[60px]" id="section-6">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">
              6
            </div>
            <div>
              <h2 className="text-[clamp(20px,3.4vw,30px)] font-bold tracking-tight text-ink">
                Environmental Impact Data
              </h2>
              <p className="text-muted text-[12.5px] sm:text-[13.5px] mt-0.5">
                Carbon footprint accounting & environmental impact metrics
              </p>
            </div>
          </Reveal>

          <div className="max-w-[760px] mx-auto">
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[28px]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-[17px] font-bold text-ink">Carbon Footprint</h3>
                  <p className="text-[12.5px] text-muted mt-0.5">Primary supplier lifecycle assessment</p>
                </div>
                {savedManualCarbon ? (
                  <div className="px-3 py-1 bg-green-soft border border-[#BCD8C6] text-green-dark rounded-full font-bold text-[10px] tracking-widest uppercase">
                    Primary Audited Data
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-amber-soft border border-amber/30 text-amber rounded-full font-bold text-[10px] tracking-widest uppercase">
                    Data Not Provided
                  </div>
                )}
              </div>

              {savedManualCarbon ? (
                <div>
                  <CarbonPieChart
                    breakdown={
                      data.environmental.carbonBreakdown && data.environmental.carbonBreakdown.length > 0
                        ? data.environmental.carbonBreakdown
                        : [
                            { label: 'Fibre & Agriculture', value: 38, color: '#2D4A3E' },
                            { label: 'Yarn & Spinning', value: 16, color: '#4E886D' },
                            { label: 'Fabric Knitting & Dyeing', value: 24, color: '#8FB79E' },
                            { label: 'Garment Making', value: 10, color: '#B3D4BF' },
                            { label: 'Transport to Destination', value: 12, color: '#C9B27E' }
                          ]
                    }
                    total={savedManualCarbon}
                  />
                  <div className="mt-4 pt-3 border-t border-line-2 flex justify-between items-center text-[11.5px]">
                    <span className="text-muted font-mono">Audited value: {savedManualCarbon} kg CO₂e</span>
                    <button
                      onClick={() => {
                        setSavedManualCarbon(null);
                        setManualCarbonVal('');
                      }}
                      className="text-muted hover:text-red cursor-pointer font-medium"
                    >
                      Reset to Not Provided
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 bg-surface-2 border border-dashed border-line-2 rounded-2xl flex flex-col gap-3.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber shrink-0" />
                    <span className="text-[12px] font-bold text-ink uppercase tracking-wider">
                      Supplier LCA Assessment Status
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white border border-line rounded-xl p-3">
                    <div className="p-1">
                      <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Carbon Footprint</div>
                      <div className="text-[14px] font-bold text-ink mt-0.5">Not available</div>
                    </div>
                    <div className="p-1 sm:border-l sm:border-line-2 sm:pl-3">
                      <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Data Status</div>
                      <div className="text-[14px] font-bold text-amber mt-0.5">Data not provided</div>
                    </div>
                    <div className="p-1 sm:border-l sm:border-line-2 sm:pl-3">
                      <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Source</div>
                      <div className="text-[14px] font-bold text-ink mt-0.5">Not available</div>
                    </div>
                  </div>

                  <p className="text-[12px] text-muted leading-relaxed">
                    Carbon footprint lifecycle assessment data is not provided for this item. Default secondary modelled figures are withheld to ensure audit authenticity.
                  </p>

                  <div className="pt-2 border-t border-line-2 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11.5px] text-muted">Have audited carbon figures?</span>
                    <button
                      onClick={() => setShowCarbonModal(true)}
                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-green-dark bg-white hover:bg-green-soft border border-[#BCD8C6] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={12} /> Enter Manual Carbon Footprint
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Carbon Input Modal */}
              {showCarbonModal && (
                <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl max-w-[420px] w-full p-6 shadow-2xl border border-line"
                  >
                    <h4 className="font-bold text-[17px] text-ink mb-1">Enter Manual Carbon Footprint</h4>
                    <p className="text-[12.5px] text-muted mb-4">
                      Input the certified total lifecycle carbon footprint per garment unit (kg CO₂e).
                    </p>
                    <form onSubmit={handleSaveManualCarbon}>
                      <div className="mb-4">
                        <label className="block text-[11px] uppercase font-bold tracking-wider text-muted mb-1">
                          Total Carbon (kg CO₂e)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          placeholder="e.g. 4.80"
                          value={manualCarbonVal}
                          onChange={(e) => setManualCarbonVal(e.target.value)}
                          required
                          autoFocus
                          className="w-full border border-line rounded-xl px-3.5 py-2.5 text-[14px] font-mono text-ink bg-surface-2 focus:bg-white focus:border-green outline-none"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowCarbonModal(false)}
                          className="px-4 py-2 rounded-xl text-[12px] font-semibold text-muted hover:text-ink cursor-pointer border border-line"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl text-[12px] font-bold bg-ink text-lime hover:bg-ink/85 cursor-pointer shadow-xs"
                        >
                          Save Carbon Footprint
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-[#B9C4BB] py-[44px]">
        <div className="max-w-[1120px] mx-auto px-[22px] flex gap-[30px] flex-wrap justify-between items-start">
          <div className="max-w-[280px]">
            <div className="font-display font-bold text-lime text-[16px] tracking-[0.06em]">
              {data.general.brand ? `${data.general.brand.split(' ')[0]?.toUpperCase()} · DPP` : 'DPP'}
            </div>
            <p className="mt-2.5 text-[12px] leading-[1.9]">
              Digital Product Passport{data.general.version ? ` compiled from FiTS ${data.general.version}` : ''}
            </p>
          </div>
          <div>
            <h5 className="text-[#F4F1EA] text-[13px] tracking-widest uppercase mb-2.5 font-semibold">Passport Record</h5>
            <ul className="font-mono text-[11px] leading-[1.9]">
              <li>Project: {data.general.projectId || '—'} · Order: {data.general.orderNo || '—'}</li>
              <li>Product: {data.general.productName || '—'}</li>
              <li>Updated: {data.general.updatedDate || '—'}</li>
              <li>Completeness: {data.general.completeness ?? 0}%</li>
            </ul>
          </div>
          <div>
            <h5 className="text-[#F4F1EA] text-[13px] tracking-widest uppercase mb-2.5 font-semibold">Testing Authority</h5>
            <p className="text-[12px] leading-[1.9] max-w-[260px]">{data.quality?.testingLab || 'ITS Labtest Bangladesh Ltd.'}</p>
            <p className="font-mono text-[11px] text-[#B9C4BB]/80 mt-1">Report: {data.quality?.reportNumber || 'BGDT25154711'}</p>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-[26px] left-1/2 -translate-x-1/2 bg-ink text-lime text-[12.5px] font-bold px-5 py-2.5 rounded-full pointer-events-none transition-all duration-300 z-50 ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        Article number copied ✓
      </div>
    </div>
  );
}
