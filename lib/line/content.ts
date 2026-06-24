import { MissingServerEnvError, getOptionalServerEnv } from "../env.ts";
import type { DocumentType } from "../../types/database.ts";

const LINE_CONTENT_ENDPOINT = "https://api-data.line.me/v2/bot/message";

export type DownloadedLineMessageContent = {
  arrayBuffer: ArrayBuffer;
  contentType: string | null;
  contentLength: number | null;
};

export type InferDocumentTypeFromLineMessageInput = {
  messageType: "image" | "file";
  contentType: string | null;
  originalFileName?: string | null;
};

export async function downloadLineMessageContent(
  messageId: string,
): Promise<DownloadedLineMessageContent> {
  const token = getOptionalServerEnv().lineChannelAccessToken;

  if (!token) {
    throw new MissingServerEnvError(
      ["LINE_CHANNEL_ACCESS_TOKEN"],
      "LINE content download",
    );
  }

  const response = await fetch(`${LINE_CONTENT_ENDPOINT}/${messageId}/content`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = (await response.text()).slice(0, 500);
    throw new Error(
      `LINE content API request failed with status ${response.status}${
        errorText ? `: ${errorText}` : ""
      }`,
    );
  }

  return {
    arrayBuffer: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
    contentLength: Number.parseInt(response.headers.get("content-length") ?? "", 10) || null,
  };
}

export function inferFileExtensionFromContentType(contentType: string | null): string {
  switch (contentType?.toLowerCase()) {
    case "application/pdf":
      return ".pdf";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/heic":
    case "image/heif":
      return ".heic";
    default:
      return ".bin";
  }
}

export function inferDocumentTypeFromLineMessage(
  input: InferDocumentTypeFromLineMessageInput,
): DocumentType {
  if (input.messageType === "image") {
    return "other";
  }

  if (input.contentType?.toLowerCase() === "application/pdf") {
    return "pdf";
  }

  if (input.originalFileName?.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  return "other";
}
