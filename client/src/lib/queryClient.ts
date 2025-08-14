import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  urlOrOptions: string | { method: string; body?: unknown },
  options?: { method: string; body?: unknown },
): Promise<any> {
  let url: string;
  let requestOptions: { method: string; body?: unknown };

  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    requestOptions = options || { method: 'GET' };
  } else {
    throw new Error('Invalid apiRequest usage');
  }

  const res = await fetch(url, {
    method: requestOptions.method,
    headers: requestOptions.body ? { "Content-Type": "application/json" } : {},
    body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined,
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
