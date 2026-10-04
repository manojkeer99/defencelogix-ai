import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirmReset();
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="hud-panel p-6 rounded-2xl max-w-md w-full space-y-4 border-amber-500/50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h3 className="font-heading text-lg font-bold text-white">
              Reset Synthetic Demo Dataset
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            This will instantly re-seed all 10 synthetic logistics nodes, 50+ inventory items, 1,000+ demand history records, 20 vehicles, and simulated IoT sensor readings back to default demonstration values.
          </span>
        </div>

        <div className="space-y-1 text-xs font-mono text-slate-300">
          <div>• 10 Synthetic Logistics Nodes & Coordinates</div>
          <div>• 50+ Inventory SKUs with Reorder Points</div>
          <div>• 1,000+ Time-Series Demand Records</div>
          <div>• 20 Military Fleet Transport Vehicles</div>
          <div>• 12 IoT Storage Sensors & Telemetry</div>
        </div>

        {success ? (
          <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Dataset successfully re-seeded!</span>
          </div>
        ) : (
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Re-seeding...' : 'Confirm Reset'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
