import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { NextFunction, Request, Response } from 'express';

export const MAKO_CORS_BUILD = 'cors-v7';

const WIDGET_PREFIX = '/api/v1/widget';

export function resolveCorsOrigins(): string[] {
  const fromEnv = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const frontend = process.env.FRONTEND_URL?.trim();
  const defaults = ['http://localhost:3000', 'http://localhost:5173'];
  return [...new Set([...fromEnv, ...(frontend ? [frontend] : []), ...defaults])];
}

export function applyCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin;
  const allowed = resolveCorsOrigins();

  res.setHeader('X-Mako-Cors', MAKO_CORS_BUILD);

  if (typeof origin !== 'string' || !allowed.includes(origin)) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Visitor-Id, Accept',
  );
  res.setHeader('Vary', 'Origin');
}

/** Nest/Express middleware — handles preflight before route matching. Skips embeddable widget routes. */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path.startsWith(WIDGET_PREFIX)) {
    next();
    return;
  }

  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const allowed = resolveCorsOrigins();
    if (typeof origin === 'string' && allowed.includes(origin)) {
      res.status(204).end();
      return;
    }
  }

  next();
}

export function buildNestCorsOptions(): CorsOptions {
  const corsOrigins = resolveCorsOrigins();
  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, origin);
      console.warn('[cors] blocked origin:', origin);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Visitor-Id', 'Accept'],
    optionsSuccessStatus: 204,
  };
}
