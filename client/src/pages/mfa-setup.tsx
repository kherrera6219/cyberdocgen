import { useState } from 'react';
import { useNavigate } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Smartphone, 
  MessageSquare, 
  Key, 
  CheckCircle, 
  ArrowLeft,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import GoogleAuthenticatorSetup from '@/components/auth/GoogleAuthenticatorSetup';

export default function MFASetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMethod, setActiveMethod] = useState<string | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const authMethods = [
    {
      id: 'totp',
      name: 'Google Authenticator',
      description: 'Generate time-based codes using Google Authenticator app',
      icon: Smartphone,
      security: 'High',
      recommended: true,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      id: 'sms',
      name: 'SMS Authentication',
      description: 'Receive verification codes via text message',
      icon: MessageSquare,
      security: 'Medium',
      recommended: false,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'passkey',
      name: 'Passkey (WebAuthn)',
      description: 'Use biometric authentication or hardware security keys',
      icon: Fingerprint,
      security: 'Highest',
      recommended: true,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      comingSoon: true,
    },
  ];

  const handleMethodComplete = () => {
    setActiveMethod(null);
    // Could refresh auth methods status here
  };

  if (activeMethod === 'totp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <GoogleAuthenticatorSetup
          userId={user.id}
          onComplete={handleMethodComplete}
          onCancel={() => setActiveMethod(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-3xl">Secure Your Account</CardTitle>
          <CardDescription className="text-lg">
            Add an extra layer of security to your ComplianceAI account with multi-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">Why Enable MFA?</h3>
                <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                  Multi-factor authentication significantly reduces the risk of unauthorized account access, 
                  protecting your sensitive compliance data and business information.
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="methods" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="methods">Authentication Methods</TabsTrigger>
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="methods" className="space-y-6 mt-6">
              <div className="grid gap-4 md:grid-cols-1">
                {authMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <Card 
                      key={method.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        method.comingSoon ? 'opacity-60' : ''
                      }`}
                      onClick={() => !method.comingSoon && setActiveMethod(method.id)}
                    >
                      <CardContent className="flex items-center gap-4 p-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${method.color}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{method.name}</h3>
                            {method.recommended && (
                              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                Recommended
                              </Badge>
                            )}
                            {method.comingSoon && (
                              <Badge variant="outline">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mb-2">{method.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Security Level:</span>
                            <Badge 
                              variant="outline" 
                              className={
                                method.security === 'Highest' ? 'border-purple-500 text-purple-700 dark:text-purple-300' :
                                method.security === 'High' ? 'border-green-500 text-green-700 dark:text-green-300' :
                                'border-blue-500 text-blue-700 dark:text-blue-300'
                              }
                            >
                              {method.security}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          {!method.comingSoon ? (
                            <Button>
                              Setup
                            </Button>
                          ) : (
                            <Button disabled variant="outline">
                              Coming Soon
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">1</Badge>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Choose Your Method</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Select the authentication method that works best for you. We recommend Google Authenticator for the best balance of security and convenience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">2</Badge>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Complete Setup</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Follow the guided setup process for your chosen method. This typically involves scanning a QR code or entering a phone number.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">3</Badge>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Save Backup Codes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Store your backup codes in a secure location. These will allow you to access your account if you lose your primary authentication method.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    <CheckCircle className="h-3 w-3" />
                  </Badge>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">You're Protected!</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Your account is now secured with multi-factor authentication. You'll be prompted for an additional code when logging in from new devices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Pro Tips:</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Enable multiple methods for redundancy</li>
                  <li>• Keep your backup codes in a password manager or secure physical location</li>
                  <li>• Test your authentication method before completing setup</li>
                  <li>• Update your recovery information if you change phone numbers</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Skip for Now
            </Button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              You can always set this up later in your account settings
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}