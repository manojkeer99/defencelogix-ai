import { InventoryItem, ItemCategory, WeatherData, WeatherImpactLevel } from '../types';

export type RiskLevelStatus = 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'CRITICAL';

export interface DailyPoint {
  dayLabel: string; // e.g. "D-7", "D-1", "D+1", "D+7"
  dateStr: string;  // e.g. "01 Oct", "08 Oct"
  value: number;
  type: 'HISTORICAL' | 'FORECAST';
  isToday?: boolean;
}

export interface PredictiveRequirementAnalysis {
  itemId: string;
  itemName: string;
  category: ItemCategory;
  locationId: string;
  locationName: string;
  unit: string;

  // 1. Core Inventory Baseline
  currentStock: number;
  minStock: number;
  dailyConsumption: number;
  leadTimeDays: number;
  safetyStock: number;
  reorderPoint: number;

  // 2. Historical & Forecasted Metrics
  historicalConsumptionAverage: number;
  historical7dTotal: number;
  forecastedDemand7d: number;
  forecastedDemandDaily: number[]; // 7 numbers for D+1 through D+7
  projectedRemainingStock: number; // Current Stock - 7-day Demand (can be negative if deficit)

  // 3. Risk & Anticipation
  stockoutRiskScore: number; // 0-100
  riskLevel: RiskLevelStatus;
  daysOfSupply: number;
  daysUntilStockout: number;
  leadTimeExceeded: boolean;
  weatherImpact?: WeatherImpactLevel;
  weatherReasoning?: string[];

  // 4. Anticipated Requirement & Replenishment
  anticipatedReplenishmentQty: number;
  isReplenishmentRequired: boolean;
  recommendedReplenishmentTiming: string;
  urgencyBadge: 'ROUTINE' | 'ELEVATED' | 'HIGH' | 'IMMEDIATE';

  // 5. Visual Combined Timeline Chart (15 points: D-7 to D-1, TODAY, D+1 to D+7)
  timelinePoints: DailyPoint[];

  // 6. Explainable Reasoning
  explanationSummary: string;
  explanationDetails: string[];
  diagnosticMath: {
    currentStock: number;
    forecasted7dDemand: number;
    safetyStock: number;
    reorderPoint: number;
    projectedEndStock: number;
    netDeficitOrSurplus: number;
    thresholdBreached: 'ZERO_STOCKOUT' | 'SAFETY_BUFFER' | 'REORDER_POINT' | 'NONE';
  };
}

/**
 * Calculates safety stock based on demand variability and lead time.
 * Ammunition & Trauma use Z = 2.33 (99% operational readiness).
 * General consumables use Z = 1.65 (95% operational readiness).
 */
export function calculateSafetyStock(dailyConsumption: number, leadTimeDays: number, category: string): number {
  const coeffOfVariation = 0.25;
  const stdDev = Math.max(1, dailyConsumption * coeffOfVariation);
  const zScore = (category.includes('Ammunition') || category.includes('Medical')) ? 2.33 : 1.65;
  const rawSafety = Math.round(zScore * stdDev * Math.sqrt(Math.max(1, leadTimeDays)));
  return Math.max(10, rawSafety);
}

/**
 * Reorder Point (ROP) = (Daily Consumption × Lead Time) + Safety Stock
 */
export function calculateReorderPoint(dailyConsumption: number, leadTimeDays: number, safetyStock: number): number {
  return Math.round((dailyConsumption * leadTimeDays) + safetyStock);
}

/**
 * Main Predictive Demand & Requirement Analysis Engine
 * Implements the logical flow:
 * Historical Consumption Data + Current Inventory + Daily Consumption + Lead Time + Safety Stock
 *   -> Demand Forecast -> Projected Future Inventory -> Stockout Risk -> Anticipated Requirement -> Replenishment Recommendation
 */
