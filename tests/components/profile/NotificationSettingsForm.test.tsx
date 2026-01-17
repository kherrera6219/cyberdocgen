import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationSettingsForm } from '../../../client/src/components/profile/NotificationSettingsForm';
import { ProfileData } from '../../../client/src/pages/profile-settings';
import userEvent from '@testing-library/user-event';

describe('NotificationSettingsForm', () => {
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
        profilePreferences: {},
        notificationSettings: {
            emailNotifications: false,
            complianceAlerts: false
        },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
    };

    it('renders with profile values', () => {
        render(<NotificationSettingsForm profile={mockProfile} onSubmit={mockSubmit} isLoading={false} />);
        
        // Check switches
        // Radix switch uses role="switch" and aria-checked
        const emailSwitch = screen.getByTestId('switch-email-notifications');
        expect(emailSwitch).toHaveAttribute('aria-checked', 'false');
    });

    it('toggles switch and submits', async () => {
        const user = userEvent.setup();
        render(<NotificationSettingsForm profile={mockProfile} onSubmit={mockSubmit} isLoading={false} />);
        
        const emailSwitch = screen.getByTestId('switch-email-notifications');
        await user.click(emailSwitch);
        
        expect(emailSwitch).toHaveAttribute('aria-checked', 'true');

        await user.click(screen.getByTestId('button-save-notifications'));

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
                emailNotifications: true
            }), expect.anything());
        });
    });
});
