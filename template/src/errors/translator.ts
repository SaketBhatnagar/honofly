import { isAppError } from "./app-error";
import type { HttpStatusCode } from "../types/http.types";

export type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type TranslatedError = {
  status: HttpStatusCode;
  body: ErrorResponseBody;
};

const DEFAULT_ERROR_CODE = "internal_error";
const DEFAULT_STATUS: HttpStatusCode = 500;

// Workers can error if we return certain headerless statuses; remap them to a safe default.
const NO_CONTENT_STATUSES = new Set([101, 204, 205, 304]);

function sanitizeStatus(status: number): HttpStatusCode {
  if (!Number.isInteger(status)) {
    return DEFAULT_STATUS;
  }

  if (status < 100 || status > 599) {
    return DEFAULT_STATUS;
  }

  if (NO_CONTENT_STATUSES.has(status)) {
    return DEFAULT_STATUS;
  }

  return status as HttpStatusCode;
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
      status: sanitizeStatus(error.status),
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
