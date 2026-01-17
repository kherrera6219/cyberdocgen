import React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CompanyProfileFormData } from "./schema";

export function FedRampTab() {
  const { control, watch } = useFormContext<CompanyProfileFormData>();
  const fedRampLevel = watch("fedRampLevel");

  return (
    <Card>
      <CardHeader>
        <CardTitle>FedRAMP Configuration</CardTitle>
        <CardDescription>
          Configure FedRAMP impact levels based on your system requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="fedRampLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>FedRAMP Impact Level</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger data-testid="select-fedRampLevel" aria-label="Select FedRAMP impact level">
                    <SelectValue placeholder="Select FedRAMP level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="space-y-1">
                        <div className="font-medium">Low Impact Level</div>
                        <div className="text-sm text-muted-foreground">155+ controls, public information</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="moderate">
                      <div className="space-y-1">
                        <div className="font-medium">Moderate Impact Level</div>
                        <div className="text-sm text-muted-foreground">300+ controls, CUI information</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="space-y-1">
                        <div className="font-medium">High Impact Level</div>
                        <div className="text-sm text-muted-foreground">421+ controls, national security data</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Select based on the sensitivity of data your system will process
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {fedRampLevel && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-medium mb-2">Impact Level Details</h4>
            {fedRampLevel === "low" && (
              <div className="space-y-2 text-sm">
                <p><strong>Data Type:</strong> Public information, non-sensitive data</p>
                <p><strong>Impact:</strong> Limited adverse effect on agency operations</p>
                <p><strong>Controls:</strong> ~155 security controls</p>
                <p><strong>Use Cases:</strong> Mass consumption data, basic public services</p>
              </div>
            )}
            {fedRampLevel === "moderate" && (
              <div className="space-y-2 text-sm">
                <p><strong>Data Type:</strong> Controlled Unclassified Information (CUI)</p>
                <p><strong>Impact:</strong> Serious adverse effects on operations</p>
                <p><strong>Controls:</strong> ~300 security controls</p>
                <p><strong>Use Cases:</strong> Most federal agency operations, business systems</p>
              </div>
            )}
            {fedRampLevel === "high" && (
              <div className="space-y-2 text-sm">
                <p><strong>Data Type:</strong> Highly sensitive, national security information</p>
                <p><strong>Impact:</strong> Catastrophic consequences including potential loss of life</p>
                <p><strong>Controls:</strong> ~421 security controls</p>
                <p><strong>Use Cases:</strong> Law enforcement, emergency services, critical infrastructure</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
