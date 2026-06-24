import assert from "node:assert/strict";
import test from "node:test";

import { createLineWebhookHandler } from "../../lib/line/webhook.ts";
import type { LineMessageEvent } from "../../lib/line/types.ts";
import type { Document } from "../../types/database.ts";

const baseImageEvent: LineMessageEvent = {
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
    type: "image",
  },
};

function buildDocumentStub(id: string): Document {
  return {
    id,
    company_id: "company-123",
    source_type: "line",
    source_channel_id: "group-123",
    source_user_id: "user-456",
    original_file_name: null,
    mime_type: "image/jpeg",
    storage_bucket: "documents",
    storage_path: `companies/company-123/documents/2026/06/${id}.jpg`,
    document_type: "other",
    status: "received",
    received_at: "2026-06-24T10:30:00.000Z",
    created_at: "2026-06-24T10:30:00.000Z",
    updated_at: "2026-06-24T10:30:00.000Z",
  };
}

test("line webhook handler replies with saved document short id for image messages", async () => {
  const replies: string[] = [];
  const handler = createLineWebhookHandler({
    replyMessage: async (_replyToken, messages) => {
      replies.push(messages[0]?.text ?? "");
    },
    getDefaultCompanyId: async () => "company-123",
    downloadLineMessageContent: async () => ({
      arrayBuffer: new Uint8Array([1, 2, 3]).buffer,
      contentType: "image/jpeg",
      contentLength: 3,
    }),
    createDocumentFromLineMessage: async () =>
      buildDocumentStub("abcdef12-3456-7890-abcd-ef1234567890"),
    addAuditLog: async () => {},
  });

  await handler.handleMessageEvent(baseImageEvent);

  assert.deepEqual(replies, ["บันทึกเอกสารแล้ว รหัสเอกสาร: ABCDEF12"]);
});

test("line webhook handler replies with a safe configuration error when runtime secrets are unavailable", async () => {
  const replies: string[] = [];
  const handler = createLineWebhookHandler({
    replyMessage: async (_replyToken, messages) => {
      replies.push(messages[0]?.text ?? "");
    },
    getDefaultCompanyId: async () => null,
    downloadLineMessageContent: async () => {
      throw new Error("should not be called");
    },
    createDocumentFromLineMessage: async () => {
      throw new Error("should not be called");
    },
    addAuditLog: async () => {},
  });

  await handler.handleMessageEvent(baseImageEvent);

  assert.deepEqual(replies, [
    "รับไฟล์แล้ว แต่ยังบันทึกไม่ได้เนื่องจากระบบจัดเก็บเอกสารยังไม่ได้ตั้งค่า",
  ]);
});

test("line webhook handler replies when file metadata exceeds the size limit before download", async () => {
  const fileEvent: LineMessageEvent = {
    ...baseImageEvent,
    message: {
      id: "message-2",
      type: "file",
      fileName: "receipt.pdf",
      fileSize: 10 * 1024 * 1024 + 1,
    },
  };

  let downloadCalls = 0;
  const replies: string[] = [];
  const handler = createLineWebhookHandler({
    replyMessage: async (_replyToken, messages) => {
      replies.push(messages[0]?.text ?? "");
    },
    getDefaultCompanyId: async () => "company-123",
    downloadLineMessageContent: async () => {
      downloadCalls++;
      return {
        arrayBuffer: new Uint8Array([1]).buffer,
        contentType: "application/pdf",
        contentLength: 1,
      };
    },
    createDocumentFromLineMessage: async () =>
      buildDocumentStub("abcdef12-3456-7890-abcd-ef1234567890"),
    addAuditLog: async () => {},
  });

  await handler.handleDocumentMessage(fileEvent);

  assert.equal(downloadCalls, 0);
  assert.deepEqual(replies, ["ไฟล์มีขนาดเกิน 10 MB กรุณาส่งไฟล์ที่เล็กกว่านี้"]);
});
