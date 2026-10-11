// ─── AppError ──────────────────────────────────────────────────────────────
// Lightweight, structured application error used by the service layer so
// that controllers can translate failures into the correct HTTP status code
// without embedding business logic themselves.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace (V8 only)
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, details?: Record<string, string>) {
    return new AppError(message, 400, details);
  }

  static notFound(message: string) {
    return new AppError(message, 404);
  }

  static conflict(message: string, details?: Record<string, string>) {
    return new AppError(message, 409, details);
  }

  static forbidden(message: string, details?: Record<string, string>) {
    return new AppError(message, 403, details);
  }
}