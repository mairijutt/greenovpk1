import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, MoreVertical, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'login' | 'header';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'login',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Automatically suppress install controls when already running in standalone app mode
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      const outcome = await install();
      setInstalling(false);
      if (outcome === 'unavailable') {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      {variant === 'login' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          className={`w-full flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 ${className}`}
        >
          <span className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
              <Smartphone className="w-3.5 h-3.5" />
            </span>
            <span className="text-left">
              <span className="block text-xs font-extrabold text-emerald-950 leading-tight">
                {installing ? 'Opening Installer...' : 'Install Mobile App'}
              </span>
              <span className="block text-[10px] font-medium text-emerald-700/90">
                {isIOS
                  ? 'Add to iPhone / iPad Home Screen'
                  : isAndroid
                  ? 'Install GreenOva App on Android'
                  : 'Android & iOS App Experience'}
              </span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
            <Download className="w-3 h-3" />
            <span>Install</span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={installing}
          title="Install GreenOva Mobile App"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 hover:text-white border border-emerald-600/60 text-xs font-bold transition-colors cursor-pointer shadow-2xs ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">{installing ? 'Installing...' : 'Install App'}</span>
        </button>
      )}

      {/* Guided Installation Modal for iOS Safari & browsers without native prompt */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white text-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-950 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0">
                  <img
                    src="/pwa-192x192.png"
                    alt="GreenOva App"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Install GreenOva App</h3>
                  <p className="text-[11px] text-emerald-200/90">
                    Full-screen mobile app on Android &amp; iOS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install guide"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await install();
                    if (res === 'accepted') setShowGuideModal(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now</span>
                </button>
              )}

              {/* iPhone / iPad Safari Steps */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isIOS
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-900 text-xs">
                    iPhone &amp; iPad (Safari)
                  </span>
                  {isIOS && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      Your Device
                    </span>
                  )}
                </div>
                <ol className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Open this link in <strong>Safari</strong>, then tap the{' '}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                        <Share className="w-3 h-3" /> Share
                      </span>{' '}
                      button at the bottom bar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Scroll down and tap{' '}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 font-bold">
                        <PlusSquare className="w-3 h-3" /> Add to Home Screen
                      </span>{' '}
                      then tap <strong>Add</strong>.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Android Chrome / Edge Steps */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isAndroid && !isIOS
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/30'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-900 text-xs">
                    Android Phone (Chrome / Edge)
                  </span>
                  {isAndroid && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      Your Device
                    </span>
                  )}
                </div>
                <ol className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the browser menu{' '}
                      <span className="inline-flex items-center px-1 py-0.5 rounded bg-slate-200 text-slate-900 font-bold">
                        <MoreVertical className="w-3 h-3" />
                      </span>{' '}
                      in the top-right corner of Chrome.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Tap <strong>Install app</strong> or <strong>Add to Home screen</strong> to launch GreenOva like a native app.
                    </span>
                  </li>
                </ol>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Launches full-screen with home screen icon &amp; offline shell caching.</span>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
