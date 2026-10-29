import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatColor } from './StatCard';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: StatColor;
  badge?: string;
  actions?: React.ReactNode;
}

const iconColorMap: Record<StatColor, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/60' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/60' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200/60' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200/60' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/60' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/60' },
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'emerald',
  badge,
  actions,
}) => {
  const style = iconColorMap[iconColor] || iconColorMap.emerald;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div>
        {badge && (
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/60 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{badge}</span>
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2.5">
          <div className={`p-2 rounded-lg ${style.bg} ${style.text} border ${style.border}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span>{title}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
      </div>

      {actions && <div className="flex items-center flex-wrap gap-2.5">{actions}</div>}
    </div>
  );
};
