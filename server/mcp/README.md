# Model Context Protocol (MCP) System

Comprehensive AI agent system with tool calling capabilities for the CyberDocGen compliance platform.

## Overview

The MCP system provides a robust framework for:
- **AI Agent Management**: Multiple specialized AI agents for different compliance tasks
- **Tool Calling**: Internal and external tools that agents can use
- **Intelligent Orchestration**: Automatic tool selection and multi-step reasoning
- **External Communication**: Integration with web APIs, regulatory sources, and external services

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Server (HTTP/REST)               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────┐        ┌──────────────────┐      │
│  │  Agent Client    │────────│  Tool Registry   │      │
│  │  - OpenAI        │        │  - Internal      │      │
│  │  - Anthropic     │        │  - External      │      │
│  │  - Gemini        │        │  - Hybrid        │      │
│  └──────────────────┘        └──────────────────┘      │
└─────────────────────────────────────────────────────────┘
           │                            │
           │                            │
    ┌──────▼──────┐           ┌────────▼──────────┐
    │   Internal  │           │     External      │
    │   Services  │           │   APIs/Services   │
    │  - Storage  │           │  - Web Search     │
    │  - AI Svcs  │           │  - Regulatory     │
    │  - Analysis │           │  - Email          │
    └─────────────┘           └───────────────────┘
```

## Components

### 1. Agent Client (`agentClient.ts`)

Manages AI agents with multi-model support and tool calling capabilities.

**Features:**
- Multiple AI model support (GPT-4o, Claude Sonnet 4, Gemini)
- Automatic tool calling and execution
- Conversation history management
- Iterative reasoning with max iterations control
- Error handling and fallback strategies

### 2. Tool Registry (`toolRegistry.ts`)

Central registry for all available tools with execution management.

**Features:**
- Tool registration and discovery
- Rate limiting per tool
- Parameter validation
- Authentication checks
- Execution tracking and audit logging

### 3. Internal Tools (`tools/internal.ts`)

Tools that interact with internal services:

| Tool Name | Description | Rate Limit |
|-----------|-------------|------------|
| `get_company_profile` | Retrieve company profile data | No limit |
| `get_documents` | Retrieve compliance documents | No limit |
| `analyze_document_quality` | Analyze document quality | 20/hour |
| `perform_risk_assessment` | Conduct risk assessment | 10/hour |
| `generate_document` | Generate compliance documents | 10/hour |
| `perform_gap_analysis` | Analyze compliance gaps | 5/hour |
| `search_documents` | Semantic document search | No limit |

### 4. External Tools (`tools/external.ts`)

Tools that interact with external services:

| Tool Name | Description | Rate Limit |
|-----------|-------------|------------|
| `web_search` | Search the web for compliance info | 30/hour |
| `fetch_url` | Fetch content from URLs | 50/hour |
| `get_regulatory_updates` | Get regulatory news | 20/hour |
| `send_email` | Send email notifications | 100/hour |
| `check_api_health` | Check external API health | No limit |

### 5. Predefined Agents

#### Compliance Assistant
- **Model**: GPT-4o
- **Purpose**: General compliance guidance and analysis
- **Tools**: 7 tools including gap analysis, document search, web search
- **Best for**: Compliance questions, gap analysis, quality assessment

#### Document Generator
- **Model**: Claude Sonnet 4
- **Purpose**: Generate high-quality compliance documents
- **Tools**: 5 tools including document generation, quality analysis
- **Best for**: Creating policies, procedures, and compliance documentation

#### Risk Assessment Specialist
- **Model**: GPT-4o
- **Purpose**: Organizational risk assessment and threat analysis
- **Tools**: 6 tools including risk assessment, threat intelligence
- **Best for**: Risk analysis, threat modeling, control assessment

#### Data Extraction Agent
- **Model**: Claude Sonnet 4
- **Purpose**: Extract structured data from documents
- **Tools**: 4 tools including document search, URL fetching
- **Best for**: Data parsing, information extraction, content analysis

#### Compliance Chatbot
- **Model**: GPT-4o
- **Purpose**: Interactive chat for compliance questions
- **Tools**: 6 tools including search, documentation, updates
- **Best for**: Quick answers, guidance, regulatory updates

## API Endpoints

### Base URL: `/api/mcp`

All endpoints require authentication except where noted.

### Tools

#### List All Tools
```http
GET /api/mcp/tools
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "tools": [
    {
      "name": "get_company_profile",
      "description": "Retrieve a company profile...",
      "type": "internal",
      "parameters": [...],
      "requiresAuth": true
    }
  ]
}
```

#### Get Tool Documentation
```http
GET /api/mcp/tools/:name
```

#### Execute Tool
```http
POST /api/mcp/tools/:name/execute
Content-Type: application/json

