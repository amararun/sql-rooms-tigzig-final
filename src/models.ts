import { isRunningAsLocalFile } from './utils/environment';

// Default model changed to gemini-flash-latest (works in all environments)
// Previously: gpt-4o-mini (requires OpenAI proxy, not available in local files)
export const DEFAULT_MODEL = 'gemini-flash-latest';

// Constants for commonly used values
export const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434/api';
export const CUSTOM_MODEL_NAME = 'custom';

// Model display names mapping
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
  'claude-haiku-4-5-20251001': 'Claude Sonnet 4.5 Haiku',
};

// Default base URLs for each provider
export const PROVIDER_DEFAULT_BASE_URLS = {
  // OpenAI routed through Vercel serverless proxy to avoid CORS issues
  openai: '/api/openai-proxy',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  deepseek: 'https://api.deepseek.com/v1',
  ollama: OLLAMA_DEFAULT_BASE_URL,
} as const;

// Log the configured baseURL for debugging
console.log('🔧 [MODELS CONFIG] PROVIDER_DEFAULT_BASE_URLS:', PROVIDER_DEFAULT_BASE_URLS);

// All models - available on server environments
const ALL_LLM_MODELS = [
  {
    name: 'openai',
    models: [
      'gpt-4.1-mini',
      'gpt-4.1',
      'gpt-5-nano',
      'gpt-5-mini',
      'gpt-5.1',
    ],
  },
  {
    name: 'google',
    models: [
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-2.5-pro',
      'gemini-3-pro',
    ],
  },
  {
    name: 'anthropic',
    models: [
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
    ],
  },
];

// Models for local file environment - only Google (direct API, no proxy needed)
const LOCAL_FILE_LLM_MODELS = [
  {
    name: 'google',
    models: [
      'gemini-flash-lite-latest',
      'gemini-flash-latest',
      'gemini-2.5-pro',
      'gemini-3-pro',
    ],
  },
];

// Active models - dynamically filtered based on environment
// When running as local file (file://): Show only Google models
// When running on server (http/https): Show all models
export const LLM_MODELS = (() => {
  const isLocalFile = isRunningAsLocalFile();
  console.log('🌍 [MODELS] Running as local file:', isLocalFile);

  if (isLocalFile) {
    console.log('📋 [MODELS] Using LOCAL_FILE_LLM_MODELS (Google only)');
    return LOCAL_FILE_LLM_MODELS;
  }

  console.log('📋 [MODELS] Using ALL_LLM_MODELS (OpenAI, Google, Anthropic)');
  return ALL_LLM_MODELS;
})();

// Dormant models - kept for future use but not shown in UI
export const DORMANT_LLM_MODELS = [
  {
    name: 'openai',
    models: [
      'gpt-4.1-mini',
      'gpt-4.1',
      'gpt-4o',
      'gpt-4',
      'gpt-5',
    ],
  },
  {
    name: 'google',
    models: [
      'gemini-2.0-pro-exp-02-05',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
  },
  {
    name: 'deepseek',
    models: ['deepseek-chat'],
  },
  {
    name: 'ollama',
    models: ['qwen3:32b', 'qwen3', CUSTOM_MODEL_NAME],
  },
];
