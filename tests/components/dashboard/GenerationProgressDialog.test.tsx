import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GenerationProgressDialog } from '../../../client/src/components/dashboard/GenerationProgressDialog';
import userEvent from '@testing-library/user-event';

describe('GenerationProgressDialog', () => {
    it('renders progress correctly', () => {
        render(
            <GenerationProgressDialog 
                isOpen={true} 
                onOpenChange={vi.fn()} 
                currentFramework="ISO27001" 
                progress={45} 
                onCancel={vi.fn()} 
            />
        );

        expect(screen.getByText('Generating ISO27001 Documents')).toBeTruthy();
        expect(screen.getByText('45%')).toBeTruthy();
    });

    it('calls onCancel when button clicked', async () => {
        const onCancel = vi.fn();
        render(
            <GenerationProgressDialog 
                isOpen={true} 
                onOpenChange={vi.fn()} 
                currentFramework="ISO27001" 
                progress={45} 
                onCancel={onCancel} 
            />
        );

        await userEvent.click(screen.getByTestId('button-cancel-generation'));
        expect(onCancel).toHaveBeenCalled();
    });
});
