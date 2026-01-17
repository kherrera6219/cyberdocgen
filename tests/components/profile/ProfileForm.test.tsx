import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileForm } from '../../../client/src/components/profile/ProfileForm';
import { ProfileData } from '../../../client/src/pages/profile-settings';
import userEvent from '@testing-library/user-event';

// Wrapper for form context is not needed if the component provides its own Form provider, which it does.
// But we need to ensure Radix/Lucide doesn't crash (handled by setup.ts mocks).

describe('ProfileForm', () => {
    const mockSubmit = vi.fn();
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
        twoFactorEnabled: false,
        profilePreferences: {},
        notificationSettings: {},
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
    };

    it('renders with default empty values when no profile provided', () => {
        render(<ProfileForm onSubmit={mockSubmit} isLoading={false} />);
        
        expect(screen.getByTestId('input-first-name')).toHaveValue('');
        expect(screen.getByTestId('input-last-name')).toHaveValue('');
        expect(screen.getByTestId('input-email')).toHaveValue('');
    });

    it('renders with profile values', () => {
        render(<ProfileForm profile={mockProfile} onSubmit={mockSubmit} isLoading={false} />);
        
        expect(screen.getByTestId('input-first-name')).toHaveValue('John');
        expect(screen.getByTestId('input-last-name')).toHaveValue('Doe');
        expect(screen.getByTestId('input-email')).toHaveValue('test@example.com');
        expect(screen.getByTestId('input-phone')).toHaveValue('1234567890');
    });

    it('disables submit button when loading', () => {
        render(<ProfileForm profile={mockProfile} onSubmit={mockSubmit} isLoading={true} />);
        
        const button = screen.getByTestId('button-save-profile');
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent('Saving...');
    });

    it('submits form data', async () => {
        const user = userEvent.setup();
        render(<ProfileForm profile={mockProfile} onSubmit={mockSubmit} isLoading={false} />);
        
        const firstNameInput = screen.getByTestId('input-first-name');
        await user.clear(firstNameInput);
        await user.type(firstNameInput, 'Jane');

        await user.click(screen.getByTestId('button-save-profile'));

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledWith(expect.objectContaining({
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'test@example.com'
            }), expect.anything());
        });
    });
});
