import { IncomingMessage } from "../telegram/TelegramTypes.ts";
import { logger } from "../log.ts";
import { sendMessage } from "../telegram/TelegramBot.ts";
import { KosmosParser } from "./KosmosParser.ts";

export async function handleTelegramMessage(
  incomingMessage: IncomingMessage
): Promise<void> {
  const { message_id, text, entities, chat } = incomingMessage;
  const { length, offset, type } = entities?.[0];
  if (
    type === "bot_command" &&
    text?.substr(offset, length).startsWith("/kosmos")
  ) {
    const parameter = text?.substr(offset + length, text.length).trim();
    logger.debug(parameter);
    if (parameter === "status") {
      sendMessage(
        chat.id,
        `Kosmos actual visitors: ${
          (await new KosmosParser().parseActualVisitorStatus()).count
        }`,
        message_id
      );
    }
    logger.debug(parameter!);
  }
}
