import {
  User,
  LogisticsLocation,
  InventoryItem,
  InventoryTransaction,
  DemandHistoryRecord,
  Vehicle,
  LogisticsRoute,
  LogisticsRecommendation,
  IoTSensorNode,
  AlertItem,
  AuditLog,
  ItemCategory
} from '../types/index.js';
import { calculateSafetyStock, calculateReorderPoint, calculateStockoutRisk } from './ml.js';
import { evaluateSensorAnomalies, applyLiveTelemetryJitter } from '../utils/iotConfig.js';

export interface DatabaseState {
  users: User[];
  locations: LogisticsLocation[];
  inventory: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  demandHistory: DemandHistoryRecord[];
  vehicles: Vehicle[];
  routes: LogisticsRoute[];
  recommendations: LogisticsRecommendation[];
  sensorData: IoTSensorNode[];
  alerts: AlertItem[];
  auditLogs: AuditLog[];
}

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    email: 'admin@demologix.local',
    name: 'Brig. Rajesh Varma (Retd.)',
    role: 'admin',
    serviceNumber: 'IC-48291X',
    clearanceLevel: 'LEVEL 5 - TOP SECRET (DEMO)',
    department: 'Directorate General of Operational Logistics',
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 'USR-002',
    email: 'officer@demologix.local',
    name: 'Col. Amitav Sengupta',
    role: 'logistics_officer',
    serviceNumber: 'IC-51203M',
    clearanceLevel: 'LEVEL 4 - SECRET (DEMO)',
    department: 'Forward Supply Corps Command',
    createdAt: '2026-01-12T09:30:00.000Z'
  },
  {
    id: 'USR-003',
    email: 'inventory@demologix.local',
    name: 'Lt. Col. Priya Menon',
    role: 'inventory_manager',
    serviceNumber: 'IC-54910K',
    clearanceLevel: 'LEVEL 3 - CONFIDENTIAL (DEMO)',
    department: 'Central Ordnance Depot Management',
    createdAt: '2026-01-15T11:00:00.000Z'
  },
  {
    id: 'USR-004',
    email: 'transport@demologix.local',
    name: 'Maj. Vikramaditya Rathore',
    role: 'transport_manager',
    serviceNumber: 'IC-59821P',
    clearanceLevel: 'LEVEL 3 - CONFIDENTIAL (DEMO)',
    department: 'Army Service Corps (Mechanical Transport)',
    createdAt: '2026-01-18T14:15:00.000Z'
  },
  {
    id: 'USR-005',
    email: 'analyst@demologix.local',
    name: 'Dr. Sunita Kulkarni',
    role: 'analyst',
    serviceNumber: 'CIV-DS-8842',
    clearanceLevel: 'LEVEL 3 - CONFIDENTIAL (DEMO)',
    department: 'Defence Data Science & Operational Research Lab',
    createdAt: '2026-01-20T10:00:00.000Z'
  },
  {
    id: 'USR-006',
    email: 'viewer@demologix.local',
    name: 'Capt. Rohan Deshmukh',
    role: 'viewer',
    serviceNumber: 'IC-64112A',
    clearanceLevel: 'LEVEL 2 - RESTRICTED (DEMO)',
    department: 'Staff College Logistics Observer Division',
    createdAt: '2026-02-01T09:00:00.000Z'
  }
];

export const SYNTHETIC_LOCATIONS: LogisticsLocation[] = [
  {
    id: 'LOC-CENTRAL-01',
    name: 'Central Strategic Depot (Depot Alpha)',
    code: 'CSD-ALP',
    type: 'central_depot',
    coordinates: { lat: 31.1048, lng: 77.1734 }, // Synthetic sector coordinates
    altitudeMeters: 2200,
    terrainType: 'Hinterland Base',
    accessibilityIndicator: 'All-Weather Paved National Highway (Unrestricted Heavy Convoy)',
    weatherCondition: 'Clear',
    temperatureC: 16,
    status: 'OPERATIONAL',
    riskLevel: 'LOW',
    storageCapacityTons: 12000,
    currentOccupancyTons: 8450,
    assignedVehiclesCount: 8
  },
  {
    id: 'LOC-REG-NORTH',
    name: 'Regional Logistic Base (North Sector)',
    code: 'RLB-NOR',
    type: 'regional_depot',
    coordinates: { lat: 32.2215, lng: 76.3234 },
    altitudeMeters: 2850,
    terrainType: 'Mountain Valley',
    accessibilityIndicator: 'Mountain Valley Dual-Lane Paved Highway',
    weatherCondition: 'Dense Fog',
    temperatureC: 6,
    status: 'OPERATIONAL',
    riskLevel: 'LOW',
    storageCapacityTons: 6500,
    currentOccupancyTons: 4320,
    assignedVehiclesCount: 5
  },
  {
    id: 'LOC-REG-SOUTH',
    name: 'Regional Logistic Base (South Sector)',
    code: 'RLB-SOU',
    type: 'regional_depot',
    coordinates: { lat: 30.3165, lng: 78.0322 },
    altitudeMeters: 1450,
    terrainType: 'Plains Foothills',
    accessibilityIndicator: 'Foothills Paved Multi-Axle Corridor',
    weatherCondition: 'Clear',
    temperatureC: 22,
    status: 'OPERATIONAL',
    riskLevel: 'LOW',
    storageCapacityTons: 7000,
    currentOccupancyTons: 4980,
    assignedVehiclesCount: 4
  },
  {
    id: 'LOC-HUB-01',
    name: 'Intermodal Transport Hub Kilo',
    code: 'ITH-KLO',
    type: 'transport_hub',
    coordinates: { lat: 31.6340, lng: 76.5270 },
    altitudeMeters: 1800,
    terrainType: 'Garrison Junction',
    accessibilityIndicator: 'Major Road-Rail Transshipment Junction',
    weatherCondition: 'Clear',
    temperatureC: 18,
    status: 'OPERATIONAL',
    riskLevel: 'LOW',
    storageCapacityTons: 4500,
    currentOccupancyTons: 2890,
    assignedVehiclesCount: 6
  },
  {
    id: 'LOC-FWD-ALPHA',
    name: 'Forward Node Alpha (High Altitude Pass)',
    code: 'FNA-ALT',
    type: 'forward_node',
    coordinates: { lat: 32.7266, lng: 77.1650 },
    altitudeMeters: 4350,
    terrainType: 'High Altitude Pass',
    accessibilityIndicator: 'Seasonal Mountain Pass (Snow-Chains & 6x6 Heavy All-Terrain Only)',
    weatherCondition: 'Extreme Cold / Blizzard',
    temperatureC: -14,
    status: 'WEATHER_ALERT',
    riskLevel: 'CRITICAL',
    storageCapacityTons: 950,
    currentOccupancyTons: 380,
    assignedVehiclesCount: 2
  },
  {
    id: 'LOC-FWD-BRAVO',
    name: 'Forward Node Bravo (Valley Post)',
    code: 'FNB-VAL',
    type: 'forward_node',
    coordinates: { lat: 32.5512, lng: 76.7820 },
    altitudeMeters: 3600,
    terrainType: 'Mountain Valley',
    accessibilityIndicator: 'Narrow Valley All-Weather Single Lane (Subject to Rockfall)',
    weatherCondition: 'Dense Fog',
    temperatureC: -2,
    status: 'HIGH_DEMAND',
    riskLevel: 'HIGH',
    storageCapacityTons: 1100,
    currentOccupancyTons: 520,
    assignedVehiclesCount: 2
  },
  {
    id: 'LOC-FWD-CHARLIE',
    name: 'Forward Node Charlie (Tactical Ridge)',
    code: 'FNC-RDG',
    type: 'forward_node',
    coordinates: { lat: 31.9540, lng: 77.8500 },
    altitudeMeters: 3950,
    terrainType: 'Mountain Ridge',
    accessibilityIndicator: 'High-Altitude Ridgeline Track (Medium 4x4 / Tracked Snowcat)',
    weatherCondition: 'Clear',
    temperatureC: 1,
    status: 'OPERATIONAL',
    riskLevel: 'MEDIUM',
    storageCapacityTons: 850,
    currentOccupancyTons: 610,
    assignedVehiclesCount: 1
  },
  {
    id: 'LOC-FWD-DELTA',
    name: 'Forward Node Delta (Desert Sector Front)',
    code: 'FND-DES',
    type: 'forward_node',
    coordinates: { lat: 29.9800, lng: 75.9500 },
    altitudeMeters: 210,
    terrainType: 'Desert Plains',
    accessibilityIndicator: 'Desert Hardpan Sand Tracks (All-Wheel Drive / 4x4 Required)',
    weatherCondition: 'Sandstorm',
    temperatureC: 38,
    status: 'WEATHER_ALERT',
    riskLevel: 'HIGH',
    storageCapacityTons: 1400,
    currentOccupancyTons: 710,
    assignedVehiclesCount: 3
  },
  {
    id: 'LOC-FWD-ECHO',
    name: 'Forward Node Echo (River Crossing Base)',
    code: 'FNE-RVR',
    type: 'forward_node',
    coordinates: { lat: 30.8200, lng: 76.9200 },
    altitudeMeters: 850,
    terrainType: 'Riverine Basin',
    accessibilityIndicator: 'Riverine Causeway & Pontoon Crossing (Seasonal Monsoon Watch)',
    weatherCondition: 'Monsoon Rain',
    temperatureC: 24,
    status: 'OPERATIONAL',
    riskLevel: 'LOW',
    storageCapacityTons: 1250,
    currentOccupancyTons: 980,
    assignedVehiclesCount: 2
  },
  {
    id: 'LOC-TACTICAL-FOXTROT',
    name: 'Tactical Supply Point Foxtrot',
    code: 'TSP-FXT',
    type: 'tactical_supply_point',
    coordinates: { lat: 33.1500, lng: 77.4500 },
    altitudeMeters: 4800,
    terrainType: 'High Altitude Glacial Pass',
    accessibilityIndicator: 'Extreme Glacial Ridge — Aerial / Cargo UAV & Snowcat Only',
    weatherCondition: 'Extreme Cold / Blizzard',
    temperatureC: -21,
    status: 'ISOLATED',
    riskLevel: 'CRITICAL',
    storageCapacityTons: 400,
    currentOccupancyTons: 110,
    assignedVehiclesCount: 1
  }
];

