import React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { COMPLIANCE_FRAMEWORKS, type CompanyProfileFormData } from "./schema";

export function FrameworksTab() {
  const { control } = useFormContext<CompanyProfileFormData>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Frameworks</CardTitle>
        <CardDescription>
          Select the compliance frameworks your organization needs to adhere to
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="selectedFrameworks"
          render={() => (
            <FormItem>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COMPLIANCE_FRAMEWORKS.map((framework) => (
                  <FormField
                    key={framework.id}
                    control={control}
                    name="selectedFrameworks"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={framework.id}
                          className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg"
                        >
                          <FormControl>
                            <Checkbox
                              data-testid={`checkbox-framework-${framework.id}`}
                              aria-label={`Select ${framework.name} framework`}
                              checked={field.value?.includes(framework.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, framework.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== framework.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">
                              {framework.name}
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              {framework.description}
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
  );
}
