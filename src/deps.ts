// std version 0.51 === deno 1.0.0 | 0.52 === deno 1.0.1
// deno standard library
export * from "https://deno.land/std@0.65.0/testing/asserts.ts";
export * as fs from "https://deno.land/std@0.65.0/fs/mod.ts";
export * as log from "https://deno.land/std@0.65.0/log/mod.ts";
export { LogRecord } from "https://deno.land/std@0.65.0/log/logger.ts";

// third party library
export { Cron } from "https://deno.land/x/crontab@0.1.1-1/cron.ts";
export { Evt } from "https://deno.land/x/evt/mod.ts";
export { Html5Entities } from "https://deno.land/x/html_entities@v1.0/mod.js";
export * as telegram from "https://deno.land/x/telegram@v0.0.3/mod.ts";
