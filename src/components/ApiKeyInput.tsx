import React, { useState } from 'react';
import { Input, Button } from '@sqlrooms/ui';
import { Eye, EyeOff, ExternalLink, Check, AlertCircle } from 'lucide-react';
import {
  ProviderType,
  validateApiKey,
  getProviderDisplayName,
  providerRequiresApiKey,
  getProviderHelpUrl
} from '../utils/apiKeyValidation';

interface ApiKeyInputProps {
  provider: ProviderType;
  value: string;
  onChange: (provider: ProviderType, value: string) => void;
  className?: string;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  provider,
  value,
  onChange,
  className = '',
}) => {
  const [showKey, setShowKey] = useState(false);

  const validation = validateApiKey(provider, value);
  const displayName = getProviderDisplayName(provider);
  const isRequired = providerRequiresApiKey(provider);
  const helpUrl = getProviderHelpUrl(provider);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(provider, e.target.value);
  };

  const toggleShowKey = () => {
    setShowKey(!showKey);
  };

  const openHelpUrl = () => {
    window.open(helpUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Provider Label with Help Link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            {displayName}
          </label>
          {isRequired && (
            <span className="text-xs text-red-500">*</span>
          )}
          {!isRequired && (
            <span className="text-xs text-gray-400">(optional)</span>
          )}
        </div>

        {isRequired && (
          <Button
            variant="ghost"
            size="sm"
            onClick={openHelpUrl}
            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Get API Key
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Input Field with Validation */}
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          placeholder={
            isRequired
              ? `Enter your ${displayName} API key`
              : `${displayName} API key (optional)`
          }
          className={`pr-20 ${
            value && !validation.isValid
              ? 'border-red-300 focus:border-red-500'
              : value && validation.isValid
                ? 'border-green-300 focus:border-green-500'
                : ''
          }`}
        />

        {/* Show/Hide Toggle + Status Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {value && (
            <>
              {validation.isValid ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </>
          )}

          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleShowKey}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              {showKey ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {value && !validation.isValid && validation.errorMessage && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {validation.errorMessage}
        </p>
      )}

      {/* Success Message */}
      {value && validation.isValid && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Valid {displayName} API key
        </p>
      )}
    </div>
  );
};