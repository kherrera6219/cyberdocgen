/**
 * Log Sanitizer Utility
 * 
 * Masks PII and sensitive data in log messages to ensure compliance
 * with data protection requirements.
 */

export interface SanitizeOptions {
  /** Mask email addresses */
  maskEmails?: boolean;
  /** Mask IP addresses */
  maskIPs?: boolean;
  /** Mask phone numbers */
  maskPhones?: boolean;
  /** Mask SSN patterns */
  maskSSN?: boolean;
  /** Mask credit card patterns */
  maskCreditCards?: boolean;
  /** Custom patterns to mask */
  customPatterns?: Array<{ pattern: RegExp; replacement: string }>;
}

const DEFAULT_OPTIONS: SanitizeOptions = {
  maskEmails: true,
  maskIPs: true,
  maskPhones: true,
  maskSSN: true,
  maskCreditCards: true,
};

// PII Detection Patterns
const PATTERNS = {
  // Email: user@domain.com
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // IPv4: 192.168.1.1
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded segments used only for log masking
  ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  
  // IPv6 (simplified)
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded groups used only for log masking
  ipv6: /\b(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}\b/g,
  
  // US Phone: (123) 456-7890, 123-456-7890, etc.
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded pattern used only for log masking
  phone: /\b(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
  
  // SSN: 123-45-6789
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // Credit Card: 4111-1111-1111-1111 or 4111111111111111
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded pattern used only for log masking
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // JWT token (common pattern)
  jwt: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
  
  // API Keys (common patterns)
  apiKey: /\b(?:sk-|pk_|api[_-]?key[_-]?)[a-zA-Z0-9]{20,}\b/gi,
  
  // Authorization headers
  authHeader: /Bearer\s+[a-zA-Z0-9._-]+/gi,
};

const REPLACEMENTS = {
  email: '[EMAIL_REDACTED]',
  ipv4: '[IP_REDACTED]',
  ipv6: '[IP_REDACTED]',
  phone: '[PHONE_REDACTED]',
  ssn: '[SSN_REDACTED]',
  creditCard: '[CC_REDACTED]',
  jwt: '[TOKEN_REDACTED]',
  apiKey: '[API_KEY_REDACTED]',
  authHeader: 'Bearer [TOKEN_REDACTED]',
};

/**
 * Sanitize a string by masking PII
 */
export function sanitizeString(
  input: string,
  options: SanitizeOptions = DEFAULT_OPTIONS
): string {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  let result = input;
  
  // Apply built-in patterns
  if (options.maskEmails) {
    result = result.replace(PATTERNS.email, REPLACEMENTS.email);
  }
  
  if (options.maskIPs) {
    result = result.replace(PATTERNS.ipv4, REPLACEMENTS.ipv4);
    result = result.replace(PATTERNS.ipv6, REPLACEMENTS.ipv6);
  }
  
  if (options.maskPhones) {
    result = result.replace(PATTERNS.phone, REPLACEMENTS.phone);
  }
  
  if (options.maskSSN) {
    result = result.replace(PATTERNS.ssn, REPLACEMENTS.ssn);
  }
  
  if (options.maskCreditCards) {
    result = result.replace(PATTERNS.creditCard, REPLACEMENTS.creditCard);
  }
  
  // Always mask these security-sensitive patterns
  result = result.replace(PATTERNS.jwt, REPLACEMENTS.jwt);
  result = result.replace(PATTERNS.apiKey, REPLACEMENTS.apiKey);
  result = result.replace(PATTERNS.authHeader, REPLACEMENTS.authHeader);
  
  // Apply custom patterns
  if (options.customPatterns) {
    for (const { pattern, replacement } of options.customPatterns) {
      result = result.replace(pattern, replacement);
    }
  }
  
  return result;
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject<T>(
  obj: T,
  options: SanitizeOptions = DEFAULT_OPTIONS
): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj, options) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options)) as T;
  }
  
  if (typeof obj === 'object') {
    const sanitizedEntries: Array<[string, unknown]> = [];
    
    for (const [key, value] of Object.entries(obj)) {
      // Completely redact known sensitive keys
      const lowercaseKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(k => lowercaseKey.includes(k))) {
        sanitizedEntries.push([key, '[REDACTED]']);
      } else {
        sanitizedEntries.push([key, sanitizeObject(value, options)]);
      }
    }
    
    return Object.fromEntries(sanitizedEntries) as T;
  }
  
  return obj;
}

// Keys that should be completely redacted
const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'creditcard',
  'credit_card',
  'ssn',
  'socialsecurity',
  'social_security',
];

/**
 * Create a sanitized logger wrapper
 */
export function createSanitizedLogger(
  logger: {
    info: (msg: string, meta?: object) => void;
    warn: (msg: string, meta?: object) => void;
    error: (msg: string, meta?: object) => void;
    debug: (msg: string, meta?: object) => void;
  },
  options: SanitizeOptions = DEFAULT_OPTIONS
) {
  const sanitize = (msg: string, meta?: object) => ({
    message: sanitizeString(msg, options),
    meta: meta ? sanitizeObject(meta, options) : undefined,
  });
  
  return {
    info: (msg: string, meta?: object) => {
      const { message, meta: sanitizedMeta } = sanitize(msg, meta);
      logger.info(message, sanitizedMeta);
    },
    warn: (msg: string, meta?: object) => {
      const { message, meta: sanitizedMeta } = sanitize(msg, meta);
      logger.warn(message, sanitizedMeta);
    },
    error: (msg: string, meta?: object) => {
      const { message, meta: sanitizedMeta } = sanitize(msg, meta);
      logger.error(message, sanitizedMeta);
    },
    debug: (msg: string, meta?: object) => {
      const { message, meta: sanitizedMeta } = sanitize(msg, meta);
      logger.debug(message, sanitizedMeta);
    },
  };
}

/**
 * Middleware to sanitize request logs
 */
export function sanitizeRequestForLogging(req: {
  body?: unknown;
  query?: unknown;
  params?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}): {
  body?: unknown;
  query?: unknown;
  params?: unknown;
  headers?: Record<string, string | string[] | undefined>;
} {
  const sanitizedHeaderEntries: Array<[string, string | undefined]> = [];
  
  if (req.headers) {
    for (const [key, value] of Object.entries(req.headers)) {
      const lowercaseKey = key.toLowerCase();
      if (
        lowercaseKey === 'authorization' ||
        lowercaseKey === 'cookie' ||
        lowercaseKey === 'x-api-key'
      ) {
        sanitizedHeaderEntries.push([key, '[REDACTED]']);
      } else if (Array.isArray(value)) {
        sanitizedHeaderEntries.push([key, value.map(v => sanitizeString(v)).join(', ')]);
      } else if (typeof value === 'string') {
        sanitizedHeaderEntries.push([key, sanitizeString(value)]);
      }
    }
  }
  
  return {
    body: req.body ? sanitizeObject(req.body) : undefined,
    query: req.query ? sanitizeObject(req.query) : undefined,
    params: req.params ? sanitizeObject(req.params) : undefined,
    headers: Object.fromEntries(sanitizedHeaderEntries),
  };
}
