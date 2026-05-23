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

export function BasicInformationSection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {

  return (
    <AccordionItem value="basic-info" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-basic-info"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Basic Information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-company-name"
                                  placeholder="Enter company name" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-industry">
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Technology Services">Technology Services</SelectItem>
                                  <SelectItem value="Financial Services">Financial Services</SelectItem>
                                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="Retail">Retail</SelectItem>
                                  <SelectItem value="Education">Education</SelectItem>
                                  <SelectItem value="Government">Government</SelectItem>
                                  <SelectItem value="Non-profit">Non-profit</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="companySize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Size</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-company-size">
                                    <SelectValue placeholder="Select company size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1-50 employees">1-50 employees</SelectItem>
                                  <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                                  <SelectItem value="201-1000 employees">201-1000 employees</SelectItem>
                                  <SelectItem value="1000+ employees">1000+ employees</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="headquarters"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Headquarters Location</FormLabel>
                              <FormControl>
                                <Input 
                                  data-testid="input-headquarters"
                                  placeholder="e.g., San Francisco, CA" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
  );
}
