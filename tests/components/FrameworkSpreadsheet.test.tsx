import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FrameworkSpreadsheet } from '@/components/compliance/FrameworkSpreadsheet';

// Mock the hooks and API
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockApiRequest = vi.fn();
vi.mock('@/lib/queryClient', () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}));

describe('FrameworkSpreadsheet Component', () => {
    let queryClient: QueryClient;

    const mockTemplates = [
        {
            templateId: 'temp-1',
            templateTitle: 'Template 1',
            templateDescription: 'Description 1',
            category: 'Category 1',
            fields: [
                {
                    id: 'field-1',
                    fieldName: 'Field 1',
                    variableKey: 'var_1',
                    label: 'Field 1 Label',
                    type: 'text',
                    currentValue: 'Value 1',
                    status: 'mapped',
                    required: true,
                    templateId: 'temp-1',
                    templateTitle: 'Template 1'
                }
            ]
        }
    ];

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    queryFn: async ({ queryKey }) => {
                        const url = queryKey.join("/");
                        const res = await mockApiRequest(url, 'GET');
                        return res.json();
                    }
                },
            },
        });
        vi.clearAllMocks();
        
        // Default response for templates
        mockApiRequest.mockImplementation((url) => {
            if (url.includes('spreadsheet-templates')) {
                return {
                    ok: true,
                    json: async () => mockTemplates
                };
            }
            return { ok: true, json: async () => ({}) };
        });
    });

    const renderSpreadsheet = (props = { framework: 'iso27001', companyProfileId: 'cp-1' }) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <FrameworkSpreadsheet {...props} />
            </QueryClientProvider>
        );
    };

    it('renders the spreadsheet title', async () => {
        renderSpreadsheet();
        await waitFor(() => {
            expect(screen.getByTestId('text-spreadsheet-title')).toHaveTextContent('Template Data');
        });
    });

    it('renders templates from API', async () => {
        renderSpreadsheet();
        await waitFor(() => {
            expect(screen.getByText('Template 1')).toBeInTheDocument();
        });
    });

    it('shows empty state if no templates', async () => {
        mockApiRequest.mockResolvedValue({
            ok: true,
            json: async () => []
        });
        renderSpreadsheet();
        await waitFor(() => {
            expect(screen.getByText(/No templates found/i)).toBeInTheDocument();
        });
    });

    it('allows searching templates', async () => {
        renderSpreadsheet();
        await waitFor(() => expect(screen.getByText('Template 1')).toBeInTheDocument());
        
        const searchInput = screen.getByTestId('input-template-search');
        await userEvent.type(searchInput, 'non-existent');
        
        expect(screen.getByText(/No templates match your search criteria/i)).toBeInTheDocument();
    });

    it('opens accordion to show fields', async () => {
        renderSpreadsheet();
        await waitFor(() => expect(screen.getByText('Template 1')).toBeInTheDocument());
        
        const trigger = screen.getByTestId('accordion-template-temp-1');
        fireEvent.click(trigger);
        
        expect(screen.getByText('Field 1 Label')).toBeInTheDocument();
        expect(screen.getByTestId('text-value-field-1')).toHaveTextContent('Value 1');
    });

    it('allows editing a field', async () => {
        renderSpreadsheet();
        await waitFor(() => expect(screen.getByText('Template 1')).toBeInTheDocument());
        fireEvent.click(screen.getByTestId('accordion-template-temp-1'));
        
        const editButton = screen.getByTestId('button-edit-field-1');
        fireEvent.click(editButton);
        
        const input = screen.getByTestId('input-edit-field-1');
        fireEvent.change(input, { target: { value: 'New Value' } });
        
        const saveButton = screen.getByTestId('button-save-edit-field-1');
        fireEvent.click(saveButton);
        
        expect(screen.getByTestId('text-value-field-1')).toHaveTextContent('New Value');
        expect(screen.getByText('Modified')).toBeInTheDocument();
    });

    it('calls save API when "Save All Changes" is clicked', async () => {
        // Refine mock to handle both query and mutation
        mockApiRequest.mockImplementation((url, method) => {
            if (url.includes('spreadsheet-templates')) {
                return { ok: true, json: async () => mockTemplates };
            }
            if (method === 'PATCH' && url.includes('template-data')) {
                return { ok: true, json: async () => ({ success: true }) };
            }
            return { ok: true, json: async () => ({}) };
        });
        
        renderSpreadsheet({ framework: 'iso27001', companyProfileId: 'cp-1' });
        await waitFor(() => expect(screen.getByText('Template 1')).toBeInTheDocument());
        
        // Ensure companyProfileId is recognized
        expect(screen.queryByText(/Select a company profile/i)).not.toBeInTheDocument();
        
        fireEvent.click(screen.getByTestId('accordion-template-temp-1'));
        
        await waitFor(() => expect(screen.getByTestId('button-edit-field-1')).toBeInTheDocument());
        fireEvent.click(screen.getByTestId('button-edit-field-1'));
        
        const input = screen.getByTestId('input-edit-field-1');
        fireEvent.change(input, { target: { value: 'Changed Value' } });
        fireEvent.click(screen.getByTestId('button-save-edit-field-1'));
        
        await waitFor(() => expect(screen.getByText('Modified')).toBeInTheDocument());
        
        const saveAllButton = screen.getByTestId('button-save-all-changes');
        console.log('Button HTML:', saveAllButton.outerHTML);
        console.log('Button Disabled:', saveAllButton.hasAttribute('disabled'));
        
        await waitFor(() => {
            expect(saveAllButton).not.toBeDisabled();
        }, { timeout: 3000 });
        
        fireEvent.click(saveAllButton);
        
        await waitFor(() => {
            expect(mockApiRequest).toHaveBeenCalledWith('PATCH', expect.stringContaining('template-data'), expect.any(Object));
        });
    });
});
