import { Gym } from "../../core/Gym.ts";
import { UserNotificationSetting } from "../../core/NotificationSetting.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";
import { assertEquals } from "../../deps.ts";
import {
  findUsersAndNotify,
  skipNotification,
} from "../GymChangeStatusHandler.ts";

[
  [VisitorStatus.UNKNOWN, new Date(), VisitorStatus.UNKNOWN, new Date(), true],
  [VisitorStatus.FREE, new Date(), VisitorStatus.UNKNOWN, new Date(), true],
  [
    VisitorStatus.FREE,
    new Date(2020, 4, 11),
    VisitorStatus.ALMOST_FULL,
    new Date(2020, 4, 10),
    true,
  ],
  [
    VisitorStatus.FREE,
    new Date(2020, 4, 11),
    VisitorStatus.FREE,
    new Date(2020, 4, 11),
    true,
  ],
  [
    VisitorStatus.ALMOST_FULL,
    new Date(2020, 4, 11),
    VisitorStatus.ALMOST_FULL,
    new Date(2020, 4, 11),
    true,
  ],
  [
    VisitorStatus.FREE,
    new Date(2020, 4, 11),
    VisitorStatus.ALMOST_FULL,
    new Date(2020, 4, 11),
    false,
  ],
].forEach((data, index) =>
  Deno.test(`GymChangeStatusHandler case ${index} - testing skips`, () => {
    assertEquals(
      skipNotification(
        data[0] as VisitorStatus,
        data[1] as Date,
        data[2] as VisitorStatus,
        data[3] as Date,
      ),
      data[4],
    );
  })
);

Deno.test("GymChangeStatusHandler - testing findUsersAndNotify", () => {
  const notSettings: UserNotificationSetting[] = [
    { chat_id: 42, threshold: VisitorStatus.ALMOST_FULL, gym: Gym.KOSMOS },
    { chat_id: 44, threshold: VisitorStatus.FULL, gym: Gym.KOSMOS },
  ];
  const expectedOut = [
    {
      chat_id: 42,
      text: "Boulderhalle Kosmos is actual almost full",
    },
    {
      chat_id: 44,
      text: "Boulderhalle Kosmos is back to almost full",
    },
  ];
  let index = 0;
  findUsersAndNotify(
    VisitorStatus.ALMOST_FULL,
    notSettings,
    (out) => assertEquals(out, expectedOut[index++]),
  );
});

Deno.test("GymChangeStatusHandler - testing findUsersAndNotify 2", () => {
  const notSettings: UserNotificationSetting[] = [
    { chat_id: 42, threshold: VisitorStatus.ALMOST_FULL, gym: Gym.KOSMOS },
    { chat_id: 44, threshold: VisitorStatus.FULL, gym: Gym.KOSMOS },
  ];
  const expectedOut = [
    {
      chat_id: 42,
      text: "Boulderhalle Kosmos is actual full",
    },
    {
      chat_id: 44,
      text: "Boulderhalle Kosmos is actual full",
    },
  ];
  let index = 0;
  findUsersAndNotify(
    VisitorStatus.FULL,
    notSettings,
    (out) => assertEquals(out, expectedOut[index++]),
  );
});
