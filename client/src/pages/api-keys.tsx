/**
 * API Keys Management Page
 * Sprint 3: Windows Integration & Key Management
 *
 * Provides management interface for LLM API keys:
 * - Configure OpenAI, Anthropic, and Google AI keys
 * - Test API key validity
 * - Secure storage in Windows Credential Manager
 * - Visual feedback on configuration status
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
  Loader2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AIProvider {
  id: string;
  name: string;
  description: string;
  signupUrl: string;
  docsUrl: string;
  keyFormat: string;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'OPENAI',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, and other models for document generation',
    signupUrl: 'https://platform.openai.com/signup',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    keyFormat: 'Starts with sk-...',
  },
  {
    id: 'ANTHROPIC',
    name: 'Anthropic',
    description: 'Claude models for complex reasoning and document analysis',
    signupUrl: 'https://console.anthropic.com/signup',
    docsUrl: 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api',
    keyFormat: 'Starts with sk-ant-...',
  },
  {
    id: 'GOOGLE_AI',
    name: 'Google AI',
    description: 'Gemini models for multimodal analysis',
    signupUrl: 'https://makersuite.google.com/',
    docsUrl: 'https://ai.google.dev/docs',
    keyFormat: 'Starts with AIza...',
  },
];

interface ConfiguredProviders {
  configured: string[];
}

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // Fetch configured providers
  const { data: configured, isLoading } = useQuery<ConfiguredProviders>({
    queryKey: ['api-keys-configured'],
    queryFn: async () => {
      const res = await fetch('/api/local/api-keys/configured');
      if (!res.ok) throw new Error('Failed to fetch configured providers');
      return res.json();
    },
  });

  // Save API key mutation
  const saveMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await fetch(`/api/local/api-keys/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save API key');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success',
        description: `${variables.provider} API key saved successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['api-keys-configured'] });
      // Clear the key from state after saving
      setApiKeys(prev => {
        const updated = { ...prev };
        delete updated[variables.provider];
        return updated;
      });
    },
    onError: (error, variables) => {
      toast({
        title: 'Error',
        description: `Failed to save ${variables.provider} API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/local/api-keys/${provider}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete API key');
      return res.json();
    },
    onSuccess: (_, provider) => {
      toast({
        title: 'Success',
        description: `${provider} API key removed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['api-keys-configured'] });
    },
    onError: (error, provider) => {
      toast({
        title: 'Error',
        description: `Failed to remove ${provider} API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Test API key mutation
  const testMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await fetch('/api/local/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      if (!res.ok) throw new Error('Failed to test API key');
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.valid) {
        toast({
          title: 'Success',
          description: `${variables.provider} API key is valid`,
        });
      } else {
        toast({
          title: 'Invalid Key',
          description: `${variables.provider} API key appears to be invalid`,
          variant: 'destructive',
        });
      }
    },
    onError: (error, variables) => {
      toast({
        title: 'Error',
        description: `Failed to test ${variables.provider} API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const handleSave = (providerId: string) => {
    const apiKey = apiKeys[providerId];
    if (!apiKey || apiKey.trim().length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate({ provider: providerId, apiKey });
  };

  const handleTest = (providerId: string) => {
    const apiKey = apiKeys[providerId];
    if (!apiKey || apiKey.trim().length === 0) {
      toast({
        title: 'Error',
        description: 'Please enter an API key to test',
        variant: 'destructive',
      });
      return;
    }
    setTestingProvider(providerId);
    testMutation.mutate({ provider: providerId, apiKey }, {
      onSettled: () => setTestingProvider(null),
    });
  };

  const handleDelete = (providerId: string) => {
    if (confirm(`Remove ${providerId} API key?`)) {
      deleteMutation.mutate(providerId);
    }
  };

  const toggleShowKey = (providerId: string) => {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const isConfigured = (providerId: string) => {
    return configured?.configured.includes(providerId) || false;
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="h-8 w-8" />
          AI Provider API Keys
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your AI provider API keys for document generation features
        </p>
      </div>

      <Alert className="mb-6">
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          Your API keys are stored locally using Windows Credential Manager. They are encrypted
          with your Windows login credentials and never leave your computer.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {AI_PROVIDERS.map(provider => (
            <Card key={provider.id} className={isConfigured(provider.id) ? 'border-green-500 dark:border-green-700' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {provider.name}
                      {isConfigured(provider.id) && (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {provider.description}
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">
                      Key format: {provider.keyFormat}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {isConfigured(provider.id) ? (
                    <Alert>
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        API key is configured and stored securely in Windows Credential Manager
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="default">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No API key configured. Add a key to enable {provider.name} features.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`api-key-${provider.id}`}>
                      {isConfigured(provider.id) ? 'Update API Key' : 'API Key'}
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={`api-key-${provider.id}`}
                          type={showKeys[provider.id] ? 'text' : 'password'}
                          placeholder={`Enter your ${provider.name} API key`}
                          value={apiKeys[provider.id] || ''}
                          onChange={(e) => setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleShowKey(provider.id)}
                        >
                          {showKeys[provider.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleTest(provider.id)}
                        disabled={!apiKeys[provider.id] || testingProvider === provider.id}
                        variant="outline"
                      >
                        {testingProvider === provider.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Test'
                        )}
                      </Button>
                      <Button
                        onClick={() => handleSave(provider.id)}
                        disabled={!apiKeys[provider.id] || saveMutation.isPending}
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Save
                      </Button>
                    </div>
                  </div>

                  {isConfigured(provider.id) && (
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(provider.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Remove Key
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>

              {!isConfigured(provider.id) && (
                <CardFooter className="bg-muted/50">
                  <div className="text-sm text-muted-foreground">
                    Don't have an API key?{' '}
                    <a
                      href={provider.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Sign up for {provider.name} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Security:</strong> API keys are stored in Windows Credential Manager, encrypted with your Windows login credentials.
          </p>
          <p>
            <strong>Privacy:</strong> Keys never leave your computer. All AI requests are made directly from your machine to the provider.
          </p>
          <p>
            <strong>Access:</strong> You can view and manage your stored credentials in Windows Control Panel → Credential Manager → Windows Credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
