/**
 * Configuration for the IQR-ShipStation Connector
 */

import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface Config {
  // IQ Reseller Configuration
  iqr: {
    apiKey: string;
    authUrl: string;
    apiBaseUrl: string;
  };

  // ShipStation Configuration
  shipStation: {
    apiKey: string;
    apiSecret: string;
    apiBaseUrl: string;
    webhookSecret: string;
    storeName: string;
  };

  // Sync Configuration
  sync: {
    enabled: boolean;
    intervalMinutes: number;
    batchSize: number;
    maxRetries: number;
  };

  // Server Configuration
  server: {
    port: number;
    environment: 'development' | 'production' | 'test';
  };
}

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config: Config = {
  iqr: {
    apiKey: getEnvOrThrow('IQR_API_KEY'),
    authUrl: getEnvOrDefault('IQR_AUTH_URL', 'https://signin.iqreseller.com'),
    apiBaseUrl: getEnvOrDefault('IQR_API_BASE_URL', 'https://api.iqreseller.com'),
  },

  shipStation: {
    apiKey: getEnvOrThrow('SHIPSTATION_API_KEY'),
    apiSecret: getEnvOrThrow('SHIPSTATION_API_SECRET'),
    apiBaseUrl: getEnvOrDefault('SHIPSTATION_API_BASE_URL', 'https://ssapi.shipstation.com'),
    webhookSecret: getEnvOrDefault('SHIPSTATION_WEBHOOK_SECRET', ''),
    storeName: getEnvOrDefault('SHIPSTATION_STORE_NAME', 'DPC - Agent Quickbooks'),
  },

  sync: {
    enabled: getEnvOrDefault('SYNC_ENABLED', 'false').toLowerCase() === 'true',
    intervalMinutes: parseInt(getEnvOrDefault('SYNC_INTERVAL_MINUTES', '15'), 10),
    batchSize: parseInt(getEnvOrDefault('SYNC_BATCH_SIZE', '50'), 10),
    maxRetries: parseInt(getEnvOrDefault('SYNC_MAX_RETRIES', '3'), 10),
  },

  server: {
    port: parseInt(getEnvOrDefault('PORT', '3000'), 10),
    environment: (getEnvOrDefault('NODE_ENV', 'development') as Config['server']['environment']),
  },
};

export default config;

