import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserRoleManager } from '../../../client/src/components/admin/UserRoleManager';
import userEvent from '@testing-library/user-event';

describe('UserRoleManager', () => {
    const mockOrganizations = [
        { id: 'org1', name: 'Org 1' },
        { id: 'org2', name: 'Org 2' }
    ];

    const mockRoles = [
        { id: 'role1', name: 'admin', displayName: 'Admin', description: 'Admin role', permissions: { read: true }, isDefault: false },
        { id: 'role2', name: 'viewer', displayName: 'Viewer', description: 'Viewer role', permissions: { read: true }, isDefault: true }
    ];

    const mockAssignments = [
        {
            id: 'assign1', userId: 'user1', roleId: 'role1', roleName: 'admin', roleDisplayName: 'Admin',
            userEmail: 'user1@example.com', userFirstName: 'User', userLastName: 'One', createdAt: '2023-01-01'
        }
    ];

    it('renders empty state when no org selected', () => {
        render(
            <UserRoleManager 
                organizations={mockOrganizations}
                selectedOrgId=""
                onOrgChange={vi.fn()}
                onRemoveAssignment={vi.fn()}
                rolesLoading={false}
                assignmentsLoading={false}
                isRemovingAssignment={false}
            />
        );
        expect(screen.getByText('Select an organization to manage users and roles')).toBeTruthy();
    });

    it('renders roles and assignments when org selected', () => {
        render(
            <UserRoleManager 
                organizations={mockOrganizations}
                roles={mockRoles}
                roleAssignments={mockAssignments}
                selectedOrgId="org1"
                onOrgChange={vi.fn()}
                onRemoveAssignment={vi.fn()}
                rolesLoading={false}
                assignmentsLoading={false}
                isRemovingAssignment={false}
            />
        );
        expect(screen.getByText('Admin')).toBeTruthy();
        expect(screen.getByText('Viewer')).toBeTruthy();
        expect(screen.getByText('user1@example.com')).toBeTruthy();
    });

    it('calls onRemoveAssignment when delete button clicked', async () => {
        const onRemove = vi.fn();
        render(
            <UserRoleManager 
                organizations={mockOrganizations}
                roles={mockRoles}
                roleAssignments={mockAssignments}
                selectedOrgId="org1"
                onOrgChange={vi.fn()}
                onRemoveAssignment={onRemove}
                rolesLoading={false}
                assignmentsLoading={false}
                isRemovingAssignment={false}
            />
        );
        
        const deleteBtn = screen.getByTestId('button-remove-assignment-assign1');
        await userEvent.click(deleteBtn);
        expect(onRemove).toHaveBeenCalledWith('assign1');
    });

    it('shows loading states', () => {
        render(
            <UserRoleManager 
                organizations={mockOrganizations}
                selectedOrgId="org1"
                onOrgChange={vi.fn()}
                onRemoveAssignment={vi.fn()}
                rolesLoading={true}
                assignmentsLoading={true}
                isRemovingAssignment={false}
            />
        );
        expect(screen.getByText('Loading roles...')).toBeTruthy();
        expect(screen.getByText('Loading assignments...')).toBeTruthy();
    });
});
