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

export function VendorManagementSection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {
  const criticalVendors = useWatch({ control: form.control, name: "vendorManagement.criticalVendors" }) || [];
  const thirdPartyIntegrations = useWatch({ control: form.control, name: "vendorManagement.thirdPartyIntegrations" }) || [];

  return (
    <AccordionItem value="vendor-management" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-vendor-management"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Vendor Management
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="vendorManagement.vendorRiskAssessmentFrequency"
                      render={({ field }) => (
                        <FormItem className="max-w-md">
                          <FormLabel>Vendor Risk Assessment Frequency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vendor-assessment-frequency">
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Quarterly">Quarterly</SelectItem>
                              <SelectItem value="Semi-annually">Semi-annually</SelectItem>
                              <SelectItem value="Annually">Annually</SelectItem>
                              <SelectItem value="As needed">As needed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Critical Vendors</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-vendor"
                          onClick={() => {
                            const current = form.getValues("vendorManagement.criticalVendors") || [];
                            form.setValue("vendorManagement.criticalVendors", [
                              ...current,
                              { name: "", service: "", securityAssessmentStatus: "pending" as const, lastAssessmentDate: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Vendor
                        </Button>
                      </div>
                      {criticalVendors.map((_: any, index: number) => (
                        <div key={index} className="p-4 border rounded-md space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Vendor {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              data-testid={`button-remove-vendor-${index}`}
                              onClick={() => {
                                const current = form.getValues("vendorManagement.criticalVendors") || [];
                                form.setValue("vendorManagement.criticalVendors", 
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
                              name={`vendorManagement.criticalVendors.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Vendor Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-vendor-name-${index}`}
                                      placeholder="Vendor name" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`vendorManagement.criticalVendors.${index}.service`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Service Provided</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-vendor-service-${index}`}
                                      placeholder="Service" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`vendorManagement.criticalVendors.${index}.securityAssessmentStatus`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Assessment Status</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "pending"}>
                                    <FormControl>
                                      <SelectTrigger data-testid={`select-vendor-status-${index}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="approved">Approved</SelectItem>
                                      <SelectItem value="requires_review">Requires Review</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`vendorManagement.criticalVendors.${index}.lastAssessmentDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Last Assessment</FormLabel>
                                  <FormControl>
                                    <Input 
                                      data-testid={`input-vendor-assessment-date-${index}`}
                                      type="date"
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

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Third-Party Integrations</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-integration"
                          onClick={() => {
                            const current = form.getValues("vendorManagement.thirdPartyIntegrations") || [];
                            form.setValue("vendorManagement.thirdPartyIntegrations", [
                              ...current,
                              { name: "", type: "", dataShared: [] }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Integration
                        </Button>
                      </div>
                      {thirdPartyIntegrations.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`vendorManagement.thirdPartyIntegrations.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Integration Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-integration-name-${index}`}
                                    placeholder="e.g., Salesforce, Slack" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`vendorManagement.thirdPartyIntegrations.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-integration-type-${index}`}
                                    placeholder="e.g., CRM, Communication" 
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
                            data-testid={`button-remove-integration-${index}`}
                            onClick={() => {
                              const current = form.getValues("vendorManagement.thirdPartyIntegrations") || [];
                              form.setValue("vendorManagement.thirdPartyIntegrations", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
  );
}
