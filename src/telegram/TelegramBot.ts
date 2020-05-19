import { Evt } from "https://deno.land/x/evt/mod.ts";

import { logger } from "../log.ts";
import { Message, MessageUpdates } from "./TelegramTypes.ts";

const TELEGRAM_BASE_URL = Deno.env.get("TELEGRAM_BASE_URL") ||
  "https://api.telegram.org/bot";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_POLL_TIMEOUT = +(Deno.env.get("TELEGRAM_POLL_TIMEOUT") || "120");

const MessageUpdateEvent = new Evt<MessageUpdates>();
const MessageEvent = new Evt<Message>();

export function sendMessage(
  chat_id: string,
  msg: string,
  reply_to_message_id?: string,
) {
  fetch(
    `${TELEGRAM_BASE_URL}${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chat_id}&text=${msg}${
      reply_to_message_id ? `&reply_to_message_id=${reply_to_message_id}` : ""
    }`,
  )
    .then((res) => res.json() as Promise<Message>)
    .then(() => logger.info("Message send done"))
    .catch((error) => logger.info("Message send error {error}", error));
}

export function addMessageHandler(handler: (msg: Message) => void) {
  MessageEvent.attach(handler);
}

export function start() {
  MessageUpdateEvent.attach(_onMessageUpdate);
  MessageUpdateEvent.post({ ok: true, result: [] });
}

function _onMessageUpdate(messageUpdates: MessageUpdates) {
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
      `${TELEGRAM_BASE_URL}${TELEGRAM_BOT_TOKEN}/getUpdates?timeout=${TELEGRAM_POLL_TIMEOUT}&offset=${offset}`,
    )
      .then((res) => res.json() as Promise<MessageUpdates>)
      .then((messageUpdate) => {
        MessageUpdateEvent.post(messageUpdate);
      })
      .then(() => logger.info("Message Update done"))
      .catch((error) => logger.info("Message Update error", error));
  } else {
    logger.error("Message Error | " + messageUpdates);
  }
}
