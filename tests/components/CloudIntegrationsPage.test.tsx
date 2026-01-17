import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CloudIntegrations from '../../client/src/pages/cloud-integrations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as queryLib from '../../client/src/lib/queryClient';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', role: 'admin' }
  })
}));

// Mock apiRequest
vi.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  }
}));

// Setup default queryFn
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { 
      retry: false,
      staleTime: 0,
      queryFn: ({ queryKey }) => {
        return (queryLib.apiRequest as any)(queryKey[0] as string, ...(queryKey[1] ? [queryKey[1]] : []));
      }
    },
  },
});

describe('CloudIntegrations Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createQueryClient();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CloudIntegrations />
      </QueryClientProvider>
    );
  };

  it('renders correctly', async () => {
    // Mock integrations response
    (queryLib.apiRequest as any).mockImplementation((url: string) => {
      if (url === '/api/cloud/integrations') {
        return Promise.resolve({
          integrations: [
            { id: 'i1', provider: 'google_drive', displayName: 'My Drive', email: 'test@gmail.com', isActive: true, syncStatus: 'completed' }
          ]
        });
      }
      if (url === '/api/cloud/files') {
        return Promise.resolve({ files: [] });
      }
      return Promise.resolve({});
    });

    renderComponent();

    expect(screen.getByText('Cloud Integrations')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByText('My Drive')).toBeTruthy();
      expect(screen.getByText('test@gmail.com')).toBeTruthy();
    });
  });

  it('shows no integrations state', async () => {
    (queryLib.apiRequest as any).mockResolvedValue({ integrations: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No Cloud Integrations')).toBeTruthy();
    });
  });
});
