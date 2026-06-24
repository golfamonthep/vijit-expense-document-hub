import { MissingServerEnvError } from "../env.ts";
import { createDocumentFromLineMessage as createDocumentFromLineMessageService } from "../documents/intake.ts";
import { downloadLineMessageContent as downloadLineMessageContentClient, inferDocumentTypeFromLineMessage } from "./content.ts";
import {
  buildHelpMessage,
  buildStartExpenseMessage,
  buildUnsupportedMessage,
  getLineSourceInfo,
  isFileMessageEvent,
  isImageMessageEvent,
  isTextMessageEvent,
} from "./events.ts";
import { replyMessage as replyLineMessage } from "./client.ts";
import type {
  LineFileMessage,
  LineMessageEvent,
  LineReplyMessage,
  LineWebhookEvent,
} from "./types.ts";
import type { Json } from "../../types/database.ts";

const START_EXPENSE_COMMAND = "#เธฃเธฒเธขเธเนเธฒเธข";
const FINISH_EXPENSE_COMMAND = "#เธเธเธฃเธฒเธขเธเธฒเธฃ";
const HELP_ALIASES = new Set(["help", "เธงเธดเธเธตเนเธเน"]);
const FINISH_EXPENSE_REPLY =
  "เธฃเธฑเธเธ—เธฃเธฒเธ เธเธดเธ”เธเธธเธ”เน€เธญเธเธชเธฒเธฃเธเธตเนเนเธฅเนเธง เธชเธ–เธฒเธเธฐ: เธฃเธญเธ•เธฃเธงเธเธชเธญเธ";
const STORAGE_CONFIG_ERROR_REPLY =
  "รับไฟล์แล้ว แต่ยังบันทึกไม่ได้เนื่องจากระบบจัดเก็บเอกสารยังไม่ได้ตั้งค่า";
const FILE_TOO_LARGE_REPLY = "ไฟล์มีขนาดเกิน 10 MB กรุณาส่งไฟล์ที่เล็กกว่านี้";
export const MAX_LINE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type AddAuditLogSafelyInput = {
  action: string;
  actorLineUserId?: string | null;
  companyId?: string | null;
  entityType?: string;
  entityId?: string | null;
  payload?: { [key: string]: Json | undefined };
};

type WebhookHandlerDeps = {
  replyMessage: (replyToken: string, messages: LineReplyMessage[]) => Promise<void>;
  getDefaultCompanyId: () => Promise<string | null>;
  downloadLineMessageContent: typeof downloadLineMessageContentClient;
  createDocumentFromLineMessage: typeof createDocumentFromLineMessageService;
  addAuditLog: (input: AddAuditLogSafelyInput) => Promise<void>;
};

const defaultDeps: WebhookHandlerDeps = {
  replyMessage: replyLineMessage,
  getDefaultCompanyId: async () => null,
  downloadLineMessageContent: downloadLineMessageContentClient,
  createDocumentFromLineMessage: createDocumentFromLineMessageService,
  addAuditLog: async () => {},
};

export class LineFileTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LineFileTooLargeError";
  }
}

function buildFinishExpenseMessage(): LineReplyMessage[] {
  return [{ type: "text", text: FINISH_EXPENSE_REPLY }];
}

function buildDocumentSavedMessage(documentId: string): LineReplyMessage[] {
  return [
    {
      type: "text",
      text: `บันทึกเอกสารแล้ว รหัสเอกสาร: ${documentId.slice(0, 8).toUpperCase()}`,
    },
  ];
}

function buildStorageConfigErrorMessage(): LineReplyMessage[] {
  return [{ type: "text", text: STORAGE_CONFIG_ERROR_REPLY }];
}

function normalizeCommand(text: string): string {
  return text.trim().toLowerCase();
}

function isRuntimeConfigError(error: unknown): boolean {
  return error instanceof MissingServerEnvError;
}

async function replySafely(
  reply: WebhookHandlerDeps["replyMessage"],
  replyToken: string,
  messages: LineReplyMessage[],
): Promise<void> {
  try {
    await reply(replyToken, messages);
  } catch (error) {
    if (isRuntimeConfigError(error)) {
      return;
    }

    throw error;
  }
}

