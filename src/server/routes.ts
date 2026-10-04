import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db.js';
import { runForecastingModel, optimizeLogisticsNetwork, MLModelOptions } from './ml.js';
import { askLogiAi } from './gemini.js';
import { fetchWeatherForLocation, fetchWeatherForAllLocations } from './weather.js';
import { UserRole, ItemCategory, DashboardMetrics } from '../types/index.js';

export const apiRouter = Router();

// Root API and Health check endpoints (for deployment status verification)
apiRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'DefenceLogix AI',
    version: '1.0.0',
    description: 'Predictive Logistics & Forward Supply Chain Decision Support System',
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'DefenceLogix AI',
    timestamp: new Date().toISOString()
  });
});

// Simple, robust JWT token generator using HMAC-SHA256 (reads process.env.JWT_SECRET at runtime)
export function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    return null;
  }
  return secret.trim();
}

export function signToken(payload: object): string {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('Server configuration error: JWT_SECRET environment variable is missing.');
  }
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + (24 * 3600) })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const secret = getJwtSecret();
    if (!secret) {
      console.error('[DefenceLogix Auth] Token verification failed: JWT_SECRET is not configured in server environment.');
      return null;
    }
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (err) {
    console.error('[DefenceLogix Auth] Token verification error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// Authentication middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    serviceNumber?: string;
    clearanceLevel?: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const secret = getJwtSecret();
  if (!secret) {
    console.error('[DefenceLogix Auth] Configuration Diagnostic: Cannot verify token because JWT_SECRET is not set in server environment.');
    res.status(500).json({
      error: 'Server authentication configuration error: JWT_SECRET is missing. Please configure JWT_SECRET in Vercel project environment variables.',
      code: 'MISSING_JWT_SECRET',
      platform: 'DefenceLogix AI'
    });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Authorization header missing or format is not Bearer <token>' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired authentication token. Please log in again.' });
    return;
  }

  req.user = decoded;
  next();
}

