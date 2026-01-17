import { Request } from 'express';
import 'express-session';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    mfaVerified?: boolean;
    userId?: string;
  }
}

export {};
