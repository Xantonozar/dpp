'use client';

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { CheckCircle2, Download, Share, ShieldCheck, AlertCircle, User, Droplets, Zap, Trash2, Box, Wind, Sun, Recycle, Leaf } from 'lucide-react';

type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL';
type Unit = 'cm' | 'in';
type Garment = 'top' | 'bottom';
type StyleType = 'uni' | 'aop';

const EU: Record<Size, string> = {S:'44/46',M:'48/50',L:'52/54',XL:'56/58',XXL:'60/62'};
const ART: Record<StyleType, Record<Size, string>> = {
  uni:{S:'730801',M:'730798',L:'730802',XL:'730799',XXL:'730800'},
  aop:{S:'730793',M:'730794',L:'730796',XL:'730797',XXL:'730795'}
};
const FIT = {
  top: <>Relaxed loungewear block: <b>short-sleeve V-neck</b> with self-fabric piping, necktape chain-stitched at back, shoulder seam moved ~2 cm forward. Allowed dimensional change after wash: <b>±4%</b>.</>,
  bottom: <>Straight-leg shorts with <b>set-on waistband</b> (drawstring + elastic inside), side pockets and fake fly. Waistband stretches from 48/50 39 cm relaxed to 50 cm. Allowed change after wash: <b>±4%</b>.</>
};

const TOP_MEASUREMENTS = [
  {k:'A',name:'1/2 Chest',how:'2 cm below armhole · tol ±1',vals:{S:50,M:54,L:58,XL:62,XXL:66},g:'g-t-chest'},
  {k:'B',name:'Back Length',how:'from HSP · tol ±1',vals:{S:73,M:75,L:77,XL:79,XXL:81},g:'g-t-len'},
  {k:'C',name:'Sleeve',how:'along sleeve fold · tol ±1',vals:{S:21,M:22,L:23,XL:24,XXL:25},g:'g-t-sleeve'},
  {k:'D',name:'Shoulder',how:'outer points straight · tol ±1',vals:{S:46,M:48,L:50,XL:52,XXL:54},g:null},
  {k:'E',name:'Armhole',how:'straight at right angle · tol ±10.5',vals:{S:23,M:24,L:25,XL:26,XXL:27},g:null}
];
const BOTTOM_MEASUREMENTS = [
  {k:'A',name:'1/2 Waistband',how:'straight along edge · tol ±1',vals:{S:36,M:39,L:42,XL:45,XXL:48},g:'g-b-waist'},
  {k:'B',name:'1/2 Hip',how:'at hip height · tol ±1',vals:{S:51,M:54,L:57,XL:60,XXL:63},g:'g-b-hip'},
  {k:'C',name:'Inseam',how:'along inseam · tol ±1',vals:{S:14,M:15,L:16,XL:17,XXL:18},g:'g-b-inseam'},
  {k:'D',name:'Front Rise',how:'incl. waistband · tol ±1',vals:{S:29,M:30,L:31,XL:32,XXL:33},g:null},
  {k:'E',name:'Leg Opening',how:'along edge · tol ±10.5',vals:{S:29,M:31,L:33,XL:35,XXL:37},g:null}
];

function QRCode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    function hashSeed(s: string) {
      let h = 1779033703;
      for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
      }
      return h >>> 0;
    }
    function mulberry(a: number) {
      return function() {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const N = 23, m = cv.width / N;
    const rnd = mulberry(hashSeed('151546-4300085070'));
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#17201B';
    
    function finder(fx: number, fy: number) {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const e = (x === 0 || x === 6 || y === 0 || y === 6);
          const c = (x > 1 && x < 5 && y > 1 && y < 5);
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
    finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  }, []);

  return <canvas ref={canvasRef} width={92} height={92} className="rounded-lg border border-line bg-white" />;
}

