import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GapAnalysis from '@/pages/gap-analysis';

// Mock the hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'test@example.com',
      organizationId: 1,
    },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Gap Analysis Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          queryFn: async () => {
            // Default queryFn to avoid "No queryFn" errors
            return [];
          },
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderGapAnalysis = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <GapAnalysis />
      </QueryClientProvider>
    );
  };

  describe('Initial Rendering', () => {
    it('should render page header with title', () => {
      renderGapAnalysis();

      expect(screen.getByText('Compliance Gap Analysis')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive assessment of platform readiness')).toBeInTheDocument();
    });

    it('should render export and analyze buttons', () => {
      renderGapAnalysis();

      expect(screen.getByRole('button', { name: /Export/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analyze/i })).toBeInTheDocument();
    });

    it('should render executive summary cards', () => {
      renderGapAnalysis();

      expect(screen.getByText('Overall Score')).toBeInTheDocument();
      expect(screen.getByText('Total Gaps')).toBeInTheDocument();
      expect(screen.getByText('Critical Issues')).toBeInTheDocument();
      expect(screen.getByText('Estimated Timeline')).toBeInTheDocument();
    });

    it('should display overall score', () => {
      renderGapAnalysis();

      const scoreRegex = /\d+%/;
      expect(screen.getAllByText(scoreRegex).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Needs Improvement').length).toBeGreaterThan(0);
    });

    it('should display total gaps count', () => {
      renderGapAnalysis();

      expect(screen.getAllByText('Across all categories').length).toBeGreaterThan(0);
      // Total gaps should be 27 (4+3+5+4+6+5)
      expect(screen.getAllByText('27').length).toBeGreaterThan(0);
    });

    it('should display critical issues count', () => {
      renderGapAnalysis();

      expect(screen.getAllByText('Immediate attention required').length).toBeGreaterThan(0);
      // 3 critical categories
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    });

    it('should display estimated timeline', () => {
      renderGapAnalysis();

      expect(screen.getByText('6-8')).toBeInTheDocument();
      expect(screen.getByText('Months to full compliance')).toBeInTheDocument();
    });
  });

  describe('Analysis Filters', () => {
    it('should render filter section', () => {
      renderGapAnalysis();

      expect(screen.getByText('Analysis Filters')).toBeInTheDocument();
    });

    it('should render category filter dropdown', () => {
      renderGapAnalysis();

      const categoryFilter = screen.getByRole('combobox', { name: /Category/i });
      expect(categoryFilter).toBeInTheDocument();
    });

    it('should render priority filter dropdown', () => {
      renderGapAnalysis();

      const priorityFilter = screen.getByRole('combobox', { name: /Priority/i });
      expect(priorityFilter).toBeInTheDocument();
    });

    it('should render search button', () => {
      renderGapAnalysis();

      expect(screen.getByRole('button', { name: /Search Gaps/i })).toBeInTheDocument();
    });

    it('should filter categories by selection', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      // Initially should show all 6 categories
      expect(screen.getByText('Framework Integration')).toBeInTheDocument();
      expect(screen.getByText('Document Generation')).toBeInTheDocument();

      // Click category filter
      const categoryFilter = screen.getByRole('combobox', { name: /Category/i });
      await user.click(categoryFilter);

      // Select specific category
      const frameworkOption = await screen.findByRole('option', { name: 'Framework Integration' });
      await user.click(frameworkOption);

      // Should only show Framework Integration category
      await waitFor(() => {
        expect(screen.getByText('Framework Integration')).toBeInTheDocument();
        // Other categories should not be visible in the gap cards
        const gapCards = screen.getAllByRole('heading', { level: 3 });
        expect(gapCards.length).toBe(1);
      });
    });

    it('should filter by priority level', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      // Click priority filter
      const priorityFilter = screen.getByRole('combobox', { name: /Priority/i });
      await user.click(priorityFilter);

      // Select critical priority
      const criticalOption = await screen.findByRole('option', { name: /^Critical$/i });
      await user.click(criticalOption);

      await waitFor(() => {
        // Should show only critical categories (3 total)
        const badges = screen.getAllByText('CRITICAL');
        expect(badges.length).toBe(3);
      });
    });

    it('should reset filters when selecting "All"', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      // Apply category filter
      const categoryFilter = screen.getByRole('combobox', { name: /Category/i });
      await user.click(categoryFilter);
      const specificCategory = await screen.findByRole('option', { name: 'Risk Assessment' });
      await user.click(specificCategory);

      await waitFor(() => {
        const gapCards = screen.getAllByRole('heading', { level: 3 });
        expect(gapCards.length).toBe(1);
      });

      // Reset to all categories
      await user.click(categoryFilter);
      const allOption = await screen.findByRole('option', { name: 'All Categories' });
      await user.click(allOption);

      await waitFor(() => {
        expect(screen.getByText('Framework Integration')).toBeInTheDocument();
        expect(screen.getByText('Document Generation')).toBeInTheDocument();
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tab triggers', () => {
      renderGapAnalysis();

      expect(screen.getByRole('tab', { name: /Gap Analysis/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Framework/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Roadmap/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Priorit/i })).toBeInTheDocument();
    });

    it('should default to Gap Analysis tab', () => {
      renderGapAnalysis();

      const gapTab = screen.getByRole('tab', { name: /Gap Analysis/i });
      expect(gapTab).toHaveAttribute('data-state', 'active');
    });

    it('should switch to Framework Coverage tab', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const frameworkTab = screen.getByRole('tab', { name: /Framework/i });
      await user.click(frameworkTab);

      await waitFor(() => {
        expect(screen.getByText('ISO 27001:2022')).toBeInTheDocument();
        expect(screen.getByText('SOC 2 Type 2')).toBeInTheDocument();
        expect(screen.getByText('FedRAMP Low')).toBeInTheDocument();
        expect(screen.getByText('NIST 800-53 Rev 5')).toBeInTheDocument();
      });
    });

    it('should switch to Implementation Roadmap tab', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const roadmapTab = screen.getByRole('tab', { name: /Roadmap/i });
      await user.click(roadmapTab);

      await waitFor(() => {
        expect(screen.getByText('Implementation Timeline: 6-8 Months')).toBeInTheDocument();
        expect(screen.getByText('Phase 1: Foundation')).toBeInTheDocument();
        expect(screen.getByText('Phase 2: Core Features')).toBeInTheDocument();
        expect(screen.getByText('Phase 3: Enterprise')).toBeInTheDocument();
        expect(screen.getByText('Phase 4: Advanced AI')).toBeInTheDocument();
      });
    });

    it('should switch to Priority Actions tab', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const priorityTab = screen.getByRole('tab', { name: /Priorit/i });
      await user.click(priorityTab);

      await waitFor(() => {
        expect(screen.getByText('Framework Control Libraries Implementation')).toBeInTheDocument();
        expect(screen.getByText('Enhanced Document Generation Engine')).toBeInTheDocument();
        expect(screen.getByText('Automated Gap Analysis Engine')).toBeInTheDocument();
      });
    });
  });

  describe('Gap Analysis Tab Content', () => {
    it('should display all gap categories', () => {
      renderGapAnalysis();

      expect(screen.getByText('Framework Integration')).toBeInTheDocument();
      expect(screen.getByText('Document Generation')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
      expect(screen.getByText('Integration Ecosystem')).toBeInTheDocument();
      expect(screen.getByText('Enterprise Features')).toBeInTheDocument();
      expect(screen.getByText('User Experience')).toBeInTheDocument();
    });

    it('should display status badges for each category', () => {
      renderGapAnalysis();

      const criticalBadges = screen.getAllByText('CRITICAL');
      expect(criticalBadges.length).toBe(3);

      const highBadges = screen.getAllByText('HIGH');
      expect(highBadges.length).toBe(2);

      const mediumBadges = screen.getAllByText('MEDIUM');
      expect(mediumBadges.length).toBe(1);
    });

    it('should display implementation scores for each category', () => {
      renderGapAnalysis();

      // Framework Integration: 15%
      expect(screen.getByText('15%')).toBeInTheDocument();
      // Document Generation: 25%
      expect(screen.getByText('25%')).toBeInTheDocument();
      // Risk Assessment: 0%
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should display gap counts for each category', () => {
      renderGapAnalysis();

      // Should show gap numbers: 4, 3, 5, 4, 6, 5
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('should display category descriptions', () => {
      renderGapAnalysis();

      expect(screen.getByText(/Missing actual compliance framework control mappings/i)).toBeInTheDocument();
      expect(screen.getByText(/Basic AI content generation without compliance-specific templates/i)).toBeInTheDocument();
      expect(screen.getByText(/No automated risk assessment capabilities/i)).toBeInTheDocument();
    });

    it('should display recommendations for each category', () => {
      renderGapAnalysis();

      expect(screen.getByText('Key Recommendations:')).toBeInTheDocument();
      expect(screen.getByText(/Implement complete ISO 27001 control library/i)).toBeInTheDocument();
      expect(screen.getByText(/Build framework-specific document templates/i)).toBeInTheDocument();
    });

    it('should show truncated recommendations with count', () => {
      renderGapAnalysis();

      // Framework Integration has 4 recommendations, should show "+1 more"
      expect(screen.getByText(/\+1 more recommendations/i)).toBeInTheDocument();
    });
  });

  describe('Framework Coverage Tab', () => {
    it('should display all compliance frameworks', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const frameworkTab = screen.getByRole('tab', { name: /Framework/i });
      await user.click(frameworkTab);

      await waitFor(() => {
        expect(screen.getByText('ISO 27001:2022')).toBeInTheDocument();
        expect(screen.getByText('SOC 2 Type 2')).toBeInTheDocument();
        expect(screen.getByText('FedRAMP Low')).toBeInTheDocument();
        expect(screen.getByText('NIST 800-53 Rev 5')).toBeInTheDocument();
      });
    });

    it('should display framework coverage percentages', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const frameworkTab = screen.getByRole('tab', { name: /Framework/i });
      await user.click(frameworkTab);

      await waitFor(() => {
        expect(screen.getByText(/Coverage: 15%/i)).toBeInTheDocument();
        expect(screen.getByText(/Coverage: 5%/i)).toBeInTheDocument();
        expect(screen.getByText(/Coverage: 0%/i)).toBeInTheDocument();
      });
    });

    it('should display control counts', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const frameworkTab = screen.getByRole('tab', { name: /Framework/i });
      await user.click(frameworkTab);

      await waitFor(() => {
        expect(screen.getByText('114')).toBeInTheDocument(); // ISO 27001 total
        expect(screen.getByText('64')).toBeInTheDocument(); // SOC 2 total
        expect(screen.getByText('325')).toBeInTheDocument(); // FedRAMP total
        expect(screen.getByText('1000')).toBeInTheDocument(); // NIST total
      });
    });

    it('should display Total Controls, Implemented, and Missing labels', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const frameworkTab = screen.getByRole('tab', { name: /Framework/i });
      await user.click(frameworkTab);

      await waitFor(() => {
        const totalLabels = screen.getAllByText('Total Controls');
        expect(totalLabels.length).toBe(4);

        const implementedLabels = screen.getAllByText('Implemented');
        expect(implementedLabels.length).toBe(4);

        const missingLabels = screen.getAllByText('Missing');
        expect(missingLabels.length).toBe(4);
      });
    });

    it('should display framework status badges', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const frameworkTab = screen.getByRole('tab', { name: /Framework/i });
      await user.click(frameworkTab);

      await waitFor(() => {
        expect(screen.getByText('partial')).toBeInTheDocument();
        const missingBadges = screen.getAllByText('missing');
        expect(missingBadges.length).toBe(3);
      });
    });
  });

  describe('Implementation Roadmap Tab', () => {
    it('should display timeline alert', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const roadmapTab = screen.getByRole('tab', { name: /Roadmap/i });
      await user.click(roadmapTab);

      await waitFor(() => {
        expect(screen.getByText('Implementation Timeline: 6-8 Months')).toBeInTheDocument();
        expect(screen.getByText(/Estimated timeline to achieve enterprise-grade/i)).toBeInTheDocument();
      });
    });

    it('should display all four phases', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const roadmapTab = screen.getByRole('tab', { name: /Roadmap/i });
      await user.click(roadmapTab);

      await waitFor(() => {
        expect(screen.getByText('Phase 1: Foundation')).toBeInTheDocument();
        expect(screen.getByText('Phase 2: Core Features')).toBeInTheDocument();
        expect(screen.getByText('Phase 3: Enterprise')).toBeInTheDocument();
        expect(screen.getByText('Phase 4: Advanced AI')).toBeInTheDocument();
      });
    });

    it('should display phase timelines', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const roadmapTab = screen.getByRole('tab', { name: /Roadmap/i });
      await user.click(roadmapTab);

      await waitFor(() => {
        expect(screen.getByText('Month 1-2')).toBeInTheDocument();
        expect(screen.getByText('Month 2-4')).toBeInTheDocument();
        expect(screen.getByText('Month 4-6')).toBeInTheDocument();
        expect(screen.getByText('Month 6-8')).toBeInTheDocument();
      });
    });

    it('should display phase items', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const roadmapTab = screen.getByRole('tab', { name: /Roadmap/i });
      await user.click(roadmapTab);

      await waitFor(() => {
        expect(screen.getByText('Framework control libraries')).toBeInTheDocument();
        expect(screen.getByText('Risk assessment automation')).toBeInTheDocument();
        expect(screen.getByText('Multi-tenancy')).toBeInTheDocument();
        expect(screen.getByText('Predictive analytics')).toBeInTheDocument();
      });
    });

    it('should display priority badges for each phase', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const roadmapTab = screen.getByRole('tab', { name: /Roadmap/i });
      await user.click(roadmapTab);

      await waitFor(() => {
        // 1 critical, 2 high, 1 medium
        const priorityBadges = screen.getAllByText(/critical|high|medium/i);
        expect(priorityBadges.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('Priority Actions Tab', () => {
    it('should display priority recommendations', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const priorityTab = screen.getByRole('tab', { name: /Priorit/i });
      await user.click(priorityTab);

      await waitFor(() => {
        expect(screen.getByText('Framework Control Libraries Implementation')).toBeInTheDocument();
        expect(screen.getByText('Enhanced Document Generation Engine')).toBeInTheDocument();
        expect(screen.getByText('Automated Gap Analysis Engine')).toBeInTheDocument();
        expect(screen.getByText('Risk Assessment Automation')).toBeInTheDocument();
        expect(screen.getByText('Compliance Dashboard & Reporting')).toBeInTheDocument();
      });
    });

    it('should display timeframes for each recommendation', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const priorityTab = screen.getByRole('tab', { name: /Priorit/i });
      await user.click(priorityTab);

      await waitFor(() => {
        expect(screen.getByText('0-30 days')).toBeInTheDocument();
        expect(screen.getByText('0-60 days')).toBeInTheDocument();
        expect(screen.getByText('1-3 months')).toBeInTheDocument();
      });
    });

    it('should display effort levels', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const priorityTab = screen.getByRole('tab', { name: /Priorit/i });
      await user.click(priorityTab);

      await waitFor(() => {
        const effortBadges = screen.getAllByText(/High Effort|Medium Effort/i);
        expect(effortBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display impact descriptions', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const priorityTab = screen.getByRole('tab', { name: /Priorit/i });
      await user.click(priorityTab);

      await waitFor(() => {
        expect(screen.getByText(/Enables actual compliance documentation generation/i)).toBeInTheDocument();
        expect(screen.getByText(/Ensures generated documents meet regulatory requirements/i)).toBeInTheDocument();
        expect(screen.getByText(/Provides actionable compliance roadmap/i)).toBeInTheDocument();
      });
    });

    it('should display priority badges', async () => {
      renderGapAnalysis();
      const user = userEvent.setup();

      const priorityTab = screen.getByRole('tab', { name: /Priorit/i });
      await user.click(priorityTab);

      await waitFor(() => {
        const criticalBadges = screen.getAllByText(/Critical/i);
        const highBadges = screen.getAllByText(/High/i);
        expect(criticalBadges.length + highBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Immediate Action Section', () => {
    it('should display immediate action card', () => {
      renderGapAnalysis();

      expect(screen.getByText('Immediate Action Required')).toBeInTheDocument();
    });

    it('should display critical priority alert', () => {
      renderGapAnalysis();

      expect(screen.getByText('Critical Priority')).toBeInTheDocument();
      expect(screen.getByText(/Platform currently lacks actual compliance framework integration/i)).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      renderGapAnalysis();

      expect(screen.getByRole('button', { name: /Start Framework Implementation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Full Report/i })).toBeInTheDocument();
    });
  });

  describe('UI Components', () => {
    it('should display progress bars', () => {
      renderGapAnalysis();

      // Progress bars should be present for each category
      const progressBars = document.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should display icons throughout the page', () => {
      renderGapAnalysis();

      // Check for various icon elements
      const icons = document.querySelectorAll('svg[class*="lucide"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should use proper card components', () => {
      renderGapAnalysis();

      const cards = document.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render mobile-friendly text alternatives', () => {
      renderGapAnalysis();

      // Check for responsive text (some elements hidden on mobile, some on desktop)
      expect(screen.getByText(/Export/i)).toBeInTheDocument();
      expect(screen.getByText(/Analyze/i)).toBeInTheDocument();
    });

    it('should render tab labels with responsive text', () => {
      renderGapAnalysis();

      // Tabs should have both full and shortened text for different screen sizes
      const gapAnalysisTab = screen.getByRole('tab', { name: /Gap Analysis/i });
      expect(gapAnalysisTab).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderGapAnalysis();

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Compliance Gap Analysis');
    });

    it('should have accessible button labels', () => {
      renderGapAnalysis();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // All buttons should have accessible text
      buttons.forEach(button => {
        expect(button.textContent).toBeTruthy();
      });
    });

    it('should have proper ARIA roles', () => {
      renderGapAnalysis();

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(4);

      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toBeInTheDocument();
    });

    it('should have progress bars with proper ARIA attributes', () => {
      renderGapAnalysis();

      const progressBars = document.querySelectorAll('[role="progressbar"]');
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-valuemin');
        expect(bar).toHaveAttribute('aria-valuemax');
      });
    });
  });

  describe('Data Calculations', () => {
    it('should correctly calculate overall score', () => {
      renderGapAnalysis();

      // Overall score = (15+25+0+10+20+45)/6 = 19.16 ≈ 19%
      const scoreElement = screen.getByText(/19%/);
      expect(scoreElement).toBeInTheDocument();
    });

    it('should correctly sum total gaps', () => {
      renderGapAnalysis();

      // Total gaps = 4+3+5+4+6+5 = 27
      expect(screen.getByText('27')).toBeInTheDocument();
    });

    it('should correctly count critical gaps', () => {
      renderGapAnalysis();

      // 3 critical categories
      const criticalCount = screen.getAllByText('3')[0];
      expect(criticalCount).toBeInTheDocument();
    });
  });
});
