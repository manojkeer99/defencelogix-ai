import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icon paths for Vite asset bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

import { 
  Map, 
  MapPin, 
  Radio, 
  CloudSnow, 
  AlertTriangle,
  ArrowRight,
  Battery,
  CheckCircle2,
  Compass,
  BellRing
} from 'lucide-react';
import { LogisticsLocation, LogisticsRoute, InventoryItem, Vehicle, IoTSensorNode, AlertItem } from '../types';

interface GisMapViewProps {
  locations: LogisticsLocation[];
  routes: LogisticsRoute[];
  inventory: InventoryItem[];
  vehicles: Vehicle[];
  sensors?: IoTSensorNode[];
  alerts?: AlertItem[];
  setCurrentTab: (tab: string) => void;
}

export const GisMapView: React.FC<GisMapViewProps> = ({
  locations,
  routes,
  inventory,
  vehicles,
  sensors = [],
  alerts = [],
  setCurrentTab
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<LogisticsLocation | null>(locations[0] || null);
  const [selectedRoute, setSelectedRoute] = useState<LogisticsRoute | null>(routes[0] || null);
  const [inspectionMode, setInspectionMode] = useState<'location' | 'route'>('location');
  const [activeLayers, setActiveLayers] = useState({
    supplyNetwork: true,
    inventoryRisk: true,
    demandHeatmap: false,
    routeConditions: true
  });

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [31.8, 77.0],
      zoom: 7,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Render Routes
    if (activeLayers.supplyNetwork) {
      routes.forEach((route) => {
        const isDegraded = route.status === 'DEGRADED';
        const isBlocked = route.status === 'INCLEMENT_WEATHER' || route.status === 'PASS_BLOCKED';
        const routeColor = isBlocked ? '#f43f5e' : isDegraded ? '#f59e0b' : '#06b6d4';

        const polyline = L.polyline(route.coordinates, {
          color: routeColor,
          weight: activeLayers.routeConditions ? 4 : 2,
          opacity: 0.85,
          dashArray: isBlocked ? '8, 8' : isDegraded ? '4, 6' : undefined
        }).addTo(map);

        polyline.on('click', () => {
          setSelectedRoute(route);
          setInspectionMode('route');
        });

        polyline.bindTooltip(`
          <div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.4;">
            <div style="font-weight: bold; color: #38bdf8;">${route.routeCode}</div>
            <div>Corridor: ${route.sourceName} &rarr; ${route.destinationName}</div>
            <div>Transit: <strong>~${route.currentTravelHours} hrs</strong> (${route.distanceKm} km)</div>
            <div>Status: <span style="color: ${routeColor}; font-weight: bold;">${route.status}</span></div>
          </div>
        `, { sticky: true });
      });
    }

    // Render Location Nodes
    locations.forEach((loc) => {
      const isCritical = loc.riskLevel === 'CRITICAL';
      const isHigh = loc.riskLevel === 'HIGH';
      const isMed = loc.riskLevel === 'MEDIUM';

      const markerColor = isCritical ? '#ef4444' : isHigh ? '#f97316' : isMed ? '#06b6d4' : '#10b981';
      const radius = loc.type === 'central_depot' ? 14 : loc.type === 'regional_depot' ? 11 : 8;

      const locItems = inventory.filter(i => i.locationId === loc.id);
      const critItems = locItems.filter(i => i.status === 'CRITICAL');
      const wData = loc.weatherData;
      const weatherTemp = wData ? wData.temperatureC : loc.temperatureC;
      const weatherCond = wData ? wData.weatherCondition : loc.weatherCondition;

      if (activeLayers.demandHeatmap) {
        L.circle([loc.coordinates.lat, loc.coordinates.lng], {
          radius: (loc.currentOccupancyTons / loc.storageCapacityTons) * 35000,
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);
      }

      const circleMarker = L.circleMarker([loc.coordinates.lat, loc.coordinates.lng], {
        radius,
        color: markerColor,
        weight: 2.5,
        fillColor: markerColor,
        fillOpacity: 0.85
      }).addTo(map);

      circleMarker.on('click', () => {
        setSelectedLocation(loc);
        setInspectionMode('location');
      });

      circleMarker.bindTooltip(`
        <div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.4;">
          <div style="font-weight: bold; color: #fff;">${loc.name}</div>
          <div>Elevation: <strong>${loc.altitudeMeters}m</strong> (${loc.terrainType})</div>
          <div>Weather: <strong style="color: #38bdf8;">${weatherTemp}°C, ${weatherCond}</strong></div>
          <div>Critical Stock: <strong style="color: ${critItems.length > 0 ? '#f43f5e' : '#10b981'};">${critItems.length} SKUs</strong></div>
        </div>
      `, { direction: 'top' });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [locations, routes, activeLayers]);

  const selectedNodeItems = selectedLocation 
    ? inventory.filter(i => i.locationId === selectedLocation.id) 
    : [];
  const selectedNodeSensors = selectedLocation
    ? sensors.filter(s => s.locationId === selectedLocation.id)
    : [];
  const selectedNodeAlerts = selectedLocation
    ? alerts.filter(a => a.locationId === selectedLocation.id && a.status !== 'RESOLVED')
    : [];
  const selectedNodeVehicles = selectedLocation 
    ? vehicles.filter(v => v.currentLocationId === selectedLocation.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner and Layer Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-cyan-500/30 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-slate-900 dark:text-white">
              GIS LOGISTICS TOPOLOGY & SECTOR GRID
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Geographic Information System: 10 Operational Nodes, Supply Corridors & Real-Time Weather Readiness
          </p>
        </div>

        {/* Map Layer Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => toggleLayer('supplyNetwork')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              activeLayers.supplyNetwork 
                ? 'bg-cyan-50 dark:bg-cyan-950 border-cyan-400 text-cyan-800 dark:text-cyan-300 font-semibold' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            Supply Network
          </button>
          <button
            onClick={() => toggleLayer('inventoryRisk')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              activeLayers.inventoryRisk 
                ? 'bg-rose-50 dark:bg-rose-950 border-rose-400 text-rose-800 dark:text-rose-300 font-semibold' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            Inventory Risk
          </button>
          <button
            onClick={() => toggleLayer('demandHeatmap')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              activeLayers.demandHeatmap 
                ? 'bg-amber-50 dark:bg-amber-950 border-amber-400 text-amber-800 dark:text-amber-300 font-semibold' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            Capacity Circles
          </button>
          <button
            onClick={() => toggleLayer('routeConditions')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              activeLayers.routeConditions 
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 text-blue-800 dark:text-blue-300 font-semibold' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            Route Conditions
          </button>
        </div>
      </div>

      {/* Main Map + Inspection Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet GIS Map Canvas */}
        <div className="lg:col-span-2 hud-panel rounded-xl overflow-hidden relative flex flex-col h-[580px]">
          {/* Map Legend Overlay */}
          <div className="absolute top-3 left-3 z-[1000] p-2.5 rounded-lg bg-white/95 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 backdrop-blur-md text-[11px] font-mono text-slate-800 dark:text-slate-200 shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Low Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Elevated Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Critical Deficit</span>
            </div>
          </div>

          <div ref={mapContainerRef} className="w-full h-full dark-tiles" />

          {/* Bottom Corridor Status Bar */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="truncate">
              Selected Sector: <strong className="text-slate-900 dark:text-white">{selectedLocation?.name || 'Sector Overview'}</strong>
            </span>
            <span className="text-cyan-700 dark:text-cyan-400 shrink-0">Click any marker or corridor to inspect</span>
          </div>
        </div>

        {/* Node & Route Inspection Drawer */}
        <div className="hud-panel p-5 rounded-xl flex flex-col justify-between">
          <div>
            {/* Drawer Mode Switcher */}
            <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono mb-3">
              <button
                onClick={() => setInspectionMode('location')}
                className={`flex-1 py-1.5 rounded transition-colors cursor-pointer text-center ${
                  inspectionMode === 'location' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Base Nodes ({locations.length})
              </button>
              <button
                onClick={() => setInspectionMode('route')}
                className={`flex-1 py-1.5 rounded transition-colors cursor-pointer text-center ${
                  inspectionMode === 'route' ? 'bg-cyan-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Corridors ({routes.length})
              </button>
            </div>

            {inspectionMode === 'route' ? (
              /* Route Inspection View */
              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block mb-1">Select Simulated Corridor:</label>
                  <select
                    value={selectedRoute?.id || routes[0]?.id}
                    onChange={(e) => {
                      const r = routes.find(item => item.id === e.target.value);
                      if (r) setSelectedRoute(r);
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-cyan-700 dark:text-cyan-300 rounded-lg p-2 text-xs font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.routeCode}: {r.sourceName.split('(')[0].trim()} → {r.destinationName.split('(')[0].trim()}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRoute && (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold">{selectedRoute.routeCode}</span>
                        <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {selectedRoute.sourceName.split('(')[0].trim()} → {selectedRoute.destinationName.split('(')[0].trim()}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">SURFACE: {selectedRoute.surfaceType}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        selectedRoute.status === 'PASS_BLOCKED' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/50' :
                        selectedRoute.status === 'DEGRADED' || selectedRoute.status === 'INCLEMENT_WEATHER' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/50' :
                        'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/50'
                      }`}>
                        {selectedRoute.riskLevel} RISK
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Distance</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedRoute.distanceKm} km</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Transit Time</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-300">{selectedRoute.currentTravelHours} hrs</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Route Status</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRoute.status.replace('_', ' ')}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Standard ETA</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRoute.standardTravelHours} hrs</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedLocation ? (
              /* Location Inspection View */
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        selectedLocation.riskLevel === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500'
                      }`} />
                      <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                        {selectedLocation.name}
                      </h2>
                    </div>
                    <p className="text-xs text-cyan-700 dark:text-cyan-400 font-mono">
                      Code: {selectedLocation.code} • {selectedLocation.type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedLocation.riskLevel === 'CRITICAL' 
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/50' 
                      : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/50'
                  }`}>
                    {selectedLocation.riskLevel} RISK
                  </span>
                </div>

                {/* Weather & Terrain Telemetry */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-700 dark:text-cyan-400 uppercase font-semibold flex items-center gap-1">
                      <CloudSnow className="w-3.5 h-3.5" />
                      Environmental Conditions
                    </span>
                    <span className="text-slate-500 text-[10px]">Open-Meteo Sync</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 text-[10px]">Temperature:</span>
                      <div className="text-slate-900 dark:text-white font-bold text-sm">
                        {selectedLocation.weatherData ? selectedLocation.weatherData.temperatureC : selectedLocation.temperatureC}°C
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 text-[10px]">Elevation:</span>
                      <div className="text-slate-900 dark:text-white font-bold text-sm">
                        {selectedLocation.altitudeMeters} m ASL
                      </div>
                    </div>
                  </div>
                </div>

                {/* Critical SKU Count at Node */}
                <div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                    Stationed SKUs ({selectedNodeItems.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedNodeItems.slice(0, 4).map((item) => (
                      <div key={item.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[170px]">{item.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Stock: {item.currentStock} {item.unit}
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Quick Action Button */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrentTab('optimization')}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Dispatch Replenishment Convoy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
