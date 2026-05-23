import { UseFormReturn, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Building, Shield, Building2, UserCheck, Briefcase, MapPin, Plus, Trash2, ShieldAlert, Truck } from "lucide-react";
import { HelpTooltip } from "@/components/help/ContextualHelp";
import { InsertCompanyProfile } from "@shared/schema";

const legalEntityTypes = [
  "LLC",
  "Corporation (C-Corp)",
  "Corporation (S-Corp)",
  "Partnership",
  "Sole Proprietorship",
  "Non-Profit",
  "Government Agency",
  "Public Company",
];

export function OrganizationStructureSection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {
  const subsidiaries = useWatch({ control: form.control, name: "organizationStructure.subsidiaries" }) || [];
  const departments = useWatch({ control: form.control, name: "organizationStructure.departments" }) || [];

  return (
    <AccordionItem value="org-structure" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-org-structure"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Organization Structure
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="organizationStructure.legalEntityType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Legal Entity Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-legal-entity-type">
                                  <SelectValue placeholder="Select entity type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {legalEntityTypes.map((type) => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="organizationStructure.totalEmployees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Employees</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-total-employees"
                                type="number"
                                placeholder="e.g., 500" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Parent Company</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="organizationStructure.parentCompany.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parent Company Name</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-parent-company-name"
                                  placeholder="Parent company name (if applicable)" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="organizationStructure.parentCompany.relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-parent-company-relationship"
                                  placeholder="e.g., Wholly-owned subsidiary" 
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Subsidiaries</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-subsidiary"
                          onClick={() => {
                            const current = form.getValues("organizationStructure.subsidiaries") || [];
                            form.setValue("organizationStructure.subsidiaries", [
                              ...current,
                              { name: "", location: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Subsidiary
                        </Button>
                      </div>
                      {subsidiaries.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`organizationStructure.subsidiaries.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-subsidiary-name-${index}`}
                                    placeholder="Subsidiary name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`organizationStructure.subsidiaries.${index}.location`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Location</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-subsidiary-location-${index}`}
                                    placeholder="Location" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-subsidiary-${index}`}
                            onClick={() => {
                              const current = form.getValues("organizationStructure.subsidiaries") || [];
                              form.setValue("organizationStructure.subsidiaries", 
                                current.filter((_: any, i: number) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Departments</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-department"
                          onClick={() => {
                            const current = form.getValues("organizationStructure.departments") || [];
                            form.setValue("organizationStructure.departments", [
                              ...current,
                              { name: "", head: "", employeeCount: undefined, responsibilities: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Department
                        </Button>
                      </div>
                      {departments.map((_: any, index: number) => (
                        <div key={index} className="p-4 border rounded-md space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Department {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              data-testid={`button-remove-department-${index}`}
                              onClick={() => {
                                const current = form.getValues("organizationStructure.departments") || [];
                                form.setValue("organizationStructure.departments", 
                                  current.filter((_, i) => i !== index)
                                );
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <FormField
                              control={form.control}
                              name={`organizationStructure.departments.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-department-name-${index}`}
                                      placeholder="Department name" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`organizationStructure.departments.${index}.head`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Head</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-department-head-${index}`}
                                      placeholder="Department head" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`organizationStructure.departments.${index}.employeeCount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Employees</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-department-employees-${index}`}
                                      type="number"
                                      placeholder="Count" 
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`organizationStructure.departments.${index}.responsibilities`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Responsibilities</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-department-responsibilities-${index}`}
                                      placeholder="Key responsibilities" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
  );
}
