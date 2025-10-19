import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@sqlrooms/ui';
import { ApiKeyInput } from './ApiKeyInput';
import {
  ProviderType,
  validateApiKey,
  logApiKeyOperation,
  providerRequiresApiKey,
} from '../utils/apiKeyValidation';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKeys: Record<string, string | undefined>;
  onSaveKeys: (keys: Record<string, string>) => void;
}

// Available providers in order of preference
const AVAILABLE_PROVIDERS: ProviderType[] = ['openai', 'google', 'anthropic'];

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentApiKeys,
  onSaveKeys,
}) => {
  const [tempKeys, setTempKeys] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize temporary keys when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔑 [API KEY MODAL] Opening with keys:',
        Object.entries(currentApiKeys).map(([provider, key]) =>
          `${provider}: ${key ? 'present' : 'empty'}`
        ).join(', ')
      );

      const initialKeys: Record<string, string> = {};
      AVAILABLE_PROVIDERS.forEach(provider => {
        initialKeys[provider] = currentApiKeys[provider] || '';
      });
      setTempKeys(initialKeys);
      setHasChanges(false);
    }
  }, [isOpen, currentApiKeys]);

  // Handle key changes
  const handleKeyChange = (provider: ProviderType, value: string) => {
    setTempKeys(prev => ({
      ...prev,
      [provider]: value,
    }));

    // Check if there are changes
    const hasChange = value !== (currentApiKeys[provider] || '');
    if (hasChange) {
      setHasChanges(true);
      logApiKeyOperation('Modified', provider, value);
    }
  };

  // Validate all keys
  const validateAllKeys = () => {
    const validationResults = AVAILABLE_PROVIDERS.map(prov =>
      validateApiKey(prov, tempKeys[prov] || '')
    );

    const requiredProviders = AVAILABLE_PROVIDERS.filter(providerRequiresApiKey);
    const invalidRequired = requiredProviders.filter(provider => {
      const key = tempKeys[provider] || '';
      return key.length > 0 && !validateApiKey(provider, key).isValid;
    });

    return {
      validationResults,
      hasInvalidRequired: invalidRequired.length > 0,
      invalidProviders: invalidRequired,
    };
  };

  // Handle save
  const handleSave = () => {
    const validation = validateAllKeys();

    if (validation.hasInvalidRequired) {
      console.log('⚠️ [API KEY MODAL] Save blocked - invalid keys for:', validation.invalidProviders);
      return;
    }

    // Filter out empty keys and save
    const keysToSave: Record<string, string> = {};
    Object.entries(tempKeys).forEach(([provider, key]) => {
      if (key && key.trim().length > 0) {
        keysToSave[provider] = key.trim();
        logApiKeyOperation('Saved', provider as ProviderType, key);
      }
    });

    console.log('✅ [API KEY MODAL] Saving keys for providers:', Object.keys(keysToSave));
    onSaveKeys(keysToSave);
    setHasChanges(false);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasChanges) {
      console.log('🔄 [API KEY MODAL] Discarding changes');
    }
    console.log('❌ [API KEY MODAL] Cancelled');
    onClose();
  };

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && e.metaKey) {
      // Cmd/Ctrl + Enter to save
      const validation = validateAllKeys();
      if (!validation.hasInvalidRequired) {
        handleSave();
      }
    }
  };

  const validation = validateAllKeys();

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔑 API Key Management
          </DialogTitle>
          <DialogDescription>
            Configure your API keys for different AI providers.
            Keys are stored locally in your browser and never sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* API Key Inputs */}
          <div className="space-y-4">
            {AVAILABLE_PROVIDERS.map(provider => (
              <ApiKeyInput
                key={provider}
                provider={provider}
                value={tempKeys[provider] || ''}
                onChange={handleKeyChange}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {hasChanges && '• Unsaved changes'}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={validation.hasInvalidRequired}
              className="min-w-[100px]"
            >
              {hasChanges ? 'Save Keys' : 'Close'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};