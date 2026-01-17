import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PreferencesForm } from '../../../client/src/components/profile/PreferencesForm';
import { ProfileData } from '../../../client/src/pages/profile-settings';
import userEvent from '@testing-library/user-event';

describe('PreferencesForm', () => {
    const mockSubmit = vi.fn();
    const mockProfile: ProfileData = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImageUrl: null,
        role: 'user',
        phoneNumber: null,
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        profilePreferences: {
            theme: 'dark',
            language: 'es',
            timezone: 'UTC',
            dashboardLayout: 'compact',
            defaultFramework: 'fedramp',
            aiAssistantEnabled: false
        },
        notificationSettings: {},
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
    };

    it('renders with default values', () => {
        render(<PreferencesForm onSubmit={mockSubmit} isLoading={false} />);
        
        // Select triggers display the current value label
        expect(screen.getByTestId('select-theme')).toHaveTextContent('System');
        expect(screen.getByTestId('select-language')).toHaveTextContent('English');
    });

    it('renders with profile values', () => {
        render(<PreferencesForm profile={mockProfile} onSubmit={mockSubmit} isLoading={false} />);
        
        expect(screen.getByTestId('select-theme')).toHaveTextContent('Dark');
        expect(screen.getByTestId('select-language')).toHaveTextContent('Spanish');
    });

    it('submits form data', async () => {
        const user = userEvent.setup();
        render(<PreferencesForm profile={mockProfile} onSubmit={mockSubmit} isLoading={false} />);
        
        // Change theme
        const themeTrigger = screen.getByTestId('select-theme');
        await user.click(themeTrigger);
        await user.click(screen.getByTestId('option-theme-light'));

        await user.click(screen.getByTestId('button-save-preferences'));

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
                theme: 'light',
                language: 'es'
            }), expect.anything());
        });
    });
});
