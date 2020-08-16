import { Evt, telegram } from "../deps.ts";
import { BLOC_COMMANDS } from "../gyms/bloc_bouldering/BlocTelegramMessageHandler.ts";
import { BLOC_NOLIMIT_COMMANDS } from "../gyms/bloc_nolimit/BlocNoLimitTelegramMessageHandler.ts";
import { KOSMOS_COMMANDS } from "../gyms/kosmos/KosmosTelegramMessageHandler.ts";
import { logger } from "../log.ts";
import {
  CallbackQuery,
  IncomingMessage,
  OutgoingCallbackAnswerMessage,
} from "./TelegramTypes.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const bot = new telegram.Bot(TELEGRAM_BOT_TOKEN);

const MessageEvent = new Evt<IncomingMessage>();
const CallbackEvent = new Evt<CallbackQuery>();

export function sendMessage(
  outgoingMessage: telegram.types.SendMessageParameters,
) {
  bot.telegram.sendMessage(outgoingMessage);
}

export function answerCallbackQuery(
  outgoingMessage: OutgoingCallbackAnswerMessage,
) {
  bot.telegram.answerCallbackQuery(outgoingMessage);
}

export function addMessageHandler(handler: (msg: IncomingMessage) => void) {
  MessageEvent.attach(handler);
}

export function addCallbackHandler(handler: (callback: CallbackQuery) => void) {
  CallbackEvent.attach(handler);
}

export function start() {
  _registerBotHandler();
  _registerBotCommand();
  bot.launch();
  logger.info("Telegram Bot started");
}

export function stop() {
  bot.stop();
  logger.info("Telegram Bot has been stopped");
}

function _registerBotHandler() {
  bot.on(["message", "callback_query"], (ctx) => {
    logger.debug("Telegram Message - start incoming message process");
    ctx.message && MessageEvent.postAsyncOnceHandled(ctx.message);
    ctx.callbackQuery && CallbackEvent.postAsyncOnceHandled(ctx.callbackQuery);
    logger.debug("Telegram Message - done message processing");
  });
}

function _registerBotCommand() {
  bot.telegram.setMyCommands([
    { command: "start", description: "Show commands" },
    ...KOSMOS_COMMANDS,
    ...BLOC_COMMANDS,
    ...BLOC_NOLIMIT_COMMANDS,
  ]);
}
