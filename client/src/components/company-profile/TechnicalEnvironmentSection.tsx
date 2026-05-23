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

const cloudOptions = [
  { id: "AWS", label: "AWS" },
  { id: "Microsoft Azure", label: "Microsoft Azure" },
  { id: "Google Cloud Platform", label: "Google Cloud Platform" },
  { id: "IBM Cloud", label: "IBM Cloud" },
  { id: "Oracle Cloud", label: "Oracle Cloud" },
];

export function TechnicalEnvironmentSection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {

  return (
    <AccordionItem value="technical-env" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-technical-env"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Technical Environment
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="cloudInfrastructure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span>Cloud Infrastructure</span>
                            <HelpTooltip topic="cloudInfrastructure" />
                          </FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                            {cloudOptions.map((option) => (
                              <div key={option.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={option.id}
                                  data-testid={`checkbox-cloud-${option.id.toLowerCase().replace(/\s+/g, '-')}`}
                                  checked={field.value?.includes(option.id) || false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, option.id]);
                                    } else {
                                      field.onChange(currentValue.filter((item: string) => item !== option.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={option.id} className="text-sm font-normal cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataClassification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span>Data Classification Level</span>
                            <HelpTooltip topic="dataClassification" />
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-data-classification">
                                <SelectValue placeholder="Select classification level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Public">Public</SelectItem>
                              <SelectItem value="Internal">Internal</SelectItem>
                              <SelectItem value="Confidential">Confidential</SelectItem>
                              <SelectItem value="Restricted">Restricted</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessApplications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span>Primary Business Applications</span>
                            <HelpTooltip topic="businessApplications" />
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-business-applications"
                              placeholder="Describe your main business applications and systems..."
                              rows={4}
                              {...field}
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
