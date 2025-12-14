import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AIDocGenerator from '@/pages/ai-doc-generator';

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

describe('AI Document Generator Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderGenerator = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AIDocGenerator />
      </QueryClientProvider>
    );
  };

  describe('Initial Rendering', () => {
    it('should render page title and description', () => {
      renderGenerator();

      expect(screen.getByTestId('page-title')).toHaveTextContent('AI Document Generator');
      expect(screen.getByText(/Generate compliance documentation tailored to your organization/i)).toBeInTheDocument();
    });

    it('should render step indicators', () => {
      renderGenerator();

      expect(screen.getByTestId('step-indicator-1')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator-2')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator-3')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator-4')).toBeInTheDocument();
      expect(screen.getByTestId('step-indicator-5')).toBeInTheDocument();
    });

    it('should start on step 1', () => {
      renderGenerator();

      expect(screen.getByText('Company Basics')).toBeInTheDocument();
      expect(screen.getByText(/Enter your company information/i)).toBeInTheDocument();
    });

    it('should show correct navigation buttons for step 1', () => {
      renderGenerator();

      const prevButton = screen.getByTestId('button-previous');
      const nextButton = screen.getByTestId('button-next');

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeEnabled();
    });
  });

  describe('Step 1: Company Basics', () => {
    it('should render all company basic fields', () => {
      renderGenerator();

      expect(screen.getByTestId('input-company-name')).toBeInTheDocument();
      expect(screen.getByTestId('select-industry')).toBeInTheDocument();
      expect(screen.getByTestId('select-company-size')).toBeInTheDocument();
      expect(screen.getByTestId('input-headquarters')).toBeInTheDocument();
    });

    it('should require all fields to proceed', async () => {
      renderGenerator();
      const user = userEvent.setup();

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/Company name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should allow valid company name input', async () => {
      renderGenerator();
      const user = userEvent.setup();

      const companyNameInput = screen.getByTestId('input-company-name');
      await user.type(companyNameInput, 'Acme Corporation');

      expect(companyNameInput).toHaveValue('Acme Corporation');
    });

    it('should allow industry selection', async () => {
      renderGenerator();
      const user = userEvent.setup();

      const industrySelect = screen.getByTestId('select-industry');
      await user.click(industrySelect);

      const techOption = await screen.findByTestId('option-industry-technology');
      await user.click(techOption);

      // Form should have the value
      expect(industrySelect).toBeInTheDocument();
    });

    it('should allow company size selection', async () => {
      renderGenerator();
      const user = userEvent.setup();

      const sizeSelect = screen.getByTestId('select-company-size');
      await user.click(sizeSelect);

      const sizeOption = await screen.findByTestId('option-size-51-200');
      await user.click(sizeOption);

      expect(sizeSelect).toBeInTheDocument();
    });

    it('should allow headquarters input', async () => {
      renderGenerator();
      const user = userEvent.setup();

      const hqInput = screen.getByTestId('input-headquarters');
      await user.type(hqInput, 'San Francisco, CA, USA');

      expect(hqInput).toHaveValue('San Francisco, CA, USA');
    });

    it('should proceed to step 2 with valid data', async () => {
      renderGenerator();
      const user = userEvent.setup();

      // Fill in all required fields
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');

      await user.click(screen.getByTestId('select-industry'));
      const techOption = await screen.findByTestId('option-industry-technology');
      await user.click(techOption);

      await user.click(screen.getByTestId('select-company-size'));
      const sizeOption = await screen.findByTestId('option-size-51-200');
      await user.click(sizeOption);

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Infrastructure & Security')).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Infrastructure & Security', () => {
    beforeEach(async () => {
      renderGenerator();
      const user = userEvent.setup();

      // Fill step 1 and proceed
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');
      await user.click(screen.getByTestId('select-industry'));
      const techOption = await screen.findByTestId('option-industry-technology');
      await user.click(techOption);
      await user.click(screen.getByTestId('select-company-size'));
      const sizeOption = await screen.findByTestId('option-size-51-200');
      await user.click(sizeOption);
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByText('Infrastructure & Security')).toBeInTheDocument();
      });
    });

    it('should render infrastructure fields', () => {
      expect(screen.getByText('Cloud Providers Used')).toBeInTheDocument();
      expect(screen.getByTestId('select-data-classification')).toBeInTheDocument();
      expect(screen.getByTestId('textarea-business-applications')).toBeInTheDocument();
    });

    it('should render all cloud provider checkboxes', () => {
      expect(screen.getByTestId('checkbox-cloud-aws')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-cloud-azure')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-cloud-gcp')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-cloud-private')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-cloud-hybrid')).toBeInTheDocument();
    });

    it('should allow selecting multiple cloud providers', async () => {
      const user = userEvent.setup();

      const awsCheckbox = screen.getByTestId('checkbox-cloud-aws');
      const azureCheckbox = screen.getByTestId('checkbox-cloud-azure');

      await user.click(awsCheckbox);
      await user.click(azureCheckbox);

      expect(awsCheckbox).toBeChecked();
      expect(azureCheckbox).toBeChecked();
    });

    it('should require at least one cloud provider', async () => {
      const user = userEvent.setup();

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Select at least one cloud provider/i)).toBeInTheDocument();
      });
    });

    it('should allow data classification selection', async () => {
      const user = userEvent.setup();

      const classificationSelect = screen.getByTestId('select-data-classification');
      await user.click(classificationSelect);

      const confOption = await screen.findByTestId('option-classification-confidential');
      await user.click(confOption);

      expect(classificationSelect).toBeInTheDocument();
    });

    it('should allow business applications input', async () => {
      const user = userEvent.setup();

      const textarea = screen.getByTestId('textarea-business-applications');
      await user.type(textarea, 'CRM systems, ERP platforms, custom web applications');

      expect(textarea).toHaveValue('CRM systems, ERP platforms, custom web applications');
    });

    it('should allow going back to step 1', async () => {
      const user = userEvent.setup();

      const prevButton = screen.getByTestId('button-previous');
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Company Basics')).toBeInTheDocument();
      });
    });

    it('should proceed to step 3 with valid data', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByTestId('checkbox-cloud-aws'));
      await user.click(screen.getByTestId('select-data-classification'));
      const confOption = await screen.findByTestId('option-classification-confidential');
      await user.click(confOption);
      await user.type(screen.getByTestId('textarea-business-applications'), 'CRM systems and databases');

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Framework Selection')).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Framework Selection', () => {
    beforeEach(async () => {
      renderGenerator();
      const user = userEvent.setup();

      // Complete steps 1 and 2
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');
      await user.click(screen.getByTestId('select-industry'));
      await user.click(await screen.findByTestId('option-industry-technology'));
      await user.click(screen.getByTestId('select-company-size'));
      await user.click(await screen.findByTestId('option-size-51-200'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-cloud-aws')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-cloud-aws'));
      await user.click(screen.getByTestId('select-data-classification'));
      await user.click(await screen.findByTestId('option-classification-confidential'));
      await user.type(screen.getByTestId('textarea-business-applications'), 'CRM systems and databases');
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByText('Framework Selection')).toBeInTheDocument();
      });
    });

    it('should render framework selection fields', () => {
      expect(screen.getByText('Compliance Frameworks')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-framework-iso27001')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-framework-soc2')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-framework-fedramp')).toBeInTheDocument();
      expect(screen.getByTestId('checkbox-framework-nist-csf')).toBeInTheDocument();
    });

    it('should allow selecting multiple frameworks', async () => {
      const user = userEvent.setup();

      const isoCheckbox = screen.getByTestId('checkbox-framework-iso27001');
      const soc2Checkbox = screen.getByTestId('checkbox-framework-soc2');

      await user.click(isoCheckbox);
      await user.click(soc2Checkbox);

      expect(isoCheckbox).toBeChecked();
      expect(soc2Checkbox).toBeChecked();
    });

    it('should show SOC2 trust principles when SOC2 is selected', async () => {
      const user = userEvent.setup();

      const soc2Checkbox = screen.getByTestId('checkbox-framework-soc2');
      await user.click(soc2Checkbox);

      await waitFor(() => {
        expect(screen.getByText('SOC 2 Trust Principles')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-soc2-security')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-soc2-availability')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-soc2-processing-integrity')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-soc2-confidentiality')).toBeInTheDocument();
        expect(screen.getByTestId('checkbox-soc2-privacy')).toBeInTheDocument();
      });
    });

    it('should hide SOC2 trust principles when SOC2 is deselected', async () => {
      const user = userEvent.setup();

      const soc2Checkbox = screen.getByTestId('checkbox-framework-soc2');
      await user.click(soc2Checkbox);

      await waitFor(() => {
        expect(screen.getByText('SOC 2 Trust Principles')).toBeInTheDocument();
      });

      await user.click(soc2Checkbox);

      await waitFor(() => {
        expect(screen.queryByText('SOC 2 Trust Principles')).not.toBeInTheDocument();
      });
    });

    it('should show FedRAMP level when FedRAMP is selected', async () => {
      const user = userEvent.setup();

      const fedrampCheckbox = screen.getByTestId('checkbox-framework-fedramp');
      await user.click(fedrampCheckbox);

      await waitFor(() => {
        expect(screen.getByText('FedRAMP Impact Level')).toBeInTheDocument();
        expect(screen.getByTestId('select-fedramp-level')).toBeInTheDocument();
      });
    });

    it('should allow selecting FedRAMP level', async () => {
      const user = userEvent.setup();

      const fedrampCheckbox = screen.getByTestId('checkbox-framework-fedramp');
      await user.click(fedrampCheckbox);

      await waitFor(() => {
        expect(screen.getByTestId('select-fedramp-level')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('select-fedramp-level'));
      const moderateOption = await screen.findByTestId('option-fedramp-moderate');
      await user.click(moderateOption);

      expect(screen.getByTestId('select-fedramp-level')).toBeInTheDocument();
    });

    it('should require at least one framework', async () => {
      const user = userEvent.setup();

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Select at least one compliance framework/i)).toBeInTheDocument();
      });
    });

    it('should proceed to step 4 with valid data', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByTestId('checkbox-framework-iso27001'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByText('Review & Generate')).toBeInTheDocument();
      });
    });
  });

  describe('Step 4: Review & Generate', () => {
    beforeEach(async () => {
      renderGenerator();
      const user = userEvent.setup();

      // Complete all previous steps
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');
      await user.click(screen.getByTestId('select-industry'));
      await user.click(await screen.findByTestId('option-industry-technology'));
      await user.click(screen.getByTestId('select-company-size'));
      await user.click(await screen.findByTestId('option-size-51-200'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-cloud-aws')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-cloud-aws'));
      await user.click(screen.getByTestId('select-data-classification'));
      await user.click(await screen.findByTestId('option-classification-confidential'));
      await user.type(screen.getByTestId('textarea-business-applications'), 'CRM systems and databases');
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-framework-iso27001')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-framework-iso27001'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByText('Review & Generate')).toBeInTheDocument();
      });
    });

    it('should display company information review', () => {
      expect(screen.getByText('Company Information')).toBeInTheDocument();
      expect(screen.getByTestId('review-company-name')).toHaveTextContent('Acme Corporation');
      expect(screen.getByTestId('review-industry')).toHaveTextContent('Technology');
      expect(screen.getByTestId('review-company-size')).toHaveTextContent('51-200 employees');
      expect(screen.getByTestId('review-headquarters')).toHaveTextContent('San Francisco, CA');
    });

    it('should display infrastructure review', () => {
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      expect(screen.getByTestId('review-cloud-providers')).toBeInTheDocument();
      expect(screen.getByTestId('review-data-classification')).toHaveTextContent('Confidential');
    });

    it('should display selected frameworks', () => {
      expect(screen.getByText('Selected Frameworks')).toBeInTheDocument();
      expect(screen.getByTestId('review-frameworks')).toBeInTheDocument();
    });

    it('should show estimated document count', () => {
      expect(screen.getByText(/Estimated documents to generate: 3/i)).toBeInTheDocument();
    });

    it('should render generate button', () => {
      expect(screen.getByTestId('button-generate-documents')).toBeInTheDocument();
      expect(screen.getByTestId('button-generate-documents')).toHaveTextContent(/Generate Compliance Documents/i);
    });

    it('should only show previous button, not next', () => {
      expect(screen.getByTestId('button-previous')).toBeInTheDocument();
      const nextButtons = screen.queryAllByTestId('button-next');
      expect(nextButtons.length).toBe(0);
    });

    it('should allow going back to step 3', async () => {
      const user = userEvent.setup();

      const prevButton = screen.getByTestId('button-previous');
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Framework Selection')).toBeInTheDocument();
      });
    });
  });

  describe('Step 5: Generation Results', () => {
    it('should show loading state during generation', async () => {
      mockApiRequest.mockImplementation((url) => {
        if (url === '/api/ai/generate-compliance-docs') {
          return Promise.resolve({ jobId: 'job-123' });
        }
        if (url.includes('/api/ai/generation-jobs')) {
          return Promise.resolve({
            id: 'job-123',
            status: 'running',
            progress: 45,
            documentsGenerated: 2,
            totalDocuments: 6,
          });
        }
        return Promise.resolve([]);
      });

      renderGenerator();
      const user = userEvent.setup();

      // Complete all steps
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');
      await user.click(screen.getByTestId('select-industry'));
      await user.click(await screen.findByTestId('option-industry-technology'));
      await user.click(screen.getByTestId('select-company-size'));
      await user.click(await screen.findByTestId('option-size-51-200'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-cloud-aws')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-cloud-aws'));
      await user.click(screen.getByTestId('select-data-classification'));
      await user.click(await screen.findByTestId('option-classification-confidential'));
      await user.type(screen.getByTestId('textarea-business-applications'), 'CRM systems and databases');
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-framework-iso27001')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-framework-iso27001'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('button-generate-documents')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-generate-documents'));

      await waitFor(() => {
        expect(screen.getByText('Generation Results')).toBeInTheDocument();
        expect(screen.getByText(/Your compliance documents are being generated/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('text-progress-percent')).toHaveTextContent('45%');
        expect(screen.getByTestId('progress-generation')).toBeInTheDocument();
      });
    });

    it('should show error state on generation failure', async () => {
      mockApiRequest.mockImplementation((url) => {
        if (url === '/api/ai/generate-compliance-docs') {
          return Promise.resolve({ jobId: 'job-123' });
        }
        if (url.includes('/api/ai/generation-jobs')) {
          return Promise.resolve({
            id: 'job-123',
            status: 'failed',
            progress: 0,
            documentsGenerated: 0,
            totalDocuments: 6,
            errorMessage: 'AI service unavailable',
          });
        }
        return Promise.resolve([]);
      });

      renderGenerator();
      const user = userEvent.setup();

      // Complete all steps and generate
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');
      await user.click(screen.getByTestId('select-industry'));
      await user.click(await screen.findByTestId('option-industry-technology'));
      await user.click(screen.getByTestId('select-company-size'));
      await user.click(await screen.findByTestId('option-size-51-200'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-cloud-aws')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-cloud-aws'));
      await user.click(screen.getByTestId('select-data-classification'));
      await user.click(await screen.findByTestId('option-classification-confidential'));
      await user.type(screen.getByTestId('textarea-business-applications'), 'CRM systems and databases');
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-framework-iso27001')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-framework-iso27001'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('button-generate-documents')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-generate-documents'));

      await waitFor(() => {
        expect(screen.getByText(/Document generation encountered an error/i)).toBeInTheDocument();
        expect(screen.getByTestId('text-error-message')).toHaveTextContent('AI service unavailable');
        expect(screen.getByTestId('button-retry-generation')).toBeInTheDocument();
      });
    });

    it('should show completed state with generated documents', async () => {
      const mockDocs = [
        {
          id: '1',
          title: 'Information Security Policy',
          framework: 'ISO27001',
          status: 'draft',
          content: 'Policy content...',
          aiGenerated: true,
          aiModel: 'claude-3-5-sonnet',
        },
      ];

      mockApiRequest.mockImplementation((url) => {
        if (url === '/api/ai/generate-compliance-docs') {
          return Promise.resolve({ jobId: 'job-123' });
        }
        if (url.includes('/api/ai/generation-jobs')) {
          return Promise.resolve({
            id: 'job-123',
            status: 'completed',
            progress: 100,
            documentsGenerated: 3,
            totalDocuments: 3,
          });
        }
        if (url.includes('/api/documents')) {
          return Promise.resolve(mockDocs);
        }
        return Promise.resolve([]);
      });

      renderGenerator();
      const user = userEvent.setup();

      // Complete all steps and generate
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');
      await user.click(screen.getByTestId('select-industry'));
      await user.click(await screen.findByTestId('option-industry-technology'));
      await user.click(screen.getByTestId('select-company-size'));
      await user.click(await screen.findByTestId('option-size-51-200'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-cloud-aws')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-cloud-aws'));
      await user.click(screen.getByTestId('select-data-classification'));
      await user.click(await screen.findByTestId('option-classification-confidential'));
      await user.type(screen.getByTestId('textarea-business-applications'), 'CRM systems and databases');
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('checkbox-framework-iso27001')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-framework-iso27001'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('button-generate-documents')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('button-generate-documents'));

      await waitFor(() => {
        expect(screen.getByText(/All documents have been generated successfully/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Form Validation', () => {
    it('should validate company name length', async () => {
      renderGenerator();
      const user = userEvent.setup();

      const companyNameInput = screen.getByTestId('input-company-name');
      await user.type(companyNameInput, 'A');

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Company name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate headquarters is required', async () => {
      renderGenerator();
      const user = userEvent.setup();

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Headquarters location is required/i)).toBeInTheDocument();
      });
    });

    it('should validate business applications minimum length', async () => {
      renderGenerator();
      const user = userEvent.setup();

      // Go to step 2
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');
      await user.click(screen.getByTestId('select-industry'));
      await user.click(await screen.findByTestId('option-industry-technology'));
      await user.click(screen.getByTestId('select-company-size'));
      await user.click(await screen.findByTestId('option-size-51-200'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByTestId('textarea-business-applications')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('checkbox-cloud-aws'));
      await user.click(screen.getByTestId('select-data-classification'));
      await user.click(await screen.findByTestId('option-classification-confidential'));
      await user.type(screen.getByTestId('textarea-business-applications'), 'Short');

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/Please describe your business applications/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should maintain form data when navigating back and forth', async () => {
      renderGenerator();
      const user = userEvent.setup();

      // Fill step 1
      await user.type(screen.getByTestId('input-company-name'), 'Acme Corporation');
      await user.type(screen.getByTestId('input-headquarters'), 'San Francisco, CA');
      await user.click(screen.getByTestId('select-industry'));
      await user.click(await screen.findByTestId('option-industry-technology'));
      await user.click(screen.getByTestId('select-company-size'));
      await user.click(await screen.findByTestId('option-size-51-200'));
      await user.click(screen.getByTestId('button-next'));

      await waitFor(() => {
        expect(screen.getByText('Infrastructure & Security')).toBeInTheDocument();
      });

      // Go back
      await user.click(screen.getByTestId('button-previous'));

      await waitFor(() => {
        expect(screen.getByText('Company Basics')).toBeInTheDocument();
      });

      // Check data is preserved
      expect(screen.getByTestId('input-company-name')).toHaveValue('Acme Corporation');
      expect(screen.getByTestId('input-headquarters')).toHaveValue('San Francisco, CA');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderGenerator();

      expect(screen.getByText('Company Name')).toBeInTheDocument();
      expect(screen.getByText('Industry')).toBeInTheDocument();
      expect(screen.getByText('Company Size')).toBeInTheDocument();
      expect(screen.getByText('Headquarters Location')).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      renderGenerator();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should show validation errors with proper messaging', async () => {
      renderGenerator();
      const user = userEvent.setup();

      const nextButton = screen.getByTestId('button-next');
      await user.click(nextButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });
});
