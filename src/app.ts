import { Cron } from "https://deno.land/x/cron/cron.ts";
import "https://deno.land/x/dotenv/load.ts";

import { VisitorLiveEmitterImpl } from "./live/VisitorLiveEmitter.ts";
import { KosmosParser } from "./kosmos/KosmosParser.ts";

const EVERY_MINUTES = +(Deno.env.get("EVERY_MINUTES") || "5");

const cron = new Cron();
cron.start();

const kosmosEmitter = new VisitorLiveEmitterImpl(
  Deno.env.get("KOSMOS_LIVE_PATH") || "./kosmos.live.json",
  new KosmosParser()
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
      .then(() => console.log(`${date.toString()}: Kosmos emitted`))
      .catch((error) =>
        console.log(`${date.toString()}: Kosmos error | ${error}`)
      );
  }
});

console.table(cron.cronJobs);
