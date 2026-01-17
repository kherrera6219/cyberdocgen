import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ShieldCheck, UserPlus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: Record<string, boolean>;
  isDefault: boolean;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  roleDisplayName: string;
  userEmail: string;
  userFirstName: string | null;
  userLastName: string | null;
  createdAt: string;
}

interface UserRoleManagerProps {
  organizations?: { id: string; name: string }[];
  roles?: Role[];
  roleAssignments?: RoleAssignment[];
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  onRemoveAssignment: (id: string) => void;
  rolesLoading: boolean;
  assignmentsLoading: boolean;
  isRemovingAssignment: boolean;
}

export function UserRoleManager({
  organizations,
  roles = [],
  roleAssignments = [],
  selectedOrgId,
  onOrgChange,
  onRemoveAssignment,
  rolesLoading,
  assignmentsLoading,
  isRemovingAssignment
}: UserRoleManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Role Management
        </CardTitle>
        <CardDescription>
          Manage user roles and permissions across your organizations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Organization Selector */}
        <div className="space-y-2">
          <Label>Select Organization</Label>
          <Select value={selectedOrgId} onValueChange={onOrgChange}>
            <SelectTrigger data-testid="select-organization">
              <SelectValue placeholder="Choose an organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations?.map((org) => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedOrgId && (
          <>
            {/* Available Roles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Available Roles
              </h3>
              {rolesLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading roles...</div>
              ) : roles.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No roles found for this organization</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <div key={role.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{role.displayName}</h4>
                        {role.isDefault && <Badge variant="secondary">Default</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{role.description || 'No description'}</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(role.permissions || {}).filter(([_, v]) => v).slice(0, 3).map(([key]) => (
                          <Badge key={key} variant="outline" className="text-xs">{key.replace(/_/g, ' ')}</Badge>
                        ))}
                        {Object.values(role.permissions || {}).filter(Boolean).length > 3 && (
                          <Badge variant="outline" className="text-xs">+{Object.values(role.permissions).filter(Boolean).length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Role Assignments */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Role Assignments
              </h3>
              {assignmentsLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading assignments...</div>
              ) : roleAssignments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No role assignments found</div>
              ) : (
                <div className="space-y-2">
                  {roleAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {(assignment.userFirstName?.[0] || assignment.userEmail[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {assignment.userFirstName && assignment.userLastName 
                              ? `${assignment.userFirstName} ${assignment.userLastName}` 
                              : assignment.userEmail}
                          </p>
                          <p className="text-sm text-muted-foreground">{assignment.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{assignment.roleDisplayName}</Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onRemoveAssignment(assignment.id)}
                          disabled={isRemovingAssignment}
                          data-testid={`button-remove-assignment-${assignment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedOrgId && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Select an organization to manage users and roles</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
