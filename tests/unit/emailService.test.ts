import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../server/services/emailService';

// Mock logger to avoid console spam
vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  }
}));

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.RESEND_API_KEY = 'test_key';
    
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('configuration', () => {
    it('skips email if API key is missing', async () => {
      delete process.env.RESEND_API_KEY;
      
      const result = await sendVerificationEmail('test@example.com', 'http://url');
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendVerificationEmail', () => {
    it('sends email successfully', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '123' })
      });

      const result = await sendVerificationEmail('test@example.com', 'http://verify');
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_key'
          }),
          body: expect.stringContaining('"subject":"Verify your CyberDocGen account"')
        })
      );
    });

    it('handles API failure', async () => {
      // Mock failed response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid request'
      });

      const result = await sendVerificationEmail('test@example.com', 'http://verify');
      expect(result).toBe(false);
    });

    it('handles network error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await sendVerificationEmail('test@example.com', 'http://verify');
      expect(result).toBe(false);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('sends email successfully', async () => {
       (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ id: '456' })
      });

      const result = await sendPasswordResetEmail('test@example.com', 'http://reset');
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
            body: expect.stringContaining('"subject":"Reset your CyberDocGen password"')
        })
      );
    });
  });
});
