import { AppDatastore } from "../core/AppDatastore.ts";
import { UserNotificationSetting } from "../core/NotificationSetting.ts";
import { VisitorEventData } from "../core/VisitorEventData.ts";
import { VisitorStatus } from "../core/VisitorResult.ts";
import { sendMessage } from "../telegram/TelegramBot.ts";
import { OutgoingMessage } from "../telegram/TelegramTypes.ts";

export async function handleNewVisitorStatus(
  appDatastore: AppDatastore,
  {
    gym,
    actualVisitorStatus: {
      timestamp: actualTimestamp,
      visitorStatus: actualVisitorStatus,
    },
    lastVisitorStatus: {
      timestamp: latestTimestamp,
      visitorStatus: latestVisitorStatus,
    },
  }: VisitorEventData,
): Promise<void> {
  if (
    skipNotification(
      actualVisitorStatus.status,
      actualTimestamp,
      latestVisitorStatus.status,
      latestTimestamp,
    )
  ) {
    return;
  }
  return appDatastore
    .getAllUserNotification(gym)
    .then((allUserNotifications) =>
      findUsersAndNotify(
        actualVisitorStatus.status,
        allUserNotifications,
        sendMessage,
      ),
    );
}

export function skipNotification(
  actualVisitorStatus: VisitorStatus,
  actualTimestamp: Date,
  latestVisitorStatus: VisitorStatus,
  latestTimestamp: Date,
): boolean {
  return (
    actualVisitorStatus === VisitorStatus.UNKNOWN ||
    latestVisitorStatus === VisitorStatus.UNKNOWN ||
    latestTimestamp.getDate() !== actualTimestamp.getDate() ||
    actualVisitorStatus === latestVisitorStatus
  );
}

export function findUsersAndNotify(
  actualVisitorStatus: VisitorStatus,
  allUserNotifications: UserNotificationSetting[],
  sendMessage: (outgoingMessage: OutgoingMessage) => void,
): void {
  allUserNotifications.find((not) => actualVisitorStatus <= not.threshold);
  allUserNotifications.find((not) => actualVisitorStatus > not.threshold);
}
