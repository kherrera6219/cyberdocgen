import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SecuritySettings } from '../../../client/src/components/profile/SecuritySettings';
import { ProfileData } from '../../../client/src/pages/profile-settings';

describe('SecuritySettings', () => {
    const mockProfile: ProfileData = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImageUrl: null,
        role: 'user',
        phoneNumber: '1234567890',
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: true,
        profilePreferences: {},
        notificationSettings: {},
        createdAt: '2023-01-01T00:00:00.000Z',
        lastLoginAt: '2023-01-02T12:00:00.000Z'
    };

    it('renders security status correctly', () => {
        render(<SecuritySettings profile={mockProfile} />);
        
        expect(screen.getByTestId('badge-2fa-status')).toHaveTextContent('Enabled');
        expect(screen.getByTestId('badge-email-verified')).toHaveTextContent('Verified');
        expect(screen.getByTestId('badge-phone-verified')).toHaveTextContent('Not Verified');
        
        // console.log(screen.getByTestId('text-account-created').textContent);
        expect(screen.getByTestId('text-account-created')).not.toBeEmptyDOMElement();
    });

    it('renders manage button when 2FA enabled', () => {
        render(<SecuritySettings profile={mockProfile} />);
        expect(screen.getByTestId('button-manage-2fa')).toHaveTextContent('Manage 2FA Settings');
    });

    it('renders enable button when 2FA disabled', () => {
        const disabled2FA = { ...mockProfile, twoFactorEnabled: false };
        render(<SecuritySettings profile={disabled2FA} />);
        expect(screen.getByTestId('button-manage-2fa')).toHaveTextContent('Enable Two-Factor Authentication');
    });
});
