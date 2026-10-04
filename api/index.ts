import express from 'express';
import dotenv from 'dotenv';
import { apiRouter } from '../src/server/routes';

dotenv.config();

const app = express();

// Security and parser middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Vercel serverless path normalizer middleware:
// Ensures req.url reflects the requested API route even if rewritten by Vercel
app.use((req, _res, next) => {
  const matchedPath = req.headers['x-matched-path'] as string | undefined;
  const forwardedUri = req.headers['x-forwarded-uri'] as string | undefined;
  
  if ((req.url === '/' || req.url === '/api' || req.url === '') && (matchedPath || forwardedUri)) {
    req.url = matchedPath || forwardedUri || req.url;
  }
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'DefenceLogix AI',
    timestamp: new Date().toISOString()
  });
});

// Mount API router for both direct serverless routes and /api prefixed routes
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
