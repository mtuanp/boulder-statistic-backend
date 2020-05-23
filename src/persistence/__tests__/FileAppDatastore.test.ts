import { Gym } from "../../core/Gym.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";
import { assertEquals, fs } from "../../deps.ts";
import { FileAppDatastore } from "../FileAppDatastore.ts";

Deno.test("FileAppDatastore - testing datastore init", async () => {
  fs.ensureDirSync("tmp/appDatbase");
  fs.emptyDirSync("tmp/appDatbase");
  const db = new FileAppDatastore("tmp/appDatbase");
  await db.init();
  assertEquals(db.userNotificationSettings, []);
});

Deno.test(
  "FileAppDatastore - testing datastore init existing json",
  async () => {
    fs.ensureDirSync("tmp/appDatbase");
    fs.emptyDirSync("tmp/appDatbase");
    const expectingUserNotification = {
      userNotification: [
        {
          chat_id: 42,
          threshold: VisitorStatus.ALMOST_FULL,
          gym: Gym.KOSMOS,
          lastAlmostFullNotification: undefined,
          lastFreeNotification: undefined,
          lastFullNotification: undefined,
        },
      ],
    };
    fs.writeJsonSync("tmp/appDatbase/app.json", expectingUserNotification);
    const db = new FileAppDatastore("tmp/appDatbase");
    await db.init();
    assertEquals(
      db.userNotificationSettings,
      expectingUserNotification.userNotification,
    );
  },
);

Deno.test("FileAppDatastore - testing datastore read", async () => {
  fs.ensureDirSync("tmp/appDatbase2");
  fs.emptyDirSync("tmp/appDatbase2");

  const db = new FileAppDatastore("tmp/appDatbase2");
  await db.init();
  const userNotification = await db.getUserNotification(42, Gym.KOSMOS);
  assertEquals(userNotification, undefined);
});

Deno.test("FileAppDatastore - testing datastore read existing", async () => {
  fs.ensureDirSync("tmp/appDatbase");
  fs.emptyDirSync("tmp/appDatbase");
  const expectingUserNotification = {
    userNotification: [
      {
        chat_id: 42,
        threshold: VisitorStatus.ALMOST_FULL,
        gym: Gym.KOSMOS,
        lastAlmostFullNotification: undefined,
        lastFreeNotification: undefined,
        lastFullNotification: undefined,
      },
    ],
  };
  fs.writeJsonSync("tmp/appDatbase/app.json", expectingUserNotification);
  const db = new FileAppDatastore("tmp/appDatbase");
  await db.init();
  const userNotification = await db.getUserNotification(42, Gym.KOSMOS);

  assertEquals(userNotification, expectingUserNotification.userNotification[0]);
});

Deno.test(
  "FileAppDatastore - testing datastore insert and select",
  async () => {
    fs.ensureDirSync("tmp/appDatbase3");
    fs.emptyDirSync("tmp/appDatbase3");
    const db = new FileAppDatastore("tmp/appDatbase3");
    await db.init();

    await db.addOrUpdateUserNotification({
      chat_id: 42,
      gym: Gym.KOSMOS,
      threshold: VisitorStatus.ALMOST_FULL,
    });
    await db.addOrUpdateUserNotification({
      chat_id: 66,
      gym: Gym.KOSMOS,
      threshold: VisitorStatus.ALMOST_FULL,
    });
    await db.addOrUpdateUserNotification({
      chat_id: 42,
      gym: Gym.KOSMOS,
      threshold: VisitorStatus.FULL,
    });
    const userNotification = await db.getUserNotification(42, Gym.KOSMOS);
    assertEquals(userNotification, {
      chat_id: 42,
      gym: Gym.KOSMOS,
      threshold: VisitorStatus.FULL,
    });
  },
);
