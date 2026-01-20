/**
 * Task Board Component
 * Displays repository analysis tasks in a kanban-style board
 */

import { AlertTriangle, Circle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'code_change' | 'missing_evidence' | 'policy_needed' | 'procedure_needed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'completed' | 'dismissed';
  findingId?: string;
  assignedToRole?: string;
  dueDate?: string;
  createdAt: string;
}

export interface TaskBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskStatusChange?: (taskId: string, newStatus: Task['status']) => void;
  className?: string;
}

export function TaskBoard({ tasks, onTaskClick, onTaskStatusChange, className }: TaskBoardProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Circle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const labels = {
      code_change: 'Code Change',
      missing_evidence: 'Missing Evidence',
      policy_needed: 'Policy Needed',
      procedure_needed: 'Procedure Needed',
    };
    return <Badge variant="outline">{labels[category as keyof typeof labels]}</Badge>;
  };

  const columns = [
    { id: 'open', title: 'To Do', icon: Circle },
    { id: 'in_progress', title: 'In Progress', icon: Circle },
    { id: 'completed', title: 'Completed', icon: CheckCircle2 },
    { id: 'dismissed', title: 'Dismissed', icon: XCircle },
  ];

  const getColumnTasks = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {columns.map((column) => {
        const columnTasks = getColumnTasks(column.id);
        const Icon = column.icon;

        return (
          <div key={column.id} className="flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">{column.title}</h3>
              <Badge variant="secondary" className="ml-auto">
                {columnTasks.length}
              </Badge>
            </div>

            <div className="space-y-3 flex-1">
              {columnTasks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No tasks
                  </CardContent>
                </Card>
              ) : (
                columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-2">
                        {getPriorityIcon(task.priority)}
                        <CardTitle className="text-sm font-medium leading-tight flex-1">
                          {task.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {getPriorityBadge(task.priority)}
                        {getCategoryBadge(task.category)}
                      </div>

                      {task.dueDate && (
                        <div className="text-xs text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}

                      {onTaskStatusChange && task.status !== 'completed' && task.status !== 'dismissed' && (
                        <div className="flex gap-1 pt-2">
                          {task.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskStatusChange(task.id, 'in_progress');
                              }}
                            >
                              Start
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTaskStatusChange(task.id, 'completed');
                                }}
                              >
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTaskStatusChange(task.id, 'open');
                                }}
                              >
                                Reopen
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
