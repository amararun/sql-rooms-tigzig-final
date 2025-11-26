import {cn} from '@sqlrooms/ui';
import React, {useMemo} from 'react';
import {useStoreWithAi} from '@sqlrooms/ai';
import {SessionActions} from '@sqlrooms/ai';
import {ModelSelector} from './ModelSelector';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EditableText,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sqlrooms/ui';
import {Check, ChevronDown, History, Plus as PlusIcon, Database, Terminal, Edit3} from 'lucide-react';
import {useRoomStore, RoomPanelTypes} from '../store';
import {ApiKeyButton} from './ApiKeyButton';
import {ApiKeyModal} from './ApiKeyModal';
import {LLM_MODELS, MODEL_DISPLAY_NAMES, PROVIDER_DEFAULT_BASE_URLS} from '../models';

// Custom SessionTitle component with reduced maxWidth (150px instead of 300px)
const CustomSessionTitle: React.FC<{className?: string}> = ({className}) => {
  const currentSession = useStoreWithAi((s) => s.ai.getCurrentSession());
  const renameSession = useStoreWithAi((s) => s.ai.renameSession);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {currentSession ? (
        <EditableText
          value={currentSession.name}
          onChange={(newName) => {
            if (currentSession && newName.trim()) {
              renameSession(currentSession.id, newName);
            }
          }}
          placeholder="Session name"
          className="text-sm font-medium"
          maxWidth={150}
        />
      ) : (
        <span className="text-muted-foreground text-sm font-medium">
          No session selected
        </span>
      )}
    </div>
  );
};

/**
 * Custom SessionControls component with "Last 25 Sessions" text in dropdown
 */
