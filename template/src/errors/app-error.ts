import type { HttpStatusCode } from "../types/http.types";

export type AppErrorOptions = {
  message: string;
  status: HttpStatusCode;
  code: string;
  details?: unknown;
  cause?: unknown;
};

// Base error consistent across frameworks so translators can map to HTTP responses.
export class AppError extends Error {
  readonly status: HttpStatusCode;
  readonly code: string;
  readonly details?: unknown;

  constructor(options: AppErrorOptions) {
    const { message, status, code, details, cause } = options;
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;

    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
