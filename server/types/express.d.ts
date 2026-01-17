import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      role: string;
      organizationId?: string;
      organization?: {
        requireMFA: boolean;
      };
      mfaVerified?: boolean;
      mfaVerifiedAt?: number;
      claims?: {
        sub: string;
      };
    }

    interface Request {
      user?: User;
      requestId?: string;
    }
  }
}

export {};
