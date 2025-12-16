/**
 * Dashboard Component Tests
 *
 * Comprehensive test suite for the main Dashboard page including:
 * - Document statistics display
 * - Document generation workflows
 * - Progress tracking
 * - Error handling
 * - Loading states
 * - User interactions
 * - AI insights integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import Dashboard from '../../client/src/pages/dashboard';
import { OrganizationProvider } from '../../client/src/contexts/OrganizationContext';
import * as queryClient from '../../client/src/lib/queryClient';
import type { Document, CompanyProfile } from '@shared/schema';

// Mock dependencies
vi.mock('../../client/src/lib/queryClient');
vi.mock('../../client/src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));
vi.mock('../../client/src/components/ai/AIInsightsDashboard', () => ({
  AIInsightsDashboard: () => <div data-testid="ai-insights">AI Insights</div>,
}));
vi.mock('../../client/src/components/ai/RiskHeatmap', () => ({
  RiskHeatmap: () => <div data-testid="risk-heatmap">Risk Heatmap</div>,
}));
vi.mock('../../client/src/components/ai/ControlPrioritizer', () => ({
  ControlPrioritizer: () => <div data-testid="control-prioritizer">Control Prioritizer</div>,
}));

describe('Dashboard Component', () => {
  let testQueryClient: QueryClient;

  const mockCompanyProfile: CompanyProfile = {
    id: 'profile-123',
    companyName: 'Test Company',
    industry: 'Technology',
    size: '100-500',
    location: 'United States',
    description: 'Test company description',
    organizationId: 'org-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocuments: Document[] = [
    {
      id: 'doc-1',
      title: 'Data Protection Policy',
      content: 'Policy content...',
      framework: 'SOC2',
      status: 'approved',
      version: 1,
      organizationId: 'org-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'doc-2',
      title: 'Access Control Policy',
      content: 'Policy content...',
      framework: 'SOC2',
      status: 'draft',
      version: 1,
      organizationId: 'org-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'doc-3',
      title: 'Incident Response Plan',
      content: 'Plan content...',
      framework: 'ISO27001',
      status: 'review',
      version: 2,
      organizationId: 'org-123',
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    testQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          gcTime: Infinity,
          queryFn: async ({ queryKey }) => {
            // Return appropriate data based on query key
            const key = queryKey[0];
            if (key === '/api/company-profiles') {
              return Promise.resolve([mockCompanyProfile]);
            }
            if (key === '/api/documents') {
              return Promise.resolve(mockDocuments);
            }
            return Promise.resolve([]);
          },
        },
      },
    });

    // Mock API requests
    vi.mocked(queryClient.apiRequest).mockImplementation(async (endpoint: string) => {
      if (endpoint === '/api/company-profiles' || endpoint.includes('company-profiles')) {
        return Promise.resolve([mockCompanyProfile]);
      }
      if (endpoint === '/api/documents' || endpoint.includes('documents')) {
        return Promise.resolve(mockDocuments);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    testQueryClient.clear();
  });

  const renderDashboard = () => {
    // Pre-populate the query cache with data
    testQueryClient.setQueryData(['/api/company-profiles'], [mockCompanyProfile]);
    testQueryClient.setQueryData(['/api/documents'], mockDocuments);

    return render(
      <QueryClientProvider client={testQueryClient}>
        <Router>
          <OrganizationProvider>
            <Dashboard />
          </OrganizationProvider>
        </Router>
      </QueryClientProvider>
    );
  };

  describe('Initial Rendering', () => {
    it('should render dashboard title', () => {
      renderDashboard();
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    it('should show loading skeleton while fetching data', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
    });

    it('should render document statistics cards', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Total Documents')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Total count
      });
    });

    it('should display framework breakdown', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('SOC2')).toBeInTheDocument();
        expect(screen.getByText('ISO27001')).toBeInTheDocument();
      });
    });

    it('should show status distribution', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getByText('Draft')).toBeInTheDocument();
        expect(screen.getByText('Review')).toBeInTheDocument();
      });
    });
  });

  describe('Document Statistics', () => {
    it('should calculate total documents correctly', async () => {
      renderDashboard();

      await waitFor(() => {
        const totalCard = screen.getByText('Total Documents').closest('div');
        expect(totalCard).toContain(screen.getByText('3'));
      });
    });

    it('should count documents by framework', async () => {
      renderDashboard();

      await waitFor(() => {
        // SOC2: 2 documents
        const soc2Count = screen.getByText('SOC2').closest('div');
        expect(soc2Count).toContain(screen.getByText('2'));

        // ISO27001: 1 document
        const isoCount = screen.getByText('ISO27001').closest('div');
        expect(isoCount).toContain(screen.getByText('1'));
      });
    });

    it('should count documents by status', async () => {
      renderDashboard();

      await waitFor(() => {
        const statusCard = screen.getByText('Document Status').closest('div');
        expect(statusCard).toBeDefined();
      });
    });

    it('should handle empty document list', async () => {
      vi.mocked(queryClient.apiRequest).mockResolvedValue({ data: [] });
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('No documents yet')).toBeInTheDocument();
      });
    });
  });

  describe('Document Generation', () => {
    it('should show generation button for each framework', async () => {
      renderDashboard();

      await waitFor(() => {
        const generateButtons = screen.getAllByText(/Generate/i);
        expect(generateButtons.length).toBeGreaterThan(0);
      });
    });

    it('should start generation when button clicked', async () => {
      renderDashboard();

      await waitFor(() => {
        const generateButton = screen.getByText('Generate SOC2 Documents');
        fireEvent.click(generateButton);
      });

      expect(queryClient.apiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: expect.stringContaining('/generate'),
        })
      );
    });

    it('should show progress indicator during generation', async () => {
      vi.mocked(queryClient.apiRequest).mockImplementation(async ({ url }) => {
        if (url.includes('/generate')) {
          return { data: { jobId: 'job-123' } };
        }
        return { data: { status: 'processing', progress: 50 } };
      });

      renderDashboard();

      await waitFor(() => {
        const generateButton = screen.getByText('Generate SOC2 Documents');
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText(/50%/i)).toBeInTheDocument();
      });
    });

    it('should disable generate button during generation', async () => {
      renderDashboard();

      const generateButton = screen.getByText('Generate SOC2 Documents');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(generateButton).toBeDisabled();
      });
    });

    it('should show success message when generation completes', async () => {
      const mockToast = vi.fn();
      vi.mocked(require('../../client/src/hooks/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });

      vi.mocked(queryClient.apiRequest).mockImplementation(async ({ url }) => {
        if (url.includes('/generate')) {
          return { data: { jobId: 'job-123' } };
        }
        return { data: { status: 'completed', progress: 100 } };
      });

      renderDashboard();

      const generateButton = screen.getByText('Generate SOC2 Documents');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Success'),
          })
        );
      });
    });

    it('should handle generation errors gracefully', async () => {
      const mockToast = vi.fn();
      vi.mocked(require('../../client/src/hooks/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });

      vi.mocked(queryClient.apiRequest).mockRejectedValueOnce(
        new Error('Generation failed')
      );

      renderDashboard();

      const generateButton = screen.getByText('Generate SOC2 Documents');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
            title: expect.stringContaining('Error'),
          })
        );
      });
    });

    it('should timeout if generation takes too long', async () => {
      vi.useFakeTimers();

      vi.mocked(queryClient.apiRequest).mockImplementation(async ({ url }) => {
        if (url.includes('/generate')) {
          return { data: { jobId: 'job-123' } };
        }
        // Never complete
        return new Promise(() => {});
      });

      renderDashboard();

      const generateButton = screen.getByText('Generate SOC2 Documents');
      fireEvent.click(generateButton);

      // Fast-forward past the 15-minute timeout
      vi.advanceTimersByTime(15 * 60 * 1000 + 1000);

      await waitFor(() => {
        expect(screen.getByText(/timeout/i)).toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when document fetch fails', async () => {
      vi.mocked(queryClient.apiRequest).mockRejectedValueOnce(
        new Error('Failed to fetch documents')
      );

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(queryClient.apiRequest).mockRejectedValueOnce(
        new Error('Network error')
      );

      renderDashboard();

      await waitFor(() => {
        const retryButton = screen.getByText(/retry/i);
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should refetch data when retry clicked', async () => {
      vi.mocked(queryClient.apiRequest)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockDocuments });

      renderDashboard();

      await waitFor(() => {
        const retryButton = screen.getByText(/retry/i);
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Total Documents')).toBeInTheDocument();
      });
    });

    it('should handle company profile fetch errors', async () => {
      vi.mocked(queryClient.apiRequest).mockImplementation(async ({ url }) => {
        if (url.includes('/company-profile')) {
          throw new Error('Profile not found');
        }
        return { data: mockDocuments };
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/profile/i)).toBeInTheDocument();
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Preview', () => {
    it('should open preview dialog when document clicked', async () => {
      renderDashboard();

      await waitFor(() => {
        const documentCard = screen.getByText('Data Protection Policy');
        fireEvent.click(documentCard);
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Document Preview')).toBeInTheDocument();
    });

    it('should close preview dialog when close button clicked', async () => {
      renderDashboard();

      await waitFor(() => {
        const documentCard = screen.getByText('Data Protection Policy');
        fireEvent.click(documentCard);
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should show document content in preview', async () => {
      renderDashboard();

      await waitFor(() => {
        const documentCard = screen.getByText('Data Protection Policy');
        fireEvent.click(documentCard);
      });

      expect(screen.getByText(/Policy content/i)).toBeInTheDocument();
    });
  });

  describe('AI Insights Integration', () => {
    it('should render AI insights dashboard', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('ai-insights')).toBeInTheDocument();
      });
    });

    it('should render risk heatmap', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('risk-heatmap')).toBeInTheDocument();
      });
    });

    it('should render control prioritizer', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('control-prioritizer')).toBeInTheDocument();
      });
    });

    it('should lazy load AI components', async () => {
      renderDashboard();

      // Initially should show loading state
      expect(screen.queryByTestId('ai-insights')).not.toBeInTheDocument();

      // After loading
      await waitFor(() => {
        expect(screen.getByTestId('ai-insights')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render mobile-friendly layout on small screens', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      renderDashboard();

      // Mobile-specific assertions
      expect(screen.getByRole('main')).toHaveClass('mobile-layout');
    });

    it('should render desktop layout on large screens', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));

      renderDashboard();

      // Desktop-specific assertions
      expect(screen.getByRole('main')).toHaveClass('desktop-layout');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderDashboard();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Dashboard');
    });

    it('should have accessible buttons', async () => {
      renderDashboard();

      await waitFor(() => {
        const generateButton = screen.getByRole('button', { name: /generate/i });
        expect(generateButton).toHaveAccessibleName();
      });
    });

    it('should announce generation progress to screen readers', async () => {
      renderDashboard();

      const generateButton = screen.getByText('Generate SOC2 Documents');
      fireEvent.click(generateButton);

      await waitFor(() => {
        const progress = screen.getByRole('progressbar');
        expect(progress).toHaveAttribute('aria-valuenow');
        expect(progress).toHaveAttribute('aria-valuemin', '0');
        expect(progress).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it('should have proper ARIA labels for stats', async () => {
      renderDashboard();

      await waitFor(() => {
        const totalDocsCard = screen.getByLabelText('Total documents count');
        expect(totalDocsCard).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const { rerender } = renderDashboard();

      const renderCount = screen.getAllByTestId('render-count')[0];
      const initialRenderCount = parseInt(renderCount.textContent || '0');

      rerender(
        <QueryClientProvider client={testQueryClient}>
          <Router>
            <OrganizationProvider>
              <Dashboard />
            </OrganizationProvider>
          </Router>
        </QueryClientProvider>
      );

      const newRenderCount = parseInt(renderCount.textContent || '0');
      expect(newRenderCount).toBe(initialRenderCount + 1);
    });

    it('should cleanup timers on unmount', () => {
      const { unmount } = renderDashboard();

      unmount();

      // Verify no memory leaks from timers
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Data Refresh', () => {
    it('should refetch documents after successful generation', async () => {
      vi.mocked(queryClient.apiRequest).mockImplementation(async ({ url }) => {
        if (url.includes('/generate')) {
          return { data: { jobId: 'job-123' } };
        }
        if (url.includes('/job')) {
          return { data: { status: 'completed' } };
        }
        return { data: [...mockDocuments, { ...mockDocuments[0], id: 'doc-4' }] };
      });

      renderDashboard();

      const generateButton = screen.getByText('Generate SOC2 Documents');
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument(); // Updated count
      });
    });

    it('should update statistics in real-time', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Initial count
      });

      // Simulate new document added
      vi.mocked(queryClient.apiRequest).mockResolvedValueOnce({
        data: [...mockDocuments, { ...mockDocuments[0], id: 'doc-new' }],
      });

      testQueryClient.refetchQueries({ queryKey: ['/api/documents'] });

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument(); // Updated count
      });
    });
  });
});
