import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { MAKO_CORS_BUILD, applyCorsHeaders } from '../../common/cors.util';

@ApiTags('Health')
@Controller('api/v1/health')
export class HealthController {
  @Get()
  check(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    applyCorsHeaders(req, res);
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      service: 'Mako API',
      version: '1.0.0',
      corsBuild: MAKO_CORS_BUILD,
    };
  }
}
