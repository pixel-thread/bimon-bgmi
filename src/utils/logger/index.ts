const formatData = <T>(type: 'error' | 'info' | 'warn' | 'log', data: T): string => {
  const timestamp = new Date().toISOString();
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 3); // 2 -  indentation, null - no spaces
  return `[${timestamp}] [${type.toUpperCase()}]: ${content}`;
};

export const logger = {
  error: <T>(data: T): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatData('error', data));
    }
  },

  info: <T>(data: T): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatData('info', data));
    }
  },

  warn: <T>(data: T): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatData('warn', data));
    }
  },

  log: <T>(data: T): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatData('log', data));
    }
  },
};
