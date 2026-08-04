function formatLog(level, message, context = {}) {
  const time = new Date().toISOString();
  return `[${time}] [${level.toUpperCase()}] ${message} ${
    Object.keys(context).length ? JSON.stringify(context) : ''
  }`.trim();
}

const logger = {
  info(message, context) {
    if (import.meta.env?.DEV) {
      console.info(formatLog('info', message, context));
    }
  },
  warn(message, context) {
    console.warn(formatLog('warn', message, context));
  },
  error(message, context) {
    console.error(formatLog('error', message, context));
  },
};

export default logger;
