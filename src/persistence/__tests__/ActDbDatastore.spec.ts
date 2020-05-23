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
  await delay(0); // fixed false positive like https://github.com/denoland/deno/pull/4602
  for (const dirEntry of Deno.readDirSync("tmp/actDatabase/")) {
    assertEquals(dirEntry.name.endsWith("_actdb.json"), true);
  }
});

Deno.test("actdb - testing datastore read", async () => {
  fs.ensureDirSync("tmp/actDatabase2");
  fs.emptyDirSync("tmp/actDatabase2");
  const db = new ActDbDatastore("tmp/actDatabase2");
  await db.init();
  const lastStatus = await db.getLatestVisitorStatus(Gym.KOSMOS);
  delete lastStatus.timestamp;
  await delay(0);
  assertEquals(lastStatus, {
    visitorStatus: { count: 0, status: VisitorStatus.UNKNOWN },
  });
});

Deno.test("actdb - testing datastore insert and select", async () => {
  fs.ensureDirSync("tmp/actDatabase3");
  fs.emptyDirSync("tmp/actDatabase3");
  const db = new ActDbDatastore("tmp/actDatabase3");
  await db.init();

  await db.insertVisitor(Gym.KOSMOS, {
    timestamp: new Date(2020, 1, 1, 10, 1, 30),
    visitorStatus: { count: 10, status: VisitorStatus.FREE },
  });
  await db.insertVisitor(Gym.KOSMOS, {
    timestamp: new Date(2020, 1, 1, 10, 2, 30),
    visitorStatus: { count: 12, status: VisitorStatus.FREE },
  });
  await db.insertVisitor(Gym.KOSMOS, {
    timestamp: new Date(2020, 1, 1, 10, 3, 30),
    visitorStatus: { count: 11, status: VisitorStatus.FREE },
  });
  const latestVisitorStatus = await db.getLatestVisitorStatus(Gym.KOSMOS);
  await delay(0);
  assertEquals(latestVisitorStatus.timestamp, new Date(2020, 1, 1, 10, 3, 30));
  assertEquals(latestVisitorStatus.visitorStatus, {
    count: 11,
    status: VisitorStatus.FREE,
  });
});
