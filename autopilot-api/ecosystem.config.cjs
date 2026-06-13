/**
 * PM2 process file for the NestJS API.
 *
 * Usage (from autopilot-api/):
 *   npm run build
 *   npm run pm2:start          # first start
 *   npm run pm2:restart        # after deploy / rebuild
 *   npm run pm2:logs
 *
 * Requires a .env file in this directory (or export vars before pm2 start).
 */
module.exports = {
  apps: [
    {
      name: 'autopilot-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      time: true,
      merge_logs: true,
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
