/**
 * API Key validation utilities
 */

export type ProviderType = 'openai' | 'google' | 'anthropic' | 'deepseek' | 'ollama';

export interface KeyValidationResult {
  isValid: boolean;
  provider: ProviderType;
  errorMessage?: string;
  maskedKey?: string;
}

/**
 * Validate API key format for different providers
 */
export function validateApiKey(provider: ProviderType, apiKey: string): KeyValidationResult {
  if (!apiKey || apiKey.trim() === '') {
    return {
      isValid: false,
      provider,
      errorMessage: 'API key cannot be empty',
    };
  }

  const trimmedKey = apiKey.trim();
  let isValid = false;
  let errorMessage = '';

  switch (provider) {
    case 'openai':
      // OpenAI keys start with 'sk-' and are typically 51+ characters
      isValid = trimmedKey.startsWith('sk-') && trimmedKey.length >= 20;
      errorMessage = isValid ? '' : 'OpenAI API key should start with "sk-" and be at least 20 characters';
      break;

    case 'google':
      // Google API keys are typically 39 characters starting with 'AIza'
      isValid = trimmedKey.startsWith('AIza') && trimmedKey.length >= 20;
      errorMessage = isValid ? '' : 'Google API key should start with "AIza" and be at least 20 characters';
      break;

    case 'anthropic':
      // Anthropic keys start with 'sk-ant-' and are typically longer
      isValid = trimmedKey.startsWith('sk-ant-') && trimmedKey.length >= 20;
      errorMessage = isValid ? '' : 'Anthropic API key should start with "sk-ant-" and be at least 20 characters';
      break;

    case 'deepseek':
      // DeepSeek keys format (adjust as needed)
      isValid = trimmedKey.length >= 16;
      errorMessage = isValid ? '' : 'DeepSeek API key should be at least 16 characters';
      break;

    case 'ollama':
      // Ollama typically doesn't require API keys (local)
      isValid = true;
      break;

    default:
      isValid = trimmedKey.length >= 16;
      errorMessage = isValid ? '' : 'API key should be at least 16 characters';
  }

  return {
    isValid,
    provider,
    errorMessage: isValid ? undefined : errorMessage,
    maskedKey: maskApiKey(trimmedKey),
  };
}

/**
 * Mask API key for safe display/logging
 * Shows first 4 and last 4 characters with dots in between
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length <= 8) {
    return '••••••••';
  }

  const start = apiKey.slice(0, 4);
  const end = apiKey.slice(-4);
  const middle = '•'.repeat(Math.min(12, apiKey.length - 8));

  return `${start}${middle}${end}`;
}

/**
 * Safe logging function that automatically masks API keys
 */
export function logApiKeyOperation(operation: string, provider: ProviderType, apiKey?: string) {
  const maskedKey = apiKey ? maskApiKey(apiKey) : 'undefined';
  console.log(`🔑 [API KEY] ${operation} for ${provider}: ${maskedKey}`);
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: ProviderType): string {
  const displayNames: Record<ProviderType, string> = {
    openai: 'OpenAI',
    google: 'Google Gemini',
    anthropic: 'Anthropic Claude',
    deepseek: 'DeepSeek',
    ollama: 'Ollama (Local)',
  };

  return displayNames[provider] || provider;
}

/**
 * Check if provider requires an API key
 */
export function providerRequiresApiKey(provider: ProviderType): boolean {
  return provider !== 'ollama';
}

/**
 * Get help URL for obtaining API keys
 */
export function getProviderHelpUrl(provider: ProviderType): string {
  const helpUrls: Record<ProviderType, string> = {
    openai: 'https://platform.openai.com/api-keys',
    google: 'https://aistudio.google.com/app/apikey',
    anthropic: 'https://console.anthropic.com/',
    deepseek: 'https://platform.deepseek.com/',
    ollama: 'https://ollama.ai/',
  };

  return helpUrls[provider] || '#';
}

/**
 * Validate that the current provider has a valid API key configured
 * Used before submitting chat queries to provide user-friendly error messages
 */
export function validateProviderApiKey(
  provider: ProviderType | undefined,
  apiKeys: Record<string, string | undefined>
): {
  isValid: boolean;
  errorMessage: string;
} {
  // If no provider selected, cannot proceed
  if (!provider) {
    return {
      isValid: false,
      errorMessage: 'Please select a model to continue',
    };
  }

  // Ollama doesn't require API keys (local)
  if (provider === 'ollama') {
    return {
      isValid: true,
      errorMessage: '',
    };
  }

  // Check if API key exists for this provider
  const apiKey = apiKeys[provider];
  if (!apiKey || apiKey.trim() === '') {
    const providerName = getProviderDisplayName(provider);
    return {
      isValid: false,
      errorMessage: `Please configure your ${providerName} API key to continue`,
    };
  }

  // Validate the API key format
  const validation = validateApiKey(provider, apiKey);
  if (!validation.isValid) {
    const providerName = getProviderDisplayName(provider);
    return {
      isValid: false,
      errorMessage: `Your ${providerName} API key appears to be invalid. Please check your API Keys configuration.`,
    };
  }

  // All checks passed
  return {
    isValid: true,
    errorMessage: '',
  };
}