export type UserRole = 
  | 'admin' 
  | 'logistics_officer' 
  | 'inventory_manager' 
  | 'transport_manager' 
  | 'analyst' 
  | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  serviceNumber: string;
  clearanceLevel: string;
  department: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type LocationType = 
  | 'central_depot' 
  | 'regional_depot' 
  | 'forward_node' 
  | 'transport_hub' 
  | 'tactical_supply_point';

export interface LogisticsLocation {
  id: string;
  name: string;
  code: string;
  type: LocationType;
  coordinates: Coordinates;
  altitudeMeters: number;
  terrainType: string;
  accessibilityIndicator?: string;
  weatherCondition: string;
  temperatureC: number;
  status: 'OPERATIONAL' | 'WEATHER_ALERT' | 'HIGH_DEMAND' | 'ISOLATED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  storageCapacityTons: number;
  currentOccupancyTons: number;
  assignedVehiclesCount: number;
  weatherData?: WeatherData;
}

export type WeatherImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WeatherDailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipSum: number;
  weatherCode: number;
  condition: string;
}

export interface WeatherData {
  locationId: string;
  locationName: string;
  coordinates: Coordinates;
  temperatureC: number;
  windSpeedKmH: number;
  windDirectionDeg: number;
  precipitationMm: number;
  humidityPercent: number;
  weatherCode: number;
  weatherCondition: string;
  weatherImpact: WeatherImpactLevel;
  impactReasoning: string[];
  source: 'OPEN_METEO_API' | 'SYNTHETIC_FALLBACK';
  lastUpdated: string;
  dailyForecast?: WeatherDailyForecast[];
}

export type ItemCategory = 
  | 'Ammunition & Ordnance'
  | 'POL (Petroleum, Oil, Lubricants)'
  | 'Rations & MRE'
  | 'Medical & Trauma'
  | 'Spare Parts & Maintenance'
  | 'Cold Weather & Mountaineering'
  | 'Tactical Communications';

export type InventoryStatus = 'NORMAL' | 'LOW' | 'CRITICAL' | 'OVERSTOCKED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  category: ItemCategory;
  locationId: string;
  locationName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  dailyConsumption: number;
  leadTimeDays: number;
  unit: string;
  predictedDemand7d: number;
  predictedDemand14d: number;
  predictedDemand30d: number;
  stockoutRiskScore: number; // 0-100
  stockoutRiskCategory: RiskLevel;
  recommendedReorder: number;
  status: InventoryStatus;
  lastAudited: string;
}

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  itemId: string;
  itemName: string;
  locationId: string;
  locationName: string;
  type: 'RECEIPT' | 'DISPATCH' | 'TRANSFER' | 'AUDIT_ADJUSTMENT';
  quantity: number;
  referenceId: string;
  performedBy: string;
  remarks: string;
}

export interface DemandHistoryRecord {
  id: string;
  itemId: string;
  itemName: string;
  category: ItemCategory;
  locationId: string;
  locationName: string;
  date: string;
  consumption: number;
  weatherCategory: string;
  operationalTempo: 'Routine' | 'Heightened Readiness' | 'Field Exercise' | 'Surge Ops';
  leadTimeRecorded: number;
}

export type VehicleStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_TRANSIT' | 'MAINTENANCE';

export interface Vehicle {
  id: string;
  vehicleId: string;
  type: string;
  capacityTons: number;
  currentLoadTons: number;
  status: VehicleStatus;
  currentLocationId: string;
  currentLocationName: string;
  destinationLocationId?: string;
  destinationLocationName?: string;
  assignedRouteId?: string;
  estimatedArrival?: string;
  fuelPercentage: number;
  maintenanceStatus: 'GOOD' | 'INSPECTION_DUE' | 'SERVICING';
  driverName?: string;
}

export interface LogisticsRoute {
  id: string;
  routeCode: string;
  sourceId: string;
  sourceName: string;
  destinationId: string;
  destinationName: string;
  distanceKm: number;
  standardTravelHours: number;
  currentTravelHours: number;
  status: 'CLEAR' | 'DEGRADED' | 'PASS_BLOCKED' | 'INCLEMENT_WEATHER';
  surfaceType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  coordinates: [number, number][];
}

export interface LogisticsRecommendation {
  id: string;
  sourceId: string;
  sourceName: string;
  destinationId: string;
  destinationName: string;
  itemId: string;
  itemName: string;
  category: ItemCategory;
  supplyQuantity: number;
  transportType: string;
  estimatedTimeHours: number;
  priority: 'URGENT' | 'HIGH' | 'STANDARD' | 'ROUTINE';
  status: 'RECOMMENDED' | 'APPROVED' | 'DISPATCHED' | 'COMPLETED';
  reasoning: string;
  createdAt: string;
}

export type SensorStatusLevel = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';

export interface IoTSensorNode {
  id: string;
  sensorId: string;
  unitName: string;
  locationId: string;
  locationName: string;
  targetCategory: ItemCategory;
  temperatureC: number;
  humidityPercent: number;
  storageLevelPercent: number;
  quantity: number;
  containerPressurePsi: number;
  deviceHealth: 'ONLINE' | 'DEGRADED' | 'CRITICAL';
  status: SensorStatusLevel;
  batteryLevel: number;
  hasAnomaly: boolean;
  anomalyDescription?: string;
  anomalySeverity?: 'WARNING' | 'CRITICAL';
  anomalyType?: 'TEMPERATURE' | 'HUMIDITY' | 'LOW_STORAGE' | 'LOW_BATTERY' | 'OFFLINE' | 'COMPOUND' | 'PRESSURE';
  lastPing: string;
}

