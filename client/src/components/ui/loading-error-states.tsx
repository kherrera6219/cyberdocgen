import { ReactNode } from "react";
import { AlertCircle, RefreshCw, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingCardProps {
  title?: string;
  className?: string;
}

export function LoadingCard({ title, className }: LoadingCardProps) {
  return (
    <Card className={cn("overflow-visible", className)}>
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(title ? "pt-0" : "pt-6")}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </CardContent>
    </Card>
  );
}

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({
  title = "Something went wrong",
  message = "An error occurred while loading the content. Please try again.",
  onRetry,
  className,
}: ErrorCardProps) {
  return (
    <Card
      className={cn("overflow-visible", className)}
      role="alert"
      aria-live="assertive"
    >
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertCircle
            className="h-6 w-6 text-destructive"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-lg font-semibold mb-2" data-testid="text-error-title">
          {title}
        </h3>
        <p
          className="text-sm text-muted-foreground mb-4 max-w-sm"
          data-testid="text-error-message"
        >
          {message}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            data-testid="button-retry"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface EmptyStateCardProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyStateCard({
  title = "No data available",
  message = "There's nothing to display here yet.",
  icon,
  action,
  className,
}: EmptyStateCardProps) {
  return (
    <Card className={cn("overflow-visible", className)}>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          {icon || (
            <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">
          {title}
        </h3>
        <p
          className="text-sm text-muted-foreground mb-4 max-w-sm"
          data-testid="text-empty-message"
        >
          {message}
        </p>
        {action && (
          <Button onClick={action.onClick} data-testid="button-empty-action">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