// Role-based authorization middleware
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Access denied. Role '${req.user.role}' is not authorized for this operation. Requires one of: ${allowedRoles.join(', ')}` 
      });
      return;
    }
    next();
  };
}

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

// Demo session login & genuine JWT generator
apiRouter.post('/auth/demo', (req: Request, res: Response) => {
  const { role = 'logistics_officer' } = req.body || {};
  const demoRoleUsers: Record<string, string> = {
    admin: 'admin@demologix.local',
    logistics_officer: 'officer@demologix.local',
    inventory_manager: 'inventory@demologix.local',
    transport_manager: 'transport@demologix.local',
    analyst: 'analyst@demologix.local',
    viewer: 'viewer@demologix.local'
  };

  const targetEmail = demoRoleUsers[role as string] || 'officer@demologix.local';
  const user = db.getUserByEmail(targetEmail) || db.getUserById('USR-002');

  if (!user) {
    res.status(404).json({ error: 'Demo user not found' });
    return;
  }

  const secret = getJwtSecret();
  if (!secret) {
    console.error('[DefenceLogix Auth] Configuration Diagnostic: process.env.JWT_SECRET is missing or empty in the server runtime environment. Please configure JWT_SECRET in your Vercel project environment variables.');
    res.status(500).json({
      error: 'Authentication configuration error: JWT_SECRET environment variable is missing on the server. Please set JWT_SECRET in your Vercel project environment variables.',
      code: 'MISSING_JWT_SECRET',
      platform: 'DefenceLogix AI'
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
      action: 'DEMO_LOGIN_ISSUED',
      targetEntity: 'Authentication System',
      details: `Generated valid JWT session token for role ${user.role} (${user.name})`
    });

    res.json({
      token,
      user
    });
  } catch (err) {
    console.error('[DefenceLogix Auth] Demo token signing failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Server authentication configuration error: JWT_SECRET missing',
      code: 'MISSING_JWT_SECRET',
      platform: 'DefenceLogix AI'
    });
  }
});

apiRouter.get('/auth/demo', (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'logistics_officer';
  const demoRoleUsers: Record<string, string> = {
    admin: 'admin@demologix.local',
    logistics_officer: 'officer@demologix.local',
    inventory_manager: 'inventory@demologix.local',
    transport_manager: 'transport@demologix.local',
    analyst: 'analyst@demologix.local',
    viewer: 'viewer@demologix.local'
  };

  const targetEmail = demoRoleUsers[role] || 'officer@demologix.local';
  const user = db.getUserByEmail(targetEmail) || db.getUserById('USR-002');

  if (!user) {
    res.status(404).json({ error: 'Demo user not found' });
    return;
  }

  const secret = getJwtSecret();
  if (!secret) {
    console.error('[DefenceLogix Auth] Configuration Diagnostic: process.env.JWT_SECRET is missing or empty in the server runtime environment. Please configure JWT_SECRET in your Vercel project environment variables.');
    res.status(500).json({
      error: 'Authentication configuration error: JWT_SECRET environment variable is missing on the server. Please set JWT_SECRET in your Vercel project environment variables.',
      code: 'MISSING_JWT_SECRET',
      platform: 'DefenceLogix AI'
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
    console.error('[DefenceLogix Auth] Demo token signing failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Server authentication configuration error: JWT_SECRET missing',
      code: 'MISSING_JWT_SECRET',
      platform: 'DefenceLogix AI'
    });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid military credentials or email' });
    return;
  }

  const secret = getJwtSecret();
  if (!secret) {
    console.error('[DefenceLogix Auth] Configuration Diagnostic: process.env.JWT_SECRET is missing or empty in the server runtime environment. Please configure JWT_SECRET in your Vercel project environment variables.');
    res.status(500).json({
      error: 'Authentication configuration error: JWT_SECRET environment variable is missing on the server. Please set JWT_SECRET in your Vercel project environment variables.',
      code: 'MISSING_JWT_SECRET',
      platform: 'DefenceLogix AI'
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
      action: 'USER_LOGIN',
      targetEntity: 'Authentication System',
      details: `User signed in with role ${user.role} and clearance ${user.clearanceLevel}`
    });

    res.json({
      token,
      user
    });
  } catch (err) {
    console.error('[DefenceLogix Auth] Login signing failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Server authentication configuration error: JWT_SECRET missing',
      code: 'MISSING_JWT_SECRET',
      platform: 'DefenceLogix AI'
    });
  }
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, name, role = 'viewer', serviceNumber, clearanceLevel, department } = req.body;

  if (!email || !name) {
    res.status(400).json({ error: 'Email and name are required' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'User with this email already exists' });
    return;
  }

  const secret = getJwtSecret();
  if (!secret) {
    console.error('[DefenceLogix Auth] Configuration Diagnostic: process.env.JWT_SECRET is missing or empty in the server runtime environment. Please configure JWT_SECRET in your Vercel project environment variables.');
    res.status(500).json({
      error: 'Authentication configuration error: JWT_SECRET environment variable is missing on the server. Please set JWT_SECRET in your Vercel project environment variables.',
      code: 'MISSING_JWT_SECRET',
      platform: 'DefenceLogix AI'
    });
    return;
  }

  const newUser = db.createUser({
    email,
    name,
    role: role as UserRole,
    serviceNumber: serviceNumber || `IC-${Math.floor(10000 + Math.random() * 90000)}X`,
    clearanceLevel: clearanceLevel || 'LEVEL 2 - RESTRICTED (DEMO)',
    department: department || 'General Logistics Directorate'
  });

  try {
    const token = signToken(newUser);
    res.status(201).json({
      token,
      user: newUser
    });
  } catch (err) {
    console.error('[DefenceLogix Auth] Register signing failed:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Server authentication configuration error: JWT_SECRET missing'
    });
  }
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = db.getUserById(req.user?.id || 'USR-002');
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

/* ==========================================================================
   DASHBOARD METRICS ROUTE
   ========================================================================== */

apiRouter.get('/dashboard', (req: Request, res: Response) => {
  const inventory = db.getInventory();
  const vehicles = db.getVehicles();
  const alerts = db.getAlerts();
  const recommendations = db.getRecommendations();

  const totalInventoryItems = inventory.length;
  const criticalStockItems = inventory.filter(i => i.status === 'CRITICAL' || i.stockoutRiskScore >= 75).length;
  const lowStockItems = inventory.filter(i => i.status === 'LOW').length;
  const predictedDemandTotal = inventory.reduce((sum, item) => sum + item.predictedDemand7d, 0);

  const pendingSupplyRequests = recommendations.filter(r => r.status === 'RECOMMENDED').length;
  const activeDeliveries = vehicles.filter(v => v.status === 'IN_TRANSIT').length;

  const totalTransportCapacityTons = vehicles.reduce((sum, v) => sum + v.capacityTons, 0);
  const availableTransportCapacityTons = vehicles
    .filter(v => v.status === 'AVAILABLE')
    .reduce((sum, v) => sum + v.capacityTons, 0);

  const lowStockAlertsCount = alerts.filter(a => (a.type === 'LOW STOCK' || a.type === 'STOCKOUT RISK') && a.status !== 'RESOLVED').length;
  const stockoutRiskAverage = Math.round(inventory.reduce((sum, i) => sum + i.stockoutRiskScore, 0) / Math.max(1, inventory.length));

  const metrics: DashboardMetrics = {
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

/* ==========================================================================
   INVENTORY ROUTES (CRUD + Stockout Risk + Reorder Calculations)
   ========================================================================== */

apiRouter.get('/inventory', (req: Request, res: Response) => {
  const { category, locationId, status, search } = req.query;
  let items = db.getInventory();

  if (category) {
    items = items.filter(i => i.category === category);
  }
  if (locationId) {
    items = items.filter(i => i.locationId === locationId);
  }
  if (status) {
    items = items.filter(i => i.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.itemId.toLowerCase().includes(q) || 
      i.locationName.toLowerCase().includes(q)
    );
  }

  res.json({
    total: items.length,
    items
  });
});

apiRouter.post('/inventory', authMiddleware, requireRoles(['admin', 'inventory_manager']), (req: AuthenticatedRequest, res: Response) => {
  const { name, category, locationId, currentStock, minStock, maxStock, dailyConsumption, leadTimeDays, unit } = req.body;

  if (!name || !category || !locationId || currentStock === undefined) {
    res.status(400).json({ error: 'Missing required inventory fields' });
    return;
  }

  const location = db.getLocationById(locationId);
  if (!location) {
    res.status(400).json({ error: 'Invalid locationId' });
    return;
  }

  const newItem = db.createInventoryItem({
    itemId: `ITM-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    name,
    category: category as ItemCategory,
    locationId: location.id,
    locationName: location.name,
    currentStock: Number(currentStock),
    minStock: Number(minStock || 100),
    maxStock: Number(maxStock || 500),
    dailyConsumption: Number(dailyConsumption || 10),
    leadTimeDays: Number(leadTimeDays || 4),
    unit: unit || 'Units',
    predictedDemand7d: Math.round(Number(dailyConsumption || 10) * 7),
    predictedDemand14d: Math.round(Number(dailyConsumption || 10) * 14),
    predictedDemand30d: Math.round(Number(dailyConsumption || 10) * 30),
    recommendedReorder: 0
  });

  db.addAuditLog({
    userId: req.user?.id || 'USR-001',
    userName: req.user?.name || 'Administrator',
    role: req.user?.role || 'admin',
    action: 'INVENTORY_ITEM_CREATED',
    targetEntity: newItem.itemId,
    details: `Created new item "${newItem.name}" at ${location.name} with initial stock ${newItem.currentStock} ${newItem.unit}`
  });

  res.status(201).json({ item: newItem });
});

