import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../src/server/routes';

// Safe dotenv loading: Only load local .env in non-Vercel local development to avoid overriding Vercel environment variables
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();

// Security and parser middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Vercel serverless path normalizer middleware:
// When Vercel rewrites /api/(.*) to /api, req.url may arrive as / or /api.
// Use x-forwarded-uri (or x-original-uri) to restore the original client-requested subpath.
app.use((req, _res, next) => {
  const forwardedUri = (req.headers['x-forwarded-uri'] || req.headers['x-original-uri']) as string | undefined;
  
  if (forwardedUri && (req.url === '/' || req.url === '/api' || req.url === '' || req.url === '/api/')) {
    req.url = forwardedUri;
  }
  next();
});

// Dedicated unauthenticated health check endpoints (support both direct /api/health and /health)
const healthCheckHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'DefenceLogix AI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};

app.get('/api/health', healthCheckHandler);
app.get('/health', healthCheckHandler);

// Mount API router for both direct serverless routes (/api/*) and base routes (/*)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Global serverless error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[DefenceLogix Vercel API Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    platform: 'DefenceLogix AI'
  });
});

export default app;
