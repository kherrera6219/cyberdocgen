import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Save } from 'lucide-react';

export const pdfSecurityDefaultsSchema = z.object({
  defaultEncryptionLevel: z.enum(['RC4_40', 'RC4_128', 'AES128', 'AES256']),
  defaultAllowPrinting: z.boolean(),
  defaultAllowCopying: z.boolean(),
  defaultAllowModifying: z.boolean(),
  defaultAllowAnnotations: z.boolean(),
  defaultWatermarkText: z.string(),
  defaultWatermarkOpacity: z.number().min(0).max(1),
});

export type PDFSecurityDefaultsForm = z.infer<typeof pdfSecurityDefaultsSchema>;

interface PDFSecuritySettingsProps {
  onSave: (data: PDFSecurityDefaultsForm) => void;
  isSaving: boolean;
}

export function PDFSecuritySettings({ onSave, isSaving }: PDFSecuritySettingsProps) {
  const form = useForm<PDFSecurityDefaultsForm>({
    resolver: zodResolver(pdfSecurityDefaultsSchema),
    defaultValues: {
      defaultEncryptionLevel: 'AES256',
      defaultAllowPrinting: false,
      defaultAllowCopying: false,
      defaultAllowModifying: false,
      defaultAllowAnnotations: false,
      defaultWatermarkText: 'CONFIDENTIAL',
      defaultWatermarkOpacity: 0.3,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Default PDF Security Settings
        </CardTitle>
        <CardDescription>
          Configure default security settings that will be applied to new PDF files.
          Users can override these settings for individual files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Encryption Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="defaultEncryptionLevel">Default Encryption Level</Label>
                <select
                  id="defaultEncryptionLevel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...form.register('defaultEncryptionLevel')}
                >
                  <option value="AES256">AES 256-bit (Highest Security)</option>
                  <option value="AES128">AES 128-bit (High Security)</option>
                  <option value="RC4_128">RC4 128-bit (Medium Security)</option>
                  <option value="RC4_40">RC4 40-bit (Low Security)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Default Permissions</h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...form.register('defaultAllowPrinting')}
                    className="rounded border-gray-300"
                  />
                  <span>Allow Printing</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...form.register('defaultAllowCopying')}
                    className="rounded border-gray-300"
                  />
                  <span>Allow Text/Image Copying</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...form.register('defaultAllowModifying')}
                    className="rounded border-gray-300"
                  />
                  <span>Allow Document Modification</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...form.register('defaultAllowAnnotations')}
                    className="rounded border-gray-300"
                  />
                  <span>Allow Annotations</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold">Default Watermark Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultWatermarkText">Default Watermark Text</Label>
                <Input
                  id="defaultWatermarkText"
                  placeholder="e.g., CONFIDENTIAL"
                  {...form.register('defaultWatermarkText')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultWatermarkOpacity">Default Watermark Opacity</Label>
                <Input
                  id="defaultWatermarkOpacity"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  placeholder="0.3"
                  {...form.register('defaultWatermarkOpacity', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save PDF Defaults'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
