import { Datastore } from "../core/Datastore.ts";
import { Gym } from "../core/Gym.ts";
import { statusEnumToString } from "../core/Utils.ts";
import { logger } from "../log.ts";
import { sendMessage } from "../telegram/TelegramBot.ts";
import { IncomingMessage } from "../telegram/TelegramTypes.ts";

export async function handleKosmosTelegramMessage(
  datastore: Datastore,
  incomingMessage: IncomingMessage,
): Promise<void> {
  const { text, entities, chat } = incomingMessage;
  const { length, offset, type } =
    entities && entities.length > 0
      ? entities[0]
      : { length: 0, offset: 0, type: "" };
  const botCommand = text?.substr(offset, length).toLowerCase();
  if (
    type === "bot_command" &&
    botCommand &&
    botCommand.startsWith("/kosmos")
  ) {
    switch (botCommand) {
      case "/kosmosstatus":
        datastore
          .getLatestVisitorStatus(Gym.KOSMOS)
          .then((latestVisitorStatus) => {
            sendMessage({
              chat_id: chat.id,
              text: `Kosmos lastUpdate at ${latestVisitorStatus.timestamp.toLocaleDateString()} ${latestVisitorStatus.timestamp.toLocaleTimeString()} | status: ${statusEnumToString(
                latestVisitorStatus.visitorStatus.status,
              )} |  visitors: ${latestVisitorStatus.visitorStatus.count}`,
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
