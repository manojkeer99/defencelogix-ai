import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layers, 
  Shield, 
  RefreshCw,
  X
} from 'lucide-react';
import { InventoryItem, LogisticsLocation, Vehicle, AlertItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface ReportsViewProps {
  inventory: InventoryItem[];
  locations: LogisticsLocation[];
  vehicles: Vehicle[];
  alerts: AlertItem[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  inventory,
  locations,
  vehicles,
  alerts
}) => {
  const { user, token } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState('Daily Logistics Report');
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<any | null>(null);

  const reportTypes = [
    { title: 'Daily Logistics Report', desc: 'Consolidated executive assessment of forward node readiness, burn rates and convoys' },
    { title: 'Inventory Report', desc: 'Detailed stock audit, safety stock thresholds and reorder point triggers' },
    { title: 'Demand Forecast Report', desc: '14-day ML projection horizon, weather multipliers, MAE/MAPE error metrics' },
    { title: 'Transport Report', desc: 'Fleet sorties, payload capacity utilization, route travel times and vehicle maintenance' },
    { title: 'Risk Report', desc: 'Sector stockout risks, pass weather closures and IoT sensor anomaly analysis' },
    { title: 'Monthly Analytics Report', desc: 'Multi-week historical demand trends, supply-demand equilibrium and strategic stockpile recommendations' }
  ];

  const handleGenerate = async (type: string) => {
    setSelectedReportType(type);
    setGenerating(true);

    try {
      const activeToken = token || (typeof window !== 'undefined' ? sessionStorage.getItem('defencelogix_jwt_token') : null);
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveReport(data.report);
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Report Title', 'Date', 'Prepared By', 'Total Locations', 'Total SKUs', 'Critical Stock Items', 'Active Convoys'];
    const row = [
      `"${selectedReportType}"`,
      new Date().toISOString(),
      `"${user?.name || 'Officer'}"`,
      locations.length,
      inventory.length,
      inventory.filter(i => i.status === 'CRITICAL').length,
      vehicles.filter(v => v.status === 'IN_TRANSIT').length
    ];
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `DefenceLogix_${selectedReportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-white">
              INTELLIGENT REPORT GENERATOR & EXPORT STUDIO
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated compilation of military logistics briefings with AI observations, tables & PDF/CSV outputs
          </p>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((rpt, idx) => (
          <div 
            key={idx}
            className="hud-panel p-5 rounded-xl flex flex-col justify-between hover:border-cyan-400/50 transition-all group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  DOCUMENT TEMPLATE #{idx + 1}
                </span>
                <FileText className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="font-heading font-bold text-base text-white">
                {rpt.title}
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {rpt.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => handleGenerate(rpt.title)}
                disabled={generating}
                className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generated Report Viewer Modal / Container */}
      {activeReport && (
        <div className="hud-panel p-6 rounded-2xl border-cyan-500/40 space-y-6">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-500/40 font-bold">
                  {activeReport.classification}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  REF: DSSC-26251-{Date.now().toString().slice(-6)}
                </span>
              </div>
              <h2 className="font-heading text-xl font-bold text-white mt-1">
                {activeReport.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Generated: {new Date(activeReport.generatedAt).toLocaleString()} • Officer: {activeReport.preparedBy} ({activeReport.role})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print / PDF</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setActiveReport(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
            <span className="text-cyan-400 font-bold uppercase tracking-wider block">
              1.0 Executive Operational Summary
            </span>
            <p className="text-slate-300 leading-relaxed font-sans">
              {activeReport.executiveSummary}
            </p>
          </div>

          {/* Statistical Breakdown Grid */}
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              2.0 Quantitative Logistics Telemetry
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Nodes Monitored</span>
                <div className="text-lg font-bold text-white mt-0.5">{activeReport.statistics.totalLocationsMonitored}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Total SKUs</span>
                <div className="text-lg font-bold text-white mt-0.5">{activeReport.statistics.totalInventorySkus}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Critical Alerts</span>
                <div className="text-lg font-bold text-rose-400 mt-0.5">{activeReport.statistics.criticalStockAlerts}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Active Convoys</span>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{activeReport.statistics.fleetActiveSorties}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Payload Capacity</span>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">{activeReport.statistics.totalTransportCapacityTons} T</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">AI Model Fit</span>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">94.2%</div>
              </div>
            </div>
          </div>

          {/* AI-Generated Observations & Recommended Actions (User requirement) */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 font-mono text-xs space-y-2">
            <span className="text-cyan-400 font-bold uppercase tracking-wider block">
              3.0 AI-Generated Actionable Directives & Observations
            </span>
            <ul className="space-y-1.5 text-slate-300">
              {activeReport.actionItems.map((action: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Critical Stocks Audit Table */}
          {activeReport.criticalItemsSample && activeReport.criticalItemsSample.length > 0 && (
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                4.0 Critical Stock Shortage Ledger
              </span>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Item Nomenclature</th>
                      <th className="py-2.5 px-3">Sector Location</th>
                      <th className="py-2.5 px-3">Current Reserves</th>
                      <th className="py-2.5 px-3">Safety Threshold</th>
                      <th className="py-2.5 px-3">Stockout Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeReport.criticalItemsSample.map((item: any, i: number) => (
                      <tr key={i} className="bg-slate-900/40">
                        <td className="py-2 px-3 text-white font-sans">{item.item}</td>
                        <td className="py-2 px-3 text-cyan-300">{item.location}</td>
                        <td className="py-2 px-3 text-rose-400 font-bold">{item.currentStock}</td>
                        <td className="py-2 px-3 text-slate-400">{item.minStock}</td>
                        <td className="py-2 px-3 text-rose-400">{item.riskScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
