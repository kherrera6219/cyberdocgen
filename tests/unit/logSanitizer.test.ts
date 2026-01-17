import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeObject, sanitizeRequestForLogging } from '../../server/utils/logSanitizer';

describe('logSanitizer', () => {
    describe('sanitizeString', () => {
        it('masks emails', () => {
            const result = sanitizeString('Contact us at user@example.com');
            expect(result).toBe('Contact us at [EMAIL_REDACTED]');
        });

        it('masks IPv4', () => {
            const result = sanitizeString('Connection from 192.168.1.1');
            expect(result).toBe('Connection from [IP_REDACTED]');
        });

        it('masks IPv6', () => {
            const result = sanitizeString('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
            expect(result).toBe('[IP_REDACTED]');
        });

        it('masks credit cards', () => {
            const result = sanitizeString('Payment: 4111-1234-5678-9012');
            expect(result).toBe('Payment: [CC_REDACTED]');
        });

        it('masks sensitive headers/tokens', () => {
            const jwt = 'eyJabc.eyJdef.sig';
            const result = sanitizeString(`Bearer ${jwt}`);
            expect(result).toContain('Bearer [TOKEN_REDACTED]');
        });
    });

    describe('sanitizeObject', () => {
        it('recursively sanitizes', () => {
            const obj = {
                user: {
                    email: 'test@test.com',
                    id: 1
                },
                logs: ['IP: 10.0.0.1']
            };
            const result = sanitizeObject(obj);
            expect(result.user.email).toBe('[EMAIL_REDACTED]');
            expect(result.logs[0]).toBe('IP: [IP_REDACTED]');
        });

        it('redacts sensitive keys', () => {
            const obj = {
                password: 'secretpassword',
                apiKey: '12345'
            };
            const result = sanitizeObject(obj);
            expect(result.password).toBe('[REDACTED]');
            expect(result.apiKey).toBe('[REDACTED]');
        });
    });

    describe('sanitizeRequestForLogging', () => {
         it('sanitizes request parts', () => {
             const req = {
                 body: { email: 'test@test.com' },
                 headers: { 'Authorization': 'Bearer 123', 'x-custom': 'val' },
                 query: { token: '123' }
             };
             
             const result = sanitizeRequestForLogging(req as any);
             expect((result.body as any).email).toBe('[EMAIL_REDACTED]');
             expect((result.headers as any)['Authorization']).toBe('[REDACTED]');
             expect((result.query as any).token).toBe('[REDACTED]'); // 'token' is in SENSITIVE_KEYS
         });
    });
});
