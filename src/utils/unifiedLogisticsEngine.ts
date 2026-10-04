import { 
  InventoryItem, 
  LogisticsLocation, 
  LogisticsRoute, 
  IoTSensorNode, 
  AlertItem,
  LocationLogisticsStatus,
  AnticipatedRequirementItem,
  RouteLogisticsStatus,
  UnifiedDashboardSummary,
  ReplenishmentAction,
  WeatherImpactLevel
} from '../types';
import { calculateSafetyStock } from './demandForecastingEngine';
import { evaluateSensorAnomalies } from './iotConfig';

/**
 * UNIFIED PREDICTIVE LOGISTICS ENGINE
 * 
 * Implements the end-to-end data pipeline:
 * Historical Consumption + Current Inventory + Daily Consumption + Lead Time + Safety Stock
 * + Weather Conditions + Terrain / Accessibility + IoT Sensor Status
 *   ↓
 * Demand Forecast
 *   ↓
 * Projected Inventory
 *   ↓
 * Stockout Risk
 *   ↓
 * Environmental / Logistics Risk
 *   ↓
 * Anticipated Requirement
 *   ↓
 * Replenishment Recommendation
 *   ↓
 * Dashboard + Alerts
 */

/**
 * Evaluates comprehensive logistics status and multi-factor explainable risk for a single location.
 */
