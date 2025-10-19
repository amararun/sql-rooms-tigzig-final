/**
 * API Configuration for SQLRooms
 *
 * Local development: Direct API calls to external services
 * Production: Uses serverless proxy functions
 */

export const API_ENDPOINTS = {
  // OpenAI - direct API calls (will be configured in AI store)
  openaiProxy: '/api/tools/openai-proxy', // Not used in local mode
} as const;
