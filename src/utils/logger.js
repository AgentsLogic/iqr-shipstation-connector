/**
 * Simple logging utility
 * Can be extended to use Winston or other logging libraries
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ') : '';
  return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
}

const logger = {
  error: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, ...args));
    }
  },

  warn: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, ...args));
    }
  },

  info: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, ...args));
    }
  },

  debug: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, ...args));
    }
  }
};

module.exports = logger;

