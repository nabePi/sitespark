import pino from 'pino';
import { env } from './env';

const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    pid: process.pid,
    env: env.NODE_ENV,
  },
});

export const createChildLogger = (component: string) => {
  return logger.child({ component });
};

export default logger;