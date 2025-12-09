import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Save, 
  Check, 
  AlertCircle, 
  Edit2, 
  X,
  Loader2,
  FileText,
  Download,
  FileSpreadsheet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SpreadsheetField {
  id: string;
  fieldName: string;
  variableKey: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  currentValue: string;
  status: 'empty' | 'mapped' | 'ai_filled' | 'manual';
  required: boolean;
  options?: string[];
  templateId: string;
  templateTitle: string;
}

interface SpreadsheetTemplate {
  templateId: string;
  templateTitle: string;
  templateDescription: string;
  category: string;
  fields: SpreadsheetField[];
}

interface FrameworkSpreadsheetProps {
  framework: string;
  companyProfileId: string | null;
}

export function FrameworkSpreadsheet({ framework, companyProfileId }: FrameworkSpreadsheetProps) {
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [localUpdates, setLocalUpdates] = useState<Record<string, string>>({});
  const [autofillTemplateId, setAutofillTemplateId] = useState<string | null>(null);

  const { data: templates, isLoading, error } = useQuery<SpreadsheetTemplate[]>({
    queryKey: ['/api/frameworks', framework, 'spreadsheet-templates', companyProfileId],
    enabled: !!framework,
  });

  const autofillMutation = useMutation({
    mutationFn: async ({ templateId, emptyFields }: { 
      templateId: string; 
      emptyFields: Array<{ fieldId: string; variableKey: string; label: string; type: string }> 
    }) => {
      const response = await apiRequest("POST", `/api/frameworks/${framework}/autofill`, {
        templateId,
        emptyFields,
        companyProfileId,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const updates: Record<string, string> = {};
      for (const result of data) {
        updates[result.fieldId] = result.value;
      }
      setLocalUpdates(prev => ({ ...prev, ...updates }));
      setAutofillTemplateId(null);
      toast({
        title: "AI Autofill Complete",
        description: `Filled ${data.length} fields using AI`,
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/frameworks', framework, 'spreadsheet-templates'] 
      });
    },
    onError: (error: Error) => {
      setAutofillTemplateId(null);
      toast({
        title: "Autofill Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (fieldUpdates: Array<{ fieldId: string; value: string }>) => {
      const response = await apiRequest("PATCH", `/api/frameworks/${framework}/template-data`, {
        companyProfileId,
        fieldUpdates,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Changes Saved",
        description: "Template data has been saved successfully",
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/frameworks', framework, 'spreadsheet-templates'] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAutofill = (template: SpreadsheetTemplate) => {
    if (!companyProfileId) {
      toast({
        title: "Company Profile Required",
        description: "Please select a company profile to use AI autofill",
        variant: "destructive",
      });
      return;
    }

    const emptyFields = template.fields
      .filter(f => !f.currentValue && !localUpdates[f.id])
      .map(f => ({
        fieldId: f.id,
        variableKey: f.variableKey,
        label: f.label,
        type: f.type,
      }));

    if (emptyFields.length === 0) {
      toast({
        title: "No Empty Fields",
        description: "All fields already have values",
      });
      return;
    }

    setAutofillTemplateId(template.templateId);
    autofillMutation.mutate({ templateId: template.templateId, emptyFields });
  };

  const handleSaveAll = () => {
    if (!companyProfileId) {
      toast({
        title: "Company Profile Required",
        description: "Please select a company profile to save changes",
        variant: "destructive",
      });
      return;
    }

    const fieldUpdates = Object.entries(localUpdates).map(([fieldId, value]) => ({
      fieldId,
      value,
    }));

    if (fieldUpdates.length === 0) {
      toast({
        title: "No Changes",
        description: "No changes to save",
      });
      return;
    }

    saveMutation.mutate(fieldUpdates);
  };

  const startEditing = (field: SpreadsheetField) => {
    setEditingField(field.id);
    setEditValue(localUpdates[field.id] ?? field.currentValue);
  };

  const saveEdit = (fieldId: string) => {
    setLocalUpdates(prev => ({ ...prev, [fieldId]: editValue }));
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const getStatusBadge = (status: string, hasLocalUpdate: boolean) => {
    if (hasLocalUpdate) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Modified</Badge>;
    }
    switch (status) {
      case 'mapped':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">From Profile</Badge>;
      case 'ai_filled':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">AI Generated</Badge>;
      case 'manual':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Manual</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Empty</Badge>;
    }
  };

  const getFieldValue = (field: SpreadsheetField) => {
    return localUpdates[field.id] ?? field.currentValue;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const escapeCSVValue = (value: string): string => {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const exportTemplateToCSV = (template: SpreadsheetTemplate) => {
    const headers = ['Field Name', 'Variable Key', 'Value', 'Status', 'Required'];
    const rows = template.fields.map(field => {
      const value = getFieldValue(field);
      const hasLocalUpdate = field.id in localUpdates;
      const status = hasLocalUpdate ? 'Modified' : field.status;
      return [
        escapeCSVValue(field.label),
        escapeCSVValue(field.variableKey),
        escapeCSVValue(value),
        escapeCSVValue(status),
        field.required ? 'Yes' : 'No'
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `${template.templateTitle.replace(/[^a-z0-9]/gi, '_')}_${framework}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    
    toast({
      title: "Export Complete",
      description: `Downloaded ${filename}`,
    });
  };

  const exportAllToCSV = () => {
    if (!templates || templates.length === 0) return;
    
    const headers = ['Template', 'Category', 'Field Name', 'Variable Key', 'Value', 'Status', 'Required'];
    const rows: string[] = [];
    
    templates.forEach(template => {
      template.fields.forEach(field => {
        const value = getFieldValue(field);
        const hasLocalUpdate = field.id in localUpdates;
        const status = hasLocalUpdate ? 'Modified' : field.status;
        rows.push([
          escapeCSVValue(template.templateTitle),
          escapeCSVValue(template.category),
          escapeCSVValue(field.label),
          escapeCSVValue(field.variableKey),
          escapeCSVValue(value),
          escapeCSVValue(status),
          field.required ? 'Yes' : 'No'
        ].join(','));
      });
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const filename = `${framework}_all_templates.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    
    toast({
      title: "Export Complete",
      description: `Downloaded ${filename}`,
    });
  };

  const hasChanges = Object.keys(localUpdates).length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground">Failed to load template data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No templates found for {framework}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-spreadsheet-title">
            Template Data
          </h3>
          <p className="text-sm text-muted-foreground">
            Fill in template fields with company data or use AI autofill
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export-dropdown">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={exportAllToCSV}
                data-testid="button-export-all-csv"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export All to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={handleSaveAll}
            disabled={!hasChanges || saveMutation.isPending || !companyProfileId}
            data-testid="button-save-all-changes"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Changes
          </Button>
        </div>
      </div>

      {!companyProfileId && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Select a company profile to enable AI autofill and save changes.
            </p>
          </CardContent>
        </Card>
      )}

      <Accordion type="multiple" className="space-y-4">
        {templates.map((template) => {
          const filledCount = template.fields.filter(f => getFieldValue(f)).length;
          const totalCount = template.fields.length;
          const isAutofilling = autofillTemplateId === template.templateId;

          return (
            <AccordionItem 
              key={template.templateId} 
              value={template.templateId}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="py-4" data-testid={`accordion-template-${template.templateId}`}>
                <div className="flex items-center justify-between gap-4 flex-1 mr-4">
                  <div className="text-left">
                    <div className="font-medium">{template.templateTitle}</div>
                    <div className="text-sm text-muted-foreground">{template.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {filledCount}/{totalCount} fields
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTemplateToCSV(template)}
                      data-testid={`button-export-${template.templateId}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAutofill(template)}
                      disabled={isAutofilling || !companyProfileId}
                      data-testid={`button-autofill-${template.templateId}`}
                    >
                      {isAutofilling ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      AI Autofill Empty Fields
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[30%]">Field Name</TableHead>
                          <TableHead className="w-[40%]">Current Value</TableHead>
                          <TableHead className="w-[15%]">Status</TableHead>
                          <TableHead className="w-[15%]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {template.fields.map((field) => {
                          const value = getFieldValue(field);
                          const hasLocalUpdate = field.id in localUpdates;
                          const isEditing = editingField === field.id;

                          return (
                            <TableRow key={field.id} data-testid={`row-field-${field.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{field.label}</span>
                                  {field.required && (
                                    <span className="text-destructive">*</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    {field.type === 'select' && field.options ? (
                                      <Select
                                        value={editValue}
                                        onValueChange={setEditValue}
                                      >
                                        <SelectTrigger 
                                          className="w-full" 
                                          data-testid={`select-edit-${field.id}`}
                                        >
                                          <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {field.options.map((option) => (
                                            <SelectItem key={option} value={option}>
                                              {option}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        type={field.type === 'date' ? 'date' : 'text'}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="flex-1"
                                        data-testid={`input-edit-${field.id}`}
                                      />
                                    )}
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => saveEdit(field.id)}
                                      data-testid={`button-save-edit-${field.id}`}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={cancelEdit}
                                      data-testid={`button-cancel-edit-${field.id}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span 
                                    className={value ? "" : "text-muted-foreground italic"}
                                    data-testid={`text-value-${field.id}`}
                                  >
                                    {value || "Not set"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(field.status, hasLocalUpdate)}
                              </TableCell>
                              <TableCell>
                                {!isEditing && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => startEditing(field)}
                                    data-testid={`button-edit-${field.id}`}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
