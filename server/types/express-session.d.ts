import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    email?: string;
    loginTime?: string;
    isTemporary?: boolean;
    tempUserName?: string;
    tempUserEmail?: string;
    mfaVerified?: boolean;
    mfaVerifiedAt?: string;
    mfaEnabled?: boolean;
    csrfToken?: string;
    csrfUserId?: string;
    csrfCreatedAt?: number;
    organizationId?: string;
    microsoftAuthState?: {
      state: string;
      codeVerifier: string;
      nonce: string;
      timestamp: number;
    };
  }
}
