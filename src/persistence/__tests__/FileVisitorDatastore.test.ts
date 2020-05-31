import { FileVisitorDatastore } from "../FileVisitorDatastore.ts";
import { assertEquals } from "../../deps.ts";
import { fs } from "../../deps.ts";
import { Gym } from "../../core/Gym.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";
import { delay, buildDateString } from "../../core/Utils.ts";

const createDataPathMap = (path: String) => {
  const dataPathMap = new Map();
  dataPathMap.set(Gym.KOSMOS, { path });
  return dataPathMap;
};

Deno.test("FileVisitorDatastore - testing datastore init", async () => {
  fs.ensureDirSync("tmp/visitDatabase");
  fs.emptyDirSync("tmp/visitDatabase");
  const db = new FileVisitorDatastore(createDataPathMap("tmp/visitDatabase"));
  await db.init();
  await db.insertVisitor(Gym.KOSMOS, {
    timestamp: new Date(),
    visitorStatus: { count: 10, status: VisitorStatus.FREE },
  });
  await delay(0); // fixed false positive like https://github.com/denoland/deno/pull/4602
  for (const dirEntry of Deno.readDirSync("tmp/visitDatabase/")) {
    assertEquals(dirEntry.name.endsWith(".json"), true);
  }
});

Deno.test("FileVisitorDatastore - testing datastore read", async () => {
  fs.ensureDirSync("tmp/visitDatabase2");
  fs.emptyDirSync("tmp/visitDatabase2");

  const db = new FileVisitorDatastore(createDataPathMap("tmp/visitDatabase2"));
  await db.init();
  const lastStatus = await db.getLatestVisitorStatus(Gym.KOSMOS);
  delete lastStatus.timestamp;
  await delay(0);
  assertEquals(lastStatus, {
    visitorStatus: { count: 0, status: VisitorStatus.UNKNOWN },
  });
});

Deno.test(
  "FileVisitorDatastore - testing datastore read existing",
  async () => {
    fs.ensureDirSync("tmp/visitDatabase2");
    fs.emptyDirSync("tmp/visitDatabase2");
    const now = new Date();
    const dateString = buildDateString(now);
    const filePath = `tmp/visitDatabase2/${dateString}.json`;
    const expectedStatusEntry = {
      timestamp: now,
      visitorStatus: { count: 0, status: VisitorStatus.UNKNOWN },
    };
    fs.writeJsonSync(filePath, [expectedStatusEntry]);
    const db = new FileVisitorDatastore(
      createDataPathMap("tmp/visitDatabase2"),
    );
    await db.init();
    const lastStatus = await db.getLatestVisitorStatus(Gym.KOSMOS);
    await delay(0);
    assertEquals(lastStatus, expectedStatusEntry);
  },
);

Deno.test(
  "FileVisitorDatastore - testing datastore insert and select",
  async () => {
    fs.ensureDirSync("tmp/visitDatabase3");
    fs.emptyDirSync("tmp/visitDatabase3");
    const db = new FileVisitorDatastore(
      createDataPathMap("tmp/visitDatabase3"),
    );
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
    assertEquals(
      latestVisitorStatus.timestamp,
      new Date(2020, 1, 1, 10, 3, 30),
    );
    assertEquals(latestVisitorStatus.visitorStatus, {
      count: 11,
      status: VisitorStatus.FREE,
    });
  },
);
