import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Smartphone, QrCode, Shield, Copy, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const verificationSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must contain only numbers'),
});

type VerificationForm = z.infer<typeof verificationSchema>;

interface GoogleAuthenticatorSetupProps {
  userId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function GoogleAuthenticatorSetup({ 
  userId, 
  onComplete, 
  onCancel 
}: GoogleAuthenticatorSetupProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'verify' | 'success'>('setup');
  const [setupData, setSetupData] = useState<any>(null);
  const [showSecret, setShowSecret] = useState(false);

  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/enterprise/setup-google-authenticator', 'POST', { userId });
    },
    onSuccess: (data) => {
      setSetupData(data.setup);
      setStep('verify');
    },
    onError: (error: any) => {
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to setup Google Authenticator',
        variant: 'destructive',
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerificationForm) => {
      return apiRequest('/api/auth/enterprise/verify-google-authenticator', 'POST', {
        userId,
        token: data.code,
      });
    },
    onSuccess: () => {
      setStep('success');
      toast({
        title: 'Success!',
        description: 'Google Authenticator has been enabled for your account',
      });
      setTimeout(() => {
        onComplete?.();
      }, 2000);
    },
    onError: (error: any) => {
      form.setError('code', { message: error.message || 'Invalid verification code' });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Secret key copied to clipboard',
    });
  };

  const onVerify = (data: VerificationForm) => {
    verifyMutation.mutate(data);
  };

  if (step === 'success') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Google Authenticator Enabled!</CardTitle>
          <CardDescription>
            Your account is now secured with two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold">Account Secured</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Google Authenticator is now active for your account. You'll need to use your authenticator app for future logins.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Backup Codes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Save these backup codes in a secure place. You can use them to access your account if you lose your device.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {setupData?.backupCodes?.map((code: string, index: number) => (
                <div key={index} className="bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono text-sm text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onComplete} className="flex-1">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Verify Setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your Google Authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onVerify)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="000000"
                className={`text-center text-lg font-mono tracking-widest ${
                  form.formState.errors.code ? 'border-red-500' : ''
                }`}
                {...form.register('code')}
              />
              {form.formState.errors.code && (
                <p className="text-sm text-red-600">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Can't scan the QR code?</strong> Enter this setup key manually in Google Authenticator:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={setupData?.secret}
                  readOnly
                  className="font-mono text-xs"
                  type={showSecret ? 'text' : 'password'}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(setupData?.secret || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifyMutation.isPending}
                className="flex-1"
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl">Setup Google Authenticator</CardTitle>
        <CardDescription>
          Secure your account with two-factor authentication using Google Authenticator
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">1</Badge>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Download Google Authenticator</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Install Google Authenticator from your app store if you haven't already.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">2</Badge>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Scan QR Code</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Open Google Authenticator and scan the QR code that will be displayed.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">3</Badge>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Verify Setup</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter the 6-digit code from Google Authenticator to verify the setup.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Important:</p>
              <p className="text-amber-700 dark:text-amber-400 mt-1">
                Make sure to save your backup codes in a secure place. You'll need them if you lose access to your phone.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => setupMutation.mutate()}
            disabled={setupMutation.isPending}
            className="flex-1"
          >
            {setupMutation.isPending ? 'Setting up...' : 'Start Setup'}
          </Button>
        </div>

        {setupData && (
          <div className="mt-6 p-4 border rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan this QR Code
            </h3>
            <div className="flex justify-center">
              <img
                src={setupData.qrCodeUrl}
                alt="Google Authenticator QR Code"
                className="border rounded-lg"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}