apiRouter.put('/inventory/:id', authMiddleware, requireRoles(['admin', 'inventory_manager', 'logistics_officer']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const existing = db.getInventoryItemById(id);
  if (!existing) {
    res.status(404).json({ error: 'Inventory item not found' });
    return;
  }

  const updated = db.updateInventoryItem(id, updates);

  // If stock changed, log transaction
  if (updates.currentStock !== undefined && updates.currentStock !== existing.currentStock) {
    const diff = Number(updates.currentStock) - existing.currentStock;
    db.addInventoryTransaction({
      itemId: existing.itemId,
      itemName: existing.name,
      locationId: existing.locationId,
      locationName: existing.locationName,
      type: diff > 0 ? 'RECEIPT' : 'DISPATCH',
      quantity: Math.abs(diff),
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      performedBy: req.user?.name || 'Inventory Officer',
      remarks: `Manual stock level adjustment by ${req.user?.role || 'Officer'}`
    });
  }

  db.addAuditLog({
    userId: req.user?.id || 'USR-001',
    userName: req.user?.name || 'Inventory Manager',
    role: req.user?.role || 'inventory_manager',
    action: 'INVENTORY_ITEM_UPDATED',
    targetEntity: existing.itemId,
    details: `Updated inventory item ${existing.name} (Stock: ${updated?.currentStock} ${existing.unit})`
  });

  res.json({ item: updated });
});

