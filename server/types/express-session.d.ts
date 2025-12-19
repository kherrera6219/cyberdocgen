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
    csrfToken?: string;
  }
}
