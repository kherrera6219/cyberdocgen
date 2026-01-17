// AI Vision Routes
// Image analysis and computer vision support
import { Router } from 'express';
import { analyzeImage } from '../../services/geminiVision';
import {
  isAuthenticated,
  getRequiredUserId,
  asyncHandler,
  AppError,
  ValidationError,
  validateBody,
  aiLimiter,
  validateAIRequestSize,
  auditService,
  metricsCollector,
  logger
} from './shared';
import { analyzeImageSchema } from '../../validation/requestSchemas';

export function registerVisionRoutes(router: Router) {
  /**
   * POST /api/ai/analyze-image
   * Analyze image for compliance risks or content
   */
  router.post("/analyze-image", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(analyzeImageSchema), asyncHandler(async (req, res) => {
    const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    
    const { imageData, prompt, framework, analysisType } = req.body;
    const userId = getRequiredUserId(req);

    // Validate image data format and extract MIME type
    let mimeType = 'image/png';
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,/);
      if (matches) {
        mimeType = matches[1];
      }
    }
    
    // Validate MIME type
    if (!SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
      throw new ValidationError(`Unsupported image format: ${mimeType}. Supported formats: PNG, JPEG, GIF, WebP`);
    }
    
    // Validate data size (rough check for base64)
    const base64Length = imageData.includes(',') 
      ? imageData.split(',')[1].length 
      : imageData.length;
    const estimatedSize = base64Length * 0.75;
    
    if (estimatedSize > 20 * 1024 * 1024) { // 20MB limit
      throw new ValidationError("Image file is too large. Maximum size is 20MB.");
    }

    try {
      const result = await analyzeImage(imageData, {
        prompt,
        framework,
        analysisType
      });

      metricsCollector.trackAIOperation('vision_analysis', true);
      await auditService.logAction({
        action: "analyze_image",
        entityType: "image",
        entityId: `img_${Date.now()}`,
        userId,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        metadata: { analysisType, framework, mimeType, hasComplianceRelevance: !!result.complianceRelevance }
      });

      res.json({ success: true, ...result });
    } catch (error: unknown) {
      metricsCollector.trackAIOperation('vision_analysis', false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Image analysis failed", { error: errorMessage, userId: req.user?.claims?.sub });

      if (errorMessage.includes('GOOGLE_API_KEY')) {
        throw new AppError("Image analysis service is temporarily unavailable. Please try again later.", 503);
      } else if (errorMessage.includes('Invalid') || errorMessage.includes('format')) {
        throw new ValidationError("Invalid image format. Please upload a valid image file.");
      } else {
        throw new AppError("Failed to analyze image. Please try again.");
      }
    }
  }));
}
