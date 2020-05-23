import { Gym } from "./Gym.ts";
import { VisitorStatus } from "./VisitorResult.ts";

export type UserNotificationSetting = {
  chat_id: number;
  threshold: VisitorStatus;
  gym: Gym;
  lastFreeNotification?: Date;
  lastAlmostFullNotification?: Date;
  lastFullNotification?: Date;
};
