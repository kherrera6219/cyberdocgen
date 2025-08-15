
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield, Smartphone, Key } from 'lucide-react';

interface MFAVerificationProps {
  method: 'totp' | 'sms';
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  maskedPhone?: string;
}

export function MFAVerification({ method, onVerify, onCancel, maskedPhone }: MFAVerificationProps) {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsVerifying(true);
    setError('');

    try {
      await onVerify(code.trim());
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {method === 'totp' ? (
            <Shield className="h-8 w-8 text-blue-600" />
          ) : (
            <Smartphone className="h-8 w-8 text-green-600" />
          )}
        </div>
        <CardTitle>
          {method === 'totp' ? 'Enter Authenticator Code' : 'Enter SMS Code'}
        </CardTitle>
        <CardDescription>
          {method === 'totp'
            ? 'Enter the 6-digit code from your authenticator app'
            : `Enter the code sent to ${maskedPhone}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-xl tracking-wider"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!code || code.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Having trouble? Use a backup code instead
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