function Reveal({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CircularComposition({ cotton, modal, elastane }: { cotton: number, modal: number, elastane: number }) {
  const data = [
    { label: 'Cotton', value: cotton, color: 'var(--color-green)' },
    { label: 'Modal', value: modal, color: '#8FB79E' },
    { label: 'Elastane', value: elastane, color: '#C9B27E' },
  ];

  let cumulativeValue = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-3">
      <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F8F3" strokeWidth="12" />
          {data.map((item, i) => {
            const strokeDasharray = 2 * Math.PI * 40;
            const strokeDashoffset = strokeDasharray - (item.value / 100) * strokeDasharray;
            const rotation = (cumulativeValue / 100) * 360;
            cumulativeValue += item.value;

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
                transition={{ duration: 1.5, delay: 0.2 + i * 0.1, ease: "circOut" }}
                strokeLinecap="round"
                style={{ transformOrigin: '50% 50%', transform: `rotate(${rotation}deg)` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] uppercase tracking-widest text-muted font-bold">Total</span>
          <span className="text-[20px] sm:text-[24px] font-display font-bold text-ink">100%</span>
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
            <span className="font-mono text-[13px] font-bold text-green-dark bg-green-soft px-2 py-0.5 rounded-lg">{item.value}%</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CarbonPieChart() {
  const data = [
    { label: 'Raw Materials', value: 35, color: 'var(--color-green)' },
    { label: 'Manufacturing', value: 40, color: '#5FA47F' },
    { label: 'Transport', value: 10, color: '#D4AF37' },
    { label: 'Use Phase', value: 10, color: '#B54747' },
    { label: 'End of Life', value: 5, color: '#718078' },
  ];

  let cumulativeValue = 0;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 py-4">
      <div className="relative w-[180px] h-[180px] lg:w-[220px] lg:h-[220px] shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F1F8F3" strokeWidth="20" />
          {data.map((item, i) => {
            const strokeDasharray = 2 * Math.PI * 40;
            const strokeDashoffset = strokeDasharray - (item.value / 100) * strokeDasharray;
            const rotation = (cumulativeValue / 100) * 360;
            cumulativeValue += item.value;

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
                transition={{ duration: 1.5, delay: 0.2 + i * 0.1, ease: "circOut" }}
                style={{ transformOrigin: '50% 50%', transform: `rotate(${rotation}deg)` }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] uppercase tracking-widest text-muted font-bold">Total CO₂e</span>
          <span className="text-[24px] lg:text-[28px] font-display font-bold text-ink">4.8kg</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 w-full">
        {data.map((item, i) => (
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

function ResourceBarChart() {
  const data = [
    { label: 'Water Usage', value: 420, max: 1500, unit: 'L', icon: Droplets, color: 'var(--color-green)', sub: 'vs 1,500L standard' },
    { label: 'Renewable Energy', value: 65, max: 100, unit: '%', icon: Zap, color: '#D4AF37', sub: 'Target: 80% by 2026' },
    { label: 'Recycled Content', value: 95, max: 100, unit: '%', icon: Recycle, color: '#5FA47F', sub: 'Post-consumer waste' },
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
              <span className="font-display font-bold text-[22px] text-ink">{item.value}<small className="text-[13px] ml-0.5">{item.unit}</small></span>
            </div>
          </div>
          
          <div className="relative h-2.5 bg-muted/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${(item.value / item.max) * 100}%` }}
              transition={{ duration: 1.5, delay: 0.3, ease: "circOut" }}
              className="h-full rounded-full shadow-sm"
              style={{ backgroundColor: item.color }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}


function RevealGroup({ children, className = '' }: { children: React.ReactNode, className?: string }) {
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

function RevealItem({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PulseMarker({ top, left }: { top: string, left: string }) {
  return (
    <div 
      className="absolute w-3 h-3 bg-green rounded-full z-10" 
      style={{ top, left }}
    >
      <motion.div 
        animate={{ 
          scale: [1, 2.5],
          opacity: [0.7, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeOut"
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
      
      {/* Route Markers based on the dummy journey */}
      <PulseMarker top="45%" left="75%" /> {/* Bangladesh / India region */}
      <PulseMarker top="38%" left="52%" /> {/* Turkey region */}
      <PulseMarker top="42%" left="44%" /> {/* Portugal region */}
      <PulseMarker top="35%" left="41%" /> {/* Germany/Hamburg region */}
      
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-5 bg-white/90 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-line shadow-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green rounded-full pulse-marker-simple" />
          <span className="text-[9px] sm:text-[11px] font-bold text-ink uppercase tracking-wider">Live Route</span>
        </div>
      </div>
    </div>
  );
}

function TraceBar() {
  const [pct, setPct] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  
  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / 1400, 1);
        setPct(Math.round(87 * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [isInView]);

  return (
    <div ref={ref} className="bg-surface border border-line rounded-[18px] shadow-custom p-[22px] sm:px-[26px] mb-[30px] flex gap-[26px] items-center flex-wrap">
      <div className="font-display font-bold text-[40px] text-green leading-none">
        {pct}<small className="text-[18px] text-muted">%</small>
      </div>
      <div className="flex-1 min-w-[220px]">
        <div className="h-2.5 bg-[#EAE6DA] rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={isInView ? { width: '87%' } : { width: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full bg-gradient-to-r from-green to-[#5FA47F] rounded-full"
          />
        </div>
        <div className="text-[12px] text-muted mt-2">
          Traceability completeness — 13 of 15 data points verified · <span className="text-amber font-semibold">2 pending (farm-level cotton origin, elastane polymer origin)</span>
        </div>
      </div>
    </div>
  );
}

function LabCard({ std, title, val, subVal, desc, hint }: any) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="p-5 cursor-pointer transition-transform duration-300 text-left border border-line rounded-[16px] bg-white shadow-custom hover:-translate-y-1">
      <div className="flex justify-between items-center mb-2.5 gap-2">
        <span className="font-mono text-[10px] text-muted">{std}</span>
        <span className="text-[10.5px] font-bold tracking-widest bg-green-soft text-green-dark border border-[#BCD8C6] rounded-full px-2.5 py-[3px] whitespace-nowrap">PASS</span>
      </div>
      <h4 className="text-[13px] font-bold mb-1.5">{title}</h4>
      <div className="font-display font-bold text-[23px] tracking-tight">
        {val} <small className="text-[12px] text-muted font-medium">{subVal}</small>
      </div>
      <motion.div 
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0, marginTop: open ? 10 : 0 }}
        className="overflow-hidden text-[12px] text-muted"
      >
        <div className="border-t border-dashed border-line-2 pt-2.5">
          {desc}
        </div>
      </motion.div>
      <div className="text-[10.5px] text-line-2 mt-2">{hint}</div>
    </button>
  );
}

function AccordionItem({ num, title, text, isOpen, onClick }: any) {
  return (
    <div className="border-b border-line last:border-b-0">
      <button onClick={onClick} className="w-full flex items-center gap-3.5 bg-transparent border-none py-[13px] px-1 text-left cursor-pointer">
        <span className={`w-7 h-7 shrink-0 rounded-full font-mono text-[12px] flex items-center justify-center font-medium transition-colors duration-250 ${isOpen ? 'bg-green text-white' : 'bg-green-soft text-green-dark'}`}>
          {num}
        </span>
        <span className="font-semibold text-[13.5px] flex-1">{title}</span>
        <span className={`transition-transform duration-300 text-muted ${isOpen ? 'rotate-180' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>
      <motion.div 
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="text-[12.5px] text-muted px-1 pb-3.5 pl-[46px]">{text}</p>
      </motion.div>
    </div>
  )
}

export default function Page() {
  const [curSize, setCurSize] = useState<Size>('M');
  const [curUnit, setCurUnit] = useState<Unit>('cm');
  const [curGar, setCurGar] = useState<Garment>('top');
  const [curStyle, setCurStyle] = useState<StyleType>('uni');
  const [curView, setCurView] = useState('cw1');
  
  const [hoveredGar, setHoveredGar] = useState<string | null>(null);
  const [stainTab, setStainTab] = useState('oil');
  const [accOpen, setAccOpen] = useState<number | null>(1);
  const [toast, setToast] = useState(false);
  const [locResult, setLocResult] = useState<string | null>(null);

  const fmt = (v: number) => curUnit === 'cm' ? v.toFixed(1) + ' cm' : (v / 2.54).toFixed(1) + ' in';

  const handleCopy = () => {
    const artNo = ART[curStyle][curSize];
    if (navigator.clipboard) navigator.clipboard.writeText(artNo);
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

  const handleLocSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input') as HTMLInputElement;
    const q = input.value.trim();
    if (!q) return;
    
    // Hash function for random centers
    let h = 1779033703;
    for(let i=0;i<q.length;i++) {h = Math.imul(h ^ q.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19;}
    const idx = (h >>> 0) % 3;
    
    const CENTERS = [
      {n:'GreenLoop Textile Hub',a:'14 Circular Ave',d:'1.2 km'},
      {n:'City ReWear Collection Point',a:'88 Second Chance Rd',d:'2.7 km'},
      {n:'FiberCycle Depot (Municipal)',a:'3 Loop Lane, North Yard',d:'4.1 km'}
    ];
    const c = CENTERS[idx];
    setLocResult(`Nearest collector for <b>${q.replace(/</g,'&lt;')}</b>:<br><b>${c.n}</b> — ${c.a} · ${c.d} away<br><span class="font-mono text-[11.5px] text-muted">open Mon–Sat 08:00–18:00 · accepts bagged, dry textiles incl. stretch blends</span>`);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#F4F1EA]/85 backdrop-blur-md border-b border-line">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px] py-2 sm:py-3 flex items-center justify-between">
          <a href="#section-a" className="flex items-center gap-2 no-underline font-display font-bold tracking-[0.06em] text-[13px] sm:text-[14px] shrink-0">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green shadow-[0_0_0_4px_var(--color-green-soft)]"></span>
            TCHIBO <em className="not-italic text-green text-[10px] border border-green rounded-full px-1.5 py-0 tracking-[0.12em]">DPP</em>
          </a>
          <div className="flex gap-0.5 overflow-x-auto no-scrollbar mask-fade-right mx-4 sm:mx-0">
            <a href="#section-a" className="text-[11.5px] sm:text-[12.5px] font-semibold text-muted px-2.5 py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white active:bg-ink active:text-[#F4F1EA]">A · Overview</a>
            <a href="#section-b" className="text-[11.5px] sm:text-[12.5px] font-semibold text-muted px-2.5 py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">B · Traceability</a>
            <a href="#section-c" className="text-[11.5px] sm:text-[12.5px] font-semibold text-muted px-2.5 py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">C · Quality</a>
            <a href="#section-d" className="text-[11.5px] sm:text-[12.5px] font-semibold text-muted px-2.5 py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">D · Care</a>
            <a href="#section-e" className="text-[11.5px] sm:text-[12.5px] font-semibold text-muted px-2.5 py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">E · Circularity</a>
            <a href="#section-f" className="text-[11.5px] sm:text-[12.5px] font-semibold text-muted px-2.5 py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">F · Impact</a>
            <a href="#section-g" className="text-[11.5px] sm:text-[12.5px] font-semibold text-muted px-2.5 py-[6px] rounded-full whitespace-nowrap transition-colors hover:text-ink hover:bg-white">G · Data</a>
          </div>
          <div className="hidden lg:flex items-center gap-4 ml-auto">
            <select className="bg-transparent border border-line-2 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-muted outline-none cursor-pointer">
              <option>Consumer View</option>
              <option>Supply Chain</option>
              <option>Recycler</option>
              <option>Authority</option>
            </select>
            <button className="flex items-center gap-1.5 text-[11.5px] font-semibold text-muted hover:text-ink transition-colors cursor-pointer">
              <Share size={14} /> Share
            </button>
            <button className="flex items-center gap-1.5 text-[11.5px] font-semibold text-muted hover:text-ink transition-colors cursor-pointer">
              <Download size={14} /> JSON
            </button>
          </div>
          <button className="lg:hidden p-1.5 text-muted hover:text-ink transition-colors">
            <Share size={18} />
          </button>
        </div>
      </nav>

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
              <p className="text-[12px] sm:text-[13px] text-[#B9D3C1] mt-0.5">Project ID: 151546 · v2.4</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <span className="text-[10px] sm:text-[11.5px] font-mono bg-ink/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[#B9D3C1] whitespace-nowrap">Updated: 30 Oct 2025</span>
            <span className="text-[10px] sm:text-[11.5px] font-mono bg-ink/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-lime whitespace-nowrap">Completeness: 94%</span>
          </div>
        </Reveal>
      </section>

      <section className="pt-6 sm:pt-12 pb-4 sm:pb-6" id="section-a">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-3.5 sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-[42px] h-[42px] sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">A</div>
            <div>
              <h2 className="text-[18px] sm:text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight">Product Overview</h2>
              <p className="text-muted text-[12px] sm:text-[13.5px] mt-0.5">Identity, AI visuals & fit data</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4 sm:gap-[26px] items-stretch">
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[34px] sm:pb-[30px] flex flex-col">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] sm:text-[11.5px] text-green-dark bg-green-soft border border-[#BCD8C6] rounded-full px-2.5 py-1 sm:py-1.5 mb-3.5">
                  <span className="w-[5px] h-[5px] rounded-full bg-green animate-pulse-ring"></span>
                  DPP · PROJECT 151546
                </div>
              </div>
              <h1 className="font-display text-[24px] sm:text-[clamp(28px,4.2vw,42px)] font-bold tracking-tight leading-[1.1] sm:leading-[1.06]">Men&apos;s Shorty Pyjamas, Modal</h1>
              <p className="text-muted my-1.5 mb-4 sm:mb-[22px] text-[13px] sm:text-[14.5px]">Single jersey 160 g/m² · Sizes S–XXL</p>
              
              <div className="border border-dashed border-line-2 rounded-[14px] p-3.5 sm:p-4 sm:px-[18px] grid gap-2.5 bg-surface-2">
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]"><span className="text-muted font-semibold text-[10px] tracking-widest uppercase">Brand</span><span className="font-mono text-[12px] sm:text-[12.5px] font-medium text-right">Tchibo GmbH</span></div>
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]"><span className="text-muted font-semibold text-[10px] tracking-widest uppercase">Article No.</span>
                  <span className="flex gap-2 items-center"><span className="font-mono text-[12px] sm:text-[12.5px] font-medium text-right">{ART[curStyle][curSize]}</span><button onClick={handleCopy} className="border border-line-2 bg-white rounded-lg px-2 py-0.5 sm:px-[9px] sm:py-[3px] text-[10px] font-semibold text-muted transition-colors hover:text-green-dark hover:border-green cursor-pointer">Copy</button></span>
                </div>
                <div className="flex justify-between items-center gap-3 text-[12.5px] sm:text-[13px]"><span className="text-muted font-semibold text-[10px] tracking-widest uppercase">Season</span><span className="font-mono text-[12px] sm:text-[12.5px] font-medium text-right">AW 2025</span></div>
                <div className="mt-3 pt-3 border-t border-line-2">
                  <p className="text-[11.5px] leading-relaxed text-muted"><b className="text-ink">Design:</b> V-neck top with piping; shorts with drawstring, pockets & fake fly.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 sm:mt-[18px]">
                <div className="bg-surface-2 border border-line rounded-xl p-2.5 sm:p-3 text-center sm:text-left">
                  <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Weight</div>
                  <div className="text-[13px] sm:text-[14px] font-bold">160 g/m²</div>
                </div>
                <div className="bg-surface-2 border border-line rounded-xl p-2.5 sm:p-3 text-center sm:text-left">
                  <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Origin</div>
                  <div className="text-[13px] sm:text-[14px] font-bold">Bangladesh</div>
                </div>
                <div className="bg-surface-2 border border-line rounded-xl p-2.5 sm:p-3 text-center sm:text-left">
                  <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Lifetime</div>
                  <div className="text-[13px] sm:text-[14px] font-bold">3+ Years</div>
                </div>
                <div className="bg-surface-2 border border-line rounded-xl p-2.5 sm:p-3 text-center sm:text-left">
                  <div className="text-[9px] font-semibold text-muted uppercase tracking-widest mb-1">Impact</div>
                  <div className="text-[13px] sm:text-[14px] font-bold text-green-dark">4.8 kg CO₂e</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-[18px]">
                <span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full border border-line-2 bg-white text-muted"><b className="text-green-dark">CmiA</b> Cotton (SCOT)</span>
                <span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full border border-line-2 bg-white text-muted"><b className="text-green-dark">Birla</b> Modal</span>
                <span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full border border-line-2 bg-white text-muted"><b className="text-green-dark">creora®</b> Elastane</span>
                <span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full border border-line-2 bg-white text-muted">RSL Cat 1 <b className="text-green-dark">v1/2024</b></span>
                <span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full border border-line-2 bg-white text-muted"><b className="text-green-dark">REACh</b> confirmed</span>
                <span className="text-[11.5px] font-semibold px-3 py-1.5 rounded-full border border-line-2 bg-white text-muted">Label: <b className="text-green-dark">DE, EN, FR, NL</b></span>
              </div>

              <div className="mt-auto pt-[22px] flex items-center gap-[14px]">
                <QRCode />
                <div className="text-[11.5px] text-muted leading-relaxed"><b className="text-ink block">Scan to verify passport record</b>Lab (6825)298-0551 · Bureau Veritas BD<br/>FiTS v4 · Last updated 30 Oct 2025</div>
              </div>
            </Reveal>

            <Reveal className="overflow-hidden flex flex-col bg-surface border border-line rounded-[18px] shadow-custom">
              <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-line gap-2.5 flex-wrap">
                <span className="text-[12px] font-bold tracking-widest uppercase text-green-dark flex gap-2 items-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/></svg>AI Model Visualization
                </span>
                <div className="flex bg-surface-2 border border-line rounded-full p-[3px]">
                  <button onClick={() => setCurView('cw1')} className={`relative border-none bg-transparent rounded-full px-[13px] py-1.5 text-[12px] font-semibold transition-colors cursor-pointer ${curView === 'cw1' ? 'text-[#F4F1EA]' : 'text-muted hover:text-ink'}`}>
                    {curView === 'cw1' && <motion.div layoutId="cwToggle" className="absolute inset-0 bg-ink rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">CW 01 · Jadeite</span>
                  </button>
                  <button onClick={() => setCurView('cw2')} className={`relative border-none bg-transparent rounded-full px-[13px] py-1.5 text-[12px] font-semibold transition-colors cursor-pointer ${curView === 'cw2' ? 'text-[#F4F1EA]' : 'text-muted hover:text-ink'}`}>
                    {curView === 'cw2' && <motion.div layoutId="cwToggle" className="absolute inset-0 bg-ink rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">CW 02 · Dark Green AOP</span>
                  </button>
                </div>
              </div>
              <div className="relative aspect-square bg-[#EAE4D6] overflow-hidden">
                <Image src="https://image.qwenlm.ai/public_source/664e8b35-e47f-4aa4-bc0f-a8f86843d2cf/17e958788-08d4-403f-bf77-8f3c19bb0af5.png" alt="AI render colourway 01 jadeite pyjama set" fill className={`object-cover transition-opacity duration-500 ${curView === 'cw1' ? 'opacity-100' : 'opacity-0'}`} />
                <Image src="https://image.qwenlm.ai/public_source/664e8b35-e47f-4aa4-bc0f-a8f86843d2cf/140b0a39b-fd34-414d-809d-bf230e553a0f.png" alt="AI render colourway 02 dark green AOP pyjama set" fill className={`object-cover transition-opacity duration-500 ${curView === 'cw2' ? 'opacity-100' : 'opacity-0'}`} />
                <span className="absolute left-[14px] bottom-[14px] bg-ink/80 text-[#F4F1EA] font-mono text-[10.5px] px-2.5 py-1.5 rounded-lg backdrop-blur-sm">rendered from FiTS 151546 · design sketch rev 4</span>
              </div>
              <div className="p-[18px] py-[14px] grid gap-1.5 font-mono text-[11px] text-muted">
                <span>model: <b className="text-green-dark font-medium">Stable Diffusion XL + Vizcom refine</b> · seed <b className="text-green-dark font-medium">151546</b></span>
                <span>prompt: <b className="text-green-dark font-medium">&quot;men&apos;s modal shorty pyjamas, V-neck, drawstring shorts, jadeite / dark green AOP, ghost mannequin&quot;</b></span>
                <span>colours locked to: <b className="text-green-dark font-medium">Pantone 16-5304 TCX · COLORO 097-36-06 · AOP base 085-52-07</b></span>
              </div>
            </Reveal>
          </div>

          <Reveal className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] overflow-hidden bg-surface border border-line rounded-[18px] shadow-custom mt-[26px]">
            <div className="lg:border-r border-b lg:border-b-0 border-line p-[26px] bg-surface-2 flex flex-col gap-3.5">
              <div className="flex justify-between items-center gap-2.5 flex-wrap">
                <h3 className="text-[15px] font-bold">Measurement Map</h3>
                <div className="flex gap-2">
                  <div className="flex bg-white border border-line rounded-full p-[3px]">
                    <button onClick={() => setCurGar('top')} className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${curGar === 'top' ? 'text-white' : 'text-muted hover:text-ink'}`}>
                      {curGar === 'top' && <motion.div layoutId="garToggle" className="absolute inset-0 bg-green rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      <span className="relative z-10">Top</span>
                    </button>
                    <button onClick={() => setCurGar('bottom')} className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${curGar === 'bottom' ? 'text-white' : 'text-muted hover:text-ink'}`}>
                      {curGar === 'bottom' && <motion.div layoutId="garToggle" className="absolute inset-0 bg-green rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      <span className="relative z-10">Bottom</span>
                    </button>
                  </div>
                  <div className="flex bg-white border border-line rounded-full p-[3px]">
                    <button onClick={() => setCurUnit('cm')} className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${curUnit === 'cm' ? 'text-white' : 'text-muted hover:text-ink'}`}>
                      {curUnit === 'cm' && <motion.div layoutId="unitToggle" className="absolute inset-0 bg-green rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      <span className="relative z-10">cm</span>
                    </button>
                    <button onClick={() => setCurUnit('in')} className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${curUnit === 'in' ? 'text-white' : 'text-muted hover:text-ink'}`}>
                      {curUnit === 'in' && <motion.div layoutId="unitToggle" className="absolute inset-0 bg-green rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      <span className="relative z-10">in</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-line rounded-[14px] p-[14px]">
                {curGar === 'top' ? (
                  <svg className="w-full h-auto" viewBox="0 0 220 240" aria-label="Top measurement diagram">
                    <path className="fill-green-soft stroke-green stroke-2" d="M70 30 L96 24 L110 48 L124 24 L150 30 L186 82 L158 100 L148 86 L148 208 L72 208 L72 86 L62 100 L34 82 Z"/>
                    <path className="fill-none stroke-green stroke-2" d="M96 24 L110 48 L124 24"/>
                    
                    <g className={`transition-all duration-250 ${hoveredGar === 'g-t-chest' ? 'stroke-green' : ''}`}>
                      <line className={`fill-none transition-colors duration-250 ${hoveredGar === 'g-t-chest' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px] stroke-[5_4]'}`} x1="72" y1="120" x2="148" y2="120"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-t-chest' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="72" y1="114" x2="72" y2="126"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-t-chest' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="148" y1="114" x2="148" y2="126"/>
                      <text className={`font-mono text-[10px] transition-colors duration-250 ${hoveredGar === 'g-t-chest' ? 'fill-green-dark font-medium' : 'fill-muted'}`} x="98" y="114">A · CHEST</text>
                    </g>
                    <g className={`transition-all duration-250 ${hoveredGar === 'g-t-len' ? 'stroke-green' : ''}`}>
                      <line className={`fill-none transition-colors duration-250 ${hoveredGar === 'g-t-len' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px] stroke-[5_4]'}`} x1="198" y1="30" x2="198" y2="208"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-t-len' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="192" y1="30" x2="204" y2="30"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-t-len' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="192" y1="208" x2="204" y2="208"/>
                      <text className={`font-mono text-[10px] transition-colors duration-250 ${hoveredGar === 'g-t-len' ? 'fill-green-dark font-medium' : 'fill-muted'}`} x="186" y="224">B · LENGTH</text>
                    </g>
                    <g className={`transition-all duration-250 ${hoveredGar === 'g-t-sleeve' ? 'stroke-green' : ''}`}>
                      <line className={`fill-none transition-colors duration-250 ${hoveredGar === 'g-t-sleeve' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px] stroke-[5_4]'}`} x1="68" y1="38" x2="46" y2="88"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-t-sleeve' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="63" y1="34" x2="73" y2="42"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-t-sleeve' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="41" y1="84" x2="51" y2="92"/>
                      <text className={`font-mono text-[10px] transition-colors duration-250 ${hoveredGar === 'g-t-sleeve' ? 'fill-green-dark font-medium' : 'fill-muted'}`} x="12" y="112">C · SLEEVE</text>
                    </g>
                  </svg>
                ) : (
                  <svg className="w-full h-auto" viewBox="0 0 220 240" aria-label="Bottom measurement diagram">
                    <rect className="fill-green-soft stroke-green stroke-2" x="62" y="44" width="96" height="14"/>
                    <path className="fill-green-soft stroke-green stroke-2" d="M62 58 L158 58 L166 96 L172 158 L126 158 L113 112 L107 112 L94 158 L48 158 L54 96 Z"/>
                    <path className="fill-none stroke-green stroke-2" d="M108 58 L104 76 M112 58 L116 76"/>
                    
                    <g className={`transition-all duration-250 ${hoveredGar === 'g-b-waist' ? 'stroke-green' : ''}`}>
                      <line className={`fill-none transition-colors duration-250 ${hoveredGar === 'g-b-waist' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px] stroke-[5_4]'}`} x1="62" y1="51" x2="158" y2="51"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-b-waist' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="62" y1="45" x2="62" y2="57"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-b-waist' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="158" y1="45" x2="158" y2="57"/>
                      <text className={`font-mono text-[10px] transition-colors duration-250 ${hoveredGar === 'g-b-waist' ? 'fill-green-dark font-medium' : 'fill-muted'}`} x="86" y="38">A · WAISTBAND</text>
                    </g>
                    <g className={`transition-all duration-250 ${hoveredGar === 'g-b-hip' ? 'stroke-green' : ''}`}>
                      <line className={`fill-none transition-colors duration-250 ${hoveredGar === 'g-b-hip' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px] stroke-[5_4]'}`} x1="54" y1="96" x2="166" y2="96"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-b-hip' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="54" y1="90" x2="54" y2="102"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-b-hip' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="166" y1="90" x2="166" y2="102"/>
                      <text className={`font-mono text-[10px] transition-colors duration-250 ${hoveredGar === 'g-b-hip' ? 'fill-green-dark font-medium' : 'fill-muted'}`} x="98" y="90">B · HIP</text>
                    </g>
                    <g className={`transition-all duration-250 ${hoveredGar === 'g-b-inseam' ? 'stroke-green' : ''}`}>
                      <line className={`fill-none transition-colors duration-250 ${hoveredGar === 'g-b-inseam' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px] stroke-[5_4]'}`} x1="107" y1="112" x2="94" y2="158"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-b-inseam' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="102" y1="108" x2="112" y2="116"/>
                      <line className={`transition-colors duration-250 ${hoveredGar === 'g-b-inseam' ? 'stroke-green stroke-[2.6px]' : 'stroke-[#9AA79D] stroke-[1.6px]'}`} x1="89" y1="154" x2="99" y2="162"/>
                      <text className={`font-mono text-[10px] transition-colors duration-250 ${hoveredGar === 'g-b-inseam' ? 'fill-green-dark font-medium' : 'fill-muted'}`} x="52" y="180">C · INSEAM</text>
                    </g>
                  </svg>
                )}
              </div>
              <div className="text-[11.5px] text-muted flex gap-3.5 flex-wrap">
                {curGar === 'top' ? (
                  <><span><i className="font-mono not-italic">A</i> ½ chest, 2 cm below armhole</span><span><i className="font-mono not-italic">B</i> back length from HSP</span><span><i className="font-mono not-italic">C</i> sleeve along fold</span></>
                ) : (
                  <><span><i className="font-mono not-italic">A</i> ½ waistband straight</span><span><i className="font-mono not-italic">B</i> ½ hip at hip height</span><span><i className="font-mono not-italic">C</i> inseam length</span></>
                )}
              </div>
            </div>

            <div className="p-[26px]">
              <div className="flex justify-between items-center gap-2.5 flex-wrap mb-3">
                <h3 className="text-[15px] font-bold">Interactive Size Chart</h3>
                <span className="font-mono text-[11px] text-muted">SIZE {curSize} · EU {EU[curSize]}</span>
              </div>
              <div className="flex gap-2 flex-wrap mb-1.5">
                {(['S','M','L','XL','XXL'] as Size[]).map(s => (
                  <button key={s} onClick={() => setCurSize(s)} className={`relative min-w-[46px] h-10 rounded-xl border font-semibold text-[13px] transition-colors cursor-pointer ${curSize === s ? 'border-ink text-lime' : 'bg-white border-line-2 text-muted hover:border-ink hover:text-ink'}`}>
                    {curSize === s && <motion.div layoutId="sizeToggle" className="absolute inset-0 bg-ink rounded-xl z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">{s}</span>
                  </button>
                ))}
              </div>
              <div className="text-[11.5px] text-muted mb-3.5">
                EU mapping: 44/46 S · 48/50 M · 52/54 L · 56/58 XL · 60/62 XXL · <b className="text-green-dark">style:</b>
                <span className="inline-flex ml-1 bg-white border border-line rounded-full p-[3px] align-middle">
                  <button onClick={() => setCurStyle('uni')} className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${curStyle === 'uni' ? 'text-white' : 'text-muted hover:text-ink'}`}>
                    {curStyle === 'uni' && <motion.div layoutId="styleToggle" className="absolute inset-0 bg-green rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">Uni</span>
                  </button>
                  <button onClick={() => setCurStyle('aop')} className={`relative border-none bg-transparent rounded-full px-3 py-1 text-[11.5px] font-semibold cursor-pointer ${curStyle === 'aop' ? 'text-white' : 'text-muted hover:text-ink'}`}>
                    {curStyle === 'aop' && <motion.div layoutId="styleToggle" className="absolute inset-0 bg-green rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                    <span className="relative z-10">AOP</span>
                  </button>
                </span>
              </div>
              <div className="inline-flex items-center gap-2 bg-green-soft border border-[#BCD8C6] text-green-dark font-mono text-[11.5px] rounded-lg px-3 py-1.5 mb-3.5">
                Art. {ART[curStyle][curSize]} · He. Shorty, Modal, {curStyle}, {curSize}
              </div>
              
              <table className="w-full border-collapse">
                <tbody>
                  {(curGar === 'top' ? TOP_MEASUREMENTS : BOTTOM_MEASUREMENTS).map(r => (
                    <tr 
                      key={r.k} 
                      className="border-b border-line last:border-b-0 cursor-pointer transition-colors hover:bg-green-soft group"
                      onMouseEnter={() => setHoveredGar(r.g)}
                      onMouseLeave={() => setHoveredGar(null)}
                      onClick={() => setHoveredGar(r.g)}
                    >
                      <td className="p-2.5 pl-0 w-[34px]">
                        <span className="w-[26px] h-[26px] rounded-lg bg-green-soft text-green-dark grid place-items-center font-mono text-[12px] font-medium group-hover:bg-green group-hover:text-white transition-colors">{r.k}</span>
                      </td>
                      <td className="p-2.5 px-2">
                        <span className="font-semibold text-[13.5px]">{r.name}</span>
                        <span className="block text-muted text-[11.5px] font-normal">{r.how}</span>
                      </td>
                      <td className="p-2.5 pr-0 font-mono font-medium text-right text-[14px]">
                        <span className="inline-block val-tick" key={`${r.k}-${curSize}-${curUnit}`}>{fmt(r.vals[curSize] as number)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 bg-surface-2 border border-dashed border-line-2 rounded-[14px] p-4 px-[18px]">
                <h4 className="text-[13px] tracking-widest uppercase text-green-dark mb-2 font-bold">Fit Guide</h4>
                <p className="text-[13px] text-muted">{FIT[curGar]}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pt-10 sm:pt-[72px] pb-2" id="section-b">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">B</div>
            <div>
              <h2 className="text-[20px] sm:text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight">Traceability Journey</h2>
              <p className="text-muted text-[12px] sm:text-[13.5px] mt-0.5">Tier 1 to Tier 4 verified nodes per FiTS & SCOT</p>
            </div>
          </Reveal>

          <Reveal><OriginMap /></Reveal>
          <Reveal><TraceBar /></Reveal>

          <RevealGroup className="relative pl-6 sm:pl-[34px] grid gap-4 sm:gap-[22px] mb-3.5">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-green via-green to-amber-line"></div>
            
            <RevealItem className="relative">
              <div className="absolute -left-[30px] top-[22px] w-4 h-4 rounded-full bg-amber border-[4px] border-bg shadow-[0_0_0_2px_var(--color-amber)]"></div>
              <div className="bg-surface border border-line rounded-[18px] shadow-custom p-[22px] px-[24px] transition-transform hover:-translate-y-[3px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                  <span className="font-mono text-[11px] font-medium bg-ink text-lime rounded-lg px-2.5 py-1 tracking-[0.08em]">TIER 3</span>
                  <span className="font-mono text-[11.5px] text-muted">Q3 2025</span>
                  <span className="text-line-2 ml-auto text-[16px]">⟰</span>
                </div>
                <h3 className="text-[17px] font-bold">Yarn & Fibre Sourcing — CmiA · Birla · Hyosung</h3>
                <p className="text-[12.5px] text-muted my-1 mb-3">Cotton made in Africa partner countries · Birla Modal (cellulosic) · creora® elastane (Hyosung) · SCOT-tracked chain</p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">SCOT Registration</div>
                    <div className="text-[12.5px] font-bold mt-0.5">ID: PENDING (AKH-B01)</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Cotton 48%</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">CmiA certified, ring-spun Ne 34/1 combed, S-twist</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Modal 47%</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">Nominated Birla fibres (Livaeco™ eligible)</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Elastane 5%</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">creora® 20 D · certificate issued by Hyosung</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-[7px] mt-3 bg-amber-soft border border-dashed border-amber-line text-amber text-[12px] font-semibold rounded-xl px-[13px] py-2">
                  <span className="w-2 h-2 rounded-full bg-amber"></span>
                  Raw cotton fibre (farm-level) origin: Data Pending / Out of Scope — SCOT chain verified at spinning-mill level only
                </span>
              </div>
            </RevealItem>

            <RevealItem className="relative">
              <div className="absolute -left-[30px] top-[22px] w-4 h-4 rounded-full bg-green border-[4px] border-bg shadow-[0_0_0_2px_var(--color-green)]"></div>
              <div className="bg-surface border border-line rounded-[18px] shadow-custom p-[22px] px-[24px] transition-transform hover:-translate-y-[3px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                  <span className="font-mono text-[11px] font-medium bg-ink text-lime rounded-lg px-2.5 py-1 tracking-[0.08em]">TIER 2</span>
                  <span className="font-mono text-[11.5px] text-muted">SEP 2025</span>
                  <span className="text-line-2 ml-auto text-[16px]">⟰</span>
                </div>
                <h3 className="text-[17px] font-bold">Fabric Manufacturing — AKH Knitting & Dyeing Ltd.</h3>
                <p className="text-[12.5px] text-muted my-1 mb-3">🇧🇩 Bangladesh · knitting, dyeing & finishing in-house · Birla fibre declaration + invoice on file</p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Knitting</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">Single jersey, gauge 32×28 · 42 courses / 30 wales per 2 cm</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Dyeing</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">Jadeite 16-5304 TCX · Dark Green 097-36-06 · AOP pigment print (base 085-52-07)</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Finishing</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">Softener finish · 160 g/m² ±5%</div>
                  </div>
                </div>
              </div>
            </RevealItem>

            <RevealItem className="relative">
              <div className="absolute -left-[30px] top-[22px] w-4 h-4 rounded-full bg-green border-[4px] border-bg shadow-[0_0_0_2px_var(--color-green)]"></div>
              <div className="bg-surface border border-line rounded-[18px] shadow-custom p-[22px] px-[24px] transition-transform hover:-translate-y-[3px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                  <span className="font-mono text-[11px] font-medium bg-ink text-lime rounded-lg px-2.5 py-1 tracking-[0.08em]">TIER 1</span>
                  <span className="font-mono text-[11.5px] text-muted">OCT 2025</span>
                  <span className="text-line-2 ml-auto text-[16px]">⟰</span>
                </div>
                <h3 className="text-[17px] font-bold">Garment Assembly — AKH Knitting and Dyeing Ltd. (CMT)</h3>
                <p className="text-[12.5px] text-muted my-1 mb-3">🇧🇩 Bangladesh · Cut, Make & Trim · order 4300085070 · AQL release KF 0 / HF 2.5 / NF 4.0</p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Top</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">V-neck self-fabric piping, necktape chain-stitched, shoulder +2 cm forward</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Bottom</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">Set-on waistband w/ drawstring + elastic, side pockets, fake fly &quot;J&quot; stitch</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Seams</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">4-thread overlock · 3-thread coverstitch hem 2.5 cm · ≥ 5 st/cm knitwear</div>
                  </div>
                </div>
              </div>
            </RevealItem>

            <RevealItem className="relative">
              <div className="absolute -left-[30px] top-[22px] w-4 h-4 rounded-full bg-green border-[4px] border-bg shadow-[0_0_0_2px_var(--color-green)]"></div>
              <div className="bg-surface border border-line rounded-[18px] shadow-custom p-[22px] px-[24px] transition-transform hover:-translate-y-[3px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                  <span className="font-mono text-[11px] font-medium bg-ink text-lime rounded-lg px-2.5 py-1 tracking-[0.08em]">LAB</span>
                  <span className="font-mono text-[11.5px] text-muted">30 OCT 2025</span>
                  <span className="text-line-2 ml-auto text-[16px]">⟰</span>
                </div>
                <h3 className="text-[17px] font-bold">Testing & Release — Bureau Veritas CPS (BD) Ltd.</h3>
                <p className="text-[12.5px] text-muted my-1 mb-3">🇧🇩 Plot #130, DEPZ Extension Area, Ganakbari, Savar, Dhaka · Report (6825)298-0551 · reviewed by R. Belal Hossain, Sr. Manager</p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Scope</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">RSL Cat 1 v1/2024 + Tchibo physical tests (FiTS 13 Aug 2025)</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Overall result</div>
                    <div className="text-[12.5px] font-semibold mt-0.5 text-green-dark">PASS — complies with FiTS & EU legal requirements</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Destination</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">DE · AT · CZ · HU · SK · PL · CH · TR</div>
                  </div>
                </div>
              </div>
            </RevealItem>

            <RevealItem className="relative">
              <div className="absolute -left-[30px] top-[22px] w-4 h-4 rounded-full bg-green border-[4px] border-bg shadow-[0_0_0_2px_var(--color-green)]"></div>
              <div className="bg-surface border border-line rounded-[18px] shadow-custom p-[22px] px-[24px] transition-transform hover:-translate-y-[3px]">
                <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
                  <span className="font-mono text-[11px] font-medium bg-ink text-lime rounded-lg px-2.5 py-1 tracking-[0.08em]">LOGISTICS</span>
                  <span className="font-mono text-[11.5px] text-muted">NOV 2025</span>
                </div>
                <h3 className="text-[17px] font-bold">Transport & Distribution</h3>
                <p className="text-[12.5px] text-muted my-1 mb-3">Shipment to European distribution centers and final retail.</p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Origin → Destination</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">Chittagong, BD → Hamburg, DE</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Mode</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">Sea Freight (~14,500 km)</div>
                  </div>
                  <div className="bg-surface-2 border border-line rounded-xl p-2.5 px-3">
                    <div className="text-[10px] tracking-widest uppercase text-muted font-semibold">Emissions Profile</div>
                    <div className="text-[12.5px] font-semibold mt-0.5">0.4 kg CO₂e per unit allocated</div>
                  </div>
                </div>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      <section className="pt-10 sm:pt-[72px] pb-2" id="section-c">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">C</div>
            <div>
              <h2 className="text-[20px] sm:text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight">Quality Analysis</h2>
              <p className="text-muted text-[12px] sm:text-[13.5px] mt-0.5">Composition, colour fastness & RSL results</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4 sm:gap-[26px] items-start mb-6 sm:mb-[26px]">
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[26px]">
              <h3 className="text-[16px] font-bold mb-1">Fabric Composition</h3>
              <p className="text-[12.5px] text-muted mb-[18px]">Labeled per Regulation (EU) 1007/2011 · tolerance ±3%</p>
              
              <CircularComposition cotton={48} modal={47} elastane={5} />
              
              <div className="mt-6 flex justify-between items-center bg-green-soft border border-[#BCD8C6] rounded-xl p-3 px-4">
                <span className="text-[11px] tracking-widest uppercase text-green-dark font-semibold">Fabric weight · spec 160 ±5%</span>
                <span className="font-display font-bold text-[22px] text-green-dark">160 <small className="text-[12px]">g/m²</small></span>
              </div>
              
              <div className="mt-3.5 flex justify-between items-center bg-surface-2 border border-line rounded-xl p-3 px-4">
                <span className="text-[11px] tracking-widest uppercase text-muted font-semibold">Recycled Content</span>
                <span className="font-display font-bold text-[22px] text-ink">0 <small className="text-[12px]">%</small></span>
              </div>
              
              <div className="mt-3.5 border border-dashed border-line-2 rounded-xl p-3 px-3.5 text-[12px] text-muted">
                Lab analysis (ISO 1833) — sample A:
                <table className="w-full border-collapse mt-1.5 mb-1.5">
                  <tbody>
                    <tr><td className="py-1 px-1.5 text-[12px]">Cotton</td><td className="py-1 px-1.5 text-[12px] text-right font-mono">labeled 48% → lab 49.2%</td></tr>
                    <tr><td className="py-1 px-1.5 text-[12px]">Modal</td><td className="py-1 px-1.5 text-[12px] text-right font-mono">labeled 47% → lab 46.9%</td></tr>
                    <tr><td className="py-1 px-1.5 text-[12px]">Elastane</td><td className="py-1 px-1.5 text-[12px] text-right font-mono">labeled 5% → lab 3.9%</td></tr>
                  </tbody>
                </table>
                All within ±3 tolerance → <b className="text-green-dark">PASS</b>
              </div>

              <div className="mt-3.5 border border-dashed border-line-2 rounded-xl p-3 px-3.5 text-[12px] text-muted">
                <b className="text-ink">Microfibre Release:</b> Elastane content 3.9% — synthetic fibre shedding applicable; wash bag recommended.
              </div>
            </Reveal>

            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-[26px]">
              <h3 className="text-[16px] font-bold mb-1">Chemicals & Substances of Concern</h3>
              <p className="text-[12.5px] text-muted mb-4">SVHC (Substances of Very High Concern) per REACH declaration</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[11px] text-muted uppercase tracking-widest border-b border-line-2">
                    <tr>
                      <th className="py-2 font-semibold">Substance</th>
                      <th className="py-2 font-semibold hidden sm:table-cell">CAS No.</th>
                      <th className="py-2 font-semibold">Component</th>
                      <th className="py-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-line">
                      <td className="py-3 pr-2">Alkylphenol ethoxylates (APEO)</td>
                      <td className="py-3 font-mono text-muted text-[11.5px] hidden sm:table-cell">Multiple</td>
                      <td className="py-3">Dyeing</td>
                      <td className="py-3 text-right"><span className="text-[10px] font-bold tracking-widest text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-1 rounded-full whitespace-nowrap">NOT DETECTED</span></td>
                    </tr>
                    <tr className="border-b border-line">
                      <td className="py-3 pr-2">Heavy Metals (Extractable)</td>
                      <td className="py-3 font-mono text-muted text-[11.5px] hidden sm:table-cell">Multiple</td>
                      <td className="py-3">Pigment Print</td>
                      <td className="py-3 text-right"><span className="text-[10px] font-bold tracking-widest text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-1 rounded-full whitespace-nowrap">&lt; 0.1% LIMIT</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-2">PFAS (Per- and polyfluoroalkyl)</td>
                      <td className="py-3 font-mono text-muted text-[11.5px] hidden sm:table-cell">Multiple</td>
                      <td className="py-3">Finish</td>
                      <td className="py-3 text-right"><span className="text-[10px] font-bold tracking-widest text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-1 rounded-full whitespace-nowrap">NOT DETECTED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 pt-5 border-t border-line">
                <h3 className="text-[16px] font-bold mb-1">Restricted Substances — RSL Category 1 (v1/2024)</h3>
                <p className="text-[12.5px] text-muted mb-4">Adults &gt;14 y · all textiles · Bureau Veritas BD · <b className="text-green-dark">OVERALL PASS</b></p>
              <div className="grid gap-[9px]">
                {[
                  {n:'Formaldehyde',r:'ND(<16) mg/kg · limit 75'},
                  {n:'pH value',r:'5.5 – 6.5 · limit 4.0 – 7.5'},
                  {n:'Azo amines (splitting off)',r:'ND(<5) mg/kg · limit 20'},
                  {n:'Phthalates',r:'ND(<50) mg/kg · limit 500 each'},
                  {n:'PAHs (18 sum)',r:'ND(<0.2) mg/kg · limit 10'},
                  {n:'Odour test',r:'Grade 1 · limit Grade 3'}
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center gap-3 bg-surface-2 border border-line rounded-[10px] p-[9px] px-[13px] text-[12.5px]">
                    <span className="font-semibold">{item.n}</span>
                    <span className="font-mono text-[11.5px] text-muted">{item.r}</span>
                    <span className="text-[10.5px] font-bold tracking-[0.08em] bg-green-soft text-green-dark border border-[#BCD8C6] rounded-full px-2.5 py-[3px] whitespace-nowrap">PASS</span>
                  </div>
                ))}
              </div>
              </div>
            </Reveal>
          </div>

          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RevealItem><LabCard std="DIN EN ISO 105-C06" title="Colour Fastness to Washing" val="4–5" subVal="req. 4-5 / stain 4" desc="Test A2S, 30 min @ 40 °C, ECE detergent + sodium perborate, 10 steel balls. Colour change & staining 4-5 across all 4 colourways (A–D)." hint="tap for method ↓" /></RevealItem>
            <RevealItem><LabCard std="DIN EN ISO 105-X12" title="Colour Fastness to Rubbing" val="4–5" subVal="dry & wet · req. 4" desc="Length-wise & width-wise on body, contrast and drawcord. All results 4–5, above the grade-4 requirement." hint="tap for method ↓" /></RevealItem>
            <RevealItem><LabCard std="DIN EN ISO 105-B02" title="Colour Fastness to Light" val="4" subVal="req. 4" desc="Artificial light exposure, colour change @ grade 4 on body, contrast and drawcord for all colourways." hint="tap for method ↓" /></RevealItem>
            <RevealItem><LabCard std="DIN EN ISO 105-E04" title="Fastness to Perspiration" val="4–5" subVal="acid & alkaline" desc="Colour change, self-staining and staining of acetate/cotton/nylon/polyester/acrylic/wool all 4–5 (req. 4-5 / 4)." hint="tap for method ↓" /></RevealItem>
            <RevealItem><LabCard std="DIN EN ISO 105-E01" title="Colour Fastness to Water" val="4–5" subVal="req. 4-5 / stain 4" desc="Colour change & self-staining 4-5; staining of all 6 adjacent fibres 4-5 across colourways A–D." hint="tap for method ↓" /></RevealItem>
            <RevealItem><LabCard std="ISO 1833" title="Quantitative Fibre Analysis" val="±1.2%" subVal="max dev. · tol. ±3" desc="Lab vs labeled: cotton +1.2 / modal − 0.1 / elastane − 1.1 (sample A). All four colourways within EU 1007/2011 tolerance." hint="tap for method ↓" /></RevealItem>
          </RevealGroup>
        </div>
      </section>

      <section className="pt-[72px] pb-2" id="section-d">
        <div className="max-w-[1120px] mx-auto px-[22px]">
          <Reveal className="flex items-center gap-[18px] mb-[30px]">
            <div className="w-[58px] h-[58px] shrink-0 rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[26px] shadow-custom">D</div>
            <div>
              <h2 className="text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight">Care, Maintenance & Stain Removal</h2>
              <p className="text-muted text-[13.5px] mt-0.5">Ginetex label decode + FiTS durability requirement (10 wash / 10 dry cycles)</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-[26px] items-start">
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[26px]">
              <h3 className="text-[16px] font-bold mb-1">Standard Care Instructions</h3>
              <p className="text-[12.5px] text-muted mb-[18px]">As printed on the 25 mm woven care label (side seam, wearer&apos;s left)</p>
              
              <RevealGroup className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                <RevealItem className="bg-surface-2 border border-line rounded-xl p-3 px-1.5 text-center transition-colors hover:border-green hover:-translate-y-[2px]">
                  <svg className="w-[38px] h-[38px] stroke-green-dark mx-auto mb-2 block" viewBox="0 0 48 48" fill="none" strokeWidth="2.5"><path d="M7 15 L11 40 H37 L41 15"/><path d="M7 15 C10 19 14 19 17 15 C20 19 24 19 27 15 C30 19 34 19 37 15 C38.5 17 40 17 41 15"/><text x="24" y="33" fontSize="12" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="IBM Plex Mono">40</text></svg>
                  <div className="text-[10.5px] font-semibold leading-[1.35] text-muted">Machine wash 40 °C normal</div>
                </RevealItem>
                <RevealItem className="bg-surface-2 border border-line rounded-xl p-3 px-1.5 text-center transition-colors hover:border-green hover:-translate-y-[2px]">
                  <svg className="w-[38px] h-[38px] stroke-green-dark mx-auto mb-2 block" viewBox="0 0 48 48" fill="none" strokeWidth="2.5"><path d="M24 9 L43 39 H5 Z"/><line x1="8" y1="10" x2="40" y2="42"/><line x1="40" y1="10" x2="8" y2="42"/></svg>
                  <div className="text-[10.5px] font-semibold leading-[1.35] text-muted">Do not bleach</div>
                </RevealItem>
                <RevealItem className="bg-surface-2 border border-line rounded-xl p-3 px-1.5 text-center transition-colors hover:border-green hover:-translate-y-[2px]">
                  <svg className="w-[38px] h-[38px] stroke-green-dark mx-auto mb-2 block" viewBox="0 0 48 48" fill="none" strokeWidth="2.5"><rect x="8" y="8" width="32" height="32" rx="3"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="1.6" fill="currentColor" stroke="none"/></svg>
                  <div className="text-[10.5px] font-semibold leading-[1.35] text-muted">Tumble dry low heat</div>
                </RevealItem>
                <RevealItem className="bg-surface-2 border border-line rounded-xl p-3 px-1.5 text-center transition-colors hover:border-green hover:-translate-y-[2px]">
                  <svg className="w-[38px] h-[38px] stroke-green-dark mx-auto mb-2 block" viewBox="0 0 48 48" fill="none" strokeWidth="2.5"><path d="M9 34 C9 22 19 15 29 15 H41 V34 Z"/><circle cx="22" cy="27" r="2.2" fill="currentColor" stroke="none"/><circle cx="29" cy="27" r="2.2" fill="currentColor" stroke="none"/></svg>
                  <div className="text-[10.5px] font-semibold leading-[1.35] text-muted">Iron medium (2 dots)</div>
                </RevealItem>
                <RevealItem className="bg-surface-2 border border-line rounded-xl p-3 px-1.5 text-center transition-colors hover:border-green hover:-translate-y-[2px]">
                  <svg className="w-[38px] h-[38px] stroke-green-dark mx-auto mb-2 block" viewBox="0 0 48 48" fill="none" strokeWidth="2.5"><circle cx="24" cy="24" r="15"/><line x1="10" y1="10" x2="38" y2="38"/></svg>
                  <div className="text-[10.5px] font-semibold leading-[1.35] text-muted">Do not dry clean</div>
                </RevealItem>
              </RevealGroup>
              <div className="mt-[18px] text-[13px] text-muted bg-surface-2 border border-dashed border-line-2 rounded-xl p-3.5 px-4">
                <b className="text-ink block mb-1">Label wording (EN):</b>
                &quot;Colour detergent recommended · Wash with similar colours.&quot; Wash at max 40 °C, turn set inside-out, and skip optical-brightener detergents to protect the Jadeite / Dark Green shades. FiTS requires appearance & function to survive <b>10 wash + 10 dry cycles</b> — this batch passed all fastness grades 4–5.
              </div>
            </Reveal>

            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-[26px]">
              <h3 className="text-[16px] font-bold mb-1">Stain Removal Hacks</h3>
              <p className="text-[12.5px] text-muted mb-[18px]">Household fixes for modal jersey before the next 40° wash</p>
              
              <div className="flex gap-2 mb-[18px] flex-wrap">
                <button onClick={() => setStainTab('oil')} className={`relative border border-line-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors cursor-pointer ${stainTab === 'oil' ? 'border-red text-white' : 'bg-white text-muted hover:border-red hover:text-red'}`}>
                  {stainTab === 'oil' && <motion.div layoutId="stainToggle" className="absolute inset-0 bg-red rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className="relative z-10">🧴 Oil & Grease</span>
                </button>
                <button onClick={() => setStainTab('ink')} className={`relative border border-line-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors cursor-pointer ${stainTab === 'ink' ? 'border-red text-white' : 'bg-white text-muted hover:border-red hover:text-red'}`}>
                  {stainTab === 'ink' && <motion.div layoutId="stainToggle" className="absolute inset-0 bg-red rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className="relative z-10">🖋️ Ink</span>
                </button>
                <button onClick={() => setStainTab('food')} className={`relative border border-line-2 rounded-full px-4 py-2 text-[12.5px] font-semibold transition-colors cursor-pointer ${stainTab === 'food' ? 'border-red text-white' : 'bg-white text-muted hover:border-red hover:text-red'}`}>
                  {stainTab === 'food' && <motion.div layoutId="stainToggle" className="absolute inset-0 bg-red rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className="relative z-10">🍷 Food & Drinks</span>
                </button>
              </div>

              <div className="relative">
                <AnimatePresence mode="wait">
                  {stainTab === 'oil' && (
                    <motion.div key="oil" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <ol className="list-decimal pl-4 mb-3.5 grid gap-[9px] text-[13px] text-muted">
                        <li><b className="text-ink">Blot</b> — never rub — excess oil with a paper towel.</li>
                        <li>Sprinkle <b className="text-ink">baking soda</b> on the spot, wait 10 min to absorb, brush off.</li>
                        <li>Work one drop of <b className="text-ink">clear dish soap</b> into the stain from the back side.</li>
                        <li>Rinse warm, then machine wash at 40 °C with colour detergent.</li>
                      </ol>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">dish soap</span>
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">baking soda</span>
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">soft brush</span>
                      </div>
                    </motion.div>
                  )}
                  {stainTab === 'ink' && (
                    <motion.div key="ink" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <ol className="list-decimal pl-4 mb-3.5 grid gap-[9px] text-[13px] text-muted">
                        <li>Place a folded towel <b className="text-ink">inside</b> the garment under the stain.</li>
                        <li>Dab with <b className="text-ink">70% rubbing alcohol</b> on a cotton pad — blot edges inward.</li>
                        <li>Repeat until transfer stops; do not scrub (spreads the dye).</li>
                        <li>Rinse cold, then wash with similar colours at 40 °C.</li>
                      </ol>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">rubbing alcohol</span>
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">cotton pads</span>
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">cold water</span>
                      </div>
                    </motion.div>
                  )}
                  {stainTab === 'food' && (
                    <motion.div key="food" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <ol className="list-decimal pl-4 mb-3.5 grid gap-[9px] text-[13px] text-muted">
                        <li>Scoop off solids; run <b className="text-ink">cold water through the back</b> of the stain for 60 s.</li>
                        <li>Apply <b className="text-ink">white vinegar + baking soda</b> paste, rest 15 min.</li>
                        <li>Rinse; if a shadow remains, repeat once before drying.</li>
                        <li>Wash at 40 °C with colour detergent, similar colours.</li>
                      </ol>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">white vinegar</span>
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">baking soda</span>
                        <span className="text-[11px] bg-red-soft text-red font-semibold rounded-full px-[11px] py-1.5">cold water</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-3.5 text-[12px] text-amber bg-amber-soft border border-dashed border-amber-line rounded-[10px] p-2.5 px-[14px] font-semibold">
                ⚠️ Never tumble-dry a stained garment — heat sets stains permanently.
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pt-10 sm:pt-[72px] pb-2" id="section-e">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">E</div>
            <div>
              <h2 className="text-[20px] sm:text-[clamp(22px,3.4vw,30px)] font-bold tracking-tight">Circularity</h2>
              <p className="text-muted text-[12px] sm:text-[13.5px] mt-0.5">Fibre-to-fiber strategies & recycling instructions</p>
            </div>
          </Reveal>

          <Reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-[26px]">
            <div className="p-[18px] rounded-2xl bg-white border border-line shadow-custom transition-all hover:-translate-y-1 hover:border-green">
              <div className="w-[38px] h-[38px] rounded-xl bg-green-soft grid place-items-center text-[18px] mb-3">🌊</div>
              <h4 className="text-[13.5px] font-bold mb-1">Wash at 40° or cooler</h4>
              <p className="text-[12px] text-muted">Modal loves cool water; gentle cycles protect the elastane&apos;s recovery for 10+ FiTS cycles.</p>
            </div>
            <div className="p-[18px] rounded-2xl bg-white border border-line shadow-custom transition-all hover:-translate-y-1 hover:border-green">
              <div className="w-[38px] h-[38px] rounded-xl bg-green-soft grid place-items-center text-[18px] mb-3">🌬️</div>
              <h4 className="text-[13.5px] font-bold mb-1">Air dry flat</h4>
              <p className="text-[12px] text-muted">Knit jersey keeps its shape flat-dried; low tumble dry only when needed.</p>
            </div>
            <div className="p-[18px] rounded-2xl bg-white border border-line shadow-custom transition-all hover:-translate-y-1 hover:border-green">
              <div className="w-[38px] h-[38px] rounded-xl bg-green-soft grid place-items-center text-[18px] mb-3">🗄️</div>
              <h4 className="text-[13.5px] font-bold mb-1">Fold, don&apos;t hang</h4>
              <p className="text-[12px] text-muted">Knitted loops stretch on hangers — folded storage preserves the 4% dimensional spec.</p>
            </div>
            <div className="p-[18px] rounded-2xl bg-white border border-line shadow-custom transition-all hover:-translate-y-1 hover:border-green">
              <div className="w-[38px] h-[38px] rounded-xl bg-green-soft grid place-items-center text-[18px] mb-3">🧵</div>
              <h4 className="text-[13.5px] font-bold mb-1">Repair seams early</h4>
              <p className="text-[12px] text-muted">Coverstitch hems & overlock seams are re-stitchable — a 5-min mend adds years.</p>
            </div>
          </Reveal>

          <Reveal className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] overflow-hidden bg-surface border border-line rounded-[18px] shadow-custom mb-[26px]">
            <div className="relative bg-[#EAE4D6] min-h-[300px]">
              <span className="absolute top-[14px] left-[14px] bg-ink/85 text-lime font-mono text-[10.5px] rounded-lg px-2.5 py-1.5 z-10">NO-SEW · ~25 MIN</span>
              <Image src="https://image.qwenlm.ai/public_source/664e8b35-e47f-4aa4-bc0f-a8f86843d2cf/1eb313437-56f6-42b6-be85-d49488aabe23.png" alt="Upcycled pyjama fabric" fill className="object-cover" />
            </div>
            <div className="p-[26px] sm:px-[28px]">
              <h3 className="text-[18px] font-bold mb-1">DIY Upcycle: Retired Pyjamas → Pouch + Cleaning Cloths</h3>
              <p className="text-[12.5px] text-muted mt-0.5 mb-2.5">Modal jersey is ultra-absorbent — perfect second life. Reuse the original drawstring!</p>
              <div className="flex gap-2 my-2.5 mb-4 flex-wrap">
                <span className="text-[11px] font-semibold rounded-full px-[11px] py-1.5 bg-surface-2 border border-line-2 text-muted">⏱️ ~25 min</span>
                <span className="text-[11px] font-semibold rounded-full px-[11px] py-1.5 bg-surface-2 border border-line-2 text-muted">👕 Beginner</span>
                <span className="text-[11px] font-semibold rounded-full px-[11px] py-1.5 bg-surface-2 border border-line-2 text-muted">✂️ Scissors only</span>
                <span className="text-[11px] font-semibold rounded-full px-[11px] py-1.5 bg-surface-2 border border-line-2 text-muted">♻️ 0 waste</span>
              </div>
              <div className="border-t border-line">
                <AccordionItem num="1" title="Rescue the drawstring" text="Open one buttonhole at the waistband and gently pull out the knitted drawstring intact — it becomes the closure for your new pouch." isOpen={accOpen===1} onClick={() => setAccOpen(accOpen===1 ? null : 1)} />
                <AccordionItem num="2" title="Cut cleaning cloths" text="From the top's front & back panels, cut 25×25 cm squares. Jersey curls slightly but won't fray — no hemming needed for dusting or glass cloths." isOpen={accOpen===2} onClick={() => setAccOpen(accOpen===2 ? null : 2)} />
                <AccordionItem num="3" title="Cut the pouch blank" text="From the shorts' legs cut one 30×44 cm rectangle. Fold in half (right sides together) leaving the fold at the bottom." isOpen={accOpen===3} onClick={() => setAccOpen(accOpen===3 ? null : 3)} />
                <AccordionItem num="4" title="Knot-seal the sides" text="Cut 1.5 cm × 7 cm fringe along both open side edges and double-knot each front/back pair tightly — a no-sew seam that holds laundry-bag loads." isOpen={accOpen===4} onClick={() => setAccOpen(accOpen===4 ? null : 4)} />
                <AccordionItem num="5" title="Thread & finish" text="Turn right-side out, fold the top edge down twice to form a channel, snip two tiny holes, and thread the rescued drawstring through with a safety pin. Done! ✨" isOpen={accOpen===5} onClick={() => setAccOpen(accOpen===5 ? null : 5)} />
              </div>
              <div className="mt-4 text-[12.5px] text-muted bg-surface-2 border border-dashed border-line-2 rounded-xl p-3 px-4">
                <b className="text-green-dark">Too worn to craft?</b> Cut panels become drawer liners or shoe-bags — modal&apos;s soft handfeel makes it ideal for delicate surfaces.
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-[26px]">
            <Reveal className="bg-green-dark text-[#EAF3EC] border border-none rounded-[18px] shadow-custom p-5 sm:p-[26px]">
              <h3 className="text-[16px] font-bold text-white mb-1.5">♻️ Fibre Facts & Take-Back</h3>
              <p className="text-[12.5px] text-[#B9D3C1] mb-4">What happens after the last wear</p>
              <ul className="list-none grid gap-2.5 text-[13px]">
                <li className="flex gap-2.5 items-start"><i className="not-italic text-lime">→</i> 48% CmiA cotton + 47% modal = 95% cellulosic, mechanically recyclable into open-end yarn.</li>
                <li className="flex gap-2.5 items-start"><i className="not-italic text-lime">→</i> 5% elastane keeps it in the &quot;stretch-blend&quot; recycling stream — never landfill.</li>
                <li className="flex gap-2.5 items-start"><i className="not-italic text-lime">→</i> Return via retailer textile collection; CmiA & Birla fibres are traceable for fibre-to-fiber programs.</li>
              </ul>
              <div className="mt-[18px] bg-[#D8F34E]/10 border border-dashed border-[#D8F34E]/50 rounded-xl p-3 px-4 text-[12.5px] text-lime font-semibold">
                Return any worn Tchibo textile at participating stores — collection supports fibre-to-fibre recycling
              </div>
            </Reveal>

            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-[26px]">
              <h3 className="text-[16px] font-bold mb-1.5">📍 Local Textile Drop-Off</h3>
              <p className="text-[12.5px] text-muted mb-4">EU separate textile collection active since Jan 2025</p>
              <form onSubmit={handleLocSearch} className="flex gap-2.5 mb-3.5">
                <input type="text" placeholder="Enter city or postcode..." required className="flex-1 border border-line-2 rounded-xl p-2.5 px-3.5 text-[13px] bg-surface-2 outline-none transition-colors focus:border-green focus:bg-white" />
                <button type="submit" className="bg-ink text-lime border-none rounded-xl p-2.5 px-[18px] font-bold text-[13px] cursor-pointer">Find</button>
              </form>
              <AnimatePresence>
                {locResult && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-green-soft border border-[#BCD8C6] rounded-xl p-3.5 px-4 text-[13px]" dangerouslySetInnerHTML={{ __html: locResult }} />
                )}
              </AnimatePresence>
              <p className="mt-3.5 text-[12px] text-muted">
                Wash & bag textiles before drop-off; damp items can&apos;t enter fibre recycling. Keep the drawstring attached — hardware & trims are sorted automatically.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pt-10 sm:pt-[72px] pb-2" id="section-f">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">F</div>
            <div>
              <h2 className="text-[clamp(20px,3.4vw,30px)] font-bold tracking-tight">Environmental Dashboard</h2>
              <p className="text-muted text-[12.5px] sm:text-[13.5px] mt-0.5">Lifecycle assessment & resource efficiency metrics</p>
            </div>
          </Reveal>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-[26px]">
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[26px]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-[16px] font-bold">Carbon Footprint</h3>
                  <p className="text-[12.5px] text-muted mt-1">Lifecycle breakdown per ISO 14067</p>
                </div>
                <div className="px-3 py-1 bg-green-soft border border-[#BCD8C6] text-green-dark rounded-full font-bold text-[10px] tracking-widest uppercase">LCA Verified</div>
              </div>
              
              <CarbonPieChart />
              
              <div className="mt-4 pt-5 border-t border-line-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-4 text-[11px] font-bold uppercase tracking-widest text-muted/60">
                  <span>Source: LCA Ver 2.1</span>
                  <span>Date: 12 Aug 2025</span>
                </div>
              </div>
            </Reveal>

            <div className="grid gap-[26px]">
              <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-[26px]">
                <h3 className="text-[15px] font-bold mb-1 flex items-center gap-2">
                  <Leaf size={16} className="text-green" /> Resource Footprint
                </h3>
                <p className="text-[12.5px] text-muted mb-6">Benchmarked against industry standards</p>
                <ResourceBarChart />
              </Reveal>
              
              <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-[26px]">
                <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                  <Box size={16} className="text-green" /> Packaging Status
                </h3>
                <div className="grid gap-3">
                  <div className="bg-surface-2 border border-line rounded-xl p-3 px-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Recycle size={18} className="text-muted" />
                      <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Recyclability</span>
                    </div>
                    <span className="text-[13px] font-bold text-green-dark bg-green-soft px-3 py-1 rounded-full">100%</span>
                  </div>
                  <div className="p-3 text-[12px] leading-relaxed text-muted bg-surface-2 border border-line rounded-xl px-4">
                    <b className="text-ink">Materials:</b> Recycled Cardboard (FSC), Soy-based Inks, Organic Tissue Paper. Plastic-free shipment.
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
          
          <Reveal className="mt-8 bg-ink rounded-2xl p-6 border border-line flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 text-center md:text-left">
              <h3 className="text-white font-bold text-[18px] mb-1">EU Policy Alignment Note</h3>
              <p className="text-white/60 text-[13px] max-w-[600px]">Product Environmental Footprint (PEF) methodology scoring pending final category framework release by the European Commission.</p>
            </div>
            <div className="relative z-10 shrink-0">
              <span className="px-5 py-2 bg-lime text-ink rounded-full font-bold text-[12px] tracking-widest uppercase shadow-lg shadow-lime/20">Data Pending</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pt-10 sm:pt-[72px] pb-[40px] sm:pb-[80px]" id="section-g">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-[22px]">
          <Reveal className="flex items-center gap-[14px] sm:gap-[18px] mb-6 sm:mb-[30px]">
            <div className="w-10 h-10 sm:w-[58px] sm:h-[58px] shrink-0 rounded-xl sm:rounded-2xl bg-ink text-lime grid place-items-center font-display font-bold text-[18px] sm:text-[26px] shadow-custom">G</div>
            <div>
              <h2 className="text-[clamp(20px,3.4vw,30px)] font-bold tracking-tight">Data & Compliance</h2>
              <p className="text-muted text-[12.5px] sm:text-[13.5px] mt-0.5">Certifications and machine-readable export</p>
            </div>
          </Reveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-[26px] mb-4 sm:mb-[26px]">
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[26px]">
              <h3 className="text-[16px] font-bold mb-4">Certifications & Audits</h3>
              <div className="grid gap-2.5">
                <div className="flex justify-between items-start bg-surface-2 border border-line rounded-xl p-3 sm:p-3.5">
                  <div>
                    <div className="font-bold text-[13px] sm:text-[13.5px]">Cotton made in Africa (CmiA)</div>
                    <div className="text-[11px] sm:text-[11.5px] text-muted mt-1">Scope: Raw cotton origin · Valid until Dec 2026</div>
                  </div>
                  <span className="text-[9px] font-bold tracking-widest text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-0.5 rounded-full">VERIFIED</span>
                </div>
                <div className="flex justify-between items-start bg-surface-2 border border-line rounded-xl p-3 sm:p-3.5">
                  <div>
                    <div className="font-bold text-[13px] sm:text-[13.5px]">OEKO-TEX® Standard 100</div>
                    <div className="text-[11px] sm:text-[11.5px] text-muted mt-1">Class I · Cert: 12345678 Hohenstein</div>
                  </div>
                  <span className="text-[9px] font-bold tracking-widest text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-0.5 rounded-full">VERIFIED</span>
                </div>
                <div className="flex justify-between items-start bg-surface-2 border border-line rounded-xl p-3 sm:p-3.5">
                  <div>
                    <div className="font-bold text-[13px] sm:text-[13.5px]">BSCI Social Audit</div>
                    <div className="text-[11px] sm:text-[11.5px] text-muted mt-1">Facility: AKH Knitting · Rating: A · June 12, 2025</div>
                  </div>
                  <span className="text-[9px] font-bold tracking-widest text-green-dark bg-green-soft border border-[#BCD8C6] px-2 py-0.5 rounded-full">VERIFIED</span>
                </div>
              </div>
            </Reveal>
            
            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-5 sm:p-[26px]">
              <h3 className="text-[16px] font-bold mb-4">Logistics & Lifecycle</h3>
              <div className="grid gap-2.5">
                <div className="flex justify-between items-center bg-surface-2 border border-line rounded-xl p-3 px-4">
                  <span className="text-[10px] tracking-widest uppercase text-muted font-semibold">Sales Channel</span>
                  <span className="font-mono text-[12px] font-bold text-ink">Online</span>
                </div>
                <div className="flex justify-between items-center bg-surface-2 border border-line rounded-xl p-3 px-4">
                  <span className="text-[10px] tracking-widest uppercase text-muted font-semibold">Available From</span>
                  <span className="font-mono text-[12px] font-bold text-ink">Nov 15, 2025</span>
                </div>
                <div className="flex justify-between items-center bg-surface-2 border border-line rounded-xl p-3 px-4">
                  <span className="text-[10px] tracking-widest uppercase text-muted font-semibold">Usage Class</span>
                  <span className="font-mono text-[12px] font-bold text-ink">Personal</span>
                </div>
                <div className="flex justify-between items-center bg-surface-2 border border-line rounded-xl p-3 px-4">
                  <span className="text-[10px] tracking-widest uppercase text-muted font-semibold">After-Sale Support</span>
                  <span className="font-mono text-[10px] font-bold text-ink text-right">Repair · Dry Cleaning</span>
                </div>
              </div>
            </Reveal>

            <Reveal className="bg-surface border border-line rounded-[18px] shadow-custom p-[26px] flex flex-col">
              <h3 className="text-[16px] font-bold mb-1">Open Structured Data</h3>
              <p className="text-[12.5px] text-muted mb-4">Machine-readable DPP JSON export</p>
              <div className="flex-1 bg-ink text-[#B9C4BB] font-mono text-[11px] p-4 rounded-xl overflow-y-auto max-h-[220px]">
<pre><code>{`{
  "dppVersion": "2.4",
  "productId": "DPP-EU-TXT-151546",
  "gtin": "4006083730798",
  "productName": "Men&apos;s Shorty Pyjamas, Modal",
  "brand": "Tchibo GmbH",
  "completeness": 0.94,
  "materials": [
    { "type": "Cotton", "percentage": 48, "cert": "CmiA" },
    { "type": "Modal", "percentage": 47, "cert": "Birla" },
    { "type": "Elastane", "percentage": 5, "brand": "creora" }
  ],
  "environmental": {
    "carbonFootprint_kgCO2e": 4.8,
    "waterConsumption_L": 420
  }
}`}</code></pre>
              </div>
              <button className="mt-4 w-full bg-green text-white font-semibold text-[13px] py-2.5 rounded-xl transition-colors hover:bg-green-dark flex justify-center items-center gap-2 cursor-pointer">
                <Download size={16} /> Download Full JSON
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="mt-[80px] bg-ink text-[#B9C4BB] py-[44px]">
        <div className="max-w-[1120px] mx-auto px-[22px] flex gap-[30px] flex-wrap justify-between items-start">
          <div className="max-w-[280px]">
            <div className="font-display font-bold text-lime text-[16px] tracking-[0.06em]">TCHIBO · DPP</div>
            <p className="mt-2.5 text-[12px] leading-[1.9]">Digital Product Passport compiled from FiTS v4 (25 Aug 2025) and Bureau Veritas test report (6825)298-0551 (30 Oct 2025). Overall result: PASS.</p>
          </div>
          <div>
            <h5 className="text-[#F4F1EA] text-[13px] tracking-widest uppercase mb-2.5 font-semibold">Record</h5>
            <ul className="font-mono text-[11px] leading-[1.9]">
              <li>Project: 151546 · Order: 4300085070</li>
              <li>Articles: 730793 – 730802</li>
              <li>FiTS: v4 updated · 25 Aug 2025</li>
              <li>Lab report: 30 Oct 2025</li>
            </ul>
          </div>
          <div>
            <h5 className="text-[#F4F1EA] text-[13px] tracking-widest uppercase mb-2.5 font-semibold">Standards</h5>
            <ul className="text-[12px] leading-[1.9]">
              <li>ISO 1833 · DIN EN ISO 105 C06/E01/X12/B02/E04</li>
              <li>DIN EN ISO 14184-1 · EN ISO 14362-1 · ISO 22818</li>
              <li>EU 1007/2011 · REACh · Tchibo RSL Cat 1 v1/2024</li>
            </ul>
          </div>
          <div>
            <h5 className="text-[#F4F1EA] text-[13px] tracking-widest uppercase mb-2.5 font-semibold">Data honesty</h5>
            <ul className="text-[12px] leading-[1.9]">
              <li>Farm-level cotton & elastane polymer</li>
              <li>origin currently out of scope — updates</li>
              <li>pushed to this passport via SCOT.</li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1120px] mx-auto px-[22px] border-t border-[#2A362E] mt-[30px] pt-5 text-[11px] flex justify-between gap-3.5 flex-wrap">
          <span>Issuer: Tchibo GmbH, Überseering 18, 22297 Hamburg, Germany</span>
          <span>Markets: DE · AT · CZ · HU · SK · PL · CH · TR</span>
        </div>
      </footer>

      {/* Toast Notification */}
      <div className={`fixed bottom-[26px] left-1/2 -translate-x-1/2 bg-ink text-lime text-[12.5px] font-bold px-5 py-2.5 rounded-full pointer-events-none transition-all duration-300 z-50 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        Article number copied ✓
      </div>
    </>
  );
}