export function calculateLocationLogisticsStatus(
  location: LogisticsLocation,
  inventory: InventoryItem[],
  sensors: IoTSensorNode[],
  routes: LogisticsRoute[],
  alerts: AlertItem[]
): LocationLogisticsStatus {
  // 1. Inventory & Consumption Aggregations
  const itemsAtLoc = inventory.filter(i => i.locationId === location.id);
  const totalItemsCount = itemsAtLoc.length;
  const criticalItemsCount = itemsAtLoc.filter(i => i.status === 'CRITICAL' || i.stockoutRiskScore >= 75).length;
  const lowItemsCount = itemsAtLoc.filter(i => i.status === 'LOW').length;
  const totalCurrentStock = itemsAtLoc.reduce((s, i) => s + i.currentStock, 0);
  const totalDailyConsumption = itemsAtLoc.reduce((s, i) => s + i.dailyConsumption, 0);
  const totalForecastDemand7d = itemsAtLoc.reduce((s, i) => s + i.predictedDemand7d, 0);
  const totalSafetyStock = itemsAtLoc.reduce((s, i) => s + calculateSafetyStock(i.dailyConsumption, i.leadTimeDays, i.category), 0);
  const totalProjectedInventory7d = Math.max(0, totalCurrentStock - totalForecastDemand7d);
  
  const averageStockoutRisk = itemsAtLoc.length 
    ? Math.round(itemsAtLoc.reduce((s, i) => s + i.stockoutRiskScore, 0) / itemsAtLoc.length) 
    : 0;

  // 2. IoT Sensor Edge Health
  const sensorsAtLoc = sensors.filter(s => s.locationId === location.id);
  const sensorsTotal = sensorsAtLoc.length;
  
  let sensorsNormal = 0;
  let sensorsWarning = 0;
  let sensorsCritical = 0;
  let sensorsOffline = 0;
  let hasActiveAnomalies = false;

  sensorsAtLoc.forEach(sensor => {
    const { status, anomalies } = evaluateSensorAnomalies(sensor);
    const effectiveStatus = sensor.status === 'OFFLINE' ? 'OFFLINE' : (sensor.hasAnomaly ? sensor.status : status);

    if (effectiveStatus === 'OFFLINE') sensorsOffline++;
    else if (effectiveStatus === 'CRITICAL') sensorsCritical++;
    else if (effectiveStatus === 'WARNING') sensorsWarning++;
    else sensorsNormal++;

    if (sensor.hasAnomaly || anomalies.length > 0) {
      hasActiveAnomalies = true;
    }
  });

  const iotStatusSummary = sensorsTotal === 0 
    ? 'No Edge Sensors' 
    : sensorsCritical > 0 
      ? `${sensorsCritical} Critical Sensor Alert${sensorsCritical > 1 ? 's' : ''}`
      : sensorsWarning > 0
        ? `${sensorsWarning} Sensor Warning${sensorsWarning > 1 ? 's' : ''}`
        : sensorsOffline > 0
          ? `${sensorsOffline} Sensor Offline`
          : 'All Sensors Nominal';

  // 3. Environmental & Terrain Accessibility
  const weatherCondition = location.weatherData?.weatherCondition || location.weatherCondition || 'Clear';
  const temperatureC = location.weatherData?.temperatureC ?? location.temperatureC ?? 15;
  const weatherImpact: WeatherImpactLevel = location.weatherData?.weatherImpact || (
    temperatureC < -10 || weatherCondition.toLowerCase().includes('blizzard') || weatherCondition.toLowerCase().includes('storm') 
      ? 'HIGH' 
      : temperatureC < 0 || weatherCondition.toLowerCase().includes('rain') 
        ? 'MEDIUM' 
        : 'LOW'
  );
  const weatherReasoning = location.weatherData?.impactReasoning || [
    `Current temperature: ${temperatureC}°C, condition: ${weatherCondition}`
  ];

  const altitudeMeters = location.altitudeMeters || 1200;
  const terrainType = location.terrainType || 'Standard Valley / Plains';
  
  let accessibilityStatus = location.accessibilityIndicator || 'All-Weather Heavy Highway';
  let accessibilityRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  
  if (altitudeMeters >= 4000 || accessibilityStatus.includes('Snowbound') || accessibilityStatus.includes('Specialized')) {
    accessibilityRisk = 'HIGH';
  } else if (altitudeMeters >= 2500 || accessibilityStatus.includes('Single-Lane') || accessibilityStatus.includes('Seasonally')) {
    accessibilityRisk = 'MEDIUM';
  }

  // 4. Connected Transport Routes
  const connectedRoutes = routes.filter(r => r.sourceId === location.id || r.destinationId === location.id);
  const hasBlockedRoute = connectedRoutes.some(r => r.status === 'PASS_BLOCKED');
  const hasDegradedRoute = connectedRoutes.some(r => r.status === 'DEGRADED' || r.status === 'INCLEMENT_WEATHER');

  // 5. Multi-Factor Explainable Risk Scoring Engine
  const whyReasons: string[] = [];

  // Factor A: Inventory Risk (Weight 35%)
  let invScore = 15;
  let invLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let invReason = 'Stock levels adequate above minimum thresholds';

  if (criticalItemsCount > 0 || totalProjectedInventory7d === 0) {
    invScore = 95;
    invLevel = 'CRITICAL';
    invReason = `${criticalItemsCount} item(s) in critical stock exhaustion; stockout imminent`;
    whyReasons.push(`Critical Inventory: ${criticalItemsCount} supply line(s) below 48h emergency buffer`);
  } else if (lowItemsCount > 0 || totalProjectedInventory7d < totalSafetyStock) {
    invScore = 65;
    invLevel = 'HIGH';
    invReason = 'Projected 7-day inventory dips below required safety stock buffer';
    whyReasons.push('Safety Stock Deficit: Projected 7-day consumption breaches safety reserve');
  } else if (averageStockoutRisk >= 35) {
    invScore = 40;
    invLevel = 'MEDIUM';
    invReason = `Elevated consumption rate across ${totalItemsCount} tracked lines`;
    whyReasons.push('Elevated Burn Rate: Moderate stockout risk detected across forward stores');
  }

  // Factor B: Weather Risk (Weight 20%)
  let wScore = 15;
  let wLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let wReason = 'Weather conditions within nominal logistical limits';

  if (weatherImpact === 'HIGH') {
    wScore = 90;
    wLevel = 'HIGH';
    wReason = `Severe weather hazard (${weatherCondition}, ${temperatureC}°C); transport speed reduced`;
    whyReasons.push(`Weather Impact HIGH: ${weatherCondition} (${temperatureC}°C) impacting logistics throughput`);
  } else if (weatherImpact === 'MEDIUM') {
    wScore = 50;
    wLevel = 'MEDIUM';
    wReason = `Moderate weather impact (${temperatureC}°C); requires traction checks`;
    whyReasons.push(`Weather Impact MEDIUM: Low temperature (${temperatureC}°C) requires vehicle winterization`);
  }

  // Factor C: Terrain & Accessibility Risk (Weight 15%)
  let tScore = 15;
  let tLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let tReason = 'Direct all-weather road access available';

  if (accessibilityRisk === 'HIGH') {
    tScore = 85;
    tLevel = 'HIGH';
    tReason = `Extreme elevation (${altitudeMeters}m); ${accessibilityStatus}`;
    whyReasons.push(`Terrain Challenge: High altitude (${altitudeMeters}m), ${accessibilityStatus}`);
  } else if (accessibilityRisk === 'MEDIUM') {
    tScore = 50;
    tLevel = 'MEDIUM';
    tReason = `Mountain pass access (${altitudeMeters}m); speed restrictions`;
    whyReasons.push(`Terrain: Mountain corridor (${altitudeMeters}m) subject to seasonal bottlenecks`);
  }

  // Factor D: IoT & Storage Condition Risk (Weight 15%)
  let iotScore = 10;
  let iotLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let iotReason = 'All storage sensor nodes reporting nominal readings';

  if (sensorsCritical > 0 || sensorsOffline > 0) {
    iotScore = 90;
    iotLevel = 'CRITICAL';
    iotReason = `${sensorsCritical} sensor critical alarm(s) / ${sensorsOffline} offline node(s)`;
    whyReasons.push(`IoT Edge Anomaly: ${sensorsCritical} critical sensor alarm(s) active on storage bunkers`);
  } else if (sensorsWarning > 0) {
    iotScore = 50;
    iotLevel = 'WARNING' as any;
    iotReason = `${sensorsWarning} sensor threshold warning(s) detected`;
    whyReasons.push(`IoT Drift: ${sensorsWarning} storage sensor(s) reporting threshold deviations`);
  }

  // Factor E: Transport & Route Risk (Weight 15%)
  let rScore = 15;
  let rLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let rReason = 'Connecting logistics routes clear and operational';

  if (hasBlockedRoute) {
    rScore = 90;
    rLevel = 'HIGH';
    rReason = 'Connected mountain pass corridor blocked';
    whyReasons.push('Route Interruption: Connecting mountain pass corridor reported blocked');
  } else if (hasDegradedRoute) {
    rScore = 55;
    rLevel = 'MEDIUM';
    rReason = 'Connecting convoy route experiencing weather delays';
    whyReasons.push('Route Degraded: Convoy routes experiencing transit delays');
  }

  // Composite Weighted Score: 35% Inv + 20% Weather + 15% Terrain + 15% IoT + 15% Route
  const compositeRiskScore = Math.min(100, Math.round(
    0.35 * invScore + 
    0.20 * wScore + 
    0.15 * tScore + 
    0.15 * iotScore + 
    0.15 * rScore
  ));

  let overallLogisticsRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (compositeRiskScore >= 70 || invLevel === 'CRITICAL') {
    overallLogisticsRisk = 'CRITICAL';
  } else if (compositeRiskScore >= 45 || invLevel === 'HIGH' || wLevel === 'HIGH') {
    overallLogisticsRisk = 'HIGH';
  } else if (compositeRiskScore >= 25) {
    overallLogisticsRisk = 'MEDIUM';
  }

  // Anticipated Requirements Count for this location
  let anticipatedRequirementsCount = 0;
  let totalRequiredQuantity = 0;
  let topPriorityAction: ReplenishmentAction = 'NO ACTION';

  itemsAtLoc.forEach(item => {
    const sStock = calculateSafetyStock(item.dailyConsumption, item.leadTimeDays, item.category);
    const pStock = Math.max(0, item.currentStock - item.predictedDemand7d);
    const reqQty = Math.max(0, item.predictedDemand7d + sStock - pStock);

    if (reqQty > 0 || item.currentStock <= sStock) {
      anticipatedRequirementsCount++;
      totalRequiredQuantity += reqQty;
      
      if (item.currentStock <= item.dailyConsumption * item.leadTimeDays || pStock === 0) {
        topPriorityAction = 'REPLENISH NOW';
      } else if (topPriorityAction !== 'REPLENISH NOW') {
        topPriorityAction = 'REPLENISH SOON';
      }
    }
  });

  if (anticipatedRequirementsCount === 0 && topPriorityAction === 'NO ACTION') {
    topPriorityAction = overallLogisticsRisk === 'HIGH' || overallLogisticsRisk === 'CRITICAL' ? 'MONITOR' : 'NO ACTION';
  }

  return {
    locationId: location.id,
    locationName: location.name,
    locationCode: location.code,
    locationType: location.type,
    coordinates: location.coordinates,
    totalItemsCount,
    criticalItemsCount,
    lowItemsCount,
    totalCurrentStock,
    totalDailyConsumption,
    totalForecastDemand7d,
    totalProjectedInventory7d,
    totalSafetyStock,
    averageStockoutRisk,
    anticipatedRequirementsCount,
    totalRequiredQuantity,
    topPriorityAction,
    weatherCondition,
    temperatureC,
    weatherImpact,
    weatherReasoning,
    altitudeMeters,
    terrainType,
    accessibilityStatus,
    accessibilityRisk,
    sensorsTotal,
    sensorsNormal,
    sensorsWarning,
    sensorsCritical,
    sensorsOffline,
    hasActiveAnomalies,
    iotStatusSummary,
    overallLogisticsRisk,
    compositeRiskScore,
    riskFactorBreakdown: {
      inventoryRisk: { score: invScore, level: invLevel, reason: invReason },
      weatherRisk: { score: wScore, level: wLevel, reason: wReason },
      terrainRisk: { score: tScore, level: tLevel, reason: tReason },
      iotRisk: { score: iotScore, level: iotLevel, reason: iotReason },
      routeRisk: { score: rScore, level: rLevel, reason: rReason },
    },
    whyReasons: whyReasons.length ? whyReasons : ['Stock buffer and environmental parameters operating within normal safety limits.']
  };
}

