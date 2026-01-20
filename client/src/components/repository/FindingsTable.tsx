/**
 * Findings Table Component
 * Displays repository analysis findings with filtering and details
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, XCircle, ChevronDown, Filter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface Finding {
  id: string;
  controlId: string;
  framework: string;
  status: 'pass' | 'partial' | 'fail' | 'not_observed' | 'needs_human';
  confidenceLevel: 'high' | 'medium' | 'low';
  summary: string;
  signalType: string;
  evidenceReferences: Array<{
    filePath: string;
    lineStart?: number;
    lineEnd?: number;
    snippet?: string;
  }>;
  recommendation: string;
  createdAt: string;
}

export interface FindingsTableProps {
  findings: Finding[];
  onReviewFinding?: (findingId: string) => void;
  className?: string;
}

export function FindingsTable({ findings, onReviewFinding, className }: FindingsTableProps) {
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'needs_human':
        return <HelpCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'needs_human':
        return <Badge className="bg-blue-100 text-blue-800">Review Needed</Badge>;
      default:
        return <Badge variant="outline">Not Observed</Badge>;
    }
  };

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="default">High</Badge>;
      case 'medium':
        return <Badge variant="outline">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const filteredFindings = findings.filter((finding) => {
    if (statusFilter !== 'all' && finding.status !== statusFilter) return false;
    if (frameworkFilter !== 'all' && finding.framework !== frameworkFilter) return false;
    if (confidenceFilter !== 'all' && finding.confidenceLevel !== confidenceFilter) return false;
    return true;
  });

  const frameworks = Array.from(new Set(findings.map((f) => f.framework)));

  return (
    <>
      <Card className={className}>
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Findings ({filteredFindings.length})</h3>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                {frameworks.map((fw) => (
                  <SelectItem key={fw} value={fw}>
                    {fw}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
                <SelectItem value="needs_human">Needs Review</SelectItem>
                <SelectItem value="not_observed">Not Observed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Control</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className="w-[120px]">Framework</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Confidence</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFindings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No findings match the selected filters
                </TableCell>
              </TableRow>
            ) : (
              filteredFindings.map((finding) => (
                <TableRow key={finding.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{finding.controlId}</TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      {getStatusIcon(finding.status)}
                      <span className="text-sm">{finding.summary}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{finding.framework}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(finding.status)}</TableCell>
                  <TableCell>{getConfidenceBadge(finding.confidenceLevel)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFinding(finding)}
                    >
                      View Details
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Finding Detail Modal */}
      <Dialog open={selectedFinding !== null} onOpenChange={() => setSelectedFinding(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedFinding && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getStatusIcon(selectedFinding.status)}
                  {selectedFinding.controlId} - {selectedFinding.summary}
                </DialogTitle>
                <DialogDescription>
                  Framework: {selectedFinding.framework} • Signal: {selectedFinding.signalType}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  {getStatusBadge(selectedFinding.status)}
                  {getConfidenceBadge(selectedFinding.confidenceLevel)}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Recommendation</h4>
                  <p className="text-sm text-muted-foreground">{selectedFinding.recommendation}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Evidence ({selectedFinding.evidenceReferences.length})</h4>
                  <div className="space-y-2">
                    {selectedFinding.evidenceReferences.map((evidence, idx) => (
                      <Card key={idx} className="p-3 bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <code className="text-xs text-primary">{evidence.filePath}</code>
                          {evidence.lineStart && (
                            <Badge variant="outline" className="text-xs">
                              Lines {evidence.lineStart}-{evidence.lineEnd}
                            </Badge>
                          )}
                        </div>
                        {evidence.snippet && (
                          <pre className="text-xs bg-black/5 p-2 rounded overflow-x-auto">
                            <code>{evidence.snippet}</code>
                          </pre>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                {onReviewFinding && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedFinding(null)}>
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        onReviewFinding(selectedFinding.id);
                        setSelectedFinding(null);
                      }}
                    >
                      Review Finding
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
