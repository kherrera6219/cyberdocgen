import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PWAInstallPrompt } from '../../client/src/components/PWAInstallPrompt';
import * as serviceWorkerLib from '../../client/src/lib/serviceWorker';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Download: () => <span data-testid="icon-download">Download</span>,
}));

vi.mock('../../client/src/lib/serviceWorker', () => ({
  setupInstallPrompt: vi.fn(),
  showInstallPrompt: vi.fn(),
  isStandalone: vi.fn(),
  isIOS: vi.fn(),
}));

describe('PWAInstallPrompt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        (serviceWorkerLib.isStandalone as any).mockReturnValue(false);
        (serviceWorkerLib.isIOS as any).mockReturnValue(false);
        // Setup mock implementation of setupInstallPrompt to trigger immediately for tests unless overridden
        (serviceWorkerLib.setupInstallPrompt as any).mockImplementation((cb: () => void) => {
            cb(); // Trigger "showPrompt"
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('does not render if isStandalone is true', () => {
        (serviceWorkerLib.isStandalone as any).mockReturnValue(true);
        render(<PWAInstallPrompt />);
        const dialog = screen.queryByRole('dialog');
        expect(dialog).not.toBeInTheDocument();
    });

    it('renders desktop/android prompt when triggered', () => {
        render(<PWAInstallPrompt />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Install CyberDocGen')).toBeInTheDocument();
        expect(screen.getByText('Install')).toBeInTheDocument(); // Button
    });

    it('renders IOS prompt when isIOS is true', () => {
         (serviceWorkerLib.isIOS as any).mockReturnValue(true);
         render(<PWAInstallPrompt />);
         expect(screen.getByText('Install CyberDocGen')).toBeInTheDocument();
         expect(screen.getByText(/Share button/)).toBeInTheDocument();
    });

    it('dismisses prompt when close button clicked', async () => {
        render(<PWAInstallPrompt />);
        
        const closeBtn = screen.getByLabelText('Dismiss install prompt');
        fireEvent.click(closeBtn);
        
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
        
        // Check localStorage
        expect(localStorage.getItem('pwa-install-dismissed')).toBeTruthy();
    });

    it('calls showInstallPrompt when install button clicked', async () => {
        (serviceWorkerLib.showInstallPrompt as any).mockResolvedValue(true);
        render(<PWAInstallPrompt />);
        
        const installBtn = screen.getByText('Install');
        fireEvent.click(installBtn);
        
        expect(serviceWorkerLib.showInstallPrompt).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });
});