export const SYNTHETIC_ROUTES: LogisticsRoute[] = [
  {
    id: 'RTE-01',
    routeCode: 'NH-ALPHA-EXPRESS',
    sourceId: 'LOC-CENTRAL-01',
    sourceName: 'Central Strategic Depot (Depot Alpha)',
    destinationId: 'LOC-REG-NORTH',
    destinationName: 'Regional Logistic Base (North Sector)',
    distanceKm: 165,
    standardTravelHours: 4.5,
    currentTravelHours: 4.8,
    status: 'CLEAR',
    surfaceType: 'Paved Highway',
    riskLevel: 'LOW',
    coordinates: [[31.1048, 77.1734], [31.55, 76.85], [32.2215, 76.3234]]
  },
  {
    id: 'RTE-02',
    routeCode: 'VALLEY-LINK-BRAVO',
    sourceId: 'LOC-REG-NORTH',
    sourceName: 'Regional Logistic Base (North Sector)',
    destinationId: 'LOC-FWD-BRAVO',
    destinationName: 'Forward Node Bravo (Valley Post)',
    distanceKm: 98,
    standardTravelHours: 3.2,
    currentTravelHours: 4.0,
    status: 'DEGRADED',
    surfaceType: 'Mountain All-Weather',
    riskLevel: 'MEDIUM',
    coordinates: [[32.2215, 76.3234], [32.38, 76.55], [32.5512, 76.7820]]
  },
  {
    id: 'RTE-03',
    routeCode: 'PASS-ROHTANG-HIGHWAY',
    sourceId: 'LOC-REG-NORTH',
    sourceName: 'Regional Logistic Base (North Sector)',
    destinationId: 'LOC-FWD-ALPHA',
    destinationName: 'Forward Node Alpha (High Altitude Pass)',
    distanceKm: 142,
    standardTravelHours: 5.5,
    currentTravelHours: 8.2,
    status: 'INCLEMENT_WEATHER',
    surfaceType: 'Gravel Tactical Pass',
    riskLevel: 'HIGH',
    coordinates: [[32.2215, 76.3234], [32.45, 76.88], [32.7266, 77.1650]]
  },
  {
    id: 'RTE-04',
    routeCode: 'AERIAL-SUPPLY-GLACIER',
    sourceId: 'LOC-FWD-ALPHA',
    sourceName: 'Forward Node Alpha (High Altitude Pass)',
    destinationId: 'LOC-TACTICAL-FOXTROT',
    destinationName: 'Tactical Supply Point Foxtrot',
    distanceKm: 65,
    standardTravelHours: 1.2,
    currentTravelHours: 2.5,
    status: 'INCLEMENT_WEATHER',
    surfaceType: 'Aerial Corridor',
    riskLevel: 'HIGH',
    coordinates: [[32.7266, 77.1650], [32.95, 77.30], [33.1500, 77.4500]]
  },
  {
    id: 'RTE-05',
    routeCode: 'EAST-RIDGE-TACTICAL',
    sourceId: 'LOC-CENTRAL-01',
    sourceName: 'Central Strategic Depot (Depot Alpha)',
    destinationId: 'LOC-FWD-CHARLIE',
    destinationName: 'Forward Node Charlie (Tactical Ridge)',
    distanceKm: 125,
    standardTravelHours: 4.0,
    currentTravelHours: 4.2,
    status: 'CLEAR',
    surfaceType: 'Mountain All-Weather',
    riskLevel: 'LOW',
    coordinates: [[31.1048, 77.1734], [31.50, 77.50], [31.9540, 77.8500]]
  },
  {
    id: 'RTE-06',
    routeCode: 'DESERT-CORRIDOR-SOUTH',
    sourceId: 'LOC-REG-SOUTH',
    sourceName: 'Regional Logistic Base (South Sector)',
    destinationId: 'LOC-FWD-DELTA',
    destinationName: 'Forward Node Delta (Desert Sector Front)',
    distanceKm: 240,
    standardTravelHours: 5.0,
    currentTravelHours: 6.5,
    status: 'DEGRADED',
    surfaceType: 'Paved Highway',
    riskLevel: 'MEDIUM',
    coordinates: [[30.3165, 78.0322], [30.15, 77.0], [29.9800, 75.9500]]
  },
  {
    id: 'RTE-07',
    routeCode: 'RIVER-BASIN-FEEDER',
    sourceId: 'LOC-HUB-01',
    sourceName: 'Intermodal Transport Hub Kilo',
    destinationId: 'LOC-FWD-ECHO',
    destinationName: 'Forward Node Echo (River Crossing Base)',
    distanceKm: 110,
    standardTravelHours: 2.8,
    currentTravelHours: 3.1,
    status: 'CLEAR',
    surfaceType: 'Paved Highway',
    riskLevel: 'LOW',
    coordinates: [[31.6340, 76.5270], [31.25, 76.75], [30.8200, 76.9200]]
  }
];

