import { VisitorDatastore } from "../core/VisitorDatastore.ts";
import { Gym } from "../core/Gym.ts";
import { statusEnumToString, extractBotCommand } from "../core/Utils.ts";
import { logger } from "../log.ts";
import { sendMessage } from "../telegram/TelegramBot.ts";
import { IncomingMessage } from "../telegram/TelegramTypes.ts";
import { AppDatastore } from "../core/AppDatastore.ts";
import { VisitorStatus } from "../core/VisitorResult.ts";

const EVERY_MINUTES = +(Deno.env.get("EVERY_MINUTES") || "5");

export async function handleKosmosTelegramMessage(
  datastore: VisitorDatastore,
  appDatastore: AppDatastore,
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
      case "/kosmoson":
        appDatastore
          .addOrUpdateUserNotification({
            chat_id: chat.id,
            gym: Gym.KOSMOS,
            threshold: VisitorStatus.ALMOST_FULL,
          })
          .then(() => {
            sendMessage({
              chat_id: chat.id,
              text: `You will be notified when the status changes to at least ${
                statusEnumToString(
                  VisitorStatus.ALMOST_FULL,
                )
              }.`,
            });
          })
          .catch((error) => {
            sendMessage({
              chat_id: chat.id,
              text: `Error something unexpected happens.`,
            });
            logger.error("can't send registration message", error);
          });
        break;
      case "/kosmosoff":
        appDatastore
          .removeUserNotification(chat.id, Gym.KOSMOS)
          .then(() => {
            sendMessage({
              chat_id: chat.id,
              text: `You will not be notified anymore.`,
            });
          })
          .catch((error) => {
            sendMessage({
              chat_id: chat.id,
              text: `Error something unexpected happens.`,
            });
            logger.error("can't send de-registration message", error);
          });
        break;
      case "/kosmoshelp":
      default:
        sendMessage({
          chat_id: chat.id,
          text: "following Kosmos command are available:",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text:
                    "/kosmosstatus - retrieve the actual visitor status from kosmos",
                  url: "google.de",
                },
              ],
            ],
          },
        });
    }
  }
}
