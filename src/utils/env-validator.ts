/**
 * Environment variable validation
 */

interface EnvConfig {
  // Server
  PORT: number;
  NODE_ENV: string;

  // IQ Reseller
  IQR_API_KEY: string;
  IQR_AUTH_URL: string;
  IQR_API_BASE_URL: string;

  // ShipStation
  SHIPSTATION_API_KEY: string;
  SHIPSTATION_API_SECRET: string;
  SHIPSTATION_API_BASE_URL: string;
  SHIPSTATION_WEBHOOK_SECRET?: string;

  // Sync Configuration
  SYNC_INTERVAL_MINUTES: number;
  SYNC_BATCH_SIZE: number;
  SYNC_MAX_RETRIES: number;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateEnv(): EnvConfig {
  const errors: string[] = [];

  // Required variables
  const required = [
    'IQR_API_KEY',
    'SHIPSTATION_API_KEY',
    'SHIPSTATION_API_SECRET',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate PORT
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  // Validate SYNC_INTERVAL_MINUTES
  const syncInterval = parseInt(process.env.SYNC_INTERVAL_MINUTES || '15', 10);
  if (isNaN(syncInterval) || syncInterval < 0) {
    errors.push('SYNC_INTERVAL_MINUTES must be a non-negative number');
  }

  // Validate SYNC_BATCH_SIZE
  const batchSize = parseInt(process.env.SYNC_BATCH_SIZE || '50', 10);
  if (isNaN(batchSize) || batchSize < 1 || batchSize > 1000) {
    errors.push('SYNC_BATCH_SIZE must be between 1 and 1000');
  }

  // Validate SYNC_MAX_RETRIES
  const maxRetries = parseInt(process.env.SYNC_MAX_RETRIES || '3', 10);
  if (isNaN(maxRetries) || maxRetries < 0 || maxRetries > 10) {
    errors.push('SYNC_MAX_RETRIES must be between 0 and 10');
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  return {
    PORT: port,
    NODE_ENV: process.env.NODE_ENV || 'production',
    IQR_API_KEY: process.env.IQR_API_KEY!,
    IQR_AUTH_URL: process.env.IQR_AUTH_URL || 'https://signin.iqreseller.com',
    IQR_API_BASE_URL: process.env.IQR_API_BASE_URL || 'https://api.iqreseller.com',
    SHIPSTATION_API_KEY: process.env.SHIPSTATION_API_KEY!,
    SHIPSTATION_API_SECRET: process.env.SHIPSTATION_API_SECRET!,
    SHIPSTATION_API_BASE_URL:
      process.env.SHIPSTATION_API_BASE_URL || 'https://ssapi.shipstation.com',
    SHIPSTATION_WEBHOOK_SECRET: process.env.SHIPSTATION_WEBHOOK_SECRET,
    SYNC_INTERVAL_MINUTES: syncInterval,
    SYNC_BATCH_SIZE: batchSize,
    SYNC_MAX_RETRIES: maxRetries,
  };
}

export function printEnvSummary(config: EnvConfig): void {
  console.log('\n=== Environment Configuration ===');
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Port: ${config.PORT}`);
  console.log(`IQR Auth URL: ${config.IQR_AUTH_URL}`);
  console.log(`IQR API URL: ${config.IQR_API_BASE_URL}`);
  console.log(`ShipStation API URL: ${config.SHIPSTATION_API_BASE_URL}`);
  console.log(`Sync Interval: ${config.SYNC_INTERVAL_MINUTES} minutes`);
  console.log(`Batch Size: ${config.SYNC_BATCH_SIZE}`);
  console.log(`Max Retries: ${config.SYNC_MAX_RETRIES}`);
  console.log(`Webhook Secret: ${config.SHIPSTATION_WEBHOOK_SECRET ? 'Configured' : 'Not configured'}`);
  console.log('=================================\n');
}