apiRouter.delete('/inventory/:id', authMiddleware, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getInventoryItemById(id);
  if (!existing) {
    res.status(404).json({ error: 'Inventory item not found' });
    return;
  }

  db.deleteInventoryItem(id);

  db.addAuditLog({
    userId: req.user?.id || 'USR-001',
    userName: req.user?.name || 'Administrator',
    role: req.user?.role || 'admin',
    action: 'INVENTORY_ITEM_DELETED',
    targetEntity: existing.itemId,
    details: `Deleted inventory item ${existing.name} from ${existing.locationName}`
  });

  res.json({ success: true, message: 'Item deleted' });
});

/* ==========================================================================
   AI DEMAND FORECASTING ROUTES
   ========================================================================== */

apiRouter.get('/forecast', (req: Request, res: Response) => {
  const { itemId, model = 'Random Forest', horizon = '14' } = req.query;
  const inventory = db.getInventory();
  const targetItem = itemId ? db.getInventoryItemById(itemId as string) : inventory[0];

  if (!targetItem) {
    res.status(404).json({ error: 'Item not found for forecasting' });
    return;
  }

  const history = db.getDemandHistory(targetItem.itemId, targetItem.locationId);
  const location = db.getLocationById(targetItem.locationId) || db.getLocations()[0];

  const forecast = runForecastingModel(targetItem, history, location, {
    modelType: (model as MLModelOptions['modelType']) || 'Random Forest',
    horizonDays: (Number(horizon) === 7 ? 7 : Number(horizon) === 30 ? 30 : 14),
    operationalTempo: 'Heightened Readiness',
    weatherFactor: location.weatherCondition as any
  });

  res.json({ forecast });
});

apiRouter.post('/forecast/generate', (req: Request, res: Response) => {
  const { itemId, locationId, modelType = 'Random Forest', horizonDays = 14, operationalTempo = 'Routine', weatherFactor = 'Clear' } = req.body;

  const targetItem = db.getInventoryItemById(itemId);
  if (!targetItem) {
    res.status(404).json({ error: 'Target inventory item not found' });
    return;
  }

  const location = db.getLocationById(locationId || targetItem.locationId) || db.getLocations()[0];
  const history = db.getDemandHistory(targetItem.itemId, targetItem.locationId);

  const forecast = runForecastingModel(targetItem, history, location, {
    modelType: modelType as MLModelOptions['modelType'],
    horizonDays: (horizonDays === 7 || horizonDays === 14 || horizonDays === 30) ? horizonDays : 14,
    operationalTempo,
    weatherFactor
  });

  res.json({ forecast });
});