/**
 * Computes location-level statuses across all synthetic locations.
 */
export function calculateAllLocationsStatus(
  locations: LogisticsLocation[],
  inventory: InventoryItem[],
  sensors: IoTSensorNode[],
  routes: LogisticsRoute[],
  alerts: AlertItem[]
): LocationLogisticsStatus[] {
  return locations.map(loc => 
    calculateLocationLogisticsStatus(loc, inventory, sensors, routes, alerts)
  );
}

/**
 * Item-Level Anticipated Requirements Evaluator
 * 
 * Formula:
 * Required Quantity = max(0, Forecast Demand + Safety Stock - Projected Stock)
 * (Do not allow negative replenishment quantities)
 */
export function computeAnticipatedRequirements(
  inventory: InventoryItem[],
  locations: LogisticsLocation[],
  sensors: IoTSensorNode[]
): AnticipatedRequirementItem[] {
  const requirements: AnticipatedRequirementItem[] = [];

  inventory.forEach(item => {
    const loc = locations.find(l => l.id === item.locationId);
    const locName = loc?.name || item.locationName;
    const weatherImpact = loc?.weatherData?.weatherImpact || 'LOW';
    
    // Find any sensor monitoring this category at this location
    const matchedSensor = sensors.find(s => 
      s.locationId === item.locationId && s.targetCategory === item.category
    );

    const daily = item.dailyConsumption;
    const lead = item.leadTimeDays;
    const sStock = calculateSafetyStock(daily, lead, item.category);
    const forecast7d = item.predictedDemand7d;
    
    // Projected Stock 7 days out
    const projStock = Math.max(0, item.currentStock - forecast7d);
    
    // Formula per requirement: Required Quantity = max(0, Forecast Demand + Safety Stock - Projected Stock)
    const requiredQty = Math.max(0, forecast7d + sStock - projStock);
    
    const daysOfSupply = Number((item.currentStock / Math.max(1, daily)).toFixed(1));

    // Determine Priority & Replenishment Action
    let recommendedAction: ReplenishmentAction = 'NO ACTION';
    let priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'ROUTINE' = 'ROUTINE';
    let stockoutRisk: 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'CRITICAL' = 'LOW RISK';
    
    const bulletReasons: string[] = [];

    if (item.currentStock <= daily * lead || projStock === 0 || item.status === 'CRITICAL') {
      recommendedAction = 'REPLENISH NOW';
      priority = 'URGENT';
      stockoutRisk = 'CRITICAL';
      bulletReasons.push(`Immediate Stockout Hazard: Available stock (${item.currentStock}) covers only ${daysOfSupply} days (Lead time: ${lead} days).`);
      bulletReasons.push(`Zero-Stock Crossover: Projected to exhaust complete stock before standard delivery arrival.`);
    } else if (projStock < sStock || item.currentStock <= sStock + daily * 2 || item.status === 'LOW') {
      recommendedAction = 'REPLENISH SOON';
      priority = 'HIGH';
      stockoutRisk = 'HIGH RISK';
      bulletReasons.push(`Safety Buffer Breach: Projected stock (${projStock}) will breach minimum safety reserve (${sStock}).`);
      bulletReasons.push(`Replenishment deficit of ${requiredQty} ${item.unit} calculated to restore operational posture.`);
    } else if (daysOfSupply <= 12 || weatherImpact === 'HIGH') {
      recommendedAction = 'MONITOR';
      priority = 'MEDIUM';
      stockoutRisk = 'MEDIUM RISK';
      bulletReasons.push(`Stock operating near reorder envelope (${daysOfSupply} days of supply remaining).`);
    } else {
      recommendedAction = 'NO ACTION';
      priority = 'ROUTINE';
      stockoutRisk = 'LOW RISK';
      bulletReasons.push(`Stock reserve is healthy (${item.currentStock} ${item.unit}), covering ${daysOfSupply} days of routine operations.`);
    }

    if (matchedSensor && matchedSensor.hasAnomaly) {
      bulletReasons.push(`IoT Sensor Alarm: ${matchedSensor.unitName} (${matchedSensor.sensorId}) detected ${matchedSensor.anomalyType || 'abnormal reading'}.`);
    }

    if (weatherImpact === 'HIGH') {
      bulletReasons.push(`Environmental Multiplier: Severe pass weather adds +15% safety requirement and possible convoy delay.`);
    }

    requirements.push({
      id: `REQ-${item.id}`,
      itemId: item.itemId,
      itemName: item.name,
      category: item.category,
      locationId: item.locationId,
      locationName: locName,
      unit: item.unit,
      currentStock: item.currentStock,
      dailyConsumption: daily,
      leadTimeDays: lead,
      safetyStock: sStock,
      forecastDemand7d: forecast7d,
      projectedStock7d: projStock,
      requiredQuantity: requiredQty,
      daysOfSupply,
      stockoutRisk,
      priority,
      recommendedAction,
      whyExplanation: {
        currentStock: item.currentStock,
        forecastDemand: forecast7d,
        safetyStock: sStock,
        projectedStock: projStock,
        leadTimeDays: lead,
        weatherModifier: weatherImpact === 'HIGH' ? '+15% severe weather buffer' : 'Nominal baseline',
        iotAlert: matchedSensor?.hasAnomaly ? `${matchedSensor.sensorId}: ${matchedSensor.anomalyDescription || 'Alert'}` : null,
        bulletReasons
      }
    });
  });

  // Sort by priority (URGENT first, then HIGH, MEDIUM, ROUTINE)
  const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, ROUTINE: 3 };
  return requirements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.requiredQuantity - a.requiredQuantity);
}

