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

export function SecurityInfrastructureSection({ form }: { form: UseFormReturn<InsertCompanyProfile> }) {
  const encryptionStandards = useWatch({ control: form.control, name: "securityInfrastructure.encryptionStandards" }) || [];
  const backupSolutions = useWatch({ control: form.control, name: "securityInfrastructure.backupSolutions" }) || [];
  const disasterRecoverySites = useWatch({ control: form.control, name: "securityInfrastructure.disasterRecoverySites" }) || [];

  return (
    <AccordionItem value="security-infra" className="border rounded-md px-4">
                  <AccordionTrigger 
                    className="text-base font-semibold"
                    data-testid="accordion-trigger-security-infra"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Security Infrastructure
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-6">
                    <FormField
                      control={form.control}
                      name="securityInfrastructure.networkArchitectureSummary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Network Architecture Summary</FormLabel>
                          <FormControl>
                            <Textarea 
                              data-testid="textarea-network-architecture"
                              placeholder="Describe your network architecture..."
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="securityInfrastructure.firewallVendor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Firewall Vendor</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-firewall-vendor"
                                placeholder="e.g., Palo Alto, Cisco" 
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
                        name="securityInfrastructure.idsIpsVendor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IDS/IPS Vendor</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-ids-ips-vendor"
                                placeholder="e.g., Snort, Suricata" 
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
                        name="securityInfrastructure.siemSolution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SIEM Solution</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-siem-solution"
                                placeholder="e.g., Splunk, Datadog" 
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
                        name="securityInfrastructure.endpointProtection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endpoint Protection</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-endpoint-protection"
                                placeholder="e.g., CrowdStrike, Carbon Black" 
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
                        name="securityInfrastructure.vpnSolution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VPN Solution</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-vpn-solution"
                                placeholder="e.g., OpenVPN, Cisco AnyConnect" 
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
                        name="securityInfrastructure.mfaProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MFA Provider</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-mfa-provider"
                                placeholder="e.g., Okta, Duo" 
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
                        name="securityInfrastructure.identityProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Identity Provider</FormLabel>
                            <FormControl>
                              <Input 
                                data-testid="input-identity-provider"
                                placeholder="e.g., Azure AD, Okta" 
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Encryption Standards</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-encryption"
                          onClick={() => {
                            const current = form.getValues("securityInfrastructure.encryptionStandards") || [];
                            form.setValue("securityInfrastructure.encryptionStandards", [
                              ...current,
                              { type: "", algorithm: "", keyLength: undefined }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Standard
                        </Button>
                      </div>
                      {encryptionStandards.map((_: unknown, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.encryptionStandards.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-encryption-type-${index}`}
                                    placeholder="e.g., At Rest, In Transit" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.encryptionStandards.${index}.algorithm`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Algorithm</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-encryption-algorithm-${index}`}
                                    placeholder="e.g., AES-256" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.encryptionStandards.${index}.keyLength`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">Key Length</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-encryption-keylength-${index}`}
                                    type="number"
                                    placeholder="256" 
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
                            data-testid={`button-remove-encryption-${index}`}
                            onClick={() => {
                              const current = form.getValues("securityInfrastructure.encryptionStandards") || [];
                              form.setValue("securityInfrastructure.encryptionStandards", 
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
                        <h4 className="font-medium">Backup Solutions</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-backup"
                          onClick={() => {
                            const current = form.getValues("securityInfrastructure.backupSolutions") || [];
                            form.setValue("securityInfrastructure.backupSolutions", [
                              ...current,
                              { type: "", frequency: "", retention: "" }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Backup
                        </Button>
                      </div>
                      {backupSolutions.map((_: unknown, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.backupSolutions.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-backup-type-${index}`}
                                    placeholder="e.g., Full, Incremental" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.backupSolutions.${index}.frequency`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Frequency</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-backup-frequency-${index}`}
                                    placeholder="e.g., Daily, Weekly" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.backupSolutions.${index}.retention`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Retention</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-backup-retention-${index}`}
                                    placeholder="e.g., 30 days" 
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
                            data-testid={`button-remove-backup-${index}`}
                            onClick={() => {
                              const current = form.getValues("securityInfrastructure.backupSolutions") || [];
                              form.setValue("securityInfrastructure.backupSolutions", 
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
                        <h4 className="font-medium">Disaster Recovery Sites</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid="button-add-dr-site"
                          onClick={() => {
                            const current = form.getValues("securityInfrastructure.disasterRecoverySites") || [];
                            form.setValue("securityInfrastructure.disasterRecoverySites", [
                              ...current,
                              { location: "", type: "", rtoHours: undefined }
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add DR Site
                        </Button>
                      </div>
                      {disasterRecoverySites.map((_: unknown, index: number) => (
                        <div key={index} className="flex gap-3 items-end">
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.disasterRecoverySites.${index}.location`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Location</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-dr-location-${index}`}
                                    placeholder="DR site location" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.disasterRecoverySites.${index}.type`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Type</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-dr-type-${index}`}
                                    placeholder="e.g., Hot, Warm, Cold" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`securityInfrastructure.disasterRecoverySites.${index}.rtoHours`}
                            render={({ field }) => (
                              <FormItem className="w-28">
                                <FormLabel className="text-xs">RTO (hrs)</FormLabel>
                                <FormControl>
                                  <Input 
                                    data-testid={`input-dr-rto-${index}`}
                                    type="number"
                                    placeholder="Hours" 
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
                            data-testid={`button-remove-dr-site-${index}`}
                            onClick={() => {
                              const current = form.getValues("securityInfrastructure.disasterRecoverySites") || [];
                              form.setValue("securityInfrastructure.disasterRecoverySites", 
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
