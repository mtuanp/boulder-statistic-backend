import { VisitorDatastore } from "../core/VisitorDatastore.ts";
import { Gym } from "../core/Gym.ts";
import { statusEnumToString, extractBotCommand } from "../core/Utils.ts";
import { logger } from "../log.ts";
import { sendMessage, answerCallbackQuery } from "../telegram/TelegramBot.ts";
import { IncomingMessage, CallbackQuery } from "../telegram/TelegramTypes.ts";
import { AppDatastore } from "../core/AppDatastore.ts";
import { VisitorStatus } from "../core/VisitorResult.ts";

export const KOSMOS_INLINE_COMMANDS = [
  {
    text: "/kosmosstatus - retrieve the actual visitor status from kosmos",
    callback_data: "/kosmosstatus",
  },
  {
    text: "/kosmoson - activate the threshold notification",
    callback_data: "/kosmoson",
  },
  {
    text: "/kosmosoff - deactivate the threshold notification",
    callback_data: "/kosmosoff",
  },
];

export async function handleKosmosTelegramMessage(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
  incomingMessage: IncomingMessage,
): Promise<void> {
  const { chat, type, botCommand } = extractBotCommand(incomingMessage);
  if (type === "bot_command" && botCommand.startsWith("/kosmos")) {
    handleKosmosCommand(
      datastore,
      appDatastore,
      botCommand,
      chat.id,
      (text, reply_markup) =>
        sendMessage({
          chat_id: chat.id,
          text,
          reply_markup,
        }),
    );
  }
}

export async function handleKosmosTelegramMessageCallback(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
  callbackQuery: CallbackQuery,
): Promise<void> {
  const { data: botCommand, from } = callbackQuery;
  if (botCommand && botCommand.startsWith("/kosmos")) {
    handleKosmosCommand(
      datastore,
      appDatastore,
      botCommand,
      from.id,
      (text, _reply_markup) =>
        answerCallbackQuery({
          callback_query_id: callbackQuery.id,
          text,
          show_alert: true,
        }),
    );
  }
}

function handleKosmosCommand(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
  botCommand: string,
  userId: number,
  sendCallback: (text: string, inlineReplay?: any) => void,
) {
  switch (botCommand) {
    case "/kosmosstatus":
      handleKosmosStatus(datastore, sendCallback);
      break;
    case "/kosmoson":
      handleKosmosOn(appDatastore, userId, sendCallback);
      break;
    case "/kosmosoff":
      handleKosmosOff(appDatastore, userId, sendCallback);
      break;
    case "/kosmoshelp":
    default:
      handleKosmosHelp(sendCallback);
      break;
  }
}

function handleKosmosStatus(
  datastore: VisitorDatastore,
  sendCallback: (text: string) => void,
) {
  datastore
    .getLatestVisitorStatus(Gym.KOSMOS)
    .then((latestVisitorStatus) => {
      sendCallback(
        `Kosmos lastUpdate at ${latestVisitorStatus.timestamp.toLocaleDateString()} ${latestVisitorStatus.timestamp.toLocaleTimeString()} | status: ${
          statusEnumToString(
            latestVisitorStatus.visitorStatus.status,
          )
        } |  visitors: ${latestVisitorStatus.visitorStatus.count}`,
      );
    })
    .catch((error) => {
      sendCallback("Error something unexpected happens.");
      logger.error("can't send last kosmos status", "KOSMOS", error);
    });
}

function handleKosmosOn(
  appDatastore: AppDatastore,
  userId: number,
  sendCallback: (text: string) => void,
) {
  appDatastore
    .addOrUpdateUserNotification({
      chat_id: userId,
      gym: Gym.KOSMOS,
      threshold: VisitorStatus.ALMOST_FULL,
    })
    .then(() => {
      sendCallback(
        `You will be notified when the status changes to at least ${
          statusEnumToString(
            VisitorStatus.ALMOST_FULL,
          )
        }.`,
      );
    })
    .catch((error) => {
      sendCallback("Error something unexpected happens.");
      logger.error("can't send registration message", "KOSMOS", error);
    });
}

function handleKosmosOff(
  appDatastore: AppDatastore,
  userId: number,
  sendCallback: (text: string) => void,
) {
  appDatastore
    .removeUserNotification(userId, Gym.KOSMOS)
    .then(() => {
      sendCallback("You will not be notified anymore.");
    })
    .catch((error) => {
      sendCallback("Error something unexpected happens.");
      logger.error("can't send de-registration message", "KOSMOS", error);
    });
}

function handleKosmosHelp(
  sendCallback: (text: string, inlineReplay?: any) => void,
) {
  sendCallback("following Kosmos command are available:", {
    inline_keyboard: [
      KOSMOS_INLINE_COMMANDS,
    ],
  });
}
