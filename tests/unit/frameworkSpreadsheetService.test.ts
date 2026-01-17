import { describe, it, expect, vi, beforeEach } from 'vitest';
import { frameworkSpreadsheetService } from '../../server/services/frameworkSpreadsheetService';
import { aiOrchestrator } from '../../server/services/aiOrchestrator';

// Mock AI Orchestrator
vi.mock('../../server/services/aiOrchestrator', () => ({
  aiOrchestrator: {
    generateContent: vi.fn(),
  }
}));

// Mock logger
vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  }
}));

describe('FrameworkSpreadsheetService', () => {
    const mockCompanyProfile = {
        companyName: 'Test Corp',
        industry: 'Software',
        companySize: '100-500',
        headquarters: 'San Francisco',
        keyPersonnel: {
            ceo: { name: 'John Doe', email: 'john@test.com' }
        },
        contactInfo: {
            email: 'contact@test.com'
        }
    } as any;

    describe('getSpreadsheetTemplates', () => {
        it('returns mapped templates for ISO27001', async () => {
            const templates = await frameworkSpreadsheetService.getSpreadsheetTemplates('ISO27001', mockCompanyProfile);
            
            expect(templates.length).toBeGreaterThan(0);
            expect(templates[0]).toHaveProperty('fields');
            
            // Check mapping
            const companyNameField = templates[0].fields.find(f => f.variableKey === 'company_name');
            expect(companyNameField?.currentValue).toBe('Test Corp');
            expect(companyNameField?.status).toBe('mapped');
        });

        it('returns empty fields if profile is missing data', async () => {
            const templates = await frameworkSpreadsheetService.getSpreadsheetTemplates('ISO27001', {} as any);
            const companyNameField = templates[0].fields.find(f => f.variableKey === 'company_name');
            
            expect(companyNameField?.currentValue).toBe('');
            expect(companyNameField?.status).toBe('empty');
        });

        it('throws error for invalid framework', async () => {
            await expect(frameworkSpreadsheetService.getSpreadsheetTemplates('INVALID', mockCompanyProfile))
                .rejects.toThrow('No templates found');
        });
    });

    describe('autofillTemplateFields', () => {
        const emptyFields = [
            { fieldId: 'f1', variableKey: 'data_retention', label: 'Data Retention', type: 'text' }
        ];

        it('uses AI to fill fields', async () => {
            (aiOrchestrator.generateContent as any).mockResolvedValue({
                result: {
                    content: JSON.stringify([{ fieldId: 'f1', value: '7 years', confidence: 0.9 }])
                }
            });

            const results = await frameworkSpreadsheetService.autofillTemplateFields(
                'ISO27001', 'template1', emptyFields, mockCompanyProfile
            );

            expect(results).toHaveLength(1);
            expect(results[0].value).toBe('7 years');
            expect(results[0].source).toBe('ai_generated');
        });

        it('handles invalid JSON from AI', async () => {
             (aiOrchestrator.generateContent as any).mockResolvedValue({
                result: { content: 'Not valid json' }
            });

            const results = await frameworkSpreadsheetService.autofillTemplateFields(
                'ISO27001', 'template1', emptyFields, mockCompanyProfile
            );
            
            // Should fallback to default logic (empty or specific default)
            expect(results).toHaveLength(1);
            expect(results[0].source).toBe('ai_generated');
            expect(results[0].confidence).toBe(0.5); // Fallback confidence
        });
        
        it('returns empty array if field list is empty', async () => {
             const results = await frameworkSpreadsheetService.autofillTemplateFields(
                'ISO27001', 'template1', [], mockCompanyProfile
            );
            expect(results).toHaveLength(0);
        });
    });

    describe('saveTemplateData', () => {
        it('persists data in memory', async () => {
            await frameworkSpreadsheetService.saveTemplateData('ISO27001', '123', [
                { fieldId: 'f1', value: 'Val1' }
            ]);
            
            const saved = await frameworkSpreadsheetService.getSavedTemplateData('ISO27001', '123');
            expect(saved['f1']).toBe('Val1');
        });
    });
});
