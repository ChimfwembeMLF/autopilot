import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from '../src/snake-naming.strategy';

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '../.env');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile();

function resolveMigrationSsl(): false | { ca: Buffer } {
  if (process.env.DB_SSL !== 'true') return false;
  const certPath = process.env.CERTIFICATE_PATH?.trim();
  const certName = process.env.CERTIFICATE_NAME?.trim();
  if (!certPath || !certName) return false;
  const fullPath = path.join(process.cwd(), certPath, certName);
  if (!existsSync(fullPath)) return false;
  return { ca: readFileSync(fullPath) };
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'autopilot_dev',
  entities: [path.join(__dirname, '../src/**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, './migrations/*.{ts,js}')],
  namingStrategy: new SnakeNamingStrategy(),
  ssl: resolveMigrationSsl(),
});
