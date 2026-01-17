import React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { NIST_CONTROL_FAMILIES, SOC2_TRUST_SERVICES, type CompanyProfileFormData } from "./schema";

export function ControlsTab() {
  const { control } = useFormContext<CompanyProfileFormData>();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>NIST 800-53 Rev 5 Control Families</CardTitle>
          <CardDescription>
            Select the control families relevant to your organization (20 families, 1000+ controls)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="nistControlFamilies"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {NIST_CONTROL_FAMILIES.map((family) => (
                    <FormField
                      key={family.id}
                      control={control}
                      name="nistControlFamilies"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={family.id}
                            className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                          >
                            <FormControl>
                              <Checkbox
                                data-testid={`checkbox-nist-${family.id}`}
                                aria-label={`Select ${family.name} control family`}
                                checked={field.value?.includes(family.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, family.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== family.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium">
                                {family.id} - {family.name}
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {family.description}
                              </p>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SOC 2 Trust Service Categories</CardTitle>
          <CardDescription>
            Select the trust service criteria relevant to your service organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="soc2TrustServices"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SOC2_TRUST_SERVICES.map((service) => (
                    <FormField
                      key={service.id}
                      control={control}
                      name="soc2TrustServices"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={service.id}
                            className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                          >
                            <FormControl>
                              <Checkbox
                                data-testid={`checkbox-soc2-${service.id}`}
                                aria-label={`Select ${service.name} trust service`}
                                checked={
                                  field.value?.includes(service.id)
                                }
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        service.id,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== service.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium">
                                {service.name}
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {service.description}
                              </p>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
