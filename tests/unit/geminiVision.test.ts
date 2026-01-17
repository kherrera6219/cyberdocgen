import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeImage, analyzeMultipleImages } from '../../server/services/geminiVision';
import { getGeminiClient } from '../../server/services/aiClients';
import { logger } from '../../server/utils/logger';

// Mocks
vi.mock('../../server/services/aiClients', () => ({
  getGeminiClient: vi.fn(),
}));
vi.mock('../../server/utils/logger');

describe('geminiVision', () => {
    const mockGenerateContent = vi.fn();
    const mockModel = {
        generateContent: mockGenerateContent
    };
    const mockClient = {
        models: mockModel
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getGeminiClient as any).mockReturnValue(mockClient);
    });

    describe('analyzeImage', () => {
        it('analyzes image successfully', async () => {
            mockGenerateContent.mockResolvedValue({
                text: 'Analysis result'
            });

            const result = await analyzeImage('data:image/png;base64,abc');
            
            expect(result.analysis).toBe('Analysis result');
            expect(result.confidence).toBe(85);
            expect(mockGenerateContent).toHaveBeenCalledWith(
                expect.objectContaining({
                     model: 'gemini-2.0-flash'
                })
            );
        });

        it('handles compliance analysis', async () => {
             const mockText = `
             Control: ISO-27001
             Risk: High risk found
             Recommendation: Fix it
             `;
             mockGenerateContent.mockResolvedValue({ text: mockText });

             const result = await analyzeImage('data:image/png;base64,abc', {
                 analysisType: 'compliance',
                 framework: 'ISO27001'
             });
             
             expect(result.complianceRelevance).toBeDefined();
             expect(result.complianceRelevance?.controls).toContain('ISO-27001');
        });

        it('handles diagram analysis', async () => {
            const mockText = 'Component: Database Server';
            mockGenerateContent.mockResolvedValue({ text: mockText });

            const result = await analyzeImage('data:image/png;base64,abc', {
                analysisType: 'diagram'
            });

            expect(result.diagramElements).toBeDefined();
            expect(result.diagramElements?.[0].description).toBe('Component: Database Server');
        });

        it('handles document analysis', async () => {
            const mockText = 'This is extracted document text';
            mockGenerateContent.mockResolvedValue({ text: mockText });

            const result = await analyzeImage('data:image/png;base64,abc', {
                analysisType: 'document'
            });

            expect(result.extractedText).toBe(mockText);
        });

        it('throws on invalid image format', async () => {
            await expect(analyzeImage('data:invalid-format'))
                .rejects.toThrow('Invalid base64 image format');
        });

        it('handles raw base64 without prefix', async () => {
             mockGenerateContent.mockResolvedValue({ text: 'Success' });
             await analyzeImage('abc123raw', { prompt: 'test' });
             expect(mockGenerateContent).toHaveBeenCalled();
        });
    });

    describe('analyzeMultipleImages', () => {
        it('processes multiple images', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Analysis' });
            
            const images = [
                { data: 'data:image/png;base64,1' },
                { data: 'data:image/png;base64,2' }
            ];
            
            const results = await analyzeMultipleImages(images);
            expect(results).toHaveLength(2);
            expect(results[0].analysis).toBe('Analysis');
        });

        it('handles errors gracefully in batch', async () => {
             mockGenerateContent
                .mockResolvedValueOnce({ text: 'Success' })
                .mockRejectedValueOnce(new Error('Fail'));

             const images = [
                { data: 'data:image/png;base64,1' },
                { data: 'data:image/png;base64,2' }
            ];

            const results = await analyzeMultipleImages(images);
            expect(results[0].analysis).toBe('Success');
            expect(results[1].analysis).toContain('Failed to analyze');
            expect(results[1].confidence).toBe(0);
        });
    });
});
