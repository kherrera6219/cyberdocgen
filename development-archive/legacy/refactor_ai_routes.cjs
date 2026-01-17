
const fs = require('fs');
const path = 'c:\\software\\cyberdocgen\\server\\routes\\ai.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Helper to replace range
function replaceRange(startLine1Idx, endLine1Idx, replacement) {
    // 1-based startLine, so index is startLine-1
    const before = lines.slice(0, startLine1Idx-1);
    const after = lines.slice(endLine1Idx);
    return [...before, replacement, ...after].join('\n');
}

// Logic for multimodal-chat (Lines 604-724 in original)
// We need to capture the exact string to be safe, or just overwrite by index if we are confident.
// We are confident in the Line numbers from Step 864.
// 604-724 (inclusive)
// However, I want to double check the content at line 604 starts with 'router.post("/multimodal-chat"'
if (!lines[603].includes('router.post("/multimodal-chat"')) {
    console.error('Line 604 mismatch:', lines[603]);
    process.exit(1);
}

const replacementMultimodal = `  router.post("/multimodal-chat", isAuthenticated, aiLimiter, validateAIRequestSize, validateBody(multimodalChatSchema), asyncHandler(async (req, res) => {
    const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
    
    const { message, framework, sessionId, attachments } = req.body;
    const userId = getRequiredUserId(req);

    const imageAnalysisResults: any[] = [];
    const unsupportedFiles: string[] = [];
    const documentContents: string[] = [];
    
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        const { type, content, name } = attachment;
        
        if (!content) continue;
        
        // Check size (base64 is ~1.37x the original size)
        const estimatedSize = (content.length * 0.75);
        if (estimatedSize > MAX_ATTACHMENT_SIZE) {
          unsupportedFiles.push(\`\${name} (file too large)\`);
          continue;
        }
        
        if (SUPPORTED_IMAGE_TYPES.includes(type)) {
          // Process as image
          try {
            const result = await analyzeImage(content, {
              framework,
              analysisType: 'compliance',
              prompt: \`Analyze this image in the context of the user's message: "\${message}"\`
            });
            imageAnalysisResults.push({
              fileName: name,
              ...result
            });
          } catch (imgError) {
            logger.warn('Failed to analyze image attachment', { name, error: imgError });
            unsupportedFiles.push(\`\${name} (analysis failed)\`);
          }
        } else if (type === 'application/pdf' || type?.includes('document')) {
          // For documents, note them but don't process through vision API
          documentContents.push(\`[Document attached: \${name}]\`);
        } else {
          unsupportedFiles.push(\`\${name} (unsupported type: \${type})\`);
        }
      }
    }

    // Build enhanced message with context from attachments
    let enhancedMessage = message;
    
    if (imageAnalysisResults.length > 0) {
      enhancedMessage += '\\n\\n[Image Analysis Results]:\\n';
      imageAnalysisResults.forEach((result, i) => {
        const truncatedAnalysis = result.analysis.length > 1000 
          ? result.analysis.substring(0, 1000) + '...' 
          : result.analysis;
        enhancedMessage += \`\\nImage "\${result.fileName}": \${truncatedAnalysis}\`;
        
        if (result.complianceRelevance) {
          const { controls, risks, recommendations } = result.complianceRelevance;
          if (controls?.length) enhancedMessage += \`\\n  Controls: \${controls.join(', ')}\`;
          if (risks?.length) enhancedMessage += \`\\n  Risks: \${risks.slice(0, 3).join('; ')}\`;
          if (recommendations?.length) enhancedMessage += \`\\n  Recommendations: \${recommendations.slice(0, 3).join('; ')}\`;
        }
      });
    }
    
    if (documentContents.length > 0) {
      enhancedMessage += '\\n\\n' + documentContents.join('\\n');
    }

    const response = await complianceChatbot.processMessage(
      enhancedMessage,
      userId,
      sessionId,
      framework
    );

    metricsCollector.trackAIOperation('multimodal_chat', true);
    await auditService.logAction({
      action: "multimodal_chat",
      entityType: "ai_conversation",
      entityId: sessionId || \`chat_\${Date.now()}\`,
      userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { 
        framework, 
        messageLength: message.length, 
        attachmentCount: attachments?.length || 0,
        imageAnalysisCount: imageAnalysisResults.length,
        unsupportedFiles: unsupportedFiles.length
      }
    });

    res.json({
      ...response,
      processingDetails: {
        processedImages: imageAnalysisResults.map(r => r.fileName),
        unsupportedFiles,
        documents: documentContents.length
      },
      imageAnalysis: imageAnalysisResults.length > 0 ? imageAnalysisResults : undefined,
      unsupportedFiles: unsupportedFiles.length > 0 ? unsupportedFiles : undefined
    });
  }));`;

// Note: lines 604-724 is 121 lines.
// We replace them.
const newContent1 = replaceRange(604, 724, replacementMultimodal);

// Now we need to handle /stats. 
// Since we modified the file, line numbers shifted.
// We need to find /stats again in newContent1.
const lines2 = newContent1.split('\n');
let statsStartLine = -1;
for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].includes('router.get("/stats"')) {
        statsStartLine = i + 1; // 1-based
        break;
    }
}

if (statsStartLine === -1) {
    console.error('Could not find /stats route');
    fs.writeFileSync(path, newContent1); // Save partial progress?
    process.exit(1);
}

