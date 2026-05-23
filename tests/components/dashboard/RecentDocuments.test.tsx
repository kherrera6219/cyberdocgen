import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RecentDocuments } from '../../../client/src/components/dashboard/RecentDocuments';
import { Document } from '@shared/schema';

describe('RecentDocuments', () => {
    const docs = [
        { id: '1', title: 'Security Policy', framework: 'ISO27001', category: 'Policy' } as Document
    ];

    it('renders list of documents', () => {
        render(<RecentDocuments documents={docs} />);
        expect(screen.getByText('Security Policy')).toBeTruthy();
        expect(screen.getByText(/ISO27001/i)).toBeTruthy();
        expect(screen.getAllByText(/Policy/i).length).toBeGreaterThan(0);
    });

    it('renders empty state when empty', () => {
        render(<RecentDocuments documents={[]} />);
        expect(screen.getByText('No Documents Yet')).toBeTruthy();
    });
});