export function createLineWebhookHandler(deps: Partial<WebhookHandlerDeps> = {}) {
  const resolvedDeps = { ...defaultDeps, ...deps };

  async function handleDocumentMessage(event: LineMessageEvent): Promise<void> {
    const sourceInfo = getLineSourceInfo(event);
    const companyId = await resolvedDeps.getDefaultCompanyId();

    await resolvedDeps.addAuditLog({
      action: "line_document_event_received",
      actorLineUserId: sourceInfo.lineUserId,
      companyId,
      payload: {
        eventType: event.type,
        sourceType: sourceInfo.sourceType,
        sourceChannelId: sourceInfo.sourceChannelId,
        messageId: event.message.id,
        messageType: event.message.type,
      },
    });

    if (!companyId) {
      await replySafely(resolvedDeps.replyMessage, event.replyToken, buildStorageConfigErrorMessage());
      return;
    }

    const fileMessage = isFileMessageEvent(event) ? (event.message as LineFileMessage) : null;

    try {
      if ((fileMessage?.fileSize ?? 0) > MAX_LINE_FILE_SIZE_BYTES) {
        throw new LineFileTooLargeError(
          `LINE file message exceeds the 10 MB limit: ${fileMessage?.fileSize ?? 0} bytes`,
        );
      }

      const content = await resolvedDeps.downloadLineMessageContent(event.message.id);
      const byteLength = content.arrayBuffer.byteLength;
      const contentLength = content.contentLength ?? byteLength;

      if (contentLength > MAX_LINE_FILE_SIZE_BYTES || byteLength > MAX_LINE_FILE_SIZE_BYTES) {
        throw new LineFileTooLargeError(
          `Downloaded LINE content exceeds the 10 MB limit: ${Math.max(contentLength, byteLength)} bytes`,
        );
      }

      const document = await resolvedDeps.createDocumentFromLineMessage({
        companyId,
        sourceType: "line",
        sourceChannelId: sourceInfo.sourceChannelId,
        sourceUserId: sourceInfo.lineUserId,
        messageId: event.message.id,
        originalFileName: fileMessage?.fileName ?? null,
        mimeType: content.contentType ?? "application/octet-stream",
        arrayBuffer: content.arrayBuffer,
        documentType: inferDocumentTypeFromLineMessage({
          messageType: event.message.type === "image" ? "image" : "file",
          contentType: content.contentType ?? "application/octet-stream",
          originalFileName: fileMessage?.fileName ?? null,
        }),
      });

      await replySafely(resolvedDeps.replyMessage, event.replyToken, buildDocumentSavedMessage(document.id));
    } catch (error) {
      await resolvedDeps.addAuditLog({
        action: "line_document_save_failed",
        actorLineUserId: sourceInfo.lineUserId,
        companyId,
        payload: {
          messageId: event.message.id,
          messageType: event.message.type,
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorMessage: error instanceof Error ? error.message.slice(0, 300) : String(error),
          fileName: fileMessage?.fileName ?? null,
        },
      });

      if (error instanceof LineFileTooLargeError) {
        await replySafely(resolvedDeps.replyMessage, event.replyToken, [
          { type: "text", text: FILE_TOO_LARGE_REPLY },
        ]);
        return;
      }

      await replySafely(resolvedDeps.replyMessage, event.replyToken, buildStorageConfigErrorMessage());
    }
  }

  async function handleMessageEvent(event: LineWebhookEvent): Promise<void> {
    const companyId = await resolvedDeps.getDefaultCompanyId();

    if (isTextMessageEvent(event)) {
      const normalizedCommand = normalizeCommand(event.message.text);
      const sourceInfo = getLineSourceInfo(event);

      await resolvedDeps.addAuditLog({
        action: "line_text_received",
        actorLineUserId: sourceInfo.lineUserId,
        companyId,
        payload: {
          eventType: event.type,
          sourceType: sourceInfo.sourceType,
          sourceChannelId: sourceInfo.sourceChannelId,
          messageId: event.message.id,
          messageType: event.message.type,
          text: event.message.text.slice(0, 200),
        },
      });

      if (normalizedCommand === START_EXPENSE_COMMAND) {
        await replySafely(resolvedDeps.replyMessage, event.replyToken, buildStartExpenseMessage());
        return;
      }

      if (normalizedCommand === normalizeCommand(FINISH_EXPENSE_COMMAND)) {
        await replySafely(resolvedDeps.replyMessage, event.replyToken, buildFinishExpenseMessage());
        return;
      }

      if (HELP_ALIASES.has(normalizedCommand)) {
        await replySafely(resolvedDeps.replyMessage, event.replyToken, buildHelpMessage());
      }

      return;
    }

    if (isImageMessageEvent(event) || isFileMessageEvent(event)) {
      await handleDocumentMessage(event);
      return;
    }

    if (event.type === "message" && event.replyToken) {
      await replySafely(resolvedDeps.replyMessage, event.replyToken, buildUnsupportedMessage());
    }
  }

  return {
    handleDocumentMessage,
    handleMessageEvent,
  };
}
