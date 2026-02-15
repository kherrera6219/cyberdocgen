import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AppErrorEventDetail {
  title?: string;
  message?: string;
}

const ERROR_TOAST_DEDUPE_MS = 5000;

function normalizeErrorReason(reason: unknown): { message: string; stack?: string } {
  if (reason instanceof Error) {
    return { message: reason.message, stack: reason.stack };
  }

  if (typeof reason === "string") {
    return { message: reason };
  }

  try {
    return { message: JSON.stringify(reason) };
  } catch {
    return { message: "Unknown client error" };
  }
}

export function AppErrorHandler() {
  const lastToastAtRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const shouldShowToast = (message: string) => {
      const now = Date.now();
      const lastAt = lastToastAtRef.current.get(message) ?? 0;
      if (now - lastAt < ERROR_TOAST_DEDUPE_MS) {
        return false;
      }
      lastToastAtRef.current.set(message, now);
      return true;
    };

    const reportClientError = async (message: string, stack?: string) => {
      if (process.env.NODE_ENV !== "production") {
        return;
      }

      try {
        await apiRequest("/api/client-errors", "POST", {
          message,
          stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      } catch {
        // Intentionally silent: never throw from global error reporting path.
      }
    };

    const onAppError = (event: Event) => {
      const detail = (event as CustomEvent<AppErrorEventDetail>).detail ?? {};
      const message = detail.message ?? "An unexpected error occurred";
      const title = detail.title ?? "Action Failed";

      if (shouldShowToast(message)) {
        toast({
          title,
          description: message,
          variant: "destructive",
        });
      }
    };

    const onWindowError = (event: ErrorEvent) => {
      const normalized = normalizeErrorReason(event.error ?? event.message);
      if (shouldShowToast(normalized.message)) {
        toast({
          title: "Unexpected Error",
          description: normalized.message,
          variant: "destructive",
        });
      }
      void reportClientError(normalized.message, normalized.stack);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const normalized = normalizeErrorReason(event.reason);
      if (shouldShowToast(normalized.message)) {
        toast({
          title: "Unhandled Promise Rejection",
          description: normalized.message,
          variant: "destructive",
        });
      }
      void reportClientError(normalized.message, normalized.stack);
    };

    window.addEventListener("app:error", onAppError as EventListener);
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("app:error", onAppError as EventListener);
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
