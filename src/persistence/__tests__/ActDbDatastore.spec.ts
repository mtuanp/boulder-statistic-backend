import { ActDbDatastore } from "../ActDbDatastore.ts";
import { assertEquals } from "../../deps.ts";
import { fs } from "../../deps.ts";
import { Gym } from "../../core/Gym.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";
import { delay } from "../../core/Utils.ts";

Deno.test("actdb - testing datastore init", async () => {
  fs.ensureDirSync("tmp/actDatabase");
  fs.emptyDirSync("tmp/actDatabase");
  const db = new ActDbDatastore("tmp/actDatabase");
  await db.init();
  await db.insertVisitor(Gym.KOSMOS, {
    timestamp: new Date(),
    visitorStatus: { count: 10, status: VisitorStatus.FREE },
  });
  await delay(0);
  assertEquals(fs.existsSync("tmp/actDatabase/*.json"), true);
});

// Deno.test("actdb - testing datastore insert and select", async () => {
//   fs.ensureDirSync("tmp/actDatabase2");
//   fs.emptyDirSync("tmp/actDatabase2");
//   const db = new ActDbDatastore("tmp/actDatabase2b");
//   await db.init();

//   await db.insertVisitor({
//     gym: Gym.KOSMOS,
//     timestamp: new Date(2020, 1, 1, 10, 1, 30),
//     visitorStatus: { count: 10, status: VisitorStatus.FREE },
//   });
//   await db.insertVisitor({
//     gym: Gym.KOSMOS,
//     timestamp: new Date(2020, 1, 1, 10, 3, 30),
//     visitorStatus: { count: 11, status: VisitorStatus.FREE },
//   });
//   await db.insertVisitor({
//     gym: Gym.KOSMOS,
//     timestamp: new Date(2020, 1, 1, 10, 2, 30),
//     visitorStatus: { count: 12, status: VisitorStatus.FREE },
//   });
//   const latestVisitorStatus = await db.getLatestVisitorStatus(Gym.KOSMOS);
//   assertEquals(latestVisitorStatus.timestamp, new Date(2020, 1, 1, 10, 3, 30));
//   assertEquals(latestVisitorStatus.visitorStatus, {
//     count: 11,
//     status: VisitorStatus.FREE,
//   });
//   await db.saveAndClose();
// });
