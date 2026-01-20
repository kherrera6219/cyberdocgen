
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import enterpriseAuthRouter from '../../server/routes/enterpriseAuth';
import { globalErrorHandler } from '../../server/utils/errorHandling';

// Mock Services
vi.mock('../../server/services/enterpriseAuthService', () => ({
    enterpriseAuthService: {
        authenticateUser: vi.fn(),
        createAccount: vi.fn(),
        verifyEmail: vi.fn(),
        initiatePasswordReset: vi.fn(),
        confirmPasswordReset: vi.fn(),
        setupGoogleAuthenticator: vi.fn(),
        registerPasskey: vi.fn(),
    }
}));

vi.mock('../../server/services/mfaService', () => ({
    mfaService: {
        getAllMFASettings: vi.fn(),
        verifyTOTP: vi.fn(),
        getPasskeyCount: vi.fn(),
    }
}));

vi.mock('../../server/services/auditService', () => ({
    auditService: {
        logAuditEvent: vi.fn(),
    },
    AuditAction: { UPDATE: 'update', DELETE: 'delete' },
    RiskLevel: { MEDIUM: 'medium', LOW: 'low' },
}));

vi.mock('../../server/services/emailService', () => ({
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../../server/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}));

// Mock rate limiters (by-pass for tests)
vi.mock('../../server/middleware/rateLimiter', () => ({
    authStrictLimiter: (req: any, res: any, next: any) => next(),
    authLimiter: (req: any, res: any, next: any) => next(),
}));