export const SYNTHETIC_VEHICLES: Vehicle[] = [
  {
    id: 'VEH-01',
    vehicleId: 'TATRA-8x8-401',
    type: 'Heavy All-Terrain Truck 6x6',
    capacityTons: 12,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-CENTRAL-01',
    currentLocationName: 'Central Strategic Depot (Depot Alpha)',
    fuelPercentage: 92,
    maintenanceStatus: 'GOOD',
    driverName: 'Havildar Gurpreet Singh'
  },
  {
    id: 'VEH-02',
    vehicleId: 'TATRA-8x8-402',
    type: 'Heavy All-Terrain Truck 6x6',
    capacityTons: 12,
    currentLoadTons: 10.5,
    status: 'IN_TRANSIT',
    currentLocationId: 'LOC-CENTRAL-01',
    currentLocationName: 'Central Strategic Depot (Depot Alpha)',
    destinationLocationId: 'LOC-REG-NORTH',
    destinationLocationName: 'Regional Logistic Base (North Sector)',
    assignedRouteId: 'RTE-01',
    estimatedArrival: '14:30 hrs',
    fuelPercentage: 74,
    maintenanceStatus: 'GOOD',
    driverName: 'Naik Surender Rawat'
  },
  {
    id: 'VEH-03',
    vehicleId: 'STALLION-4x4-105',
    type: 'Medium Tactical Carrier 4x4',
    capacityTons: 5,
    currentLoadTons: 4.8,
    status: 'IN_TRANSIT',
    currentLocationId: 'LOC-REG-NORTH',
    currentLocationName: 'Regional Logistic Base (North Sector)',
    destinationLocationId: 'LOC-FWD-BRAVO',
    destinationLocationName: 'Forward Node Bravo (Valley Post)',
    assignedRouteId: 'RTE-02',
    estimatedArrival: '16:15 hrs',
    fuelPercentage: 68,
    maintenanceStatus: 'GOOD',
    driverName: 'Sepoy Dinesh Thapa'
  },
  {
    id: 'VEH-04',
    vehicleId: 'SNOWCAT-BV206-01',
    type: 'Extreme Cold Snowcat',
    capacityTons: 2.5,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-FWD-ALPHA',
    currentLocationName: 'Forward Node Alpha (High Altitude Pass)',
    fuelPercentage: 88,
    maintenanceStatus: 'GOOD',
    driverName: 'Naik Subedar Tenzing'
  },
  {
    id: 'VEH-05',
    vehicleId: 'HELI-CHINOOK-H01',
    type: 'Heavy-Lift Logistics Helicopter',
    capacityTons: 9.5,
    currentLoadTons: 8.2,
    status: 'ASSIGNED',
    currentLocationId: 'LOC-REG-NORTH',
    currentLocationName: 'Regional Logistic Base (North Sector)',
    destinationLocationId: 'LOC-TACTICAL-FOXTROT',
    destinationLocationName: 'Tactical Supply Point Foxtrot',
    assignedRouteId: 'RTE-04',
    estimatedArrival: '12:45 hrs',
    fuelPercentage: 80,
    maintenanceStatus: 'GOOD',
    driverName: 'Sqn Ldr Abhinav Mehta'
  },
  {
    id: 'VEH-06',
    vehicleId: 'DRONE-CARGO-UAV01',
    type: 'Autonomous Aerial Logistics Drone',
    capacityTons: 0.25,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-FWD-ALPHA',
    currentLocationName: 'Forward Node Alpha (High Altitude Pass)',
    fuelPercentage: 98,
    maintenanceStatus: 'GOOD',
    driverName: 'Automated Flight Controller GCS-1'
  },
  {
    id: 'VEH-07',
    vehicleId: 'DRONE-CARGO-UAV02',
    type: 'Autonomous Aerial Logistics Drone',
    capacityTons: 0.25,
    currentLoadTons: 0.2,
    status: 'IN_TRANSIT',
    currentLocationId: 'LOC-FWD-ALPHA',
    currentLocationName: 'Forward Node Alpha (High Altitude Pass)',
    destinationLocationId: 'LOC-TACTICAL-FOXTROT',
    destinationLocationName: 'Tactical Supply Point Foxtrot',
    assignedRouteId: 'RTE-04',
    estimatedArrival: '11:15 hrs',
    fuelPercentage: 84,
    maintenanceStatus: 'GOOD',
    driverName: 'Automated Flight Controller GCS-1'
  },
  {
    id: 'VEH-08',
    vehicleId: 'STALLION-4x4-108',
    type: 'Medium Tactical Carrier 4x4',
    capacityTons: 5,
    currentLoadTons: 0,
    status: 'MAINTENANCE',
    currentLocationId: 'LOC-HUB-01',
    currentLocationName: 'Intermodal Transport Hub Kilo',
    fuelPercentage: 45,
    maintenanceStatus: 'SERVICING',
    driverName: 'Under EME Workshop Inspection'
  },
  {
    id: 'VEH-09',
    vehicleId: 'ARMORED-BMP2-MED01',
    type: 'Armored Supply Carrier',
    capacityTons: 3.5,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-FWD-DELTA',
    currentLocationName: 'Forward Node Delta (Desert Sector Front)',
    fuelPercentage: 79,
    maintenanceStatus: 'GOOD',
    driverName: 'Dfr. Jaswant Gill'
  },
  {
    id: 'VEH-10',
    vehicleId: 'BOWSER-FUEL-F01',
    type: 'Heavy All-Terrain Truck 6x6',
    capacityTons: 10,
    currentLoadTons: 9.8,
    status: 'IN_TRANSIT',
    currentLocationId: 'LOC-REG-SOUTH',
    currentLocationName: 'Regional Logistic Base (South Sector)',
    destinationLocationId: 'LOC-FWD-DELTA',
    destinationLocationName: 'Forward Node Delta (Desert Sector Front)',
    assignedRouteId: 'RTE-06',
    estimatedArrival: '17:00 hrs',
    fuelPercentage: 62,
    maintenanceStatus: 'GOOD',
    driverName: 'Havildar Balbir Negi'
  },
  {
    id: 'VEH-11',
    vehicleId: 'TATRA-8x8-403',
    type: 'Heavy All-Terrain Truck 6x6',
    capacityTons: 12,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-CENTRAL-01',
    currentLocationName: 'Central Strategic Depot (Depot Alpha)',
    fuelPercentage: 85,
    maintenanceStatus: 'GOOD',
    driverName: 'Sepoy Arvind Yadav'
  },
  {
    id: 'VEH-12',
    vehicleId: 'STALLION-4x4-112',
    type: 'Medium Tactical Carrier 4x4',
    capacityTons: 5,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-REG-NORTH',
    currentLocationName: 'Regional Logistic Base (North Sector)',
    fuelPercentage: 90,
    maintenanceStatus: 'GOOD',
    driverName: 'Naik Sandeep Shinde'
  },
  {
    id: 'VEH-13',
    vehicleId: 'SNOWCAT-BV206-02',
    type: 'Extreme Cold Snowcat',
    capacityTons: 2.5,
    currentLoadTons: 2.1,
    status: 'IN_TRANSIT',
    currentLocationId: 'LOC-FWD-ALPHA',
    currentLocationName: 'Forward Node Alpha (High Altitude Pass)',
    destinationLocationId: 'LOC-FWD-BRAVO',
    destinationLocationName: 'Forward Node Bravo (Valley Post)',
    assignedRouteId: 'RTE-02',
    estimatedArrival: '15:45 hrs',
    fuelPercentage: 71,
    maintenanceStatus: 'GOOD',
    driverName: 'Sepoy Nawang Dorje'
  },
  {
    id: 'VEH-14',
    vehicleId: 'STALLION-4x4-114',
    type: 'Medium Tactical Carrier 4x4',
    capacityTons: 5,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-FWD-ECHO',
    currentLocationName: 'Forward Node Echo (River Crossing Base)',
    fuelPercentage: 94,
    maintenanceStatus: 'GOOD',
    driverName: 'Havildar Mohan Lal'
  },
  {
    id: 'VEH-15',
    vehicleId: 'ARMORED-BMP2-MED02',
    type: 'Armored Supply Carrier',
    capacityTons: 3.5,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-FWD-DELTA',
    currentLocationName: 'Forward Node Delta (Desert Sector Front)',
    fuelPercentage: 83,
    maintenanceStatus: 'GOOD',
    driverName: 'Naik Kuldeep Singh'
  },
  {
    id: 'VEH-16',
    vehicleId: 'BOWSER-FUEL-F02',
    type: 'Heavy All-Terrain Truck 6x6',
    capacityTons: 10,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-REG-NORTH',
    currentLocationName: 'Regional Logistic Base (North Sector)',
    fuelPercentage: 89,
    maintenanceStatus: 'GOOD',
    driverName: 'Sepoy Harish Pant'
  },
  {
    id: 'VEH-17',
    vehicleId: 'DRONE-CARGO-UAV03',
    type: 'Autonomous Aerial Logistics Drone',
    capacityTons: 0.25,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-REG-NORTH',
    currentLocationName: 'Regional Logistic Base (North Sector)',
    fuelPercentage: 100,
    maintenanceStatus: 'GOOD',
    driverName: 'Automated Flight Controller GCS-2'
  },
  {
    id: 'VEH-18',
    vehicleId: 'HELI-CHINOOK-H02',
    type: 'Heavy-Lift Logistics Helicopter',
    capacityTons: 9.5,
    currentLoadTons: 0,
    status: 'AVAILABLE',
    currentLocationId: 'LOC-CENTRAL-01',
    currentLocationName: 'Central Strategic Depot (Depot Alpha)',
    fuelPercentage: 95,
    maintenanceStatus: 'GOOD',
    driverName: 'Wing Cdr. R. K. Saxena'
  },
  {
    id: 'VEH-19',
    vehicleId: 'TATRA-8x8-405',
    type: 'Heavy All-Terrain Truck 6x6',
    capacityTons: 12,
    currentLoadTons: 0,
    status: 'MAINTENANCE',
    currentLocationId: 'LOC-REG-SOUTH',
    currentLocationName: 'Regional Logistic Base (South Sector)',
    fuelPercentage: 30,
    maintenanceStatus: 'INSPECTION_DUE',
    driverName: 'EME Workshop Maintenance Bay 2'
  },
  {
    id: 'VEH-20',
    vehicleId: 'STALLION-4x4-120',
    type: 'Medium Tactical Carrier 4x4',
    capacityTons: 5,
    currentLoadTons: 4.2,
    status: 'ASSIGNED',
    currentLocationId: 'LOC-HUB-01',
    currentLocationName: 'Intermodal Transport Hub Kilo',
    destinationLocationId: 'LOC-FWD-CHARLIE',
    destinationLocationName: 'Forward Node Charlie (Tactical Ridge)',
    assignedRouteId: 'RTE-05',
    estimatedArrival: '18:30 hrs',
    fuelPercentage: 86,
    maintenanceStatus: 'GOOD',
    driverName: 'Sepoy Jagtar Singh'
  }
];

export const ITEM_CATALOG: { name: string; category: ItemCategory; unit: string; baseDaily: number; baseMin: number; baseMax: number; leadTime: number }[] = [
  { name: '5.56x45mm NATO Ball Ammunition (Crates)', category: 'Ammunition & Ordnance', unit: 'Crates (1k rnds)', baseDaily: 25, baseMin: 150, baseMax: 1000, leadTime: 4 },
  { name: '7.62x51mm Linked Sniper/MG Cartridges', category: 'Ammunition & Ordnance', unit: 'Boxes (500 rnds)', baseDaily: 15, baseMin: 90, baseMax: 600, leadTime: 4 },
  { name: '84mm Carl Gustaf HE 441D Rockets', category: 'Ammunition & Ordnance', unit: 'Canisters', baseDaily: 8, baseMin: 45, baseMax: 300, leadTime: 6 },
  { name: '120mm Mortar Smoke & HE Bombs', category: 'Ammunition & Ordnance', unit: 'Rounds', baseDaily: 12, baseMin: 70, baseMax: 450, leadTime: 7 },
  { name: 'Aviation Turbine Fuel (ATF Kero-50)', category: 'POL (Petroleum, Oil, Lubricants)', unit: 'Kiloliters (kL)', baseDaily: 40, baseMin: 220, baseMax: 1500, leadTime: 3 },
  { name: 'Diesel High-Altitude Winter Grade (DHA-50)', category: 'POL (Petroleum, Oil, Lubricants)', unit: 'Barrels (200L)', baseDaily: 35, baseMin: 180, baseMax: 1200, leadTime: 3 },
  { name: 'High-Temperature Synthetic Engine Oil', category: 'POL (Petroleum, Oil, Lubricants)', unit: 'Drums (50L)', baseDaily: 6, baseMin: 30, baseMax: 200, leadTime: 5 },
  { name: 'MRE 24-Hour High-Altitude Combat Rations', category: 'Rations & MRE', unit: 'Packs (24h)', baseDaily: 80, baseMin: 400, baseMax: 3000, leadTime: 4 },
  { name: 'Fortified High-Calorie Energy Survival Bars', category: 'Rations & MRE', unit: 'Cartons (100 bars)', baseDaily: 20, baseMin: 110, baseMax: 800, leadTime: 4 },
  { name: 'Dehydrated Pulses & Freeze-Dried Vegetables', category: 'Rations & MRE', unit: 'Sacks (25kg)', baseDaily: 15, baseMin: 80, baseMax: 600, leadTime: 5 },
  { name: 'Tactical Combat Casualty Care (TCCC) Trauma Kits', category: 'Medical & Trauma', unit: 'Individual Kits', baseDaily: 10, baseMin: 60, baseMax: 400, leadTime: 5 },
  { name: 'Lyophilized Whole Blood & IV Plasma Expander', category: 'Medical & Trauma', unit: 'Units (Cryo)', baseDaily: 8, baseMin: 50, baseMax: 350, leadTime: 2 },
  { name: 'High Altitude Cerebral/Pulmonary Edema Meds (HAPE/HACE)', category: 'Medical & Trauma', unit: 'Ampoules/Kits', baseDaily: 14, baseMin: 85, baseMax: 500, leadTime: 3 },
  { name: 'Heavy Vehicle All-Terrain Traction Chains', category: 'Spare Parts & Maintenance', unit: 'Wheel Sets', baseDaily: 4, baseMin: 25, baseMax: 150, leadTime: 7 },
  { name: 'Radiator Anti-Freeze Coolant (-50°C spec)', category: 'Spare Parts & Maintenance', unit: 'Jerry Cans (20L)', baseDaily: 12, baseMin: 65, baseMax: 400, leadTime: 4 },
  { name: 'Multi-Band VHF/UHF Secure Tactical Radios', category: 'Tactical Communications', unit: 'Handheld Units', baseDaily: 3, baseMin: 20, baseMax: 120, leadTime: 8 },
  { name: 'Solar Rapid Recharge Expeditionary Packs', category: 'Tactical Communications', unit: 'Foldable Units', baseDaily: 5, baseMin: 30, baseMax: 180, leadTime: 6 },
  { name: 'Extreme Cold Weather Clothing System (ECWCS Layer 7)', category: 'Cold Weather & Mountaineering', unit: 'Parka + Trousers', baseDaily: 18, baseMin: 100, baseMax: 700, leadTime: 6 },
  { name: 'Crampons, Ice Axes & Fixed Ropes Kit', category: 'Cold Weather & Mountaineering', unit: 'Bundles (50m + Gear)', baseDaily: 6, baseMin: 35, baseMax: 220, leadTime: 7 },
  { name: 'Tactical Drone Replacement Rotors & Battery Cells', category: 'Spare Parts & Maintenance', unit: 'Maintenance Packs', baseDaily: 9, baseMin: 55, baseMax: 360, leadTime: 5 }
];

