import { IoTSensorNode, SensorAnomalyRecord, SensorStatusLevel, ItemCategory } from '../types';

/**
 * Centralized IoT Sensor Thresholds Configuration
 * All operational limits for temperature, humidity, storage buffer, and battery are configured here in one place.
 */
export interface CategoryThreshold {
  tempMinC: number;
  tempMaxC: number;
  tempCritMinC: number;
  tempCritMaxC: number;
  humidityWarnPct: number;
  humidityCritPct: number;
}

export const IOT_THRESHOLDS = {
  // Category-specific environmental envelopes
  categories: {
    'Medical & Trauma': {
      tempMinC: 2,
      tempMaxC: 8,
      tempCritMinC: -2,
      tempCritMaxC: 15,
      humidityWarnPct: 65,
      humidityCritPct: 80
    },
    'POL (Petroleum, Oil, Lubricants)': {
      tempMinC: -10,
      tempMaxC: 35,
      tempCritMinC: -20,
      tempCritMaxC: 45,
      humidityWarnPct: 75,
      humidityCritPct: 85
    },
    'Ammunition & Ordnance': {
      tempMinC: 0,
      tempMaxC: 32,
      tempCritMinC: -10,
      tempCritMaxC: 42,
      humidityWarnPct: 55,
      humidityCritPct: 70
    },
    'Rations & MRE': {
      tempMinC: 4,
      tempMaxC: 28,
      tempCritMinC: -5,
      tempCritMaxC: 38,
      humidityWarnPct: 68,
      humidityCritPct: 80
    },
    'Cold Weather & Mountaineering': {
      tempMinC: -30,
      tempMaxC: 35,
      tempCritMinC: -40,
      tempCritMaxC: 45,
      humidityWarnPct: 75,
      humidityCritPct: 90
    },
    'Spare Parts & Maintenance': {
      tempMinC: -15,
      tempMaxC: 40,
      tempCritMinC: -25,
      tempCritMaxC: 50,
      humidityWarnPct: 70,
      humidityCritPct: 85
    },
    'Tactical Communications': {
      tempMinC: -10,
      tempMaxC: 38,
      tempCritMinC: -20,
      tempCritMaxC: 48,
      humidityWarnPct: 65,
      humidityCritPct: 80
    }
  } as Record<string, CategoryThreshold>,

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
    warnMinPsi: 12.0,
    warnMaxPsi: 16.5,
    critMinPsi: 10.0,
    critMaxPsi: 18.0
  },
  timeout: {
    offlineMinutes: 15
  }
};

/**
 * Rule-Based Explainable IoT Anomaly Detection Engine
 * Inspects a sensor node against configured thresholds and returns its status and all detected anomalies.
 */
