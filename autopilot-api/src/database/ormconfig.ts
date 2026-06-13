import { SnakeNamingStrategy } from '../snake-naming.strategy';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserSubscriber } from 'src/entity-subscribers';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';

function resolveDbSsl(configService: ConfigService): false | { ca: Buffer } {
  if (configService.get<string>('DB_SSL') !== 'true') return false;
  const certPath = configService.get<string>('CERTIFICATE_PATH')?.trim();
  const certName = configService.get<string>('CERTIFICATE_NAME')?.trim();
  if (!certPath || !certName) return false;
  const fullPath = path.join(process.cwd(), certPath, certName);
  if (!existsSync(fullPath)) {
    console.warn(`DB_SSL=true but certificate missing at ${fullPath} — using non-SSL connection`);
    return false;
  }
  return { ca: readFileSync(fullPath) };
}

export function typeOrmConfigFactory(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
    username: configService.get<string>('DB_USERNAME') || 'thecodefather',
    password: configService.get<string>('DB_PASSWORD') || '',
    database: configService.get<string>('DB_DATABASE') || 'nest',
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
    cache: false,
    namingStrategy: new SnakeNamingStrategy(),
    subscribers: [UserSubscriber],
    ssl: resolveDbSsl(configService),
  };
}