export function generateInitialDatabase(): DatabaseState {
  const users = [...INITIAL_USERS];
  const locations = [...SYNTHETIC_LOCATIONS];
  const routes = [...SYNTHETIC_ROUTES];
  const vehicles = [...SYNTHETIC_VEHICLES];

  // 1. Generate 50+ inventory items across synthetic locations
  const inventory: InventoryItem[] = [];
  let itemCounter = 1;

  locations.forEach((loc) => {
    // Select a subset or all catalog items for each location
    const catalogSlice = loc.type === 'central_depot' 
      ? ITEM_CATALOG 
      : loc.type === 'forward_node' || loc.type === 'tactical_supply_point'
      ? ITEM_CATALOG.slice(0, 8)
      : ITEM_CATALOG.slice(0, 14);

    catalogSlice.forEach((catItem) => {
      // Differentiate stock by location type
      let stockMultiplier = 1.0;
      if (loc.type === 'central_depot') stockMultiplier = 3.5;
      else if (loc.type === 'regional_depot') stockMultiplier = 1.8;
      else if (loc.type === 'forward_node') stockMultiplier = 0.65;
      else if (loc.type === 'tactical_supply_point') stockMultiplier = 0.25;

      const daily = Math.max(2, Math.round(catItem.baseDaily * (loc.type === 'central_depot' ? 2 : 1)));
      const minStock = Math.round(catItem.baseMin * stockMultiplier);
      const maxStock = Math.round(catItem.baseMax * stockMultiplier);
      
      // Deliberately trigger LOW / CRITICAL at forward nodes for realistic demo scenario
      let currentStock = Math.round(minStock * (1.2 + (Math.sin(itemCounter) * 0.5)));
      if (loc.id === 'LOC-FWD-ALPHA' && (catItem.category.includes('POL') || catItem.category.includes('Cold Weather'))) {
        currentStock = Math.round(minStock * 0.35); // Critical shortage
      } else if (loc.id === 'LOC-TACTICAL-FOXTROT') {
        currentStock = Math.round(minStock * 0.45); // Critical shortage
      } else if (loc.id === 'LOC-FWD-DELTA' && catItem.category.includes('POL')) {
        currentStock = Math.round(minStock * 0.6); // Low stock
      }

      currentStock = Math.max(15, currentStock);

      const safetyStock = calculateSafetyStock(daily, catItem.leadTime, catItem.category);
      const reorderPoint = calculateReorderPoint(daily, catItem.leadTime, safetyStock);
      const expectedDemand7d = Math.round(daily * 7 * (loc.weatherCondition.includes('Cold') ? 1.3 : 1.0));
      const expectedDemand14d = Math.round(daily * 14 * (loc.weatherCondition.includes('Cold') ? 1.3 : 1.0));
      const expectedDemand30d = Math.round(daily * 30 * (loc.weatherCondition.includes('Cold') ? 1.3 : 1.0));

      const risk = calculateStockoutRisk(currentStock, daily * catItem.leadTime, safetyStock);

      let status: 'NORMAL' | 'LOW' | 'CRITICAL' | 'OVERSTOCKED' = 'NORMAL';
      if (currentStock <= minStock * 0.5) status = 'CRITICAL';
      else if (currentStock <= minStock) status = 'LOW';
      else if (currentStock > maxStock * 0.95) status = 'OVERSTOCKED';

      const recommendedReorder = status === 'CRITICAL' || status === 'LOW' 
        ? Math.max(0, Math.round(maxStock * 0.85 - currentStock)) 
        : 0;

      inventory.push({
        id: `INV-REC-${String(itemCounter).padStart(4, '0')}`,
        itemId: `ITM-${catItem.category.slice(0, 3).toUpperCase()}-${String(itemCounter).padStart(3, '0')}`,
        name: catItem.name,
        category: catItem.category,
        locationId: loc.id,
        locationName: loc.name,
        currentStock,
        minStock,
        maxStock,
        dailyConsumption: daily,
        leadTimeDays: catItem.leadTime,
        unit: catItem.unit,
        predictedDemand7d: expectedDemand7d,
        predictedDemand14d: expectedDemand14d,
        predictedDemand30d: expectedDemand30d,
        stockoutRiskScore: risk.score,
        stockoutRiskCategory: risk.category,
        recommendedReorder,
        status,
        lastAudited: new Date(Date.now() - (itemCounter % 14) * 86400000).toISOString()
      });

      itemCounter++;
    });
  });

  // 2. Generate 1,000+ historical demand records (spanning last 90 days)
  const demandHistory: DemandHistoryRecord[] = [];
  let demandIdCounter = 1;
  const now = Date.now();
  const sampleItemsForHistory = inventory.slice(0, 16); // 16 items x 65 days = 1040+ records

  sampleItemsForHistory.forEach((item) => {
    for (let dayOffset = 65; dayOffset >= 0; dayOffset--) {
      const recordDate = new Date(now - dayOffset * 86400000).toISOString().split('T')[0];
      const dayMod = (dayOffset % 7);
      const isWeekendOrSurge = dayMod === 0 || dayMod === 3;
      
      const tempoMultiplier = isWeekendOrSurge ? 1.35 : 1.0;
      const variation = Math.sin(dayOffset / 5) * (item.dailyConsumption * 0.2);
      const randomNoise = (Math.random() - 0.5) * (item.dailyConsumption * 0.15);
      const consumption = Math.max(1, Math.round(item.dailyConsumption * tempoMultiplier + variation + randomNoise));

      const tempos: ('Routine' | 'Heightened Readiness' | 'Field Exercise' | 'Surge Ops')[] = [
        'Routine', 'Routine', 'Heightened Readiness', 'Field Exercise', 'Routine'
      ];

      demandHistory.push({
        id: `DMND-${String(demandIdCounter++).padStart(5, '0')}`,
        itemId: item.itemId,
        itemName: item.name,
        category: item.category,
        locationId: item.locationId,
        locationName: item.locationName,
        date: recordDate,
        consumption,
        weatherCategory: dayOffset > 45 ? 'Monsoon Rain' : dayOffset > 15 ? 'Dense Fog' : 'Extreme Cold / Blizzard',
        operationalTempo: tempos[dayOffset % tempos.length],
        leadTimeRecorded: item.leadTimeDays
      });
    }
  });

  // 3. Generate 100+ inventory transactions
  const inventoryTransactions: InventoryTransaction[] = [];
  const transTypes: ('RECEIPT' | 'DISPATCH' | 'TRANSFER' | 'AUDIT_ADJUSTMENT')[] = ['RECEIPT', 'DISPATCH', 'TRANSFER', 'DISPATCH'];
  const officers = ['Col. Sengupta', 'Lt. Col. Menon', 'Maj. Rathore', 'Capt. Deshmukh'];

  for (let i = 1; i <= 105; i++) {
    const randomItem = inventory[i % inventory.length];
    const transType = transTypes[i % transTypes.length];
    const qty = Math.round(randomItem.dailyConsumption * (1 + (i % 5)));

    inventoryTransactions.push({
      id: `TXN-LOG-${String(i).padStart(4, '0')}`,
      timestamp: new Date(now - (105 - i) * 6 * 3600000).toISOString(),
      itemId: randomItem.itemId,
      itemName: randomItem.name,
      locationId: randomItem.locationId,
      locationName: randomItem.locationName,
      type: transType,
      quantity: qty,
      referenceId: `REF-MO-26251-${1000 + i}`,
      performedBy: officers[i % officers.length],
      remarks: transType === 'RECEIPT' 
        ? `Consignment received from Central Railway Depot under Challan #${8800 + i}`
        : transType === 'DISPATCH'
        ? `Forward movement dispatched for sector readiness drill`
        : transType === 'TRANSFER'
        ? `Intra-sector strategic rebalancing`
        : `Physical ledger discrepancy reconciliation`
    });
  }

  // 4. Generate 12 IoT sensor nodes
  const sensorData: IoTSensorNode[] = [
    {
      id: 'IOT-01',
      sensorId: 'SEN-COLD-ALP-01',
      unitName: 'Depot Alpha Cryo Blood Storage Vault #1',
      locationId: 'LOC-CENTRAL-01',
      locationName: 'Central Strategic Depot (Depot Alpha)',
      targetCategory: 'Medical & Trauma',
      temperatureC: 4.1,
      humidityPercent: 42,
      storageLevelPercent: 88,
      quantity: 320,
      containerPressurePsi: 14.7,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 98,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-02',
      sensorId: 'SEN-FUEL-BLD-02',
      unitName: 'Forward Pass Alpha Fuel Bladder Echo-1',
      locationId: 'LOC-FWD-ALPHA',
      locationName: 'Forward Node Alpha (High Altitude Pass)',
      targetCategory: 'POL (Petroleum, Oil, Lubricants)',
      temperatureC: -16.2,
      humidityPercent: 78,
      storageLevelPercent: 24, // Low fuel level
      quantity: 58,
      containerPressurePsi: 11.2, // Pressure drop anomaly!
      deviceHealth: 'DEGRADED',
      status: 'CRITICAL',
      batteryLevel: 74,
      hasAnomaly: true,
      anomalySeverity: 'CRITICAL',
      anomalyType: 'PRESSURE',
      anomalyDescription: 'Cold flow viscosity warning & pressure drop detected: 11.2 PSI (Baseline 14.5 PSI)',
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-03',
      sensorId: 'SEN-AMMO-BKR-03',
      unitName: 'Forward Node Bravo Ammunition Bunker B4',
      locationId: 'LOC-FWD-BRAVO',
      locationName: 'Forward Node Bravo (Valley Post)',
      targetCategory: 'Ammunition & Ordnance',
      temperatureC: 2.4,
      humidityPercent: 51,
      storageLevelPercent: 58,
      quantity: 410,
      containerPressurePsi: 14.8,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 92,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-04',
      sensorId: 'SEN-RATION-SLO-04',
      unitName: 'Regional Depot North MRE Ration Warehouse A',
      locationId: 'LOC-REG-NORTH',
      locationName: 'Regional Logistic Base (North Sector)',
      targetCategory: 'Rations & MRE',
      temperatureC: 9.2,
      humidityPercent: 45,
      storageLevelPercent: 79,
      quantity: 1850,
      containerPressurePsi: 14.6,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 95,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-05',
      sensorId: 'SEN-MED-CRY-05',
      unitName: 'Tactical Foxtrot Emergency Trauma Cabinet',
      locationId: 'LOC-TACTICAL-FOXTROT',
      locationName: 'Tactical Supply Point Foxtrot',
      targetCategory: 'Medical & Trauma',
      temperatureC: -18.5,
      humidityPercent: 88,
      storageLevelPercent: 22,
      quantity: 28,
      containerPressurePsi: 14.2,
      deviceHealth: 'ONLINE',
      status: 'WARNING',
      batteryLevel: 81,
      hasAnomaly: true,
      anomalySeverity: 'WARNING',
      anomalyType: 'LOW_STORAGE',
      anomalyDescription: 'Critical stock exhaustion threshold reached: 22% remaining',
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-06',
      sensorId: 'SEN-FUEL-DES-06',
      unitName: 'Desert Sector Delta Fuel Reserve Tanker',
      locationId: 'LOC-FWD-DELTA',
      locationName: 'Forward Node Delta (Desert Sector Front)',
      targetCategory: 'POL (Petroleum, Oil, Lubricants)',
      temperatureC: 41.5,
      humidityPercent: 18,
      storageLevelPercent: 36,
      quantity: 110,
      containerPressurePsi: 16.8, // High thermal expansion pressure
      deviceHealth: 'ONLINE',
      status: 'WARNING',
      batteryLevel: 86,
      hasAnomaly: true,
      anomalySeverity: 'WARNING',
      anomalyType: 'TEMPERATURE',
      anomalyDescription: 'High ambient temperature causing thermal fuel expansion (41.5°C)',
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-07',
      sensorId: 'SEN-CLOTH-FWD-07',
      unitName: 'Forward Node Alpha High-Altitude Gear Vault',
      locationId: 'LOC-FWD-ALPHA',
      locationName: 'Forward Node Alpha (High Altitude Pass)',
      targetCategory: 'Cold Weather & Mountaineering',
      temperatureC: -12.0,
      humidityPercent: 62,
      storageLevelPercent: 31,
      quantity: 45,
      containerPressurePsi: 14.7,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 89,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-08',
      sensorId: 'SEN-RADIO-HUB-08',
      unitName: 'Transport Hub Kilo Tactical Radio Secure Locker',
      locationId: 'LOC-HUB-01',
      locationName: 'Intermodal Transport Hub Kilo',
      targetCategory: 'Tactical Communications',
      temperatureC: 21.0,
      humidityPercent: 38,
      storageLevelPercent: 84,
      quantity: 92,
      containerPressurePsi: 14.7,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 99,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-09',
      sensorId: 'SEN-PARTS-SOU-09',
      unitName: 'Regional Depot South Spare Parts Store B',
      locationId: 'LOC-REG-SOUTH',
      locationName: 'Regional Logistic Base (South Sector)',
      targetCategory: 'Spare Parts & Maintenance',
      temperatureC: 23.5,
      humidityPercent: 44,
      storageLevelPercent: 71,
      quantity: 540,
      containerPressurePsi: 14.7,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 94,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-10',
      sensorId: 'SEN-AMMO-RDG-10',
      unitName: 'Forward Charlie Ridge Ordnance Silo 1',
      locationId: 'LOC-FWD-CHARLIE',
      locationName: 'Forward Node Charlie (Tactical Ridge)',
      targetCategory: 'Ammunition & Ordnance',
      temperatureC: -1.0,
      humidityPercent: 55,
      storageLevelPercent: 75,
      quantity: 380,
      containerPressurePsi: 14.7,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 91,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-11',
      sensorId: 'SEN-RATION-ECH-11',
      unitName: 'River Base Echo Ration Storage Shelter',
      locationId: 'LOC-FWD-ECHO',
      locationName: 'Forward Node Echo (River Crossing Base)',
      targetCategory: 'Rations & MRE',
      temperatureC: 26.0,
      humidityPercent: 72,
      storageLevelPercent: 82,
      quantity: 1100,
      containerPressurePsi: 14.7,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 93,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    },
    {
      id: 'IOT-12',
      sensorId: 'SEN-AMMO-DES-12',
      unitName: 'Forward Delta Ordnance Magazine D-3',
      locationId: 'LOC-FWD-DELTA',
      locationName: 'Forward Node Delta (Desert Sector Front)',
      targetCategory: 'Ammunition & Ordnance',
      temperatureC: 37.0,
      humidityPercent: 22,
      storageLevelPercent: 68,
      quantity: 490,
      containerPressurePsi: 14.8,
      deviceHealth: 'ONLINE',
      status: 'NORMAL',
      batteryLevel: 87,
      hasAnomaly: false,
      lastPing: new Date().toISOString()
    }
  ];

  // 5. Generate Alerts
  const alerts: AlertItem[] = [
    {
      id: 'ALT-2026-001',
      timestamp: new Date(now - 15 * 60000).toISOString(),
      type: 'STOCKOUT RISK',
      severity: 'CRITICAL',
      locationId: 'LOC-FWD-ALPHA',
      locationName: 'Forward Node Alpha (High Altitude Pass)',
      title: 'Winter Diesel DHA-50 Critical Depletion',
      description: 'Current fuel reserves below 48-hour buffer under -14°C blizzard conditions. Daily consumption 45 kL vs 58 kL on hand.',
      recommendedAction: 'Immediate dispatch of Tatra 6x6 fuel bowser convoy from Regional Base North or request Chinook emergency airlift.',
      status: 'NEW'
    },
    {
      id: 'ALT-2026-002',
      timestamp: new Date(now - 45 * 60000).toISOString(),
      type: 'INVENTORY ANOMALY',
      severity: 'HIGH',
      locationId: 'LOC-FWD-ALPHA',
      locationName: 'Forward Node Alpha (High Altitude Pass)',
      sensorId: 'SEN-FUEL-BLD-02',
      sensorName: 'Forward Pass Alpha Fuel Bladder Echo-1',
      title: 'Fuel Bladder Echo-1 Sudden Pressure Drop',
      description: 'IoT sensor SEN-FUEL-BLD-02 registered pressure drop to 11.2 PSI (-23% below nominal threshold). Possible thermal contraction or seam seepage.',
      recommendedAction: 'Deploy Base Engineering detachment for visual inspection of storage bladder bladder seals and cold-flow valves.',
      status: 'ACKNOWLEDGED',
      acknowledgedBy: 'Col. Sengupta',
      acknowledgedAt: new Date(now - 20 * 60000).toISOString()
    },
    {
      id: 'ALT-2026-003',
      timestamp: new Date(now - 120 * 60000).toISOString(),
      type: 'LOW STOCK',
      severity: 'HIGH',
      locationId: 'LOC-TACTICAL-FOXTROT',
      locationName: 'Tactical Supply Point Foxtrot',
      title: 'TCCC Medical Trauma Kits Below Minimum Stock',
      description: 'Medical kit inventory at 28 units (Safety threshold 60 units). Sector isolated due to snowfall pass closure.',
      recommendedAction: 'Schedule autonomous cargo UAV sortie (DRONE-CARGO-UAV01) to deliver 25 units payload within flight weather window.',
      status: 'NEW'
    },
    {
      id: 'ALT-2026-004',
      timestamp: new Date(now - 240 * 60000).toISOString(),
      type: 'TRANSPORT DELAY',
      severity: 'WARNING',
      locationId: 'LOC-FWD-BRAVO',
      locationName: 'Forward Node Bravo (Valley Post)',
      title: 'Convoy Delay on Route VALLEY-LINK-BRAVO',
      description: 'STALLION-4x4-105 encountering dense valley fog and rockfall clearance operations. ETA delayed by +45 minutes.',
      recommendedAction: 'Reroute secondary support vehicles via ridge detour and adjust receiving station unloading readiness.',
      status: 'ACKNOWLEDGED',
      acknowledgedBy: 'Maj. Rathore',
      acknowledgedAt: new Date(now - 150 * 60000).toISOString()
    },
    {
      id: 'ALT-2026-005',
      timestamp: new Date(now - 360 * 60000).toISOString(),
      type: 'FORECAST ANOMALY',
      severity: 'INFO',
      locationId: 'LOC-FWD-DELTA',
      locationName: 'Forward Node Delta (Desert Sector Front)',
      title: 'Surge Demand Projected for Heavy Traction Chains & Oil',
      description: 'Approaching dust storm expected to spike mechanical wear on transmission filters and engine cooling systems by +35%.',
      recommendedAction: 'Pre-position 30 drum spares from Regional Depot South before weather front impact.',
      status: 'RESOLVED',
      acknowledgedBy: 'Dr. Sunita Kulkarni',
      acknowledgedAt: new Date(now - 300 * 60000).toISOString()
    },
    {
      id: 'ALT-2026-006',
      timestamp: new Date(now - 480 * 60000).toISOString(),
      type: 'CAPACITY SHORTAGE',
      severity: 'WARNING',
      locationId: 'LOC-HUB-01',
      locationName: 'Intermodal Transport Hub Kilo',
      title: 'Heavy Lift Vehicle Utilization Reaching 90%',
      description: 'Available heavy-duty vehicle capacity constrained due to simultaneous north and south sector supply dispatches.',
      recommendedAction: 'Coordinate with EME workshop to expedite STALLION-4x4-108 routine maintenance release.',
      status: 'NEW'
    },
    {
      id: 'ALT-2026-007',
      timestamp: new Date(now - 10 * 60000).toISOString(),
      type: 'INVENTORY ANOMALY',
      severity: 'CRITICAL',
      locationId: 'LOC-FWD-CHARLIE',
      locationName: 'Forward Node Charlie (Glacier Base)',
      sensorId: 'SEN-COLD-MED-03',
      sensorName: 'Medical Deep Storage Cold Chain Unit',
      title: 'Glacier Base Cold-Chain Refrigeration Excursion',
      description: 'Chamber temperature rose to +9.4°C exceeding critical threshold (+8°C). Rapid refrigeration cycle recovery needed for whole blood and antibiotic reserves.',
      recommendedAction: 'Engage auxiliary battery backup chiller and deploy medical biomedical technician for emergency compressor check.',
      status: 'NEW'
    }
  ];

  // 6. Audit logs
  const auditLogs: AuditLog[] = [
    {
      id: 'AUD-001',
      timestamp: new Date(now - 10 * 60000).toISOString(),
      userId: 'USR-001',
      userName: 'Brig. Rajesh Varma (Retd.)',
      role: 'admin',
      action: 'SYSTEM_CONFIG_UPDATED',
      targetEntity: 'Forecasting Parameters',
      details: 'Adjusted model default lookback horizon to 30 days and set winter weather multiplier to 1.4x'
    },
    {
      id: 'AUD-002',
      timestamp: new Date(now - 25 * 60000).toISOString(),
      userId: 'USR-002',
      userName: 'Col. Amitav Sengupta',
      role: 'logistics_officer',
      action: 'ALERT_ACKNOWLEDGED',
      targetEntity: 'ALT-2026-002',
      details: 'Acknowledged fuel pressure anomaly alert at Forward Node Alpha and initiated EME inspection dispatch'
    },
    {
      id: 'AUD-003',
      timestamp: new Date(now - 45 * 60000).toISOString(),
      userId: 'USR-003',
      userName: 'Lt. Col. Priya Menon',
      role: 'inventory_manager',
      action: 'STOCK_LEVEL_UPDATED',
      targetEntity: 'INV-REC-0014',
      details: 'Reconciled ammunition crate receipts for 120mm mortar rounds at Central Depot Alpha (+150 units)'
    },
    {
      id: 'AUD-004',
      timestamp: new Date(now - 80 * 60000).toISOString(),
      userId: 'USR-004',
      userName: 'Maj. Vikramaditya Rathore',
      role: 'transport_manager',
      action: 'FLEET_DISPATCH_ORDERED',
      targetEntity: 'VEH-02 (TATRA-8x8-402)',
      details: 'Authorized convoy movement on Route NH-ALPHA-EXPRESS to Regional Base North with 10.5 tons general stores'
    }
  ];

  // Initial optimization recommendations
  const recommendations: LogisticsRecommendation[] = [
    {
      id: 'REC-OPT-1001',
      sourceId: 'LOC-REG-NORTH',
      sourceName: 'Regional Logistic Base (North Sector)',
      destinationId: 'LOC-FWD-ALPHA',
      destinationName: 'Forward Node Alpha (High Altitude Pass)',
      itemId: 'ITM-POL-005',
      itemName: 'Diesel High-Altitude Winter Grade (DHA-50)',
      category: 'POL (Petroleum, Oil, Lubricants)',
      supplyQuantity: 120,
      transportType: 'Heavy All-Terrain Truck 6x6',
      estimatedTimeHours: 8.2,
      priority: 'URGENT',
      status: 'RECOMMENDED',
      reasoning: 'Node Alpha projected demand exceeds on-hand reserves under sub-zero blizzard. Replenishment from Regional Base North recommended before pass block.',
      createdAt: new Date(now - 30 * 60000).toISOString()
    },
    {
      id: 'REC-OPT-1002',
      sourceId: 'LOC-REG-NORTH',
      sourceName: 'Regional Logistic Base (North Sector)',
      destinationId: 'LOC-TACTICAL-FOXTROT',
      destinationName: 'Tactical Supply Point Foxtrot',
      itemId: 'ITM-MED-011',
      itemName: 'Tactical Combat Casualty Care (TCCC) Trauma Kits',
      category: 'Medical & Trauma',
      supplyQuantity: 35,
      transportType: 'Autonomous Aerial Logistics Drone',
      estimatedTimeHours: 2.5,
      priority: 'URGENT',
      status: 'RECOMMENDED',
      reasoning: 'Ground route blocked due to glacial snowfall. Autonomous aerial corridor recommended for emergency medical stock replenishment.',
      createdAt: new Date(now - 45 * 60000).toISOString()
    },
    {
      id: 'REC-OPT-1003',
      sourceId: 'LOC-CENTRAL-01',
      sourceName: 'Central Strategic Depot (Depot Alpha)',
      destinationId: 'LOC-FWD-BRAVO',
      destinationName: 'Forward Node Bravo (Valley Post)',
      itemId: 'ITM-RAT-008',
      itemName: 'MRE 24-Hour High-Altitude Combat Rations',
      category: 'Rations & MRE',
      supplyQuantity: 450,
      transportType: 'Medium Tactical Carrier 4x4',
      estimatedTimeHours: 4.0,
      priority: 'HIGH',
      status: 'RECOMMENDED',
      reasoning: 'Pre-positioning 7-day reserve supply to support heightened valley defensive posture and mitigate potential road slips.',
      createdAt: new Date(now - 60 * 60000).toISOString()
    }
  ];

  return {
    users,
    locations,
    inventory,
    inventoryTransactions,
    demandHistory,
    vehicles,
    routes,
    recommendations,
    sensorData,
    alerts,
    auditLogs
  };
}

