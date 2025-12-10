# MCP Integration Guide

Complete guide for integrating existing services with the Model Context Protocol system.

## Overview

The MCP system provides a comprehensive integration layer that allows:
1. Existing services to work seamlessly with MCP agents and tools
2. Legacy API endpoints to utilize MCP capabilities
3. Gradual migration from direct service calls to MCP-based architecture

## Tool Inventory

### Total Tools: 23 tools across 3 categories

#### Internal Tools (7)
Direct integration with internal storage and services:

1. **get_company_profile** - Retrieve company profile data
2. **get_documents** - Query compliance documents
3. **analyze_document_quality** - AI-powered quality scoring
4. **perform_risk_assessment** - Organizational risk analysis
5. **generate_document** - AI document generation
6. **perform_gap_analysis** - Compliance gap analysis
7. **search_documents** - Semantic document search

#### External Tools (5)
Integration with external APIs and services:

1. **web_search** - Search web for compliance information
2. **fetch_url** - Extract content from URLs
3. **get_regulatory_updates** - Latest regulatory news
4. **send_email** - Email notifications
5. **check_api_health** - External API health monitoring

#### Advanced Tools (9)
Sophisticated tools leveraging existing services:

1. **get_document_templates** - Available compliance templates
2. **get_framework_info** - Detailed framework information
3. **batch_generate_documents** - Bulk document generation
4. **get_version_history** - Document version control
5. **compare_versions** - Compare document versions
6. **generate_audit_report** - Compliance audit reports
7. **get_compliance_suggestions** - Intelligent suggestions
8. **calculate_compliance_score** - Overall compliance scoring
9. **ai_health_check** - AI service health status

## Integration Patterns

### Pattern 1: Direct Tool Execution

Execute tools directly from your code:

```typescript
import { toolRegistry } from './mcp';

// Execute a tool
const result = await toolRegistry.executeTool(
  'get_company_profile',
  { profileId: 'company-123' },
  {
    userId: 'user-456',
    sessionId: 'session-789'
  }
);

if (result.success) {
  const profile = result.data;
  // Use profile data
}
```

### Pattern 2: Agent-Based Execution

Let AI agents handle complex tasks with multiple tools:

```typescript
import { agentClient } from './mcp';

// Execute an agent
const response = await agentClient.execute(
  {
    agentId: 'compliance-assistant',
    prompt: 'Analyze our compliance posture for ISO 27001',
    context: {
      companyProfileId: 'company-123'
    }
  },
  {
    userId: 'user-456',
    sessionId: 'session-789'
  }
);

console.log(response.content); // AI-generated analysis
console.log(response.toolCalls); // Tools used by agent
```

### Pattern 3: Legacy API Adapter

Use MCP from existing API endpoints:

```typescript
import { MCPLegacyAdapter } from './mcp/integration';

// In your existing route handler
app.post('/api/legacy/analyze', async (req, res) => {
  const result = await MCPLegacyAdapter.executeTool(
    'analyze_document_quality',
    {
      content: req.body.content,
      title: req.body.title,
      framework: req.body.framework,
      documentType: req.body.documentType
    },
    req.user.id,
    req.sessionID
  );

  res.json(result);
});
```

### Pattern 4: Service Wrapper

Wrap existing services with MCP integration:

```typescript
import { createMCPChatbotWrapper } from './mcp/integration';

// Create MCP-enabled chatbot
const mcpChatbot = createMCPChatbotWrapper();

// Use like existing chatbot
const response = await mcpChatbot.processMessage(
  'What are ISO 27001 requirements?',
  userId,
  sessionId,
  'iso27001'
);
```

## Agent Capabilities

### 1. Compliance Assistant
**Model:** GPT-4o
**Tools:** 10 tools
**Best for:**
- Answering compliance questions
- Gap analysis
- Quality assessment
- Framework guidance

**Example:**
```javascript
const response = await agentClient.execute({
  agentId: 'compliance-assistant',
  prompt: 'What controls are missing from our SOC 2 implementation?',
  context: { companyProfileId: 'company-123' }
}, context);
```

### 2. Document Generator
**Model:** Claude Sonnet 4
**Tools:** 9 tools
**Best for:**
- Creating policies and procedures
- Bulk document generation
- Quality validation
- Template-based generation

**Example:**
```javascript
const response = await agentClient.execute({
  agentId: 'document-generator',
  prompt: 'Generate all required ISO 27001 policies for our SaaS company',
  context: {
    companyProfileId: 'company-123',
    framework: 'ISO27001'
  }
}, context);
```

### 3. Risk Assessment Specialist
**Model:** GPT-4o
**Tools:** 9 tools
**Best for:**
- Risk assessments
- Threat analysis
- Audit reports
- Compliance scoring

**Example:**
```javascript
const response = await agentClient.execute({
  agentId: 'risk-assessment',
  prompt: 'Conduct a risk assessment focusing on cloud security controls',
  context: { companyProfileId: 'company-123' }
}, context);
```

