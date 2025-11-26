import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@sqlrooms/ui';
import {useStoreWithAi} from '@sqlrooms/ai';
import {capitalize} from '@sqlrooms/utils';
import {PROVIDER_DEFAULT_BASE_URLS} from '../models';
interface Model {
  provider: string;
  label: string;
  value: string;
}

interface ModelSelectorProps {
  className?: string;
  models: Model[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  className,
  models,
}) => {
  const currentSession = useStoreWithAi((s) => s.ai.getCurrentSession());
  const setAiModel = useStoreWithAi((s) => s.ai.setAiModel);
  const setBaseUrl = useStoreWithAi((s) => s.ai.setBaseUrl);

  const handleModelChange = (value: string) => {
    const selectedModel = models.find((model) => model.value === value);
    if (selectedModel) {
      // Set the model
      setAiModel(selectedModel.provider, value);

      // Update baseURL for the new provider
      const baseUrlForProvider = PROVIDER_DEFAULT_BASE_URLS[selectedModel.provider as keyof typeof PROVIDER_DEFAULT_BASE_URLS];
      if (baseUrlForProvider) {
        setBaseUrl(baseUrlForProvider);
      }
    }
  };

  if (!currentSession) return null;

  const currentModel = currentSession.model;
  const currentModelDetails = models.find((m) => m.value === currentModel);

  // Group models by provider
  const modelsByProvider = models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider]!.push(model);
      return acc;
    },
    {} as Record<string, Model[]>,
  );

  return (
    <div className={className}>
      <Select value={currentModel} onValueChange={handleModelChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select AI Model">
            {currentModelDetails?.label ?? ''}
          </SelectValue>
        </SelectTrigger>
        <SelectContent style={{width: 'auto', minWidth: 'fit-content'}}>
          {Object.entries(modelsByProvider).map(
            ([provider, providerModels]) => (
              <React.Fragment key={provider}>
                <SelectGroup>
                  <SelectLabel className="text-muted-foreground/50 text-center text-sm font-bold">
                    {capitalize(provider)}
                  </SelectLabel>
                  {providerModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
              </React.Fragment>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