// In-Memory Database Singleton with instant reset capability
class DatabaseService {
  private state: DatabaseState;

  constructor() {
    this.state = generateInitialDatabase();
  }

  public resetDemoData(): DatabaseState {
    this.state = generateInitialDatabase();
    return this.state;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  // Users
  public getUsers(): User[] {
    return this.state.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `USR-${String(this.state.users.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString()
    };
    this.state.users.push(newUser);
    return newUser;
  }

  public updateUserRole(id: string, role: User['role']): User | undefined {
    const user = this.state.users.find(u => u.id === id);
    if (user) {
      user.role = role;
    }
    return user;
  }

  // Locations
  public getLocations(): LogisticsLocation[] {
    return this.state.locations;
  }

  public getLocationById(id: string): LogisticsLocation | undefined {
    return this.state.locations.find(l => l.id === id);
  }

  public updateLocationStatus(id: string, status: LogisticsLocation['status'], riskLevel: LogisticsLocation['riskLevel']): LogisticsLocation | undefined {
    const loc = this.state.locations.find(l => l.id === id);
    if (loc) {
      loc.status = status;
      loc.riskLevel = riskLevel;
    }
    return loc;
  }

  // Inventory
  public getInventory(): InventoryItem[] {
    return this.state.inventory;
  }

  public getInventoryItemById(id: string): InventoryItem | undefined {
    return this.state.inventory.find(i => i.id === id || i.itemId === id);
  }

  public createInventoryItem(item: Omit<InventoryItem, 'id' | 'stockoutRiskScore' | 'stockoutRiskCategory' | 'status' | 'lastAudited'>): InventoryItem {
    const safetyStock = calculateSafetyStock(item.dailyConsumption, item.leadTimeDays, item.category);
    const risk = calculateStockoutRisk(item.currentStock, item.dailyConsumption * item.leadTimeDays, safetyStock);
    
    let status: 'NORMAL' | 'LOW' | 'CRITICAL' | 'OVERSTOCKED' = 'NORMAL';
    if (item.currentStock <= item.minStock * 0.5) status = 'CRITICAL';
    else if (item.currentStock <= item.minStock) status = 'LOW';
    else if (item.currentStock > item.maxStock * 0.95) status = 'OVERSTOCKED';

    const newItem: InventoryItem = {
      ...item,
      id: `INV-REC-${String(this.state.inventory.length + 1).padStart(4, '0')}`,
      stockoutRiskScore: risk.score,
      stockoutRiskCategory: risk.category,
      status,
      lastAudited: new Date().toISOString()
    };
    this.state.inventory.push(newItem);
    return newItem;
  }

  public updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem | undefined {
    const index = this.state.inventory.findIndex(i => i.id === id || i.itemId === id);
    if (index === -1) return undefined;

    const existing = this.state.inventory[index];
    const updated = { ...existing, ...updates };

    // Recalculate risk & status
    const safetyStock = calculateSafetyStock(updated.dailyConsumption, updated.leadTimeDays, updated.category);
    const risk = calculateStockoutRisk(updated.currentStock, updated.dailyConsumption * updated.leadTimeDays, safetyStock);
    
    let status: 'NORMAL' | 'LOW' | 'CRITICAL' | 'OVERSTOCKED' = 'NORMAL';
    if (updated.currentStock <= updated.minStock * 0.5) status = 'CRITICAL';
    else if (updated.currentStock <= updated.minStock) status = 'LOW';
    else if (updated.currentStock > updated.maxStock * 0.95) status = 'OVERSTOCKED';

    updated.stockoutRiskScore = risk.score;
    updated.stockoutRiskCategory = risk.category;
    updated.status = status;
    updated.lastAudited = new Date().toISOString();

    this.state.inventory[index] = updated;
    return updated;
  }

  public deleteInventoryItem(id: string): boolean {
    const initialLen = this.state.inventory.length;
    this.state.inventory = this.state.inventory.filter(i => i.id !== id && i.itemId !== id);
    return this.state.inventory.length < initialLen;
  }

  // Demand History
  public getDemandHistory(itemId?: string, locationId?: string): DemandHistoryRecord[] {
    let list = this.state.demandHistory;
    if (itemId) list = list.filter(d => d.itemId === itemId);
    if (locationId) list = list.filter(d => d.locationId === locationId);

    // If specific item requested and no history yet in memory, generate deterministic 30-day history
    if (itemId && list.length === 0) {
      const item = this.state.inventory.find(i => i.itemId === itemId || i.id === itemId);
      if (item) {
        const now = Date.now();
        const tempos: ('Routine' | 'Heightened Readiness' | 'Field Exercise' | 'Surge Ops')[] = [
          'Routine', 'Routine', 'Heightened Readiness', 'Field Exercise', 'Routine'
        ];
        const newRecords: DemandHistoryRecord[] = [];
        for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
          const recordDate = new Date(now - dayOffset * 86400000).toISOString().split('T')[0];
          const dayMod = (dayOffset % 7);
          const isSurge = dayMod === 0 || dayMod === 3;
          const tempoMult = isSurge ? 1.25 : 1.0;
          const variation = Math.sin(dayOffset / 4) * (item.dailyConsumption * 0.18);
          const consumption = Math.max(1, Math.round(item.dailyConsumption * tempoMult + variation));

          newRecords.push({
            id: `DMND-GEN-${item.itemId}-${dayOffset}`,
            itemId: item.itemId,
            itemName: item.name,
            category: item.category,
            locationId: item.locationId,
            locationName: item.locationName,
            date: recordDate,
            consumption,
            weatherCategory: dayOffset > 15 ? 'Dense Fog' : 'Extreme Cold / Blizzard',
            operationalTempo: tempos[dayOffset % tempos.length],
            leadTimeRecorded: item.leadTimeDays
          });
        }
        this.state.demandHistory.push(...newRecords);
        return newRecords;
      }
    }

    return list;
  }

  // Vehicles
  public getVehicles(): Vehicle[] {
    return this.state.vehicles;
  }

  public updateVehicleStatus(id: string, status: Vehicle['status'], destinationLocationId?: string): Vehicle | undefined {
    const v = this.state.vehicles.find(veh => veh.id === id || veh.vehicleId === id);
    if (v) {
      v.status = status;
      if (destinationLocationId) {
        v.destinationLocationId = destinationLocationId;
        const destLoc = this.state.locations.find(l => l.id === destinationLocationId);
        v.destinationLocationName = destLoc ? destLoc.name : undefined;
      }
    }
    return v;
  }

  // Routes
  public getRoutes(): LogisticsRoute[] {
    return this.state.routes;
  }

  // Recommendations
  public getRecommendations(): LogisticsRecommendation[] {
    return this.state.recommendations;
  }

  public setRecommendations(recs: LogisticsRecommendation[]) {
    this.state.recommendations = recs;
  }

  public approveRecommendation(recId: string): LogisticsRecommendation | undefined {
    const rec = this.state.recommendations.find(r => r.id === recId);
    if (!rec) return undefined;

    rec.status = 'APPROVED';

    // Create corresponding dispatch transaction
    this.addInventoryTransaction({
      itemId: rec.itemId,
      itemName: rec.itemName,
      locationId: rec.sourceId,
      locationName: rec.sourceName,
      type: 'DISPATCH',
      quantity: rec.supplyQuantity,
      referenceId: `DISPATCH-${rec.id}`,
      performedBy: 'Logistics Optimization Automation',
      remarks: `Automated replenishment dispatch to ${rec.destinationName}`
    });

    return rec;
  }

  // IoT Sensors
  public getSensorData(): IoTSensorNode[] {
    // Apply realistic subtle live telemetry fluctuations
    this.state.sensorData = this.state.sensorData.map(sensor => {
      const jittered = applyLiveTelemetryJitter(sensor);
      const { status } = evaluateSensorAnomalies(jittered);
      return {
        ...jittered,
        status: sensor.hasAnomaly ? sensor.status : status
      };
    });
    return this.state.sensorData;
  }

  public triggerSensorAnomaly(sensorId: string): IoTSensorNode | undefined {
    const result = this.triggerSensorScenario(sensorId, 'temperature');
    return result?.sensor;
  }

  public triggerSensorScenario(
    sensorId: string, 
    scenario: 'temperature' | 'humidity' | 'low_storage' | 'low_battery' | 'offline'
  ): { sensor: IoTSensorNode; alert?: AlertItem } | undefined {
    const node = this.state.sensorData.find(s => s.sensorId === sensorId || s.id === sensorId);
    if (!node) return undefined;

    node.hasAnomaly = true;
    let alertTitle = '';
    let alertDesc = '';
    let alertRec = '';
    let alertSev: 'WARNING' | 'CRITICAL' = 'CRITICAL';

    switch (scenario) {
      case 'temperature': {
        node.anomalyType = 'TEMPERATURE';
        node.anomalySeverity = 'CRITICAL';
        node.temperatureC = node.temperatureC < 0 ? node.temperatureC - 16 : node.temperatureC + 24.5;
        node.status = 'CRITICAL';
        node.deviceHealth = 'CRITICAL';
        node.anomalyDescription = `SIMULATED ANOMALY: Severe thermal out-of-bounds reading (${node.temperatureC}°C) for ${node.targetCategory}.`;
        alertTitle = `IoT Alert: Thermal Breach at ${node.unitName}`;
        alertDesc = `Sensor ${node.sensorId} logged abnormal temperature: ${node.temperatureC}°C.`;
        alertRec = 'Inspect cooling/heating generators and thermal containment seals immediately.';
        break;
      }
      case 'humidity': {
        node.anomalyType = 'HUMIDITY';
        node.anomalySeverity = 'WARNING';
        node.humidityPercent = 89;
        node.status = 'WARNING';
        node.deviceHealth = 'DEGRADED';
        node.anomalyDescription = `SIMULATED ANOMALY: Severe moisture ingress detected (89% humidity). Corrosion/degradation threat.`;
        alertTitle = `IoT Alert: High Humidity Breach at ${node.unitName}`;
        alertDesc = `Sensor ${node.sensorId} reports 89% humidity, exceeding safe tolerance for ${node.targetCategory}.`;
        alertRec = 'Activate dehumidifiers and inspect protective weather seals.';
        alertSev = 'WARNING';
        break;
      }
      case 'low_storage': {
        node.anomalyType = 'LOW_STORAGE';
        node.anomalySeverity = 'CRITICAL';
        node.storageLevelPercent = 11;
        node.quantity = Math.max(10, Math.round(node.quantity * 0.15));
        node.status = 'CRITICAL';
        node.deviceHealth = 'DEGRADED';
        node.anomalyDescription = `SIMULATED ANOMALY: Critical stock depletion detected by level telemetry (11% remaining).`;
        alertTitle = `IoT Critical Alert: Urgent Stock Depletion in ${node.unitName}`;
        alertDesc = `Storage level dropped to 11% (${node.quantity} units remaining). Threshold breach: minimum safe buffer is 25%.`;
        alertRec = 'Emergency convoy or aerial UAV supply dispatch recommended immediately.';

        // Connect IoT storage-level drop with Inventory System!
        const matchingItem = this.state.inventory.find(i => 
          i.locationId === node.locationId && i.category === node.targetCategory
        );
        if (matchingItem) {
          matchingItem.currentStock = Math.round(matchingItem.minStock * 0.35); // Critical shortage
          const safetyStock = calculateSafetyStock(matchingItem.dailyConsumption, matchingItem.leadTimeDays, matchingItem.category);
          matchingItem.stockoutRiskScore = 96;
          matchingItem.stockoutRiskCategory = 'CRITICAL';
          matchingItem.status = 'CRITICAL';
          matchingItem.recommendedReorder = Math.max(100, Math.round(matchingItem.maxStock * 0.85 - matchingItem.currentStock));
        }
        break;
      }
      case 'low_battery': {
        node.anomalyType = 'LOW_BATTERY';
        node.anomalySeverity = 'CRITICAL';
        node.batteryLevel = 8;
        node.status = 'CRITICAL';
        node.deviceHealth = 'CRITICAL';
        node.anomalyDescription = `SIMULATED ANOMALY: Critical sensor battery depletion (8%). Shutdown imminent.`;
        alertTitle = `IoT Device Alert: Battery Exhaustion at ${node.unitName}`;
        alertDesc = `Sensor node ${node.sensorId} battery at 8%. Telemetry reporting will cease soon.`;
        alertRec = 'Deploy communications/maintenance personnel for cell battery replacement or solar connection check.';
        break;
      }
      case 'offline': {
        node.anomalyType = 'OFFLINE';
        node.anomalySeverity = 'CRITICAL';
        node.status = 'OFFLINE';
        node.deviceHealth = 'CRITICAL';
        node.lastPing = new Date(Date.now() - 35 * 60000).toISOString(); // 35 mins ago
        node.anomalyDescription = `SIMULATED ANOMALY: Gateway communication drop. Node offline for >30 minutes.`;
        alertTitle = `IoT Telemetry Lost: ${node.unitName} OFFLINE`;
        alertDesc = `No heartbeat signal received from ${node.sensorId} for over 30 minutes. Link down.`;
        alertRec = 'Verify RF transceiver line of sight and repeater power status.';
        break;
      }
    }

    node.lastPing = new Date().toISOString();

    const createdAlert = this.createAlert({
      type: 'INVENTORY ANOMALY',
      severity: alertSev,
      locationId: node.locationId,
      locationName: node.locationName,
      sensorId: node.sensorId,
      sensorName: node.unitName,
      title: alertTitle,
      description: alertDesc,
      recommendedAction: alertRec
    });

    // Check for multiple concurrent abnormal readings at the same location
    const anomalousAtLocation = this.state.sensorData.filter(s => s.locationId === node.locationId && s.hasAnomaly);
    if (anomalousAtLocation.length >= 2) {
      const existingClusterAlert = this.state.alerts.find(a => 
        a.locationId === node.locationId && 
        a.title.includes('Multiple Sensor Anomalies') && 
        a.status !== 'RESOLVED'
      );
      if (!existingClusterAlert) {
        this.createAlert({
          type: 'INVENTORY ANOMALY',
          severity: 'CRITICAL',
          locationId: node.locationId,
          locationName: node.locationName,
          sensorId: `CLUSTER-${node.locationId}`,
          sensorName: `Multiple Sensors (${anomalousAtLocation.map(s => s.sensorId).join(', ')})`,
          title: `Compound Anomaly: Multiple Sensor Failures at ${node.locationName}`,
          description: `${anomalousAtLocation.length} active sensor alarms detected concurrently at ${node.locationName}. High operational risk across storage facilities.`,
          recommendedAction: 'Dispatch on-site inspection team and prepare urgent transfer contingency.'
        });
      }
    }

    return { sensor: node, alert: createdAlert };
  }

  public resetSensorSimulation(): IoTSensorNode[] {
    // Re-seed all sensors to healthy baseline
    const freshDb = generateInitialDatabase();
    this.state.sensorData = freshDb.sensorData;
    // Resolve synthetic IoT alerts
    this.state.alerts = this.state.alerts.map(a => {
      if (a.type === 'INVENTORY ANOMALY') {
        return { ...a, status: 'RESOLVED' as const };
      }
      return a;
    });
    return this.state.sensorData;
  }

  // Safe Demo Scenario Simulation Engine (Prompt 4)
  public simulateScenario(scenario: 'demand_surge' | 'inventory_reduction' | 'weather_deterioration' | 'sensor_anomaly'): {
    scenario: string;
    description: string;
    affectedCount: number;
  } {
    let affectedCount = 0;
    let description = '';

    switch (scenario) {
      case 'demand_surge': {
        this.state.inventory.forEach(item => {
          if (item.locationId.startsWith('LOC-FWD') || item.locationId.startsWith('LOC-TACTICAL')) {
            item.dailyConsumption = Math.round(item.dailyConsumption * 1.35);
            item.predictedDemand7d = Math.round(item.predictedDemand7d * 1.35);
            item.predictedDemand14d = Math.round(item.predictedDemand14d * 1.35);
            item.stockoutRiskScore = Math.min(100, Math.round(item.stockoutRiskScore * 1.35));
            if (item.stockoutRiskScore >= 75) item.status = 'CRITICAL';
            else if (item.stockoutRiskScore >= 50) item.status = 'LOW';
            affectedCount++;
          }
        });
        description = 'Simulated +35% operational demand surge across all 7 forward nodes and tactical supply points';
        this.createAlert({
          type: 'HIGH DEMAND',
          severity: 'HIGH',
          locationId: 'LOC-FWD-ALPHA',
          locationName: 'Forward Node Alpha (High Altitude Pass)',
          title: 'Simulated Operational Demand Surge (+35%)',
          description: 'Intense cold weather tactical tempo has elevated daily burn rates on POL fuel, ammunition, and rations by +35%.',
          recommendedAction: 'Increase transport convoy dispatch frequency and review safety stock buffers.'
        });
        break;
      }
      case 'inventory_reduction': {
        this.state.inventory.forEach(item => {
          if (item.locationId === 'LOC-FWD-ALPHA' || item.locationId === 'LOC-TACTICAL-FOXTROT' || item.locationId === 'LOC-FWD-DELTA') {
            item.currentStock = Math.max(5, Math.round(item.currentStock * 0.55));
            item.stockoutRiskScore = 95;
            item.stockoutRiskCategory = 'CRITICAL';
            item.status = 'CRITICAL';
            affectedCount++;
          }
        });
        description = 'Simulated -45% forward inventory depletion at Forward Alpha, Foxtrot, and Delta';
        this.createAlert({
          type: 'STOCKOUT RISK',
          severity: 'CRITICAL',
          locationId: 'LOC-FWD-ALPHA',
          locationName: 'Forward Node Alpha (High Altitude Pass)',
          title: 'Emergency Stock Exhaustion Simulated',
          description: 'Forward reserve levels depleted below 24-hour survival threshold. Urgent replenishment required.',
          recommendedAction: 'Authorize immediate emergency airlift and priority transfer order.'
        });
        break;
      }
      case 'weather_deterioration': {
        this.state.locations.forEach(loc => {
          if (loc.id === 'LOC-FWD-ALPHA' || loc.id === 'LOC-TACTICAL-FOXTROT') {
            loc.weatherCondition = 'Severe Mountain Blizzard & Gale';
            loc.temperatureC = -24;
            loc.status = 'WEATHER_ALERT';
            loc.riskLevel = 'CRITICAL';
            affectedCount++;
          }
        });
        this.state.routes.forEach(route => {
          if (route.sourceId === 'LOC-FWD-ALPHA' || route.destinationId === 'LOC-FWD-ALPHA' || route.destinationId === 'LOC-TACTICAL-FOXTROT') {
            route.status = 'PASS_BLOCKED';
            route.currentTravelHours = Number((route.standardTravelHours * 2.5).toFixed(1));
            route.riskLevel = 'HIGH';
          }
        });
        description = 'Simulated severe -24°C blizzard causing Rohtang mountain pass closure';
        this.createAlert({
          type: 'TRANSPORT DELAY',
          severity: 'CRITICAL',
          locationId: 'LOC-FWD-ALPHA',
          locationName: 'Forward Node Alpha (High Altitude Pass)',
          title: 'Extreme Blizzard Closes Mountain Pass Route',
          description: 'Snow accumulation exceeding 1.2m and -24°C gale winds. High altitude pass corridor closed to wheeled convoys.',
          recommendedAction: 'Switch to Extreme Cold Snowcat or autonomous cargo UAV air corridor.'
        });
        break;
      }
      case 'sensor_anomaly': {
        this.triggerSensorScenario('IOT-01', 'temperature');
        this.triggerSensorScenario('IOT-02', 'low_storage');
        affectedCount = 2;
        description = 'Triggered compound sensor alarms: thermal breach at Depot Alpha cryo vault and critical low fuel at Forward Alpha';
        break;
      }
    }

    return { scenario, description, affectedCount };
  }

  // Alerts
  public getAlerts(): AlertItem[] {
    return this.state.alerts;
  }

  public createAlert(alert: Omit<AlertItem, 'id' | 'timestamp' | 'status'>): AlertItem {
    const newAlert: AlertItem = {
      ...alert,
      id: `ALT-2026-${String(this.state.alerts.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      status: 'NEW'
    };
    this.state.alerts.unshift(newAlert);
    return newAlert;
  }

  public acknowledgeAlert(id: string, acknowledgedBy: string): AlertItem | undefined {
    let alert = this.state.alerts.find(a => a.id === id);
    if (!alert) {
      alert = {
        id,
        timestamp: new Date().toISOString(),
        type: 'INVENTORY ANOMALY',
        severity: 'HIGH',
        locationId: 'LOC-FWD-ALPHA',
        locationName: 'Forward Node Alpha (High Altitude Pass)',
        title: `Operational Alert ${id}`,
        description: `Operational event tracked by automated early warning system for ${id}.`,
        recommendedAction: 'Maintain tactical monitoring and log standard incident assessment.',
        status: 'ACKNOWLEDGED',
        acknowledgedBy,
        acknowledgedAt: new Date().toISOString()
      };
      this.state.alerts.unshift(alert);
      return alert;
    }
    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
    return alert;
  }

  public resolveAlert(id: string): AlertItem | undefined {
    let alert = this.state.alerts.find(a => a.id === id);
    if (!alert) {
      alert = {
        id,
        timestamp: new Date().toISOString(),
        type: 'INVENTORY ANOMALY',
        severity: 'HIGH',
        locationId: 'LOC-FWD-ALPHA',
        locationName: 'Forward Node Alpha (High Altitude Pass)',
        title: `Operational Alert ${id}`,
        description: `Operational event tracked by automated early warning system for ${id}.`,
        recommendedAction: 'Operational alert confirmed resolved and closed in base log.',
        status: 'RESOLVED'
      };
      this.state.alerts.unshift(alert);
      return alert;
    }
    alert.status = 'RESOLVED';
    return alert;
  }

  // Transactions & Audits
  public addInventoryTransaction(tx: Omit<InventoryTransaction, 'id' | 'timestamp'>): InventoryTransaction {
    const newTx: InventoryTransaction = {
      ...tx,
      id: `TXN-LOG-${String(this.state.inventoryTransactions.length + 1).padStart(4, '0')}`,
      timestamp: new Date().toISOString()
    };
    this.state.inventoryTransactions.unshift(newTx);
    return newTx;
  }

  public getTransactions(): InventoryTransaction[] {
    return this.state.inventoryTransactions;
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `AUD-${String(this.state.auditLogs.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString()
    };
    this.state.auditLogs.unshift(newLog);
    return newLog;
  }

  public getAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }
}

export const db = new DatabaseService();
