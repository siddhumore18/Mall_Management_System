import React, { useState } from 'react';
import { TrendingUp, BarChart3, PieChart, Activity, ArrowUpRight, ShieldCheck, DollarSign } from 'lucide-react';

// ─── 1. ANIMATED BAR CHART WIDGET ───
interface BarData {
  label: string;
  value: number;
  subValue?: string;
  color?: string;
}

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: BarData[];
  height?: number;
  valuePrefix?: string;
}

export const BarChartWidget: React.FC<BarChartProps> = ({ title, subtitle, data, height = 180, valuePrefix = '₹' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="gold-card p-5 space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-amber-950 text-sm">{title}</h3>
          {subtitle && <p className="text-[11px] text-stone-500 font-medium">{subtitle}</p>}
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-900 flex items-center justify-center font-black">
          <BarChart3 className="w-4 h-4" />
        </div>
      </div>

      <div style={{ height: `${height}px` }} className="flex items-end gap-3 pt-6 pb-2 px-1 border-b border-amber-200/60 relative">
        {data.map((item, idx) => {
          const heightPercent = Math.round((item.value / maxValue) * 100);
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 bg-amber-950 text-amber-100 text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-lg z-20 whitespace-nowrap animate-slide-up">
                  {item.label}: {valuePrefix}{item.value.toLocaleString()} {item.subValue ? `(${item.subValue})` : ''}
                </div>
              )}

              {/* Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[42px] rounded-t-xl transition-all duration-500 ease-out relative ${
                  isHovered
                    ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400 shadow-md shadow-amber-500/30 scale-x-105'
                    : 'bg-gradient-to-t from-amber-600 to-amber-400 opacity-90'
                }`}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-amber-950 font-mono">
                  {item.value > 1000 ? `${(item.value / 1000).toFixed(0)}k` : item.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X Axis Labels */}
      <div className="flex justify-between items-center text-[10px] text-stone-600 font-bold px-1">
        {data.map((item, idx) => (
          <span key={idx} className="flex-1 text-center truncate px-0.5">{item.label}</span>
        ))}
      </div>
    </div>
  );
};


// ─── 2. SMOOTH AREA / LINE CHART WIDGET ───
interface AreaChartProps {
  title: string;
  subtitle?: string;
  points: number[];
  labels: string[];
  valuePrefix?: string;
}

export const AreaLineChartWidget: React.FC<AreaChartProps> = ({ title, subtitle, points, labels, valuePrefix = '₹' }) => {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  // Generate SVG Path
  const width = 500;
  const height = 140;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 30) - 15;
    return { x, y, val };
  });

  const pathD = coords.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '');
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="gold-card p-5 space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-amber-950 text-sm">{title}</h3>
          {subtitle && <p className="text-[11px] text-stone-500 font-medium">{subtitle}</p>}
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-900 flex items-center justify-center font-black">
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>

      <div className="relative pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
          <defs>
            <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D97706" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Fill Area */}
          <path d={areaD} fill="url(#amberGradient)" />

          {/* Stroke Path */}
          <path d={pathD} fill="none" stroke="#B45309" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {coords.map((pt, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={pt.x} cy={pt.y} r="5" fill="#78350F" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          ))}
        </svg>

        {/* X Axis Labels */}
        <div className="flex justify-between items-center text-[10px] text-stone-600 font-bold mt-2">
          {labels.map((lbl, idx) => (
            <span key={idx}>{lbl}</span>
          ))}
        </div>
      </div>
    </div>
  );
};


// ─── 3. DONUT / PIE DISTRIBUTION CHART WIDGET ───
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
}

export const DonutChartWidget: React.FC<DonutChartProps> = ({ title, subtitle, segments, centerLabel, centerValue }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="gold-card p-5 space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-amber-950 text-sm">{title}</h3>
          {subtitle && <p className="text-[11px] text-stone-500 font-medium">{subtitle}</p>}
        </div>
        <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-900 flex items-center justify-center font-black">
          <PieChart className="w-4 h-4" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        {/* Visual Progress Rings */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-stone-100"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {segments.map((seg, idx) => {
              const pct = total > 0 ? (seg.value / total) * 100 : 0;
              const prevPct = segments.slice(0, idx).reduce((sum, s) => sum + (total > 0 ? (s.value / total) * 100 : 0), 0);
              return (
                <path
                  key={idx}
                  stroke={seg.color}
                  strokeWidth="4.5"
                  strokeDasharray={`${pct}, 100`}
                  strokeDashoffset={`-${prevPct}`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  className="transition-all duration-700 ease-out"
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue && <span className="text-sm font-black text-amber-950 font-mono">{centerValue}</span>}
            {centerLabel && <span className="text-[9px] text-stone-500 font-bold uppercase">{centerLabel}</span>}
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-2 text-xs">
          {segments.map((seg, idx) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></div>
                  <span className="font-bold text-stone-800 truncate">{seg.label}</span>
                </div>
                <span className="font-extrabold text-amber-950 font-mono">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