/**
 * Route-Level Logistics Assessment Engine
 */
export function evaluateRoutesLogisticsStatus(
  routes: LogisticsRoute[],
  locations: LogisticsLocation[]
): RouteLogisticsStatus[] {
  return routes.map(route => {
    const originLoc = locations.find(l => l.id === route.sourceId);
    const destLoc = locations.find(l => l.id === route.destinationId);

    const originWeather = originLoc?.weatherData?.weatherImpact || 'LOW';
    const destWeather = destLoc?.weatherData?.weatherImpact || 'LOW';
    
    let weatherImpact: WeatherImpactLevel = 'LOW';
    if (originWeather === 'HIGH' || destWeather === 'HIGH') {
      weatherImpact = 'HIGH';
    } else if (originWeather === 'MEDIUM' || destWeather === 'MEDIUM') {
      weatherImpact = 'MEDIUM';
    }

    const weatherSummary = `${originLoc?.weatherCondition || 'Clear'} at origin, ${destLoc?.weatherCondition || 'Clear'} at destination`;

    // Overall Route Logistics Risk
    let logisticsRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let whyReason = 'Route clear for heavy convoy transit.';

    if (route.status === 'PASS_BLOCKED') {
      logisticsRisk = 'CRITICAL';
      whyReason = 'High altitude pass closed due to extreme snowfall/landslip; ground convoys halted.';
    } else if (route.status === 'INCLEMENT_WEATHER' || weatherImpact === 'HIGH') {
      logisticsRisk = 'HIGH';
      whyReason = 'Severe blizzard/high wind warning along route corridor; +50% transit time delay.';
    } else if (route.status === 'DEGRADED' || route.currentTravelHours > route.standardTravelHours * 1.25) {
      logisticsRisk = 'MEDIUM';
      whyReason = `Minor road wear / weather slowdown (+${Math.round((route.currentTravelHours - route.standardTravelHours) * 60)} mins delay).`;
    }

    let accessibility = 'Open to All 4x4 / 6x6 Heavy Logistics Convoys';
    if (route.status === 'PASS_BLOCKED') {
      accessibility = 'PASS BLOCKED: Rotary Helicopter / Cargo UAV Sorties Required';
    } else if (route.status === 'INCLEMENT_WEATHER') {
      accessibility = 'Restricted: Extreme Cold Snowcats & Chained Tatra 6x6 Only';
    } else if (route.surfaceType.includes('Single-Lane')) {
      accessibility = 'Single-Lane Tactical Track: Convoy Speed Limit 25 km/h';
    }

    return {
      routeId: route.id,
      routeCode: route.routeCode,
      originId: route.sourceId,
      originName: route.sourceName,
      destinationId: route.destinationId,
      destinationName: route.destinationName,
      distanceKm: route.distanceKm,
      standardTravelHours: route.standardTravelHours,
      currentTravelHours: route.currentTravelHours,
      routeStatus: route.status,
      surfaceType: route.surfaceType,
      accessibility,
      weatherImpact,
      weatherSummary,
      logisticsRisk,
      whyReason,
      coordinates: route.coordinates
    };
  });
}

