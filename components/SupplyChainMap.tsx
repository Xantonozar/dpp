'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Ship, Plane, Search, Check, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

interface DestinationData {
  country: string;
  city: string;
  label: string;
  lat: number;
  lng: number;
  transportMode?: string;
  distanceKm?: number;
}

interface SupplyChainMapProps {
  origin?: {
    country: string;
    city: string;
    facility: string;
    lat: number;
    lng: number;
  };
  destination?: DestinationData;
  testingLabName?: string;
  testingReportNo?: string;
  onUpdateDestination?: (dest: DestinationData) => void;
  isEditable?: boolean;
}

// Coordinate database for common export destinations from Bangladesh
const CITY_COORDINATES: Record<string, { country: string; city: string; lat: number; lng: number; mode: string }> = {
  'hamburg': { country: 'Germany', city: 'Hamburg', lat: 53.5511, lng: 9.9937, mode: 'Maritime Sea Freight' },
  'germany hamburg': { country: 'Germany', city: 'Hamburg', lat: 53.5511, lng: 9.9937, mode: 'Maritime Sea Freight' },
  'hamburg, germany': { country: 'Germany', city: 'Hamburg', lat: 53.5511, lng: 9.9937, mode: 'Maritime Sea Freight' },
  'berlin': { country: 'Germany', city: 'Berlin', lat: 52.5200, lng: 13.4050, mode: 'Sea Freight + Rail' },
  'frankfurt': { country: 'Germany', city: 'Frankfurt', lat: 50.1109, lng: 8.6821, mode: 'Air & Multimodal' },
  'munich': { country: 'Germany', city: 'Munich', lat: 48.1351, lng: 11.5820, mode: 'Sea Freight + Rail' },
  'rotterdam': { country: 'Netherlands', city: 'Rotterdam', lat: 51.9244, lng: 4.4777, mode: 'Port of Rotterdam (Sea)' },
  'amsterdam': { country: 'Netherlands', city: 'Amsterdam', lat: 52.3676, lng: 4.9041, mode: 'Sea & Inland Water' },
  'paris': { country: 'France', city: 'Paris', lat: 48.8566, lng: 2.3522, mode: 'Sea Freight via Le Havre' },
  'london': { country: 'United Kingdom', city: 'London', lat: 51.5074, lng: -0.1278, mode: 'Port of Felixstowe' },
  'antwerp': { country: 'Belgium', city: 'Antwerp', lat: 51.2194, lng: 4.4025, mode: 'Port of Antwerp (Sea)' },
  'warsaw': { country: 'Poland', city: 'Warsaw', lat: 52.2297, lng: 21.0122, mode: 'Intermodal Rail/Sea' },
  'prague': { country: 'Czech Republic', city: 'Prague', lat: 50.0755, lng: 14.4378, mode: 'Sea via Hamburg + Rail' },
  'vienna': { country: 'Austria', city: 'Vienna', lat: 48.2082, lng: 16.3738, mode: 'Intermodal Rail' },
  'milan': { country: 'Italy', city: 'Milan', lat: 45.4642, lng: 9.1900, mode: 'Port of Genoa / Trieste' },
  'madrid': { country: 'Spain', city: 'Madrid', lat: 40.4168, lng: -3.7038, mode: 'Port of Valencia' },
  'stockholm': { country: 'Sweden', city: 'Stockholm', lat: 59.3293, lng: 18.0686, mode: 'Baltic Sea Feeder' },
  'copenhagen': { country: 'Denmark', city: 'Copenhagen', lat: 55.6761, lng: 12.5683, mode: 'North Sea Feeder' },
  'new york': { country: 'United States', city: 'New York', lat: 40.7128, lng: -74.0060, mode: 'Atlantic Sea Freight' },
  'los angeles': { country: 'United States', city: 'Los Angeles', lat: 34.0522, lng: -118.2437, mode: 'Pacific Sea Freight' },
  'toronto': { country: 'Canada', city: 'Toronto', lat: 43.6532, lng: -79.3832, mode: 'Intermodal Sea/Rail' },
  'tokyo': { country: 'Japan', city: 'Tokyo', lat: 35.6762, lng: 139.6503, mode: 'Pacific Sea Freight' },
  'singapore': { country: 'Singapore', city: 'Singapore', lat: 1.3521, lng: 103.8198, mode: 'Port of Singapore (Direct)' },
  'dubai': { country: 'UAE', city: 'Dubai', lat: 25.2048, lng: 55.2708, mode: 'Middle East Sea Hub' },
  'istanbul': { country: 'Turkey', city: 'Istanbul', lat: 41.0082, lng: 28.9784, mode: 'Black Sea / Med Sea' }
};

