import { Gym } from "../../core/Gym.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";
import { assertEquals, fs } from "../../deps.ts";
import { skipNotification } from "../GymChangeStatusHandler.ts";

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
  }),
);
