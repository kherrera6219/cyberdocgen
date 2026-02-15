function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stripControlCharacters(value: string): string {
  let result = "";

  for (const char of value) {
    const code = char.charCodeAt(0);
    const isSafeControl = code === 9 || code === 10 || code === 13;
    if (code >= 32 || isSafeControl) {
      result += char;
    }
  }

  return result;
}

function sanitizeStringValue(value: string): string {
  return stripControlCharacters(value).trim();
}

export function sanitizePayload<T>(payload: T): T {
  if (typeof payload === "string") {
    return sanitizeStringValue(payload) as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizePayload(item)) as T;
  }

  if (isPlainObject(payload)) {
    const sanitized = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, sanitizePayload(value)])
    );
    return sanitized as T;
  }

  return payload;
}

export function sanitizeEmailInput(value: string): string {
  return sanitizeStringValue(value).toLowerCase();
}

export function sanitizeSingleLineInput(value: string): string {
  return sanitizeStringValue(value).replace(/\s+/g, " ");
}
