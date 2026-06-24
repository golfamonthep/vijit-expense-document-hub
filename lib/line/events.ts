import type {
  LineFileMessage,
  LineMessageEvent,
  LineReplyMessage,
  LineWebhookEvent,
} from "./types.ts";

const HELP_TEXT =
  "วิธีใช้:\n1. พิมพ์ #รายจ่าย เพื่อเริ่มส่งเอกสาร\n2. ส่งรูปหรือไฟล์เอกสาร\n3. พิมพ์ #จบรายการ เมื่อส่งครบ";
const START_EXPENSE_TEXT =
  "เริ่มรับเอกสารรายจ่ายแล้ว กรุณาส่งรูปสลิป ใบเสร็จ หรือภาพคำสั่งซื้อ จากนั้นพิมพ์ #จบรายการ";
const UNSUPPORTED_TEXT =
  "ตอนนี้รองรับข้อความคำสั่ง รูปภาพ และไฟล์เอกสารเบื้องต้นเท่านั้น พิมพ์ help หรือ วิธีใช้ เพื่อดูวิธีใช้งาน";

export function getLineSourceInfo(event: LineWebhookEvent): {
  sourceType: "user" | "group" | "room";
  lineUserId: string | null;
  sourceChannelId: string | null;
} {
  if (event.source.type === "user") {
    return {
      sourceType: "user",
      lineUserId: event.source.userId,
      sourceChannelId: event.source.userId,
    };
  }

  if (event.source.type === "group") {
    return {
      sourceType: "group",
      lineUserId: event.source.userId ?? null,
      sourceChannelId: event.source.groupId,
    };
  }

  return {
    sourceType: "room",
    lineUserId: event.source.userId ?? null,
    sourceChannelId: event.source.roomId,
  };
}

export function isTextMessageEvent(
  event: LineWebhookEvent,
): event is LineMessageEvent & { message: { id: string; type: "text"; text: string } } {
  return (
    event.type === "message" &&
    "message" in event &&
    event.message.type === "text"
  );
}

export function isImageMessageEvent(
  event: LineWebhookEvent,
): event is LineMessageEvent & { message: { id: string; type: "image" } } {
  return (
    event.type === "message" &&
    "message" in event &&
    event.message.type === "image"
  );
}

export function isFileMessageEvent(
  event: LineWebhookEvent,
): event is LineMessageEvent & { message: LineFileMessage } {
  return (
    event.type === "message" &&
    "message" in event &&
    event.message.type === "file"
  );
}

export function buildHelpMessage(): LineReplyMessage[] {
  return [{ type: "text", text: HELP_TEXT }];
}

export function buildStartExpenseMessage(): LineReplyMessage[] {
  return [{ type: "text", text: START_EXPENSE_TEXT }];
}

export function buildUnsupportedMessage(): LineReplyMessage[] {
  return [{ type: "text", text: UNSUPPORTED_TEXT }];
}
