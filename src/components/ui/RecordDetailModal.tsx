import React, { useState } from 'react';
import { X, Edit, Trash2, Paperclip, Eye } from 'lucide-react';

export interface RecordDetailField {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
  fullWidth?: boolean;
}

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'indigo' | 'slate';
  };
  fields: RecordDetailField[];
  notes?: string;
  attachment?: {
    data?: string | null;
    name?: string | null;
  };
  onEdit?: () => void;
  onDelete?: () => Promise<void> | void;
}

const badgeStyles: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  rose: 'bg-rose-100 text-rose-800 border-rose-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  fields,
  notes,
  attachment,
  onEdit,
  onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const isImageAttachment =
    attachment?.data &&
    (attachment.data.startsWith('data:image/') ||
      /\.(png|jpe?g|gif|webp)$/i.test(attachment.data));

  const handleConfirmDelete = async () => {
    if (!onDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      await onDelete();
      setConfirmDelete(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
                {badge && (
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      badgeStyles[badge.color || 'slate']
                    }`}
                  >
                    {badge.text}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail view"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {fields.map((f, idx) => (
            <div
              key={`${f.label}-${idx}`}
              className={`p-3 rounded-xl border ${
                f.highlight
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-slate-50/70 border-slate-200/80'
              } ${f.fullWidth ? 'sm:col-span-2' : ''}`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {f.label}
              </div>
              <div
                className={`mt-1 text-sm font-bold ${
                  f.highlight ? 'text-emerald-900' : 'text-slate-900'
                } ${f.mono ? 'font-mono' : ''} break-words`}
              >
                {f.value ?? '—'}
              </div>
            </div>
          ))}
        </div>

        {notes !== undefined && notes !== '' && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
              Notes / Remarks
            </div>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{notes}</p>
          </div>
        )}

        {(attachment?.data || attachment?.name) && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attachment {attachment.name ? `— ${attachment.name}` : ''}</span>
            </div>
            {isImageAttachment && attachment.data ? (
              <img
                src={attachment.data}
                alt={attachment.name || 'Record attachment'}
                className="max-h-60 rounded-lg border border-slate-200 object-contain bg-white"
              />
            ) : (
              <div className="text-slate-700 font-medium">
                {attachment.name || 'Attached receipt / challan document'}
              </div>
            )}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onDelete && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
            {onDelete && confirmDelete && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="font-bold text-rose-900">Confirm Delete?</span>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  No
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Record</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
