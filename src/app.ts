import "https://deno.land/x/dotenv/load.ts";

import { Cron } from "./deps.ts";

import { KosmosVisitorLiveEmitter } from "./kosmos/KosmosVisitorLiveEmitter.ts";
import { KosmosParser } from "./kosmos/KosmosParser.ts";
import { logger } from "./log.ts";
import { start, addMessageHandler } from "./telegram/TelegramBot.ts";
import { handleKosmosTelegramMessage } from "./kosmos/KosmosTelegramMessageHandler.ts";
import { ActDbVisitorDatastore as VisitorDatastore } from "./persistence/ActDbVisitorDatastore.ts";
import { VisitorStatusEvent } from "./core/Events.ts";
import { handleDefaultTelegramMessage } from "./telegram/TelegramDefaultMessageHandler.ts";

const EVERY_MINUTES = +(Deno.env.get("EVERY_MINUTES") || "5");

logger.info("Bootstrapping app");

const db = new VisitorDatastore();
await db.init();

addMessageHandler((msg) => handleKosmosTelegramMessage(db, msg));
addMessageHandler(handleDefaultTelegramMessage);
start();

const cron = new Cron();
cron.start();

const kosmosEmitter = new KosmosVisitorLiveEmitter(
  db,
  VisitorStatusEvent,
  new KosmosParser(),
);

// kosmos cron
cron.add(Deno.env.get("KOSMOS_CRON") || "* * * * *", () => {
  const kosmosWorkingHour = (Deno.env.get("KOSMOS_WORKING_HOUR") || "8-22")
    .split("-")
    .map((x) => +x);
  const date = new Date();
  const hour = date.getHours();
  const minutes = date.getMinutes();
  if (
    hour >= kosmosWorkingHour[0] &&
    hour <= kosmosWorkingHour[1] &&
    minutes % EVERY_MINUTES === 0
  ) {
    kosmosEmitter
      .emitActualVisitor()
      .then(() => logger.info("Kosmos status emitted"))
      .catch((error) => logger.error("Kosmos error", error));
  }
});

logger.info("App started");

await Deno.signal(Deno.Signal.SIGINT);
logger.info("Shutdown the App");
logger.info("Bye Bye");
Deno.exit(0);
