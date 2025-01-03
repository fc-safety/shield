import pino from "pino";

export const logger = pino({
  timestamp: pino.stdTimeFunctions.isoTime, // Adds ISO timestamps
  transport: {
    target: "pino-pretty", // For human-readable logs during development
    options: {
      colorize: true,
    },
  },
});
