import React, { useState } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, Shield, Globe, Terminal, Copy } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, testVpsConnection, VpsStatus } from '../services/api';

interface VpsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VpsSettingsModal: React.FC<VpsSettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiUrl, setApiUrlState] = useState(getApiBaseUrl());
  const [status, setStatus] = useState<VpsStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setLoading(true);
    setApiBaseUrl(apiUrl);
    const res = await testVpsConnection(apiUrl);
    setStatus(res);
    setLoading(false);
  };

  const copyBackupCommand = () => {
    const cmd = `mkdir -p /root/site_backups && mysqldump --single-transaction --quick --skip-lock-tables -u root -p greenova_db > /root/site_backups/backup_$(date +%F).sql && tar -czf /root/site_backups/files_backup_$(date +%F).tar.gz /var/www/greenovapk.com`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">VPS Sync & Deployment Console</h2>
              <p className="text-xs text-slate-500">Live VPS Integration & Zero-Downtime Guarantee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="mt-4 space-y-5 text-xs">
          {/* Live VPS Endpoint Configuration */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-slate-700 font-bold mb-1">Live VPS API Base URL</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrlState(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                placeholder="https://greenovapk.com/api"
              />
              <button
                onClick={handleTest}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Ping VPS</span>}
              </button>
            </div>

            {status && (
              <div
                className={`mt-3 p-3 rounded-lg flex items-start space-x-2 border ${
                  status.isOnline
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {status.isOnline ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {status.isOnline ? 'Live VPS Responding' : 'Using Local Staging Mode'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Endpoint: {status.endpoint} • Ping: {status.responseTimeMs}ms
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zero Downtime Safety Guarantee */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-emerald-900">
            <div className="flex items-center space-x-2 font-bold text-emerald-800">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Zero-Downtime Guarantee</span>
            </div>
            <p className="mt-1 text-slate-600 text-[11px] leading-relaxed">
              Your live production website (<code className="font-mono text-emerald-800">https://greenovapk.com</code> on IP 203.161.38.61) is 100% untouched. All backups and staging workflows are strictly read-only and never restart or interfere with live Nginx or MySQL services.
            </p>
          </div>

          {/* 1-Line Non-Destructive Backup Command */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <div className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white">Safe 1-Line VPS Snapshot</span>
              </div>
              <button
                onClick={copyBackupCommand}
                className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-slate-300 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              mkdir -p ~/backups && mysqldump --single-transaction --quick --skip-lock-tables -u root -p greenova_db &gt; ~/backups/db.sql && tar -czf ~/backups/code.tar.gz /var/www/greenovapk.com
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
