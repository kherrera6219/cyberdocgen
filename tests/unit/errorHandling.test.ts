import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createErrorResponse, 
  createSuccessResponse, 
  secureHandler, 
  validateInput,
  AppError,
  ValidationError,
  NotFoundError
} from '../../server/utils/errorHandling';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auditService } from '../../server/services/auditService';
import { logger } from '../../server/utils/logger';

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAction: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }
}));

vi.mock('../../server/replitAuth', () => ({
  getUserId: vi.fn().mockReturnValue('test-user'),
}));

describe('errorHandling', () => {
  describe('createErrorResponse', () => {
    it('formats AppError correctly', () => {
      const error = new AppError('Custom Error', 400, 'CUSTOM_CODE', { detail: 'info' });
      const response = createErrorResponse(error, 'req-123');
      
      expect(response).toEqual({
        success: false,
        error: {
          code: 'CUSTOM_CODE',
          message: 'Custom Error',
          requestId: 'req-123',
          details: { detail: 'info' }
        }
      });
    });

    it('formats ZodError correctly', () => {
      const schema = z.object({ name: z.string() });
      const result = schema.safeParse({ name: 123 });
      if (result.success) throw new Error('Should fail');
      
      const response = createErrorResponse(result.error, 'req-123');
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.details).toBeDefined();
    });

    it('uses default values for generic Errors', () => {
      const error = new Error('Generic Error');
      const response = createErrorResponse(error);
      
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.message).toBe('An unexpected error occurred');
    });
  });

  describe('createSuccessResponse', () => {
    it('formats success response correctly', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data, 'req-123');
      expect(response).toEqual({
        success: true,
        data,
        requestId: 'req-123'
      });
    });
  });

  describe('secureHandler', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: any;

    beforeEach(() => {
      mockReq = {
        requestId: 'req-123',
        path: '/test',
        method: 'POST',
        headers: {},
        get: vi.fn(),
        params: {},
        ip: '127.0.0.1'
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        headersSent: false
      };
      mockNext = vi.fn();
    });

    it('executes the handler and sends no error if successful', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const wrapped = secureHandler(handler);

      await wrapped(mockReq, mockRes, mockNext);
      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('catches and formats errors', async () => {
      const error = new NotFoundError('Not found');
      const handler = vi.fn().mockRejectedValue(error);
      const wrapped = secureHandler(handler);

      await wrapped(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('logs audit action if configured', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const wrapped = secureHandler(handler, {
        audit: { action: 'create', entityType: 'test' }
      });

      await wrapped(mockReq, mockRes, mockNext);
      expect(auditService.logAction).toHaveBeenCalled();
    });

  });

  describe('validateInput', () => {
    const schema = z.object({ name: z.string() });

    it('calls next if validation passes', () => {
      const middleware = validateInput(schema);
      const req = { body: { name: 'test' } } as any;
      const res = {} as any;
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ name: 'test' });
    });

    it('returns 400 if validation fails', () => {
      const middleware = validateInput(schema);
      const req = { body: { name: 123 } } as any;
      const json = vi.fn();
      const res = { status: vi.fn().mockReturnValue({ json }) } as any;
      const next = vi.fn();

      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' })
      }));
    });
  });
});
