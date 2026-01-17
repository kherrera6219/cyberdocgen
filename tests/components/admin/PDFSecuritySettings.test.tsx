import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PDFSecuritySettings } from '../../../client/src/components/admin/PDFSecuritySettings';
import userEvent from '@testing-library/user-event';

describe('PDFSecuritySettings', () => {
    const mockSave = vi.fn();

    it('renders security options', () => {
        render(<PDFSecuritySettings onSave={mockSave} isSaving={false} />);
        
        expect(screen.getByLabelText('Default Encryption Level')).toBeTruthy();
        expect(screen.getByLabelText('Allow Printing')).toBeTruthy();
        expect(screen.getByLabelText('Default Watermark Text')).toBeTruthy();
    });

    it('submits form changes', async () => {
        render(<PDFSecuritySettings onSave={mockSave} isSaving={false} />);
        
        await userEvent.type(screen.getByLabelText('Default Watermark Text'), ' - DRAFT');
        await userEvent.click(screen.getByText('Save PDF Defaults'));
        
        await waitFor(() => {
            expect(mockSave).toHaveBeenCalled();
        });
        
        const formData = mockSave.mock.calls[0][0];
        // Note: Default value was 'CONFIDENTIAL', we typed ' - DRAFT', so it appends? 'CONFIDENTIAL - DRAFT'
        // userEvent.type appends by default if not cleared? 
        // Actually usually it types at cursor end. 
        expect(formData.defaultWatermarkText).toContain('DRAFT');
    });
});
