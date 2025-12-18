import { useState, startTransition } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface TemporaryLoginDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function TemporaryLoginDialog({ trigger, className }: TemporaryLoginDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await apiRequest('/api/auth/temp-login', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      if (response.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        setOpen(false);
        setName("");
        setEmail("");
        
        startTransition(() => {
          setLocation("/dashboard");
        });
      } else {
        setErrors({ general: response.message || 'Login failed' });
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to connect to server' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className={className}
            data-testid="button-temp-login"
          >
            Login
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Quick Access Login
          </DialogTitle>
          <DialogDescription>
            Enter your name and email to access the application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This is a temporary login for demo purposes. Your session will be created on the server.
          </p>
        </div>

        {errors.general && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="temp-name">Name</Label>
            <Input
              id="temp-name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              data-testid="input-temp-name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="temp-email">Email</Label>
            <Input
              id="temp-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              data-testid="input-temp-email"
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
              data-testid="button-temp-login-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Continue to App'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TempUserBanner() {
  const { user, isTemporaryUser } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isTemporaryUser || !user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiRequest('/api/auth/temp-logout', { method: 'POST' });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      startTransition(() => {
        setLocation("/");
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <span>Temporary session: {user.displayName || user.firstName} ({user.email})</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-amber-800 dark:text-amber-200"
          data-testid="button-temp-logout"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Sign Out'
          )}
        </Button>
      </div>
    </div>
  );
}
