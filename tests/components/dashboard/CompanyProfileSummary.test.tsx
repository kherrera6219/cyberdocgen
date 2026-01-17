import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CompanyProfileSummary } from '../../../client/src/components/dashboard/CompanyProfileSummary';
import userEvent from '@testing-library/user-event';

describe('CompanyProfileSummary', () => {
    const mockProfile = {
        companyName: 'Acme Corp',
        industry: 'Tech',
        companySize: '100-500',
        headquarters: 'NY',
        cloudInfrastructure: ['AWS'],
        dataClassification: 'Confidential',
        businessApplications: 'Jira'
    };

    it('renders profile information', () => {
        render(<CompanyProfileSummary profile={mockProfile} onEdit={vi.fn()} />);
        
        expect(screen.getByText('Acme Corp')).toBeTruthy();
        expect(screen.getByText('Tech')).toBeTruthy();
        expect(screen.getByText('AWS')).toBeTruthy();
    });

    it('does not render if profile is missing', () => {
        const { container } = render(<CompanyProfileSummary profile={null} onEdit={vi.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('calls onEdit when edit button clicked', async () => {
        const onEdit = vi.fn();
        render(<CompanyProfileSummary profile={mockProfile} onEdit={onEdit} />);
        
        await userEvent.click(screen.getByText('Edit Profile'));
        expect(onEdit).toHaveBeenCalled();
    });
});
