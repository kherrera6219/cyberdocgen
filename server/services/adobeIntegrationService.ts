import axios from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errorHandling';

export interface AdobeSignRequest {
  documentId: string;
  recipientEmail: string;
  recipientName: string;
  message?: string;
}

export class AdobeIntegrationService {
  private readonly baseUrl = 'https://api.adobe.io';
  private accessToken?: string;
  private tokenExpiresAt?: Date;

  private ensureEnabled(): void {
    if (process.env.ADOBE_INTEGRATION_ENABLED !== 'true') {
      throw new AppError('Adobe integration is not enabled', 503);
    }
  }

  /**
   * Get technical account token (Server-to-Server OAuth v3)
   * This retrieves an access token corresponding to the Adobe IO project.
   */
  private async getAccessToken(): Promise<string> {
    this.ensureEnabled();

    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.accessToken;
    }

    try {
      const clientId = process.env.ADOBE_CLIENT_ID;
      const clientSecret = process.env.ADOBE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new AppError('Adobe client ID and secret must be configured in environment', 503);
      }

      logger.info('Exchanging Adobe Server-to-Server OAuth credentials for token...');
      const response = await axios.post('https://ims-na1.adobelogin.com/ims/token/v3', new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid,AdobeID,documentcloud_read,documentcloud_write'
      }).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      // Subtract 60 seconds from expiry for buffer
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

      logger.info('Adobe IO token exchange successful');
      return this.accessToken!;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to exchange Adobe token', { error: error.message, data: error.response?.data });
      throw new AppError('Adobe access token exchange failed', 503);
    }
  }

  /**
   * Request an electronic signature via Adobe Sign
   */
  async requestSignature(request: AdobeSignRequest): Promise<string> {
    try {
      const token = await this.getAccessToken();
      
      // Mock call to Adobe Sign API
      logger.info('Adobe Sign request initiated', { 
        documentId: request.documentId, 
        recipient: request.recipientEmail 
      });

      // API call using the retrieved auth token
      const response = await axios.post(`${this.baseUrl}/api/rest/v6/agreements`, {
        fileInfos: [{ documentId: request.documentId }],
        name: `Signature Request: ${request.documentId}`,
        participantSetsInfo: [{
          memberInfos: [{ email: request.recipientEmail }],
          order: 1,
          role: 'SIGNER'
        }],
        signatureType: 'ESIGN',
        state: 'IN_PROCESS'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.id;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Adobe Sign request failed', { error: error.message });
      throw new AppError('Adobe Sign request failed', 500);
    }
  }

  /**
   * Export document to PDF using Adobe PDF Services
   */
  async exportToHighFidelityPDF(documentContent: string, title: string): Promise<Buffer> {
    try {
      // In a real app, we'd send content to Adobe PDF Services
      logger.info('Adobe PDF Export initiated', { title });
      
      const token = await this.getAccessToken();
      // Placeholder for generating a real PDF via Adobe Document Services
      // For now, return a mock PDF buffer that proves authentication succeeded
      return Buffer.from(`%PDF-1.4\n%Adobe Generated PDF Mock for ${title}\n`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Adobe PDF export failed', { error: error.message });
      throw new AppError('Adobe PDF export failed', 500);
    }
  }
}

export const adobeIntegrationService = new AdobeIntegrationService();
