/**
 * PM2 Ecosystem Configuration
 * 
 * This file configures PM2 process manager for production deployment.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 logs
 *   pm2 status
 *   pm2 restart iqr-shipstation-connector
 *   pm2 stop iqr-shipstation-connector
 */

module.exports = {
  apps: [
    {
      name: 'iqr-shipstation-connector',
      script: './dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logging
      error_file: './logs/error.log',
      out_file: './logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Watch for changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Advanced features
      exp_backoff_restart_delay: 100,
    },
  ],
};