apiRouter.get('/demand-history', (req: Request, res: Response) => {
  const { itemId, locationId } = req.query;
  const history = db.getDemandHistory(itemId as string, locationId as string);
  res.json({ history });
});

/* ==========================================================================
   LOCATIONS & GIS ROUTES
   ========================================================================== */

apiRouter.get('/locations', async (req: Request, res: Response) => {
  const locations = db.getLocations();
  const inventory = db.getInventory();

  // Attach enriched inventory rollups and live Open-Meteo weather telemetry
  const weatherList = await fetchWeatherForAllLocations(locations);
  const weatherMap = new Map(weatherList.map(w => [w.locationId, w]));

  const enriched = locations.map(loc => {
    const locItems = inventory.filter(i => i.locationId === loc.id);
    const criticalCount = locItems.filter(i => i.status === 'CRITICAL' || i.stockoutRiskScore >= 75).length;
    const lowCount = locItems.filter(i => i.status === 'LOW').length;
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

apiRouter.get('/locations/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const loc = db.getLocationById(id);
  if (!loc) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const items = db.getInventory().filter(i => i.locationId === id);
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

/* ==========================================================================
   PUBLIC WEATHER TELEMETRY ROUTES (Open-Meteo Integration)
   ========================================================================== */

apiRouter.get('/weather', async (req: Request, res: Response) => {
  const locations = db.getLocations();
  const weatherList = await fetchWeatherForAllLocations(locations);
  res.json({
    weather: weatherList,
    meta: {
      apiSource: 'REAL PUBLIC DATA: Open-Meteo Non-Sensitive Weather API',
      mapSource: 'REAL PUBLIC DATA: OpenStreetMap / CartoDB Dark Matter',
      logisticsData: 'SYNTHETIC DEMO LOGISTICS DATA: Unclassified Prototype Telemetry',
      cachedAt: new Date().toISOString()
    }
  });
});

apiRouter.get('/weather/:locationId', async (req: Request, res: Response) => {
  const { locationId } = req.params;
  const loc = db.getLocationById(locationId);
  if (!loc) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const weather = await fetchWeatherForLocation(loc);
  res.json({
    weather,
    meta: {
      apiSource: 'REAL PUBLIC DATA: Open-Meteo Non-Sensitive Weather API',
      logisticsData: 'SYNTHETIC DEMO LOGISTICS DATA'
    }
  });
});

/* ==========================================================================
   VEHICLES & TRANSPORT ROUTES
   ========================================================================== */

apiRouter.get('/vehicles', (req: Request, res: Response) => {
  const vehicles = db.getVehicles();
  res.json({ vehicles });
});

apiRouter.put('/vehicles/:id', authMiddleware, requireRoles(['admin', 'transport_manager', 'logistics_officer']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, destinationLocationId } = req.body;

  const updated = db.updateVehicleStatus(id, status, destinationLocationId);
  if (!updated) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }

  db.addAuditLog({
    userId: req.user?.id || 'USR-004',
    userName: req.user?.name || 'Transport Manager',
    role: req.user?.role || 'transport_manager',
    action: 'VEHICLE_STATUS_UPDATED',
    targetEntity: updated.vehicleId,
    details: `Changed status to ${status}${destinationLocationId ? ` bound for ${updated.destinationLocationName}` : ''}`
  });

  res.json({ vehicle: updated });
});

/* ==========================================================================
   ROUTES
   ========================================================================== */

apiRouter.get('/routes', (req: Request, res: Response) => {
  const routes = db.getRoutes();
  res.json({ routes });
});

/* ==========================================================================
   LOGISTICS OPTIMIZATION & RECOMMENDATIONS
   ========================================================================== */

apiRouter.get('/recommendations', (req: Request, res: Response) => {
  const recommendations = db.getRecommendations();
  res.json({ recommendations });
});

apiRouter.post('/recommendations/optimize', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const items = db.getInventory();
  const locations = db.getLocations();
  const vehicles = db.getVehicles();
  const routes = db.getRoutes();

  const generated = optimizeLogisticsNetwork(items, locations, vehicles, routes);
  db.setRecommendations(generated);

  db.addAuditLog({
    userId: req.user?.id || 'USR-002',
    userName: req.user?.name || 'Logistics Officer',
    role: req.user?.role || 'logistics_officer',
    action: 'LOGISTICS_OPTIMIZATION_TRIGGERED',
    targetEntity: 'Supply Chain Solver',
    details: `Generated ${generated.length} replenishment transfer recommendations across forward nodes`
  });

  res.json({
    count: generated.length,
    recommendations: generated
  });
});

apiRouter.post('/recommendations/:id/approve', authMiddleware, requireRoles(['admin', 'logistics_officer']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const approved = db.approveRecommendation(id);

  if (!approved) {
    res.status(404).json({ error: 'Recommendation not found' });
    return;
  }

  db.addAuditLog({
    userId: req.user?.id || 'USR-002',
    userName: req.user?.name || 'Col. Sengupta',
    role: req.user?.role || 'logistics_officer',
    action: 'TRANSFER_RECOMMENDATION_APPROVED',
    targetEntity: approved.id,
    details: `Approved transfer of ${approved.supplyQuantity} units of ${approved.itemName} from ${approved.sourceName} to ${approved.destinationName}`
  });

  res.json({ success: true, recommendation: approved });
});

/* ==========================================================================
   ALERTS & EARLY WARNING ROUTES
   ========================================================================== */

apiRouter.get('/alerts', (req: Request, res: Response) => {
  const { severity, type, status } = req.query;
  let alerts = db.getAlerts();

  if (severity) alerts = alerts.filter(a => a.severity === severity);
  if (type) alerts = alerts.filter(a => a.type === type);
  if (status) alerts = alerts.filter(a => a.status === status);

  res.json({ alerts });
});

apiRouter.post('/alerts', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { type, severity, locationId, title, description, recommendedAction } = req.body;

  if (!type || !severity || !locationId || !title) {
    res.status(400).json({ error: 'Missing required alert fields' });
    return;
  }

  const location = db.getLocationById(locationId);
  const newAlert = db.createAlert({
    type,
    severity,
    locationId,
    locationName: location ? location.name : 'Sector Command',
    title,
    description: description || '',
    recommendedAction: recommendedAction || 'Review garrison operational posture'
  });

  res.status(201).json({ alert: newAlert });
});

apiRouter.put('/alerts/:id/acknowledge', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const officerName = req.user?.name || 'Logistics Duty Officer';
  const ack = db.acknowledgeAlert(id, officerName);

  if (!ack) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  res.json({ alert: ack });
});

