import { Gym } from "./Gym.ts";
import { UserNotificationSetting } from "./NotificationSetting.ts";
import { VisitorStatus } from "./VisitorResult.ts";

export interface AppDatastore {
  init(): Promise<void>;
  getAllUserNotification(gym: Gym): Promise<UserNotificationSetting[]>;
  getUserNotification(
    chat_id: number,
    gym: Gym,
  ): Promise<UserNotificationSetting | undefined>;
  addOrUpdateUserNotification(
    userNotConfig: UserNotificationSetting,
  ): Promise<void>;
  removeUserNotification(chat_id: number, gym: Gym): Promise<void>;
}
