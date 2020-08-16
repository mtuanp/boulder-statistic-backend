import { AppDatastore } from "../core/AppDatastore.ts";
import { UserNotificationSetting } from "../core/NotificationSetting.ts";
import { gymEnumToString, statusEnumToString } from "../core/Utils.ts";
import { VisitorEventData } from "../core/VisitorEventData.ts";
import { VisitorStatus } from "../core/VisitorResult.ts";
import { telegram } from "../deps.ts";
import { sendMessage } from "../telegram/TelegramBot.ts";

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
      )
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
  sendMessage: (outgoingMessage: telegram.types.SendMessageParameters) => void,
): void {
  allUserNotifications
    .filter((n) => actualVisitorStatus <= n.threshold)
    .map(({ chat_id, gym }) => ({
      chat_id,
      text: `${gymEnumToString(gym)} is actual ${
        statusEnumToString(
          actualVisitorStatus,
        )
      }`,
    }))
    .forEach((out) => sendMessage(out));
  allUserNotifications
    .filter((n) => actualVisitorStatus > n.threshold)
    .map(({ chat_id, gym }) => ({
      chat_id,
      text: `${gymEnumToString(gym)} is back to ${
        statusEnumToString(
          actualVisitorStatus,
        )
      }`,
    }))
    .forEach((out) => sendMessage(out));
}
