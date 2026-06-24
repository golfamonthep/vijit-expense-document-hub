import { MissingServerEnvError, getOptionalServerEnv } from "../env.ts";
import type { LineReplyMessage } from "./types.ts";

const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";

export async function replyMessage(
  replyToken: string,
  messages: LineReplyMessage[],
): Promise<void> {
  const token = getOptionalServerEnv().lineChannelAccessToken;

  if (!token) {
    throw new MissingServerEnvError(
      ["LINE_CHANNEL_ACCESS_TOKEN"],
      "LINE reply client",
    );
  }

  const response = await fetch(LINE_REPLY_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (response.ok) {
    return;
  }

  const errorText = await response.text();
  const trimmedErrorText = errorText.slice(0, 500);

  throw new Error(
    `LINE reply API request failed with status ${response.status}${
      trimmedErrorText ? `: ${trimmedErrorText}` : ""
    }`,
  );
}
