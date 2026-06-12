import "server-only";

import type {
  PostgrestMaybeSingleResponse,
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "RepositoryError";
  }
}

export type PaginationInput = {
  limit?: number;
  offset?: number;
};

export function normalizePagination(input?: PaginationInput): {
  limit: number;
  offset: number;
} {
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 200);
  const offset = Math.max(input?.offset ?? 0, 0);

  return { limit, offset };
}

export function applyPagination<TBuilder extends { range: (from: number, to: number) => TBuilder }>(
  builder: TBuilder,
  input?: PaginationInput,
): TBuilder {
  const { limit, offset } = normalizePagination(input);
  return builder.range(offset, offset + limit - 1);
}

export function assertNonEmptyText(value: string | null | undefined, label: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new RepositoryError(`${label} is required.`);
  }

  return normalized;
}

export function unwrapSingle<T>(
  response: PostgrestSingleResponse<T>,
  context: string,
): T {
  if (response.error) {
    throw new RepositoryError(`${context}: ${response.error.message}`, response.error);
  }

  return response.data;
}

export function unwrapMaybeSingle<T>(
  response: PostgrestMaybeSingleResponse<T>,
  context: string,
): T | null {
  if (response.error) {
    throw new RepositoryError(`${context}: ${response.error.message}`, response.error);
  }

  return response.data;
}

export function unwrapMany<T>(
  response: PostgrestResponse<T>,
  context: string,
): T[] {
  if (response.error) {
    throw new RepositoryError(`${context}: ${response.error.message}`, response.error);
  }

  return response.data ?? [];
}