apiRouter.put('/alerts/:id/resolve', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const resolved = db.resolveAlert(id);

  if (!resolved) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  res.json({ alert: resolved });
});

/* ==========================================================================
   IoT SENSORS & ANOMALY DETECTION
   ========================================================================== */

apiRouter.get('/iot', (req: Request, res: Response) => {
  const sensors = db.getSensorData();
  res.json({ sensors });
});

apiRouter.post('/iot/reset', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const resetSensors = db.resetSensorSimulation();
  db.addAuditLog({
    userId: req.user?.id || 'USR-003',
    userName: req.user?.name || 'Inventory Manager',
    role: req.user?.role || 'inventory_manager',
    action: 'IOT_SIMULATION_RESET',
    targetEntity: 'IoT Telemetry Network',
    details: 'Reset all 12 IoT sensor nodes and resolved simulated anomaly alarms'
  });
  res.json({ success: true, sensors: resetSensors });
});

apiRouter.post('/iot/:id/scenario', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { scenario = 'temperature' } = req.body;

  const result = db.triggerSensorScenario(
    id, 
    scenario as 'temperature' | 'humidity' | 'low_storage' | 'low_battery' | 'offline'
  );

  if (!result) {
    res.status(404).json({ error: 'Sensor node not found' });
    return;
  }

  db.addAuditLog({
    userId: req.user?.id || 'USR-003',
    userName: req.user?.name || 'Inventory Manager',
    role: req.user?.role || 'inventory_manager',
    action: 'IOT_SCENARIO_SIMULATED',
    targetEntity: result.sensor.sensorId,
    details: `Simulated ${scenario} anomaly scenario at ${result.sensor.unitName}`
  });

  res.json({ sensor: result.sensor, alert: result.alert });
});

