import type { ContentfulStatusCode } from "hono/utils/http-status";
import { isAppError } from "./app-error";

export type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type TranslatedError = {
  status: ContentfulStatusCode;
  body: ErrorResponseBody;
};

const DEFAULT_ERROR_CODE = "internal_error";
const DEFAULT_STATUS: ContentfulStatusCode = 500;

function toContentfulStatus(status: number): ContentfulStatusCode {
  if (!Number.isInteger(status)) {
    return DEFAULT_STATUS;
  }

  if (status < 100 || status > 599) {
    return DEFAULT_STATUS;
  }

  switch (status) {
    case 101:
    case 204:
    case 205:
    case 304:
      return DEFAULT_STATUS;
    default:
      return status as ContentfulStatusCode;
  }
}

function normalizeMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred.";
}

export function translateError(error: unknown): TranslatedError {
  if (isAppError(error)) {
    const payload: ErrorResponseBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    };

    return {
      status: toContentfulStatus(error.status),
      body: payload,
    };
  }

  const message = normalizeMessage(error);

  return {
    status: DEFAULT_STATUS,
    body: {
      error: {
        code: DEFAULT_ERROR_CODE,
        message,
      },
    },
  };
}
