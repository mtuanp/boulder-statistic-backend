import { extractBotCommand } from "../core/Utils.ts";
import { sendMessage } from "./TelegramBot.ts";
import { IncomingMessage } from "./TelegramTypes.ts";

const excludedBotCommand = ["/kosmos"];
const CommandHelpMsg =
  "following commands are available: - /kosmosstatus: get the latest visitor status from kosmos";

export async function handleDefaultTelegramMessage(
  incomingMessage: IncomingMessage,
): Promise<void> {
  const { chat, type, botCommand } = extractBotCommand(incomingMessage);
  if (type === "bot_command" && botCommand === "/start") {
    sendMessage({
      chat_id: chat.id,
      text: `Welcome ` + CommandHelpMsg,
    });
  } else if (
    type !== "bot_command" ||
    (type === "bot_command" &&
      excludedBotCommand.every((ex) => !botCommand.startsWith(ex)))
  ) {
    sendMessage({
      chat_id: chat.id,
      text: CommandHelpMsg,
    });
  }
}
