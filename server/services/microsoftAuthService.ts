import * as client from 'openid-client';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface MicrosoftUser {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
}

export interface AuthState {
  codeVerifier: string;
  state: string;
  nonce: string;
}

export class MicrosoftAuthService {
  private config?: client.Configuration;
  private readonly issuerUrl: string;
  private readonly clientId: string;
  private readonly clientSecret?: string;
  private readonly redirectUri: string;

  constructor() {
    this.issuerUrl = process.env.AZURE_AD_ISSUER_URL || 'https://login.microsoftonline.com/common/v2.0';
    this.clientId = process.env.AZURE_AD_CLIENT_ID || '';
    this.clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
    this.redirectUri = process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:5000/api/auth/microsoft/callback';
  }

  private async getConfig() {
    if (!this.config) {
      if (!this.clientId) {
        throw new Error('AZURE_AD_CLIENT_ID is not configured');
      }
      this.config = await client.discovery(
        new URL(this.issuerUrl),
        this.clientId,
        this.clientSecret
      );
    }
    return this.config;
  }

  /**
   * Generates PKCE parameters and authorization URL
   */
  async getAuthorizationParams(): Promise<{ url: URL; state: string; codeVerifier: string; nonce: string }> {
    const config = await this.getConfig();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
    const state = client.randomState();
    const nonce = client.randomNonce();

    const parameters: Record<string, string> = {
      redirect_uri: this.redirectUri,
      scope: 'openid profile email offline_access',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
      prompt: 'select_account'
    };

    const url = client.buildAuthorizationUrl(config, parameters);
    return { url, state, codeVerifier, nonce };
  }

  /**
   * Exchanges authorization code for tokens
   */
  async exchangeCode(
    code: string,
    state: string,
    storedState: string,
    codeVerifier: string,
    nonce: string
  ): Promise<client.TokenEndpointResponse & client.TokenEndpointResponseHelpers> {
    if (state !== storedState) {
      throw new Error('Invalid state');
    }

    const config = await this.getConfig();
    const tokens = await client.authorizationCodeGrant(config, new URL(this.redirectUri + '?code=' + code), {
      pkceCodeVerifier: codeVerifier,
      expectedState: storedState,
      expectedNonce: nonce
    });

    return tokens;
  }

  /**
   * Extracts user profile from ID token claims
   */
  mapClaimsToUser(claims: Record<string, any>): MicrosoftUser {
    return {
      id: claims.sub as string,
      email: (claims.email as string) || (claims.preferred_username as string) || '',
      displayName: claims.name as string,
      firstName: claims.given_name as string,
      lastName: claims.family_name as string,
      tenantId: claims.tid as string
    };
  }
}

export const microsoftAuthService = new MicrosoftAuthService();
