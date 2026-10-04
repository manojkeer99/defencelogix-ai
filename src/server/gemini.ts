import { GoogleGenAI } from '@google/genai';
import { db } from './db';

// Server-side Gemini initialization following gemini-api skill specifications
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI with provided key, using tactical fallback:', err);
  }
}

export async function askLogiAi(question: string, userRole: string = 'officer'): Promise<{ answer: string; source: 'gemini' | 'rules_engine'; suggestedActions?: string[] }> {
  // Extract contextual snapshot from the database
  const inventory = db.getInventory();
  const locations = db.getLocations();
  const alerts = db.getAlerts();
  const vehicles = db.getVehicles();
  const recommendations = db.getRecommendations();

  const criticalItems = inventory.filter(i => i.status === 'CRITICAL' || i.stockoutRiskScore >= 70);
  const lowItems = inventory.filter(i => i.status === 'LOW');
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED');
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const inTransitVehicles = vehicles.filter(v => v.status === 'IN_TRANSIT');
  const sensors = db.getSensorData();
  const anomalousSensors = sensors.filter(s => s.hasAnomaly || s.status === 'CRITICAL' || s.status === 'WARNING');
  const offlineSensors = sensors.filter(s => s.status === 'OFFLINE');

  const contextData = {
    totalItems: inventory.length,
    criticalCount: criticalItems.length,
    criticalList: criticalItems.map(c => `${c.name} at ${c.locationName} (Stock: ${c.currentStock} ${c.unit}, Min: ${c.minStock}, Risk: ${c.stockoutRiskScore}%)`),
    lowCount: lowItems.length,
    lowList: lowItems.slice(0, 5).map(l => `${l.name} at ${l.locationName} (${l.currentStock}/${l.minStock})`),
    locationsCount: locations.length,
    criticalLocations: locations.filter(l => l.riskLevel === 'CRITICAL').map(l => `${l.name} (Weather: ${l.weatherCondition}, Temp: ${l.temperatureC}°C)`),
    fleetSummary: {
      total: vehicles.length,
      available: availableVehicles.length,
      inTransit: inTransitVehicles.length
    },
    iotSummary: {
      totalSensors: sensors.length,
      normalCount: sensors.filter(s => s.status === 'NORMAL' && !s.hasAnomaly).length,
      warningCount: sensors.filter(s => s.status === 'WARNING').length,
      criticalCount: sensors.filter(s => s.status === 'CRITICAL').length,
      offlineCount: offlineSensors.length,
      activeAnomalies: anomalousSensors.map(s => `${s.sensorId} (${s.unitName} at ${s.locationName}): ${s.anomalyDescription || `${s.temperatureC}°C, ${s.humidityPercent}% humidity, ${s.storageLevelPercent}% storage`}`)
    },
    activeRecommendationsCount: recommendations.length,
    topRecommendation: recommendations[0]?.reasoning || 'None currently pending',
    activeAlerts: criticalAlerts.map(a => `[${a.type}] at ${a.locationName}: ${a.title}`)
  };

  // If Gemini API is available and key is valid, use Gemini 3.8 Flash
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
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });

      if (response && response.text) {
        return {
          answer: response.text.trim(),
          source: 'gemini',
          suggestedActions: [
            'Review Forward Node Alpha winter diesel reserves',
            'Authorize emergency UAV aerial replenishment to Foxtrot',
            'Check fleet readiness at Intermodal Hub Kilo'
          ]
        };
      }
    } catch (err) {
      console.warn('Gemini generateContent error, falling back to tactical rules engine:', err);
    }
  }

  // Tactical Rules & Pattern Matcher Fallback Engine (Immediate offline readiness)
  const q = question.toLowerCase();

  if (q.includes('high demand') || q.includes('demand') || q.includes('forecast')) {
    const highestDemand = [...inventory].sort((a, b) => b.predictedDemand7d - a.predictedDemand7d).slice(0, 4);
    return {
      source: 'rules_engine',
      answer: `**[SITREP: HIGH DEMAND FORECAST]**\n\nBased on predictive time-series models across all synthetic sectors, the items experiencing the highest demand tempo over the next 7 days are:\n\n` +
        highestDemand.map(h => `• **${h.name}** at *${h.locationName}*: Projected 7-Day Demand of **${h.predictedDemand7d} ${h.unit}** (Daily Consumption: ${h.dailyConsumption}/day, Current Stock: ${h.currentStock})`).join('\n') +
        `\n\n*Key Factor:* Severe winter conditions (-14°C) and heightened mountain exercises are amplifying fuel, ration, and cold weather gear burn rates by +35% to +40%.`,
      suggestedActions: [
        'Run 30-Day Gradient Boosting forecast on POL fuel supplies',
        'Inspect pre-positioned reserves at Regional Base North',
        'Review supply dispatch schedule'
      ]
    };
  }

  if (q.includes('low') || q.includes('shortage') || q.includes('critical') || q.includes('stock')) {
    return {
      source: 'rules_engine',
      answer: `**[SITREP: PROJECTED INVENTORY SHORTAGES & CRITICAL STOCKS]**\n\n` +
        `Current audit reveals **${contextData.criticalCount} critical items** and **${contextData.lowCount} low-stock items** requiring immediate command attention:\n\n` +
        contextData.criticalList.map(item => `⚠️ **CRITICAL:** ${item}`).join('\n') +
        `\n\n**Most Urgent Node:** Forward Node Alpha (High Altitude Pass) and Tactical Supply Point Foxtrot. Cold weather diesel reserves are down to 58 kL against a minimum threshold of 180 kL.\n\n` +
        `**Recommended Action:** Trigger automatic transfer of 120 kL DHA-50 from Regional Logistic Base North via Heavy All-Terrain 6x6 convoy or request Chinook heavy-lift airlift before snowfall blocks Rohtang pass corridor.`,
      suggestedActions: [
        'Approve Transfer Plan REC-OPT-1001',
        'Check route condition on PASS-ROHTANG-HIGHWAY',
        'Alert EME convoy maintenance crew'
      ]
    };
  }

  if (q.includes('node') || q.includes('location') || q.includes('gis') || q.includes('where')) {
    return {
      source: 'rules_engine',
      answer: `**[SITREP: FORWARD SUPPLY NODES OVERVIEW]**\n\nThe synthetic logistics network comprises 10 active nodes across high altitude, mountain valleys, and desert sectors:\n\n` +
        `• **High Risk Nodes:**\n` +
        `  - **Forward Node Alpha (4,350m):** Blizzard conditions (-14°C). Road access degraded. Critical fuel and cold gear deficits.\n` +
        `  - **Tactical Supply Point Foxtrot (4,800m):** Isolated glacial pass (-21°C). Ground route blocked; aerial drone/rotary resupply required.\n` +
        `  - **Forward Node Delta:** Desert Sector (38°C). Sandstorm warning; spare parts and oil filters required.\n\n` +
        `• **Hub Support Capacity:** Central Strategic Depot Alpha (8,450 / 12,000 Tons) and Regional Base North (4,320 / 6,500 Tons) maintain adequate surplus to replenish all forward detachments.`,
      suggestedActions: [
        'Open GIS Map for Sector Visual Overlay',
        'Filter for High Altitude Pass weather alerts',
        'Verify UAV Flight Corridor weather clearing'
      ]
    };
  }

  if (q.includes('iot') || q.includes('sensor') || q.includes('anomaly') || q.includes('battery') || q.includes('humidity') || q.includes('pressure')) {
    const iot = contextData.iotSummary;
    return {
      source: 'rules_engine',
      answer: `**[SITREP: IoT EDGE SENSOR TELEMETRY & ANOMALY ASSESSMENT]**\n\n` +
        `Current real-time status of 12 tactical storage sensor nodes:\n\n` +
        `• **Nominal / In Spec:** ${iot.normalCount} Nodes\n` +
        `• **Warning Threshold Drift:** ${iot.warningCount} Nodes\n` +
        `• **Critical Anomaly Alarms:** ${iot.criticalCount} Nodes\n` +
        `• **Offline Nodes (>15m timeout):** ${iot.offlineCount} Nodes\n\n` +
        (iot.activeAnomalies.length > 0 
          ? `**Active Detected Anomalies:**\n` + iot.activeAnomalies.map(a => `⚠️ ${a}`).join('\n') + `\n\n`
          : `✅ All active storage environments are reporting within configured thermal, humidity, and fill boundaries.\n\n`) +
        `**Supply Chain Connection:** When storage level drops below 15% (e.g. at fuel bladders or trauma cabinets), the IoT engine automatically escalates the condition to a CRITICAL stockout risk and triggers urgent replenishment dispatch recommendations.`,
      suggestedActions: [
        'Open IoT Monitoring Section to inspect sensor nodes',
        'Simulate stock depletion scenario to test replenishment link',
        'Check Early Warning Alerts for active IoT alarms'
      ]
    };
  }

  if (q.includes('performance') || q.includes('summary') || q.includes('report') || q.includes('weekly')) {
    return {
      source: 'rules_engine',
      answer: `**[OPERATIONAL LOGISTICS PERFORMANCE SUMMARY]**\n\n` +
        `• **Inventory Readiness:** 86.4% Operational Availability\n` +
        `• **Forecast Accuracy (MAPE):** 94.6% using Random Forest & Holt-Winters models\n` +
        `• **Active Transport Fleet:** ${contextData.fleetSummary.available} Available / ${contextData.fleetSummary.inTransit} In Transit (${contextData.fleetSummary.total} Total Vehicles)\n` +
        `• **Pending Supply Dispatches:** ${recommendations.length} AI-optimized transfers calculated\n` +
        `• **IoT Telemetry Health:** 10 of 12 sensor bunkers reporting normal nominal thresholds; 2 anomalies under remediation.\n\n` +
        `*Strategic Recommendation:* Expedite pre-winter replenishment stockpiling across northern forward nodes within the next 48-72 hours.`,
      suggestedActions: [
        'Generate Daily PDF Logistics Report',
        'Export Inventory CSV Ledger',
        'Review Vehicle Utilization Charts'
      ]
    };
  }

  // Default intelligent tactical response
  return {
    source: 'rules_engine',
    answer: `**[LOGIAI ASSISTANT - OPERATIONAL BRIEFING]**\n\nI am monitoring the DefenceLogix AI network. Currently tracking:\n` +
      `• **${locations.length} Synthetic Logistic Locations** (2 Depots, 1 Hub, 7 Forward Nodes)\n` +
      `• **${inventory.length} Tracked Supply Items** (${contextData.criticalCount} critical, ${contextData.lowCount} low stock)\n` +
      `• **${vehicles.length} Vehicles** with ${availableVehicles.length} standing by for immediate sortie\n` +
      `• **${criticalAlerts.length} Unresolved Critical Early Warning Alerts**\n\n` +
      `You can ask me to analyze demand spikes, detail inventory shortages at specific nodes, review vehicle dispatch status, or generate consolidated readiness reports.`,
    suggestedActions: [
      'What items are predicted to have high demand?',
      'Which synthetic supply nodes have low inventory?',
      'Show projected inventory shortages',
      'Summarize logistics performance'
    ]
  };
}
