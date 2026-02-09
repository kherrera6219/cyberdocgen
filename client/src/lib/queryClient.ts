import { QueryClient, QueryFunction, QueryKey, UseQueryOptions, QueryCache } from "@tanstack/react-query";
import { logger } from '../utils/logger';

// Cache time constants (in milliseconds)
export const CACHE_TIMES = {
  // User session data - rarely changes, long TTL
  USER: {
    staleTime: 5 * 60 * 1000,     // 5 minutes
    gcTime: 30 * 60 * 1000,       // 30 minutes (garbage collection)
  },
  // Organization data - changes infrequently
  ORGANIZATION: {
    staleTime: 5 * 60 * 1000,     // 5 minutes
    gcTime: 30 * 60 * 1000,       // 30 minutes
  },
  // Documents - may change moderately
  DOCUMENTS: {
    staleTime: 2 * 60 * 1000,     // 2 minutes
    gcTime: 15 * 60 * 1000,       // 15 minutes
  },
  // Analytics and metrics - changes frequently
  ANALYTICS: {
    staleTime: 30 * 1000,         // 30 seconds
    gcTime: 5 * 60 * 1000,        // 5 minutes
  },
  // AI-generated content - rarely refetched
  AI_CONTENT: {
    staleTime: 10 * 60 * 1000,    // 10 minutes
    gcTime: 60 * 60 * 1000,       // 1 hour
  },
  // Templates and static configuration - very stable
  TEMPLATES: {
    staleTime: 15 * 60 * 1000,    // 15 minutes
    gcTime: 60 * 60 * 1000,       // 1 hour
  },
  // Real-time data - always fresh
  REALTIME: {
    staleTime: 0,                 // Always stale
    gcTime: 60 * 1000,            // 1 minute
  },
  // Default for unspecified queries
  DEFAULT: {
    staleTime: 60 * 1000,         // 1 minute
    gcTime: 10 * 60 * 1000,       // 10 minutes
  },
} as const;

// Helper to get cache config based on query key patterns
export function getCacheConfig(queryKey: QueryKey): { staleTime: number; gcTime: number } {
  const keyString = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  
  if (typeof keyString !== 'string') {
    return CACHE_TIMES.DEFAULT;
  }

  // Match query key patterns to cache configurations
  if (keyString.includes('/api/user') || keyString.includes('/api/auth')) {
    return CACHE_TIMES.USER;
  }
  if (keyString.includes('/api/organization')) {
    return CACHE_TIMES.ORGANIZATION;
  }
  if (keyString.includes('/api/documents') || keyString.includes('/api/document')) {
    return CACHE_TIMES.DOCUMENTS;
  }
  if (keyString.includes('/api/analytics') || keyString.includes('/api/metrics') || keyString.includes('/api/dashboard')) {
    return CACHE_TIMES.ANALYTICS;
  }
  if (keyString.includes('/api/ai') || keyString.includes('/api/generate')) {
    return CACHE_TIMES.AI_CONTENT;
  }
  if (keyString.includes('/api/templates') || keyString.includes('/api/frameworks')) {
    return CACHE_TIMES.TEMPLATES;
  }
  if (keyString.includes('/api/notifications') || keyString.includes('/api/activity')) {
    return CACHE_TIMES.REALTIME;
  }

  return CACHE_TIMES.DEFAULT;
}

// Custom error class that preserves HTTP status codes
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

// Type for cache configuration options
export interface CacheOptions {
  cacheType?: keyof typeof CACHE_TIMES;
  enabled?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchOnWindowFocus?: boolean | 'always';
}

// Query options factory for consistent cache configuration
export function createQueryOptions<TData = unknown, TError = ApiError>(
  queryKey: QueryKey,
  options?: CacheOptions
): Pick<UseQueryOptions<TData, TError, TData, QueryKey>, 
  'queryKey' | 'staleTime' | 'gcTime' | 'enabled' | 'refetchOnMount' | 'refetchOnWindowFocus'
> {
  const cacheConfig = options?.cacheType 
    ? CACHE_TIMES[options.cacheType] 
    : getCacheConfig(queryKey);

  return {
    queryKey,
    staleTime: cacheConfig.staleTime,
    gcTime: cacheConfig.gcTime,
    enabled: options?.enabled,
    refetchOnMount: options?.refetchOnMount ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  };
}

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfTokenFromCookie();
  if (!token) {
    try {
      const res = await fetch('/api/csrf-token', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        token = data.csrfToken;
      }
    } catch {
      logger.warn('Failed to fetch CSRF token');
    }
  }
  return token;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new ApiError(res.status, text);
  }
}

type ApiRequestOptions = { method?: string; body?: unknown };
const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export async function apiRequest(
  urlOrMethod: string,
  methodOrUrlOrOptions?: string | ApiRequestOptions,
  body?: unknown,
): Promise<any> {
  let url = urlOrMethod;
  let method = 'GET';
  let payload: unknown;

  if (typeof methodOrUrlOrOptions === 'string') {
    const isLegacyMethodFirst =
      HTTP_METHODS.has(urlOrMethod.toUpperCase()) &&
      (methodOrUrlOrOptions.startsWith("/") ||
        methodOrUrlOrOptions.startsWith("http://") ||
        methodOrUrlOrOptions.startsWith("https://"));

    if (isLegacyMethodFirst) {
      // Backward compatibility for legacy call sites: apiRequest("POST", "/api/...", body)
      method = urlOrMethod.toUpperCase();
      url = methodOrUrlOrOptions;
      payload = body;
    } else {
      method = methodOrUrlOrOptions.toUpperCase();
      payload = body;
    }
  } else if (methodOrUrlOrOptions) {
    method = (methodOrUrlOrOptions.method ?? 'GET').toUpperCase();
    payload = methodOrUrlOrOptions.body;
  }

  const headers: Record<string, string> = {};
  if (payload) {
    headers["Content-Type"] = "application/json";
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/"), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: CACHE_TIMES.DEFAULT.staleTime,
      gcTime: CACHE_TIMES.DEFAULT.gcTime,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.isClientError) {
          return false;
        }
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          return failureCount < 1;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      onError: (error) => {
        // Global error handler for mutations
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        // We need to dynamically import or use a singleton for toast because hooks can't be used here directly
        // However, for simplicity in this setup, we'll log it. 
        // Ideally, we would dispatch an event that the toaster listens to, or use a toast utility that works outside components.
        console.error("Mutation Error:", message);
        
        // Dispatch a custom event that the App can listen to for showing toasts
        window.dispatchEvent(new CustomEvent('app:error', { 
          detail: { message, title: 'Action Failed' } 
        }));
      }
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Global error handler for queries
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      console.error("Query Error:", message);
      
      // Only show toast for 5xx errors or specific critical failures to avoid spamming
      if (error instanceof ApiError && error.isServerError) {
        window.dispatchEvent(new CustomEvent('app:error', { 
          detail: { message, title: 'Data Load Failed' } 
        }));
      }
    }
  })
});
