import { VisitorDatastore } from "../core/VisitorDatastore.ts";
import { Gym } from "../core/Gym.ts";
import { statusEnumToString, extractBotCommand } from "../core/Utils.ts";
import { logger } from "../log.ts";
import { sendMessage } from "../telegram/TelegramBot.ts";
import { IncomingMessage } from "../telegram/TelegramTypes.ts";

export async function handleKosmosTelegramMessage(
  datastore: VisitorDatastore,
  incomingMessage: IncomingMessage,
): Promise<void> {
  const { chat, type, botCommand } = extractBotCommand(incomingMessage);
  if (type === "bot_command" && botCommand.startsWith("/kosmos")) {
    switch (botCommand) {
      case "/kosmosstatus":
        datastore
          .getLatestVisitorStatus(Gym.KOSMOS)
          .then((latestVisitorStatus) => {
            sendMessage({
              chat_id: chat.id,
              text:
                `Kosmos lastUpdate at ${latestVisitorStatus.timestamp.toLocaleDateString()} ${latestVisitorStatus.timestamp.toLocaleTimeString()} | status: ${
                  statusEnumToString(
                    latestVisitorStatus.visitorStatus.status,
                  )
                } |  visitors: ${latestVisitorStatus.visitorStatus.count}`,
            });
          })
          .catch((error) => {
            sendMessage({
              chat_id: chat.id,
              text: `Error something unexpected happens.`,
            });
            logger.error("can't send last kosmos status", error);
          });
        break;
      case "/kosmoshelp":
      default:
        sendMessage({
          chat_id: chat.id,
          text:
            "following Kosmos command are available: /kosmosstatus - get latest visitor status from kosmos",
        });
    }
  }
}
