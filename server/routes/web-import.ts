import { Router } from "express";
import { webCrawlerService } from "../services/webCrawlerService";
import { z } from "zod";
import { isAuthenticated } from "../replitAuth";
import { requireOrganization } from "../middleware/multiTenant";

export const webImportRouter = Router();

webImportRouter.use(isAuthenticated);
webImportRouter.use(requireOrganization);

const crawlSchema = z.object({
  url: z.string().url(),
  maxDepth: z.number().min(0).max(3).default(1),
  maxPages: z.number().min(1).max(50).default(10),
  snapshotId: z.string(),
});

webImportRouter.post("/crawl", async (req, res) => {
  try {
    const { url, maxDepth, maxPages, snapshotId } = crawlSchema.parse(req.body);
    const session = req.session as any;
    const userId = (req.user as any)?.id || session?.user?.id || session?.userId;
    const orgId = session?.user?.organizationId || session?.organizationId || (req.user as any)?.organizationId;

    // Async execution
    // We could make this sync if we want immediate feedback, but crawling is slow.
    // For now, let's await it as requested by "Import Dialog" typical flow, 
    // or return accepted and run in background.
    // Given the 'maxPages' is small (50), we can await it for simple UX.
    
    const result = await webCrawlerService.crawl(userId, orgId, snapshotId, { url, maxDepth, maxPages }, req.ip || 'unknown');

    res.json({ message: "Crawl completed", result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
});
