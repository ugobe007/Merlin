/*
 Lightweight logging wrapper that reads LOG_LEVEL from env.
 Levels: error (0), warn (1), info (2), debug (3)
 Default: info
*/
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const env = (process.env.LOG_LEVEL || 'info').toLowerCase();
const currentLevel = Object.prototype.hasOwnProperty.call(levels, env) ? levels[env] : levels.info;

function shouldLog(level) {
  return levels[level] <= currentLevel;
}

module.exports = {
  error: (...args) => { if (shouldLog('error')) console.error('[ERROR]', ...args); },
  warn:  (...args) => { if (shouldLog('warn'))  console.warn('[WARN]',  ...args); },
  info:  (...args) => { if (shouldLog('info'))  console.log('[INFO]',  ...args); },
  debug: (...args) => { if (shouldLog('debug')) console.debug('[DEBUG]', ...args); },
};
