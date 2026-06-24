import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHelpMessage,
  buildStartExpenseMessage,
  buildUnsupportedMessage,
  getLineSourceInfo,
  isFileMessageEvent,
  isImageMessageEvent,
  isTextMessageEvent,
} from "../../lib/line/events.ts";
import type { LineMessageEvent } from "../../lib/line/types.ts";

const baseEvent: LineMessageEvent = {
  type: "message",
  mode: "active",
  replyToken: "reply-token",
  timestamp: 1718179200000,
  source: {
    type: "group",
    groupId: "group-123",
    userId: "user-456",
  },
  message: {
    id: "message-1",
    type: "text",
    text: "#รายจ่าย",
  },
};

test("getLineSourceInfo normalizes group source data", () => {
  assert.deepEqual(getLineSourceInfo(baseEvent), {
    sourceType: "group",
    lineUserId: "user-456",
    sourceChannelId: "group-123",
  });
});

test("message event guards classify text, image, and file events", () => {
  const imageEvent: LineMessageEvent = {
    ...baseEvent,
    message: {
      id: "message-2",
      type: "image",
    },
  };

  const fileEvent: LineMessageEvent = {
    ...baseEvent,
    message: {
      id: "message-3",
      type: "file",
      fileName: "receipt.pdf",
      fileSize: 1024,
    },
  };

  assert.equal(isTextMessageEvent(baseEvent), true);
  assert.equal(isImageMessageEvent(baseEvent), false);
  assert.equal(isFileMessageEvent(baseEvent), false);

  assert.equal(isTextMessageEvent(imageEvent), false);
  assert.equal(isImageMessageEvent(imageEvent), true);
  assert.equal(isFileMessageEvent(imageEvent), false);

  assert.equal(isTextMessageEvent(fileEvent), false);
  assert.equal(isImageMessageEvent(fileEvent), false);
  assert.equal(isFileMessageEvent(fileEvent), true);
});

test("buildHelpMessage returns short usage guidance", () => {
  assert.deepEqual(buildHelpMessage(), [
    {
      type: "text",
      text: "วิธีใช้:\n1. พิมพ์ #รายจ่าย เพื่อเริ่มส่งเอกสาร\n2. ส่งรูปหรือไฟล์เอกสาร\n3. พิมพ์ #จบรายการ เมื่อส่งครบ",
    },
  ]);
});

test("buildStartExpenseMessage returns the intake-start reply", () => {
  assert.deepEqual(buildStartExpenseMessage(), [
    {
      type: "text",
      text: "เริ่มรับเอกสารรายจ่ายแล้ว กรุณาส่งรูปสลิป ใบเสร็จ หรือภาพคำสั่งซื้อ จากนั้นพิมพ์ #จบรายการ",
    },
  ]);
});

test("buildUnsupportedMessage returns the fallback reply", () => {
  assert.deepEqual(buildUnsupportedMessage(), [
    {
      type: "text",
      text: "ตอนนี้รองรับข้อความคำสั่ง รูปภาพ และไฟล์เอกสารเบื้องต้นเท่านั้น พิมพ์ help หรือ วิธีใช้ เพื่อดูวิธีใช้งาน",
    },
  ]);
});
