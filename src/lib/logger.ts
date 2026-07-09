// ponytail: simplified to native console logging, removing pino and pino-pretty dependencies
const isProd = process.env.NODE_ENV === "production";

function log(level: string, arg1: unknown, arg2?: string) {
  if (isProd) {
    if (arg1 && typeof arg1 === "object") {
      console.log(JSON.stringify({ time: new Date().toISOString(), level, ...arg1, message: arg2 }));
    } else {
      console.log(JSON.stringify({ time: new Date().toISOString(), level, message: arg1 }));
    }
  } else {
    const header = level === "error" ? "\x1b[31m[ERROR]\x1b[0m" : level === "warn" ? "\x1b[33m[WARN]\x1b[0m" : "\x1b[32m[INFO]\x1b[0m";
    if (arg1 && typeof arg1 === "object") {
      console.log(`${header} ${arg2 ?? ""} ${JSON.stringify(arg1)}`);
    } else {
      console.log(`${header} ${arg1}`);
    }
  }
}

export const logger = {
  info: (arg1: unknown, arg2?: string) => log("info", arg1, arg2),
  warn: (arg1: unknown, arg2?: string) => log("warn", arg1, arg2),
  error: (arg1: unknown, arg2?: string) => log("error", arg1, arg2),
  debug: (arg1: unknown, arg2?: string) => {
    if (!isProd) log("debug", arg1, arg2);
  },
};

