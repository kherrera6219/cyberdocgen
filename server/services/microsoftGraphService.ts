import { Client, AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { logger } from '../utils/logger';
import { AppError, ServiceUnavailableError } from '../utils/errorHandling';
import { systemConfigService } from './systemConfigService';

/**
 * Custom authentication provider for Microsoft Graph
 */
class CustomAuthProvider implements AuthenticationProvider {
  constructor(private accessToken: string) {}

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export interface SharePointSite {
  id: string;
  name: string;
  displayName: string;
  webUrl: string;
}

export interface TeamsChannel {
  id: string;
  displayName: string;
  description?: string;
  webUrl?: string;
}

export class MicrosoftGraphService {
  private getClient(accessToken: string): Client {
    const authProvider = new CustomAuthProvider(accessToken);
    return Client.initWithMiddleware({ authProvider });
  }

  /**
   * Search for SharePoint sites
   */
  async searchSites(accessToken: string, query: string): Promise<SharePointSite[]> {
    try {
      const client = this.getClient(accessToken);
      const response = await client
        .api('/sites')
        .search(query)
        .get();

      return response.value.map((site: any) => ({
        id: site.id,
        name: site.name,
        displayName: site.displayName,
        webUrl: site.webUrl,
      }));
    } catch (error: any) {
      logger.error('Failed to search SharePoint sites', { error: error.message });
      throw new AppError('Failed to search SharePoint sites', 500);
    }
  }

  /**
   * Get files from a SharePoint site's default drive
   */
  async getSiteFiles(accessToken: string, siteId: string) {
    try {
      const client = this.getClient(accessToken);
      const response = await client
        .api(`/sites/${siteId}/drive/root/children`)
        .get();

      return response.value;
    } catch (error: any) {
      logger.error('Failed to get SharePoint site files', { siteId, error: error.message });
      throw new AppError('Failed to get SharePoint site files', 500);
    }
  }

  /**
   * List user's joined Teams
   */
  async getJoinedTeams(accessToken: string) {
    try {
      const client = this.getClient(accessToken);
      const response = await client
        .api('/me/joinedTeams')
        .get();

      return response.value;
    } catch (error: any) {
      logger.error('Failed to get joined Teams', { error: error.message });
      throw new AppError('Failed to get joined Teams', 500);
    }
  }

  /**
   * Get channels for a specific team
   */
  async getTeamChannels(accessToken: string, teamId: string): Promise<TeamsChannel[]> {
    try {
      const client = this.getClient(accessToken);
      const response = await client
        .api(`/teams/${teamId}/channels`)
        .get();

      return response.value.map((channel: any) => ({
        id: channel.id,
        displayName: channel.displayName,
        description: channel.description,
        webUrl: channel.webUrl,
      }));
    } catch (error: any) {
      logger.error('Failed to get team channels', { teamId, error: error.message });
      throw new AppError('Failed to get team channels', 500);
    }
  }

  /**
   * Send a message to a Teams channel
   */
  async sendChannelMessage(accessToken: string, teamId: string, channelId: string, message: string) {
    try {
      const client = this.getClient(accessToken);
      await client
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
        .post({
          body: {
            content: message
          }
        });
    } catch (error: any) {
      logger.error('Failed to send Teams message', { teamId, channelId, error: error.message });
      throw new AppError('Failed to send Teams message', 500);
    }
  }
}

export const microsoftGraphService = new MicrosoftGraphService();