// Calculate approximate great circle distance in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Convert Lat/Lng to SVG coordinate box (viewBox: 0 0 1000 500)
// Using Equirectangular projection bounded roughly for Europe/Asia/Africa
function projectToSvg(lat: number, lng: number): { x: number; y: number } {
  // Map longitude: -30 to 150 -> x: 60 to 940
  // Map latitude: -10 to 70 -> y: 440 to 60
  const minLng = -25;
  const maxLng = 145;
  const minLat = -10;
  const maxLat = 68;

  const clampedLng = Math.max(minLng, Math.min(maxLng, lng));
  const clampedLat = Math.max(minLat, Math.min(maxLat, lat));

  const x = 50 + ((clampedLng - minLng) / (maxLng - minLng)) * 900;
  const y = 450 - ((clampedLat - minLat) / (maxLat - minLat)) * 400;

  return { x: Math.round(x), y: Math.round(y) };
}

export default function SupplyChainMap({
  origin = {
    country: 'Bangladesh',
    city: 'Chittagong / Savar, Dhaka',
    facility: 'AKH Knitting & Dyeing Ltd.',
    lat: 23.8103,
    lng: 90.4125
  },
  destination = {
    country: 'Germany',
    city: 'Hamburg',
    label: 'Hamburg Central Logistics Hub, Germany',
    lat: 53.5511,
    lng: 9.9937,
    transportMode: 'Maritime Sea Freight via Port of Chittagong',
    distanceKm: 14200
  },
  testingLabName = 'ITS Labtest Bangladesh Ltd.',
  testingReportNo = 'BGDT25154711',
  onUpdateDestination,
  isEditable = true
}: SupplyChainMapProps) {
  const [inputVal, setInputVal] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Compute positions
  const originCoord = useMemo(() => projectToSvg(origin.lat, origin.lng), [origin.lat, origin.lng]);
  const destCoord = useMemo(() => projectToSvg(destination.lat, destination.lng), [destination.lat, destination.lng]);

  // Compute curved path
  const curvePath = useMemo(() => {
    const { x: x1, y: y1 } = originCoord;
    const { x: x2, y: y2 } = destCoord;

    // Midpoint with curve offset (trade sea route curves through Indian Ocean / Suez / Med)
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 + 50; // curve downwards to simulate maritime route

    return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
  }, [originCoord, destCoord]);

  // Distance
  const distanceKm = useMemo(() => {
    if (destination.distanceKm) return destination.distanceKm;
    return calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  }, [origin, destination]);

  const handleApplyDestination = (query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) return;

    // Check in database
    let match = CITY_COORDINATES[clean];

    if (!match) {
      // Fuzzy search in keys
      const foundKey = Object.keys(CITY_COORDINATES).find(
        k => k.includes(clean) || clean.includes(k)
      );
      if (foundKey) {
        match = CITY_COORDINATES[foundKey];
      }
    }

    if (match) {
      const calculatedDist = calculateDistance(origin.lat, origin.lng, match.lat, match.lng);
      const newDest: DestinationData = {
        country: match.country,
        city: match.city,
        label: `${match.city} Port / Logistics Hub, ${match.country}`,
        lat: match.lat,
        lng: match.lng,
        transportMode: match.mode,
        distanceKm: calculatedDist
      };
      onUpdateDestination?.(newDest);
      setSearchFeedback(`Route updated to ${match.city}, ${match.country}!`);
      setTimeout(() => setSearchFeedback(null), 3000);
      setInputVal('');
    } else {
      // Fallback: create custom destination with estimated European/global coords
      const parts = query.split(/[ ,]+/);
      const city = parts[0] || 'Custom City';
      const country = parts.slice(1).join(' ') || 'Europe';
      const newDest: DestinationData = {
        country: country.charAt(0).toUpperCase() + country.slice(1),
        city: city.charAt(0).toUpperCase() + city.slice(1),
        label: `${city}, ${country}`,
        lat: 50.0,
        lng: 10.0,
        transportMode: 'Maritime Sea Freight + Trucking',
        distanceKm: 13500
      };
      onUpdateDestination?.(newDest);
      setSearchFeedback(`Custom destination set to ${newDest.city}, ${newDest.country}!`);
      setTimeout(() => setSearchFeedback(null), 3000);
      setInputVal('');
    }
  };

  const quickPresets = [
    { label: 'Hamburg, Germany 🇩🇪', q: 'hamburg' },
    { label: 'Berlin, Germany 🇩🇪', q: 'berlin' },
    { label: 'Rotterdam, Netherlands 🇳🇱', q: 'rotterdam' },
    { label: 'Paris, France 🇫🇷', q: 'paris' },
    { label: 'London, UK 🇬🇧', q: 'london' },
    { label: 'Warsaw, Poland 🇵🇱', q: 'warsaw' }
  ];

  return (
    <div id="supply-chain-map-container" className="bg-[#121A16] border border-[#203328] rounded-[22px] overflow-hidden text-white shadow-2xl">
      {/* Top Banner & Title */}
      <div className="p-5 sm:p-6 border-b border-[#203328] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#121A16] via-[#16231D] to-[#121A16]">
        <div>
          <div className="flex items-center gap-2 text-lime text-[11px] font-bold tracking-[0.12em] uppercase mb-1">
            <Globe size={14} className="animate-spin text-lime" style={{ animationDuration: '12s' }} />
            <span>Interactive Supply Chain & Maritime Journey</span>
          </div>
          <h3 className="text-[19px] sm:text-[22px] font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Bangladesh 🇧🇩</span>
            <ArrowRight size={18} className="text-lime" />
            <span className="text-lime">{destination.city}, {destination.country}</span>
          </h3>
          <p className="text-[12.5px] text-[#8EAA97] mt-0.5">
            Traceability route from manufacturing in Bangladesh to European retail distribution
          </p>
        </div>

        {/* Live Lab & Status Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#1C2C23] border border-[#2D4738] rounded-xl px-3.5 py-2 text-left">
            <div className="text-[10px] uppercase tracking-wider text-[#8EAA97] font-semibold">Testing Authority</div>
            <div className="text-[12px] font-bold text-white flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-lime" />
              <span>{testingLabName}</span>
            </div>
          </div>
          <div className="bg-lime text-[#121A16] rounded-xl px-3.5 py-2 font-bold text-[12px] flex items-center gap-1.5 shadow-md">
            <span>PASS</span>
            <span className="text-[10px] font-mono opacity-80">#{testingReportNo}</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative w-full h-[280px] sm:h-[360px] bg-[#0E1512] overflow-hidden select-none">
        {/* Subtle Map Background Grid */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(#5FA47F 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* SVG World Projection Map Graphic */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full object-cover pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8CE85D" />
              <stop offset="50%" stopColor="#5FA47F" />
              <stop offset="100%" stopColor="#5DADE2" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Stylized Continent Silhouettes */}
          <g fill="#17231D" stroke="#22362C" strokeWidth="0.8" opacity="0.8">
            {/* Europe */}
            <path d="M 390 120 Q 450 100 500 130 Q 520 170 480 200 Q 420 220 380 180 Z" />
            <path d="M 460 80 Q 490 60 520 90 Q 500 120 470 110 Z" /> {/* Scandinavia */}
            <path d="M 370 140 Q 400 130 400 170 Q 360 170 370 140 Z" /> {/* UK */}

            {/* Africa */}
            <path d="M 420 230 Q 530 220 540 310 Q 510 420 440 430 Q 380 340 420 230 Z" />

            {/* Asia */}
            <path d="M 520 140 Q 640 100 780 120 Q 860 180 820 260 Q 720 280 620 250 Q 550 220 520 140 Z" />
            <path d="M 640 240 Q 700 240 680 330 Q 620 320 640 240 Z" /> {/* India */}
            
            {/* Bangladesh outline highlight */}
            <path 
              d="M 695 240 L 715 240 L 718 255 L 700 260 Z" 
              fill="#1C3827" 
              stroke="#5FA47F" 
              strokeWidth="1.5" 
            />

            {/* South East Asia */}
            <path d="M 720 260 Q 770 280 750 360 Q 710 320 720 260 Z" />
          </g>

          {/* Shipping Lane Curvature */}
          <path
            d={curvePath}
            fill="none"
            stroke="#1C2E25"
            strokeWidth="4"
          />
          <path
            d={curvePath}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Animated Vessel Icon on Midpoint of Journey */}
          <g transform={`translate(${(originCoord.x + destCoord.x) / 2 - 12}, ${(originCoord.y + destCoord.y) / 2 + 15})`}>
            <circle cx="12" cy="12" r="14" fill="#121A16" stroke="#8CE85D" strokeWidth="1.5" />
            <Ship x="4" y="4" width="16" height="16" className="text-lime" />
          </g>

          {/* Origin: Bangladesh (Dhaka/Chittagong) */}
          <g transform={`translate(${originCoord.x}, ${originCoord.y})`} filter="url(#glow)">
            {/* Pulse rings */}
            <circle cx="0" cy="0" r="14" fill="#8CE85D" opacity="0.25">
              <animate attributeName="r" values="6;22;6" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="7" fill="#8CE85D" stroke="#121A16" strokeWidth="2" />
          </g>

          {/* Destination Pin */}
          <g transform={`translate(${destCoord.x}, ${destCoord.y})`} filter="url(#glow)">
            <circle cx="0" cy="0" r="14" fill="#5DADE2" opacity="0.25">
              <animate attributeName="r" values="6;20;6" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="0" cy="0" r="7" fill="#5DADE2" stroke="#121A16" strokeWidth="2" />
          </g>
        </svg>

        {/* Origin Overlay Label */}
        <div 
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(originCoord.x / 1000) * 100}%`,
            top: `${(originCoord.y / 500) * 100 - 4}%`
          }}
        >
          <div className="bg-[#121A16]/95 border border-[#8CE85D]/60 rounded-lg px-2.5 py-1.5 shadow-xl text-center backdrop-blur-sm whitespace-nowrap">
            <div className="text-[10px] font-bold text-lime flex items-center justify-center gap-1">
              <span>🇧🇩 ORIGIN</span>
            </div>
            <div className="text-[11px] font-semibold text-white">Chittagong / Savar, BD</div>
            <div className="text-[9.5px] text-[#A0B8A8]">{origin.facility}</div>
          </div>
        </div>

        {/* Destination Overlay Label */}
        <div 
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(destCoord.x / 1000) * 100}%`,
            top: `${(destCoord.y / 500) * 100 - 4}%`
          }}
        >
          <div className="bg-[#121A16]/95 border border-[#5DADE2]/60 rounded-lg px-2.5 py-1.5 shadow-xl text-center backdrop-blur-sm whitespace-nowrap">
            <div className="text-[10px] font-bold text-[#5DADE2] flex items-center justify-center gap-1">
              <span>📍 DESTINATION</span>
            </div>
            <div className="text-[11px] font-semibold text-white">{destination.city}, {destination.country}</div>
            <div className="text-[9.5px] text-[#A0B8A8]">{destination.transportMode || 'Maritime Logistics'}</div>
          </div>
        </div>

        {/* Bottom Floating Stats Pill */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap gap-2">
          <div className="bg-[#121A16]/90 border border-[#203328] backdrop-blur-md rounded-xl px-3.5 py-2 flex items-center gap-3 text-[11.5px]">
            <div className="flex items-center gap-1.5 text-lime font-mono font-bold">
              <Ship size={14} />
              <span>~{distanceKm.toLocaleString()} KM</span>
            </div>
            <span className="text-[#364F3E]">|</span>
            <div className="text-[#8EAA97]">
              Transit: <strong className="text-white">~28 Days Sea Freight</strong>
            </div>
            <span className="text-[#364F3E] hidden sm:inline">|</span>
            <div className="text-[#8EAA97] hidden sm:block">
              Origin Port: <strong className="text-white">Port of Chittagong (BD)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Destination Input & Quick Selector */}
      {isEditable && (
        <div className="p-4 sm:p-5 bg-[#15201A] border-t border-[#203328]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <div className="text-[12.5px] font-semibold text-white flex items-center gap-2">
              <MapPin size={15} className="text-lime" />
              <span>Manually Change Destination (BD ➔ Your Location):</span>
            </div>
            {searchFeedback && (
              <span className="text-[11.5px] text-lime font-medium bg-[#1C2C23] px-2.5 py-1 rounded-full border border-lime/30">
                {searchFeedback}
              </span>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleApplyDestination(inputVal);
            }}
            className="flex gap-2 mb-3"
          >
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5FA47F]" />
              <input
                id="destination-input-field"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type any city or country (e.g., Germany Hamburg, Berlin, Paris, Rotterdam, London)..."
                className="w-full bg-[#0E1512] border border-[#273F31] rounded-xl py-2.5 pl-10 pr-3.5 text-[13px] text-white placeholder-[#587262] outline-none focus:border-lime focus:ring-1 focus:ring-lime transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-lime text-[#121A16] hover:bg-lime/90 font-bold text-[12.5px] px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Navigation size={14} />
              <span>Update Route</span>
            </button>
          </form>

          {/* Quick Click Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-[#718F7B] font-medium">Popular destinations:</span>
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyDestination(preset.q)}
                className={`text-[11.5px] px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  destination.city.toLowerCase().includes(preset.q)
                    ? 'bg-lime text-[#121A16] border-lime font-bold'
                    : 'bg-[#1C2C23] text-[#A6C4B0] border-[#2B4335] hover:border-lime hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4 Tiers Grid Overview directly under the Map */}
      <div className="p-4 sm:p-5 bg-[#101713] border-t border-[#203328] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tier 3 */}
        <div className="p-3.5 rounded-xl bg-[#15201A] border border-[#203328]">
          <div className="text-[10px] font-bold text-lime uppercase tracking-widest mb-1">Tier 3 · Fibre & Yarn</div>
          <div className="text-[13px] font-bold text-white mb-0.5">Yarn Sourcing</div>
          <p className="text-[11.5px] text-[#8EAA97] leading-relaxed">
            Cotton made in Africa, Birla Viscose (India), creora® elastane (Hyosung).
          </p>
        </div>

        {/* Tier 2 */}
        <div className="p-3.5 rounded-xl bg-[#15201A] border border-[#203328]">
          <div className="text-[10px] font-bold text-lime uppercase tracking-widest mb-1">Tier 2 · Fabric Mill</div>
          <div className="text-[13px] font-bold text-white mb-0.5">Knitting & Dyeing</div>
          <p className="text-[11.5px] text-[#8EAA97] leading-relaxed">
            AKH Knitting & Dyeing Ltd., Narayanganj, Bangladesh. 180 g/m² single jersey.
          </p>
        </div>

        {/* Tier 1 */}
        <div className="p-3.5 rounded-xl bg-[#15201A] border border-[#203328]">
          <div className="text-[10px] font-bold text-lime uppercase tracking-widest mb-1">Tier 1 · Assembly</div>
          <div className="text-[13px] font-bold text-white mb-0.5">Garment Assembly (CMT)</div>
          <p className="text-[11.5px] text-[#8EAA97] leading-relaxed">
            AKH Knitting & Dyeing Ltd., Savar, Dhaka, Bangladesh. Cut, Make & Trim.
          </p>
        </div>

        {/* Quality Lab */}
        <div className="p-3.5 rounded-xl bg-[#15201A] border border-lime/30 bg-gradient-to-br from-[#15201A] to-[#1C2C23]">
          <div className="text-[10px] font-bold text-lime uppercase tracking-widest mb-1">Testing Authority</div>
          <div className="text-[13px] font-bold text-white mb-0.5">{testingLabName}</div>
          <p className="text-[11.5px] text-[#8EAA97] leading-relaxed">
            Report <strong>#{testingReportNo}</strong> · Overall Result: <strong className="text-lime">PASS</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
