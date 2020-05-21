import { SQLiteDatastore } from "../SQLiteDatastore.ts";
import { assertEquals } from "../../deps.ts";
import { fs } from "../../deps.ts";
import { Gym } from "../../core/Gym.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";

Deno.test("testing datastore init", async () => {
  fs.ensureDirSync("tmp/database");
  fs.emptyDirSync("tmp/database");
  const db = new SQLiteDatastore("tmp/database/datastore.db");
  await db.init();
  assertEquals(fs.existsSync("tmp/database/datastore.db"), true);
});

Deno.test("testing datastore insert and select", async () => {
  fs.ensureDirSync("tmp/database");
  fs.emptyDirSync("tmp/database");
  const db = new SQLiteDatastore("tmp/database/datastore.db");
  await db.init();

  await db.insertVisitor({
    gym: Gym.KOSMOS,
    timestamp: new Date(2020, 1, 1, 10, 1, 30),
    visitorStatus: { count: 10, status: VisitorStatus.FREE },
  });
  await db.insertVisitor({
    gym: Gym.KOSMOS,
    timestamp: new Date(2020, 1, 1, 10, 3, 30),
    visitorStatus: { count: 11, status: VisitorStatus.FREE },
  });
  await db.insertVisitor({
    gym: Gym.KOSMOS,
    timestamp: new Date(2020, 1, 1, 10, 2, 30),
    visitorStatus: { count: 12, status: VisitorStatus.FREE },
  });
  const latestVisitorStatus = await db.getLatestVisitorStatus(Gym.KOSMOS);
  assertEquals(latestVisitorStatus.timestamp, new Date(2020, 1, 1, 10, 3, 30));
  assertEquals(latestVisitorStatus.visitorStatus, {
    count: 11,
    status: VisitorStatus.FREE,
  });
  await db.saveAndClose();
});
