import "https://deno.land/x/dotenv/load.ts";

import { Cron } from "./deps.ts";

import { KosmosVisitorLiveEmitter } from "./gyms/kosmos/KosmosVisitorLiveEmitter.ts";
import { KosmosParser } from "./gyms/kosmos/KosmosParser.ts";
import { logger } from "./log.ts";
import {
  start,
  addMessageHandler,
  addCallbackHandler,
} from "./telegram/TelegramBot.ts";
import {
  handleKosmosTelegramMessage,
  handleKosmosTelegramMessageCallback,
} from "./gyms/kosmos/KosmosTelegramMessageHandler.ts";
import { FileVisitorDatastore as VisitorDatastore } from "./persistence/FileVisitorDatastore.ts";
import { FileAppDatastore as AppDatastore } from "./persistence/FileAppDatastore.ts";
import { VisitorStatusEvent } from "./core/Events.ts";
import { handleDefaultTelegramMessage } from "./telegram/TelegramDefaultMessageHandler.ts";
import { handleNewVisitorStatus } from "./notification/GymChangeStatusHandler.ts";

const EVERY_MINUTES = +(Deno.env.get("EVERY_MINUTES") || "5");

logger.info("Bootstrapping app");

const db = new VisitorDatastore();
await db.init();
const appDb = new AppDatastore();
await appDb.init();

VisitorStatusEvent.attach((event) => handleNewVisitorStatus(appDb, event));

addCallbackHandler((msg) =>
  handleKosmosTelegramMessageCallback(db, appDb, msg)
);
addMessageHandler((msg) => handleKosmosTelegramMessage(db, appDb, msg));
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
