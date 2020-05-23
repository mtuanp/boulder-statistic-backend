import { Gym } from "./Gym.ts";
import { UserNotificationSetting } from "./NotificationSetting.ts";
import { VisitorStatus } from "./VisitorResult.ts";

export interface AppDatastore {
  init(): Promise<void>;
  getUserNotification(
    chat_id: number,
    gym: Gym,
  ): Promise<UserNotificationSetting | undefined>;
  addUserNotification(
    chat_id: number,
    gym: Gym,
    threshold: VisitorStatus,
  ): Promise<void>;
  updateUserNotification(userNotConfig: UserNotificationSetting): Promise<void>;
  removeUserNotification(chat_id: number, gym: Gym): Promise<void>;
}
