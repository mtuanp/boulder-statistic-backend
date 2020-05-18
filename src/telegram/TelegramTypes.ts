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

export type Message = {
  message_id: number;
  from: User;
  date: number;
  chat: Chat;
  text?: string;
  entities: MessageEntity[];
};

export type IncomingUpdate = {
  update_id: number;
  message?: Message;
};

export type MessageUpdates = {
  ok: boolean;
  result: IncomingUpdate[];
};
