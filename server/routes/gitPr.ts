/**
 * Git Pull Request Routes
 *
 * Exposes autonomous PR generation endpoints. All actions are
 * human-in-the-loop: drafts are stored locally and only pushed to
 * a remote provider when the user explicitly requests it.
 *
 * Mounted at: /api/git-pr
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAuthenticated } from '../replitAuth';
import { gitPrCreatorService } from '../services/gitPrCreatorService';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

// ─── Validation schemas ────────────────────────────────────────────────────

const generateDraftSchema = z.object({
  findingId: z.string().uuid('Invalid finding ID'),
  userContext: z.string().max(2000).optional(),
  baseBranch: z.string().max(100).default('main'),
  pushRemote: z.boolean().default(false),
});

// ─── Routes ───────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/git-pr/generate:
 *   post:
 *     tags: [Repository Analysis]
 *     summary: Generate an autonomous PR draft from a repository finding
 *     description: |
 *       Uses the AI orchestrator to analyse a compliance finding and generate
 *       a pull request draft (branch name, title, body, patches). The draft is
 *       stored as a repository task for human review. Set pushRemote=true to
 *       also open a draft PR on GitHub (requires GitHub credentials in settings).
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [findingId]
 *             properties:
 *               findingId:
 *                 type: string
 *                 format: uuid
 *               userContext:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Optional additional context to guide the AI
 *               baseBranch:
 *                 type: string
 *                 default: main
 *               pushRemote:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: PR draft created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Finding not found
 *       500:
 *         description: Generation failed
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const body = generateDraftSchema.parse(req.body);

    const user = req.user as unknown as { claims?: { sub?: string }; id?: string } | undefined;
    const userId: string =
      user?.claims?.sub ??
      user?.id ??
      (req.session as { userId?: string })?.userId ??
      'anonymous';

    const organizationId: string =
      (req as Request & { organizationId?: string }).organizationId ??
      (req.session as { organizationId?: string })?.organizationId ??
      '';

    if (!organizationId) {
      res.status(400).json({ message: 'Organization context is required' });
      return;
    }

    const draft = await gitPrCreatorService.generateDraft(
      body.findingId,
      organizationId,
      userId,
      {
        userContext: body.userContext,
        baseBranch: body.baseBranch,
        pushRemote: body.pushRemote,
      }
    );

    res.status(201).json({
      message: 'PR draft generated successfully',
      draft: {
        draftId: draft.draftId,
        findingId: draft.findingId,
        branchName: draft.branchName,
        title: draft.title,
        body: draft.body,
        patches: draft.patches,
        confidence: draft.confidence,
        aiModel: draft.aiModel,
        status: draft.status,
        remoteUrl: draft.remoteUrl,
        createdAt: draft.createdAt,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('PR generation route error', { error: message });

    if (message.includes('not found')) {
      res.status(404).json({ message });
    } else {
      res.status(500).json({ message: 'Failed to generate PR draft', error: message });
    }
  }
});

/**
 * @openapi
 * /api/git-pr/status:
 *   get:
 *     tags: [Repository Analysis]
 *     summary: Check if GitHub credentials are configured for remote push
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: GitHub integration status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { systemConfigService } = await import('../services/systemConfigService');

    const organizationId: string =
      (req as Request & { organizationId?: string }).organizationId ??
      (req.session as { organizationId?: string })?.organizationId ??
      '';

    if (!organizationId) {
      res.status(400).json({ message: 'Organization context required' });
      return;
    }

    const hasToken = !!(await systemConfigService.get('github_access_token'));
    const hasRepo = !!(await systemConfigService.get('github_repo_url'));

    res.json({
      githubConfigured: hasToken && hasRepo,
      hasToken,
      hasRepoUrl: hasRepo,
      features: {
        draftGeneration: true,
        remotePush: hasToken && hasRepo,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Git PR status check failed', { error: message });
    res.status(500).json({ message: 'Failed to check integration status' });
  }
});

export default router;
