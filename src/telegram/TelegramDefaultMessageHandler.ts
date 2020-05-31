import { extractBotCommand } from "../core/Utils.ts";
import { sendMessage } from "./TelegramBot.ts";
import { IncomingMessage } from "./TelegramTypes.ts";
import { KOSMOS_INLINE_COMMANDS } from "../kosmos/KosmosTelegramMessageHandler.ts";

const excludedBotCommand = ["/kosmos"];
const CommandHelpMsg = "following command are available:";
const InlineHelpMarkup = {
  inline_keyboard: [
    KOSMOS_INLINE_COMMANDS,
  ],
};

export async function handleDefaultTelegramMessage(
  incomingMessage: IncomingMessage,
): Promise<void> {
  const { chat, type, botCommand } = extractBotCommand(incomingMessage);
  if (type === "bot_command" && botCommand === "/start") {
    sendMessage({
      chat_id: chat.id,
      text: `Welcome ` + CommandHelpMsg,
      reply_markup: InlineHelpMarkup,
    });
  } else if (
    type !== "bot_command" ||
    (type === "bot_command" &&
      excludedBotCommand.every((ex) => !botCommand.startsWith(ex)))
  ) {
    sendMessage({
      chat_id: chat.id,
      text: "following command are available:",
      reply_markup: InlineHelpMarkup,
    });
  }
}
