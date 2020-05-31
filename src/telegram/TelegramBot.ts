import { Evt } from "../deps.ts";
import { logger } from "../log.ts";
import {
  IncomingMessage,
  IncomingMessageUpdates,
  OutgoingMessage,
  CallbackQuery,
  OutgoingCallbackAnswerMessage,
} from "./TelegramTypes.ts";
import { genUrl } from "../core/Utils.ts";

const TELEGRAM_BASE_URL = Deno.env.get("TELEGRAM_BASE_URL") ||
  "https://api.telegram.org/bot";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const TELEGRAM_URL = TELEGRAM_BASE_URL + TELEGRAM_BOT_TOKEN;
const TELEGRAM_POLL_TIMEOUT = +(Deno.env.get("TELEGRAM_POLL_TIMEOUT") || "120");

const MessageUpdateEvent = new Evt<IncomingMessageUpdates>();
const MessageEvent = new Evt<IncomingMessage>();
const CallbackEvent = new Evt<CallbackQuery>();

export function sendMessage(outgoingMessage: OutgoingMessage) {
  fetch(genUrl(`${TELEGRAM_URL}/sendMessage`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(outgoingMessage),
  })
    .then((response) => {
      if (response.ok) {
        logger.debug("Message send done");
      } else {
        logger.error(
          "Message send not ok",
          response.status,
          response.statusText,
        );
      }
    })
    .catch((error) => logger.error("Message send error", error));
}

export function answerCallbackQuery(
  outgoingMessage: OutgoingCallbackAnswerMessage,
) {
  fetch(genUrl(`${TELEGRAM_URL}/answerCallbackQuery`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(outgoingMessage),
  })
    .then((response) => {
      if (response.ok) {
        logger.debug("Callback answer send done");
      } else {
        logger.error(
          "Callback answer send not ok",
          response.status,
          response.statusText,
        );
      }
    })
    .catch((error) => logger.error("Callback answer error", error));
}

export function addMessageHandler(handler: (msg: IncomingMessage) => void) {
  MessageEvent.attach(handler);
}

export function addCallbackHandler(handler: (callback: CallbackQuery) => void) {
  CallbackEvent.attach(handler);
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
      (inMsg) => {
        if (inMsg.message) {
          MessageEvent.postAsyncOnceHandled(inMsg.message);
        }
        if (inMsg.callback_query) {
          CallbackEvent.postAsyncOnceHandled(inMsg.callback_query);
        }
      },
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
        logger.debug("incoming message done", messageUpdate);
        MessageUpdateEvent.post(messageUpdate);
      })
      .then(() => logger.debug("Message update done"))
      .catch((error) => logger.error("Message incoming update error", error));
  } else {
    logger.error("Message Error | " + messageUpdates);
  }
}
