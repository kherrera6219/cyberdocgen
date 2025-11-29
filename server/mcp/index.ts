/**
 * MCP (Model Context Protocol) Module
 * Main exports for the MCP system
 */

export * from './types';
export { toolRegistry } from './toolRegistry';
export { agentClient } from './agentClient';
export { initializeMCP, getRecommendedAgent } from './initialize';
export { default as mcpRouter } from './server';

// Tool exports
export { internalTools } from './tools/internal';
export { externalTools } from './tools/external';
