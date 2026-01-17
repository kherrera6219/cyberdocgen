import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CloudIntegrationList } from '../../../client/src/components/admin/CloudIntegrationList';
import userEvent from '@testing-library/user-event';

describe('CloudIntegrationList', () => {
    const mockIntegrations = [
        {
            id: 'int1', provider: 'google_drive', displayName: 'Google Drive', email: 'test@gmail.com',
            isActive: true, lastSyncAt: '2023-01-01', syncStatus: 'completed', createdAt: '2023-01-01'
        }
    ];

    it('renders empty state', () => {
        render(
            <CloudIntegrationList 
                integrations={[]} 
                onDelete={vi.fn()} 
                isDeleting={false} 
            />
        );
        expect(screen.getByText('No cloud integrations found')).toBeTruthy();
    });

    it('renders integrations list', () => {
        render(
            <CloudIntegrationList 
                integrations={mockIntegrations} 
                onDelete={vi.fn()} 
                isDeleting={false} 
            />
        );
        expect(screen.getByText('Google Drive')).toBeTruthy();
        expect(screen.getByText('test@gmail.com')).toBeTruthy();
        expect(screen.getByText('Active')).toBeTruthy();
        expect(screen.getByText('completed')).toBeTruthy();
    });

    it('calls onDelete when delete button clicked', async () => {
        const onDelete = vi.fn();
        render(
            <CloudIntegrationList 
                integrations={mockIntegrations} 
                onDelete={onDelete} 
                isDeleting={false} 
            />
        );
        
        const deleteBtn = screen.getByTestId('delete-integration-int1');
        await userEvent.click(deleteBtn);
        expect(onDelete).toHaveBeenCalledWith('int1');
    });
});
