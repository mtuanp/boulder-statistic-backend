import { VisitorDatastore } from "../../core/VisitorDatastore.ts";
import { Gym } from "../../core/Gym.ts";
import { statusEnumToString, extractBotCommand } from "../../core/Utils.ts";
import { logger } from "../../log.ts";
import {
  sendMessage,
  answerCallbackQuery,
} from "../../telegram/TelegramBot.ts";
import {
  IncomingMessage,
  CallbackQuery,
} from "../../telegram/TelegramTypes.ts";
import { AppDatastore } from "../../core/AppDatastore.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";

export const BLOC_INLINE_COMMANDS = [
  {
    text: "/blocstatus - retrieve the actual visitor status from bloc",
    callback_data: "/blocstatus",
  },
  {
    text: "/blocon - activate the threshold notification",
    callback_data: "/blocon",
  },
  {
    text: "/blocoff - deactivate the threshold notification",
    callback_data: "/blocoff",
  },
];

export async function handleBlocTelegramMessage(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
  incomingMessage: IncomingMessage,
): Promise<void> {
  const { chat, type, botCommand } = extractBotCommand(incomingMessage);
  if (type === "bot_command" && botCommand.startsWith("/bloc")) {
    handleBlocCommand(
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

export async function handleBlocTelegramMessageCallback(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
  callbackQuery: CallbackQuery,
): Promise<void> {
  const { data: botCommand, from } = callbackQuery;
  if (botCommand && botCommand.startsWith("/bloc")) {
    handleBlocCommand(
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

function handleBlocCommand(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
  botCommand: string,
  userId: number,
  sendCallback: (text: string, inlineReplay?: any) => void,
) {
  switch (botCommand) {
    case "/blocstatus":
      handleBlocStatus(datastore, sendCallback);
      break;
    case "/blocon":
      handleBlocOn(appDatastore, userId, sendCallback);
      break;
    case "/blocoff":
      handleBlocOff(appDatastore, userId, sendCallback);
      break;
    case "/blochelp":
    default:
      handleBlocHelp(sendCallback);
      break;
  }
}

function handleBlocStatus(
  datastore: VisitorDatastore,
  sendCallback: (text: string) => void,
) {
  datastore
    .getLatestVisitorStatus(Gym.BLOC_NO_LIMIT_BOULDERING)
    .then((latestVisitorStatus) => {
      sendCallback(
        `Bloc bouldering lastUpdate at ${latestVisitorStatus.timestamp.toLocaleDateString()} ${latestVisitorStatus.timestamp.toLocaleTimeString()} | status: ${
          statusEnumToString(
            latestVisitorStatus.visitorStatus.status,
          )
        } |  visitors: ${latestVisitorStatus.visitorStatus.count}`,
      );
    })
    .catch((error) => {
      sendCallback("Error something unexpected happens.");
      logger.error("can't send last bloc status", "BLOC", error);
    });
}

function handleBlocOn(
  appDatastore: AppDatastore,
  userId: number,
  sendCallback: (text: string) => void,
) {
  appDatastore
    .addOrUpdateUserNotification({
      chat_id: userId,
      gym: Gym.BLOC_NO_LIMIT_BOULDERING,
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
      logger.error("can't send registration message", "BLOC", error);
    });
}

function handleBlocOff(
  appDatastore: AppDatastore,
  userId: number,
  sendCallback: (text: string) => void,
) {
  appDatastore
    .removeUserNotification(userId, Gym.BLOC_NO_LIMIT_BOULDERING)
    .then(() => {
      sendCallback("You will not be notified anymore.");
    })
    .catch((error) => {
      sendCallback("Error something unexpected happens.");
      logger.error("can't send de-registration message", "BLOC", error);
    });
}

function handleBlocHelp(
  sendCallback: (text: string, inlineReplay?: any) => void,
) {
  sendCallback("following BlocBouldering command are available:", {
    inline_keyboard: [
      BLOC_INLINE_COMMANDS,
    ],
  });
}
