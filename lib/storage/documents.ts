import { getSupabaseAdminClient } from "../supabase/server.ts";

export type BuildDocumentStoragePathInput = {
  companyId: string;
  documentId: string;
  extension: string;
  receivedAt?: string | Date;
};

export type UploadDocumentFileInput = {
  bucket: string;
  path: string;
  arrayBuffer: ArrayBuffer;
  contentType: string;
};

export type GetDocumentSignedUrlInput = {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
};

export type DownloadDocumentFileInput = {
  bucket: string;
  path: string;
};

export function buildDocumentStoragePath(input: BuildDocumentStoragePathInput): string {
  const receivedAt = input.receivedAt ? new Date(input.receivedAt) : new Date();
  const year = receivedAt.getUTCFullYear().toString();
  const month = String(receivedAt.getUTCMonth() + 1).padStart(2, "0");
  const normalizedExtension = input.extension.startsWith(".")
    ? input.extension
    : `.${input.extension}`;

  return `companies/${input.companyId}/documents/${year}/${month}/${input.documentId}${normalizedExtension}`;
}

export async function uploadDocumentFile(input: UploadDocumentFileInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase.storage
    .from(input.bucket)
    .upload(input.path, input.arrayBuffer, {
      contentType: input.contentType,
      upsert: false,
    });

  if (response.error) {
    throw new Error(`Failed to upload document file: ${response.error.message}`);
  }
}

export async function getDocumentSignedUrl(
  input: GetDocumentSignedUrlInput,
): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase.storage
    .from(input.bucket)
    .createSignedUrl(input.path, input.expiresInSeconds ?? 900);

  if (response.error) {
    throw new Error(`Failed to create document signed URL: ${response.error.message}`);
  }

  return response.data.signedUrl;
}

export async function downloadDocumentFile(
  input: DownloadDocumentFileInput,
): Promise<Buffer> {
  const supabase = getSupabaseAdminClient();
  const response = await supabase.storage.from(input.bucket).download(input.path);

  if (response.error) {
    throw new Error(`Failed to download document file: ${response.error.message}`);
  }

  return Buffer.from(await response.data.arrayBuffer());
}
