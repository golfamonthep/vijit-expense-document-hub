export type LineReplyMessage = {
  type: "text";
  text: string;
};

export type LineWebhookBody = {
  destination?: string;
  events: LineWebhookEvent[];
};

export type LineSource =
  | {
      type: "user";
      userId: string;
    }
  | {
      type: "group";
      groupId: string;
      userId?: string;
    }
  | {
      type: "room";
      roomId: string;
      userId?: string;
    };

export type LineBaseEvent = {
  type: string;
  mode?: string;
  timestamp: number;
  source: LineSource;
  replyToken?: string;
};

export type LineTextMessage = {
  id: string;
  type: "text";
  text: string;
};

export type LineImageMessage = {
  id: string;
  type: "image";
};

export type LineFileMessage = {
  id: string;
  type: "file";
  fileName?: string;
  fileSize?: number;
};

export type LineUnsupportedMessage = {
  id: string;
  type: string;
};

export type LineMessage = LineTextMessage | LineImageMessage | LineFileMessage | LineUnsupportedMessage;

export type LineMessageEvent = LineBaseEvent & {
  type: "message";
  replyToken: string;
  message: LineMessage;
};

export type LineWebhookEvent = LineMessageEvent | LineBaseEvent;
