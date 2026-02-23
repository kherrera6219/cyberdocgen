import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemporaryLoginDialog } from '../../client/src/components/TemporaryLoginDialog';
import { apiRequest, queryClient } from '../../client/src/lib/queryClient';
import userEvent from '@testing-library/user-event';

const setLocationMock = vi.fn();

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/', setLocationMock],
}));

// Mock API
vi.mock('../../client/src/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
      refetchQueries: vi.fn().mockResolvedValue(undefined),
  }
}));

// Mock useAuth
vi.mock('../../client/src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null, 
    isTemporaryUser: false, 
    isLoading: false 
  }),
}));

describe('TemporaryLoginDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setLocationMock.mockReset();
    });

    it('opens dialog when trigger clicked', async () => {
        render(<TemporaryLoginDialog />);
        
        const trigger = screen.getByTestId('button-temp-login');
        fireEvent.click(trigger);
        
        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Quick Access Login')).toBeInTheDocument();
    });

    it('validates form inputs', async () => {
        const user = userEvent.setup();
        render(<TemporaryLoginDialog />);
        
        fireEvent.click(screen.getByTestId('button-temp-login'));
        
        const submitBtn = screen.getByTestId('button-temp-login-submit');
        await user.click(submitBtn);
        
        expect(await screen.findByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('submits valid form', async () => {
        const user = userEvent.setup();
        (apiRequest as any).mockResolvedValue({ success: true, user: { id: 1 } });
        
        render(<TemporaryLoginDialog />);
        
        fireEvent.click(screen.getByTestId('button-temp-login'));
        
        await user.type(screen.getByTestId('input-temp-name'), 'Test User');
        await user.type(screen.getByTestId('input-temp-email'), 'test@example.com');
        
        await user.click(screen.getByTestId('button-temp-login-submit'));
        
        await waitFor(() => {
            expect(apiRequest).toHaveBeenCalledWith('/api/auth/temp-login', expect.objectContaining({
                method: 'POST',
                body: { name: 'Test User', email: 'test@example.com' }
            }));
            expect(queryClient.refetchQueries).toHaveBeenCalled();
        });
    });

    it('navigates to dashboard after successful temporary login', async () => {
        const user = userEvent.setup();
        (apiRequest as any).mockResolvedValue({ success: true, user: { id: 'temp-123' } });

        render(<TemporaryLoginDialog />);

        fireEvent.click(screen.getByTestId('button-temp-login'));
        await user.type(screen.getByTestId('input-temp-name'), 'Test User');
        await user.type(screen.getByTestId('input-temp-email'), 'test@example.com');
        await user.click(screen.getByTestId('button-temp-login-submit'));

        await waitFor(() => {
            expect(setLocationMock).toHaveBeenCalledWith('/dashboard');
        });
    });
});
