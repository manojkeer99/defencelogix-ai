// @ts-nocheck
// api/index.ts
import express from "express";
import dotenv from "dotenv";

// src/server/routes.ts
import { Router } from "express";
import crypto from "crypto";

// src/server/ml.ts
function calculateSafetyStock(dailyConsumption, leadTimeDays, category) {
  const stdDev = dailyConsumption * 0.25;
  const zScore = category.includes("Ammunition") || category.includes("Medical") ? 2.33 : 1.65;
  const safetyStock = Math.round(zScore * stdDev * Math.sqrt(Math.max(1, leadTimeDays)));
  return Math.max(10, safetyStock);
}
function calculateReorderPoint(dailyDemand, leadTimeDays, safetyStock) {
  return Math.round(dailyDemand * leadTimeDays + safetyStock);
}
function calculateStockoutRisk(currentStock, expectedDemandLeadTime, safetyStock) {
  if (currentStock <= 0) return { score: 99, category: "CRITICAL" };
  const buffer = currentStock - expectedDemandLeadTime;
  if (buffer <= 0) {
    const deficitRatio = Math.abs(buffer) / Math.max(1, expectedDemandLeadTime);
    const score2 = Math.min(100, Math.round(75 + deficitRatio * 25));
    return { score: score2, category: "CRITICAL" };
  }
  if (buffer < safetyStock) {
    const riskRatio = 1 - buffer / Math.max(1, safetyStock);
    const score2 = Math.min(74, Math.round(45 + riskRatio * 29));
    return { score: score2, category: score2 > 60 ? "HIGH" : "MEDIUM" };
  }
  const excessRatio = Math.min(1, (buffer - safetyStock) / (safetyStock * 2));
  const score = Math.max(5, Math.round(40 - excessRatio * 35));
  return { score, category: "LOW" };
}
function runForecastingModel(item, history, location, options) {
  const { modelType, horizonDays, operationalTempo = "Routine", weatherFactor = "Clear" } = options;
  const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const seriesValues = sorted.map((h) => h.consumption);
  const recentHistory = seriesValues.length > 0 ? seriesValues : [item.dailyConsumption];
  const baseline = recentHistory.reduce((a, b) => a + b, 0) / recentHistory.length;
  let tempoMultiplier = 1;
  if (operationalTempo === "Heightened Readiness") tempoMultiplier = 1.25;
  if (operationalTempo === "Field Exercise") tempoMultiplier = 1.5;
  if (operationalTempo === "Surge Ops") tempoMultiplier = 1.85;
  let weatherMultiplier = 1;
  if (weatherFactor === "Extreme Cold / Blizzard") {
    if (item.category.includes("POL") || item.category.includes("Cold Weather") || item.category.includes("Rations")) {
      weatherMultiplier = 1.4;
    }
  } else if (weatherFactor === "Sandstorm" || weatherFactor === "Monsoon Rain") {
    if (item.category.includes("Spare Parts") || item.category.includes("POL")) {
      weatherMultiplier = 1.25;
    }
  }
  const effectiveBaseline = baseline * tempoMultiplier * weatherMultiplier;
  const predictions = [];
  const upperBounds = [];
  const lowerBounds = [];
  for (let i = 0; i < horizonDays; i++) {
    let dayPred = effectiveBaseline;
    const dayOfWeek = (i + 1) % 7;
    const cyclicalNoise = Math.sin(i / 7 * Math.PI * 2) * (baseline * 0.08);
    switch (modelType) {
      case "Moving Average": {
        const windowSize = Math.min(7, recentHistory.length);
        const windowAvg = recentHistory.slice(-windowSize).reduce((s, v) => s + v, 0) / windowSize;
        dayPred = windowAvg * 0.85 + effectiveBaseline * 0.15 + cyclicalNoise;
        break;
      }
      case "Exponential Smoothing": {
        const alpha = 0.35;
        let s = recentHistory[0];
        for (let j = 1; j < recentHistory.length; j++) {
          s = alpha * recentHistory[j] + (1 - alpha) * s;
        }
        const trend = (recentHistory[recentHistory.length - 1] - recentHistory[0]) / Math.max(1, recentHistory.length);
        dayPred = s + (i + 1) * (trend * 0.4) * tempoMultiplier + cyclicalNoise;
        break;
      }
      case "Random Forest": {
        const treeEstimates = [];
        for (let t = 0; t < 10; t++) {
          const treeWeight = 0.85 + t * 0.03;
          const leafNoise = (t % 3 - 1) * (baseline * 0.04);
          treeEstimates.push(effectiveBaseline * treeWeight + leafNoise);
        }
        dayPred = treeEstimates.reduce((a, b) => a + b, 0) / treeEstimates.length + cyclicalNoise;
        break;
      }
      case "Gradient Boosting": {
        let pred = effectiveBaseline;
        for (let stage = 0; stage < 8; stage++) {
          const learningRate = 0.1;
          const residual = effectiveBaseline * (1 + 0.05 * Math.sin(stage + i)) - pred;
          pred += learningRate * residual;
        }
        dayPred = pred + cyclicalNoise;
        break;
      }
      case "LSTM": {
        let hidden = effectiveBaseline;
        for (let step = 0; step < 5; step++) {
          const forgetGate = 0.75;
          const candidateGate = Math.tanh(effectiveBaseline / (effectiveBaseline + 10)) * effectiveBaseline;
          hidden = forgetGate * hidden + (1 - forgetGate) * candidateGate;
        }
        dayPred = hidden * (1 + 0.04 * Math.cos(i)) + cyclicalNoise;
        break;
      }
    }
    const clamped = Math.max(5, Math.round(dayPred));
    const errorMargin = Math.round(clamped * (modelType === "Random Forest" || modelType === "Gradient Boosting" ? 0.09 : 0.16));
    predictions.push(clamped);
    upperBounds.push(clamped + errorMargin);
    lowerBounds.push(Math.max(1, clamped - errorMargin));
  }
  const predictedDemandTotal = predictions.reduce((a, b) => a + b, 0);
  let mae = 0;
  let rmse = 0;
  let mape = 0;
  const testCount = Math.min(14, recentHistory.length);
  if (testCount > 0) {
    let absErrSum = 0;
    let sqErrSum = 0;
    let pctErrSum = 0;
    for (let k = 0; k < testCount; k++) {
      const actual = recentHistory[recentHistory.length - testCount + k];
      const simPred = effectiveBaseline + (k % 2 === 0 ? 1 : -1) * (actual * 0.06);
      const diff = Math.abs(actual - simPred);
      absErrSum += diff;
      sqErrSum += diff * diff;
      pctErrSum += diff / Math.max(1, actual);
    }
    mae = Number((absErrSum / testCount).toFixed(2));
    rmse = Number(Math.sqrt(sqErrSum / testCount).toFixed(2));
    mape = Number((pctErrSum / testCount * 100).toFixed(2));
  } else {
    mae = Number((effectiveBaseline * 0.05).toFixed(2));
    rmse = Number((effectiveBaseline * 0.07).toFixed(2));
    mape = 5.4;
  }
  const expectedShortage = Math.max(0, Math.round(predictedDemandTotal - item.currentStock));
  const safetyStock = calculateSafetyStock(item.dailyConsumption, item.leadTimeDays, item.category);
  const recommendedReplenishment = Math.max(0, Math.round(predictedDemandTotal + safetyStock - item.currentStock));
  const confidenceLevel = mape < 7 ? "High" : mape < 14 ? "Medium" : "Low";
  const now = /* @__PURE__ */ new Date();
  const dailySeries = predictions.map((pred, idx) => {
    const d = new Date(now);
    d.setDate(d.getDate() + idx + 1);
    return {
      date: d.toISOString().split("T")[0],
      predicted: pred,
      upperBound: upperBounds[idx],
      lowerBound: lowerBounds[idx],
      // For first few days, show synthetic actual benchmark
      actual: idx < 3 ? Math.round(pred * (0.96 + idx * 0.02)) : void 0
    };
  });
  return {
    itemId: item.itemId,
    itemName: item.name,
    category: item.category,
    locationId: location.id,
    locationName: location.name,
    horizonDays,
    modelUsed: modelType,
    predictedDemandTotal,
    confidenceLevel,
    expectedShortage,
    recommendedReplenishment,
    metrics: { mae, rmse, mape },
    dailySeries
  };
}
function optimizeLogisticsNetwork(items, locations, vehicles, routes) {
  const recommendations = [];
  const criticalItems = items.filter((i) => i.status === "CRITICAL" || i.status === "LOW" || i.stockoutRiskScore >= 50);
  const depots = locations.filter((l) => l.type === "central_depot" || l.type === "regional_depot");
  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  criticalItems.forEach((targetItem, index) => {
    const destNode = locations.find((l) => l.id === targetItem.locationId);
    if (!destNode) return;
    const matchingDepotItems = items.filter(
      (i) => i.name === targetItem.name && i.locationId !== targetItem.locationId && (i.status === "NORMAL" || i.status === "OVERSTOCKED" || i.currentStock > i.minStock * 1.5)
    );
    if (matchingDepotItems.length === 0) return;
    matchingDepotItems.sort((a, b) => b.currentStock - b.minStock - (a.currentStock - a.minStock));
    const bestSourceItem = matchingDepotItems[0];
    const sourceNode = locations.find((l) => l.id === bestSourceItem.locationId);
    if (!sourceNode) return;
    const directRoute = routes.find(
      (r) => r.sourceId === sourceNode.id && r.destinationId === destNode.id || r.sourceId === destNode.id && r.destinationId === sourceNode.id
    );
    const estHours = directRoute ? directRoute.currentTravelHours : Math.round(5 + index % 6);
    const routeCondition = directRoute ? directRoute.status : "CLEAR";
    const assignedVehicle = availableVehicles[index % Math.max(1, availableVehicles.length)];
    const transportType = assignedVehicle ? assignedVehicle.type : "Heavy All-Terrain Truck 6x6";
    const shortage = Math.max(targetItem.recommendedReorder, Math.round(targetItem.minStock * 1.2 - targetItem.currentStock));
    const supplyQuantity = Math.min(shortage, Math.round((bestSourceItem.currentStock - bestSourceItem.minStock) * 0.75));
    if (supplyQuantity <= 0) return;
    const isCritical = targetItem.status === "CRITICAL" || targetItem.stockoutRiskScore > 75;
    const priority = isCritical ? "URGENT" : targetItem.stockoutRiskScore > 50 ? "HIGH" : "STANDARD";
    const reason = `${destNode.name} projected demand exceeds current stock (${targetItem.currentStock} ${targetItem.unit} vs min threshold ${targetItem.minStock} ${targetItem.unit}). System recommends replenishment from ${sourceNode.name} (${bestSourceItem.currentStock} units available) via ${transportType}. Route condition: ${routeCondition}. ETA: ~${estHours} hrs.`;
    recommendations.push({
      id: `REC-OPT-${1e3 + index}`,
      sourceId: sourceNode.id,
      sourceName: sourceNode.name,
      destinationId: destNode.id,
      destinationName: destNode.name,
      itemId: targetItem.itemId,
      itemName: targetItem.name,
      category: targetItem.category,
      supplyQuantity: Math.max(50, supplyQuantity),
      transportType,
      estimatedTimeHours: estHours,
      priority,
      status: "RECOMMENDED",
      reasoning: reason,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  return recommendations;
}

// src/utils/iotConfig.ts
var IOT_THRESHOLDS = {
  // Category-specific environmental envelopes
  categories: {
    "Medical & Trauma": {
      tempMinC: 2,
      tempMaxC: 8,
      tempCritMinC: -2,
      tempCritMaxC: 15,
      humidityWarnPct: 65,
      humidityCritPct: 80
    },
    "POL (Petroleum, Oil, Lubricants)": {
      tempMinC: -10,
      tempMaxC: 35,
      tempCritMinC: -20,
      tempCritMaxC: 45,
      humidityWarnPct: 75,
      humidityCritPct: 85
    },
    "Ammunition & Ordnance": {
      tempMinC: 0,
      tempMaxC: 32,
      tempCritMinC: -10,
      tempCritMaxC: 42,
      humidityWarnPct: 55,
      humidityCritPct: 70
    },
    "Rations & MRE": {
      tempMinC: 4,
      tempMaxC: 28,
      tempCritMinC: -5,
      tempCritMaxC: 38,
      humidityWarnPct: 68,
      humidityCritPct: 80
    },
    "Cold Weather & Mountaineering": {
      tempMinC: -30,
      tempMaxC: 35,
      tempCritMinC: -40,
      tempCritMaxC: 45,
      humidityWarnPct: 75,
      humidityCritPct: 90
    },
    "Spare Parts & Maintenance": {
      tempMinC: -15,
      tempMaxC: 40,
      tempCritMinC: -25,
      tempCritMaxC: 50,
      humidityWarnPct: 70,
      humidityCritPct: 85
    },
    "Tactical Communications": {
      tempMinC: -10,
      tempMaxC: 38,
      tempCritMinC: -20,
      tempCritMaxC: 48,
      humidityWarnPct: 65,
      humidityCritPct: 80
    }
  },
  // Universal thresholds
  storage: {
    warningFillPct: 25,
    criticalFillPct: 15
  },
  battery: {
    warningPct: 20,
    criticalPct: 10
  },
  pressure: {
    nominalPsi: 14.7,
    warnMinPsi: 12,
    warnMaxPsi: 16.5,
    critMinPsi: 10,
    critMaxPsi: 18
  },
  timeout: {
    offlineMinutes: 15
  }
};
function evaluateSensorAnomalies(sensor) {
  const anomalies = [];
  const thresholds = IOT_THRESHOLDS.categories[sensor.targetCategory] || {
    tempMinC: -15,
    tempMaxC: 38,
    tempCritMinC: -25,
    tempCritMaxC: 45,
    humidityWarnPct: 70,
    humidityCritPct: 85
  };
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const pingAgeMinutes = (Date.now() - new Date(sensor.lastPing).getTime()) / 6e4;
  if (pingAgeMinutes > IOT_THRESHOLDS.timeout.offlineMinutes || sensor.status === "OFFLINE") {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-OFFLINE`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Heartbeat",
      currentValue: `No signal for ${Math.round(pingAgeMinutes)} mins`,
      expectedThreshold: `Heartbeat <= ${IOT_THRESHOLDS.timeout.offlineMinutes} mins`,
      severity: "CRITICAL",
      reason: "Telemetry connection timeout: Sensor node stopped transmitting beacon packets",
      timestamp: nowIso
    });
    return { status: "OFFLINE", anomalies };
  }
  if (sensor.storageLevelPercent <= IOT_THRESHOLDS.storage.criticalFillPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-STORAGE-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Storage Level",
      currentValue: `${sensor.storageLevelPercent}% (${sensor.quantity} units)`,
      expectedThreshold: `Min Reserve >= ${IOT_THRESHOLDS.storage.criticalFillPct}%`,
      severity: "CRITICAL",
      reason: "Storage level is critically depleted below emergency operational threshold",
      timestamp: nowIso
    });
  } else if (sensor.storageLevelPercent <= IOT_THRESHOLDS.storage.warningFillPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-STORAGE-WARN`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Storage Level",
      currentValue: `${sensor.storageLevelPercent}% (${sensor.quantity} units)`,
      expectedThreshold: `Min Reserve >= ${IOT_THRESHOLDS.storage.warningFillPct}%`,
      severity: "WARNING",
      reason: "Storage level dropped below routine safety buffer",
      timestamp: nowIso
    });
  }
  if (sensor.temperatureC >= thresholds.tempCritMaxC) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-TEMP-HIGH-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Temperature",
      currentValue: `${sensor.temperatureC}\xB0C`,
      expectedThreshold: `< ${thresholds.tempCritMaxC}\xB0C (Max ${thresholds.tempMaxC}\xB0C)`,
      severity: "CRITICAL",
      reason: `Severe thermal spike: Exceeds safe limit for ${sensor.targetCategory}`,
      timestamp: nowIso
    });
  } else if (sensor.temperatureC <= thresholds.tempCritMinC) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-TEMP-LOW-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Temperature",
      currentValue: `${sensor.temperatureC}\xB0C`,
      expectedThreshold: `> ${thresholds.tempCritMinC}\xB0C (Min ${thresholds.tempMinC}\xB0C)`,
      severity: "CRITICAL",
      reason: `Severe sub-zero freeze: Rupture / viscosity crystallization hazard for ${sensor.targetCategory}`,
      timestamp: nowIso
    });
  } else if (sensor.temperatureC > thresholds.tempMaxC || sensor.temperatureC < thresholds.tempMinC) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-TEMP-WARN`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Temperature",
      currentValue: `${sensor.temperatureC}\xB0C`,
      expectedThreshold: `${thresholds.tempMinC}\xB0C to ${thresholds.tempMaxC}\xB0C`,
      severity: "WARNING",
      reason: `Temperature drifted outside recommended storage envelope (${thresholds.tempMinC}\xB0C to ${thresholds.tempMaxC}\xB0C)`,
      timestamp: nowIso
    });
  }
  if (sensor.humidityPercent >= thresholds.humidityCritPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-HUM-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Humidity",
      currentValue: `${sensor.humidityPercent}%`,
      expectedThreshold: `< ${thresholds.humidityCritPct}%`,
      severity: "CRITICAL",
      reason: `Excessive moisture ingress: Corrosion & spoilage danger for ${sensor.targetCategory}`,
      timestamp: nowIso
    });
  } else if (sensor.humidityPercent >= thresholds.humidityWarnPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-HUM-WARN`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Humidity",
      currentValue: `${sensor.humidityPercent}%`,
      expectedThreshold: `< ${thresholds.humidityWarnPct}%`,
      severity: "WARNING",
      reason: `Humidity elevated above optimal threshold of ${thresholds.humidityWarnPct}%`,
      timestamp: nowIso
    });
  }
  if (sensor.batteryLevel <= IOT_THRESHOLDS.battery.criticalPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-BATT-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Battery",
      currentValue: `${sensor.batteryLevel}%`,
      expectedThreshold: `> ${IOT_THRESHOLDS.battery.criticalPct}%`,
      severity: "CRITICAL",
      reason: "Sensor backup battery critically exhausted: Imminent node shutdown",
      timestamp: nowIso
    });
  } else if (sensor.batteryLevel <= IOT_THRESHOLDS.battery.warningPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-BATT-WARN`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Battery",
      currentValue: `${sensor.batteryLevel}%`,
      expectedThreshold: `> ${IOT_THRESHOLDS.battery.warningPct}%`,
      severity: "WARNING",
      reason: "Sensor battery is low and requires solar recharging or cell replacement",
      timestamp: nowIso
    });
  }
  if (sensor.containerPressurePsi <= IOT_THRESHOLDS.pressure.critMinPsi || sensor.containerPressurePsi >= IOT_THRESHOLDS.pressure.critMaxPsi) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-PRESS-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: "Pressure",
      currentValue: `${sensor.containerPressurePsi} PSI`,
      expectedThreshold: `${IOT_THRESHOLDS.pressure.nominalPsi} PSI (\xB13.0 PSI)`,
      severity: "CRITICAL",
      reason: sensor.containerPressurePsi <= IOT_THRESHOLDS.pressure.critMinPsi ? "Severe pressure drop detected: Possible containment seam leak or puncture" : "Dangerous containment over-pressure: Thermal expansion rupture threat",
      timestamp: nowIso
    });
  }
  let status = "NORMAL";
  const hasCritical = anomalies.some((a) => a.severity === "CRITICAL");
  const hasWarning = anomalies.some((a) => a.severity === "WARNING");
  if (hasCritical) {
    status = "CRITICAL";
  } else if (hasWarning) {
    status = "WARNING";
  }
  return { status, anomalies };
}
function applyLiveTelemetryJitter(sensor) {
  if (sensor.status === "OFFLINE" || sensor.hasAnomaly) {
    return sensor;
  }
  const tempJitter = (Math.random() - 0.5) * 0.4;
  const humJitter = Math.round((Math.random() - 0.5) * 2);
  const pressJitter = Number(((Math.random() - 0.5) * 0.1).toFixed(2));
  const updatedTemp = Number((sensor.temperatureC + tempJitter).toFixed(1));
  const updatedHum = Math.min(99, Math.max(10, sensor.humidityPercent + humJitter));
  const updatedPress = Number(Math.max(8, Math.min(22, sensor.containerPressurePsi + pressJitter)).toFixed(1));
  return {
    ...sensor,
    temperatureC: updatedTemp,
    humidityPercent: updatedHum,
    containerPressurePsi: updatedPress,
    lastPing: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/server/db.ts
var INITIAL_USERS = [
  {
    id: "USR-001",
    email: "admin@demologix.local",
    name: "Brig. Rajesh Varma (Retd.)",
    role: "admin",
    serviceNumber: "IC-48291X",
    clearanceLevel: "LEVEL 5 - TOP SECRET (DEMO)",
    department: "Directorate General of Operational Logistics",
    createdAt: "2026-01-10T08:00:00.000Z"
  },
  {
    id: "USR-002",
    email: "officer@demologix.local",
    name: "Col. Amitav Sengupta",
    role: "logistics_officer",
    serviceNumber: "IC-51203M",
    clearanceLevel: "LEVEL 4 - SECRET (DEMO)",
    department: "Forward Supply Corps Command",
    createdAt: "2026-01-12T09:30:00.000Z"
  },
  {
    id: "USR-003",
    email: "inventory@demologix.local",
    name: "Lt. Col. Priya Menon",
    role: "inventory_manager",
    serviceNumber: "IC-54910K",
    clearanceLevel: "LEVEL 3 - CONFIDENTIAL (DEMO)",
    department: "Central Ordnance Depot Management",
    createdAt: "2026-01-15T11:00:00.000Z"
  },
  {
    id: "USR-004",
    email: "transport@demologix.local",
    name: "Maj. Vikramaditya Rathore",
    role: "transport_manager",
    serviceNumber: "IC-59821P",
    clearanceLevel: "LEVEL 3 - CONFIDENTIAL (DEMO)",
    department: "Army Service Corps (Mechanical Transport)",
    createdAt: "2026-01-18T14:15:00.000Z"
  },
  {
    id: "USR-005",
    email: "analyst@demologix.local",
    name: "Dr. Sunita Kulkarni",
    role: "analyst",
    serviceNumber: "CIV-DS-8842",
    clearanceLevel: "LEVEL 3 - CONFIDENTIAL (DEMO)",
    department: "Defence Data Science & Operational Research Lab",
    createdAt: "2026-01-20T10:00:00.000Z"
  },
  {
    id: "USR-006",
    email: "viewer@demologix.local",
    name: "Capt. Rohan Deshmukh",
    role: "viewer",
    serviceNumber: "IC-64112A",
    clearanceLevel: "LEVEL 2 - RESTRICTED (DEMO)",
    department: "Staff College Logistics Observer Division",
    createdAt: "2026-02-01T09:00:00.000Z"
  }
];
var SYNTHETIC_LOCATIONS = [
  {
    id: "LOC-CENTRAL-01",
    name: "Central Strategic Depot (Depot Alpha)",
    code: "CSD-ALP",
    type: "central_depot",
    coordinates: { lat: 31.1048, lng: 77.1734 },
    // Synthetic sector coordinates
    altitudeMeters: 2200,
    terrainType: "Hinterland Base",
    accessibilityIndicator: "All-Weather Paved National Highway (Unrestricted Heavy Convoy)",
    weatherCondition: "Clear",
    temperatureC: 16,
    status: "OPERATIONAL",
    riskLevel: "LOW",
    storageCapacityTons: 12e3,
    currentOccupancyTons: 8450,
    assignedVehiclesCount: 8
  },
  {
    id: "LOC-REG-NORTH",
    name: "Regional Logistic Base (North Sector)",
    code: "RLB-NOR",
    type: "regional_depot",
    coordinates: { lat: 32.2215, lng: 76.3234 },
    altitudeMeters: 2850,
    terrainType: "Mountain Valley",
    accessibilityIndicator: "Mountain Valley Dual-Lane Paved Highway",
    weatherCondition: "Dense Fog",
    temperatureC: 6,
    status: "OPERATIONAL",
    riskLevel: "LOW",
    storageCapacityTons: 6500,
    currentOccupancyTons: 4320,
    assignedVehiclesCount: 5
  },
  {
    id: "LOC-REG-SOUTH",
    name: "Regional Logistic Base (South Sector)",
    code: "RLB-SOU",
    type: "regional_depot",
    coordinates: { lat: 30.3165, lng: 78.0322 },
    altitudeMeters: 1450,
    terrainType: "Plains Foothills",
    accessibilityIndicator: "Foothills Paved Multi-Axle Corridor",
    weatherCondition: "Clear",
    temperatureC: 22,
    status: "OPERATIONAL",
    riskLevel: "LOW",
    storageCapacityTons: 7e3,
    currentOccupancyTons: 4980,
    assignedVehiclesCount: 4
  },
  {
    id: "LOC-HUB-01",
    name: "Intermodal Transport Hub Kilo",
    code: "ITH-KLO",
    type: "transport_hub",
    coordinates: { lat: 31.634, lng: 76.527 },
    altitudeMeters: 1800,
    terrainType: "Garrison Junction",
    accessibilityIndicator: "Major Road-Rail Transshipment Junction",
    weatherCondition: "Clear",
    temperatureC: 18,
    status: "OPERATIONAL",
    riskLevel: "LOW",
    storageCapacityTons: 4500,
    currentOccupancyTons: 2890,
    assignedVehiclesCount: 6
  },
  {
    id: "LOC-FWD-ALPHA",
    name: "Forward Node Alpha (High Altitude Pass)",
    code: "FNA-ALT",
    type: "forward_node",
    coordinates: { lat: 32.7266, lng: 77.165 },
    altitudeMeters: 4350,
    terrainType: "High Altitude Pass",
    accessibilityIndicator: "Seasonal Mountain Pass (Snow-Chains & 6x6 Heavy All-Terrain Only)",
    weatherCondition: "Extreme Cold / Blizzard",
    temperatureC: -14,
    status: "WEATHER_ALERT",
    riskLevel: "CRITICAL",
    storageCapacityTons: 950,
    currentOccupancyTons: 380,
    assignedVehiclesCount: 2
  },
  {
    id: "LOC-FWD-BRAVO",
    name: "Forward Node Bravo (Valley Post)",
    code: "FNB-VAL",
    type: "forward_node",
    coordinates: { lat: 32.5512, lng: 76.782 },
    altitudeMeters: 3600,
    terrainType: "Mountain Valley",
    accessibilityIndicator: "Narrow Valley All-Weather Single Lane (Subject to Rockfall)",
    weatherCondition: "Dense Fog",
    temperatureC: -2,
    status: "HIGH_DEMAND",
    riskLevel: "HIGH",
    storageCapacityTons: 1100,
    currentOccupancyTons: 520,
    assignedVehiclesCount: 2
  },
  {
    id: "LOC-FWD-CHARLIE",
    name: "Forward Node Charlie (Tactical Ridge)",
    code: "FNC-RDG",
    type: "forward_node",
    coordinates: { lat: 31.954, lng: 77.85 },
    altitudeMeters: 3950,
    terrainType: "Mountain Ridge",
    accessibilityIndicator: "High-Altitude Ridgeline Track (Medium 4x4 / Tracked Snowcat)",
    weatherCondition: "Clear",
    temperatureC: 1,
    status: "OPERATIONAL",
    riskLevel: "MEDIUM",
    storageCapacityTons: 850,
    currentOccupancyTons: 610,
    assignedVehiclesCount: 1
  },
  {
    id: "LOC-FWD-DELTA",
    name: "Forward Node Delta (Desert Sector Front)",
    code: "FND-DES",
    type: "forward_node",
    coordinates: { lat: 29.98, lng: 75.95 },
    altitudeMeters: 210,
    terrainType: "Desert Plains",
    accessibilityIndicator: "Desert Hardpan Sand Tracks (All-Wheel Drive / 4x4 Required)",
    weatherCondition: "Sandstorm",
    temperatureC: 38,
    status: "WEATHER_ALERT",
    riskLevel: "HIGH",
    storageCapacityTons: 1400,
    currentOccupancyTons: 710,
    assignedVehiclesCount: 3
  },
  {
    id: "LOC-FWD-ECHO",
    name: "Forward Node Echo (River Crossing Base)",
    code: "FNE-RVR",
    type: "forward_node",
    coordinates: { lat: 30.82, lng: 76.92 },
    altitudeMeters: 850,
    terrainType: "Riverine Basin",
    accessibilityIndicator: "Riverine Causeway & Pontoon Crossing (Seasonal Monsoon Watch)",
    weatherCondition: "Monsoon Rain",
    temperatureC: 24,
    status: "OPERATIONAL",
    riskLevel: "LOW",
    storageCapacityTons: 1250,
    currentOccupancyTons: 980,
    assignedVehiclesCount: 2
  },
  {
    id: "LOC-TACTICAL-FOXTROT",
    name: "Tactical Supply Point Foxtrot",
    code: "TSP-FXT",
    type: "tactical_supply_point",
    coordinates: { lat: 33.15, lng: 77.45 },
    altitudeMeters: 4800,
    terrainType: "High Altitude Glacial Pass",
    accessibilityIndicator: "Extreme Glacial Ridge \u2014 Aerial / Cargo UAV & Snowcat Only",
    weatherCondition: "Extreme Cold / Blizzard",
    temperatureC: -21,
    status: "ISOLATED",
    riskLevel: "CRITICAL",
    storageCapacityTons: 400,
    currentOccupancyTons: 110,
    assignedVehiclesCount: 1
  }
];
var SYNTHETIC_ROUTES = [
  {
    id: "RTE-01",
    routeCode: "NH-ALPHA-EXPRESS",
    sourceId: "LOC-CENTRAL-01",
    sourceName: "Central Strategic Depot (Depot Alpha)",
    destinationId: "LOC-REG-NORTH",
    destinationName: "Regional Logistic Base (North Sector)",
    distanceKm: 165,
    standardTravelHours: 4.5,
    currentTravelHours: 4.8,
    status: "CLEAR",
    surfaceType: "Paved Highway",
    riskLevel: "LOW",
    coordinates: [[31.1048, 77.1734], [31.55, 76.85], [32.2215, 76.3234]]
  },
  {
    id: "RTE-02",
    routeCode: "VALLEY-LINK-BRAVO",
    sourceId: "LOC-REG-NORTH",
    sourceName: "Regional Logistic Base (North Sector)",
    destinationId: "LOC-FWD-BRAVO",
    destinationName: "Forward Node Bravo (Valley Post)",
    distanceKm: 98,
    standardTravelHours: 3.2,
    currentTravelHours: 4,
    status: "DEGRADED",
    surfaceType: "Mountain All-Weather",
    riskLevel: "MEDIUM",
    coordinates: [[32.2215, 76.3234], [32.38, 76.55], [32.5512, 76.782]]
  },
  {
    id: "RTE-03",
    routeCode: "PASS-ROHTANG-HIGHWAY",
    sourceId: "LOC-REG-NORTH",
    sourceName: "Regional Logistic Base (North Sector)",
    destinationId: "LOC-FWD-ALPHA",
    destinationName: "Forward Node Alpha (High Altitude Pass)",
    distanceKm: 142,
    standardTravelHours: 5.5,
    currentTravelHours: 8.2,
    status: "INCLEMENT_WEATHER",
    surfaceType: "Gravel Tactical Pass",
    riskLevel: "HIGH",
    coordinates: [[32.2215, 76.3234], [32.45, 76.88], [32.7266, 77.165]]
  },
  {
    id: "RTE-04",
    routeCode: "AERIAL-SUPPLY-GLACIER",
    sourceId: "LOC-FWD-ALPHA",
    sourceName: "Forward Node Alpha (High Altitude Pass)",
    destinationId: "LOC-TACTICAL-FOXTROT",
    destinationName: "Tactical Supply Point Foxtrot",
    distanceKm: 65,
    standardTravelHours: 1.2,
    currentTravelHours: 2.5,
    status: "INCLEMENT_WEATHER",
    surfaceType: "Aerial Corridor",
    riskLevel: "HIGH",
    coordinates: [[32.7266, 77.165], [32.95, 77.3], [33.15, 77.45]]
  },
  {
    id: "RTE-05",
    routeCode: "EAST-RIDGE-TACTICAL",
    sourceId: "LOC-CENTRAL-01",
    sourceName: "Central Strategic Depot (Depot Alpha)",
    destinationId: "LOC-FWD-CHARLIE",
    destinationName: "Forward Node Charlie (Tactical Ridge)",
    distanceKm: 125,
    standardTravelHours: 4,
    currentTravelHours: 4.2,
    status: "CLEAR",
    surfaceType: "Mountain All-Weather",
    riskLevel: "LOW",
    coordinates: [[31.1048, 77.1734], [31.5, 77.5], [31.954, 77.85]]
  },
  {
    id: "RTE-06",
    routeCode: "DESERT-CORRIDOR-SOUTH",
    sourceId: "LOC-REG-SOUTH",
    sourceName: "Regional Logistic Base (South Sector)",
    destinationId: "LOC-FWD-DELTA",
    destinationName: "Forward Node Delta (Desert Sector Front)",
    distanceKm: 240,
    standardTravelHours: 5,
    currentTravelHours: 6.5,
    status: "DEGRADED",
    surfaceType: "Paved Highway",
    riskLevel: "MEDIUM",
    coordinates: [[30.3165, 78.0322], [30.15, 77], [29.98, 75.95]]
  },
  {
    id: "RTE-07",
    routeCode: "RIVER-BASIN-FEEDER",
    sourceId: "LOC-HUB-01",
    sourceName: "Intermodal Transport Hub Kilo",
    destinationId: "LOC-FWD-ECHO",
    destinationName: "Forward Node Echo (River Crossing Base)",
    distanceKm: 110,
    standardTravelHours: 2.8,
    currentTravelHours: 3.1,
    status: "CLEAR",
    surfaceType: "Paved Highway",
    riskLevel: "LOW",
    coordinates: [[31.634, 76.527], [31.25, 76.75], [30.82, 76.92]]
  }
];
var SYNTHETIC_VEHICLES = [
  {
    id: "VEH-01",
    vehicleId: "TATRA-8x8-401",
    type: "Heavy All-Terrain Truck 6x6",
    capacityTons: 12,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-CENTRAL-01",
    currentLocationName: "Central Strategic Depot (Depot Alpha)",
    fuelPercentage: 92,
    maintenanceStatus: "GOOD",
    driverName: "Havildar Gurpreet Singh"
  },
  {
    id: "VEH-02",
    vehicleId: "TATRA-8x8-402",
    type: "Heavy All-Terrain Truck 6x6",
    capacityTons: 12,
    currentLoadTons: 10.5,
    status: "IN_TRANSIT",
    currentLocationId: "LOC-CENTRAL-01",
    currentLocationName: "Central Strategic Depot (Depot Alpha)",
    destinationLocationId: "LOC-REG-NORTH",
    destinationLocationName: "Regional Logistic Base (North Sector)",
    assignedRouteId: "RTE-01",
    estimatedArrival: "14:30 hrs",
    fuelPercentage: 74,
    maintenanceStatus: "GOOD",
    driverName: "Naik Surender Rawat"
  },
  {
    id: "VEH-03",
    vehicleId: "STALLION-4x4-105",
    type: "Medium Tactical Carrier 4x4",
    capacityTons: 5,
    currentLoadTons: 4.8,
    status: "IN_TRANSIT",
    currentLocationId: "LOC-REG-NORTH",
    currentLocationName: "Regional Logistic Base (North Sector)",
    destinationLocationId: "LOC-FWD-BRAVO",
    destinationLocationName: "Forward Node Bravo (Valley Post)",
    assignedRouteId: "RTE-02",
    estimatedArrival: "16:15 hrs",
    fuelPercentage: 68,
    maintenanceStatus: "GOOD",
    driverName: "Sepoy Dinesh Thapa"
  },
  {
    id: "VEH-04",
    vehicleId: "SNOWCAT-BV206-01",
    type: "Extreme Cold Snowcat",
    capacityTons: 2.5,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-FWD-ALPHA",
    currentLocationName: "Forward Node Alpha (High Altitude Pass)",
    fuelPercentage: 88,
    maintenanceStatus: "GOOD",
    driverName: "Naik Subedar Tenzing"
  },
  {
    id: "VEH-05",
    vehicleId: "HELI-CHINOOK-H01",
    type: "Heavy-Lift Logistics Helicopter",
    capacityTons: 9.5,
    currentLoadTons: 8.2,
    status: "ASSIGNED",
    currentLocationId: "LOC-REG-NORTH",
    currentLocationName: "Regional Logistic Base (North Sector)",
    destinationLocationId: "LOC-TACTICAL-FOXTROT",
    destinationLocationName: "Tactical Supply Point Foxtrot",
    assignedRouteId: "RTE-04",
    estimatedArrival: "12:45 hrs",
    fuelPercentage: 80,
    maintenanceStatus: "GOOD",
    driverName: "Sqn Ldr Abhinav Mehta"
  },
  {
    id: "VEH-06",
    vehicleId: "DRONE-CARGO-UAV01",
    type: "Autonomous Aerial Logistics Drone",
    capacityTons: 0.25,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-FWD-ALPHA",
    currentLocationName: "Forward Node Alpha (High Altitude Pass)",
    fuelPercentage: 98,
    maintenanceStatus: "GOOD",
    driverName: "Automated Flight Controller GCS-1"
  },
  {
    id: "VEH-07",
    vehicleId: "DRONE-CARGO-UAV02",
    type: "Autonomous Aerial Logistics Drone",
    capacityTons: 0.25,
    currentLoadTons: 0.2,
    status: "IN_TRANSIT",
    currentLocationId: "LOC-FWD-ALPHA",
    currentLocationName: "Forward Node Alpha (High Altitude Pass)",
    destinationLocationId: "LOC-TACTICAL-FOXTROT",
    destinationLocationName: "Tactical Supply Point Foxtrot",
    assignedRouteId: "RTE-04",
    estimatedArrival: "11:15 hrs",
    fuelPercentage: 84,
    maintenanceStatus: "GOOD",
    driverName: "Automated Flight Controller GCS-1"
  },
  {
    id: "VEH-08",
    vehicleId: "STALLION-4x4-108",
    type: "Medium Tactical Carrier 4x4",
    capacityTons: 5,
    currentLoadTons: 0,
    status: "MAINTENANCE",
    currentLocationId: "LOC-HUB-01",
    currentLocationName: "Intermodal Transport Hub Kilo",
    fuelPercentage: 45,
    maintenanceStatus: "SERVICING",
    driverName: "Under EME Workshop Inspection"
  },
  {
    id: "VEH-09",
    vehicleId: "ARMORED-BMP2-MED01",
    type: "Armored Supply Carrier",
    capacityTons: 3.5,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-FWD-DELTA",
    currentLocationName: "Forward Node Delta (Desert Sector Front)",
    fuelPercentage: 79,
    maintenanceStatus: "GOOD",
    driverName: "Dfr. Jaswant Gill"
  },
  {
    id: "VEH-10",
    vehicleId: "BOWSER-FUEL-F01",
    type: "Heavy All-Terrain Truck 6x6",
    capacityTons: 10,
    currentLoadTons: 9.8,
    status: "IN_TRANSIT",
    currentLocationId: "LOC-REG-SOUTH",
    currentLocationName: "Regional Logistic Base (South Sector)",
    destinationLocationId: "LOC-FWD-DELTA",
    destinationLocationName: "Forward Node Delta (Desert Sector Front)",
    assignedRouteId: "RTE-06",
    estimatedArrival: "17:00 hrs",
    fuelPercentage: 62,
    maintenanceStatus: "GOOD",
    driverName: "Havildar Balbir Negi"
  },
  {
    id: "VEH-11",
    vehicleId: "TATRA-8x8-403",
    type: "Heavy All-Terrain Truck 6x6",
    capacityTons: 12,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-CENTRAL-01",
    currentLocationName: "Central Strategic Depot (Depot Alpha)",
    fuelPercentage: 85,
    maintenanceStatus: "GOOD",
    driverName: "Sepoy Arvind Yadav"
  },
  {
    id: "VEH-12",
    vehicleId: "STALLION-4x4-112",
    type: "Medium Tactical Carrier 4x4",
    capacityTons: 5,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-REG-NORTH",
    currentLocationName: "Regional Logistic Base (North Sector)",
    fuelPercentage: 90,
    maintenanceStatus: "GOOD",
    driverName: "Naik Sandeep Shinde"
  },
  {
    id: "VEH-13",
    vehicleId: "SNOWCAT-BV206-02",
    type: "Extreme Cold Snowcat",
    capacityTons: 2.5,
    currentLoadTons: 2.1,
    status: "IN_TRANSIT",
    currentLocationId: "LOC-FWD-ALPHA",
    currentLocationName: "Forward Node Alpha (High Altitude Pass)",
    destinationLocationId: "LOC-FWD-BRAVO",
    destinationLocationName: "Forward Node Bravo (Valley Post)",
    assignedRouteId: "RTE-02",
    estimatedArrival: "15:45 hrs",
    fuelPercentage: 71,
    maintenanceStatus: "GOOD",
    driverName: "Sepoy Nawang Dorje"
  },
  {
    id: "VEH-14",
    vehicleId: "STALLION-4x4-114",
    type: "Medium Tactical Carrier 4x4",
    capacityTons: 5,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-FWD-ECHO",
    currentLocationName: "Forward Node Echo (River Crossing Base)",
    fuelPercentage: 94,
    maintenanceStatus: "GOOD",
    driverName: "Havildar Mohan Lal"
  },
  {
    id: "VEH-15",
    vehicleId: "ARMORED-BMP2-MED02",
    type: "Armored Supply Carrier",
    capacityTons: 3.5,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-FWD-DELTA",
    currentLocationName: "Forward Node Delta (Desert Sector Front)",
    fuelPercentage: 83,
    maintenanceStatus: "GOOD",
    driverName: "Naik Kuldeep Singh"
  },
  {
    id: "VEH-16",
    vehicleId: "BOWSER-FUEL-F02",
    type: "Heavy All-Terrain Truck 6x6",
    capacityTons: 10,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-REG-NORTH",
    currentLocationName: "Regional Logistic Base (North Sector)",
    fuelPercentage: 89,
    maintenanceStatus: "GOOD",
    driverName: "Sepoy Harish Pant"
  },
  {
    id: "VEH-17",
    vehicleId: "DRONE-CARGO-UAV03",
    type: "Autonomous Aerial Logistics Drone",
    capacityTons: 0.25,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-REG-NORTH",
    currentLocationName: "Regional Logistic Base (North Sector)",
    fuelPercentage: 100,
    maintenanceStatus: "GOOD",
    driverName: "Automated Flight Controller GCS-2"
  },
  {
    id: "VEH-18",
    vehicleId: "HELI-CHINOOK-H02",
    type: "Heavy-Lift Logistics Helicopter",
    capacityTons: 9.5,
    currentLoadTons: 0,
    status: "AVAILABLE",
    currentLocationId: "LOC-CENTRAL-01",
    currentLocationName: "Central Strategic Depot (Depot Alpha)",
    fuelPercentage: 95,
    maintenanceStatus: "GOOD",
    driverName: "Wing Cdr. R. K. Saxena"
  },
  {
    id: "VEH-19",
    vehicleId: "TATRA-8x8-405",
    type: "Heavy All-Terrain Truck 6x6",
    capacityTons: 12,
    currentLoadTons: 0,
    status: "MAINTENANCE",
    currentLocationId: "LOC-REG-SOUTH",
    currentLocationName: "Regional Logistic Base (South Sector)",
    fuelPercentage: 30,
    maintenanceStatus: "INSPECTION_DUE",
    driverName: "EME Workshop Maintenance Bay 2"
  },
  {
    id: "VEH-20",
    vehicleId: "STALLION-4x4-120",
    type: "Medium Tactical Carrier 4x4",
    capacityTons: 5,
    currentLoadTons: 4.2,
    status: "ASSIGNED",
    currentLocationId: "LOC-HUB-01",
    currentLocationName: "Intermodal Transport Hub Kilo",
    destinationLocationId: "LOC-FWD-CHARLIE",
    destinationLocationName: "Forward Node Charlie (Tactical Ridge)",
    assignedRouteId: "RTE-05",
    estimatedArrival: "18:30 hrs",
    fuelPercentage: 86,
    maintenanceStatus: "GOOD",
    driverName: "Sepoy Jagtar Singh"
  }
];
var ITEM_CATALOG = [
  { name: "5.56x45mm NATO Ball Ammunition (Crates)", category: "Ammunition & Ordnance", unit: "Crates (1k rnds)", baseDaily: 25, baseMin: 150, baseMax: 1e3, leadTime: 4 },
  { name: "7.62x51mm Linked Sniper/MG Cartridges", category: "Ammunition & Ordnance", unit: "Boxes (500 rnds)", baseDaily: 15, baseMin: 90, baseMax: 600, leadTime: 4 },
  { name: "84mm Carl Gustaf HE 441D Rockets", category: "Ammunition & Ordnance", unit: "Canisters", baseDaily: 8, baseMin: 45, baseMax: 300, leadTime: 6 },
  { name: "120mm Mortar Smoke & HE Bombs", category: "Ammunition & Ordnance", unit: "Rounds", baseDaily: 12, baseMin: 70, baseMax: 450, leadTime: 7 },
  { name: "Aviation Turbine Fuel (ATF Kero-50)", category: "POL (Petroleum, Oil, Lubricants)", unit: "Kiloliters (kL)", baseDaily: 40, baseMin: 220, baseMax: 1500, leadTime: 3 },
  { name: "Diesel High-Altitude Winter Grade (DHA-50)", category: "POL (Petroleum, Oil, Lubricants)", unit: "Barrels (200L)", baseDaily: 35, baseMin: 180, baseMax: 1200, leadTime: 3 },
  { name: "High-Temperature Synthetic Engine Oil", category: "POL (Petroleum, Oil, Lubricants)", unit: "Drums (50L)", baseDaily: 6, baseMin: 30, baseMax: 200, leadTime: 5 },
  { name: "MRE 24-Hour High-Altitude Combat Rations", category: "Rations & MRE", unit: "Packs (24h)", baseDaily: 80, baseMin: 400, baseMax: 3e3, leadTime: 4 },
  { name: "Fortified High-Calorie Energy Survival Bars", category: "Rations & MRE", unit: "Cartons (100 bars)", baseDaily: 20, baseMin: 110, baseMax: 800, leadTime: 4 },
  { name: "Dehydrated Pulses & Freeze-Dried Vegetables", category: "Rations & MRE", unit: "Sacks (25kg)", baseDaily: 15, baseMin: 80, baseMax: 600, leadTime: 5 },
  { name: "Tactical Combat Casualty Care (TCCC) Trauma Kits", category: "Medical & Trauma", unit: "Individual Kits", baseDaily: 10, baseMin: 60, baseMax: 400, leadTime: 5 },
  { name: "Lyophilized Whole Blood & IV Plasma Expander", category: "Medical & Trauma", unit: "Units (Cryo)", baseDaily: 8, baseMin: 50, baseMax: 350, leadTime: 2 },
  { name: "High Altitude Cerebral/Pulmonary Edema Meds (HAPE/HACE)", category: "Medical & Trauma", unit: "Ampoules/Kits", baseDaily: 14, baseMin: 85, baseMax: 500, leadTime: 3 },
  { name: "Heavy Vehicle All-Terrain Traction Chains", category: "Spare Parts & Maintenance", unit: "Wheel Sets", baseDaily: 4, baseMin: 25, baseMax: 150, leadTime: 7 },
  { name: "Radiator Anti-Freeze Coolant (-50\xB0C spec)", category: "Spare Parts & Maintenance", unit: "Jerry Cans (20L)", baseDaily: 12, baseMin: 65, baseMax: 400, leadTime: 4 },
  { name: "Multi-Band VHF/UHF Secure Tactical Radios", category: "Tactical Communications", unit: "Handheld Units", baseDaily: 3, baseMin: 20, baseMax: 120, leadTime: 8 },
  { name: "Solar Rapid Recharge Expeditionary Packs", category: "Tactical Communications", unit: "Foldable Units", baseDaily: 5, baseMin: 30, baseMax: 180, leadTime: 6 },
  { name: "Extreme Cold Weather Clothing System (ECWCS Layer 7)", category: "Cold Weather & Mountaineering", unit: "Parka + Trousers", baseDaily: 18, baseMin: 100, baseMax: 700, leadTime: 6 },
  { name: "Crampons, Ice Axes & Fixed Ropes Kit", category: "Cold Weather & Mountaineering", unit: "Bundles (50m + Gear)", baseDaily: 6, baseMin: 35, baseMax: 220, leadTime: 7 },
  { name: "Tactical Drone Replacement Rotors & Battery Cells", category: "Spare Parts & Maintenance", unit: "Maintenance Packs", baseDaily: 9, baseMin: 55, baseMax: 360, leadTime: 5 }
];
function generateInitialDatabase() {
  const users = [...INITIAL_USERS];
  const locations = [...SYNTHETIC_LOCATIONS];
  const routes = [...SYNTHETIC_ROUTES];
  const vehicles = [...SYNTHETIC_VEHICLES];
  const inventory = [];
  let itemCounter = 1;
  locations.forEach((loc) => {
    const catalogSlice = loc.type === "central_depot" ? ITEM_CATALOG : loc.type === "forward_node" || loc.type === "tactical_supply_point" ? ITEM_CATALOG.slice(0, 8) : ITEM_CATALOG.slice(0, 14);
    catalogSlice.forEach((catItem) => {
      let stockMultiplier = 1;
      if (loc.type === "central_depot") stockMultiplier = 3.5;
      else if (loc.type === "regional_depot") stockMultiplier = 1.8;
      else if (loc.type === "forward_node") stockMultiplier = 0.65;
      else if (loc.type === "tactical_supply_point") stockMultiplier = 0.25;
      const daily = Math.max(2, Math.round(catItem.baseDaily * (loc.type === "central_depot" ? 2 : 1)));
      const minStock = Math.round(catItem.baseMin * stockMultiplier);
      const maxStock = Math.round(catItem.baseMax * stockMultiplier);
      let currentStock = Math.round(minStock * (1.2 + Math.sin(itemCounter) * 0.5));
      if (loc.id === "LOC-FWD-ALPHA" && (catItem.category.includes("POL") || catItem.category.includes("Cold Weather"))) {
        currentStock = Math.round(minStock * 0.35);
      } else if (loc.id === "LOC-TACTICAL-FOXTROT") {
        currentStock = Math.round(minStock * 0.45);
      } else if (loc.id === "LOC-FWD-DELTA" && catItem.category.includes("POL")) {
        currentStock = Math.round(minStock * 0.6);
      }
      currentStock = Math.max(15, currentStock);
      const safetyStock = calculateSafetyStock(daily, catItem.leadTime, catItem.category);
      const reorderPoint = calculateReorderPoint(daily, catItem.leadTime, safetyStock);
      const expectedDemand7d = Math.round(daily * 7 * (loc.weatherCondition.includes("Cold") ? 1.3 : 1));
      const expectedDemand14d = Math.round(daily * 14 * (loc.weatherCondition.includes("Cold") ? 1.3 : 1));
      const expectedDemand30d = Math.round(daily * 30 * (loc.weatherCondition.includes("Cold") ? 1.3 : 1));
      const risk = calculateStockoutRisk(currentStock, daily * catItem.leadTime, safetyStock);
      let status = "NORMAL";
      if (currentStock <= minStock * 0.5) status = "CRITICAL";
      else if (currentStock <= minStock) status = "LOW";
      else if (currentStock > maxStock * 0.95) status = "OVERSTOCKED";
      const recommendedReorder = status === "CRITICAL" || status === "LOW" ? Math.max(0, Math.round(maxStock * 0.85 - currentStock)) : 0;
      inventory.push({
        id: `INV-REC-${String(itemCounter).padStart(4, "0")}`,
        itemId: `ITM-${catItem.category.slice(0, 3).toUpperCase()}-${String(itemCounter).padStart(3, "0")}`,
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
        lastAudited: new Date(Date.now() - itemCounter % 14 * 864e5).toISOString()
      });
      itemCounter++;
    });
  });
  const demandHistory = [];
  let demandIdCounter = 1;
  const now = Date.now();
  const sampleItemsForHistory = inventory.slice(0, 16);
  sampleItemsForHistory.forEach((item) => {
    for (let dayOffset = 65; dayOffset >= 0; dayOffset--) {
      const recordDate = new Date(now - dayOffset * 864e5).toISOString().split("T")[0];
      const dayMod = dayOffset % 7;
      const isWeekendOrSurge = dayMod === 0 || dayMod === 3;
      const tempoMultiplier = isWeekendOrSurge ? 1.35 : 1;
      const variation = Math.sin(dayOffset / 5) * (item.dailyConsumption * 0.2);
      const randomNoise = (Math.random() - 0.5) * (item.dailyConsumption * 0.15);
      const consumption = Math.max(1, Math.round(item.dailyConsumption * tempoMultiplier + variation + randomNoise));
      const tempos = [
        "Routine",
        "Routine",
        "Heightened Readiness",
        "Field Exercise",
        "Routine"
      ];
      demandHistory.push({
        id: `DMND-${String(demandIdCounter++).padStart(5, "0")}`,
        itemId: item.itemId,
        itemName: item.name,
        category: item.category,
        locationId: item.locationId,
        locationName: item.locationName,
        date: recordDate,
        consumption,
        weatherCategory: dayOffset > 45 ? "Monsoon Rain" : dayOffset > 15 ? "Dense Fog" : "Extreme Cold / Blizzard",
        operationalTempo: tempos[dayOffset % tempos.length],
        leadTimeRecorded: item.leadTimeDays
      });
    }
  });
  const inventoryTransactions = [];
  const transTypes = ["RECEIPT", "DISPATCH", "TRANSFER", "DISPATCH"];
  const officers = ["Col. Sengupta", "Lt. Col. Menon", "Maj. Rathore", "Capt. Deshmukh"];
  for (let i = 1; i <= 105; i++) {
    const randomItem = inventory[i % inventory.length];
    const transType = transTypes[i % transTypes.length];
    const qty = Math.round(randomItem.dailyConsumption * (1 + i % 5));
    inventoryTransactions.push({
      id: `TXN-LOG-${String(i).padStart(4, "0")}`,
      timestamp: new Date(now - (105 - i) * 6 * 36e5).toISOString(),
      itemId: randomItem.itemId,
      itemName: randomItem.name,
      locationId: randomItem.locationId,
      locationName: randomItem.locationName,
      type: transType,
      quantity: qty,
      referenceId: `REF-MO-26251-${1e3 + i}`,
      performedBy: officers[i % officers.length],
      remarks: transType === "RECEIPT" ? `Consignment received from Central Railway Depot under Challan #${8800 + i}` : transType === "DISPATCH" ? `Forward movement dispatched for sector readiness drill` : transType === "TRANSFER" ? `Intra-sector strategic rebalancing` : `Physical ledger discrepancy reconciliation`
    });
  }
  const sensorData = [
    {
      id: "IOT-01",
      sensorId: "SEN-COLD-ALP-01",
      unitName: "Depot Alpha Cryo Blood Storage Vault #1",
      locationId: "LOC-CENTRAL-01",
      locationName: "Central Strategic Depot (Depot Alpha)",
      targetCategory: "Medical & Trauma",
      temperatureC: 4.1,
      humidityPercent: 42,
      storageLevelPercent: 88,
      quantity: 320,
      containerPressurePsi: 14.7,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 98,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-02",
      sensorId: "SEN-FUEL-BLD-02",
      unitName: "Forward Pass Alpha Fuel Bladder Echo-1",
      locationId: "LOC-FWD-ALPHA",
      locationName: "Forward Node Alpha (High Altitude Pass)",
      targetCategory: "POL (Petroleum, Oil, Lubricants)",
      temperatureC: -16.2,
      humidityPercent: 78,
      storageLevelPercent: 24,
      // Low fuel level
      quantity: 58,
      containerPressurePsi: 11.2,
      // Pressure drop anomaly!
      deviceHealth: "DEGRADED",
      status: "CRITICAL",
      batteryLevel: 74,
      hasAnomaly: true,
      anomalySeverity: "CRITICAL",
      anomalyType: "PRESSURE",
      anomalyDescription: "Cold flow viscosity warning & pressure drop detected: 11.2 PSI (Baseline 14.5 PSI)",
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-03",
      sensorId: "SEN-AMMO-BKR-03",
      unitName: "Forward Node Bravo Ammunition Bunker B4",
      locationId: "LOC-FWD-BRAVO",
      locationName: "Forward Node Bravo (Valley Post)",
      targetCategory: "Ammunition & Ordnance",
      temperatureC: 2.4,
      humidityPercent: 51,
      storageLevelPercent: 58,
      quantity: 410,
      containerPressurePsi: 14.8,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 92,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-04",
      sensorId: "SEN-RATION-SLO-04",
      unitName: "Regional Depot North MRE Ration Warehouse A",
      locationId: "LOC-REG-NORTH",
      locationName: "Regional Logistic Base (North Sector)",
      targetCategory: "Rations & MRE",
      temperatureC: 9.2,
      humidityPercent: 45,
      storageLevelPercent: 79,
      quantity: 1850,
      containerPressurePsi: 14.6,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 95,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-05",
      sensorId: "SEN-MED-CRY-05",
      unitName: "Tactical Foxtrot Emergency Trauma Cabinet",
      locationId: "LOC-TACTICAL-FOXTROT",
      locationName: "Tactical Supply Point Foxtrot",
      targetCategory: "Medical & Trauma",
      temperatureC: -18.5,
      humidityPercent: 88,
      storageLevelPercent: 22,
      quantity: 28,
      containerPressurePsi: 14.2,
      deviceHealth: "ONLINE",
      status: "WARNING",
      batteryLevel: 81,
      hasAnomaly: true,
      anomalySeverity: "WARNING",
      anomalyType: "LOW_STORAGE",
      anomalyDescription: "Critical stock exhaustion threshold reached: 22% remaining",
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-06",
      sensorId: "SEN-FUEL-DES-06",
      unitName: "Desert Sector Delta Fuel Reserve Tanker",
      locationId: "LOC-FWD-DELTA",
      locationName: "Forward Node Delta (Desert Sector Front)",
      targetCategory: "POL (Petroleum, Oil, Lubricants)",
      temperatureC: 41.5,
      humidityPercent: 18,
      storageLevelPercent: 36,
      quantity: 110,
      containerPressurePsi: 16.8,
      // High thermal expansion pressure
      deviceHealth: "ONLINE",
      status: "WARNING",
      batteryLevel: 86,
      hasAnomaly: true,
      anomalySeverity: "WARNING",
      anomalyType: "TEMPERATURE",
      anomalyDescription: "High ambient temperature causing thermal fuel expansion (41.5\xB0C)",
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-07",
      sensorId: "SEN-CLOTH-FWD-07",
      unitName: "Forward Node Alpha High-Altitude Gear Vault",
      locationId: "LOC-FWD-ALPHA",
      locationName: "Forward Node Alpha (High Altitude Pass)",
      targetCategory: "Cold Weather & Mountaineering",
      temperatureC: -12,
      humidityPercent: 62,
      storageLevelPercent: 31,
      quantity: 45,
      containerPressurePsi: 14.7,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 89,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-08",
      sensorId: "SEN-RADIO-HUB-08",
      unitName: "Transport Hub Kilo Tactical Radio Secure Locker",
      locationId: "LOC-HUB-01",
      locationName: "Intermodal Transport Hub Kilo",
      targetCategory: "Tactical Communications",
      temperatureC: 21,
      humidityPercent: 38,
      storageLevelPercent: 84,
      quantity: 92,
      containerPressurePsi: 14.7,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 99,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-09",
      sensorId: "SEN-PARTS-SOU-09",
      unitName: "Regional Depot South Spare Parts Store B",
      locationId: "LOC-REG-SOUTH",
      locationName: "Regional Logistic Base (South Sector)",
      targetCategory: "Spare Parts & Maintenance",
      temperatureC: 23.5,
      humidityPercent: 44,
      storageLevelPercent: 71,
      quantity: 540,
      containerPressurePsi: 14.7,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 94,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-10",
      sensorId: "SEN-AMMO-RDG-10",
      unitName: "Forward Charlie Ridge Ordnance Silo 1",
      locationId: "LOC-FWD-CHARLIE",
      locationName: "Forward Node Charlie (Tactical Ridge)",
      targetCategory: "Ammunition & Ordnance",
      temperatureC: -1,
      humidityPercent: 55,
      storageLevelPercent: 75,
      quantity: 380,
      containerPressurePsi: 14.7,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 91,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-11",
      sensorId: "SEN-RATION-ECH-11",
      unitName: "River Base Echo Ration Storage Shelter",
      locationId: "LOC-FWD-ECHO",
      locationName: "Forward Node Echo (River Crossing Base)",
      targetCategory: "Rations & MRE",
      temperatureC: 26,
      humidityPercent: 72,
      storageLevelPercent: 82,
      quantity: 1100,
      containerPressurePsi: 14.7,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 93,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "IOT-12",
      sensorId: "SEN-AMMO-DES-12",
      unitName: "Forward Delta Ordnance Magazine D-3",
      locationId: "LOC-FWD-DELTA",
      locationName: "Forward Node Delta (Desert Sector Front)",
      targetCategory: "Ammunition & Ordnance",
      temperatureC: 37,
      humidityPercent: 22,
      storageLevelPercent: 68,
      quantity: 490,
      containerPressurePsi: 14.8,
      deviceHealth: "ONLINE",
      status: "NORMAL",
      batteryLevel: 87,
      hasAnomaly: false,
      lastPing: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  const alerts = [
    {
      id: "ALT-2026-001",
      timestamp: new Date(now - 15 * 6e4).toISOString(),
      type: "STOCKOUT RISK",
      severity: "CRITICAL",
      locationId: "LOC-FWD-ALPHA",
      locationName: "Forward Node Alpha (High Altitude Pass)",
      title: "Winter Diesel DHA-50 Critical Depletion",
      description: "Current fuel reserves below 48-hour buffer under -14\xB0C blizzard conditions. Daily consumption 45 kL vs 58 kL on hand.",
      recommendedAction: "Immediate dispatch of Tatra 6x6 fuel bowser convoy from Regional Base North or request Chinook emergency airlift.",
      status: "NEW"
    },
    {
      id: "ALT-2026-002",
      timestamp: new Date(now - 45 * 6e4).toISOString(),
      type: "INVENTORY ANOMALY",
      severity: "HIGH",
      locationId: "LOC-FWD-ALPHA",
      locationName: "Forward Node Alpha (High Altitude Pass)",
      sensorId: "SEN-FUEL-BLD-02",
      sensorName: "Forward Pass Alpha Fuel Bladder Echo-1",
      title: "Fuel Bladder Echo-1 Sudden Pressure Drop",
      description: "IoT sensor SEN-FUEL-BLD-02 registered pressure drop to 11.2 PSI (-23% below nominal threshold). Possible thermal contraction or seam seepage.",
      recommendedAction: "Deploy Base Engineering detachment for visual inspection of storage bladder bladder seals and cold-flow valves.",
      status: "ACKNOWLEDGED",
      acknowledgedBy: "Col. Sengupta",
      acknowledgedAt: new Date(now - 20 * 6e4).toISOString()
    },
    {
      id: "ALT-2026-003",
      timestamp: new Date(now - 120 * 6e4).toISOString(),
      type: "LOW STOCK",
      severity: "HIGH",
      locationId: "LOC-TACTICAL-FOXTROT",
      locationName: "Tactical Supply Point Foxtrot",
      title: "TCCC Medical Trauma Kits Below Minimum Stock",
      description: "Medical kit inventory at 28 units (Safety threshold 60 units). Sector isolated due to snowfall pass closure.",
      recommendedAction: "Schedule autonomous cargo UAV sortie (DRONE-CARGO-UAV01) to deliver 25 units payload within flight weather window.",
      status: "NEW"
    },
    {
      id: "ALT-2026-004",
      timestamp: new Date(now - 240 * 6e4).toISOString(),
      type: "TRANSPORT DELAY",
      severity: "WARNING",
      locationId: "LOC-FWD-BRAVO",
      locationName: "Forward Node Bravo (Valley Post)",
      title: "Convoy Delay on Route VALLEY-LINK-BRAVO",
      description: "STALLION-4x4-105 encountering dense valley fog and rockfall clearance operations. ETA delayed by +45 minutes.",
      recommendedAction: "Reroute secondary support vehicles via ridge detour and adjust receiving station unloading readiness.",
      status: "ACKNOWLEDGED",
      acknowledgedBy: "Maj. Rathore",
      acknowledgedAt: new Date(now - 150 * 6e4).toISOString()
    },
    {
      id: "ALT-2026-005",
      timestamp: new Date(now - 360 * 6e4).toISOString(),
      type: "FORECAST ANOMALY",
      severity: "INFO",
      locationId: "LOC-FWD-DELTA",
      locationName: "Forward Node Delta (Desert Sector Front)",
      title: "Surge Demand Projected for Heavy Traction Chains & Oil",
      description: "Approaching dust storm expected to spike mechanical wear on transmission filters and engine cooling systems by +35%.",
      recommendedAction: "Pre-position 30 drum spares from Regional Depot South before weather front impact.",
      status: "RESOLVED",
      acknowledgedBy: "Dr. Sunita Kulkarni",
      acknowledgedAt: new Date(now - 300 * 6e4).toISOString()
    },
    {
      id: "ALT-2026-006",
      timestamp: new Date(now - 480 * 6e4).toISOString(),
      type: "CAPACITY SHORTAGE",
      severity: "WARNING",
      locationId: "LOC-HUB-01",
      locationName: "Intermodal Transport Hub Kilo",
      title: "Heavy Lift Vehicle Utilization Reaching 90%",
      description: "Available heavy-duty vehicle capacity constrained due to simultaneous north and south sector supply dispatches.",
      recommendedAction: "Coordinate with EME workshop to expedite STALLION-4x4-108 routine maintenance release.",
      status: "NEW"
    }
  ];
  const auditLogs = [
    {
      id: "AUD-001",
      timestamp: new Date(now - 10 * 6e4).toISOString(),
      userId: "USR-001",
      userName: "Brig. Rajesh Varma (Retd.)",
      role: "admin",
      action: "SYSTEM_CONFIG_UPDATED",
      targetEntity: "Forecasting Parameters",
      details: "Adjusted model default lookback horizon to 30 days and set winter weather multiplier to 1.4x"
    },
    {
      id: "AUD-002",
      timestamp: new Date(now - 25 * 6e4).toISOString(),
      userId: "USR-002",
      userName: "Col. Amitav Sengupta",
      role: "logistics_officer",
      action: "ALERT_ACKNOWLEDGED",
      targetEntity: "ALT-2026-002",
      details: "Acknowledged fuel pressure anomaly alert at Forward Node Alpha and initiated EME inspection dispatch"
    },
    {
      id: "AUD-003",
      timestamp: new Date(now - 45 * 6e4).toISOString(),
      userId: "USR-003",
      userName: "Lt. Col. Priya Menon",
      role: "inventory_manager",
      action: "STOCK_LEVEL_UPDATED",
      targetEntity: "INV-REC-0014",
      details: "Reconciled ammunition crate receipts for 120mm mortar rounds at Central Depot Alpha (+150 units)"
    },
    {
      id: "AUD-004",
      timestamp: new Date(now - 80 * 6e4).toISOString(),
      userId: "USR-004",
      userName: "Maj. Vikramaditya Rathore",
      role: "transport_manager",
      action: "FLEET_DISPATCH_ORDERED",
      targetEntity: "VEH-02 (TATRA-8x8-402)",
      details: "Authorized convoy movement on Route NH-ALPHA-EXPRESS to Regional Base North with 10.5 tons general stores"
    }
  ];
  const recommendations = [
    {
      id: "REC-OPT-1001",
      sourceId: "LOC-REG-NORTH",
      sourceName: "Regional Logistic Base (North Sector)",
      destinationId: "LOC-FWD-ALPHA",
      destinationName: "Forward Node Alpha (High Altitude Pass)",
      itemId: "ITM-POL-005",
      itemName: "Diesel High-Altitude Winter Grade (DHA-50)",
      category: "POL (Petroleum, Oil, Lubricants)",
      supplyQuantity: 120,
      transportType: "Heavy All-Terrain Truck 6x6",
      estimatedTimeHours: 8.2,
      priority: "URGENT",
      status: "RECOMMENDED",
      reasoning: "Node Alpha projected demand exceeds on-hand reserves under sub-zero blizzard. Replenishment from Regional Base North recommended before pass block.",
      createdAt: new Date(now - 30 * 6e4).toISOString()
    },
    {
      id: "REC-OPT-1002",
      sourceId: "LOC-REG-NORTH",
      sourceName: "Regional Logistic Base (North Sector)",
      destinationId: "LOC-TACTICAL-FOXTROT",
      destinationName: "Tactical Supply Point Foxtrot",
      itemId: "ITM-MED-011",
      itemName: "Tactical Combat Casualty Care (TCCC) Trauma Kits",
      category: "Medical & Trauma",
      supplyQuantity: 35,
      transportType: "Autonomous Aerial Logistics Drone",
      estimatedTimeHours: 2.5,
      priority: "URGENT",
      status: "RECOMMENDED",
      reasoning: "Ground route blocked due to glacial snowfall. Autonomous aerial corridor recommended for emergency medical stock replenishment.",
      createdAt: new Date(now - 45 * 6e4).toISOString()
    },
    {
      id: "REC-OPT-1003",
      sourceId: "LOC-CENTRAL-01",
      sourceName: "Central Strategic Depot (Depot Alpha)",
      destinationId: "LOC-FWD-BRAVO",
      destinationName: "Forward Node Bravo (Valley Post)",
      itemId: "ITM-RAT-008",
      itemName: "MRE 24-Hour High-Altitude Combat Rations",
      category: "Rations & MRE",
      supplyQuantity: 450,
      transportType: "Medium Tactical Carrier 4x4",
      estimatedTimeHours: 4,
      priority: "HIGH",
      status: "RECOMMENDED",
      reasoning: "Pre-positioning 7-day reserve supply to support heightened valley defensive posture and mitigate potential road slips.",
      createdAt: new Date(now - 60 * 6e4).toISOString()
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
var DatabaseService = class {
  constructor() {
    this.state = generateInitialDatabase();
  }
  resetDemoData() {
    this.state = generateInitialDatabase();
    return this.state;
  }
  getState() {
    return this.state;
  }
  // Users
  getUsers() {
    return this.state.users;
  }
  getUserByEmail(email) {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  getUserById(id) {
    return this.state.users.find((u) => u.id === id);
  }
  createUser(user) {
    const newUser = {
      ...user,
      id: `USR-${String(this.state.users.length + 1).padStart(3, "0")}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.state.users.push(newUser);
    return newUser;
  }
  updateUserRole(id, role) {
    const user = this.state.users.find((u) => u.id === id);
    if (user) {
      user.role = role;
    }
    return user;
  }
  // Locations
  getLocations() {
    return this.state.locations;
  }
  getLocationById(id) {
    return this.state.locations.find((l) => l.id === id);
  }
  updateLocationStatus(id, status, riskLevel) {
    const loc = this.state.locations.find((l) => l.id === id);
    if (loc) {
      loc.status = status;
      loc.riskLevel = riskLevel;
    }
    return loc;
  }
  // Inventory
  getInventory() {
    return this.state.inventory;
  }
  getInventoryItemById(id) {
    return this.state.inventory.find((i) => i.id === id || i.itemId === id);
  }
  createInventoryItem(item) {
    const safetyStock = calculateSafetyStock(item.dailyConsumption, item.leadTimeDays, item.category);
    const risk = calculateStockoutRisk(item.currentStock, item.dailyConsumption * item.leadTimeDays, safetyStock);
    let status = "NORMAL";
    if (item.currentStock <= item.minStock * 0.5) status = "CRITICAL";
    else if (item.currentStock <= item.minStock) status = "LOW";
    else if (item.currentStock > item.maxStock * 0.95) status = "OVERSTOCKED";
    const newItem = {
      ...item,
      id: `INV-REC-${String(this.state.inventory.length + 1).padStart(4, "0")}`,
      stockoutRiskScore: risk.score,
      stockoutRiskCategory: risk.category,
      status,
      lastAudited: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.state.inventory.push(newItem);
    return newItem;
  }
  updateInventoryItem(id, updates) {
    const index = this.state.inventory.findIndex((i) => i.id === id || i.itemId === id);
    if (index === -1) return void 0;
    const existing = this.state.inventory[index];
    const updated = { ...existing, ...updates };
    const safetyStock = calculateSafetyStock(updated.dailyConsumption, updated.leadTimeDays, updated.category);
    const risk = calculateStockoutRisk(updated.currentStock, updated.dailyConsumption * updated.leadTimeDays, safetyStock);
    let status = "NORMAL";
    if (updated.currentStock <= updated.minStock * 0.5) status = "CRITICAL";
    else if (updated.currentStock <= updated.minStock) status = "LOW";
    else if (updated.currentStock > updated.maxStock * 0.95) status = "OVERSTOCKED";
    updated.stockoutRiskScore = risk.score;
    updated.stockoutRiskCategory = risk.category;
    updated.status = status;
    updated.lastAudited = (/* @__PURE__ */ new Date()).toISOString();
    this.state.inventory[index] = updated;
    return updated;
  }
  deleteInventoryItem(id) {
    const initialLen = this.state.inventory.length;
    this.state.inventory = this.state.inventory.filter((i) => i.id !== id && i.itemId !== id);
    return this.state.inventory.length < initialLen;
  }
  // Demand History
  getDemandHistory(itemId, locationId) {
    let list = this.state.demandHistory;
    if (itemId) list = list.filter((d) => d.itemId === itemId);
    if (locationId) list = list.filter((d) => d.locationId === locationId);
    if (itemId && list.length === 0) {
      const item = this.state.inventory.find((i) => i.itemId === itemId || i.id === itemId);
      if (item) {
        const now = Date.now();
        const tempos = [
          "Routine",
          "Routine",
          "Heightened Readiness",
          "Field Exercise",
          "Routine"
        ];
        const newRecords = [];
        for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
          const recordDate = new Date(now - dayOffset * 864e5).toISOString().split("T")[0];
          const dayMod = dayOffset % 7;
          const isSurge = dayMod === 0 || dayMod === 3;
          const tempoMult = isSurge ? 1.25 : 1;
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
            weatherCategory: dayOffset > 15 ? "Dense Fog" : "Extreme Cold / Blizzard",
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
  getVehicles() {
    return this.state.vehicles;
  }
  updateVehicleStatus(id, status, destinationLocationId) {
    const v = this.state.vehicles.find((veh) => veh.id === id || veh.vehicleId === id);
    if (v) {
      v.status = status;
      if (destinationLocationId) {
        v.destinationLocationId = destinationLocationId;
        const destLoc = this.state.locations.find((l) => l.id === destinationLocationId);
        v.destinationLocationName = destLoc ? destLoc.name : void 0;
      }
    }
    return v;
  }
  // Routes
  getRoutes() {
    return this.state.routes;
  }
  // Recommendations
  getRecommendations() {
    return this.state.recommendations;
  }
  setRecommendations(recs) {
    this.state.recommendations = recs;
  }
  approveRecommendation(recId) {
    const rec = this.state.recommendations.find((r) => r.id === recId);
    if (!rec) return void 0;
    rec.status = "APPROVED";
    this.addInventoryTransaction({
      itemId: rec.itemId,
      itemName: rec.itemName,
      locationId: rec.sourceId,
      locationName: rec.sourceName,
      type: "DISPATCH",
      quantity: rec.supplyQuantity,
      referenceId: `DISPATCH-${rec.id}`,
      performedBy: "Logistics Optimization Automation",
      remarks: `Automated replenishment dispatch to ${rec.destinationName}`
    });
    return rec;
  }
  // IoT Sensors
  getSensorData() {
    this.state.sensorData = this.state.sensorData.map((sensor) => {
      const jittered = applyLiveTelemetryJitter(sensor);
      const { status } = evaluateSensorAnomalies(jittered);
      return {
        ...jittered,
        status: sensor.hasAnomaly ? sensor.status : status
      };
    });
    return this.state.sensorData;
  }
  triggerSensorAnomaly(sensorId) {
    const result = this.triggerSensorScenario(sensorId, "temperature");
    return result?.sensor;
  }
  triggerSensorScenario(sensorId, scenario) {
    const node = this.state.sensorData.find((s) => s.sensorId === sensorId || s.id === sensorId);
    if (!node) return void 0;
    node.hasAnomaly = true;
    let alertTitle = "";
    let alertDesc = "";
    let alertRec = "";
    let alertSev = "CRITICAL";
    switch (scenario) {
      case "temperature": {
        node.anomalyType = "TEMPERATURE";
        node.anomalySeverity = "CRITICAL";
        node.temperatureC = node.temperatureC < 0 ? node.temperatureC - 16 : node.temperatureC + 24.5;
        node.status = "CRITICAL";
        node.deviceHealth = "CRITICAL";
        node.anomalyDescription = `SIMULATED ANOMALY: Severe thermal out-of-bounds reading (${node.temperatureC}\xB0C) for ${node.targetCategory}.`;
        alertTitle = `IoT Alert: Thermal Breach at ${node.unitName}`;
        alertDesc = `Sensor ${node.sensorId} logged abnormal temperature: ${node.temperatureC}\xB0C.`;
        alertRec = "Inspect cooling/heating generators and thermal containment seals immediately.";
        break;
      }
      case "humidity": {
        node.anomalyType = "HUMIDITY";
        node.anomalySeverity = "WARNING";
        node.humidityPercent = 89;
        node.status = "WARNING";
        node.deviceHealth = "DEGRADED";
        node.anomalyDescription = `SIMULATED ANOMALY: Severe moisture ingress detected (89% humidity). Corrosion/degradation threat.`;
        alertTitle = `IoT Alert: High Humidity Breach at ${node.unitName}`;
        alertDesc = `Sensor ${node.sensorId} reports 89% humidity, exceeding safe tolerance for ${node.targetCategory}.`;
        alertRec = "Activate dehumidifiers and inspect protective weather seals.";
        alertSev = "WARNING";
        break;
      }
      case "low_storage": {
        node.anomalyType = "LOW_STORAGE";
        node.anomalySeverity = "CRITICAL";
        node.storageLevelPercent = 11;
        node.quantity = Math.max(10, Math.round(node.quantity * 0.15));
        node.status = "CRITICAL";
        node.deviceHealth = "DEGRADED";
        node.anomalyDescription = `SIMULATED ANOMALY: Critical stock depletion detected by level telemetry (11% remaining).`;
        alertTitle = `IoT Critical Alert: Urgent Stock Depletion in ${node.unitName}`;
        alertDesc = `Storage level dropped to 11% (${node.quantity} units remaining). Threshold breach: minimum safe buffer is 25%.`;
        alertRec = "Emergency convoy or aerial UAV supply dispatch recommended immediately.";
        const matchingItem = this.state.inventory.find(
          (i) => i.locationId === node.locationId && i.category === node.targetCategory
        );
        if (matchingItem) {
          matchingItem.currentStock = Math.round(matchingItem.minStock * 0.35);
          const safetyStock = calculateSafetyStock(matchingItem.dailyConsumption, matchingItem.leadTimeDays, matchingItem.category);
          matchingItem.stockoutRiskScore = 96;
          matchingItem.stockoutRiskCategory = "CRITICAL";
          matchingItem.status = "CRITICAL";
          matchingItem.recommendedReorder = Math.max(100, Math.round(matchingItem.maxStock * 0.85 - matchingItem.currentStock));
        }
        break;
      }
      case "low_battery": {
        node.anomalyType = "LOW_BATTERY";
        node.anomalySeverity = "CRITICAL";
        node.batteryLevel = 8;
        node.status = "CRITICAL";
        node.deviceHealth = "CRITICAL";
        node.anomalyDescription = `SIMULATED ANOMALY: Critical sensor battery depletion (8%). Shutdown imminent.`;
        alertTitle = `IoT Device Alert: Battery Exhaustion at ${node.unitName}`;
        alertDesc = `Sensor node ${node.sensorId} battery at 8%. Telemetry reporting will cease soon.`;
        alertRec = "Deploy communications/maintenance personnel for cell battery replacement or solar connection check.";
        break;
      }
      case "offline": {
        node.anomalyType = "OFFLINE";
        node.anomalySeverity = "CRITICAL";
        node.status = "OFFLINE";
        node.deviceHealth = "CRITICAL";
        node.lastPing = new Date(Date.now() - 35 * 6e4).toISOString();
        node.anomalyDescription = `SIMULATED ANOMALY: Gateway communication drop. Node offline for >30 minutes.`;
        alertTitle = `IoT Telemetry Lost: ${node.unitName} OFFLINE`;
        alertDesc = `No heartbeat signal received from ${node.sensorId} for over 30 minutes. Link down.`;
        alertRec = "Verify RF transceiver line of sight and repeater power status.";
        break;
      }
    }
    node.lastPing = (/* @__PURE__ */ new Date()).toISOString();
    const createdAlert = this.createAlert({
      type: "INVENTORY ANOMALY",
      severity: alertSev,
      locationId: node.locationId,
      locationName: node.locationName,
      sensorId: node.sensorId,
      sensorName: node.unitName,
      title: alertTitle,
      description: alertDesc,
      recommendedAction: alertRec
    });
    const anomalousAtLocation = this.state.sensorData.filter((s) => s.locationId === node.locationId && s.hasAnomaly);
    if (anomalousAtLocation.length >= 2) {
      const existingClusterAlert = this.state.alerts.find(
        (a) => a.locationId === node.locationId && a.title.includes("Multiple Sensor Anomalies") && a.status !== "RESOLVED"
      );
      if (!existingClusterAlert) {
        this.createAlert({
          type: "INVENTORY ANOMALY",
          severity: "CRITICAL",
          locationId: node.locationId,
          locationName: node.locationName,
          sensorId: `CLUSTER-${node.locationId}`,
          sensorName: `Multiple Sensors (${anomalousAtLocation.map((s) => s.sensorId).join(", ")})`,
          title: `Compound Anomaly: Multiple Sensor Failures at ${node.locationName}`,
          description: `${anomalousAtLocation.length} active sensor alarms detected concurrently at ${node.locationName}. High operational risk across storage facilities.`,
          recommendedAction: "Dispatch on-site inspection team and prepare urgent transfer contingency."
        });
      }
    }
    return { sensor: node, alert: createdAlert };
  }
  resetSensorSimulation() {
    const freshDb = generateInitialDatabase();
    this.state.sensorData = freshDb.sensorData;
    this.state.alerts = this.state.alerts.map((a) => {
      if (a.type === "INVENTORY ANOMALY") {
        return { ...a, status: "RESOLVED" };
      }
      return a;
    });
    return this.state.sensorData;
  }
  // Safe Demo Scenario Simulation Engine (Prompt 4)
  simulateScenario(scenario) {
    let affectedCount = 0;
    let description = "";
    switch (scenario) {
      case "demand_surge": {
        this.state.inventory.forEach((item) => {
          if (item.locationId.startsWith("LOC-FWD") || item.locationId.startsWith("LOC-TACTICAL")) {
            item.dailyConsumption = Math.round(item.dailyConsumption * 1.35);
            item.predictedDemand7d = Math.round(item.predictedDemand7d * 1.35);
            item.predictedDemand14d = Math.round(item.predictedDemand14d * 1.35);
            item.stockoutRiskScore = Math.min(100, Math.round(item.stockoutRiskScore * 1.35));
            if (item.stockoutRiskScore >= 75) item.status = "CRITICAL";
            else if (item.stockoutRiskScore >= 50) item.status = "LOW";
            affectedCount++;
          }
        });
        description = "Simulated +35% operational demand surge across all 7 forward nodes and tactical supply points";
        this.createAlert({
          type: "HIGH DEMAND",
          severity: "HIGH",
          locationId: "LOC-FWD-ALPHA",
          locationName: "Forward Node Alpha (High Altitude Pass)",
          title: "Simulated Operational Demand Surge (+35%)",
          description: "Intense cold weather tactical tempo has elevated daily burn rates on POL fuel, ammunition, and rations by +35%.",
          recommendedAction: "Increase transport convoy dispatch frequency and review safety stock buffers."
        });
        break;
      }
      case "inventory_reduction": {
        this.state.inventory.forEach((item) => {
          if (item.locationId === "LOC-FWD-ALPHA" || item.locationId === "LOC-TACTICAL-FOXTROT" || item.locationId === "LOC-FWD-DELTA") {
            item.currentStock = Math.max(5, Math.round(item.currentStock * 0.55));
            item.stockoutRiskScore = 95;
            item.stockoutRiskCategory = "CRITICAL";
            item.status = "CRITICAL";
            affectedCount++;
          }
        });
        description = "Simulated -45% forward inventory depletion at Forward Alpha, Foxtrot, and Delta";
        this.createAlert({
          type: "STOCKOUT RISK",
          severity: "CRITICAL",
          locationId: "LOC-FWD-ALPHA",
          locationName: "Forward Node Alpha (High Altitude Pass)",
          title: "Emergency Stock Exhaustion Simulated",
          description: "Forward reserve levels depleted below 24-hour survival threshold. Urgent replenishment required.",
          recommendedAction: "Authorize immediate emergency airlift and priority transfer order."
        });
        break;
      }
      case "weather_deterioration": {
        this.state.locations.forEach((loc) => {
          if (loc.id === "LOC-FWD-ALPHA" || loc.id === "LOC-TACTICAL-FOXTROT") {
            loc.weatherCondition = "Severe Mountain Blizzard & Gale";
            loc.temperatureC = -24;
            loc.status = "WEATHER_ALERT";
            loc.riskLevel = "CRITICAL";
            affectedCount++;
          }
        });
        this.state.routes.forEach((route) => {
          if (route.sourceId === "LOC-FWD-ALPHA" || route.destinationId === "LOC-FWD-ALPHA" || route.destinationId === "LOC-TACTICAL-FOXTROT") {
            route.status = "PASS_BLOCKED";
            route.currentTravelHours = Number((route.standardTravelHours * 2.5).toFixed(1));
            route.riskLevel = "HIGH";
          }
        });
        description = "Simulated severe -24\xB0C blizzard causing Rohtang mountain pass closure";
        this.createAlert({
          type: "TRANSPORT DELAY",
          severity: "CRITICAL",
          locationId: "LOC-FWD-ALPHA",
          locationName: "Forward Node Alpha (High Altitude Pass)",
          title: "Extreme Blizzard Closes Mountain Pass Route",
          description: "Snow accumulation exceeding 1.2m and -24\xB0C gale winds. High altitude pass corridor closed to wheeled convoys.",
          recommendedAction: "Switch to Extreme Cold Snowcat or autonomous cargo UAV air corridor."
        });
        break;
      }
      case "sensor_anomaly": {
        this.triggerSensorScenario("IOT-01", "temperature");
        this.triggerSensorScenario("IOT-02", "low_storage");
        affectedCount = 2;
        description = "Triggered compound sensor alarms: thermal breach at Depot Alpha cryo vault and critical low fuel at Forward Alpha";
        break;
      }
    }
    return { scenario, description, affectedCount };
  }
  // Alerts
  getAlerts() {
    return this.state.alerts;
  }
  createAlert(alert) {
    const newAlert = {
      ...alert,
      id: `ALT-2026-${String(this.state.alerts.length + 1).padStart(3, "0")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "NEW"
    };
    this.state.alerts.unshift(newAlert);
    return newAlert;
  }
  acknowledgeAlert(id, acknowledgedBy) {
    const alert = this.state.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = "ACKNOWLEDGED";
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    return alert;
  }
  resolveAlert(id) {
    const alert = this.state.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = "RESOLVED";
    }
    return alert;
  }
  // Transactions & Audits
  addInventoryTransaction(tx) {
    const newTx = {
      ...tx,
      id: `TXN-LOG-${String(this.state.inventoryTransactions.length + 1).padStart(4, "0")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.state.inventoryTransactions.unshift(newTx);
    return newTx;
  }
  getTransactions() {
    return this.state.inventoryTransactions;
  }
  addAuditLog(log) {
    const newLog = {
      ...log,
      id: `AUD-${String(this.state.auditLogs.length + 1).padStart(3, "0")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.state.auditLogs.unshift(newLog);
    return newLog;
  }
  getAuditLogs() {
    return this.state.auditLogs;
  }
};
var db = new DatabaseService();

// src/server/gemini.ts
import { GoogleGenAI } from "@google/genai";
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  } catch (err) {
    console.warn("Could not initialize GoogleGenAI with provided key, using tactical fallback:", err);
  }
}
async function askLogiAi(question, userRole = "officer") {
  const inventory = db.getInventory();
  const locations = db.getLocations();
  const alerts = db.getAlerts();
  const vehicles = db.getVehicles();
  const recommendations = db.getRecommendations();
  const criticalItems = inventory.filter((i) => i.status === "CRITICAL" || i.stockoutRiskScore >= 70);
  const lowItems = inventory.filter((i) => i.status === "LOW");
  const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL" && a.status !== "RESOLVED");
  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  const inTransitVehicles = vehicles.filter((v) => v.status === "IN_TRANSIT");
  const sensors = db.getSensorData();
  const anomalousSensors = sensors.filter((s) => s.hasAnomaly || s.status === "CRITICAL" || s.status === "WARNING");
  const offlineSensors = sensors.filter((s) => s.status === "OFFLINE");
  const contextData = {
    totalItems: inventory.length,
    criticalCount: criticalItems.length,
    criticalList: criticalItems.map((c) => `${c.name} at ${c.locationName} (Stock: ${c.currentStock} ${c.unit}, Min: ${c.minStock}, Risk: ${c.stockoutRiskScore}%)`),
    lowCount: lowItems.length,
    lowList: lowItems.slice(0, 5).map((l) => `${l.name} at ${l.locationName} (${l.currentStock}/${l.minStock})`),
    locationsCount: locations.length,
    criticalLocations: locations.filter((l) => l.riskLevel === "CRITICAL").map((l) => `${l.name} (Weather: ${l.weatherCondition}, Temp: ${l.temperatureC}\xB0C)`),
    fleetSummary: {
      total: vehicles.length,
      available: availableVehicles.length,
      inTransit: inTransitVehicles.length
    },
    iotSummary: {
      totalSensors: sensors.length,
      normalCount: sensors.filter((s) => s.status === "NORMAL" && !s.hasAnomaly).length,
      warningCount: sensors.filter((s) => s.status === "WARNING").length,
      criticalCount: sensors.filter((s) => s.status === "CRITICAL").length,
      offlineCount: offlineSensors.length,
      activeAnomalies: anomalousSensors.map((s) => `${s.sensorId} (${s.unitName} at ${s.locationName}): ${s.anomalyDescription || `${s.temperatureC}\xB0C, ${s.humidityPercent}% humidity, ${s.storageLevelPercent}% storage`}`)
    },
    activeRecommendationsCount: recommendations.length,
    topRecommendation: recommendations[0]?.reasoning || "None currently pending",
    activeAlerts: criticalAlerts.map((a) => `[${a.type}] at ${a.locationName}: ${a.title}`)
  };
  if (ai) {
    try {
      const systemInstruction = `You are "LogiAI", the tactical AI logistics advisor for DefenceLogix AI (SIH MoD 26251 Decision Support System).
You assist military commanders and logistics officers with real-time stock levels, demand predictions, route risks, and inventory replenishment.
IMPORTANT:
- The data is strictly synthetic and simulated for demonstration purposes.
- Base your answers ONLY on the authorized operational snapshot provided.
- Maintain a disciplined, crisp, professional military logistics briefing tone (e.g. "SITREP:", "RECOMMENDED ACTION:").
- Provide clear numbers, locations, and tactical rationale.`;
      const prompt = `Current Operational Logistics Snapshot:
${JSON.stringify(contextData, null, 2)}

User Question: "${question}"
User Role: ${userRole}

Provide a concise, high-value tactical analysis and actionable recommendation.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3
        }
      });
      if (response && response.text) {
        return {
          answer: response.text.trim(),
          source: "gemini",
          suggestedActions: [
            "Review Forward Node Alpha winter diesel reserves",
            "Authorize emergency UAV aerial replenishment to Foxtrot",
            "Check fleet readiness at Intermodal Hub Kilo"
          ]
        };
      }
    } catch (err) {
      console.warn("Gemini generateContent error, falling back to tactical rules engine:", err);
    }
  }
  const q = question.toLowerCase();
  if (q.includes("high demand") || q.includes("demand") || q.includes("forecast")) {
    const highestDemand = [...inventory].sort((a, b) => b.predictedDemand7d - a.predictedDemand7d).slice(0, 4);
    return {
      source: "rules_engine",
      answer: `**[SITREP: HIGH DEMAND FORECAST]**

Based on predictive time-series models across all synthetic sectors, the items experiencing the highest demand tempo over the next 7 days are:

` + highestDemand.map((h) => `\u2022 **${h.name}** at *${h.locationName}*: Projected 7-Day Demand of **${h.predictedDemand7d} ${h.unit}** (Daily Consumption: ${h.dailyConsumption}/day, Current Stock: ${h.currentStock})`).join("\n") + `

*Key Factor:* Severe winter conditions (-14\xB0C) and heightened mountain exercises are amplifying fuel, ration, and cold weather gear burn rates by +35% to +40%.`,
      suggestedActions: [
        "Run 30-Day Gradient Boosting forecast on POL fuel supplies",
        "Inspect pre-positioned reserves at Regional Base North",
        "Review supply dispatch schedule"
      ]
    };
  }
  if (q.includes("low") || q.includes("shortage") || q.includes("critical") || q.includes("stock")) {
    return {
      source: "rules_engine",
      answer: `**[SITREP: PROJECTED INVENTORY SHORTAGES & CRITICAL STOCKS]**

Current audit reveals **${contextData.criticalCount} critical items** and **${contextData.lowCount} low-stock items** requiring immediate command attention:

` + contextData.criticalList.map((item) => `\u26A0\uFE0F **CRITICAL:** ${item}`).join("\n") + `

**Most Urgent Node:** Forward Node Alpha (High Altitude Pass) and Tactical Supply Point Foxtrot. Cold weather diesel reserves are down to 58 kL against a minimum threshold of 180 kL.

**Recommended Action:** Trigger automatic transfer of 120 kL DHA-50 from Regional Logistic Base North via Heavy All-Terrain 6x6 convoy or request Chinook heavy-lift airlift before snowfall blocks Rohtang pass corridor.`,
      suggestedActions: [
        "Approve Transfer Plan REC-OPT-1001",
        "Check route condition on PASS-ROHTANG-HIGHWAY",
        "Alert EME convoy maintenance crew"
      ]
    };
  }
  if (q.includes("node") || q.includes("location") || q.includes("gis") || q.includes("where")) {
    return {
      source: "rules_engine",
      answer: `**[SITREP: FORWARD SUPPLY NODES OVERVIEW]**

The synthetic logistics network comprises 10 active nodes across high altitude, mountain valleys, and desert sectors:

\u2022 **High Risk Nodes:**
  - **Forward Node Alpha (4,350m):** Blizzard conditions (-14\xB0C). Road access degraded. Critical fuel and cold gear deficits.
  - **Tactical Supply Point Foxtrot (4,800m):** Isolated glacial pass (-21\xB0C). Ground route blocked; aerial drone/rotary resupply required.
  - **Forward Node Delta:** Desert Sector (38\xB0C). Sandstorm warning; spare parts and oil filters required.

\u2022 **Hub Support Capacity:** Central Strategic Depot Alpha (8,450 / 12,000 Tons) and Regional Base North (4,320 / 6,500 Tons) maintain adequate surplus to replenish all forward detachments.`,
      suggestedActions: [
        "Open GIS Map for Sector Visual Overlay",
        "Filter for High Altitude Pass weather alerts",
        "Verify UAV Flight Corridor weather clearing"
      ]
    };
  }
  if (q.includes("iot") || q.includes("sensor") || q.includes("anomaly") || q.includes("battery") || q.includes("humidity") || q.includes("pressure")) {
    const iot = contextData.iotSummary;
    return {
      source: "rules_engine",
      answer: `**[SITREP: IoT EDGE SENSOR TELEMETRY & ANOMALY ASSESSMENT]**

Current real-time status of 12 tactical storage sensor nodes:

\u2022 **Nominal / In Spec:** ${iot.normalCount} Nodes
\u2022 **Warning Threshold Drift:** ${iot.warningCount} Nodes
\u2022 **Critical Anomaly Alarms:** ${iot.criticalCount} Nodes
\u2022 **Offline Nodes (>15m timeout):** ${iot.offlineCount} Nodes

` + (iot.activeAnomalies.length > 0 ? `**Active Detected Anomalies:**
` + iot.activeAnomalies.map((a) => `\u26A0\uFE0F ${a}`).join("\n") + `

` : `\u2705 All active storage environments are reporting within configured thermal, humidity, and fill boundaries.

`) + `**Supply Chain Connection:** When storage level drops below 15% (e.g. at fuel bladders or trauma cabinets), the IoT engine automatically escalates the condition to a CRITICAL stockout risk and triggers urgent replenishment dispatch recommendations.`,
      suggestedActions: [
        "Open IoT Monitoring Section to inspect sensor nodes",
        "Simulate stock depletion scenario to test replenishment link",
        "Check Early Warning Alerts for active IoT alarms"
      ]
    };
  }
  if (q.includes("performance") || q.includes("summary") || q.includes("report") || q.includes("weekly")) {
    return {
      source: "rules_engine",
      answer: `**[OPERATIONAL LOGISTICS PERFORMANCE SUMMARY]**

\u2022 **Inventory Readiness:** 86.4% Operational Availability
\u2022 **Forecast Accuracy (MAPE):** 94.6% using Random Forest & Holt-Winters models
\u2022 **Active Transport Fleet:** ${contextData.fleetSummary.available} Available / ${contextData.fleetSummary.inTransit} In Transit (${contextData.fleetSummary.total} Total Vehicles)
\u2022 **Pending Supply Dispatches:** ${recommendations.length} AI-optimized transfers calculated
\u2022 **IoT Telemetry Health:** 10 of 12 sensor bunkers reporting normal nominal thresholds; 2 anomalies under remediation.

*Strategic Recommendation:* Expedite pre-winter replenishment stockpiling across northern forward nodes within the next 48-72 hours.`,
      suggestedActions: [
        "Generate Daily PDF Logistics Report",
        "Export Inventory CSV Ledger",
        "Review Vehicle Utilization Charts"
      ]
    };
  }
  return {
    source: "rules_engine",
    answer: `**[LOGIAI ASSISTANT - OPERATIONAL BRIEFING]**

I am monitoring the DefenceLogix AI network. Currently tracking:
\u2022 **${locations.length} Synthetic Logistic Locations** (2 Depots, 1 Hub, 7 Forward Nodes)
\u2022 **${inventory.length} Tracked Supply Items** (${contextData.criticalCount} critical, ${contextData.lowCount} low stock)
\u2022 **${vehicles.length} Vehicles** with ${availableVehicles.length} standing by for immediate sortie
\u2022 **${criticalAlerts.length} Unresolved Critical Early Warning Alerts**

You can ask me to analyze demand spikes, detail inventory shortages at specific nodes, review vehicle dispatch status, or generate consolidated readiness reports.`,
    suggestedActions: [
      "What items are predicted to have high demand?",
      "Which synthetic supply nodes have low inventory?",
      "Show projected inventory shortages",
      "Summarize logistics performance"
    ]
  };
}

// src/server/weather.ts
var WMO_CODE_MAP = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};
function interpretWmoCode(code) {
  return WMO_CODE_MAP[code] || "Variable weather";
}
function evaluateWeatherImpact(tempC, precipMm, windKmH, weatherCode) {
  const reasons = [];
  let severeScore = 0;
  if (tempC <= -20) {
    severeScore += 3;
    reasons.push(`Extreme arctic sub-zero (${tempC}\xB0C) causes cold-viscosity fuel thickening & severe frostbite risk`);
  } else if (tempC <= -10) {
    severeScore += 2;
    reasons.push(`Sub-zero cold (${tempC}\xB0C) mandates Winter Diesel (DHA-50) & wheel traction chain deployment`);
  } else if (tempC >= 42) {
    severeScore += 3;
    reasons.push(`High desert heat (${tempC}\xB0C) triggers thermal fuel tank expansion & engine overheating risk`);
  } else if (tempC >= 38) {
    severeScore += 1;
    reasons.push(`Elevated ambient temperature (${tempC}\xB0C) accelerates equipment thermal stress`);
  }
  if (precipMm >= 15) {
    severeScore += 3;
    reasons.push(`Heavy precipitation (${precipMm} mm) creates acute flash-flood / mudslide threat on unpaved roads`);
  } else if (precipMm >= 5) {
    severeScore += 2;
    reasons.push(`Moderate precipitation (${precipMm} mm) degrades convoy traction & increases transit hours`);
  } else if (precipMm > 0) {
    severeScore += 1;
    reasons.push(`Light precipitation (${precipMm} mm) present along transit corridor`);
  }
  if (windKmH >= 50) {
    severeScore += 3;
    reasons.push(`Gale-force winds (${windKmH} km/h) ground autonomous cargo UAV sorties & threaten high-profile trucks`);
  } else if (windKmH >= 32) {
    severeScore += 2;
    reasons.push(`Elevated wind speeds (${windKmH} km/h) restrict aerial logistics operations to heavy helicopters only`);
  }
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) {
    severeScore += 3;
    reasons.push("Thunderstorm & convective lightning hazard detected in sector");
  } else if (weatherCode === 75 || weatherCode === 86 || weatherCode === 67) {
    severeScore += 3;
    reasons.push("Heavy snowfall / freezing rain advisory in effect for mountain passes");
  } else if (weatherCode === 45 || weatherCode === 48) {
    severeScore += 2;
    reasons.push("Dense fog impairs convoy line-of-sight navigation to under 100 meters");
  }
  if (reasons.length === 0) {
    reasons.push("Favorable weather conditions: Clear corridor with nominal operational transit speeds");
  }
  let impact = "LOW";
  if (severeScore >= 4) {
    impact = "HIGH";
  } else if (severeScore >= 2) {
    impact = "MEDIUM";
  }
  return { impact, reasons };
}
var weatherCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 15 * 60 * 1e3;
function getSyntheticWeatherFallback(location) {
  let precip = 0;
  let wind = 15;
  let code = 0;
  if (location.weatherCondition.includes("Blizzard") || location.weatherCondition.includes("Snow")) {
    code = 75;
    precip = 8.5;
    wind = 42;
  } else if (location.weatherCondition.includes("Monsoon") || location.weatherCondition.includes("Rain")) {
    code = 63;
    precip = 12;
    wind = 28;
  } else if (location.weatherCondition.includes("Sandstorm")) {
    code = 3;
    precip = 0;
    wind = 48;
  } else if (location.weatherCondition.includes("Fog")) {
    code = 45;
    precip = 0.5;
    wind = 8;
  }
  const { impact, reasons } = evaluateWeatherImpact(location.temperatureC, precip, wind, code);
  return {
    locationId: location.id,
    locationName: location.name,
    coordinates: location.coordinates,
    temperatureC: location.temperatureC,
    windSpeedKmH: wind,
    windDirectionDeg: 210,
    precipitationMm: precip,
    humidityPercent: location.weatherCondition.includes("Rain") ? 85 : 45,
    weatherCode: code,
    weatherCondition: location.weatherCondition,
    weatherImpact: impact,
    impactReasoning: reasons,
    source: "SYNTHETIC_FALLBACK",
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function fetchWeatherForLocation(location) {
  const cacheKey = `${location.id}-${location.coordinates.lat.toFixed(2)}-${location.coordinates.lng.toFixed(2)}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.coordinates.lat}&longitude=${location.coordinates.lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }
    const json = await res.json();
    const current = json.current;
    if (!current) {
      throw new Error("Invalid Open-Meteo response structure");
    }
    const tempC = Math.round(current.temperature_2m);
    const windSpeed = Math.round(current.wind_speed_10m);
    const windDir = Math.round(current.wind_direction_10m || 0);
    const precip = Number((current.precipitation || 0).toFixed(1));
    const humidity = Math.round(current.relative_humidity_2m || 50);
    const code = current.weather_code || 0;
    const condition = interpretWmoCode(code);
    const { impact, reasons } = evaluateWeatherImpact(tempC, precip, windSpeed, code);
    const dailyForecast = [];
    if (json.daily && Array.isArray(json.daily.time)) {
      for (let i = 0; i < Math.min(5, json.daily.time.length); i++) {
        dailyForecast.push({
          date: json.daily.time[i],
          tempMax: Math.round(json.daily.temperature_2m_max[i]),
          tempMin: Math.round(json.daily.temperature_2m_min[i]),
          precipSum: Number((json.daily.precipitation_sum[i] || 0).toFixed(1)),
          weatherCode: json.daily.weather_code[i] || 0,
          condition: interpretWmoCode(json.daily.weather_code[i] || 0)
        });
      }
    }
    const weatherData = {
      locationId: location.id,
      locationName: location.name,
      coordinates: location.coordinates,
      temperatureC: tempC,
      windSpeedKmH: windSpeed,
      windDirectionDeg: windDir,
      precipitationMm: precip,
      humidityPercent: humidity,
      weatherCode: code,
      weatherCondition: condition,
      weatherImpact: impact,
      impactReasoning: reasons,
      source: "OPEN_METEO_API",
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      dailyForecast
    };
    weatherCache.set(cacheKey, {
      data: weatherData,
      expiresAt: now + CACHE_TTL_MS
    });
    return weatherData;
  } catch (err) {
    console.warn(`[WeatherService] Notice: Open-Meteo live API fallback for ${location.name}: ${err?.message || "offline"}. Using synthetic baseline.`);
    const fallback = getSyntheticWeatherFallback(location);
    weatherCache.set(cacheKey, {
      data: fallback,
      expiresAt: now + 12e4
    });
    return fallback;
  }
}
async function fetchWeatherForAllLocations(locations) {
  return Promise.all(locations.map((loc) => fetchWeatherForLocation(loc)));
}

// src/server/routes.ts
var apiRouter = Router();
apiRouter.get("/", (_req, res) => {
  res.json({
    status: "healthy",
    platform: "DefenceLogix AI",
    version: "1.0.0",
    description: "Predictive Logistics & Forward Supply Chain Decision Support System",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    platform: "DefenceLogix AI",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== "string" || secret.trim() === "") {
    return null;
  }
  return secret.trim();
}
function signToken(payload) {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("Server configuration error: JWT_SECRET environment variable is missing.");
  }
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1e3) + 24 * 3600 })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
function verifyToken(token) {
  try {
    const secret = getJwtSecret();
    if (!secret) {
      console.error("[DefenceLogix Auth] Token verification failed: JWT_SECRET is not configured in server environment.");
      return null;
    }
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return payload;
  } catch (err) {
    console.error("[DefenceLogix Auth] Token verification error:", err instanceof Error ? err.message : err);
    return null;
  }
}
function authMiddleware(req, res, next) {
  const secret = getJwtSecret();
  if (!secret) {
    console.error("[DefenceLogix Auth] Configuration Diagnostic: Cannot verify token because JWT_SECRET is not set in server environment.");
    res.status(500).json({
      error: "Server authentication configuration error: JWT_SECRET is missing. Please configure JWT_SECRET in Vercel project environment variables.",
      code: "MISSING_JWT_SECRET",
      platform: "DefenceLogix AI"
    });
    return;
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Authorization header missing or format is not Bearer <token>" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: "Invalid or expired authentication token. Please log in again." });
    return;
  }
  req.user = decoded;
  next();
}
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this operation. Requires one of: ${allowedRoles.join(", ")}`
      });
      return;
    }
    next();
  };
}
apiRouter.post("/auth/demo", (req, res) => {
  const { role = "logistics_officer" } = req.body || {};
  const demoRoleUsers = {
    admin: "admin@demologix.local",
    logistics_officer: "officer@demologix.local",
    inventory_manager: "inventory@demologix.local",
    transport_manager: "transport@demologix.local",
    analyst: "analyst@demologix.local",
    viewer: "viewer@demologix.local"
  };
  const targetEmail = demoRoleUsers[role] || "officer@demologix.local";
  const user = db.getUserByEmail(targetEmail) || db.getUserById("USR-002");
  if (!user) {
    res.status(404).json({ error: "Demo user not found" });
    return;
  }
  const secret = getJwtSecret();
  if (!secret) {
    console.error("[DefenceLogix Auth] Configuration Diagnostic: process.env.JWT_SECRET is missing or empty in the server runtime environment. Please configure JWT_SECRET in your Vercel project environment variables.");
    res.status(500).json({
      error: "Authentication configuration error: JWT_SECRET environment variable is missing on the server. Please set JWT_SECRET in your Vercel project environment variables.",
      code: "MISSING_JWT_SECRET",
      platform: "DefenceLogix AI"
    });
    return;
  }
  try {
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      serviceNumber: user.serviceNumber,
      clearanceLevel: user.clearanceLevel
    });
    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: "DEMO_LOGIN_ISSUED",
      targetEntity: "Authentication System",
      details: `Generated valid JWT session token for role ${user.role} (${user.name})`
    });
    res.json({
      token,
      user
    });
  } catch (err) {
    console.error("[DefenceLogix Auth] Demo token signing failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Server authentication configuration error: JWT_SECRET missing",
      code: "MISSING_JWT_SECRET",
      platform: "DefenceLogix AI"
    });
  }
});
apiRouter.get("/auth/demo", (req, res) => {
  const role = req.query.role || "logistics_officer";
  const demoRoleUsers = {
    admin: "admin@demologix.local",
    logistics_officer: "officer@demologix.local",
    inventory_manager: "inventory@demologix.local",
    transport_manager: "transport@demologix.local",
    analyst: "analyst@demologix.local",
    viewer: "viewer@demologix.local"
  };
  const targetEmail = demoRoleUsers[role] || "officer@demologix.local";
  const user = db.getUserByEmail(targetEmail) || db.getUserById("USR-002");
  if (!user) {
    res.status(404).json({ error: "Demo user not found" });
    return;
  }
  const secret = getJwtSecret();
  if (!secret) {
    console.error("[DefenceLogix Auth] Configuration Diagnostic: process.env.JWT_SECRET is missing or empty in the server runtime environment. Please configure JWT_SECRET in your Vercel project environment variables.");
    res.status(500).json({
      error: "Authentication configuration error: JWT_SECRET environment variable is missing on the server. Please set JWT_SECRET in your Vercel project environment variables.",
      code: "MISSING_JWT_SECRET",
      platform: "DefenceLogix AI"
    });
    return;
  }
  try {
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      serviceNumber: user.serviceNumber,
      clearanceLevel: user.clearanceLevel
    });
    res.json({
      token,
      user
    });
  } catch (err) {
    console.error("[DefenceLogix Auth] Demo token signing failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Server authentication configuration error: JWT_SECRET missing",
      code: "MISSING_JWT_SECRET",
      platform: "DefenceLogix AI"
    });
  }
});
apiRouter.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid military credentials or email" });
    return;
  }
  const secret = getJwtSecret();
  if (!secret) {
    console.error("[DefenceLogix Auth] Configuration Diagnostic: process.env.JWT_SECRET is missing or empty in the server runtime environment. Please configure JWT_SECRET in your Vercel project environment variables.");
    res.status(500).json({
      error: "Authentication configuration error: JWT_SECRET environment variable is missing on the server. Please set JWT_SECRET in your Vercel project environment variables.",
      code: "MISSING_JWT_SECRET",
      platform: "DefenceLogix AI"
    });
    return;
  }
  try {
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      serviceNumber: user.serviceNumber,
      clearanceLevel: user.clearanceLevel
    });
    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: "USER_LOGIN",
      targetEntity: "Authentication System",
      details: `User signed in with role ${user.role} and clearance ${user.clearanceLevel}`
    });
    res.json({
      token,
      user
    });
  } catch (err) {
    console.error("[DefenceLogix Auth] Login signing failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Server authentication configuration error: JWT_SECRET missing",
      code: "MISSING_JWT_SECRET",
      platform: "DefenceLogix AI"
    });
  }
});
apiRouter.post("/auth/register", (req, res) => {
  const { email, name, role = "viewer", serviceNumber, clearanceLevel, department } = req.body;
  if (!email || !name) {
    res.status(400).json({ error: "Email and name are required" });
    return;
  }
  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: "User with this email already exists" });
    return;
  }
  const secret = getJwtSecret();
  if (!secret) {
    console.error("[DefenceLogix Auth] Configuration Diagnostic: process.env.JWT_SECRET is missing or empty in the server runtime environment. Please configure JWT_SECRET in your Vercel project environment variables.");
    res.status(500).json({
      error: "Authentication configuration error: JWT_SECRET environment variable is missing on the server. Please set JWT_SECRET in your Vercel project environment variables.",
      code: "MISSING_JWT_SECRET",
      platform: "DefenceLogix AI"
    });
    return;
  }
  const newUser = db.createUser({
    email,
    name,
    role,
    serviceNumber: serviceNumber || `IC-${Math.floor(1e4 + Math.random() * 9e4)}X`,
    clearanceLevel: clearanceLevel || "LEVEL 2 - RESTRICTED (DEMO)",
    department: department || "General Logistics Directorate"
  });
  try {
    const token = signToken(newUser);
    res.status(201).json({
      token,
      user: newUser
    });
  } catch (err) {
    console.error("[DefenceLogix Auth] Register signing failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Server authentication configuration error: JWT_SECRET missing"
    });
  }
});
apiRouter.get("/auth/me", authMiddleware, (req, res) => {
  const user = db.getUserById(req.user?.id || "USR-002");
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});
apiRouter.get("/dashboard", (req, res) => {
  const inventory = db.getInventory();
  const vehicles = db.getVehicles();
  const alerts = db.getAlerts();
  const recommendations = db.getRecommendations();
  const totalInventoryItems = inventory.length;
  const criticalStockItems = inventory.filter((i) => i.status === "CRITICAL" || i.stockoutRiskScore >= 75).length;
  const lowStockItems = inventory.filter((i) => i.status === "LOW").length;
  const predictedDemandTotal = inventory.reduce((sum, item) => sum + item.predictedDemand7d, 0);
  const pendingSupplyRequests = recommendations.filter((r) => r.status === "RECOMMENDED").length;
  const activeDeliveries = vehicles.filter((v) => v.status === "IN_TRANSIT").length;
  const totalTransportCapacityTons = vehicles.reduce((sum, v) => sum + v.capacityTons, 0);
  const availableTransportCapacityTons = vehicles.filter((v) => v.status === "AVAILABLE").reduce((sum, v) => sum + v.capacityTons, 0);
  const lowStockAlertsCount = alerts.filter((a) => (a.type === "LOW STOCK" || a.type === "STOCKOUT RISK") && a.status !== "RESOLVED").length;
  const stockoutRiskAverage = Math.round(inventory.reduce((sum, i) => sum + i.stockoutRiskScore, 0) / Math.max(1, inventory.length));
  const metrics = {
    totalInventoryItems,
    criticalStockItems,
    lowStockItems,
    predictedDemandTotal,
    pendingSupplyRequests,
    activeDeliveries,
    availableTransportCapacityTons,
    totalTransportCapacityTons,
    lowStockAlertsCount,
    forecastAccuracyPercentage: 94.2,
    stockoutRiskAverage
  };
  res.json({ metrics });
});
apiRouter.get("/inventory", (req, res) => {
  const { category, locationId, status, search } = req.query;
  let items = db.getInventory();
  if (category) {
    items = items.filter((i) => i.category === category);
  }
  if (locationId) {
    items = items.filter((i) => i.locationId === locationId);
  }
  if (status) {
    items = items.filter((i) => i.status === status);
  }
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    items = items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.itemId.toLowerCase().includes(q) || i.locationName.toLowerCase().includes(q)
    );
  }
  res.json({
    total: items.length,
    items
  });
});
apiRouter.post("/inventory", authMiddleware, requireRoles(["admin", "inventory_manager"]), (req, res) => {
  const { name, category, locationId, currentStock, minStock, maxStock, dailyConsumption, leadTimeDays, unit } = req.body;
  if (!name || !category || !locationId || currentStock === void 0) {
    res.status(400).json({ error: "Missing required inventory fields" });
    return;
  }
  const location = db.getLocationById(locationId);
  if (!location) {
    res.status(400).json({ error: "Invalid locationId" });
    return;
  }
  const newItem = db.createInventoryItem({
    itemId: `ITM-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    name,
    category,
    locationId: location.id,
    locationName: location.name,
    currentStock: Number(currentStock),
    minStock: Number(minStock || 100),
    maxStock: Number(maxStock || 500),
    dailyConsumption: Number(dailyConsumption || 10),
    leadTimeDays: Number(leadTimeDays || 4),
    unit: unit || "Units",
    predictedDemand7d: Math.round(Number(dailyConsumption || 10) * 7),
    predictedDemand14d: Math.round(Number(dailyConsumption || 10) * 14),
    predictedDemand30d: Math.round(Number(dailyConsumption || 10) * 30),
    recommendedReorder: 0
  });
  db.addAuditLog({
    userId: req.user?.id || "USR-001",
    userName: req.user?.name || "Administrator",
    role: req.user?.role || "admin",
    action: "INVENTORY_ITEM_CREATED",
    targetEntity: newItem.itemId,
    details: `Created new item "${newItem.name}" at ${location.name} with initial stock ${newItem.currentStock} ${newItem.unit}`
  });
  res.status(201).json({ item: newItem });
});
apiRouter.put("/inventory/:id", authMiddleware, requireRoles(["admin", "inventory_manager", "logistics_officer"]), (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const existing = db.getInventoryItemById(id);
  if (!existing) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  const updated = db.updateInventoryItem(id, updates);
  if (updates.currentStock !== void 0 && updates.currentStock !== existing.currentStock) {
    const diff = Number(updates.currentStock) - existing.currentStock;
    db.addInventoryTransaction({
      itemId: existing.itemId,
      itemName: existing.name,
      locationId: existing.locationId,
      locationName: existing.locationName,
      type: diff > 0 ? "RECEIPT" : "DISPATCH",
      quantity: Math.abs(diff),
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      performedBy: req.user?.name || "Inventory Officer",
      remarks: `Manual stock level adjustment by ${req.user?.role || "Officer"}`
    });
  }
  db.addAuditLog({
    userId: req.user?.id || "USR-001",
    userName: req.user?.name || "Inventory Manager",
    role: req.user?.role || "inventory_manager",
    action: "INVENTORY_ITEM_UPDATED",
    targetEntity: existing.itemId,
    details: `Updated inventory item ${existing.name} (Stock: ${updated?.currentStock} ${existing.unit})`
  });
  res.json({ item: updated });
});
apiRouter.delete("/inventory/:id", authMiddleware, requireRoles(["admin"]), (req, res) => {
  const { id } = req.params;
  const existing = db.getInventoryItemById(id);
  if (!existing) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  db.deleteInventoryItem(id);
  db.addAuditLog({
    userId: req.user?.id || "USR-001",
    userName: req.user?.name || "Administrator",
    role: req.user?.role || "admin",
    action: "INVENTORY_ITEM_DELETED",
    targetEntity: existing.itemId,
    details: `Deleted inventory item ${existing.name} from ${existing.locationName}`
  });
  res.json({ success: true, message: "Item deleted" });
});
apiRouter.get("/forecast", (req, res) => {
  const { itemId, model = "Random Forest", horizon = "14" } = req.query;
  const inventory = db.getInventory();
  const targetItem = itemId ? db.getInventoryItemById(itemId) : inventory[0];
  if (!targetItem) {
    res.status(404).json({ error: "Item not found for forecasting" });
    return;
  }
  const history = db.getDemandHistory(targetItem.itemId, targetItem.locationId);
  const location = db.getLocationById(targetItem.locationId) || db.getLocations()[0];
  const forecast = runForecastingModel(targetItem, history, location, {
    modelType: model || "Random Forest",
    horizonDays: Number(horizon) === 7 ? 7 : Number(horizon) === 30 ? 30 : 14,
    operationalTempo: "Heightened Readiness",
    weatherFactor: location.weatherCondition
  });
  res.json({ forecast });
});
apiRouter.post("/forecast/generate", (req, res) => {
  const { itemId, locationId, modelType = "Random Forest", horizonDays = 14, operationalTempo = "Routine", weatherFactor = "Clear" } = req.body;
  const targetItem = db.getInventoryItemById(itemId);
  if (!targetItem) {
    res.status(404).json({ error: "Target inventory item not found" });
    return;
  }
  const location = db.getLocationById(locationId || targetItem.locationId) || db.getLocations()[0];
  const history = db.getDemandHistory(targetItem.itemId, targetItem.locationId);
  const forecast = runForecastingModel(targetItem, history, location, {
    modelType,
    horizonDays: horizonDays === 7 || horizonDays === 14 || horizonDays === 30 ? horizonDays : 14,
    operationalTempo,
    weatherFactor
  });
  res.json({ forecast });
});
apiRouter.get("/demand-history", (req, res) => {
  const { itemId, locationId } = req.query;
  const history = db.getDemandHistory(itemId, locationId);
  res.json({ history });
});
apiRouter.get("/locations", async (req, res) => {
  const locations = db.getLocations();
  const inventory = db.getInventory();
  const weatherList = await fetchWeatherForAllLocations(locations);
  const weatherMap = new Map(weatherList.map((w) => [w.locationId, w]));
  const enriched = locations.map((loc) => {
    const locItems = inventory.filter((i) => i.locationId === loc.id);
    const criticalCount = locItems.filter((i) => i.status === "CRITICAL" || i.stockoutRiskScore >= 75).length;
    const lowCount = locItems.filter((i) => i.status === "LOW").length;
    const avgRisk = Math.round(locItems.reduce((acc, curr) => acc + curr.stockoutRiskScore, 0) / Math.max(1, locItems.length));
    const weatherData = weatherMap.get(loc.id);
    return {
      ...loc,
      itemCount: locItems.length,
      criticalCount,
      lowCount,
      averageRiskScore: avgRisk,
      items: locItems.slice(0, 6),
      weatherData,
      temperatureC: weatherData ? weatherData.temperatureC : loc.temperatureC,
      weatherCondition: weatherData ? weatherData.weatherCondition : loc.weatherCondition
    };
  });
  res.json({ locations: enriched });
});
apiRouter.get("/locations/:id", async (req, res) => {
  const { id } = req.params;
  const loc = db.getLocationById(id);
  if (!loc) {
    res.status(404).json({ error: "Location not found" });
    return;
  }
  const items = db.getInventory().filter((i) => i.locationId === id);
  const weatherData = await fetchWeatherForLocation(loc);
  res.json({
    location: {
      ...loc,
      weatherData,
      temperatureC: weatherData.temperatureC,
      weatherCondition: weatherData.weatherCondition
    },
    items
  });
});
apiRouter.get("/weather", async (req, res) => {
  const locations = db.getLocations();
  const weatherList = await fetchWeatherForAllLocations(locations);
  res.json({
    weather: weatherList,
    meta: {
      apiSource: "REAL PUBLIC DATA: Open-Meteo Non-Sensitive Weather API",
      mapSource: "REAL PUBLIC DATA: OpenStreetMap / CartoDB Dark Matter",
      logisticsData: "SYNTHETIC DEMO LOGISTICS DATA: Unclassified Prototype Telemetry",
      cachedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
});
apiRouter.get("/weather/:locationId", async (req, res) => {
  const { locationId } = req.params;
  const loc = db.getLocationById(locationId);
  if (!loc) {
    res.status(404).json({ error: "Location not found" });
    return;
  }
  const weather = await fetchWeatherForLocation(loc);
  res.json({
    weather,
    meta: {
      apiSource: "REAL PUBLIC DATA: Open-Meteo Non-Sensitive Weather API",
      logisticsData: "SYNTHETIC DEMO LOGISTICS DATA"
    }
  });
});
apiRouter.get("/vehicles", (req, res) => {
  const vehicles = db.getVehicles();
  res.json({ vehicles });
});
apiRouter.put("/vehicles/:id", authMiddleware, requireRoles(["admin", "transport_manager", "logistics_officer"]), (req, res) => {
  const { id } = req.params;
  const { status, destinationLocationId } = req.body;
  const updated = db.updateVehicleStatus(id, status, destinationLocationId);
  if (!updated) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }
  db.addAuditLog({
    userId: req.user?.id || "USR-004",
    userName: req.user?.name || "Transport Manager",
    role: req.user?.role || "transport_manager",
    action: "VEHICLE_STATUS_UPDATED",
    targetEntity: updated.vehicleId,
    details: `Changed status to ${status}${destinationLocationId ? ` bound for ${updated.destinationLocationName}` : ""}`
  });
  res.json({ vehicle: updated });
});
apiRouter.get("/routes", (req, res) => {
  const routes = db.getRoutes();
  res.json({ routes });
});
apiRouter.get("/recommendations", (req, res) => {
  const recommendations = db.getRecommendations();
  res.json({ recommendations });
});
apiRouter.post("/recommendations/optimize", authMiddleware, (req, res) => {
  const items = db.getInventory();
  const locations = db.getLocations();
  const vehicles = db.getVehicles();
  const routes = db.getRoutes();
  const generated = optimizeLogisticsNetwork(items, locations, vehicles, routes);
  db.setRecommendations(generated);
  db.addAuditLog({
    userId: req.user?.id || "USR-002",
    userName: req.user?.name || "Logistics Officer",
    role: req.user?.role || "logistics_officer",
    action: "LOGISTICS_OPTIMIZATION_TRIGGERED",
    targetEntity: "Supply Chain Solver",
    details: `Generated ${generated.length} replenishment transfer recommendations across forward nodes`
  });
  res.json({
    count: generated.length,
    recommendations: generated
  });
});
apiRouter.post("/recommendations/:id/approve", authMiddleware, requireRoles(["admin", "logistics_officer"]), (req, res) => {
  const { id } = req.params;
  const approved = db.approveRecommendation(id);
  if (!approved) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }
  db.addAuditLog({
    userId: req.user?.id || "USR-002",
    userName: req.user?.name || "Col. Sengupta",
    role: req.user?.role || "logistics_officer",
    action: "TRANSFER_RECOMMENDATION_APPROVED",
    targetEntity: approved.id,
    details: `Approved transfer of ${approved.supplyQuantity} units of ${approved.itemName} from ${approved.sourceName} to ${approved.destinationName}`
  });
  res.json({ success: true, recommendation: approved });
});
apiRouter.get("/alerts", (req, res) => {
  const { severity, type, status } = req.query;
  let alerts = db.getAlerts();
  if (severity) alerts = alerts.filter((a) => a.severity === severity);
  if (type) alerts = alerts.filter((a) => a.type === type);
  if (status) alerts = alerts.filter((a) => a.status === status);
  res.json({ alerts });
});
apiRouter.post("/alerts", authMiddleware, (req, res) => {
  const { type, severity, locationId, title, description, recommendedAction } = req.body;
  if (!type || !severity || !locationId || !title) {
    res.status(400).json({ error: "Missing required alert fields" });
    return;
  }
  const location = db.getLocationById(locationId);
  const newAlert = db.createAlert({
    type,
    severity,
    locationId,
    locationName: location ? location.name : "Sector Command",
    title,
    description: description || "",
    recommendedAction: recommendedAction || "Review garrison operational posture"
  });
  res.status(201).json({ alert: newAlert });
});
apiRouter.put("/alerts/:id/acknowledge", authMiddleware, (req, res) => {
  const { id } = req.params;
  const officerName = req.user?.name || "Logistics Duty Officer";
  const ack = db.acknowledgeAlert(id, officerName);
  if (!ack) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json({ alert: ack });
});
apiRouter.put("/alerts/:id/resolve", authMiddleware, (req, res) => {
  const { id } = req.params;
  const resolved = db.resolveAlert(id);
  if (!resolved) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json({ alert: resolved });
});
apiRouter.get("/iot", (req, res) => {
  const sensors = db.getSensorData();
  res.json({ sensors });
});
apiRouter.post("/iot/reset", authMiddleware, (req, res) => {
  const resetSensors = db.resetSensorSimulation();
  db.addAuditLog({
    userId: req.user?.id || "USR-003",
    userName: req.user?.name || "Inventory Manager",
    role: req.user?.role || "inventory_manager",
    action: "IOT_SIMULATION_RESET",
    targetEntity: "IoT Telemetry Network",
    details: "Reset all 12 IoT sensor nodes and resolved simulated anomaly alarms"
  });
  res.json({ success: true, sensors: resetSensors });
});
apiRouter.post("/iot/:id/scenario", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { scenario = "temperature" } = req.body;
  const result = db.triggerSensorScenario(
    id,
    scenario
  );
  if (!result) {
    res.status(404).json({ error: "Sensor node not found" });
    return;
  }
  db.addAuditLog({
    userId: req.user?.id || "USR-003",
    userName: req.user?.name || "Inventory Manager",
    role: req.user?.role || "inventory_manager",
    action: "IOT_SCENARIO_SIMULATED",
    targetEntity: result.sensor.sensorId,
    details: `Simulated ${scenario} anomaly scenario at ${result.sensor.unitName}`
  });
  res.json({ sensor: result.sensor, alert: result.alert });
});
apiRouter.post("/iot/:id/anomaly", authMiddleware, (req, res) => {
  const { id } = req.params;
  const result = db.triggerSensorScenario(id, "temperature");
  if (!result) {
    res.status(404).json({ error: "Sensor node not found" });
    return;
  }
  db.addAuditLog({
    userId: req.user?.id || "USR-003",
    userName: req.user?.name || "Inventory Manager",
    role: req.user?.role || "inventory_manager",
    action: "IOT_ANOMALY_SIMULATED",
    targetEntity: result.sensor.sensorId,
    details: `Triggered synthetic anomaly for demonstration at ${result.sensor.unitName}`
  });
  res.json({ sensor: result.sensor, alert: result.alert });
});
apiRouter.get("/analytics", (req, res) => {
  const { range = "30d" } = req.query;
  const inventory = db.getInventory();
  const vehicles = db.getVehicles();
  const categoryStats = {};
  inventory.forEach((item) => {
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { totalStock: 0, totalDemand7d: 0, criticalCount: 0 };
    }
    categoryStats[item.category].totalStock += item.currentStock;
    categoryStats[item.category].totalDemand7d += item.predictedDemand7d;
    if (item.status === "CRITICAL") categoryStats[item.category].criticalCount++;
  });
  const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    ...stats,
    stockDemandRatio: Number((stats.totalStock / Math.max(1, stats.totalDemand7d)).toFixed(2))
  }));
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const inTransit = vehicles.filter((v) => v.status === "IN_TRANSIT").length;
  const maintenance = vehicles.filter((v) => v.status === "MAINTENANCE").length;
  const assigned = vehicles.filter((v) => v.status === "ASSIGNED").length;
  res.json({
    range,
    categoryBreakdown,
    fleetUtilization: {
      totalVehicles,
      availableVehicles,
      inTransit,
      maintenance,
      assigned,
      utilizationRate: Math.round((inTransit + assigned) / totalVehicles * 100)
    },
    forecastMetrics: {
      overallAccuracy: 94.6,
      averageMae: 3.8,
      averageRmse: 5.2,
      averageMape: 5.4
    }
  });
});
apiRouter.post("/reports/generate", authMiddleware, (req, res) => {
  const { type = "Daily Logistics Report", format = "json" } = req.body;
  const inventory = db.getInventory();
  const locations = db.getLocations();
  const vehicles = db.getVehicles();
  const alerts = db.getAlerts();
  const criticalItems = inventory.filter((i) => i.status === "CRITICAL");
  const activeAlerts = alerts.filter((a) => a.status !== "RESOLVED");
  const reportData = {
    title: `MoD DSSC DefenceLogix: ${type}`,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    preparedBy: req.user?.name || "Col. Amitav Sengupta",
    role: req.user?.role || "Logistics Officer",
    classification: "DEMONSTRATION ONLY - UNCLASSIFIED SYNTHETIC DATA",
    executiveSummary: `Consolidated logistics assessment across 10 forward and rear sectors. Overall operational readiness stands at 86.4%. Priority attention required for winter fuel reserves at Forward Node Alpha and emergency surgical trauma kits at Tactical Supply Point Foxtrot.`,
    statistics: {
      totalLocationsMonitored: locations.length,
      totalInventorySkus: inventory.length,
      criticalStockAlerts: criticalItems.length,
      fleetActiveSorties: vehicles.filter((v) => v.status === "IN_TRANSIT").length,
      totalTransportCapacityTons: vehicles.reduce((s, v) => s + v.capacityTons, 0),
      aiForecastConfidence: "High (94.2% historical fit)"
    },
    actionItems: [
      "Approve Tatra 6x6 fuel replenishment transfer to Forward Node Alpha",
      "Authorize autonomous cargo UAV flight to isolated Foxtrot pass",
      "Deploy EME workshop support team to Intermodal Hub Kilo"
    ],
    criticalItemsSample: criticalItems.map((c) => ({
      item: c.name,
      location: c.locationName,
      currentStock: `${c.currentStock} ${c.unit}`,
      minStock: `${c.minStock} ${c.unit}`,
      riskScore: `${c.stockoutRiskScore}%`
    }))
  };
  db.addAuditLog({
    userId: req.user?.id || "USR-002",
    userName: req.user?.name || "Col. Sengupta",
    role: req.user?.role || "logistics_officer",
    action: "REPORT_GENERATED",
    targetEntity: type,
    details: `Generated ${type} in format ${format}`
  });
  res.json({ report: reportData });
});
apiRouter.post("/chat", async (req, res) => {
  const { question, userRole = "logistics_officer" } = req.body;
  if (!question || typeof question !== "string") {
    res.status(400).json({ error: "Question string is required" });
    return;
  }
  try {
    const result = await askLogiAi(question, userRole);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to process AI query", details: err?.message });
  }
});
apiRouter.get("/users", authMiddleware, requireRoles(["admin"]), (req, res) => {
  res.json({ users: db.getUsers() });
});
apiRouter.put("/users/:id/role", authMiddleware, requireRoles(["admin"]), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const updated = db.updateUserRole(id, role);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  db.addAuditLog({
    userId: req.user?.id || "USR-001",
    userName: req.user?.name || "Administrator",
    role: "admin",
    action: "USER_ROLE_CHANGED",
    targetEntity: updated.email,
    details: `Updated role for ${updated.name} to ${role}`
  });
  res.json({ user: updated });
});
apiRouter.get("/audit-logs", authMiddleware, requireRoles(["admin", "logistics_officer", "analyst"]), (req, res) => {
  res.json({ auditLogs: db.getAuditLogs() });
});
apiRouter.post("/demo/simulate", authMiddleware, (req, res) => {
  const { scenario = "demand_surge" } = req.body;
  if (!["demand_surge", "inventory_reduction", "weather_deterioration", "sensor_anomaly"].includes(scenario)) {
    res.status(400).json({ error: "Invalid scenario type" });
    return;
  }
  const result = db.simulateScenario(scenario);
  db.addAuditLog({
    userId: req.user?.id || "USR-002",
    userName: req.user?.name || "Logistics Officer",
    role: req.user?.role || "logistics_officer",
    action: "DEMO_SCENARIO_SIMULATED",
    targetEntity: scenario,
    details: result.description
  });
  res.json({
    success: true,
    result,
    message: result.description
  });
});
apiRouter.post("/demo/reset", authMiddleware, (req, res) => {
  db.resetDemoData();
  db.addAuditLog({
    userId: req.user?.id || "USR-001",
    userName: req.user?.name || "Administrator",
    role: req.user?.role || "admin",
    action: "DEMO_DATA_RESET",
    targetEntity: "Complete Database",
    details: "Reset all 10 locations, 50+ inventory items, 1000+ demand history points, and vehicle telemetry to default seed state"
  });
  res.json({
    success: true,
    message: "Demo dataset reset successfully to initial state"
  });
});

// api/index.ts
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  dotenv.config();
}
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  const forwardedUri = req.headers["x-forwarded-uri"] || req.headers["x-original-uri"];
  if (forwardedUri && (req.url === "/" || req.url === "/api" || req.url === "" || req.url === "/api/")) {
    req.url = forwardedUri;
  }
  next();
});
var healthCheckHandler = (_req, res) => {
  res.status(200).json({
    status: "healthy",
    platform: "DefenceLogix AI",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
app.get("/api/health", healthCheckHandler);
app.get("/health", healthCheckHandler);
app.use("/api", apiRouter);
app.use("/", apiRouter);
app.use((err, _req, res, _next) => {
  console.error("[DefenceLogix Vercel API Error]:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    platform: "DefenceLogix AI"
  });
});
var index_default = app;
export {
  apiRouter,
  app,
  index_default as default
};
