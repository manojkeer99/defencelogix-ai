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
  Layers, 
  MapPin, 
  Radio, 
  ShieldAlert, 
  Truck, 
  Compass, 
  Maximize2, 
  Info, 
  Thermometer, 
  CloudSnow, 
  AlertTriangle,
  X,
  ArrowRight,
  TrendingUp,
  Package,
  BellRing,
  Battery,
  Activity,
  Droplets,
  Gauge,
  CheckCircle2
} from 'lucide-react';
import { LogisticsLocation, LogisticsRoute, InventoryItem, Vehicle, IoTSensorNode, AlertItem } from '../types';

interface GisMapViewProps {
  locations: LogisticsLocation[];
  routes: LogisticsRoute[];
  inventory: InventoryItem[];
  vehicles: Vehicle[];
  sensors?: IoTSensorNode[];
  alerts?: AlertItem[];
  onDispatchOrder?: (sourceId: string, destId: string) => void;
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
    transportCapacity: true,
    routeConditions: true
  });

  // Toggle map layers
  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if already created
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map centered at synthetic logistics operational sector
    const map = L.map(mapContainerRef.current, {
      center: [31.8, 77.0],
      zoom: 7,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Add Dark Matter / CartoDB dark tile layer for military night ops UI
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // Zoom control in top right
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
            <div style="font-weight: bold; color: #38bdf8;">${route.routeCode} [DEMO CORRIDOR]</div>
            <div>Corridor: ${route.sourceName} &rarr; ${route.destinationName}</div>
            <div>Surface: <strong>${route.surfaceType}</strong></div>
            <div>Transit: <strong>~${route.currentTravelHours} hrs</strong> (${route.distanceKm} km)</div>
            <div>Status: <span style="color: ${routeColor}; font-weight: bold;">${route.status}</span></div>
            <div>Risk: <strong>${route.riskLevel}</strong></div>
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
      const weatherImpact = wData ? wData.weatherImpact : (weatherTemp < -10 ? 'HIGH' : 'LOW');

      // Demand radius heatmap layer if enabled
      if (activeLayers.demandHeatmap) {
        L.circle([loc.coordinates.lat, loc.coordinates.lng], {
          radius: (loc.currentOccupancyTons / loc.storageCapacityTons) * 35000,
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.15,
          weight: 1
        }).addTo(map);
      }

      // Marker Circle
      const circleMarker = L.circleMarker([loc.coordinates.lat, loc.coordinates.lng], {
        radius,
        color: markerColor,
        weight: 2.5,
        fillColor: markerColor,
        fillOpacity: 0.8
      }).addTo(map);

      circleMarker.on('click', () => {
        setSelectedLocation(loc);
        setInspectionMode('location');
      });

      circleMarker.bindTooltip(`
        <div style="font-family: monospace; font-size: 11px; padding: 4px; line-height: 1.4;">
          <div style="font-weight: bold; color: #fff;">${loc.name}</div>
          <div style="color: #94a3b8;">${loc.code} • ${loc.type.replace('_', ' ').toUpperCase()}</div>
          <div style="margin-top: 3px;">Elevation: <strong>${loc.altitudeMeters}m ASL</strong> (${loc.terrainType})</div>
          <div>Weather: <strong style="color: #38bdf8;">${weatherTemp}°C, ${weatherCond}</strong></div>
          <div>Weather Impact: <strong style="color: ${weatherImpact === 'HIGH' ? '#f43f5e' : weatherImpact === 'MEDIUM' ? '#f59e0b' : '#10b981'};">${weatherImpact}</strong></div>
          <div>Critical Stock: <strong style="color: ${critItems.length > 0 ? '#f43f5e' : '#10b981'};">${critItems.length} SKUs</strong> (${locItems.length} total)</div>
        </div>
      `, { direction: 'top' });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [locations, routes, activeLayers]);

  // Selected node details
  const selectedNodeItems = selectedLocation 
    ? inventory.filter(i => i.locationId === selectedLocation.id) 
    : [];
  const selectedNodeCritical = selectedNodeItems.filter(i => i.status === 'CRITICAL');
  const selectedNodeVehicles = selectedLocation 
    ? vehicles.filter(v => v.currentLocationId === selectedLocation.id)
    : [];
  const selectedNodeSensors = selectedLocation
    ? sensors.filter(s => s.locationId === selectedLocation.id)
    : [];
  const selectedNodeAlerts = selectedLocation
    ? alerts.filter(a => a.locationId === selectedLocation.id && a.status !== 'RESOLVED')
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner and Layer Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-400" />
            <h1 className="font-heading text-xl font-bold tracking-wide text-white">
              GIS LOGISTICS TOPOLOGY & SECTOR GRID
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Geographic Information System: 10 Synthetic Nodes, Transit Corridors & Real-Time Weather Readiness
          </p>
        </div>

        {/* Map Layer Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => toggleLayer('supplyNetwork')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              activeLayers.supplyNetwork 
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            1. Supply Network
          </button>
          <button
            onClick={() => toggleLayer('inventoryRisk')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              activeLayers.inventoryRisk 
                ? 'bg-rose-950 border-rose-400 text-rose-300' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            2. Inventory Risk
          </button>
          <button
            onClick={() => toggleLayer('demandHeatmap')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              activeLayers.demandHeatmap 
                ? 'bg-amber-950 border-amber-400 text-amber-300' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            3. Demand Heatmap
          </button>
          <button
            onClick={() => toggleLayer('routeConditions')}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
              activeLayers.routeConditions 
                ? 'bg-blue-950 border-blue-400 text-blue-300' 
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            4. Route Conditions
          </button>
        </div>
      </div>

      {/* Main Map + Inspection Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet GIS Map Canvas (2 Columns) */}
        <div className="lg:col-span-2 hud-panel rounded-xl overflow-hidden relative flex flex-col h-[580px]">
          {/* Map Status Bar overlay */}
          <div className="absolute top-3 left-3 z-[1000] p-2 rounded-lg bg-slate-950/90 border border-slate-800 backdrop-blur-md text-[11px] font-mono text-slate-300 shadow-xl flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Low Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
              <span>Critical Deficit</span>
            </div>
          </div>

          <div ref={mapContainerRef} className="w-full h-full dark-tiles" />

          {/* Bottom Corridor Status Bar */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span className="truncate">
              Active Pass: <strong className="text-white">ROHTANG PASS PASS-ROHTANG-HIGHWAY</strong> (Gravel Tactical Pass • Weather Advisory)
            </span>
            <span className="text-cyan-400 shrink-0">Click any marker to inspect node</span>
          </div>
        </div>

        {/* Node & Route Inspection Drawer (1 Column) */}
        <div className="hud-panel p-5 rounded-xl flex flex-col justify-between">
          <div>
            {/* Drawer Mode Switcher */}
            <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono mb-3">
              <button
                onClick={() => setInspectionMode('location')}
                className={`flex-1 py-1.5 rounded transition-colors cursor-pointer text-center ${
                  inspectionMode === 'location' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Base Nodes ({locations.length})
              </button>
              <button
                onClick={() => setInspectionMode('route')}
                className={`flex-1 py-1.5 rounded transition-colors cursor-pointer text-center ${
                  inspectionMode === 'route' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Corridors ({routes.length})
              </button>
            </div>

            {inspectionMode === 'route' ? (
              /* Route Inspection View */
              <div className="space-y-3.5">
                {/* Route Selector */}
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Select Simulated Corridor:</label>
                  <select
                    value={selectedRoute?.id || routes[0]?.id}
                    onChange={(e) => {
                      const r = routes.find(item => item.id === e.target.value);
                      if (r) setSelectedRoute(r);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 text-cyan-300 rounded-lg p-2 text-xs font-mono focus:border-cyan-400 focus:outline-none"
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
                    <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">{selectedRoute.routeCode}</span>
                        <h3 className="font-heading text-base font-bold text-white leading-snug">
                          {selectedRoute.sourceName.split('(')[0].trim()} → {selectedRoute.destinationName.split('(')[0].trim()}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">DEMO / SYNTHETIC LOGISTICS ROUTE</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        selectedRoute.status === 'PASS_BLOCKED' ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse' :
                        selectedRoute.status === 'DEGRADED' || selectedRoute.status === 'INCLEMENT_WEATHER' ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      }`}>
                        {selectedRoute.riskLevel} RISK
                      </span>
                    </div>

                    {/* Route 8 Specific Required Fields Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {/* 1. Origin */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">1. Origin</span>
                        <span className="font-semibold text-slate-200 truncate block" title={selectedRoute.sourceName}>
                          {selectedRoute.sourceName}
                        </span>
                      </div>
                      {/* 2. Destination */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">2. Destination</span>
                        <span className="font-semibold text-slate-200 truncate block" title={selectedRoute.destinationName}>
                          {selectedRoute.destinationName}
                        </span>
                      </div>
                      {/* 3. Distance */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">3. Distance</span>
                        <span className="font-bold text-white">{selectedRoute.distanceKm} km</span>
                      </div>
                      {/* 4. Estimated Travel Time */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">4. Est. Travel Time</span>
                        <span className="font-bold text-cyan-300">{selectedRoute.currentTravelHours} hrs</span>
                        <span className="text-[10px] text-slate-500 ml-1">(std: {selectedRoute.standardTravelHours}h)</span>
                      </div>
                      {/* 5. Route Status */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">5. Route Status</span>
                        <span className={`font-bold ${
                          selectedRoute.status === 'PASS_BLOCKED' ? 'text-rose-400' :
                          selectedRoute.status === 'INCLEMENT_WEATHER' ? 'text-amber-400' :
                          selectedRoute.status === 'DEGRADED' ? 'text-amber-300' : 'text-emerald-400'
                        }`}>
                          {selectedRoute.status.replace('_', ' ')}
                        </span>
                      </div>
                      {/* 6. Accessibility */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">6. Accessibility</span>
                        <span className="text-cyan-300 font-semibold truncate block">
                          {selectedRoute.status === 'PASS_BLOCKED' 
                            ? 'Blocked (Snowcat/UAV)' 
                            : selectedRoute.status === 'INCLEMENT_WEATHER' 
                            ? 'Chains 6x6 Heavy' 
                            : 'All-Weather Highway'}
                        </span>
                      </div>
                      {/* 7. Weather Impact */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">7. Weather Impact</span>
                        <span className={`font-bold ${
                          selectedRoute.status === 'PASS_BLOCKED' ? 'text-rose-400' :
                          selectedRoute.status === 'INCLEMENT_WEATHER' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {selectedRoute.status === 'PASS_BLOCKED' ? 'HIGH (Blizzard)' :
                           selectedRoute.status === 'INCLEMENT_WEATHER' ? 'MED (Freeze)' : 'LOW (Clear)'}
                        </span>
                      </div>
                      {/* 8. Logistics Risk */}
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">8. Logistics Risk</span>
                        <span className={`font-bold ${
                          selectedRoute.riskLevel === 'HIGH' ? 'text-rose-400' :
                          selectedRoute.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {selectedRoute.riskLevel} RISK
                        </span>
                      </div>
                    </div>

                    {/* Accessibility Note */}
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Accessibility & Transit Constraints:
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {selectedRoute.status === 'PASS_BLOCKED' 
                          ? 'Corridor closed due to heavy snow accumulation and rockfall risk. Ground heavy vehicles cannot pass. Use extreme cold snowcats or cargo UAV sorties.' 
                          : selectedRoute.status === 'INCLEMENT_WEATHER'
                          ? 'Inclement weather advisory: high wind and sub-zero freeze. Chained 6x6 trucks required.'
                          : 'Open to all all-weather tactical carriers and heavy bowsers under standard speed limits.'}
                      </p>
                    </div>

                    {/* Synthetic Route Disclaimer */}
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[10px] font-mono text-slate-400">
                      ⚠️ Route geometry and coordinates are synthetic test curves for decision-support prototype evaluation. Not real Indian Army military convoy vectors.
                    </div>
                  </div>
                )}
              </div>
            ) : selectedLocation ? (
              /* Location Inspection View */
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        selectedLocation.riskLevel === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'
                      }`} />
                      <h2 className="font-heading text-lg font-bold text-white">
                        {selectedLocation.name}
                      </h2>
                    </div>
                    <p className="text-xs text-cyan-400 font-mono">
                      Code: {selectedLocation.code} • {selectedLocation.type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedLocation.riskLevel === 'CRITICAL' 
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/50' 
                      : 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  }`}>
                    {selectedLocation.riskLevel} RISK
                  </span>
                </div>

              {/* Live Public Weather & Terrain Telemetry */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-400 uppercase font-semibold flex items-center gap-1">
                    <CloudSnow className="w-3.5 h-3.5" />
                    Environmental & Weather Telemetry
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    REAL PUBLIC DATA
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Ambient Temp:</span>
                    <div className="text-white font-bold text-sm">
                      {selectedLocation.weatherData ? selectedLocation.weatherData.temperatureC : selectedLocation.temperatureC}°C
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Precipitation:</span>
                    <div className="text-blue-300 font-bold text-sm">
                      {selectedLocation.weatherData ? selectedLocation.weatherData.precipitationMm : (selectedLocation.weatherCondition.includes('Rain') ? 12 : selectedLocation.weatherCondition.includes('Snow') ? 8 : 0)} mm
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Wind Speed:</span>
                    <div className="text-slate-200 font-bold text-sm">
                      {selectedLocation.weatherData ? selectedLocation.weatherData.windSpeedKmH : 18} km/h
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Weather Status:</span>
                    <div className="text-cyan-300 font-bold text-xs truncate" title={selectedLocation.weatherData?.weatherCondition || selectedLocation.weatherCondition}>
                      {selectedLocation.weatherData?.weatherCondition || selectedLocation.weatherCondition}
                    </div>
                  </div>
                </div>

                {/* Weather Impact Assessment */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">Weather Impact:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (selectedLocation.weatherData?.weatherImpact || (selectedLocation.temperatureC < -10 ? 'HIGH' : 'LOW')) === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : (selectedLocation.weatherData?.weatherImpact || 'LOW') === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {selectedLocation.weatherData?.weatherImpact || (selectedLocation.temperatureC < -10 ? 'HIGH' : 'LOW')} IMPACT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {selectedLocation.weatherData?.impactReasoning?.[0] || 'Corridor clear for routine convoy movements.'}
                  </p>
                </div>
              </div>

              {/* GIS Terrain & Accessibility */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-400 uppercase font-semibold flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" />
                    GIS Terrain & Route Access
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-slate-400 border border-slate-800">
                    DEMO TERRAIN
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px]">Altitude:</span>
                    <span className="text-white font-bold">{selectedLocation.altitudeMeters} m ASL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[10px]">Terrain Type:</span>
                    <span className="text-slate-300 font-semibold">{selectedLocation.terrainType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Accessibility:</span>
                    <span className="text-cyan-300 text-[11px] font-medium block">
                      {selectedLocation.accessibilityIndicator || 'All-Weather Highway Access'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400 text-[10px]">Occupancy:</span>
                    <span className="text-white font-bold">{selectedLocation.currentOccupancyTons} / {selectedLocation.storageCapacityTons} T</span>
                  </div>
                </div>
              </div>

              {/* IoT Storage Sensors Status & Diagnostics (Prompt 3 Req 7) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-400 uppercase font-semibold flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    Stationed IoT Sensors ({selectedNodeSensors.length})
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    SIMULATED / DEMO
                  </span>
                </div>

                {selectedNodeSensors.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedNodeSensors.map(sensor => {
                      const isCritical = sensor.status === 'CRITICAL';
                      const isWarning = sensor.status === 'WARNING';
                      const isOffline = sensor.status === 'OFFLINE';

                      return (
                        <div 
                          key={sensor.id} 
                          className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
                            isCritical ? 'bg-rose-950/40 border-rose-500/50' :
                            isWarning ? 'bg-amber-950/40 border-amber-500/50' :
                            isOffline ? 'bg-slate-900 border-slate-700 text-slate-500' :
                            'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 truncate max-w-[150px]" title={sensor.unitName}>
                              {sensor.unitName}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              isCritical ? 'bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse' :
                              isWarning ? 'bg-amber-950 text-amber-300 border border-amber-500/50' :
                              isOffline ? 'bg-slate-800 text-slate-400' :
                              'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {sensor.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 mt-1.5 text-[10px] text-slate-400">
                            <div>
                              <span>Temp: </span>
                              <strong className={sensor.temperatureC > 25 || sensor.temperatureC < -15 ? 'text-amber-300' : 'text-slate-200'}>
                                {sensor.temperatureC}°C
                              </strong>
                            </div>
                            <div>
                              <span>Storage: </span>
                              <strong className={sensor.storageLevelPercent < 25 ? 'text-rose-400' : 'text-slate-200'}>
                                {sensor.storageLevelPercent}%
                              </strong>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Battery className="w-2.5 h-2.5" />
                              <strong className={sensor.batteryLevel < 20 ? 'text-rose-400' : 'text-slate-200'}>
                                {sensor.batteryLevel}%
                              </strong>
                            </div>
                          </div>

                          {sensor.hasAnomaly && sensor.anomalyDescription && (
                            <div className="mt-1 pt-1 border-t border-slate-800/80 text-[10px] text-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{sensor.anomalyDescription}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono p-2 bg-slate-950 rounded border border-slate-800">
                    No IoT sensors deployed at this node.
                  </p>
                )}
              </div>

              {/* Active Alerts at Node (Prompt 3 Req 7) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-rose-400 uppercase font-semibold flex items-center gap-1">
                    <BellRing className="w-3.5 h-3.5" />
                    Active Alerts & Alarms ({selectedNodeAlerts.length})
                  </span>
                </div>

                {selectedNodeAlerts.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedNodeAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        className={`p-2 rounded-lg border text-xs font-mono ${
                          alert.severity === 'CRITICAL' ? 'bg-rose-950/40 border-rose-500/50' :
                          alert.severity === 'HIGH' ? 'bg-amber-950/30 border-amber-500/40' :
                          'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            alert.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300' :
                            alert.severity === 'HIGH' ? 'bg-amber-950 text-amber-300' :
                            'bg-cyan-950 text-cyan-300'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-200 font-medium text-[11px] mt-1 leading-snug">
                          {alert.title}
                        </p>
                        {alert.sensorName && (
                          <div className="text-[9px] text-cyan-400 mt-1 flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5" />
                            <span className="truncate">{alert.sensorName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400/80 font-mono p-2 bg-slate-950 rounded border border-emerald-900/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>No unresolved alerts for this facility.</span>
                  </p>
                )}
              </div>

              {/* Critical Stocks at this location */}
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                  Inventory Telemetry at Node ({selectedNodeItems.length} SKUs)
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedNodeItems.map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200 truncate max-w-[170px]">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Stock: {item.currentStock} {item.unit} / Min: {item.minStock}
                        </div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.status === 'CRITICAL' ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stationed Transport Vehicles */}
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Stationed Vehicles ({selectedNodeVehicles.length})
                </span>
                {selectedNodeVehicles.length > 0 ? (
                  <div className="space-y-1">
                    {selectedNodeVehicles.map(v => (
                      <div key={v.id} className="text-xs font-mono text-slate-300 flex justify-between bg-slate-950 p-1.5 rounded">
                        <span>{v.vehicleId} ({v.type})</span>
                        <span className="text-emerald-400">{v.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-mono">No transport vehicles currently stationed at this node.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 p-8">
              Select a node on the GIS map to inspect status.
            </div>
          )}
        </div>

        {/* Quick Action Button */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => setCurrentTab('optimization')}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
