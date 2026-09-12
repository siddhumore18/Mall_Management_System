import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  iconBg = 'bg-emerald-50 border-emerald-200/80',
  iconColor = 'text-emerald-600',
  subtitle
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 group hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-xl ${iconBg} border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-2xs`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="font-tabular-nums text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </div>

        <div className="flex items-center justify-between text-xs font-mono pt-1">
          {change && (
            <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px] ${
              isPositive 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                : 'bg-rose-50 text-rose-700 border border-rose-200/80'
            }`}>
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}

          {subtitle && (
            <span className="text-slate-400 font-medium text-[11px]">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
