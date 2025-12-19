import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [resetData, setResetData] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      return apiRequest('/api/auth/enterprise/forgot-password', 'POST', data);
    },
    onSuccess: (data) => {
      setResetData(data);
      setStep('success');
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for password reset instructions.",
      });
    },
    onError: (error: any) => {
      form.setError('root', { message: error.message || 'Password reset failed' });
      toast({
        title: "Request Failed",
        description: error.message || 'Password reset failed',
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent password reset instructions to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">Password Reset Email Sent</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                If an account with that email exists, we've sent you a password reset link.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>
              
              {resetData?.resetToken && (
                <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Development Mode:</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Reset token: <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded">{resetData.resetToken}</code>
                  </p>
                  <Link href={`/reset-password?token=${resetData.resetToken}`}>
                    <Button size="sm" className="mt-2">
                      Reset Password Now (Dev)
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                onClick={() => setStep('form')}
                className="w-full"
              >
                Try Another Email
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
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...form.register('email')}
                className={form.formState.errors.email ? 'border-red-500' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
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
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}