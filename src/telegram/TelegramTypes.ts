export type User = {
  id: number;
  is_bot: number;
  first_name: string;
};

export type Chat = {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
};

export type MessageEntity = {
  type: "bot_command" | string;
  offset: number;
  length: number;
};

export type IncomingMessage = {
  message_id: number;
  from: User;
  date: number;
  chat: Chat;
  text?: string;
  entities?: MessageEntity[];
};

export type CallbackQuery = {
  id: string;
  from: User;
  message?: IncomingMessage;
  inline_message_id?: string;
  chat_instance?: string;
  data?: string;
  game_short_name?: string;
};

export type IncomingUpdate = {
  update_id: number;
  message?: IncomingMessage;
  callback_query?: CallbackQuery;
};

export type IncomingMessageUpdates = {
  ok: boolean;
  result: IncomingUpdate[];
};

export type OutgoingMessage = {
  chat_id: number;
  text: string;
  parse_mode?: "Markdown" | "MarkdownV2" | "Markdown";
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
  reply_markup?: any;
};

export type OutgoingCallbackAnswerMessage = {
  callback_query_id: string;
  text: string;
  show_alert?: boolean;
  url?: string;
  cache_time?: number;
};

export type BotCommand = {
  command: string;
  description: string;
};