### 4. Data Extraction Agent
**Model:** Claude Sonnet 4
**Tools:** 4 tools
**Best for:**
- Extracting data from documents
- Parsing regulatory content
- Content analysis

**Example:**
```javascript
const response = await agentClient.execute({
  agentId: 'data-extractor',
  prompt: 'Extract all security controls from this document',
  context: { documentContent: '...' }
}, context);
```

### 5. Compliance Chatbot
**Model:** GPT-4o
**Tools:** 10 tools
**Best for:**
- Quick answers
- User support
- Framework information
- Suggestions

**Example:**
```javascript
const response = await agentClient.execute({
  agentId: 'compliance-chat',
  prompt: 'How do I implement MFA for SOC 2?'
}, context);
```

## Migration Strategy

### Phase 1: Parallel Running
Run MCP alongside existing services:

```typescript
// Old way
const oldResult = await complianceChatbot.processMessage(message, userId);

// New way (parallel)
const newResult = await agentClient.execute({
  agentId: 'compliance-chat',
  prompt: message
}, { userId });

// Compare results for validation
```

### Phase 2: Feature-by-Feature Migration
Migrate one feature at a time:

```typescript
// Migrate document generation
app.post('/api/documents/generate', async (req, res) => {
  // Old implementation commented out
  // const result = await aiOrchestrator.generateDocument(...);

  // New MCP-based implementation
  const response = await agentClient.execute({
    agentId: 'document-generator',
    prompt: `Generate ${req.body.documentType} for ${req.body.framework}`,
    context: req.body
  }, {
    userId: req.user.id
  });

  res.json(response);
});
```

### Phase 3: Full Migration
Replace all service calls with MCP:

```typescript
// All AI operations now go through MCP
import { agentClient, toolRegistry } from './mcp';

// Removed: import { complianceChatbot } from './services/chatbot';
// Removed: import { aiOrchestrator } from './services/aiOrchestrator';
```

## Advanced Tool Usage

### Tool Chaining Example

```typescript
// Agent automatically chains tools
const response = await agentClient.execute({
  agentId: 'compliance-assistant',
  prompt: 'Generate a complete compliance package for ISO 27001',
  maxIterations: 10 // Allow more tool calls
}, context);

// Agent will:
// 1. get_company_profile
// 2. get_framework_info
// 3. get_document_templates
// 4. batch_generate_documents
// 5. analyze_document_quality (for each)
// 6. calculate_compliance_score
// 7. generate_audit_report
```

### Batch Operations Example

```typescript
// Execute multiple tools in parallel
const results = await fetch('/api/mcp/tools/batch', {
  method: 'POST',
  body: JSON.stringify({
    executions: [
      {
        toolName: 'get_company_profile',
        parameters: { profileId: 'company-123' }
      },
      {
        toolName: 'get_documents',
        parameters: { framework: 'ISO27001' }
      },
      {
        toolName: 'calculate_compliance_score',
        parameters: {
          framework: 'ISO27001',
          companyProfileId: 'company-123'
        }
      }
    ]
  })
});
```

### Custom Tool Creation

Add your own tools to the system:

```typescript
import { Tool, ToolType } from './mcp/types';
import { toolRegistry } from './mcp';

const myCustomTool: Tool = {
  name: 'my_custom_analysis',
  description: 'Custom analysis for specific use case',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  parameters: [
    {
      name: 'inputData',
      type: 'string',
      description: 'Data to analyze',
      required: true
    }
  ],
  returns: {
    type: 'object',
    description: 'Analysis results'
  },
  handler: async (params, context) => {
    // Your custom logic here
    const result = await performCustomAnalysis(params.inputData);

    return {
      success: true,
      data: result
    };
  }
};

// Register the tool
toolRegistry.registerTool(myCustomTool);

// Now agents can use it automatically
```

### Custom Agent Creation

Create specialized agents:

```typescript
import { AgentConfig, AgentCapability } from './mcp/types';
import { agentClient } from './mcp';

const customAgent: AgentConfig = {
  id: 'my-custom-agent',
  name: 'Custom Compliance Agent',
  description: 'Specialized agent for industry-specific compliance',
  model: 'gpt-4.1',
  tools: [
    'get_company_profile',
    'get_documents',
    'my_custom_analysis', // Your custom tool
    'web_search'
  ],
  systemPrompt: `You are a specialized compliance agent for [industry].

Your expertise includes:
- Industry-specific regulations
- Custom compliance frameworks
- Specialized risk analysis

Always provide detailed, industry-specific guidance.`,
  temperature: 0.7,
  maxTokens: 2000,
  capabilities: [
    AgentCapability.COMPLIANCE_ANALYSIS,
    AgentCapability.RISK_ASSESSMENT
  ]
};

agentClient.registerAgent(customAgent);
```

