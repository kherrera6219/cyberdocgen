import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StorageStatsView } from '../../../client/src/components/storage/StorageStatsView';

describe('StorageStatsView', () => {
  it('renders loading state', () => {
    const { container } = render(<StorageStatsView isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('renders stats correctly', () => {
    const stats = {
      totalFiles: 100,
      byFolder: {
        documents: 50,
        profiles: 20,
        backups: 10,
        files: 20,
        auditLogs: 0,
        other: 0
      },
      lastUpdated: new Date().toISOString()
    };

    render(<StorageStatsView isLoading={false} stats={stats} />);
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.getByText('50')).toBeTruthy();
  });
});
