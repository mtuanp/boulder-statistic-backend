import { Evt } from "../deps.ts";
import { logger } from "../log.ts";
import { IncomingMessage, IncomingMessageUpdates } from "./TelegramTypes.ts";
import { genUrl } from "../core/UrlUtils.ts";

const TELEGRAM_BASE_URL =
  Deno.env.get("TELEGRAM_BASE_URL") || "https://api.telegram.org/bot";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const TELEGRAM_URL = TELEGRAM_BASE_URL + TELEGRAM_BOT_TOKEN;
const TELEGRAM_POLL_TIMEOUT = +(Deno.env.get("TELEGRAM_POLL_TIMEOUT") || "120");

const MessageUpdateEvent = new Evt<IncomingMessageUpdates>();
const MessageEvent = new Evt<IncomingMessage>();

export function sendMessage(
  chat_id: number,
  text: string,
  reply_to_message_id?: number,
) {
  fetch(
    genUrl(`${TELEGRAM_URL}/sendMessage`, {
      chat_id,
      text,
      reply_to_message_id,
    }),
  )
    .then(() => logger.debug("Message send done"))
    .catch((error) => logger.error("Message send error", error));
}

export function addMessageHandler(handler: (msg: IncomingMessage) => void) {
  MessageEvent.attach(handler);
}

export function start() {
  MessageUpdateEvent.attach(_onMessageUpdate);
  MessageUpdateEvent.post({ ok: true, result: [] });
  logger.info("Telegram Bot started");
}

function _onMessageUpdate(messageUpdates: IncomingMessageUpdates) {
  if (messageUpdates.ok) {
    logger.debug("Message OK - start incoming message process");
    messageUpdates.result.forEach(
      (inMsg) => inMsg.message && MessageEvent.post(inMsg.message),
    );
    const offset = messageUpdates.result.reduce(
      (_, msg) => msg.update_id + 1,
      0,
    );
    logger.debug("offset", offset);
    fetch(
      genUrl(`${TELEGRAM_URL}/getUpdates`, {
        timeout: TELEGRAM_POLL_TIMEOUT,
        offset,
      }),
    )
      .then((res) => res.json() as Promise<IncomingMessageUpdates>)
      .then((messageUpdate) => {
        MessageUpdateEvent.post(messageUpdate);
      })
      .then(() => logger.debug("Message update done"))
      .catch((error) => logger.error("Message incoming update error", error));
  } else {
    logger.error("Message Error | " + messageUpdates);
  }
}
