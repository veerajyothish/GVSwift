/**
 * lib/errors.ts — Application error classes and safe error formatting
 *
 * AppError is thrown by service and guard functions to signal structured
 * failures. Route handlers catch AppError and convert it to a JSON response
 * with the correct HTTP status — no raw DB errors or stack traces leak.
 *
 * Error codes are intentionally opaque strings so they can be matched in
 * tests without depending on message text.
 */

export type ErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "OUT_OF_STOCK"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "COD_NOT_ELIGIBLE"
  | "EMAIL_NOT_CONFIRMED"
  | "INVALID_TRANSITION";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Converts any thrown value to a safe { error, code } JSON body.
 * Never surfaces raw database errors or stack traces.
 */
export function toSafeError(err: unknown): {
  error: string;
  code: ErrorCode | "INTERNAL_ERROR";
  statusCode: number;
} {
  if (err instanceof AppError) {
    return {
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
    };
  }

  // Unknown errors: log internally, return generic message
  console.error("[AppError] Unexpected error:", err);
  return {
    error: "An unexpected error occurred. Please try again.",
    code: "INTERNAL_ERROR",
    statusCode: 500,
  };
}
