// ─── maskSensitiveFields ─────────────────────────────────────────────────
// Recursively redacts any object key matching a sensitive-data pattern
// before it's written into erp_activity_logs.previous_values / new_values.
// This is the ONLY gate between request/response bodies and the audit
// table, so it errs on the side of over-matching rather than under-matching.

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|jwt|api_key|apikey|authorization|credential|refresh_token|access_token/i;

const REDACTED = "[REDACTED]";

export const maskSensitiveFields = (value: unknown, depth = 0): unknown => {
  // Guard against runaway recursion on unexpected circular/deep structures.
  if (depth > 6) return "[TRUNCATED]";

  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveFields(item, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = REDACTED;
      } else {
        result[key] = maskSensitiveFields(val, depth + 1);
      }
    }
    return result;
  }

  return value;
};
