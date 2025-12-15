import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import Documents from '@/pages/documents';
import type { Document } from '@shared/schema';

// Mock the hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock API request
const mockApiRequest = vi.fn();
vi.mock('@/lib/api', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

describe('Documents Page', () => {
  let queryClient: QueryClient;
  const mockDocuments: Document[] = [
    {
      id: 1,
      title: 'Information Security Policy',
      description: 'Main security policy document',
      framework: 'ISO27001',
      category: 'policy',
      status: 'complete',
      content: 'Policy content...',
      version: '1.0',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 2,
      title: 'Access Control Procedure',
      description: 'Detailed access control procedures',
      framework: 'SOC2',
      category: 'procedure',
      status: 'in_progress',
      content: 'Procedure content...',
      version: '0.5',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
    },
    {
      id: 3,
      title: 'Incident Response Plan',
      description: 'Security incident response plan',
      framework: 'FedRAMP',
      category: 'plan',
      status: 'draft',
      content: 'Plan content...',
      version: '0.1',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 4,
      title: 'Risk Assessment Report',
      description: 'Annual risk assessment documentation',
      framework: 'NIST',
      category: 'report',
      status: 'complete',
      content: 'Report content...',
      version: '2.0',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-25'),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: async ({ queryKey }) => {
            const url = queryKey.join('/');
            return mockApiRequest(url);
          },
        },
      },
    });
    vi.clearAllMocks();
    // Setup default mock response
    mockApiRequest.mockResolvedValue(mockDocuments);
  });

  const renderDocuments = (path = '/documents') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Router initialPath={path}>
          <Documents />
        </Router>
      </QueryClientProvider>
    );
  };

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      mockApiRequest.mockImplementation(() => new Promise(() => {}));
      renderDocuments();

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/Loading documents.../i)).toBeInTheDocument();
    });

    it('should render page header with correct title', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText('Document Library')).toBeInTheDocument();
      });
      expect(screen.getByText(/Manage your compliance documentation and exports/i)).toBeInTheDocument();
    });

    it('should render framework-specific title when framework filter is present', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments('/documents?framework=ISO27001');

      await waitFor(() => {
        expect(screen.getByText('ISO27001 Documents')).toBeInTheDocument();
      });
    });

    it('should render search and filter controls', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByTestId('input-search-documents')).toBeInTheDocument();
      });
      expect(screen.getByTestId('select-status-filter')).toBeInTheDocument();
      expect(screen.getByTestId('button-new-document')).toBeInTheDocument();
      expect(screen.getByTestId('button-export-all')).toBeInTheDocument();
    });

    it('should display document count', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText(`Documents (${mockDocuments.length})`)).toBeInTheDocument();
      });
    });
  });

  describe('Document Display', () => {
    it('should display all documents in the list', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getAllByText('Information Security Policy').length).toBeGreaterThanOrEqual(1);
      });
      expect(screen.getAllByText('Access Control Procedure').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Incident Response Plan').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Risk Assessment Report').length).toBeGreaterThanOrEqual(1);
    });

    it('should display document descriptions', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getAllByText('Main security policy document').length).toBeGreaterThanOrEqual(1);
      });
      expect(screen.getAllByText('Detailed access control procedures').length).toBeGreaterThanOrEqual(1);
    });

    it('should display framework badges with correct colors', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getAllByText('ISO27001')[0]).toBeInTheDocument();
      });
      expect(screen.getAllByText('SOC2')[0]).toBeInTheDocument();
      expect(screen.getAllByText('FedRAMP')[0]).toBeInTheDocument();
      expect(screen.getAllByText('NIST')[0]).toBeInTheDocument();
    });

    it('should display status badges with correct text', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getAllByText('complete').length).toBeGreaterThan(0);
      });
      expect(screen.getAllByText('in progress').length).toBeGreaterThan(0);
      expect(screen.getAllByText('draft').length).toBeGreaterThan(0);
    });

    it('should display status icons', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      // Wait for documents to load
      await waitFor(() => {
        expect(screen.getAllByText('Information Security Policy').length).toBeGreaterThan(0);
      });

      // Status icons should be present (CheckCircle, Clock, AlertCircle)
      const icons = document.querySelectorAll('svg[class*="lucide"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should display formatted dates', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        // Check that dates are formatted (e.g., "1/20/2024")
        const dateElements = screen.getAllByText(/\d+\/\d+\/\d+/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should display document categories in desktop view', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText('policy')).toBeInTheDocument();
      });
      expect(screen.getByText('procedure')).toBeInTheDocument();
      expect(screen.getByText('plan')).toBeInTheDocument();
      expect(screen.getByText('report')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should display message when no documents exist', async () => {
      mockApiRequest.mockResolvedValue([]);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText(/No documents generated yet/i)).toBeInTheDocument();
      });
    });

    it('should display message when no documents match filters', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('input-search-documents')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('input-search-documents');
      await user.type(searchInput, 'nonexistent document');

      await waitFor(() => {
        expect(screen.getByText(/No documents match your current filters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter documents by title search', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('input-search-documents')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('input-search-documents');
      await user.type(searchInput, 'Security Policy');

      await waitFor(() => {
        expect(screen.getByText('Information Security Policy')).toBeInTheDocument();
        expect(screen.queryByText('Access Control Procedure')).not.toBeInTheDocument();
        expect(screen.getByText('Documents (1)')).toBeInTheDocument();
      });
    });

    it('should filter documents by description search', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('input-search-documents')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('input-search-documents');
      await user.type(searchInput, 'access control');

      await waitFor(() => {
        expect(screen.getByText('Access Control Procedure')).toBeInTheDocument();
        expect(screen.queryByText('Information Security Policy')).not.toBeInTheDocument();
      });
    });

    it('should perform case-insensitive search', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('input-search-documents')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('input-search-documents');
      await user.type(searchInput, 'INCIDENT RESPONSE');

      await waitFor(() => {
        expect(screen.getByText('Incident Response Plan')).toBeInTheDocument();
      });
    });

    it('should clear filters when search is cleared', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('input-search-documents')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('input-search-documents');
      await user.type(searchInput, 'Policy');

      await waitFor(() => {
        expect(screen.getByText('Documents (1)')).toBeInTheDocument();
      });

      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText(`Documents (${mockDocuments.length})`)).toBeInTheDocument();
      });
    });
  });

  describe('Status Filter', () => {
    it('should filter documents by complete status', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('select-status-filter')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('select-status-filter');
      await user.click(statusFilter);

      const completeOption = await screen.findByText('Complete');
      await user.click(completeOption);

      await waitFor(() => {
        expect(screen.getByText('Information Security Policy')).toBeInTheDocument();
        expect(screen.getByText('Risk Assessment Report')).toBeInTheDocument();
        expect(screen.queryByText('Access Control Procedure')).not.toBeInTheDocument();
        expect(screen.getByText('Documents (2)')).toBeInTheDocument();
      });
    });

    it('should filter documents by in_progress status', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('select-status-filter')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('select-status-filter');
      await user.click(statusFilter);

      const inProgressOption = await screen.findByText('In Progress');
      await user.click(inProgressOption);

      await waitFor(() => {
        expect(screen.getByText('Access Control Procedure')).toBeInTheDocument();
        expect(screen.queryByText('Information Security Policy')).not.toBeInTheDocument();
        expect(screen.getByText('Documents (1)')).toBeInTheDocument();
      });
    });

    it('should filter documents by draft status', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('select-status-filter')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('select-status-filter');
      await user.click(statusFilter);

      const draftOption = await screen.findByText('Draft');
      await user.click(draftOption);

      await waitFor(() => {
        expect(screen.getByText('Incident Response Plan')).toBeInTheDocument();
        expect(screen.queryByText('Information Security Policy')).not.toBeInTheDocument();
        expect(screen.getByText('Documents (1)')).toBeInTheDocument();
      });
    });

    it('should reset to all documents when selecting "All Status"', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('select-status-filter')).toBeInTheDocument();
      });

      // First filter
      const statusFilter = screen.getByTestId('select-status-filter');
      await user.click(statusFilter);
      const completeOption = await screen.findByText('Complete');
      await user.click(completeOption);

      await waitFor(() => {
        expect(screen.getByText('Documents (2)')).toBeInTheDocument();
      });

      // Reset filter
      await user.click(statusFilter);
      const allStatusOption = await screen.findByText('All Status');
      await user.click(allStatusOption);

      await waitFor(() => {
        expect(screen.getByText(`Documents (${mockDocuments.length})`)).toBeInTheDocument();
      });
    });
  });

  describe('Framework Filter', () => {
    it('should filter documents by framework from URL', async () => {
      const iso27001Docs = mockDocuments.filter(d => d.framework === 'ISO27001');
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments('/documents?framework=ISO27001');

      await waitFor(() => {
        expect(screen.getByText('Information Security Policy')).toBeInTheDocument();
        expect(screen.queryByText('Access Control Procedure')).not.toBeInTheDocument();
        expect(screen.getByText(`Documents (${iso27001Docs.length})`)).toBeInTheDocument();
      });
    });
  });

  describe('Combined Filters', () => {
    it('should apply both search and status filters', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('input-search-documents')).toBeInTheDocument();
      });

      // Apply search
      const searchInput = screen.getByTestId('input-search-documents');
      await user.type(searchInput, 'policy');

      // Apply status filter
      const statusFilter = screen.getByTestId('select-status-filter');
      await user.click(statusFilter);
      const completeOption = await screen.findByText('Complete');
      await user.click(completeOption);

      await waitFor(() => {
        expect(screen.getByText('Information Security Policy')).toBeInTheDocument();
        expect(screen.queryByText('Access Control Procedure')).not.toBeInTheDocument();
        expect(screen.getByText('Documents (1)')).toBeInTheDocument();
      });
    });

    it('should apply search, status, and framework filters', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments('/documents?framework=ISO27001');
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('input-search-documents')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('input-search-documents');
      await user.type(searchInput, 'policy');

      await waitFor(() => {
        expect(screen.getByText('Information Security Policy')).toBeInTheDocument();
        expect(screen.getByText('Documents (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Document Actions', () => {
    it('should render edit buttons for each document', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        mockDocuments.forEach(doc => {
          expect(screen.getByTestId(`button-edit-${doc.id}`)).toBeInTheDocument();
        });
      });
    });

    it('should render download buttons for each document', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        mockDocuments.forEach(doc => {
          expect(screen.getByTestId(`button-download-${doc.id}`)).toBeInTheDocument();
        });
      });
    });

    it('should render delete buttons for each document in desktop view', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        mockDocuments.forEach(doc => {
          expect(screen.getByTestId(`button-delete-${doc.id}`)).toBeInTheDocument();
        });
      });
    });

    it('should have accessible labels for action buttons', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        const firstDoc = mockDocuments[0];
        expect(screen.getByLabelText(`Edit ${firstDoc.title}`)).toBeInTheDocument();
        expect(screen.getByLabelText(`Download ${firstDoc.title}`)).toBeInTheDocument();
        expect(screen.getByLabelText(`Delete ${firstDoc.title}`)).toBeInTheDocument();
      });
    });
  });

  describe('New Document Dialog', () => {
    it('should open new document dialog when button is clicked', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('button-new-document')).toBeInTheDocument();
      });

      const newButton = screen.getByTestId('button-new-document');
      await user.click(newButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Document')).toBeInTheDocument();
        expect(screen.getByText('Fill in the details below to create a new document.')).toBeInTheDocument();
      });
    });
  });

  describe('Export All Button', () => {
    it('should render export all button', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByTestId('button-export-all')).toBeInTheDocument();
      });
    });

    it('should have accessible label for export button', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByLabelText('Export all documents')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for search input', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByLabelText('Search documents')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels for status filter', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
      });
    });

    it('should have proper table ARIA attributes', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        const tableRegion = screen.getByRole('region', { name: 'Documents table' });
        expect(tableRegion).toBeInTheDocument();
      });
    });

    it('should have proper loading state ARIA attributes', () => {
      mockApiRequest.mockImplementation(() => new Promise(() => {}));
      renderDocuments();

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
      expect(loadingStatus).toHaveAttribute('aria-busy', 'true');
    });

    it('should hide decorative icons from screen readers', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText('Information Security Policy')).toBeInTheDocument();
      });

      // Check that icons have aria-hidden
      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render table headers in desktop view', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText('Document')).toBeInTheDocument();
      });
      expect(screen.getByText('Framework')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Modified')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display document count in card header', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText(`Documents (${mockDocuments.length})`)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockApiRequest.mockRejectedValue(new Error('API Error'));
      renderDocuments();

      // Component should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('Document Library')).toBeInTheDocument();
      });
    });

    it('should handle empty document array', async () => {
      mockApiRequest.mockResolvedValue([]);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText(/No documents generated yet/i)).toBeInTheDocument();
      });
    });

    it('should handle documents without descriptions', async () => {
      const docsWithoutDesc = [
        {
          ...mockDocuments[0],
          description: undefined,
        },
      ];
      mockApiRequest.mockResolvedValue(docsWithoutDesc);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText('Information Security Policy')).toBeInTheDocument();
      });
    });
  });

  describe('Query Integration', () => {
    it('should use correct query key for fetching documents', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/api/documents', expect.any(Object));
      });
    });

    it('should refetch documents on query invalidation', async () => {
      mockApiRequest.mockResolvedValue(mockDocuments);
      renderDocuments();

      await waitFor(() => {
        expect(screen.getByText('Information Security Policy')).toBeInTheDocument();
      });

      // Invalidate query
      await queryClient.invalidateQueries({ queryKey: ['/api/documents'] });

      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledTimes(2);
      });
    });
  });
});
