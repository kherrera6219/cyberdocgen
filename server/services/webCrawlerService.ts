import { JSDOM } from "jsdom";
import { logger } from "../utils/logger";
import { ingestionService } from "./ingestionService";
import { auditService, AuditAction } from "./auditService";
import { URL } from "url";

interface CrawlConfig {
  url: string;
  maxDepth: number;
  maxPages: number;
}

export class WebCrawlerService {
  private visited: Set<string> = new Set();
  
  /**
   * Run a simple broad crawl (Import Only)
   */
  async crawl(userId: string, organizationId: string, snapshotId: string, config: CrawlConfig, ipAddress: string = 'unknown') {
    const { url, maxDepth = 1, maxPages = 10 } = config;
    this.visited.clear();
    
    // Audit Start
    await auditService.logEvent({
      organizationId,
      userId,
      action: AuditAction.UPDATE,
      resourceType: 'web_crawl',
      resourceId: snapshotId,
      ipAddress,
      details: { url, status: 'started' }
    });

    try {
      let count = 0;
      const queue: { url: string; depth: number }[] = [{ url, depth: 0 }];
      const domain = new URL(url).hostname;

      while (queue.length > 0 && count < maxPages) {
        const current = queue.shift();
        if (!current) break;
        
        if (this.visited.has(current.url)) continue;
        this.visited.add(current.url);

        try {
          const html = await this.fetchPage(current.url);
          const dom = new JSDOM(html);
          const doc = dom.window.document;

          // 1. Ingest content
          const title = doc.title || "Untitled Page";
          // Convert HTML to simple text or keep HTML. For RAG, text is better.
          // keeping it simple:
          const textContent = doc.body.textContent || "";
          
          await ingestionService.ingestFile({
             fileName: `web_${count}_${title.replace(/[^a-z0-9]/gi, '_')}.txt`,
             file: Buffer.from(textContent),
             snapshotId,
             category: 'Company Profile', // Web crawl usually for company profile
             organizationId,
             userId
          });

          count++;

          // 2. Discover links if depth allows
          if (current.depth < maxDepth) {
            const links = Array.from(doc.querySelectorAll("a[href]")) as HTMLAnchorElement[];
            for (const link of links) {
               const href = link.getAttribute("href");
               if (href) {
                  try {
                    const nextUrl = new URL(href, current.url);
                    // Scope check: Same Host Only
                    if (nextUrl.hostname === domain && !this.visited.has(nextUrl.href)) {
                        queue.push({ url: nextUrl.href, depth: current.depth + 1 });
                    }
                  } catch (e) {
                    // Ignore invalid URLs
                  }
               }
            }
          }

        } catch (pageErr: any) {
            logger.error(`Failed to crawl ${current.url}`, { error: pageErr.message });
        }
      }

      await auditService.logEvent({
        organizationId,
        userId,
        action: AuditAction.UPDATE,
        resourceType: 'web_crawl',
        resourceId: snapshotId,
        ipAddress,
        details: { url, status: 'completed', pages: count }
      });

      return { pages: count };

    } catch (error: any) {
      await auditService.logEvent({
        organizationId,
        userId,
        action: AuditAction.UPDATE,
        resourceType: 'web_crawl',
        resourceId: snapshotId,
        ipAddress,
        details: { url, status: 'failed', error: error.message }
      });
      throw error;
    }
  }

  private async fetchPage(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'CyberDocGen-Crawler/1.0 (Safe; Import-Only)'
            },
            signal: controller.signal
        });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('text/html')) {
             throw new Error(`Invalid content-type: ${contentType}. Only text/html is supported.`);
        }

        return await res.text();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out after 30s');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
  }
}

export const webCrawlerService = new WebCrawlerService();
