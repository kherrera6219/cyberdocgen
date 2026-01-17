import { describe, it, expect } from 'vitest';
import { 
    createOrganizationSchema, 
    analyzeQualitySchema,
    generateComplianceDocsSchema,
    chatMessageSchema,
    mfaSetupSchema
} from '../../server/validation/requestSchemas';

describe('requestSchemas', () => {
    describe('createOrganizationSchema', () => {
        it('validates valid input', () => {
            const result = createOrganizationSchema.safeParse({
                name: 'Test Org',
                slug: 'test-org',
                contactEmail: 'test@org.com'
            });
            expect(result.success).toBe(true);
        });

        it('fails on missing name', () => {
             const result = createOrganizationSchema.safeParse({
                slug: 'test-org'
            });
            expect(result.success).toBe(false);
        });

        it('validates email format', () => {
            const result = createOrganizationSchema.safeParse({
                name: 'Test',
                contactEmail: 'invalid-email'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('analyzeQualitySchema', () => {
        it('requires content and framework', () => {
            const valid = analyzeQualitySchema.safeParse({
                content: 'some content',
                framework: 'iso27001'
            });
            expect(valid.success).toBe(true);

            const invalid = analyzeQualitySchema.safeParse({
                framework: 'iso27001'
            });
            expect(invalid.success).toBe(false);
        });
    });

    describe('generateComplianceDocsSchema', () => {
        it('validates complex nested structure', () => {
            const input = {
                companyInfo: {
                    companyName: 'Test Corp'
                },
                frameworks: ['iso27001'],
                soc2Options: {
                    trustPrinciples: ['security']
                }
            };
            const result = generateComplianceDocsSchema.safeParse(input);
            expect(result.success).toBe(true);
        });
        
        it('enforces array min length', () => {
            const input = {
                companyInfo: { companyName: 'Test' },
                frameworks: []
            };
            const result = generateComplianceDocsSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('chatMessageSchema', () => {
        it('validates message length', () => {
            const result = chatMessageSchema.safeParse({
                message: ''
            });
            expect(result.success).toBe(false);
        });
    });

    describe('mfaSetupSchema', () => {
        it('validates method enum', () => {
            const valid = mfaSetupSchema.safeParse({ method: 'totp' });
            expect(valid.success).toBe(true);

            const invalid = mfaSetupSchema.safeParse({ method: 'magic' });
            expect(invalid.success).toBe(false);
        });
    });
});
