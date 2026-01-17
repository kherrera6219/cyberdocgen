import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleError, createErrorHandler } from '../../server/utils/errorHandler';
import { Request, Response } from 'express';
import { logger } from '../../server/utils/logger';

vi.mock('../../server/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  }
}));

describe('errorHandler', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });
        mockReq = {
            url: '/test',
            method: 'GET',
        };
        mockRes = {
            status: statusMock,
        };
        vi.clearAllMocks();
    });

    it('handleError handles explicit Error objects', () => {
        const error = new Error('Test Error');
        handleError(error, mockReq as Request, mockRes as Response, 'testOp');

        expect(logger.error).toHaveBeenCalledWith(
            'Error in testOp',
            expect.objectContaining({ error: 'Test Error', operation: 'testOp' }),
            mockReq
        );
        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            message: 'Failed to testOp'
        }));
    });

    it('handleError handles unknown errors', () => {
        handleError('Just a string', mockReq as Request, mockRes as Response, 'testOp');

        expect(logger.error).toHaveBeenCalledWith(
            'Error in testOp',
            expect.objectContaining({ error: 'Unknown error' }), // logic says check instanceof Error
            mockReq
        );
    });

    it('createErrorHandler returns a middleware function', () => {
        const handler = createErrorHandler('middlewareOp');
        expect(typeof handler).toBe('function');

        handler(new Error('MW Error'), mockReq as Request, mockRes as Response);
        expect(logger.error).toHaveBeenCalledWith(
            'Error in middlewareOp',
            expect.objectContaining({ error: 'MW Error' }),
            mockReq
        );
    });
});
