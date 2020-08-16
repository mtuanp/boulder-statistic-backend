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
  BotCommand,
} from "../../telegram/TelegramTypes.ts";
import { AppDatastore } from "../../core/AppDatastore.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";

export const BLOC_NOLIMIT_COMMANDS: BotCommand[] = [
  {
    command: "bloc_climbingstatus",
    description: "retrieve the actual visitor status from bloc climbing",
  },
  {
    command: "bloc_climbingon",
    description: "activate the threshold notification",
  },
  {
    command: "bloc_climbingoff",
    description: "deactivate the threshold notification",
  },
];

export const BLOC_NOLIMIT_INLINE_COMMANDS = BLOC_NOLIMIT_COMMANDS.map((
  { command, description },
) => ({
  text: `/${command} - ${description}`,
  callback_data: `/${command}`,
}));

export async function handleBlocNoLimitTelegramMessage(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
  incomingMessage: IncomingMessage,
): Promise<void> {
  const { chat, type, botCommand } = extractBotCommand(incomingMessage);
  if (type === "bot_command" && botCommand.startsWith("/bloc_climbing")) {
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

export async function handleBlocNoLimitTelegramMessageCallback(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
  callbackQuery: CallbackQuery,
): Promise<void> {
  const { data: botCommand, from } = callbackQuery;
  if (botCommand && botCommand.startsWith("/bloc_climbing")) {
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
  sendCallback: (text: string, inlineReplay?: object) => void,
) {
  switch (botCommand) {
    case "/bloc_climbingstatus":
      handleBlocStatus(datastore, sendCallback);
      break;
    case "/bloc_climbingon":
      handleBlocOn(appDatastore, userId, sendCallback);
      break;
    case "/bloc_climbingoff":
      handleBlocOff(appDatastore, userId, sendCallback);
      break;
    case "/bloc_climbinghelp":
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
    .getLatestVisitorStatus(Gym.BLOC_NO_LIMIT_CLIMBING)
    .then((latestVisitorStatus) => {
      sendCallback(
        `Bloc climbing lastUpdate at ${latestVisitorStatus.timestamp.toLocaleDateString()} ${latestVisitorStatus.timestamp.toLocaleTimeString()} | status: ${
          statusEnumToString(
            latestVisitorStatus.visitorStatus.status,
          )
        }`,
      );
    })
    .catch((error) => {
      sendCallback("Error something unexpected happens.");
      logger.error("can't send last bloc_climbing status", "BLOC", error);
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
      gym: Gym.BLOC_NO_LIMIT_CLIMBING,
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
    .removeUserNotification(userId, Gym.BLOC_NO_LIMIT_CLIMBING)
    .then(() => {
      sendCallback("You will not be notified anymore.");
    })
    .catch((error) => {
      sendCallback("Error something unexpected happens.");
      logger.error("can't send de-registration message", "BLOC", error);
    });
}

function handleBlocHelp(
  sendCallback: (text: string, inlineReplay?: object) => void,
) {
  sendCallback("following Bloc climbing command are available:", {
    inline_keyboard: [
      BLOC_NOLIMIT_INLINE_COMMANDS,
    ],
  });
}
