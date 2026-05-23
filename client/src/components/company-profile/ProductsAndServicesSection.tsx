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

const customerSegmentOptions: Array<'B2B' | 'B2C' | 'Government' | 'Enterprise' | 'SMB'> = [
  'B2B', 'B2C', 'Government', 'Enterprise', 'SMB'
];

export function ProductsAndServicesSection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {
  const primaryProducts = useWatch({ control: form.control, name: "productsAndServices.primaryProducts" }) || [];
  const primaryServices = useWatch({ control: form.control, name: "productsAndServices.primaryServices" }) || [];
  const slaCommitments = useWatch({ control: form.control, name: "productsAndServices.slaCommitments" }) || [];

  return (
    <AccordionItem value="products-services" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-products-services"
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Products & Services
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Primary Products</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-product"
                          onClick={() => {
                            const current = form.getValues("productsAndServices.primaryProducts") || [];
                            form.setValue("productsAndServices.primaryProducts", [
                              ...current,
                              { name: "", description: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Product
                        </Button>
                      </div>
                      {primaryProducts.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`productsAndServices.primaryProducts.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-product-name-${index}`}
                                    placeholder="Product name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`productsAndServices.primaryProducts.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Description</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-product-description-${index}`}
                                    placeholder="Brief description" 
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
                            data-testid={`button-remove-product-${index}`}
                            onClick={() => {
                              const current = form.getValues("productsAndServices.primaryProducts") || [];
                              form.setValue("productsAndServices.primaryProducts", 
                                current.filter((_, i) => i !== index)
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
                        <h4 className="font-medium">Primary Services</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-service"
                          onClick={() => {
                            const current = form.getValues("productsAndServices.primaryServices") || [];
                            form.setValue("productsAndServices.primaryServices", [
                              ...current,
                              { name: "", description: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Service
                        </Button>
                      </div>
                      {primaryServices.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`productsAndServices.primaryServices.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-service-name-${index}`}
                                    placeholder="Service name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`productsAndServices.primaryServices.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Description</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-service-description-${index}`}
                                    placeholder="Brief description" 
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
                            data-testid={`button-remove-service-${index}`}
                            onClick={() => {
                              const current = form.getValues("productsAndServices.primaryServices") || [];
                              form.setValue("productsAndServices.primaryServices", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="productsAndServices.customerSegments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Segments</FormLabel>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {customerSegmentOptions.map((segment) => (
                              <div key={segment} className="flex items-center gap-2">
                                <Checkbox
                                  id={`segment-${segment}`}
                                  data-testid={`checkbox-segment-${segment.toLowerCase()}`}
                                  checked={field.value?.includes(segment) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, segment]);
                                    } else {
                                      field.onChange(currentValue.filter((item) => item !== segment));
                                    }
                                  }}
                                />
                                <Label htmlFor={`segment-${segment}`} className="text-sm font-normal cursor-pointer">
                                  {segment}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">SLA Commitments</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-sla"
                          onClick={() => {
                            const current = form.getValues("productsAndServices.slaCommitments") || [];
                            form.setValue("productsAndServices.slaCommitments", [
                              ...current,
                              { service: "", availability: "", responseTime: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add SLA
                        </Button>
                      </div>
                      {slaCommitments.map((_: unknown, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`productsAndServices.slaCommitments.${index}.service`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Service</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-sla-service-${index}`}
                                    placeholder="Service name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`productsAndServices.slaCommitments.${index}.availability`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Availability</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-sla-availability-${index}`}
                                    placeholder="e.g., 99.9%" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`productsAndServices.slaCommitments.${index}.responseTime`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Response Time</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-sla-response-${index}`}
                                    placeholder="e.g., 4 hours" 
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
                            data-testid={`button-remove-sla-${index}`}
                            onClick={() => {
                              const current = form.getValues("productsAndServices.slaCommitments") || [];
                              form.setValue("productsAndServices.slaCommitments", 
                                current.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="productsAndServices.serviceAvailabilityRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Availability Requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-service-availability"
                              placeholder="Describe overall service availability requirements..."
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
  );
}