console.log('Found /stats at line', statsStartLine);

// Find end of stats route. It ends with "  });" properly indented?
// Actually we can scan for the next JSDoc or Router call?
// "  router.get("/hub-insights", ..." is next.

let statsEndLine = -1;
for (let i = statsStartLine; i < lines2.length; i++) {
    if (lines2[i].includes('router.get("/hub-insights"')) {
        statsEndLine = i - 1; // The line before the next route (approx)
        // Backtrack to find "  });"
        while (!lines2[statsEndLine].trim().startsWith('});') && statsEndLine > statsStartLine) {
            statsEndLine--;
        }
        statsEndLine++; // 1-based
        break;
    }
}
// If not found (maybe hub-insights is JSDoc), look for JSDoc "/**"
if (statsEndLine === -1) {
    // Fallback: search for closing brace that aligns?
    // Let's assume the previous logic: ~112 lines.
    // Or just look for the JSDoc of hub-insights
    for (let i = statsStartLine; i < lines2.length; i++) {
        if (lines2[i].includes('* /api/ai/hub-insights:')) {
             // scan back for "});"
             let j = i;
             while(j > statsStartLine) {
                 if (lines2[j].trim() === '});') {
                     statsEndLine = j + 1;
                     break;
                 }
                 j--;
             }
             break;
        }
    }
}

if (statsEndLine === -1) {
    console.log("Could not find end of stats route, skipping stats refactor");
    fs.writeFileSync(path, newContent1);
    process.exit(0);
}

const replacementStats = `  router.get("/stats", isAuthenticated, asyncHandler(async (req, res) => {
    const { organizationId, timeRange = '30d' } = req.query;

    // Calculate time filter
    const now = new Date();
    const startDate = new Date();
    if (timeRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    } else if (timeRange === '90d') {
      startDate.setDate(now.getDate() - 90);
    } else if (timeRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Get guardrail statistics
    const guardrailsQuery = organizationId
      ? db.select({
          action: aiGuardrailsLogs.action,
          severity: aiGuardrailsLogs.severity,
          count: count()
        })
        .from(aiGuardrailsLogs)
        .where(eq(aiGuardrailsLogs.organizationId, organizationId as string))
        .groupBy(aiGuardrailsLogs.action, aiGuardrailsLogs.severity)
      : db.select({
          action: aiGuardrailsLogs.action,
          severity: aiGuardrailsLogs.severity,
          count: count()
        })
        .from(aiGuardrailsLogs)
        .groupBy(aiGuardrailsLogs.action, aiGuardrailsLogs.severity);

    const guardrailStats = await guardrailsQuery;

    // Get usage disclosure statistics
    const usageQuery = organizationId
      ? db.select({
          actionType: aiUsageDisclosures.actionType,
          modelProvider: aiUsageDisclosures.modelProvider,
          count: count()
        })
        .from(aiUsageDisclosures)
        .where(eq(aiUsageDisclosures.organizationId, organizationId as string))
        .groupBy(aiUsageDisclosures.actionType, aiUsageDisclosures.modelProvider)
      : db.select({
          actionType: aiUsageDisclosures.actionType,
          modelProvider: aiUsageDisclosures.modelProvider,
          count: count()
        })
        .from(aiUsageDisclosures)
        .groupBy(aiUsageDisclosures.actionType, aiUsageDisclosures.modelProvider);

    const usageStats = await usageQuery;

    // Get AI-generated documents count
    const [aiDocsResult] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.aiGenerated, true));

    // Calculate summary statistics
    const totalGuardrailActions = guardrailStats.reduce((sum, stat) => sum + stat.count, 0);
    const blockedActions = guardrailStats
      .filter(stat => stat.action === 'blocked')
      .reduce((sum, stat) => sum + stat.count, 0);
    const redactedActions = guardrailStats
      .filter(stat => stat.action === 'redacted')
      .reduce((sum, stat) => sum + stat.count, 0);
    const totalUsageActions = usageStats.reduce((sum, stat) => sum + stat.count, 0);

    res.json({
      success: true,
      timeRange,
      statistics: {
        guardrails: {
          total: totalGuardrailActions,
          blocked: blockedActions,
          redacted: redactedActions,
          byAction: guardrailStats.reduce((acc, stat) => {
            acc[stat.action] = (acc[stat.action] || 0) + stat.count;
            return acc;
          }, {}),
          bySeverity: guardrailStats.reduce((acc, stat) => {
            acc[stat.severity] = (acc[stat.severity] || 0) + stat.count;
            return acc;
          }, {})
        },
        usage: {
          total: totalUsageActions,
          byActionType: usageStats.reduce((acc, stat) => {
            acc[stat.actionType] = (acc[stat.actionType] || 0) + stat.count;
            return acc;
          }, {}),
          byModelProvider: usageStats.reduce((acc, stat) => {
            acc[stat.modelProvider] = (acc[stat.modelProvider] || 0) + stat.count;
            return acc;
          }, {})
        },
        documents: {
          aiGenerated: aiDocsResult.count
        }
      }
    });
  }));`;

const finalContent = [...lines2.slice(0, statsStartLine-1), replacementStats, ...lines2.slice(statsEndLine)].join('\n');

fs.writeFileSync(path, finalContent);
console.log('Successfully updated ai.ts');
