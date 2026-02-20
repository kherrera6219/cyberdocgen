import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Shield,
  Smartphone,
  QrCode,
  Key,
  CheckCircle,
  XCircle,
  Copy,
  Download,
  Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../utils/logger';
import { useToast } from '../hooks/use-toast';
import { getCsrfTokenFromCookie } from '../lib/queryClient';

interface MFAStatus {
  enabled: boolean;
  totpEnabled: boolean;
  smsEnabled: boolean;
  backupCodesGenerated: boolean;
}

interface TOTPSetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

export default function MFASetupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState<'status' | 'totp-setup' | 'sms-setup' | 'backup-codes'>('status');

  const withSessionAndCsrf = useCallback((init: RequestInit = {}): RequestInit => {
    const method = (init.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      ...((init.headers as Record<string, string> | undefined) || {}),
    };
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    return {
      ...init,
      credentials: 'include',
      headers,
    };
  }, []);

  const loadMFAStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/mfa/status', withSessionAndCsrf());
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      logger.error('Failed to load MFA status:', err);
    }
  }, [withSessionAndCsrf]);

  useEffect(() => {
    loadMFAStatus();
  }, [loadMFAStatus]);

  const setupTOTP = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/setup/totp', withSessionAndCsrf({
        method: 'POST',
      }));
      
      if (response.ok) {
        const data = await response.json();
        setTotpSetup(data);
        setActiveStep('totp-setup');
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to setup TOTP');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!verificationCode) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/verify/totp', withSessionAndCsrf({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode })
      }));
      
      if (response.ok) {
        setSuccess('TOTP authentication enabled successfully!');
        setVerificationCode('');
        loadMFAStatus();
        setActiveStep('status');
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify TOTP');
    } finally {
      setIsLoading(false);
    }
  };

  const setupSMS = async () => {
    if (!phoneNumber) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/setup/sms', withSessionAndCsrf({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      }));
      
      if (response.ok) {
        setSuccess('SMS verification code sent!');
        setActiveStep('sms-setup');
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to setup SMS');
    } finally {
      setIsLoading(false);
    }
  };

  const verifySMS = async () => {
    if (!verificationCode) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/verify/sms', withSessionAndCsrf({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      }));
      
      if (response.ok) {
        setSuccess('SMS authentication enabled successfully!');
        setVerificationCode('');
        loadMFAStatus();
        setActiveStep('status');
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify SMS');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/backup-codes', withSessionAndCsrf({
        method: 'POST',
      }));
      
      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.codes);
        setActiveStep('backup-codes');
        loadMFAStatus();
      } else {
        const error = await response.json();
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate backup codes');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadBackupCodes = () => {
    const content = `CyberDocGen MFA Backup Codes\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nStore these codes securely. Each code can only be used once.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyberdocgen-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="sr-only">Loading MFA Setup</h1>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Multi-Factor Authentication</h1>
        <p className="text-gray-600 mt-2">
          Enhance your account security with additional authentication methods
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {activeStep === 'status' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* TOTP Authentication */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Shield className="h-6 w-6 text-blue-600" />
                {status.totpEnabled ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
              <CardTitle>Authenticator App</CardTitle>
              <CardDescription>
                Use Google Authenticator, Authy, or similar apps for time-based codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!status.totpEnabled ? (
                <Button onClick={setupTOTP} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Setup Authenticator'
                  )}
                </Button>
              ) : (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Authenticator app is configured and active
                </div>
              )}
            </CardContent>
          </Card>

          {/* SMS Authentication */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Smartphone className="h-6 w-6 text-green-600" />
                {status.smsEnabled ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
              <CardTitle>SMS Verification</CardTitle>
              <CardDescription>
                Receive verification codes via text message
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!status.smsEnabled ? (
                <div className="space-y-3">
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <Button 
                    onClick={setupSMS} 
                    disabled={!phoneNumber || isLoading} 
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Setup SMS'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> SMS verification is configured and active
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup Codes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Key className="h-6 w-6 text-orange-600" />
                {status.backupCodesGenerated ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Generated
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Generated
                  </Badge>
                )}
              </div>
              <CardTitle>Backup Codes</CardTitle>
              <CardDescription>
                Single-use codes for account recovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generateBackupCodes} 
                disabled={isLoading} 
                className="w-full"
                variant={status.backupCodesGenerated ? "outline" : "default"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : status.backupCodesGenerated ? (
                  'Regenerate Codes'
                ) : (
                  'Generate Codes'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeStep === 'totp-setup' && totpSetup && (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <QrCode className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Setup Authenticator App</CardTitle>
            <CardDescription>
              Scan the QR code with your authenticator app or enter the key manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code would be displayed here */}
            <div className="text-center">
              <img 
                src={totpSetup.qrCode} 
                alt="TOTP QR Code" 
                loading="lazy"
                decoding="async"
                className="mx-auto border rounded-lg p-4 bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Manual Entry Key:</label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  value={totpSetup.manualEntryKey} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(totpSetup.manualEntryKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <label className="text-sm font-medium">Verification Code:</label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-xl tracking-wider mt-1"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setActiveStep('status')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifyTOTP}
                disabled={!verificationCode || verificationCode.length !== 6 || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeStep === 'sms-setup' && (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <CardTitle>Verify Phone Number</CardTitle>
            <CardDescription>
              Enter the verification code sent to your phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Verification Code:</label>
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-xl tracking-wider mt-1"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setActiveStep('status')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifySMS}
                disabled={!verificationCode || verificationCode.length !== 6 || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeStep === 'backup-codes' && backupCodes.length > 0 && (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <CardTitle>Backup Codes Generated</CardTitle>
            <CardDescription>
              Save these codes securely. Each can only be used once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-center">
                  {code}
                </div>
              ))}
            </div>

            <Alert>
              <AlertDescription>
                Store these codes in a secure location. You'll need them to access your account if you lose your primary MFA method.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy All
              </Button>
              <Button
                variant="outline"
                onClick={downloadBackupCodes}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            <Button
              onClick={() => setActiveStep('status')}
              className="w-full"
            >
              Done
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