describe('Enterprise Auth Routes', () => {
    let app: express.Express;

    beforeEach(() => {
        vi.clearAllMocks();
        app = express();
        app.use(express.json());
        // Simple session mock for regenerate/destroy
        app.use((req: any, res, next) => {
            req.session = {
                regenerate: (cb: any) => { cb(); },
                destroy: (cb: any) => { cb(); },
                save: (cb: any) => { cb(); },
                userId: 'user-123',
                email: 'test@example.com'
            };
            next();
        });
        app.use('/api/enterprise-auth', enterpriseAuthRouter);
        app.use(globalErrorHandler);
    });

    describe('POST /api/enterprise-auth/login', () => {
        it('logs in successfully and regenerates session', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.authenticateUser as any).mockResolvedValue({
                success: true,
                user: { id: 'u1', email: 't@e.com', twoFactorEnabled: false }
            });

            const response = await request(app)
                .post('/api/enterprise-auth/login')
                .send({ identifier: 'user', password: 'Password123!' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toContain('Login successful');
        });

        it('returns 401 on failed authentication', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.authenticateUser as any).mockResolvedValue({
                success: false,
                error: 'Invalid credentials'
            });

            await request(app)
                .post('/api/enterprise-auth/login')
                .send({ identifier: 'user', password: 'wrong' })
                .expect(401);
        });
    });

    describe('POST /api/enterprise-auth/signup', () => {
        it('creates an account and sends verification email', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.createAccount as any).mockResolvedValue({
                user: { id: 'u2', email: 'new@e.com' },
                emailToken: 'token-123'
            });

            const response = await request(app)
                .post('/api/enterprise-auth/signup')
                .send({
                    email: 'new@e.com',
                    password: 'SecurePassword123!',
                    firstName: 'John'
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.id).toBe('u2');
        });
    });

    describe('POST /api/enterprise-auth/setup-google-authenticator', () => {
        it('initiates GA setup', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.setupGoogleAuthenticator as any).mockResolvedValue({
                qrCodeUrl: 'qr',
                secret: 'sec',
                backupCodes: ['code']
            });

            const response = await request(app)
                .post('/api/enterprise-auth/setup-google-authenticator')
                .send({ userId: 'u1' })
                .expect(200);

            expect(response.body.data.setup.secret).toBe('sec');
        });
    });

    describe('POST /api/enterprise-auth/logout', () => {
        it('destroys session and clears cookie', async () => {
            const response = await request(app)
                .post('/api/enterprise-auth/logout')
                .expect(200);

            expect(response.body.success).toBe(true);
            const cookies = response.get('Set-Cookie');
            expect(cookies && cookies[0]).toContain('connect.sid=;');
        });
    });

    describe('GET /api/enterprise-auth/methods/:userId', () => {
        it('returns available auth methods', async () => {
            const { mfaService } = await import('../../server/services/mfaService');
            (mfaService.getAllMFASettings as any).mockResolvedValue([{ mfaType: 'totp', isEnabled: true }]);
            (mfaService.getPasskeyCount as any).mockResolvedValue(0);

            const response = await request(app)
                .get('/api/enterprise-auth/methods/u1')
                .expect(200);

            expect(response.body.data.methods.totp).toBe(true);
            expect(response.body.data.mfaEnabled).toBe(true);
        });
    });

    describe('POST /api/enterprise-auth/signup', () => {
        it('returns 409 if account already exists', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.createAccount as any).mockRejectedValue(new Error('already exists'));

            const response = await request(app)
                .post('/api/enterprise-auth/signup')
                .send({
                    email: 'exists@example.com',
                    password: 'Password123!@#',
                    firstName: 'John',
                    lastName: 'Doe'
                });

            expect(response.status).toBe(409);
        });
    });

    describe('POST /api/enterprise-auth/verify-email', () => {
        it('returns 400 for invalid token', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.verifyEmail as any).mockResolvedValue(false);

            const response = await request(app)
                .post('/api/enterprise-auth/verify-email')
                .send({ token: 'invalid' });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/enterprise-auth/verify-email', () => {
        it('redirects with verified status on success', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.verifyEmail as any).mockResolvedValue(true);

            const response = await request(app)
                .get('/api/enterprise-auth/verify-email?token=valid');

            expect(response.status).toBe(302);
            expect(response.header.location).toContain('verified=true');
        });

        it('returns 400 for missing token', async () => {
            const response = await request(app).get('/api/enterprise-auth/verify-email');
            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/enterprise-auth/forgot-password', () => {
        it('successfully initiates reset and hides token in non-dev', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            // Mock production env
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            (enterpriseAuthService.initiatePasswordReset as any).mockResolvedValue('token-123');

            const response = await request(app)
                .post('/api/enterprise-auth/forgot-password')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(200);
            expect(response.body.data.resetToken).toBeUndefined();
            
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('POST /api/enterprise-auth/reset-password', () => {
        it('returns 400 for invalid token', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.confirmPasswordReset as any).mockResolvedValue(false);

            const response = await request(app)
                .post('/api/enterprise-auth/reset-password')
                .send({ token: 'invalid', newPassword: 'NewPassword123!@#' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/enterprise-auth/verify-google-authenticator', () => {
        it('verifies TOTP successfully', async () => {
            const { mfaService } = await import('../../server/services/mfaService');
            (mfaService.getAllMFASettings as any).mockResolvedValue([
                { mfaType: 'totp', secretEncrypted: 'secret' }
            ]);
            (mfaService.verifyTOTP as any).mockResolvedValue(true);

            const response = await request(app)
                .post('/api/enterprise-auth/verify-google-authenticator')
                .send({ userId: 'user-1', token: '123456' });

            expect(response.status).toBe(200);
        });

        it('returns 400 for invalid TOTP', async () => {
            const { mfaService } = await import('../../server/services/mfaService');
            (mfaService.getAllMFASettings as any).mockResolvedValue([
                { mfaType: 'totp', secretEncrypted: 'secret' }
            ]);
            (mfaService.verifyTOTP as any).mockResolvedValue(false);

            const response = await request(app)
                .post('/api/enterprise-auth/verify-google-authenticator')
                .send({ userId: 'user-1', token: '000000' });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/enterprise-auth/register-passkey', () => {
        it('registers passkey successfully', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.registerPasskey as any).mockResolvedValue(true);

            const response = await request(app)
                .post('/api/enterprise-auth/register-passkey')
                .send({
                    userId: 'user-1',
                    credentialId: 'cred-1',
                    publicKey: 'pk-1',
                    deviceName: 'My Phone',
                    deviceType: 'platform',
                    transports: ['usb']
                });

            expect(response.status).toBe(200);
        });

        it('returns 400 if registration fails', async () => {
            const { enterpriseAuthService } = await import('../../server/services/enterpriseAuthService');
            (enterpriseAuthService.registerPasskey as any).mockResolvedValue(false);

            const response = await request(app)
                .post('/api/enterprise-auth/register-passkey')
                .send({
                    userId: 'user-1',
                    credentialId: 'cred-1',
                    publicKey: 'pk-1',
                    deviceName: 'My Phone',
                    deviceType: 'platform',
                    transports: ['usb']
                });

            expect(response.status).toBe(400);
        });
    });
});
