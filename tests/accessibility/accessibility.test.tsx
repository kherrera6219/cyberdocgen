/**
 * Accessibility Tests
 *
 * Automated accessibility testing using axe-core to ensure WCAG 2.2 AA compliance.
 * These tests run on critical components and pages to catch accessibility violations.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend expect matchers
expect.extend(toHaveNoViolations);

// Import components to test
import { SkipNavigation, MainContent } from '../../client/src/components/SkipNavigation';
import { Landing } from '../../client/src/pages/landing';
import Dashboard from '../../client/src/pages/dashboard';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../client/src/lib/queryClient';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Accessibility Tests', () => {
  describe('Pages', () => {
    it('Landing page should not have any accessibility violations', async () => {
      const { container } = render(<Landing />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('Dashboard should not have any accessibility violations', async () => {
      // Mock auth and data if necessary, or test the shell
      const { container } = render(
        <Wrapper>
          <Dashboard />
        </Wrapper>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('SkipNavigation Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(<SkipNavigation />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have correct ARIA attributes', () => {
      const { getByText } = render(<SkipNavigation />);
      const skipLink = getByText('Skip to main content');

      expect(skipLink).toBeTruthy();
      expect(skipLink.getAttribute('href')).toBe('#main-content');
    });
  });

  describe('MainContent Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <MainContent>
          <h1>Test Content</h1>
          <p>This is test content</p>
        </MainContent>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have correct main landmark and id', () => {
      const { container } = render(
        <MainContent>
          <h1>Test Content</h1>
        </MainContent>
      );

      const main = container.querySelector('main');
      expect(main).toBeTruthy();
      expect(main?.getAttribute('id')).toBe('main-content');
      expect(main?.getAttribute('tabIndex')).toBe('-1');
    });
  });

  describe('Critical Pages - Extended Coverage', () => {
    // Skip these tests in CI if they cause issues with lazy loading
    const runExtendedTests = process.env.CI !== 'true';

    it.skipIf(!runExtendedTests)('ai-doc-generator should not have accessibility violations', async () => {
      // Dynamic import to handle lazy loading
      const { default: AiDocGenerator } = await import('../../client/src/pages/ai-doc-generator');
      const { container } = render(
        <Wrapper>
          <AiDocGenerator />
        </Wrapper>
      );
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });

    it.skipIf(!runExtendedTests)('documents page should not have accessibility violations', async () => {
      const { default: Documents } = await import('../../client/src/pages/documents');
      const { container } = render(
        <Wrapper>
          <Documents />
        </Wrapper>
      );
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });

    it.skipIf(!runExtendedTests)('gap-analysis page should not have accessibility violations', async () => {
      const { default: GapAnalysis } = await import('../../client/src/pages/gap-analysis');
      const { container } = render(
        <Wrapper>
          <GapAnalysis />
        </Wrapper>
      );
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });

    it.skipIf(!runExtendedTests)('mfa-setup page should not have accessibility violations', async () => {
      const { default: MfaSetup } = await import('../../client/src/pages/mfa-setup');
      const { container } = render(
        <Wrapper>
          <MfaSetup />
        </Wrapper>
      );
      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });
  });
});

/**
 * Test helper for running accessibility audits on pages
 *
 * Usage:
 * ```ts
 * it('Dashboard should be accessible', async () => {
 *   const { container } = render(<Dashboard />);
 *   await expectNoA11yViolations(container);
 * });
 * ```
 */
export async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe(container, {
    rules: {
      // Disable color-contrast check in tests (requires rendering)
      'color-contrast': { enabled: false },
    },
  });
  expect(results).toHaveNoViolations();
}