export function analyzePredictiveRequirement(
  item: InventoryItem,
  historicalRecords?: { date: string; consumption: number }[],
  weatherData?: WeatherData
): PredictiveRequirementAnalysis {
  const daily = Math.max(1, item.dailyConsumption);
  const leadTime = Math.max(1, item.leadTimeDays);
  const current = Math.max(0, item.currentStock);
  const minStock = Math.max(1, item.minStock);

  const safetyStock = calculateSafetyStock(daily, leadTime, item.category);
  const reorderPoint = calculateReorderPoint(daily, leadTime, safetyStock);

  // Parse or synthesize historical 7 days consumption
  let histValues: number[] = [];
  if (historicalRecords && historicalRecords.length >= 7) {
    const sorted = [...historicalRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    histValues = sorted.slice(-7).map(r => r.consumption);
  } else {
    // Deterministic synthetic historical based on item id and daily baseline
    const charCodeSum = item.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    histValues = [
      Math.round(daily * (0.92 + ((charCodeSum % 5) * 0.03))),
      Math.round(daily * (1.05 - ((charCodeSum % 4) * 0.02))),
      Math.round(daily * (0.97 + ((charCodeSum % 3) * 0.04))),
      Math.round(daily * (1.12 - ((charCodeSum % 6) * 0.03))),
      Math.round(daily * (0.95 + ((charCodeSum % 7) * 0.02))),
      Math.round(daily * (1.08 + ((charCodeSum % 3) * 0.03))),
      Math.round(daily * (1.02 - ((charCodeSum % 5) * 0.02)))
    ];
  }

  const historical7dTotal = histValues.reduce((a, b) => a + b, 0);
  const histAvg = Math.round(historical7dTotal / histValues.length);

  // Forecasted 7-day Demand
  // Weather / category weighting factor from item location characteristics & live public weather
  let demandMultiplier = 1.0;
  if (item.category.includes('POL') || item.category.includes('Cold Weather')) {
    if (weatherData && weatherData.temperatureC <= -10) {
      demandMultiplier = 1.35; // extreme cold surge
    } else {
      demandMultiplier = 1.25; // heightened winter burn
    }
  } else if (item.category.includes('Medical') || item.category.includes('Ammunition')) {
    demandMultiplier = 1.15; // readiness surge
  } else if (item.category.includes('Spare Parts') && weatherData && (weatherData.precipitationMm > 5 || weatherData.windSpeedKmH > 35)) {
    demandMultiplier = 1.20; // adverse route wear
  }

  // Generate day-by-day forecast for D+1 through D+7
  const forecastedDaily: number[] = [];
  for (let i = 0; i < 7; i++) {
    const dayCurve = 1 + (Math.sin((i / 7) * Math.PI) * 0.12);
    const dayForecast = Math.max(1, Math.round(histAvg * demandMultiplier * dayCurve));
    forecastedDaily.push(dayForecast);
  }

  const forecastedDemand7d = forecastedDaily.reduce((a, b) => a + b, 0);
  const projectedRemainingStock = current - forecastedDemand7d;

  const daysOfSupply = Number((current / Math.max(1, daily)).toFixed(1));
  const daysUntilStockout = current <= 0 ? 0 : Math.round(current / Math.max(1, histAvg));
  const leadTimeExceeded = daysUntilStockout <= leadTime;

  // Stockout Risk Calculation & Classification
  // Requirements: LOW RISK, MEDIUM RISK, HIGH RISK, CRITICAL
  let stockoutRiskScore = 0;
  let riskLevel: RiskLevelStatus = 'LOW RISK';

  if (current <= 0 || projectedRemainingStock <= 0) {
    stockoutRiskScore = Math.min(100, Math.round(80 + Math.abs(projectedRemainingStock) / Math.max(1, forecastedDemand7d) * 20));
    riskLevel = 'CRITICAL';
  } else if (projectedRemainingStock < safetyStock) {
    const deficitRatio = (safetyStock - projectedRemainingStock) / safetyStock;
    stockoutRiskScore = Math.round(55 + deficitRatio * 25);
    riskLevel = stockoutRiskScore >= 70 ? 'HIGH RISK' : 'MEDIUM RISK';
  } else if (current <= reorderPoint || daysOfSupply <= leadTime + 3) {
    stockoutRiskScore = Math.round(35 + (1 - (current / Math.max(1, reorderPoint))) * 20);
    riskLevel = stockoutRiskScore >= 50 ? 'HIGH RISK' : 'MEDIUM RISK';
  } else {
    stockoutRiskScore = Math.max(5, Math.round(25 - (projectedRemainingStock / (safetyStock * 3)) * 20));
    riskLevel = 'LOW RISK';
  }

  // Anticipated Replenishment Quantity
  // Gross target = Forecasted 7-day demand + Safety Stock
  const targetStock = forecastedDemand7d + safetyStock;
  let anticipatedReplenishmentQty = 0;
  let isReplenishmentRequired = false;

  if (current < targetStock || current <= minStock || current <= reorderPoint) {
    anticipatedReplenishmentQty = Math.max(0, targetStock - current);
    // Pad to match min stock if deficit is small but current stock is below minStock
    if (anticipatedReplenishmentQty < (minStock - current) && current < minStock) {
      anticipatedReplenishmentQty = minStock - current;
    }
    isReplenishmentRequired = anticipatedReplenishmentQty > 0;
  }

  // Recommended Replenishment Timing
  let recommendedReplenishmentTiming = 'Routine monitoring (Review in 7+ days)';
  let urgencyBadge: 'ROUTINE' | 'ELEVATED' | 'HIGH' | 'IMMEDIATE' = 'ROUTINE';

  if (current <= 0 || daysUntilStockout <= 1) {
    recommendedReplenishmentTiming = 'IMMEDIATE DISPATCH REQUIRED (T-0: within 12-24 hrs)';
    urgencyBadge = 'IMMEDIATE';
  } else if (daysUntilStockout <= leadTime) {
    recommendedReplenishmentTiming = `CRITICAL WINDOW (Order immediately; delivery requires ${leadTime} days lead time)`;
    urgencyBadge = 'IMMEDIATE';
  } else if (daysUntilStockout <= leadTime + 2) {
    recommendedReplenishmentTiming = `HIGH PRIORITY (Initiate convoy transfer within 48 hrs)`;
    urgencyBadge = 'HIGH';
  } else if (current <= reorderPoint || projectedRemainingStock < safetyStock) {
    recommendedReplenishmentTiming = `EXPEDITE (Schedule reorder within 3 to 4 days)`;
    urgencyBadge = 'ELEVATED';
  } else {
    recommendedReplenishmentTiming = 'ROUTINE REPLENISHMENT (Adequate buffer; review in 7+ days)';
    urgencyBadge = 'ROUTINE';
  }

  // Visual Timeline Points (15 data points: D-7 to D-1, TODAY, D+1 to D+7)
  const timelinePoints: DailyPoint[] = [];
  const now = new Date();

  // Past 7 days
  for (let i = 7; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    timelinePoints.push({
      dayLabel: `D-${i}`,
      dateStr: dayStr,
      value: histValues[7 - i] || histAvg,
      type: 'HISTORICAL'
    });
  }

  // Today marker
  timelinePoints.push({
    dayLabel: 'TODAY',
    dateStr: now.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
    value: histValues[6] || histAvg,
    type: 'HISTORICAL',
    isToday: true
  });

  // Future 7 days forecast
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    timelinePoints.push({
      dayLabel: `D+${i}`,
      dateStr: dayStr,
      value: forecastedDaily[i - 1],
      type: 'FORECAST'
    });
  }

  // Explainable Reasoning Generation
  let thresholdBreached: 'ZERO_STOCKOUT' | 'SAFETY_BUFFER' | 'REORDER_POINT' | 'NONE' = 'NONE';
  const explanationDetails: string[] = [];

  if (projectedRemainingStock <= 0) {
    thresholdBreached = 'ZERO_STOCKOUT';
    explanationDetails.push(
      `Projected 7-day demand (${forecastedDemand7d} ${item.unit}) exceeds total available stock (${current} ${item.unit}).`
    );
    explanationDetails.push(
      `Stockout expected in ~${daysUntilStockout} days, which is less than or equal to the transit lead time of ${leadTime} days.`
    );
    explanationDetails.push(
      `Without immediate convoy dispatch, forward operating units will face a complete zero-stock outage of ${Math.abs(projectedRemainingStock)} ${item.unit}.`
    );
  } else if (projectedRemainingStock < safetyStock) {
    thresholdBreached = 'SAFETY_BUFFER';
    explanationDetails.push(
      `Projected requirement exceeds available stock/safety threshold.`
    );
    explanationDetails.push(
      `Current stock (${current} ${item.unit}) minus 7-day forecasted demand (${forecastedDemand7d} ${item.unit}) leaves ${projectedRemainingStock} ${item.unit}, breaching the mandatory safety buffer of ${safetyStock} ${item.unit}.`
    );
    explanationDetails.push(
      `Anticipated replenishment of ${anticipatedReplenishmentQty} ${item.unit} calculated to restore safety stock and satisfy transit lead time.`
    );
  } else if (current <= reorderPoint) {
    thresholdBreached = 'REORDER_POINT';
    explanationDetails.push(
      `Current inventory (${current} ${item.unit}) has dipped below the Reorder Point of ${reorderPoint} ${item.unit} (Lead Time Demand: ${daily * leadTime} + Safety Stock: ${safetyStock}).`
    );
    explanationDetails.push(
      `Reorder recommended to avoid cutting into the safety reserve during the ${leadTime}-day supply window.`
    );
  } else {
    thresholdBreached = 'NONE';
    explanationDetails.push(
      `Stock levels are optimal. Projected remaining stock after 7 days (${projectedRemainingStock} ${item.unit}) maintains an ample margin over safety stock (${safetyStock} ${item.unit}).`
    );
    explanationDetails.push(
      `Total available days of supply is ${daysOfSupply} days against a replenishment lead time of ${leadTime} days.`
    );
  }

  if (weatherData && weatherData.impactReasoning && weatherData.impactReasoning.length > 0) {
    explanationDetails.push(
      `Live Weather Telemetry Factor (${weatherData.weatherImpact} Impact): ${weatherData.impactReasoning[0]}`
    );
  }

  const explanationSummary = isReplenishmentRequired
    ? `Requirement anticipated based on projected consumption (${forecastedDemand7d} ${item.unit}), current inventory (${current} ${item.unit}), safety stock (${safetyStock} ${item.unit}) and lead time (${leadTime} days).`
    : `Stable supply posture. Projected 7-day consumption (${forecastedDemand7d} ${item.unit}) is safely covered by current inventory (${current} ${item.unit}) with ${projectedRemainingStock - safetyStock} ${item.unit} excess above safety stock.`;

  return {
    itemId: item.itemId,
    itemName: item.name,
    category: item.category,
    locationId: item.locationId,
    locationName: item.locationName,
    unit: item.unit,
    currentStock: current,
    minStock,
    dailyConsumption: daily,
    leadTimeDays: leadTime,
    safetyStock,
    reorderPoint,
    historicalConsumptionAverage: histAvg,
    historical7dTotal,
    forecastedDemand7d,
    forecastedDemandDaily: forecastedDaily,
    projectedRemainingStock,
    stockoutRiskScore,
    riskLevel,
    daysOfSupply,
    daysUntilStockout,
    leadTimeExceeded,
    weatherImpact: weatherData?.weatherImpact,
    weatherReasoning: weatherData?.impactReasoning,
    anticipatedReplenishmentQty,
    isReplenishmentRequired,
    recommendedReplenishmentTiming,
    urgencyBadge,
    timelinePoints,
    explanationSummary,
    explanationDetails,
    diagnosticMath: {
      currentStock: current,
      forecasted7dDemand: forecastedDemand7d,
      safetyStock,
      reorderPoint,
      projectedEndStock: projectedRemainingStock,
      netDeficitOrSurplus: projectedRemainingStock - safetyStock,
      thresholdBreached
    }
  };
}