export const CustomSessionControls: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({className, children}) => {
  // const currentSession = useStoreWithAi((s) => s.ai.getCurrentSession());
  const sessions = useStoreWithAi((s) => s.config.ai.sessions);
  const currentSessionId = useStoreWithAi((s) => s.config.ai.currentSessionId);
  const switchSession = useStoreWithAi((s) => s.ai.switchSession);
  const originalCreateSession = useStoreWithAi((s) => s.ai.createSession);
  const renameSession = useStoreWithAi((s) => s.ai.renameSession);
  
  // Get setBaseUrl function
  const setBaseUrl = useStoreWithAi((s) => s.ai.setBaseUrl);

  //Custom session creation function that removes "Session" prefix
  const createSession = React.useCallback((name?: string, modelProvider?: string, model?: string) => {
    // If no name provided, generate one without "Session" prefix
    if (!name) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
      // Add milliseconds to ensure uniqueness
      const milliseconds = now.getMilliseconds();
      name = `${formattedDate} at ${formattedTime}.${milliseconds}`;
    }

    // Call the original createSession with our custom name
    const result = originalCreateSession(name, modelProvider, model);

    // After creating the session, set the baseURL for the provider
    // Default to 'google' (not 'openai') since our default model is gemini-flash-latest
    const provider = modelProvider || 'google';
    const baseUrlForProvider = PROVIDER_DEFAULT_BASE_URLS[provider as keyof typeof PROVIDER_DEFAULT_BASE_URLS];
    if (baseUrlForProvider) {
      console.log(`🔧 [SESSION CREATE] Setting baseURL for ${provider}:`, baseUrlForProvider);
      // Set baseURL for the newly created session
      setBaseUrl(baseUrlForProvider);
    }

    return result;
  }, [originalCreateSession, setBaseUrl]);
  
  // Room store for panel toggling
  const togglePanel = useRoomStore((s) => s.layout.togglePanel);
  const layout = useRoomStore((s) => s.config.layout);

  // API key management
  const apiKeys = useRoomStore((s) => s.apiKeys);
  const setBatchApiKeys = useRoomStore((s) => s.setBatchApiKeys);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = React.useState(false);

  
  // Check if data sources panel is visible
  const isDataSourcesVisible = layout?.nodes && typeof layout.nodes === 'object' && 'first' in layout.nodes && 'second' in layout.nodes &&
    (layout.nodes.first === RoomPanelTypes.enum['data-sources'] || 
     layout.nodes.second === RoomPanelTypes.enum['data-sources']);

  // Get current session to check if valid
  const currentSession = useStoreWithAi((s) => s.ai.getCurrentSession());

  // Always create new session on page load and set to gemini-flash-latest
  const sessionCreatedRef = React.useRef(false);

  React.useEffect(() => {
    // Always create a fresh session on page load/refresh
    if (!sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      createSession();
    }
  }, []); // Empty dependency array = runs only once on component mount

  // Set new sessions to always use gemini-flash-latest (only for newly created sessions, not user selections)
  const setAiModel = useStoreWithAi((s) => s.ai.setAiModel);
  const [processedSessionIds, setProcessedSessionIds] = React.useState(new Set<string>());

  React.useEffect(() => {
    if (currentSession && currentSession.id && !processedSessionIds.has(currentSession.id)) {
      if (currentSession.model !== 'gemini-flash-latest') {
        console.log('🔄 [Model Default] Setting new session to gemini-flash-latest (session:', currentSession.id, ')');
        setAiModel('google', 'gemini-flash-latest');

        // CRITICAL: Also set the baseURL for Google provider
        const googleBaseUrl = PROVIDER_DEFAULT_BASE_URLS['google'];
        if (googleBaseUrl) {
          console.log('🔧 [Model Default] Setting baseURL for google:', googleBaseUrl);
          setBaseUrl(googleBaseUrl);
        }
      }
      // Mark this session as processed so we don't override user selections later
      setProcessedSessionIds(prev => new Set([...prev, currentSession.id]));
    }
  }, [currentSession, setAiModel, processedSessionIds, setBaseUrl]);

  // Get current model provider
  const currentModelProvider = (currentSession?.modelProvider || LLM_MODELS[0].name) as any;

  // Transform LLM_MODELS into the format expected by ModelSelector
  const modelOptions = useMemo(
    () =>
      LLM_MODELS.flatMap((provider) =>
        provider.models.map((model) => ({
          provider: provider.name,
          label: MODEL_DISPLAY_NAMES[model] || model,
          value: model,
        })),
      ),
    [],
  );


  // API key modal handlers
  const handleOpenApiKeyModal = () => {
    console.log('🔑 [CUSTOM SESSION CONTROLS] Opening API key modal');
    setIsApiKeyModalOpen(true);
  };

  const handleSaveApiKeys = (keys: Record<string, string>) => {
    console.log('🔑 [CUSTOM SESSION CONTROLS] Saving API keys from modal:', Object.keys(keys));
    setBatchApiKeys(keys);
  };


  return (
    <>
      {/* Header with session controls */}
      <div
        className={cn('flex flex-wrap items-center justify-between pb-3', className)}
      >
        {/* Left side - Database, SQL Editor, Theme buttons + History Button and Editable Session Title */}
        <div className="flex items-center gap-3">
          {/* Database Button */}
          <Button
            variant={isDataSourcesVisible ? "default" : "outline"}
            size="sm"
            onClick={() => togglePanel(RoomPanelTypes.enum['data-sources'])}
            className="gap-1"
          >
            <Database className="h-4 w-4" />
          </Button>
          
          {/* SQL Editor Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // This will be handled by the parent component
              const event = new CustomEvent('toggle-sql-editor');
              window.dispatchEvent(event);
            }}
            className="gap-1"
          >
            <Terminal className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1" variant="outline" size="sm">
                <History className="h-4 w-4" />
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-70">
              <DropdownMenuItem
                onClick={() => createSession()}
                className="flex items-center py-2"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                New Session
              </DropdownMenuItem>

              {/* Past 10 Sessions header */}
              <div className="px-2 py-1 text-xs font-medium text-gray-500 flex items-center">
                <ChevronDown className="mr-1 h-3 w-3" />
                Past 10 Sessions
              </div>

              <div className="bg-border my-1 h-px" />
              {sessions
                .filter(session => 
                  // Only show sessions with content (analysis results) or example sessions
                  session.analysisResults && session.analysisResults.length > 0 ||
                  ['xefziloqhpwqlj8kb31szv1q', 'wz49jbb35umuwi7gom6cnk5g', 'qejzk4rjeofiaby238nhdxnb'].includes(session.id)
                )
                .slice(-10)
                .map((session, index) => (
                <DropdownMenuItem
                  key={session.id}
                  className="flex justify-between items-center py-2 group/item"
                  onClick={(e) => {
                    // Don't switch session if clicking on edit icon
                    if (e.target instanceof HTMLElement && e.target.closest('.edit-icon')) {
                      return;
                    }
                    switchSession(session.id);
                  }}
                >
                  <span className="truncate flex-1" title={`ID: ${session.id}, Index: ${index}`}>
                    {session.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Edit icon - only show on hover */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Edit3 
                            className="edit-icon h-3 w-3 text-muted-foreground opacity-0 transition-opacity cursor-pointer group-hover/item:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Trigger rename for this specific session
                              const newName = prompt('Rename session:', session.name);
                              if (newName && newName.trim() && newName !== session.name) {
                                console.log('Renaming session:', session.id, 'to:', newName.trim());
                                renameSession(session.id, newName.trim());
                                console.log('Rename successful');
                              }
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rename session</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {session.id === currentSessionId && (
                      <Check className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <CustomSessionTitle />

          {/* Session Actions (Delete button) next to Session Title */}
          <SessionActions />
        </div>

        {/* Render children if provided */}
        {children}

        {/* Right side - API Key and Model selector */}
        <div className="flex items-center gap-2">
          {/* API Key Button */}
          <ApiKeyButton
            apiKeys={apiKeys}
            currentProvider={currentModelProvider}
            onClick={handleOpenApiKeyModal}
          />

          {/* Model Selector */}
          <ModelSelector
            models={modelOptions}
            className="[&_[role=option]]:py-1.5 [&_[role=group]]:space-y-0.5 [&_button[aria-label='Scroll up']]:hidden [&_button[aria-label='Scroll down']]:hidden"
          />
        </div>
      </div>
      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentApiKeys={apiKeys}
        onSaveKeys={handleSaveApiKeys}
      />
    </>
  );
};