{
  "parameters": {
    "profileId": "company-123"
  },
  "context": {
    "sessionId": "session-456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "data": { "name": "...", "industry": "..." }
  }
}
```

#### Batch Tool Execution
```http
POST /api/mcp/tools/batch
Content-Type: application/json

{
  "executions": [
    {
      "toolName": "get_company_profile",
      "parameters": { "profileId": "123" }
    },
    {
      "toolName": "get_documents",
      "parameters": { "framework": "ISO27001" }
    }
  ]
}
```

### Agents

#### List All Agents
```http
GET /api/mcp/agents
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "agents": [
    {
      "id": "compliance-assistant",
      "name": "Compliance Assistant",
      "description": "Expert assistant for...",
      "model": "gpt-4.1",
      "capabilities": ["compliance_analysis", "gap_analysis"],
      "availableTools": ["get_company_profile", ...]
    }
  ]
}
```

#### Get Agent Details
```http
GET /api/mcp/agents/:id
```

#### Execute Agent Request
```http
POST /api/mcp/agents/:id/execute
Content-Type: application/json

{
  "prompt": "Analyze our compliance posture for ISO 27001",
  "context": {
    "companyProfileId": "company-123"
  },
  "maxIterations": 5
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "content": "Based on my analysis...",
    "toolCalls": [
      {
        "id": "call-1",
        "toolName": "get_company_profile",
        "parameters": { "profileId": "company-123" },
        "timestamp": "2025-01-15T10:30:00Z"
      },
      {
        "id": "call-2",
        "toolName": "perform_gap_analysis",
        "parameters": { "framework": "ISO27001", ... },
        "timestamp": "2025-01-15T10:30:05Z"
      }
    ],
    "metadata": {
      "model": "gpt-4.1",
      "iterations": 2,
      "tokensUsed": 1250
    }
  }
}
```

#### Clear Agent Conversation
```http
POST /api/mcp/agents/:id/clear
```

### Health

#### System Health Check
```http
GET /api/mcp/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "services": {
    "toolRegistry": {
      "status": "operational",
      "toolsRegistered": 12
    },
    "agentClient": {
      "status": "operational",
      "agentsRegistered": 5
    }
  }
}
```

## Usage Examples

### Example 1: Generate a Compliance Document

```javascript
// Execute the document generator agent
const response = await fetch('/api/mcp/agents/document-generator/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    prompt: 'Generate an Information Security Policy for ISO 27001',
    context: {
      companyProfileId: 'company-123'
    },
    maxIterations: 5
  })
});

const result = await response.json();
console.log(result.response.content); // Generated policy
console.log(result.response.toolCalls); // Tools used
```

### Example 2: Perform Risk Assessment

```javascript
// Use the risk assessment agent
const response = await fetch('/api/mcp/agents/risk-assessment/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    prompt: 'Conduct a comprehensive risk assessment for our healthcare organization focusing on HIPAA compliance',
    context: {
      companyProfileId: 'company-456',
      frameworks: ['HIPAA']
    }
  })
});

