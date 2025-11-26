import {Button, cn, Textarea} from '@sqlrooms/ui';
import {ArrowUpIcon, Loader2} from 'lucide-react';
import {useCallback, useRef, useEffect, useState} from 'react';
import {useStoreWithAi} from '@sqlrooms/ai';
import {quickPrompts} from '../config/quickPrompts';
import { validateProviderApiKey } from '../utils/apiKeyValidation';
import { ApiKeyValidationModal } from './ApiKeyValidationModal';
import { useRoomStore } from '../store';

type CustomQueryControlsProps = {
  className?: string;
  placeholder?: string;
  children?: React.ReactNode;
  onRun?: () => void;
  onCancel?: () => void;
};

export const CustomQueryControls: React.FC<CustomQueryControlsProps> = ({
  className,
  placeholder = 'What would you like to learn about the data?',
  onRun,
  onCancel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Default to collapsed (false) - mobile shows only first prompt with "More" button
  const [showMorePrompts, setShowMorePrompts] = useState(false);
  const isRunningAnalysis = useStoreWithAi((s) => s.ai.isRunningAnalysis);
  const runAnalysis = useStoreWithAi((s) => s.ai.startAnalysis);
  const cancelAnalysis = useStoreWithAi((s) => s.ai.cancelAnalysis);
  const analysisPrompt = useStoreWithAi((s) => s.ai.analysisPrompt);
  const isDataAvailable = useStoreWithAi((s) => s.room.isDataAvailable);
  const setAnalysisPrompt = useStoreWithAi((s) => s.ai.setAnalysisPrompt);
  const currentSession = useStoreWithAi((s) => s.ai.getCurrentSession());
  const model = currentSession?.model;

  // API key validation
  const apiKeys = useRoomStore((s) => s.apiKeys);
  const currentProvider = currentSession?.modelProvider;
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (!isDataAvailable) return;
    // Focus the textarea when the component mounts
    // Using a small timeout ensures the data is loaded and
    // add timeout to prevent aria hidden warning caused by the
    // loading progress dialog being still open
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isDataAvailable]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        if (!isRunningAnalysis && model && analysisPrompt.trim().length) {
          // Validate API key before running analysis
          const validation = validateProviderApiKey(currentProvider as any, apiKeys);
          if (!validation.isValid) {
            console.log('❌ [QUERY CONTROLS] API key validation failed:', validation.errorMessage);
            setValidationMessage(validation.errorMessage);
            setShowValidationModal(true);
            return;
          }

          console.log('🚀 [QUERY CONTROLS] Starting analysis with prompt:', analysisPrompt);
          console.log('🚀 [QUERY CONTROLS] Model:', model, 'Provider:', currentProvider);
          runAnalysis().catch(error => {
            console.error('❌ [QUERY CONTROLS] runAnalysis failed:', error);
          });
        }
      }
    },
    [isRunningAnalysis, model, analysisPrompt, runAnalysis, currentProvider, apiKeys],
  );

  const canStart = Boolean(model && analysisPrompt.trim().length);

  const handleClickRunOrCancel = useCallback(() => {
    if (isRunningAnalysis) {
      cancelAnalysis();
      onCancel?.();
    } else {
      // Validate API key before running analysis
      const validation = validateProviderApiKey(currentProvider as any, apiKeys);
      if (!validation.isValid) {
        console.log('❌ [QUERY CONTROLS] API key validation failed:', validation.errorMessage);
        setValidationMessage(validation.errorMessage);
        setShowValidationModal(true);
        return;
      }

      console.log('🚀 [QUERY CONTROLS] Starting analysis with prompt:', analysisPrompt);
      console.log('🚀 [QUERY CONTROLS] Model:', model, 'Provider:', currentProvider);
      runAnalysis().catch(error => {
        console.error('❌ [QUERY CONTROLS] runAnalysis failed:', error);
      });
      onRun?.();
    }
  }, [isRunningAnalysis, cancelAnalysis, runAnalysis, currentProvider, apiKeys]);

  // Handle quick prompt selection
  const handleQuickPrompt = useCallback((promptId: string) => {
    if (isRunningAnalysis) return;

    // Find the prompt by ID
    const selectedPrompt = quickPrompts.find(prompt => prompt.id === promptId);
    if (!selectedPrompt) {
      console.error('Prompt not found:', promptId);
      return;
    }

    console.log(`📋 [QUICK PROMPT] Selected: "${selectedPrompt.displayText}"`);

    // Auto-collapse behavior removed - let user manually collapse with "Less..." button
    // (Since prompts now default to expanded on mobile, auto-collapse would be disruptive)

    // Set the actual prompt in the input box so user can see it and manually send
    setAnalysisPrompt(selectedPrompt.actualPrompt);

    // Focus the textarea so user knows the prompt is ready to send
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isRunningAnalysis, setAnalysisPrompt]);

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2',
        className,
      )}
    >
      {/* Quick Prompt Buttons - Responsive Design */}
      {quickPrompts.length > 0 && (
        <>
          {/* Mobile Layout - Show first prompt + More button, hidden on desktop */}
          <div className="w-full md:hidden">
            <div className="flex gap-2 flex-wrap px-2">
              {/* Always show first prompt */}
              <Button
                key={0}
                variant="outline"
                size="sm"
                className="text-sm rounded-full"
                onClick={() => handleQuickPrompt(quickPrompts[0].id)}
                disabled={isRunningAnalysis}
                title={quickPrompts[0].description}
              >
                {quickPrompts[0].displayText}
              </Button>

              {/* Show more button or expanded prompts */}
              {!showMorePrompts ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm rounded-full"
                  onClick={() => setShowMorePrompts(true)}
                  disabled={isRunningAnalysis}
                >
                  More...
                </Button>
              ) : (
                <>
                  {quickPrompts.slice(1).map((prompt) => (
                    <Button
                      key={prompt.id}
                      variant="outline"
                      size="sm"
                      className="text-sm rounded-full"
                      onClick={() => handleQuickPrompt(prompt.id)}
                      disabled={isRunningAnalysis}
                      title={prompt.description}
                    >
                      {prompt.displayText}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm rounded-full"
                    onClick={() => setShowMorePrompts(false)}
                    disabled={isRunningAnalysis}
                  >
                    Less...
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Desktop Layout - Show all prompts, hidden on mobile */}
          <div className="hidden md:flex w-full gap-2 flex-wrap px-2">
            {quickPrompts.map((prompt) => (
              <Button
                key={prompt.id}
                variant="outline"
                size="sm"
                className="text-sm rounded-full"
                onClick={() => handleQuickPrompt(prompt.id)}
                disabled={isRunningAnalysis}
                title={prompt.description}
              >
                {prompt.displayText}
              </Button>
            ))}
          </div>
        </>
      )}

      {/* Input Area */}
      <div className="bg-muted/50 flex w-full flex-row items-center gap-2 rounded-md border p-2">
        <Textarea
          ref={textareaRef}
          disabled={isRunningAnalysis}
          className="min-h-[30px] resize-none border-none p-2 text-sm outline-none focus-visible:ring-0 flex-1"
          autoResize
          value={analysisPrompt}
          onChange={(e) => setAnalysisPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
        />

        {/* Send button inline with textarea */}
        <Button
          className="h-8 w-8 rounded-full flex-shrink-0"
          variant="default"
          size="icon"
          onClick={handleClickRunOrCancel}
          disabled={!canStart}
        >
          {isRunningAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpIcon />}
        </Button>
      </div>

      {/* API Key Validation Modal */}
      <ApiKeyValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        message={validationMessage}
      />
    </div>
  );
};