## Error Handling

### Tool Execution Errors

```typescript
const result = await toolRegistry.executeTool(toolName, params, context);

if (!result.success) {
  console.error('Tool execution failed:', result.error);

  // Handle specific errors
  if (result.error.includes('Rate limit exceeded')) {
    // Wait and retry
  } else if (result.error.includes('Authentication required')) {
    // Redirect to login
  } else {
    // General error handling
  }
}
```

### Agent Execution Errors

```typescript
try {
  const response = await agentClient.execute(request, context);

  // Check if max iterations reached
  if (response.metadata?.maxIterationsReached) {
    console.warn('Agent reached maximum iterations');
    // Task may be incomplete
  }

} catch (error) {
  console.error('Agent execution failed:', error);

  // Fallback to direct service call
  const fallbackResult = await directServiceCall();
}
```

## Performance Optimization

### 1. Use Appropriate Agents

```typescript
// Good: Use specialized agent
agentClient.execute({
  agentId: 'document-generator', // Optimized for docs
  prompt: 'Generate policy'
});

// Bad: Use general agent for specialized task
agentClient.execute({
  agentId: 'compliance-chat', // Not optimized for generation
  prompt: 'Generate policy'
});
```

### 2. Limit Tool Access

```typescript
// Faster: Limit tools agent can use
agentClient.execute({
  agentId: 'compliance-assistant',
  prompt: 'Quick question about SOC 2',
  tools: ['get_framework_info', 'web_search'] // Only these
});
```

### 3. Set Iteration Limits

```typescript
// Faster: Limit iterations for simple tasks
agentClient.execute({
  agentId: 'compliance-chat',
  prompt: 'What is ISO 27001?',
  maxIterations: 2 // Prevent excessive tool calls
});
```

### 4. Batch When Possible

```typescript
// Better: Single batch request
await fetch('/api/mcp/tools/batch', {
  method: 'POST',
  body: JSON.stringify({ executions: [...] })
});

// Worse: Multiple individual requests
for (const tool of tools) {
  await fetch(`/api/mcp/tools/${tool}/execute`, ...);
}
```

## Monitoring and Debugging

### View Agent Tool Usage

```typescript
const response = await agentClient.execute(request, context);

// Inspect tool calls made by agent
response.toolCalls.forEach(toolCall => {
  console.log(`Tool: ${toolCall.toolName}`);
  console.log(`Parameters:`, toolCall.parameters);
  console.log(`Timestamp:`, toolCall.timestamp);
});

// Check token usage
console.log('Tokens used:', response.metadata?.tokensUsed);
```

### Health Monitoring

```typescript
// Check system health
const health = await fetch('/api/mcp/health').then(r => r.json());

console.log('Tools registered:', health.services.toolRegistry.toolsRegistered);
console.log('Agents registered:', health.services.agentClient.agentsRegistered);
```

### Tool Usage Analytics

```typescript
// Track which tools are used most
const tools = await fetch('/api/mcp/tools').then(r => r.json());

// Get documentation for popular tools
tools.tools.forEach(tool => {
  console.log(`${tool.name}: ${tool.description}`);
  if (tool.rateLimit) {
    console.log(`  Rate limit: ${tool.rateLimit.maxCalls} calls per ${tool.rateLimit.windowMs}ms`);
  }
});
```

## Best Practices

1. **Choose the Right Agent**: Use specialized agents for specific tasks
2. **Provide Context**: Include relevant context in requests for better results
3. **Handle Errors Gracefully**: Always check `success` field in responses
4. **Monitor Token Usage**: Track costs with `metadata.tokensUsed`
5. **Set Reasonable Limits**: Most tasks complete in 2-3 iterations
6. **Use Batch Operations**: Execute multiple tools efficiently
7. **Clear Conversations**: Clear agent history when switching contexts
8. **Rate Limit Awareness**: Monitor and respect rate limits
9. **Security First**: Always authenticate and audit tool usage
10. **Test Incrementally**: Migrate features one at a time

## Troubleshooting

### Issue: Tool Not Found
```typescript
// Solution: Check tool is registered
const tools = toolRegistry.listToolNames();
console.log('Available tools:', tools);
```

### Issue: Agent Not Responding
```typescript
// Solution: Check agent exists and model is available
const agent = agentClient.getAgent('agent-id');
const health = await aiOrchestrator.healthCheck();
```

### Issue: Rate Limit Exceeded
```typescript
// Solution: Implement retry with backoff
async function executeWithRetry(toolName, params, context, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await toolRegistry.executeTool(toolName, params, context);
    if (result.success || !result.error.includes('Rate limit')) {
      return result;
    }
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
  }
}
```

## Support

For additional help:
- Review `server/mcp/README.md` for API documentation
- Check `server/mcp/types.ts` for type definitions
- Examine `server/mcp/tools/` for tool implementations
- See `server/mcp/initialize.ts` for agent configurations
