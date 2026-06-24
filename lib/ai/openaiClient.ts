import OpenAI from "openai";

import { MissingServerEnvError, getOptionalServerEnv } from "../env.ts";
import { getExtractionResultJsonSchema } from "./extractionSchema.ts";

export const OPENAI_EXTRACTION_MODEL = "gpt-4.1-mini";

export type CallOpenAiForExtractionInput = {
  prompt: string;
  mimeType: string;
  fileName?: string | null;
  fileBuffer: Buffer;
};

export type OpenAiExtractionResponse = {
  modelName: string;
  outputText: string;
};

function getOpenAiClient(): OpenAI {
  const apiKey = getOptionalServerEnv().openAiApiKey;

  if (!apiKey) {
    throw new MissingServerEnvError(["OPENAI_API_KEY"], "OpenAI extraction");
  }

  return new OpenAI({ apiKey });
}

function toDataUrl(mimeType: string, fileBuffer: Buffer): string {
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

export async function callOpenAiForExtraction(
  input: CallOpenAiForExtractionInput,
): Promise<OpenAiExtractionResponse> {
  const client = getOpenAiClient();
  const response = await client.responses.create({
    model: OPENAI_EXTRACTION_MODEL,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: input.prompt,
          },
          {
            type: "input_image",
            image_url: toDataUrl(input.mimeType, input.fileBuffer),
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "thai_accounting_extraction_result",
        strict: true,
        description: "Structured Thai accounting extraction result for one uploaded document.",
        schema: getExtractionResultJsonSchema() as Record<string, unknown>,
      },
    },
  });

  if (!response.output_text?.trim()) {
    throw new Error("OpenAI returned an empty extraction response.");
  }

  return {
    modelName: response.model,
    outputText: response.output_text,
  };
}
