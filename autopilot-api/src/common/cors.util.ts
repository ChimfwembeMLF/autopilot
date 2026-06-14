import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { NextFunction, Request, Response } from 'express';
import { widgetCorsMiddleware } from './widget-cors.middleware';

export const MAKO_CORS_BUILD = 'cors-v9';

const WIDGET_PREFIX = '/api/v1/widget';

export function isCorsAllowAll(): boolean {
  return process.env.CORS_ALLOW_ALL === 'true';
}

export function resolveCorsOrigins(): string[] {
  if (isCorsAllowAll()) return ['*'];

  const fromEnv = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const frontend = process.env.FRONTEND_URL?.trim();
  const defaults = ['http://localhost:3000', 'http://localhost:5173'];
  return [...new Set([...fromEnv, ...(frontend ? [frontend] : []), ...defaults])];
}

function setCommonCorsHeaders(res: Response, credentials: boolean): void {
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Visitor-Id, Accept',
  );
  if (credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

export function applyCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin;

  res.setHeader('X-Mako-Cors', MAKO_CORS_BUILD);

  if (isCorsAllowAll()) {
    if (typeof origin === 'string' && origin.length > 0) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    setCommonCorsHeaders(res, false);
    return;
  }

  const allowed = resolveCorsOrigins();

  if (typeof origin !== 'string' || !allowed.includes(origin)) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  setCommonCorsHeaders(res, true);
}

/** Express middleware — register in main.ts before session/routes so OPTIONS preflight succeeds. */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path.startsWith(WIDGET_PREFIX)) {
    widgetCorsMiddleware(req, res, next);
    return;
  }

  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    if (isCorsAllowAll()) {
      res.status(204).end();
      return;
    }

    const origin = req.headers.origin;
    const allowed = resolveCorsOrigins();
    if (typeof origin === 'string' && allowed.includes(origin)) {
      res.status(204).end();
      return;
    }
    res.status(403).end();
    return;
  }

  next();
}

export function buildNestCorsOptions(): CorsOptions {
  if (isCorsAllowAll()) {
    return {
      origin: true,
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Visitor-Id', 'Accept'],
      optionsSuccessStatus: 204,
    };
  }

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