apiRouter.post('/iot/:id/anomaly', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const result = db.triggerSensorScenario(id, 'temperature');

  if (!result) {
    res.status(404).json({ error: 'Sensor node not found' });
    return;
  }

  db.addAuditLog({
    userId: req.user?.id || 'USR-003',
    userName: req.user?.name || 'Inventory Manager',
    role: req.user?.role || 'inventory_manager',
    action: 'IOT_ANOMALY_SIMULATED',
    targetEntity: result.sensor.sensorId,
    details: `Triggered synthetic anomaly for demonstration at ${result.sensor.unitName}`
  });

  res.json({ sensor: result.sensor, alert: result.alert });
});

/* ==========================================================================
   ANALYTICS ROUTES
   ========================================================================== */

apiRouter.get('/analytics', (req: Request, res: Response) => {
  const { range = '30d' } = req.query;
  const inventory = db.getInventory();
  const vehicles = db.getVehicles();

  // Aggregate category demand vs inventory
  const categoryStats: Record<string, { totalStock: number; totalDemand7d: number; criticalCount: number }> = {};

  inventory.forEach(item => {
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { totalStock: 0, totalDemand7d: 0, criticalCount: 0 };
    }
    categoryStats[item.category].totalStock += item.currentStock;
    categoryStats[item.category].totalDemand7d += item.predictedDemand7d;
    if (item.status === 'CRITICAL') categoryStats[item.category].criticalCount++;
  });

  const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    ...stats,
    stockDemandRatio: Number((stats.totalStock / Math.max(1, stats.totalDemand7d)).toFixed(2))
  }));

  // Fleet utilization metrics
  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const inTransit = vehicles.filter(v => v.status === 'IN_TRANSIT').length;
  const maintenance = vehicles.filter(v => v.status === 'MAINTENANCE').length;
  const assigned = vehicles.filter(v => v.status === 'ASSIGNED').length;

  res.json({
    range,
    categoryBreakdown,
    fleetUtilization: {
      totalVehicles,
      availableVehicles,
      inTransit,
      maintenance,
      assigned,
      utilizationRate: Math.round(((inTransit + assigned) / totalVehicles) * 100)
    },
    forecastMetrics: {
      overallAccuracy: 94.6,
      averageMae: 3.8,
      averageRmse: 5.2,
      averageMape: 5.4
    }
  });
});

/* ==========================================================================
   REPORTS GENERATION
   ========================================================================== */