export function evaluateSensorAnomalies(sensor: IoTSensorNode): {
  status: SensorStatusLevel;
  anomalies: SensorAnomalyRecord[];
} {
  const anomalies: SensorAnomalyRecord[] = [];
  const thresholds = IOT_THRESHOLDS.categories[sensor.targetCategory] || {
    tempMinC: -15,
    tempMaxC: 38,
    tempCritMinC: -25,
    tempCritMaxC: 45,
    humidityWarnPct: 70,
    humidityCritPct: 85
  };

  const nowIso = new Date().toISOString();

  // 1. Check Offline Status (Last ping > 15 mins or device health OFFLINE)
  const pingAgeMinutes = (Date.now() - new Date(sensor.lastPing).getTime()) / 60000;
  if (pingAgeMinutes > IOT_THRESHOLDS.timeout.offlineMinutes || sensor.status === 'OFFLINE') {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-OFFLINE`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: 'Heartbeat',
      currentValue: `No signal for ${Math.round(pingAgeMinutes)} mins`,
      expectedThreshold: `Heartbeat <= ${IOT_THRESHOLDS.timeout.offlineMinutes} mins`,
      severity: 'CRITICAL',
      reason: 'Telemetry connection timeout: Sensor node stopped transmitting beacon packets',
      timestamp: nowIso
    });
    return { status: 'OFFLINE', anomalies };
  }

  // 2. Storage Level Anomaly
  if (sensor.storageLevelPercent <= IOT_THRESHOLDS.storage.criticalFillPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-STORAGE-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: 'Storage Level',
      currentValue: `${sensor.storageLevelPercent}% (${sensor.quantity} units)`,
      expectedThreshold: `Min Reserve >= ${IOT_THRESHOLDS.storage.criticalFillPct}%`,
      severity: 'CRITICAL',
      reason: 'Storage level is critically depleted below emergency operational threshold',
      timestamp: nowIso
    });
  } else if (sensor.storageLevelPercent <= IOT_THRESHOLDS.storage.warningFillPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-STORAGE-WARN`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: 'Storage Level',
      currentValue: `${sensor.storageLevelPercent}% (${sensor.quantity} units)`,
      expectedThreshold: `Min Reserve >= ${IOT_THRESHOLDS.storage.warningFillPct}%`,
      severity: 'WARNING',
      reason: 'Storage level dropped below routine safety buffer',
      timestamp: nowIso
    });
  }

  // 3. Temperature Anomaly
  if (sensor.temperatureC >= thresholds.tempCritMaxC) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-TEMP-HIGH-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: 'Temperature',
      currentValue: `${sensor.temperatureC}°C`,
      expectedThreshold: `< ${thresholds.tempCritMaxC}°C (Max ${thresholds.tempMaxC}°C)`,
      severity: 'CRITICAL',
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
      parameter: 'Temperature',
      currentValue: `${sensor.temperatureC}°C`,
      expectedThreshold: `> ${thresholds.tempCritMinC}°C (Min ${thresholds.tempMinC}°C)`,
      severity: 'CRITICAL',
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
      parameter: 'Temperature',
      currentValue: `${sensor.temperatureC}°C`,
      expectedThreshold: `${thresholds.tempMinC}°C to ${thresholds.tempMaxC}°C`,
      severity: 'WARNING',
      reason: `Temperature drifted outside recommended storage envelope (${thresholds.tempMinC}°C to ${thresholds.tempMaxC}°C)`,
      timestamp: nowIso
    });
  }

  // 4. Humidity Anomaly
  if (sensor.humidityPercent >= thresholds.humidityCritPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-HUM-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: 'Humidity',
      currentValue: `${sensor.humidityPercent}%`,
      expectedThreshold: `< ${thresholds.humidityCritPct}%`,
      severity: 'CRITICAL',
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
      parameter: 'Humidity',
      currentValue: `${sensor.humidityPercent}%`,
      expectedThreshold: `< ${thresholds.humidityWarnPct}%`,
      severity: 'WARNING',
      reason: `Humidity elevated above optimal threshold of ${thresholds.humidityWarnPct}%`,
      timestamp: nowIso
    });
  }

  // 5. Battery Anomaly
  if (sensor.batteryLevel <= IOT_THRESHOLDS.battery.criticalPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-BATT-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: 'Battery',
      currentValue: `${sensor.batteryLevel}%`,
      expectedThreshold: `> ${IOT_THRESHOLDS.battery.criticalPct}%`,
      severity: 'CRITICAL',
      reason: 'Sensor backup battery critically exhausted: Imminent node shutdown',
      timestamp: nowIso
    });
  } else if (sensor.batteryLevel <= IOT_THRESHOLDS.battery.warningPct) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-BATT-WARN`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: 'Battery',
      currentValue: `${sensor.batteryLevel}%`,
      expectedThreshold: `> ${IOT_THRESHOLDS.battery.warningPct}%`,
      severity: 'WARNING',
      reason: 'Sensor battery is low and requires solar recharging or cell replacement',
      timestamp: nowIso
    });
  }

  // 6. Pressure Anomaly (Fuel Bladders & Gas Containers)
  if (sensor.containerPressurePsi <= IOT_THRESHOLDS.pressure.critMinPsi || sensor.containerPressurePsi >= IOT_THRESHOLDS.pressure.critMaxPsi) {
    anomalies.push({
      id: `ANOM-${sensor.sensorId}-PRESS-CRIT`,
      sensorId: sensor.sensorId,
      unitName: sensor.unitName,
      locationId: sensor.locationId,
      locationName: sensor.locationName,
      parameter: 'Pressure',
      currentValue: `${sensor.containerPressurePsi} PSI`,
      expectedThreshold: `${IOT_THRESHOLDS.pressure.nominalPsi} PSI (±3.0 PSI)`,
      severity: 'CRITICAL',
      reason: sensor.containerPressurePsi <= IOT_THRESHOLDS.pressure.critMinPsi
        ? 'Severe pressure drop detected: Possible containment seam leak or puncture'
        : 'Dangerous containment over-pressure: Thermal expansion rupture threat',
      timestamp: nowIso
    });
  }

  // Determine overall sensor status level
  let status: SensorStatusLevel = 'NORMAL';
  const hasCritical = anomalies.some(a => a.severity === 'CRITICAL');
  const hasWarning = anomalies.some(a => a.severity === 'WARNING');

  if (hasCritical) {
    status = 'CRITICAL';
  } else if (hasWarning) {
    status = 'WARNING';
  }

  return { status, anomalies };
}

/**
 * Network-wide Anomaly Evaluator
 * Evaluates individual sensors and detects compound conditions such as multiple abnormal readings at the same location.
 */
export function evaluateNetworkAnomalies(sensors: IoTSensorNode[]): {
  individualAnomalies: SensorAnomalyRecord[];
  compoundLocationAnomalies: SensorAnomalyRecord[];
  allAnomalies: SensorAnomalyRecord[];
  sensorsByStatus: {
    normal: IoTSensorNode[];
    warning: IoTSensorNode[];
    critical: IoTSensorNode[];
    offline: IoTSensorNode[];
  };
} {
  const individualAnomalies: SensorAnomalyRecord[] = [];
  const normal: IoTSensorNode[] = [];
  const warning: IoTSensorNode[] = [];
  const critical: IoTSensorNode[] = [];
  const offline: IoTSensorNode[] = [];

  const locationAnomaliesMap = new Map<string, { locationName: string; sensors: IoTSensorNode[]; anomalies: SensorAnomalyRecord[] }>();

  sensors.forEach(sensor => {
    const { status, anomalies } = evaluateSensorAnomalies(sensor);
    individualAnomalies.push(...anomalies);

    if (sensor.status === 'OFFLINE' || status === 'OFFLINE') {
      offline.push(sensor);
    } else if (sensor.hasAnomaly && sensor.anomalySeverity === 'CRITICAL' || status === 'CRITICAL') {
      critical.push(sensor);
    } else if (sensor.hasAnomaly && sensor.anomalySeverity === 'WARNING' || status === 'WARNING') {
      warning.push(sensor);
    } else {
      normal.push(sensor);
    }

    if (anomalies.length > 0) {
      const locKey = sensor.locationId;
      if (!locationAnomaliesMap.has(locKey)) {
        locationAnomaliesMap.set(locKey, { locationName: sensor.locationName, sensors: [], anomalies: [] });
      }
      const entry = locationAnomaliesMap.get(locKey)!;
      entry.sensors.push(sensor);
      entry.anomalies.push(...anomalies);
    }
  });

  // Check for Multiple Abnormal Readings at the Same Location
  const compoundLocationAnomalies: SensorAnomalyRecord[] = [];
  locationAnomaliesMap.forEach((data, locId) => {
    if (data.sensors.length >= 2) {
      const nowIso = new Date().toISOString();
      const sensorList = data.sensors.map(s => s.sensorId).join(', ');
      compoundLocationAnomalies.push({
        id: `ANOM-CLUSTER-${locId}`,
        sensorId: `CLUSTER-${locId}`,
        unitName: `Multiple Nodes (${sensorList})`,
        locationId: locId,
        locationName: data.locationName,
        parameter: 'Compound',
        currentValue: `${data.sensors.length} abnormal sensors active`,
        expectedThreshold: 'Max 0 abnormal sensors per node cluster',
        severity: 'CRITICAL',
        reason: `Multiple concurrent sensor anomalies detected at ${data.locationName}. High operational risk across storage envelopes.`,
        timestamp: nowIso
      });
    }
  });

  return {
    individualAnomalies,
    compoundLocationAnomalies,
    allAnomalies: [...individualAnomalies, ...compoundLocationAnomalies],
    sensorsByStatus: { normal, warning, critical, offline }
  };
}

/**
 * Realistic Live Telemetry Jitter Generator
 * Simulates micro-fluctuations in IoT readings over time (ambient thermal drift, small humidity variation)
 */
export function applyLiveTelemetryJitter(sensor: IoTSensorNode): IoTSensorNode {
  // If sensor is offline or has an active simulated anomaly, keep its anomaly state intact
  if (sensor.status === 'OFFLINE' || sensor.hasAnomaly) {
    return sensor;
  }

  const tempJitter = (Math.random() - 0.5) * 0.4;
  const humJitter = Math.round((Math.random() - 0.5) * 2);
  const pressJitter = Number(((Math.random() - 0.5) * 0.1).toFixed(2));

  const updatedTemp = Number((sensor.temperatureC + tempJitter).toFixed(1));
  const updatedHum = Math.min(99, Math.max(10, sensor.humidityPercent + humJitter));
  const updatedPress = Number(Math.max(8.0, Math.min(22.0, sensor.containerPressurePsi + pressJitter)).toFixed(1));

  return {
    ...sensor,
    temperatureC: updatedTemp,
    humidityPercent: updatedHum,
    containerPressurePsi: updatedPress,
    lastPing: new Date().toISOString()
  };
}
