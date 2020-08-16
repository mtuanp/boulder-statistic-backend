import "https://deno.land/x/dotenv/load.ts";

import { Cron } from "./deps.ts";
import { logger } from "./log.ts";

import {
  KosmosVisitorLiveEmitter,
  KosmosParser,
  handleKosmosTelegramMessage,
  handleKosmosTelegramMessageCallback,
} from "./gyms/kosmos/index.ts";

import {
  handleBlocTelegramMessage,
  handleBlocTelegramMessageCallback,
  BlocVisitorLiveEmitter,
  BlocParser,
} from "./gyms/bloc_bouldering/index.ts";

import {
  handleBlocNoLimitTelegramMessageCallback,
  handleBlocNoLimitTelegramMessage,
  BlocNoLimitVisitorLiveEmitter,
  BlocNoLimitParser,
} from "./gyms/bloc_nolimit/index.ts";

import {
  start,
  addMessageHandler,
  addCallbackHandler,
  stop,
} from "./telegram/TelegramBot.ts";
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

addCallbackHandler((msg) => handleBlocTelegramMessageCallback(db, appDb, msg));
addMessageHandler((msg) => handleBlocTelegramMessage(db, appDb, msg));

addCallbackHandler((msg) =>
  handleBlocNoLimitTelegramMessageCallback(db, appDb, msg)
);
addMessageHandler((msg) => handleBlocNoLimitTelegramMessage(db, appDb, msg));

addMessageHandler(handleDefaultTelegramMessage);
start();

const cron = new Cron();

const kosmosEmitter = new KosmosVisitorLiveEmitter(
  db,
  VisitorStatusEvent,
  new KosmosParser(),
);
const kosmosWorkingHour = (Deno.env.get("KOSMOS_WORKING_HOUR") || "8-22")
  .split("-")
  .map((x) => +x);

const blocEmitter = new BlocVisitorLiveEmitter(
  db,
  VisitorStatusEvent,
  new BlocParser(),
);
const blocWorkingHour = (Deno.env.get("BLOC_WORKING_HOUR") || "8-22")
  .split("-")
  .map((x) => +x);

const blocNoLimitEmitter = new BlocNoLimitVisitorLiveEmitter(
  db,
  VisitorStatusEvent,
  new BlocNoLimitParser(),
);
const blocNoLimitWorkingHour =
  (Deno.env.get("BLOC_NOLIMIT_WORKING_HOUR") || "8-22")
    .split("-")
    .map((x) => +x);

// cron
cron.add(Deno.env.get("CRON") || "*/5 10-22 * * *", () => {
  kosmosEmitter
    .emitActualVisitor()
    .then(() => logger.info("Kosmos status emitted"))
    .catch((error) => logger.error("Kosmos error", error));
  blocEmitter
    .emitActualVisitor()
    .then(() => logger.info("Bloc bouldering status emitted"))
    .catch((error) => logger.error("Bloc bouldering error", error));
  blocNoLimitEmitter
    .emitActualVisitor()
    .then(() => logger.info("Bloc climbing status emitted"))
    .catch((error) => logger.error("Bloc climbing error", error));
});

cron.start();

logger.info("App started");

await Deno.signal(Deno.Signal.SIGINT);
logger.info("Shutdown the App");
stop();
logger.info("Bye Bye");
Deno.exit(0);
