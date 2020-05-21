import { log } from "./deps.ts";
import { LogRecord } from "./deps.ts";

const formatter = (logRecord: LogRecord) => {
  let msg = `${logRecord.datetime} - ${logRecord.levelName} - ${logRecord.msg}`;

  logRecord.args.forEach((arg, index) => {
    msg += `, arg${index}: ${arg}`;
  });

  return msg;
};

await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      formatter,
    }),

    file: new log.handlers.FileHandler("INFO", {
      filename: "./app.log",
      // you can change format of output message using any keys in `LogRecord`
      formatter,
    }),
  },

  loggers: {
    // configure default logger available via short-hand methods above
    default: {
      level: "DEBUG",
      handlers: ["console", "file"],
    },
  },
});

export const logger = log.getLogger();
