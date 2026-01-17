import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FrameworkGenerationCards } from '../../../client/src/components/dashboard/FrameworkGenerationCards';
import userEvent from '@testing-library/user-event';

describe('FrameworkGenerationCards', () => {
    const defaultProps = {
        profile: { id: '1' },
        iso27001Progress: 50,
        soc2Progress: 30,
        isGenerating: false,
        onGenerate: vi.fn(),
        onPreview: vi.fn()
    };

    it('renders progress and frameworks', () => {
        render(<FrameworkGenerationCards {...defaultProps} />);
        
        expect(screen.getByText('50% Complete')).toBeTruthy();
        expect(screen.getByText('30% Complete')).toBeTruthy();
        expect(screen.getByTestId('button-generate-iso27001')).toBeEnabled();
        expect(screen.getByTestId('button-generate-soc2')).toBeEnabled();
    });

    it('disables buttons when generating', () => {
        render(<FrameworkGenerationCards {...defaultProps} isGenerating={true} />);
        
        expect(screen.getByTestId('button-generate-iso27001')).toBeDisabled();
        expect(screen.getByTestId('button-generate-soc2')).toBeDisabled();
        // Preview buttons should still be enabled? Original code logic checked:
        // Variant outline buttons in older code were onClick props, disable wasn't explicit there?
        // Wait, looking at extracted code:
        // Preview buttons DO NOT have `disabled` prop set. So they should be enabled.
        expect(screen.getByTestId('button-preview-iso27001')).toBeEnabled();
    });

    it('calls triggers when clicked', async () => {
        const onGenerate = vi.fn();
        const onPreview = vi.fn();
        
        render(<FrameworkGenerationCards {...defaultProps} onGenerate={onGenerate} onPreview={onPreview} />);
        
        await userEvent.click(screen.getByTestId('button-generate-iso27001'));
        expect(onGenerate).toHaveBeenCalledWith('ISO27001');

        await userEvent.click(screen.getByTestId('button-preview-soc2'));
        expect(onPreview).toHaveBeenCalledWith('SOC2');
    });
});
