import assert from "node:assert/strict";
import test from "node:test";

import { verifyLineSignature } from "../../lib/line/verifySignature.ts";

test("verifyLineSignature returns true for a valid signature", () => {
  process.env.LINE_CHANNEL_SECRET = "test-channel-secret";

  const rawBody = JSON.stringify({
    destination: "line-destination",
    events: [],
  });

  const signature = "A86BHUVxPMcxh/KbxwRAtOiUDhM1c5lMeM14+NRR/iI=";

  assert.equal(verifyLineSignature(rawBody, signature), true);
});

test("verifyLineSignature returns false when the signature does not match", () => {
  process.env.LINE_CHANNEL_SECRET = "test-channel-secret";

  const rawBody = JSON.stringify({
    destination: "line-destination",
    events: [],
  });

  assert.equal(verifyLineSignature(rawBody, "invalid-signature"), false);
});

test("verifyLineSignature returns false when the secret is missing", () => {
  delete process.env.LINE_CHANNEL_SECRET;

  const rawBody = JSON.stringify({
    destination: "line-destination",
    events: [],
  });

  assert.equal(verifyLineSignature(rawBody, null), false);
});
