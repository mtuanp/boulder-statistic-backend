import { VisitorStatus } from "./VisitorResult.ts";

export type UserNotificationSetting = {
  chat_id: number;
  threshold: number | VisitorStatus;
};