apiRouter.post('/reports/generate', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { type = 'Daily Logistics Report', format = 'json' } = req.body;
  const inventory = db.getInventory();
  const locations = db.getLocations();
  const vehicles = db.getVehicles();
  const alerts = db.getAlerts();

  const criticalItems = inventory.filter(i => i.status === 'CRITICAL');
  const activeAlerts = alerts.filter(a => a.status !== 'RESOLVED');

  const reportData = {
    title: `MoD DSSC DefenceLogix: ${type}`,
    generatedAt: new Date().toISOString(),
    preparedBy: req.user?.name || 'Col. Amitav Sengupta',
    role: req.user?.role || 'Logistics Officer',
    classification: 'DEMONSTRATION ONLY - UNCLASSIFIED SYNTHETIC DATA',
    executiveSummary: `Consolidated logistics assessment across 10 forward and rear sectors. Overall operational readiness stands at 86.4%. Priority attention required for winter fuel reserves at Forward Node Alpha and emergency surgical trauma kits at Tactical Supply Point Foxtrot.`,
    statistics: {
      totalLocationsMonitored: locations.length,
      totalInventorySkus: inventory.length,
      criticalStockAlerts: criticalItems.length,
      fleetActiveSorties: vehicles.filter(v => v.status === 'IN_TRANSIT').length,
      totalTransportCapacityTons: vehicles.reduce((s, v) => s + v.capacityTons, 0),
      aiForecastConfidence: 'High (94.2% historical fit)'
    },
    actionItems: [
      'Approve Tatra 6x6 fuel replenishment transfer to Forward Node Alpha',
      'Authorize autonomous cargo UAV flight to isolated Foxtrot pass',
      'Deploy EME workshop support team to Intermodal Hub Kilo'
    ],
    criticalItemsSample: criticalItems.map(c => ({
      item: c.name,
      location: c.locationName,
      currentStock: `${c.currentStock} ${c.unit}`,
      minStock: `${c.minStock} ${c.unit}`,
      riskScore: `${c.stockoutRiskScore}%`
    }))
  };

  db.addAuditLog({
    userId: req.user?.id || 'USR-002',
    userName: req.user?.name || 'Col. Sengupta',
    role: req.user?.role || 'logistics_officer',
    action: 'REPORT_GENERATED',
    targetEntity: type,
    details: `Generated ${type} in format ${format}`
  });

  res.json({ report: reportData });
});

/* ==========================================================================
   AI LOGISTICS ASSISTANT ("LogiAI")
   ========================================================================== */

apiRouter.post('/chat', async (req: Request, res: Response) => {
  const { question, userRole = 'logistics_officer' } = req.body;

  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Question string is required' });
    return;
  }

  try {
    const result = await askLogiAi(question, userRole);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process AI query', details: err?.message });
  }
});

/* ==========================================================================
   ADMIN PANEL & USER MANAGEMENT
   ========================================================================== */

apiRouter.get('/users', authMiddleware, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response) => {
  res.json({ users: db.getUsers() });
});

apiRouter.put('/users/:id/role', authMiddleware, requireRoles(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const updated = db.updateUserRole(id, role as UserRole);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  db.addAuditLog({
    userId: req.user?.id || 'USR-001',
    userName: req.user?.name || 'Administrator',
    role: 'admin',
    action: 'USER_ROLE_CHANGED',
    targetEntity: updated.email,
    details: `Updated role for ${updated.name} to ${role}`
  });

  res.json({ user: updated });
});

apiRouter.get('/audit-logs', authMiddleware, requireRoles(['admin', 'logistics_officer', 'analyst']), (req: Request, res: Response) => {
  res.json({ auditLogs: db.getAuditLogs() });
});

/* ==========================================================================
   DEMO SIMULATION & RESET ROUTES (Instant Re-seed & Scenario Injection)
   ========================================================================== */

apiRouter.post('/demo/simulate', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { scenario = 'demand_surge' } = req.body;
  
  if (!['demand_surge', 'inventory_reduction', 'weather_deterioration', 'sensor_anomaly'].includes(scenario)) {
    res.status(400).json({ error: 'Invalid scenario type' });
    return;
  }

  const result = db.simulateScenario(scenario as any);

  db.addAuditLog({
    userId: req.user?.id || 'USR-002',
    userName: req.user?.name || 'Logistics Officer',
    role: req.user?.role || 'logistics_officer',
    action: 'DEMO_SCENARIO_SIMULATED',
    targetEntity: scenario,
    details: result.description
  });

  res.json({
    success: true,
    result,
    message: result.description
  });
});

apiRouter.post('/demo/reset', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.resetDemoData();

  db.addAuditLog({
    userId: req.user?.id || 'USR-001',
    userName: req.user?.name || 'Administrator',
    role: req.user?.role || 'admin',
    action: 'DEMO_DATA_RESET',
    targetEntity: 'Complete Database',
    details: 'Reset all 10 locations, 50+ inventory items, 1000+ demand history points, and vehicle telemetry to default seed state'
  });

  res.json({
    success: true,
    message: 'Demo dataset reset successfully to initial state'
  });
});
