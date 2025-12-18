import { useState, useEffect, startTransition } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock, Mail, Shield, KeyRound } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function EnterpriseLogin() {
  const [, setLocation] = useLocation();
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (!savedTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return apiRequest('/api/auth/enterprise/login', 'POST', data);
    },
    onSuccess: async (data) => {
      if (data.requiresMFA) {
        setUserData(data.user);
        setRequiresMFA(true);
      } else {
        // Invalidate auth cache to force refetch of user data before redirecting
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        // Small delay to ensure session cookie is set
        await new Promise(resolve => setTimeout(resolve, 100));
        // Redirect to dashboard on successful login (wrapped in startTransition to prevent Suspense errors)
        startTransition(() => {
          setLocation('/dashboard');
        });
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Login failed';

      if (errorMessage.includes('locked')) {
        form.setError('root', {
          message: 'Account is locked due to too many failed login attempts. Please try again later or reset your password.'
        });
      } else if (errorMessage.includes('not active') || errorMessage.includes('verify your email')) {
        form.setError('root', {
          message: 'Please verify your email address before logging in. Check your inbox for the verification link.'
        });
      } else if (errorMessage.includes('Invalid credentials')) {
        form.setError('root', {
          message: 'Invalid email/username or password. Please try again.'
        });
      } else {
        form.setError('root', { message: errorMessage });
      }
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  if (requiresMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">Two-Factor Authentication Required</CardTitle>
            <CardDescription>
              Please enter your authentication code to complete the login
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">Enhanced Security</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your account is protected with two-factor authentication
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                MFA verification component needs to be integrated here.
                This will redirect to the MFA verification page.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => setLocation('/mfa-setup')}
              className="w-full"
            >
              Continue to MFA Verification
            </Button>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setRequiresMFA(false);
                  form.reset();
                }}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Sign In to CyberDocGen</CardTitle>
          <CardDescription>
            Enterprise-grade authentication with advanced security features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="your.email@company.com or username"
                  {...form.register('identifier')}
                  className={`pl-10 ${form.formState.errors.identifier ? 'border-red-500' : ''}`}
                  autoComplete="username"
                />
              </div>
              {form.formState.errors.identifier && (
                <p className="text-sm text-red-600">{form.formState.errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...form.register('password')}
                  className={`pl-10 ${form.formState.errors.password ? 'border-red-500' : ''}`}
                  autoComplete="current-password"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
              )}
            </div>

            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-replit-login"
            >
              <Shield className="mr-2 h-4 w-4" />
              Sign in with Replit
            </Button>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Shield className="h-4 w-4" />
                <span>MFA Support</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <KeyRound className="h-4 w-4" />
                <span>Passkeys</span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
              <Link href="/enterprise-signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Create enterprise account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
