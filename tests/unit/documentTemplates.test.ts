import { describe, it, expect, vi } from 'vitest';
import { DocumentTemplateService, AllDocumentTemplates } from '../../server/services/documentTemplates';

describe('DocumentTemplateService', () => {
    describe('getTemplatesByFramework', () => {
        it('returns templates for valid framework', () => {
            const templates = DocumentTemplateService.getTemplatesByFramework('ISO27001');
            expect(templates.length).toBeGreaterThan(0);
        });

        it('returns empty array for invalid framework', () => {
            const templates = DocumentTemplateService.getTemplatesByFramework('INVALID');
            expect(templates).toEqual([]);
        });
    });

    describe('getTemplateById', () => {
        it('finds existing template', () => {
            // Pick a real template from AllDocumentTemplates
            const framework = Object.keys(AllDocumentTemplates)[0];
            const target = AllDocumentTemplates[framework][0];
            
            const found = DocumentTemplateService.getTemplateById(target.id);
            expect(found).toBeDefined();
            expect(found?.id).toBe(target.id);
        });

        it('returns null for non-existent template', () => {
            const found = DocumentTemplateService.getTemplateById('non-existent-id');
            expect(found).toBeNull();
        });
    });

    describe('validateTemplateVariables', () => {
        it('validates required variables', () => {
            // Mock a template with required variables
            const templateId = 'test-template';
            const mockTemplate = {
                id: templateId,
                title: 'Test',
                templateContent: 'Content {{var}}',
                templateVariables: {
                    var: { label: 'Var', type: 'text', required: true }
                }
            };
            
            // Spy on getTemplateById to return our mock
            vi.spyOn(DocumentTemplateService, 'getTemplateById').mockReturnValue(mockTemplate as any);

            const result = DocumentTemplateService.validateTemplateVariables(templateId, {});
            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Required variable 'Var' is missing");
            
            const validResult = DocumentTemplateService.validateTemplateVariables(templateId, { var: 'value' });
            expect(validResult.valid).toBe(true);
        });
    });

    describe('generateDocument', () => {
        it('replaces variables in content', () => {
            const templateId = 'gen-test';
            const mockTemplate = {
                id: templateId,
                title: 'Test',
                templateContent: 'Hello {{name}}',
                templateVariables: {
                    name: { label: 'Name', type: 'text', required: true }
                }
            };
            vi.spyOn(DocumentTemplateService, 'getTemplateById').mockReturnValue(mockTemplate as any);

            const result = DocumentTemplateService.generateDocument(templateId, { name: 'World' });
            expect(result.success).toBe(true);
            expect(result.content).toBe('Hello World');
        });

        it('handles missing variables placeholders', () => {
            const templateId = 'missing-var';
            const mockTemplate = {
                id: templateId,
                templateContent: 'Hello {{name}}',
            };
            vi.spyOn(DocumentTemplateService, 'getTemplateById').mockReturnValue(mockTemplate as any);

            const result = DocumentTemplateService.generateDocument(templateId, {});
            expect(result.content).toBe('Hello [TO BE COMPLETED]');
        });
    });
    
    describe('queryTemplates', () => {
        it('filters by framework', () => {
             const results = DocumentTemplateService.queryTemplates({ framework: 'ISO27001' });
             expect(results.length).toBeGreaterThan(0);
             expect(results[0].framework).toBe('ISO27001'); // Assuming mock data matches or real data used if spy restored
        });
    });
});
