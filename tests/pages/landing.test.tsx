import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Landing } from '../../client/src/pages/landing';
import { useLocation } from 'wouter';

// Mock Link and useLocation from wouter
vi.mock('wouter', () => ({
  Link: ({ href, children }: any) => <a href={href}>{children}</a>,
  useLocation: vi.fn(),
  useRoute: vi.fn(),
}));

// Mock PublicHeader to simplify test
vi.mock('../../client/src/components/layout/PublicHeader', () => ({
  PublicHeader: () => <div data-testid="public-header">Header</div>
}));

// Mock TemporaryLoginDialog to simplify/isolate logic
vi.mock('../../client/src/components/TemporaryLoginDialog', () => ({
  TemporaryLoginDialog: ({ trigger }: any) => (
    <div data-testid="login-dialog-trigger">
      {trigger}
    </div>
  )
}));

describe('Landing Page', () => {
    it('renders hero section correctly', () => {
        render(<Landing />);
        expect(screen.getByText(/Compliance Documentation/i)).toBeTruthy();
        expect(screen.getByText(/Powered by AI/i)).toBeTruthy();
        expect(screen.getByText(/Generate audit-ready documentation/i)).toBeTruthy();
    });

    it('renders AI models section', () => {
        render(<Landing />);
        expect(screen.getByText(/Powered by Leading AI Models/i)).toBeTruthy();
        expect(screen.getByText('GPT-5.1')).toBeTruthy();
        expect(screen.getByText('Claude Opus 4.5')).toBeTruthy();
        expect(screen.getByText('Gemini 3.0 Pro')).toBeTruthy();
    });

    it('renders features grid', () => {
        render(<Landing />);
        expect(screen.getByText('Multi-Framework Support')).toBeTruthy();
        expect(screen.getByText('AI Document Generation')).toBeTruthy();
        expect(screen.getByText('Gap Analysis')).toBeTruthy();
    });

    it('renders frameworks section', () => {
        render(<Landing />);
        expect(screen.getByText('ISO 27001')).toBeTruthy();
        expect(screen.getByText('SOC 2 Type II')).toBeTruthy();
        expect(screen.getByText('FedRAMP')).toBeTruthy();
    });

    it('renders login buttons', () => {
        render(<Landing />);
        // There are two login buttons (hero + CTA)
        const loginButtons = screen.getAllByTestId('button-get-started').concat(screen.getAllByTestId('button-start-free-trial'));
        expect(loginButtons.length).toBeGreaterThan(0);
    });

    it('sets dark mode by default', () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        render(<Landing />);
        // Checks effect logic
        // If theme is not set, it sets 'dark'
        // This is hard to test with JSDOM as localStorage persists across tests sometimes?
        // But we can check if document.documentElement.classList contains 'dark'
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
});
