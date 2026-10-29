import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export type StatColor = 'emerald' | 'amber' | 'rose' | 'blue' | 'teal' | 'indigo' | 'sky' | 'slate' | 'purple';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  color?: StatColor;
  valueColor?: string;
  badge?: {
    text: string;
    color?: StatColor;
  };
  subtext?: string;
  trend?: {
    value: string;
    isUp?: boolean;
    neutral?: boolean;
  };
  className?: string;
}

const colorMap: Record<StatColor, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
};

const badgeColorMap: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-800',
  blue: 'bg-blue-100 text-blue-800',
  teal: 'bg-teal-100 text-teal-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  sky: 'bg-sky-100 text-sky-800',
  slate: 'bg-slate-100 text-slate-700',
  purple: 'bg-purple-100 text-purple-800',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  color = 'emerald',
  valueColor = 'text-slate-900',
  badge,
  subtext,
  trend,
  className = '',
}) => {
  const iconStyle = colorMap[color] || colorMap.emerald;

  return (
    <div
      className={`bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${iconStyle.bg} ${iconStyle.text}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className={`text-2xl font-black ${valueColor} flex items-baseline space-x-1.5`}>
        <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
      </div>
      {(badge || subtext || trend) && (
        <div className="mt-2 flex items-center flex-wrap text-xs text-slate-500">
          {badge && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${
                badgeColorMap[badge.color || 'emerald'] || badgeColorMap.emerald
              }`}
            >
              {badge.text}
            </span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center font-bold mr-1.5 ${
                trend.neutral
                  ? 'text-slate-600'
                  : trend.isUp
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {!trend.neutral && (
                trend.isUp ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )
              )}
              {trend.value}
            </span>
          )}
          {subtext && <span className="text-slate-500">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
