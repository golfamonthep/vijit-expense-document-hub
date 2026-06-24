import { createHmac, timingSafeEqual } from "node:crypto";

function readSecret(): string | undefined {
  const value = process.env.LINE_CHANNEL_SECRET?.trim();
  return value ? value : undefined;
}

export function verifyLineSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = readSecret();

  if (!secret || !signatureHeader) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const actualBuffer = Buffer.from(signatureHeader, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
