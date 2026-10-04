import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Edit3, 
  Trash2,
  RefreshCw,
  X
} from 'lucide-react';
import { InventoryItem, ItemCategory, LogisticsLocation } from '../types';
import { useAuth } from '../context/AuthContext';

interface InventoryViewProps {
  inventory: InventoryItem[];
  locations: LogisticsLocation[];
  onRefresh: () => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  locations,
  onRefresh,
  onUpdateItem,
  onDeleteItem
}) => {
  const { user, token, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Edit Stock Modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [reorderFormulaItem, setReorderFormulaItem] = useState<InventoryItem | null>(null);

  // New Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('Ammunition & Ordnance');
  const [newItemLocationId, setNewItemLocationId] = useState(locations[0]?.id || '');
  const [newItemStock, setNewItemStock] = useState(100);
  const [newItemMin, setNewItemMin] = useState(50);
  const [newItemMax, setNewItemMax] = useState(300);
  const [newItemDaily, setNewItemDaily] = useState(10);
  const [newItemLeadTime, setNewItemLeadTime] = useState(4);
  const [newItemUnit, setNewItemUnit] = useState('Units');

  const categories: ItemCategory[] = [
    'Ammunition & Ordnance',
    'POL (Petroleum, Oil, Lubricants)',
    'Rations & MRE',
    'Medical & Trauma',
    'Spare Parts & Maintenance',
    'Cold Weather & Mountaineering',
    'Tactical Communications'
  ];

  // Filtering
  const filteredItems = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.locationName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesLoc = selectedLocation === 'ALL' || item.locationId === selectedLocation;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    return matchesSearch && matchesCat && matchesLoc && matchesStatus;
  });

  const handleStockUpdate = async () => {
    if (!editingItem) return;
    await onUpdateItem(editingItem.id, { currentStock: Number(newStockValue) });
    setEditingItem(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'Item ID', 'Item Name', 'Category', 'Location', 'Current Stock', 'Unit',
      'Min Stock', 'Max Stock', 'Daily Consumption', 'Lead Time (Days)',
      'Predicted Demand 7d', 'Stockout Risk (%)', 'Status', 'Recommended Reorder'
    ];
    const rows = filteredItems.map(i => [
      i.itemId, `"${i.name}"`, `"${i.category}"`, `"${i.locationName}"`,
      i.currentStock, i.unit, i.minStock, i.maxStock, i.dailyConsumption, i.leadTimeDays,
      i.predictedDemand7d, i.stockoutRiskScore, i.status, i.recommendedReorder
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DefenceLogix_Inventory_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activeToken = token || (typeof window !== 'undefined' ? sessionStorage.getItem('defencelogix_jwt_token') : null);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          locationId: newItemLocationId,
          currentStock: newItemStock,
          minStock: newItemMin,
          maxStock: newItemMax,
          dailyConsumption: newItemDaily,
          leadTimeDays: newItemLeadTime,
          unit: newItemUnit
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Error creating item:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-white">
              PREDICTIVE INVENTORY INTELLIGENCE
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated Reorder Point calculation, Stockout Risk scoring, and replenishment recommendations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasPermission(['admin', 'inventory_manager']) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add SKU</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by SKU name, Item ID, or sector location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Location filter */}
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">All Sectors & Depots</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">All Supply Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
        >
          <option value="ALL">All Stock Statuses</option>
          <option value="CRITICAL">CRITICAL (&lt;50% Min)</option>
          <option value="LOW">LOW Stock</option>
          <option value="NORMAL">NORMAL Range</option>
          <option value="OVERSTOCKED">OVERSTOCKED</option>
        </select>
      </div>

      {/* Main Inventory Table */}
      <div className="hud-panel rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Displaying <strong className="text-cyan-400">{filteredItems.length}</strong> of {inventory.length} items
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Click on Reorder Point formula icon <Info className="w-3.5 h-3.5 inline text-cyan-400" /> to view mathematical breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Item ID / Name</th>
                <th className="py-3 px-3">Location Node</th>
                <th className="py-3 px-3">Current Stock</th>
                <th className="py-3 px-3">Min / Max</th>
                <th className="py-3 px-3">Daily Burn</th>
                <th className="py-3 px-3">Predicted Demand (7d)</th>
                <th className="py-3 px-3">Stockout Risk</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reorder Point</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredItems.map((item) => {
                const stockRatio = Math.min(100, Math.round((item.currentStock / item.maxStock) * 100));
                const isCritical = item.status === 'CRITICAL';
                const isLow = item.status === 'LOW';

                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isCritical ? 'bg-rose-950/20' : isLow ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Item Name & ID */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 font-sans">{item.name}</div>
                      <div className="text-[11px] text-cyan-400 flex items-center gap-1.5">
                        <span>{item.itemId}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{item.category}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 text-slate-300 font-sans">
                      {item.locationName}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          isCritical ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {item.currentStock.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.unit}</span>
                      </div>
                      {/* Visual Stock Bar */}
                      <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${stockRatio}%` }}
                        />
                      </div>
                    </td>

                    {/* Min / Max */}
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      <span>{item.minStock}</span> / <span className="text-slate-300">{item.maxStock}</span>
                    </td>

                    {/* Daily Consumption */}
                    <td className="py-3 px-3 text-slate-300">
                      {item.dailyConsumption} / day
                    </td>

                    {/* Predicted Demand */}
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      {item.predictedDemand7d} {item.unit}
                    </td>

                    {/* Stockout Risk */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.stockoutRiskScore >= 75 
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40' 
                          : item.stockoutRiskScore >= 50
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : item.stockoutRiskScore >= 25
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.stockoutRiskScore}% ({item.stockoutRiskCategory})
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : item.status === 'LOW'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : item.status === 'OVERSTOCKED'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Recommended Reorder & Formula Trigger */}
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setReorderFormulaItem(item)}
                        className="flex items-center gap-1.5 text-left text-slate-200 hover:text-cyan-300 group cursor-pointer"
                        title="Click to view AI Reorder Point Formula"
                      >
                        <span className="font-bold text-amber-400">
                          {item.recommendedReorder > 0 ? `+${item.recommendedReorder.toLocaleString()}` : '0 (OK)'}
                        </span>
                        <Info className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasPermission(['admin', 'inventory_manager', 'logistics_officer']) && (
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setNewStockValue(item.currentStock);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Adjust Stock Level"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission(['admin']) && (
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reorder Formula Inspection Modal (Requirement from user brief) */}
      {reorderFormulaItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="hud-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                <h3 className="font-heading text-lg font-bold text-white">
                  AI Reorder Point & Safety Stock Formula
                </h3>
              </div>
              <button 
                onClick={() => setReorderFormulaItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-cyan-300 font-bold text-sm">
                Reorder Point (ROP) = Expected Demand During Lead Time + Safety Stock
              </div>
              <p className="text-slate-400">
                ROP = (Daily Demand × Lead Time) + (Z × σ_d × √LeadTime)
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Selected Item:</span>
                <span className="text-white font-bold">{reorderFormulaItem.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Location Sector:</span>
                <span className="text-cyan-300">{reorderFormulaItem.locationName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Daily Demand (d):</span>
                <span className="text-white">{reorderFormulaItem.dailyConsumption} {reorderFormulaItem.unit}/day</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Supply Lead Time (L):</span>
                <span className="text-white">{reorderFormulaItem.leadTimeDays} days</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Expected Lead Time Demand:</span>
                <span className="text-white">{reorderFormulaItem.dailyConsumption * reorderFormulaItem.leadTimeDays} {reorderFormulaItem.unit}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Service Level Factor (Z-Score):</span>
                <span className="text-emerald-400 font-bold">2.33 (99.0% Readiness)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Calculated Safety Stock:</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round(2.33 * (reorderFormulaItem.dailyConsumption * 0.25) * Math.sqrt(reorderFormulaItem.leadTimeDays))} {reorderFormulaItem.unit}
                </span>
              </div>
              <div className="flex justify-between py-2 bg-slate-950 px-2 rounded font-bold text-sm">
                <span className="text-amber-400">Recommended Replenishment:</span>
                <span className="text-amber-400">{reorderFormulaItem.recommendedReorder} {reorderFormulaItem.unit}</span>
              </div>
            </div>

            <button
              onClick={() => setReorderFormulaItem(null)}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Close Formula Breakdown
            </button>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="hud-panel p-6 rounded-2xl max-w-md w-full space-y-4 border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading text-lg font-bold text-white">
                Adjust Physical Stock Level
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs font-mono space-y-1">
              <div className="text-slate-300 font-bold">{editingItem.name}</div>
              <div className="text-slate-400">{editingItem.locationName}</div>
              <div className="text-slate-400">Current in ledger: {editingItem.currentStock} {editingItem.unit}</div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                New Verified Stock Count ({editingItem.unit}):
              </label>
              <input
                type="number"
                value={newStockValue}
                onChange={(e) => setNewStockValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-base focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleStockUpdate}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Save & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateItem} className="hud-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-heading text-lg font-bold text-white">
                Register New Inventory SKU
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-mono block mb-1">Item Nomenclature / Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. 155mm Artillery HE Projectiles"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Target Location Node</label>
                  <select
                    value={newItemLocationId}
                    onChange={(e) => setNewItemLocationId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={newItemMin}
                    onChange={(e) => setNewItemMin(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={newItemMax}
                    onChange={(e) => setNewItemMax(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Daily Burn</label>
                  <input
                    type="number"
                    value={newItemDaily}
                    onChange={(e) => setNewItemDaily(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    value={newItemLeadTime}
                    onChange={(e) => setNewItemLeadTime(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Unit of Issue</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-mono text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-lg cursor-pointer"
              >
                Register SKU
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
