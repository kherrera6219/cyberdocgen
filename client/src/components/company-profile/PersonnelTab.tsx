import React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { CompanyProfileFormData } from "./schema";

export function PersonnelTab() {
  const { control } = useFormContext<CompanyProfileFormData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Personnel for Compliance Documentation</CardTitle>
        <CardDescription>
          Specify key stakeholders who will be referenced in SOPs and compliance documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="ceoName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chief Executive Officer (CEO)</FormLabel>
                <FormControl>
                  <Input data-testid="input-ceoName" aria-label="CEO name" placeholder="John Smith" {...field} />
                </FormControl>
                <FormDescription>
                  Required for executive oversight responsibilities
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="cisoName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chief Information Security Officer (CISO)</FormLabel>
                <FormControl>
                  <Input data-testid="input-cisoName" aria-label="CISO name" placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormDescription>
                  Primary security responsibility owner
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="cisoEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CISO Email</FormLabel>
              <FormControl>
                <Input data-testid="input-cisoEmail" aria-label="CISO email" type="email" placeholder="ciso@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="securityOfficerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Information Security Officer</FormLabel>
                <FormControl>
                  <Input data-testid="input-securityOfficerName" aria-label="Security officer name" placeholder="Bob Johnson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="securityOfficerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Security Officer Email</FormLabel>
                <FormControl>
                  <Input data-testid="input-securityOfficerEmail" aria-label="Security officer email" type="email" placeholder="security@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="complianceOfficerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compliance Officer</FormLabel>
                <FormControl>
                  <Input data-testid="input-complianceOfficerName" aria-label="Compliance officer name" placeholder="Alice Brown" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="complianceOfficerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compliance Officer Email</FormLabel>
                <FormControl>
                  <Input data-testid="input-complianceOfficerEmail" aria-label="Compliance officer email" type="email" placeholder="compliance@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="itManagerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IT Manager</FormLabel>
                <FormControl>
                  <Input data-testid="input-itManagerName" aria-label="IT manager name" placeholder="Charlie Wilson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="itManagerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IT Manager Email</FormLabel>
                <FormControl>
                  <Input data-testid="input-itManagerEmail" aria-label="IT manager email" type="email" placeholder="it@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="legalCounselName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Counsel</FormLabel>
                <FormControl>
                  <Input data-testid="input-legalCounselName" aria-label="Legal counsel name" placeholder="Diana Clark" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="legalCounselEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Counsel Email</FormLabel>
                <FormControl>
                  <Input data-testid="input-legalCounselEmail" aria-label="Legal counsel email" type="email" placeholder="legal@company.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