export interface SensorAnomalyRecord {
  id: string;
  sensorId: string;
  unitName: string;
  locationId: string;
  locationName: string;
  parameter: 'Temperature' | 'Humidity' | 'Storage Level' | 'Battery' | 'Heartbeat' | 'Pressure' | 'Compound';
  currentValue: string;
  expectedThreshold: string;
  severity: 'WARNING' | 'CRITICAL';
  reason: string;
  timestamp: string;
}

export type AlertType = 
  | 'LOW STOCK' 
  | 'STOCKOUT RISK' 
  | 'HIGH DEMAND' 
  | 'TRANSPORT DELAY' 
  | 'INVENTORY ANOMALY' 
  | 'CAPACITY SHORTAGE' 
  | 'FORECAST ANOMALY';

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface AlertItem {
  id: string;
  timestamp: string;
  type: AlertType;
  severity: AlertSeverity;
  locationId: string;
  locationName: string;
  sensorId?: string;
  sensorName?: string;
  title: string;
  description: string;
  recommendedAction: string;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  targetEntity: string;
  details: string;
}

export interface ForecastResult {
  itemId: string;
  itemName: string;
  category: ItemCategory;
  locationId: string;
  locationName: string;
  horizonDays: number;
  modelUsed: string;
  predictedDemandTotal: number;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  expectedShortage: number;
  recommendedReplenishment: number;
  metrics: {
    mae: number;
    rmse: number;
    mape: number;
  };
  dailySeries: {
    date: string;
    actual?: number;
    predicted: number;
    upperBound: number;
    lowerBound: number;
  }[];
}

export interface DashboardMetrics {
  totalInventoryItems: number;
  criticalStockItems: number;
  lowStockItems: number;
  predictedDemandTotal: number;
  pendingSupplyRequests: number;
  activeDeliveries: number;
  availableTransportCapacityTons: number;
  totalTransportCapacityTons: number;
  lowStockAlertsCount: number;
  forecastAccuracyPercentage: number;
  stockoutRiskAverage: number;
}

/* ==========================================================================
   UNIFIED PREDICTIVE LOGISTICS TYPES (PROMPT 4 INTEGRATION)
   ========================================================================== */

export type ReplenishmentAction = 'REPLENISH NOW' | 'REPLENISH SOON' | 'MONITOR' | 'NO ACTION';

export interface LocationLogisticsStatus {
  locationId: string;
  locationName: string;
  locationCode: string;
  locationType: LocationType;
  coordinates: Coordinates;
  
  // Inventory & Consumption
  totalItemsCount: number;
  criticalItemsCount: number;
  lowItemsCount: number;
  totalCurrentStock: number;
  totalDailyConsumption: number;
  totalForecastDemand7d: number;
  totalProjectedInventory7d: number;
  totalSafetyStock: number;
  averageStockoutRisk: number; // 0-100
  
  // Requirements
  anticipatedRequirementsCount: number;
  totalRequiredQuantity: number;
  topPriorityAction: ReplenishmentAction;
  
  // Environmental & Infrastructure
  weatherCondition: string;
  temperatureC: number;
  weatherImpact: WeatherImpactLevel;
  weatherReasoning: string[];
  altitudeMeters: number;
  terrainType: string;
  accessibilityStatus: string;
  accessibilityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // IoT Edge Health
  sensorsTotal: number;
  sensorsNormal: number;
  sensorsWarning: number;
  sensorsCritical: number;
  sensorsOffline: number;
  hasActiveAnomalies: boolean;
  iotStatusSummary: string;
  
  // Multi-Factor Risk Assessment
  overallLogisticsRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  compositeRiskScore: number; // 0-100
  riskFactorBreakdown: {
    inventoryRisk: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reason: string };
    weatherRisk: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string };
    terrainRisk: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string };
    iotRisk: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; reason: string };
    routeRisk: { score: number; level: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string };
  };
  whyReasons: string[];
}

export interface AnticipatedRequirementItem {
  id: string;
  itemId: string;
  itemName: string;
  category: ItemCategory;
  locationId: string;
  locationName: string;
  unit: string;
  currentStock: number;
  dailyConsumption: number;
  leadTimeDays: number;
  safetyStock: number;
  forecastDemand7d: number;
  projectedStock7d: number;
  requiredQuantity: number;
  daysOfSupply: number;
  stockoutRisk: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'CRITICAL';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'ROUTINE';
  recommendedAction: ReplenishmentAction;
  whyExplanation: {
    currentStock: number;
    forecastDemand: number;
    safetyStock: number;
    projectedStock: number;
    leadTimeDays: number;
    weatherModifier: string;
    iotAlert: string | null;
    bulletReasons: string[];
  };
}

export interface RouteLogisticsStatus {
  routeId: string;
  routeCode: string;
  originId: string;
  originName: string;
  destinationId: string;
  destinationName: string;
  distanceKm: number;
  standardTravelHours: number;
  currentTravelHours: number;
  routeStatus: 'CLEAR' | 'DEGRADED' | 'PASS_BLOCKED' | 'INCLEMENT_WEATHER';
  surfaceType: string;
  accessibility: string;
  weatherImpact: WeatherImpactLevel;
  weatherSummary: string;
  logisticsRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  whyReason: string;
  coordinates: [number, number][];
}

export interface UnifiedDashboardSummary {
  totalLocations: number;
  totalInventoryItems: number;
  highRiskLocationsCount: number;
  criticalAlertsCount: number;
  pendingRequirementsCount: number;
  sensorsWithWarningsCount: number;
  weatherWarningsCount: number;
}

