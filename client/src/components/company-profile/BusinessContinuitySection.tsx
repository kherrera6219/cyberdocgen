import { UseFormReturn, useWatch } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Building, Shield, Building2, UserCheck, Briefcase, MapPin, Plus, Trash2, ShieldAlert, Truck, RefreshCw } from "lucide-react";
import { HelpTooltip } from "@/components/help/ContextualHelp";
import { InsertCompanyProfile } from "@shared/schema";

export function BusinessContinuitySection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {
  const criticalSystems = useWatch({ control: form.control, name: "businessContinuity.criticalSystems" }) || [];

  return (
    <AccordionItem value="business-continuity" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-business-continuity"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Business Continuity
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="businessContinuity.rtoHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RTO (Hours)</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-rto-hours"
                                type="number"
                                placeholder="Recovery Time Objective" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessContinuity.rpoHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RPO (Hours)</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-rpo-hours"
                                type="number"
                                placeholder="Recovery Point Objective" 
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessContinuity.backupFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Backup Frequency</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-backup-frequency"
                                placeholder="e.g., Every 4 hours" 
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
                        name="businessContinuity.lastDrTestDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last DR Test Date</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-last-dr-test"
                                type="date"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <FormField
                        control={form.control}
                        name="businessContinuity.bcdrPlanExists"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                data-testid="checkbox-bcdr-plan"
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">BC/DR Plan Exists</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessContinuity.incidentResponsePlanExists"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                data-testid="checkbox-incident-response-plan"
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">Incident Response Plan Exists</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="businessContinuity.lastIncidentResponseTest"
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>Last Incident Response Test</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-last-ir-test"
                              type="date"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Critical Systems</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-critical-system"
                          onClick={() => {
                            const current = form.getValues("businessContinuity.criticalSystems") || [];
                            form.setValue("businessContinuity.criticalSystems", [
                              ...current,
                              { system: "", rtoHours: 0, rpoHours: 0 }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add System
                        </Button>
                      </div>
                      {criticalSystems.map((_: any, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`businessContinuity.criticalSystems.${index}.system`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">System Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-critical-system-name-${index}`}
                                    placeholder="System name" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`businessContinuity.criticalSystems.${index}.rtoHours`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">RTO (hrs)</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-critical-system-rto-${index}`}
                                    type="number"
                                    placeholder="Hours" 
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`businessContinuity.criticalSystems.${index}.rpoHours`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">RPO (hrs)</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-critical-system-rpo-${index}`}
                                    type="number"
                                    placeholder="Hours" 
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-testid={`button-remove-critical-system-${index}`}
                            onClick={() => {
                              const current = form.getValues("businessContinuity.criticalSystems") || [];
                              form.setValue("businessContinuity.criticalSystems", 
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
