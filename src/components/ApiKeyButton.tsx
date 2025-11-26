import React, { useMemo } from 'react';
import { Button } from '@sqlrooms/ui';
import { KeyIcon, Check, AlertCircle } from 'lucide-react';
import {
  ProviderType,
  validateApiKey,
  providerRequiresApiKey,
} from '../utils/apiKeyValidation';

interface ApiKeyButtonProps {
  apiKeys: Record<string, string | undefined>;
  currentProvider?: ProviderType;
  onClick: () => void;
  className?: string;
}

// Available providers that we manage
const MANAGED_PROVIDERS: ProviderType[] = ['openai', 'google', 'anthropic'];

export const ApiKeyButton: React.FC<ApiKeyButtonProps> = ({
  apiKeys,
  currentProvider,
  onClick,
  className = '',
}) => {
  // Calculate the status of API keys
  const keyStatus = useMemo(() => {
    const requiredProviders = MANAGED_PROVIDERS.filter(providerRequiresApiKey);
    const configuredProviders = MANAGED_PROVIDERS.filter(provider => {
      const key = apiKeys[provider];
      return key && key.trim().length > 0 && validateApiKey(provider, key).isValid;
    });

    const configuredRequired = requiredProviders.filter(provider => {
      const key = apiKeys[provider];
      return key && key.trim().length > 0 && validateApiKey(provider, key).isValid;
    });

    const currentProviderConfigured = currentProvider && apiKeys[currentProvider] &&
      validateApiKey(currentProvider, apiKeys[currentProvider]!).isValid;

    return {
      total: MANAGED_PROVIDERS.length,
      configured: configuredProviders.length,
      requiredTotal: requiredProviders.length,
      requiredConfigured: configuredRequired.length,
      currentProviderConfigured,
      hasAnyKeys: configuredProviders.length > 0,
    };
  }, [apiKeys, currentProvider]);

  // Determine button variant and status
  const getButtonState = () => {
    if (!keyStatus.hasAnyKeys) {
      return {
        variant: 'outline' as const,
        icon: AlertCircle,
        iconColor: 'text-red-500',
      };
    }

    if (keyStatus.currentProviderConfigured) {
      return {
        variant: 'outline' as const,
        icon: Check,
        iconColor: 'text-green-500',
      };
    }

    if (keyStatus.requiredConfigured === keyStatus.requiredTotal) {
      return {
        variant: 'outline' as const,
        icon: Check,
        iconColor: 'text-green-500',
      };
    }

    return {
      variant: 'outline' as const,
      icon: AlertCircle,
      iconColor: 'text-orange-500',
    };
  };

  const buttonState = getButtonState();
  const Icon = buttonState.icon;

  const handleClick = () => {
    console.log('🔑 [API KEY BUTTON] Opening API key modal');
    console.log('🔑 [API KEY STATUS]', {
      configured: `${keyStatus.configured}/${keyStatus.total}`,
      required: `${keyStatus.requiredConfigured}/${keyStatus.requiredTotal}`,
      currentProvider: currentProvider || 'none',
      currentProviderConfigured: keyStatus.currentProviderConfigured,
    });
    onClick();
  };

  return (
    <Button
      variant={buttonState.variant}
      size="sm"
      onClick={handleClick}
      className={`relative ${className}`}
    >
      <div className="flex items-center gap-1">
        <KeyIcon className="h-4 w-4" />
        <Icon className={`h-3 w-3 ${buttonState.iconColor}`} />
        <span className="text-xs font-medium">
          API Keys
        </span>
      </div>
    </Button>
  );
};