const result = await response.json();
// Agent will use perform_risk_assessment tool automatically
```

### Example 3: Direct Tool Execution

```javascript
// Execute a tool directly without an agent
const response = await fetch('/api/mcp/tools/analyze_document_quality/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    parameters: {
      content: 'This is our security policy...',
      title: 'Information Security Policy',
      framework: 'ISO27001',
      documentType: 'policy'
    }
  })
});

const result = await response.json();
console.log(result.result.data.overallScore); // Quality score
```

### Example 4: Chat Interaction

```javascript
// Interactive compliance chat
const response = await fetch('/api/mcp/agents/compliance-chat/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    prompt: 'What are the key requirements for implementing MFA in SOC 2?'
  })
});

const result = await response.json();
// Chat agent will search documents and provide answer
```

## Security Considerations

1. **Authentication**: All endpoints require authentication (except health checks)
2. **Rate Limiting**: Tools have individual rate limits to prevent abuse
3. **Input Validation**: All tool parameters are validated before execution
4. **Audit Logging**: All tool and agent executions are logged for compliance
5. **Error Sanitization**: Errors are sanitized to prevent information leakage
6. **External URL Validation**: URL fetching blocks private/local addresses

## Rate Limits

Rate limits are enforced per user per tool:

- **High-intensity tools** (AI generation, analysis): 5-20 calls/hour
- **Medium-intensity tools** (search, fetch): 30-50 calls/hour
- **Low-intensity tools** (retrieval): No limit

When rate limit is exceeded, the API returns:
```json
{
  "success": false,
  "error": "Rate limit exceeded for this tool"
}
```

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE" // Optional
}
```

Common error codes:
- `TOOL_NOT_FOUND`: Requested tool doesn't exist
- `AGENT_NOT_FOUND`: Requested agent doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `AUTHENTICATION_REQUIRED`: Missing authentication
- `VALIDATION_ERROR`: Invalid parameters

## Extending the System

### Adding a New Tool

```typescript
import { Tool, ToolType } from '../types';

export const myCustomTool: Tool = {
  name: 'my_custom_tool',
  description: 'Description of what this tool does',
  type: ToolType.INTERNAL,
  requiresAuth: true,
  rateLimit: {
    maxCalls: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  },
  parameters: [
    {
      name: 'param1',
      type: 'string',
      description: 'First parameter',
      required: true
    }
  ],
  returns: {
    type: 'object',
    description: 'Return value description'
  },
  handler: async (params, context) => {
    // Implementation
    return {
      success: true,
      data: { result: 'value' }
    };
  }
};

// Register in initialize.ts
toolRegistry.registerTool(myCustomTool);
```

### Adding a New Agent

```typescript
import { AgentConfig, AgentCapability } from '../types';

const myAgent: AgentConfig = {
  id: 'my-agent',
  name: 'My Custom Agent',
  description: 'Agent description',
  model: 'gpt-4.1',
  tools: ['tool1', 'tool2'],
  systemPrompt: 'You are an expert in...',
  temperature: 0.7,
  maxTokens: 2000,
  capabilities: [AgentCapability.CUSTOM]
};

agentClient.registerAgent(myAgent);
```

## Performance Monitoring

The MCP system logs all operations for monitoring:

```typescript
{
  "toolName": "generate_document",
  "userId": "user-123",
  "success": true,
  "duration": 3450, // ms
  "tokensUsed": 1200
}
```

Monitor these metrics:
- Tool execution times
- Token usage per agent
- Rate limit hits
- Error rates
- Most used tools/agents

## Best Practices

1. **Choose the Right Agent**: Use specialized agents for specific tasks
2. **Provide Context**: Include relevant context in agent requests
3. **Set Reasonable Iterations**: Most tasks complete in 2-3 iterations
4. **Handle Errors Gracefully**: Check `success` field in responses
5. **Monitor Usage**: Track token usage and rate limits
6. **Clear Conversations**: Clear agent history when switching contexts
7. **Batch Operations**: Use batch endpoints when executing multiple tools

## Support

For issues or questions:
- Check agent and tool documentation first
- Review error messages and logs
- Test tools individually before using in agents
- Monitor rate limits and usage patterns
