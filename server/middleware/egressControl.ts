import { Request, Response as ExpressResponse, NextFunction } from 'express';
import { URL } from 'url';

/**
 * SSRF Egress Control Middleware
 * 
 * Prevents Server-Side Request Forgery (SSRF) attacks by:
 * 1. Blocking requests to internal/private IP ranges
 * 2. Enforcing URL allowlists for external requests
 * 3. Validating URL schemes (http/https only)
 */

// Private/internal IP ranges that should never be accessed
const BLOCKED_IP_RANGES = [
  // IPv4 private ranges
  /^10\./,                          // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12
  /^192\.168\./,                     // 192.168.0.0/16
  /^127\./,                          // 127.0.0.0/8 (loopback)
  /^0\./,                            // 0.0.0.0/8
  /^169\.254\./,                     // 169.254.0.0/16 (link-local)
  
  // Cloud metadata endpoints
  /^169\.254\.169\.254/,             // AWS/GCP metadata
  /^100\.100\.100\.200/,             // Alibaba Cloud metadata
  
  // IPv6 private ranges (simplified)
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 unique local
  /^fe80:/i,                         // IPv6 link-local
];

// Blocked hostnames
const BLOCKED_HOSTS = [
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data',
  'kubernetes.default',
];

// Allowed external domains for API calls
const ALLOWED_DOMAINS = [
  // AI providers
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'aiplatform.googleapis.com',
  
  // Cloud storage
  'storage.googleapis.com',
  'storage.cloud.google.com',
  's3.amazonaws.com',
  'blob.core.windows.net',
  
  // OAuth providers
  'accounts.google.com',
  'oauth2.googleapis.com',
  'login.microsoftonline.com',
  'graph.microsoft.com',
  
  // Authentication
  'replit.com',
  'api.replit.com',
  
  // Other allowed services (add as needed)
];

// Allowed URL schemes
const ALLOWED_SCHEMES = ['http:', 'https:'];

export interface EgressControlOptions {
  /** Enable strict mode (block all non-allowlisted domains) */
  strictMode?: boolean;
  /** Custom allowed domains to add to default list */
  additionalAllowedDomains?: string[];
  /** Log blocked requests */
  logBlocked?: boolean;
  /** Bypass for specific paths (e.g., webhooks) */
  bypassPaths?: string[];
}

/**
 * Check if an IP address is in a blocked range
 */
function isBlockedIP(ip: string): boolean {
  return BLOCKED_IP_RANGES.some(pattern => pattern.test(ip));
}

/**
 * Check if a hostname is blocked
 */
function isBlockedHost(hostname: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  return BLOCKED_HOSTS.some(blocked => 
    normalizedHost === blocked || normalizedHost.endsWith('.' + blocked)
  );
}

/**
 * Check if a domain is in the allowlist
 */
function isAllowedDomain(hostname: string, additionalDomains: string[] = []): boolean {
  const normalizedHost = hostname.toLowerCase();
  const allAllowed = [...ALLOWED_DOMAINS, ...additionalDomains];
  
  return allAllowed.some(allowed => 
    normalizedHost === allowed || normalizedHost.endsWith('.' + allowed)
  );
}

/**
 * Validate a URL for SSRF protection
 */
export function validateUrl(
  urlString: string,
  options: EgressControlOptions = {}
): { valid: boolean; reason?: string } {
  try {
    const url = new URL(urlString);
    
    // Check scheme
    if (!ALLOWED_SCHEMES.includes(url.protocol)) {
      return {
        valid: false,
        reason: `Invalid URL scheme: ${url.protocol}. Only http/https allowed.`,
      };
    }
    
    // Check for blocked hosts
    if (isBlockedHost(url.hostname)) {
      return {
        valid: false,
        reason: `Blocked hostname: ${url.hostname}`,
      };
    }
    
    // Check for blocked IP ranges
    if (isBlockedIP(url.hostname)) {
      return {
        valid: false,
        reason: `Blocked IP range: ${url.hostname}`,
      };
    }
    
    // In strict mode, require allowlisted domains
    if (options.strictMode) {
      if (!isAllowedDomain(url.hostname, options.additionalAllowedDomains)) {
        return {
          valid: false,
          reason: `Domain not in allowlist: ${url.hostname}`,
        };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: `Invalid URL format: ${urlString}`,
    };
  }
}

/**
 * Express middleware for egress control
 * 
 * Use this to validate URL parameters in requests before making external calls.
 */
export function egressControlMiddleware(options: EgressControlOptions = {}) {
  return (req: Request, res: ExpressResponse, next: NextFunction) => {
    // Check if path is bypassed
    if (options.bypassPaths?.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Extract URLs from request body
    const urlFields = ['url', 'targetUrl', 'callbackUrl', 'webhookUrl', 'redirectUrl'];
    const body = req.body || {};
    const bodyEntries = new Map<string, unknown>(Object.entries(body));
    
    for (const field of urlFields) {
      const fieldValue = bodyEntries.get(field);
      if (fieldValue && typeof fieldValue === 'string') {
        const validation = validateUrl(fieldValue, options);
        
        if (!validation.valid) {
          if (options.logBlocked) {
            console.warn(JSON.stringify({
              type: 'ssrf_blocked',
              field,
              url: fieldValue,
              reason: validation.reason,
              ip: req.ip,
              path: req.path,
              timestamp: new Date().toISOString(),
            }));
          }
          
          return res.status(400).json({
            error: 'Invalid URL',
            message: validation.reason,
          });
        }
      }
    }
    
    next();
  };
}

/**
 * Fetch wrapper with SSRF protection
 * 
 * Use this instead of native fetch for external requests.
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  egressOptions: EgressControlOptions = {}
): Promise<globalThis.Response> {
  const validation = validateUrl(url, { ...egressOptions, strictMode: true });
  
  if (!validation.valid) {
    throw new SSRFError(validation.reason || 'URL validation failed', url);
  }
  
  return globalThis.fetch(url, {
    ...options,
    // Prevent following redirects to blocked URLs
    redirect: 'manual',
  });
}

/**
 * Error thrown when SSRF protection blocks a request
 */
export class SSRFError extends Error {
  constructor(
    message: string,
    public readonly blockedUrl: string
  ) {
    super(message);
    this.name = 'SSRFError';
  }
}

/**
 * Get list of allowed domains (for documentation/debugging)
 */
export function getAllowedDomains(): string[] {
  return [...ALLOWED_DOMAINS];
}
