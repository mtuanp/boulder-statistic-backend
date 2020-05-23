import { VisitorStatus } from "./VisitorResult.ts";
import { IncomingMessage, Chat } from "../telegram/TelegramTypes.ts";

export function delay(n: number): Promise<void> {
  return new Promise((resolve: () => void, _) => {
    setTimeout(resolve, n);
  });
}

export function genUrl(url: string, parameters?: any): string {
  const requestParameters = parameters
    ? Object.keys(parameters)
      .filter((param) => parameters[param] !== undefined)
      .map((param) => `${param}=${parameters[param]}`)
      .join("&")
    : "";
  return `${url}${requestParameters.length > 0 ? "?" + requestParameters : ""}`;
}

export function statusEnumToString(visitorStatus: VisitorStatus): string {
  switch (visitorStatus) {
    case VisitorStatus.FREE:
      return "free";
    case VisitorStatus.ALMOST_FULL:
      return "almost full";
    case VisitorStatus.FULL:
      return "full";
    case VisitorStatus.UNKNOWN:
      return "unknown";
  }
}

export function extractBotCommand(
  incomingMessage: IncomingMessage,
): { chat: Chat; type: "bot_command" | string; botCommand: string } {
  const { text, entities, chat } = incomingMessage;
  const { length, offset, type } = entities && entities.length > 0
    ? entities[0]
    : { length: 0, offset: 0, type: "" };
  const botCommand = text?.substr(offset, length).toLowerCase() || "";
  return { chat, type, botCommand };
}
