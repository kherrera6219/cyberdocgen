import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuickStats } from '../../../client/src/components/dashboard/QuickStats';
import { Document } from '@shared/schema';

describe('QuickStats', () => {
    const mockDocuments: Document[] = [
        { id: '1', title: 'Doc 1', status: 'complete', framework: 'ISO27001' } as any,
        { id: '2', title: 'Doc 2', status: 'draft', framework: 'SOC2' } as any
    ];

    it('renders stats correctly', () => {
        render(
            <QuickStats 
                documents={mockDocuments}
                completedDocs={1}
                activeFrameworks={2}
                nextApprovalDeadline={new Date('2023-12-31T12:00:00')}
            />
        );

        expect(screen.getByTestId('text-completion-rate')).toHaveTextContent('50%');
        expect(screen.getByTestId('text-documents-generated')).toHaveTextContent('1');
        expect(screen.getByTestId('text-active-frameworks')).toHaveTextContent('2');
        // Accept either date depending on TZ, or match partial.
        // Actually, T12:00:00 should safely be 31st in most US/EU timezones.
        expect(screen.getByTestId('text-next-deadline')).toHaveTextContent(/Dec 31, 2023/);
    });

    it('renders zero/empty states', () => {
        render(
            <QuickStats 
                documents={[]}
                completedDocs={0}
                activeFrameworks={0}
                nextApprovalDeadline={null}
            />
        );

        expect(screen.getByTestId('text-completion-rate')).toHaveTextContent('0%');
        expect(screen.getByTestId('text-documents-generated')).toHaveTextContent('0');
        expect(screen.getByTestId('text-active-frameworks')).toHaveTextContent('0');
        expect(screen.getByTestId('text-next-deadline')).toHaveTextContent('N/A');
    });
});
