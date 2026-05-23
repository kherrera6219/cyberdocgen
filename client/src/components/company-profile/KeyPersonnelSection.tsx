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

interface PersonnelFieldProps {
  title: string;
  fieldPrefix: keyof NonNullable<InsertCompanyProfile['keyPersonnel']>;
  form: UseFormReturn<InsertCompanyProfile>;
}

function PersonnelField({ title, fieldPrefix, form }: PersonnelFieldProps) {
  return (
    <div className="space-y-3 p-4 border rounded-md">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField
          control={form.control}
          name={`keyPersonnel.${String(fieldPrefix)}.name` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Name</FormLabel>
              <FormControl>
                <Input 
                  data-testid={`input-personnel-${String(fieldPrefix)}-name`}
                  placeholder="Full name" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`keyPersonnel.${String(fieldPrefix)}.email` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Email</FormLabel>
              <FormControl>
                <Input 
                  data-testid={`input-personnel-${String(fieldPrefix)}-email`}
                  type="email" 
                  placeholder="email@company.com" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`keyPersonnel.${String(fieldPrefix)}.phone` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Phone</FormLabel>
              <FormControl>
                <Input 
                  data-testid={`input-personnel-${String(fieldPrefix)}-phone`}
                  type="tel" 
                  placeholder="+1 (555) 000-0000" 
                  {...field} 
                  value={field.value || ""} 
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function KeyPersonnelSection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {

  return (
    <AccordionItem value="key-personnel" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-key-personnel"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Key Personnel
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Key personnel information for compliance documentation and communication
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <PersonnelField title="CEO (Chief Executive Officer)" fieldPrefix="ceo" form={form} />
                      <PersonnelField title="CFO (Chief Financial Officer)" fieldPrefix="cfo" form={form} />
                      <PersonnelField title="COO (Chief Operating Officer)" fieldPrefix="coo" form={form} />
                      <PersonnelField title="CTO (Chief Technology Officer)" fieldPrefix="cto" form={form} />
                      <PersonnelField title="CIO (Chief Information Officer)" fieldPrefix="cio" form={form} />
                      <PersonnelField title="CISO (Chief Information Security Officer)" fieldPrefix="ciso" form={form} />
                      <PersonnelField title="DPO (Data Protection Officer)" fieldPrefix="dpo" form={form} />
                      <PersonnelField title="CPO (Chief Privacy Officer)" fieldPrefix="cpo" form={form} />
                      <PersonnelField title="Security Officer" fieldPrefix="securityOfficer" form={form} />
                      <PersonnelField title="Compliance Officer" fieldPrefix="complianceOfficer" form={form} />
                      <PersonnelField title="IT Manager" fieldPrefix="itManager" form={form} />
                      <PersonnelField title="HR Director" fieldPrefix="hrDirector" form={form} />
                      <PersonnelField title="Legal Counsel" fieldPrefix="legalCounsel" form={form} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
  );
}
