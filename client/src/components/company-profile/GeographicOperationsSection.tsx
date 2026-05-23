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

export function GeographicOperationsSection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {
  const officeLocations = useWatch({ control: form.control, name: "geographicOperations.officeLocations" }) || [];
  const dataCenterLocations = useWatch({ control: form.control, name: "geographicOperations.dataCenterLocations" }) || [];

  return (
    <AccordionItem value="geographic-ops" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-geographic-ops"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Geographic Operations
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="geographicOperations.countriesOfOperation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Countries of Operation</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-countries"
                              placeholder="Enter countries separated by commas (e.g., United States, Canada, United Kingdom)"
                              rows={2}
                              value={(field.value || []).join(", ")}
                              onChange={(e) => {
                                const countries = e.target.value.split(",").map(c => c.trim()).filter(c => c);
                                field.onChange(countries);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Office Locations</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-office"
                          onClick={() => {
                            const current = form.getValues("geographicOperations.officeLocations") || [];
                            form.setValue("geographicOperations.officeLocations", [
                              ...current,
                              { address: "", type: "regional" as const, employeeCount: undefined }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Office
                        </Button>
                      </div>
                      {officeLocations.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`geographicOperations.officeLocations.${index}.address`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Address</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-office-address-${index}`}
                                    placeholder="Office address" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`geographicOperations.officeLocations.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="w-40">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "regional"}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-office-type-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="headquarters">Headquarters</SelectItem>
                                    <SelectItem value="regional">Regional</SelectItem>
                                    <SelectItem value="satellite">Satellite</SelectItem>
                                    <SelectItem value="remote">Remote</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`geographicOperations.officeLocations.${index}.employeeCount`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">Employees</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-office-employees-${index}`}
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-office-${index}`}
                            onClick={() => {
                              const current = form.getValues("geographicOperations.officeLocations") || [];
                              form.setValue("geographicOperations.officeLocations", 
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
                        <h4 className="font-medium">Data Center Locations</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-datacenter"
                          onClick={() => {
                            const current = form.getValues("geographicOperations.dataCenterLocations") || [];
                            form.setValue("geographicOperations.dataCenterLocations", [
                              ...current,
                              { location: "", type: "primary" as const, provider: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Data Center
                        </Button>
                      </div>
                      {dataCenterLocations.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`geographicOperations.dataCenterLocations.${index}.location`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Location</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-datacenter-location-${index}`}
                                    placeholder="Data center location" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`geographicOperations.dataCenterLocations.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="w-44">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "primary"}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-datacenter-type-${index}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="primary">Primary</SelectItem>
                                    <SelectItem value="disaster_recovery">Disaster Recovery</SelectItem>
                                    <SelectItem value="backup">Backup</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`geographicOperations.dataCenterLocations.${index}.provider`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Provider</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-datacenter-provider-${index}`}
                                    placeholder="e.g., AWS, Azure" 
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
                            data-testid={`button-remove-datacenter-${index}`}
                            onClick={() => {
                              const current = form.getValues("geographicOperations.dataCenterLocations") || [];
                              form.setValue("geographicOperations.dataCenterLocations", 
                                current.filter((_: string, i: number) => i !== index)
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
                      name="geographicOperations.customerRegionsServed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Regions Served</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-customer-regions"
                              placeholder="Enter regions separated by commas (e.g., North America, EMEA, APAC)"
                              rows={2}
                              value={(field.value || []).join(", ")}
                              onChange={(e) => {
                                const regions = e.target.value.split(",").map(r => r.trim()).filter(r => r);
                                field.onChange(regions);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="geographicOperations.regulatoryJurisdictions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regulatory Jurisdictions</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-regulatory-jurisdictions"
                              placeholder="Enter jurisdictions separated by commas (e.g., USA, EU, UK)"
                              rows={2}
                              value={(field.value || []).join(", ")}
                              onChange={(e) => {
                                const jurisdictions = e.target.value.split(",").map(j => j.trim()).filter(j => j);
                                field.onChange(jurisdictions);
                              }}
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