/**
 * High-Level Command Dashboard Summary Metrics
 */
export function computeUnifiedDashboardSummary(
  locations: LogisticsLocation[],
  inventory: InventoryItem[],
  sensors: IoTSensorNode[],
  alerts: AlertItem[],
  requirements: AnticipatedRequirementItem[],
  locationStatuses: LocationLogisticsStatus[]
): UnifiedDashboardSummary {
  const highRiskLocationsCount = locationStatuses.filter(
    l => l.overallLogisticsRisk === 'HIGH' || l.overallLogisticsRisk === 'CRITICAL'
  ).length;

  const criticalAlertsCount = alerts.filter(
    a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED'
  ).length;

  const pendingRequirementsCount = requirements.filter(
    r => r.recommendedAction === 'REPLENISH NOW' || r.recommendedAction === 'REPLENISH SOON'
  ).length;

  const sensorsWithWarningsCount = sensors.filter(
    s => s.status === 'WARNING' || s.status === 'CRITICAL' || s.status === 'OFFLINE' || s.hasAnomaly
  ).length;

  const weatherWarningsCount = locationStatuses.filter(
    l => l.weatherImpact === 'HIGH' || l.temperatureC < -10
  ).length;

  return {
    totalLocations: locations.length,
    totalInventoryItems: inventory.length,
    highRiskLocationsCount,
    criticalAlertsCount,
    pendingRequirementsCount,
    sensorsWithWarningsCount,
    weatherWarningsCount
  };
}
