import {
  AiSliceConfig,
  AiSliceState,
  createAiSlice,
  createDefaultAiConfig,
} from '@sqlrooms/ai';
import {
  BaseRoomConfig,
  createRoomShellSlice,
  createRoomStore,
  LayoutTypes,
  MAIN_VIEW,
  RoomShellSliceState,
  StateCreator,
} from '@sqlrooms/room-shell';
import {
  createDefaultSqlEditorConfig,
  createSqlEditorSlice,
  SqlEditorSliceConfig,
  SqlEditorSliceState,
} from '@sqlrooms/sql-editor';
import {createVegaChartTool} from '@sqlrooms/vega';
import {DatabaseIcon} from 'lucide-react';
import {z} from 'zod';
import {persist} from 'zustand/middleware';
import {DataSourcesPanel} from './components/DataSourcesPanel';
import EchoToolResult from './components/EchoToolResult';
import {MainView} from './components/MainView';
import { getCustomInstructions } from './config/custom-instructions';
import { createDDLQueryTool } from './tools';

// Global logging for AI operations
console.log('🚀 [AI STORE] Initializing SQLRooms AI Store with numberOfRowsToShareWithLLM: 100');

export const RoomPanelTypes = z.enum([
  'room-details',
  'data-sources',
  'view-configuration',
  MAIN_VIEW,
] as const);
export type RoomPanelTypes = z.infer<typeof RoomPanelTypes>;

/**
 * Room config for saving
 */
export const RoomConfig =
  BaseRoomConfig.merge(AiSliceConfig).merge(SqlEditorSliceConfig);
export type RoomConfig = z.infer<typeof RoomConfig>;

/**
 * Room state
 */
type CustomRoomState = {
  /** API keys by provider */
  apiKeys: Record<string, string | undefined>;
  setProviderApiKey: (provider: string, apiKey: string) => void;
  setBatchApiKeys: (keys: Record<string, string>) => void;
};
export type RoomState = RoomShellSliceState<RoomConfig> &
  AiSliceState &
  SqlEditorSliceState &
  CustomRoomState;

/**
 * Create a customized room store
 */
export const {roomStore, useRoomStore} = createRoomStore<RoomConfig, RoomState>(
  persist(
    (set, get, store) => ({
      // Base room slice
      ...createRoomShellSlice<RoomConfig>({
        config: {
          layout: {
            type: LayoutTypes.enum.mosaic,
            nodes: MAIN_VIEW,
          },
          dataSources: [
            {
              tableName: 'cycling_tour_de_france',
              type: 'url',
              url: 'https://app.tigzig.com/files/cycling_tour_de_france.csv',
              datasetVersion: 'v2-cycling-2025', // Change this version when you update the dataset
            } as any,
          ],
          ...createDefaultAiConfig(
            AiSliceConfig.shape.ai.parse({ sessions: [] }),
          ),
          ...createDefaultSqlEditorConfig(),
        },
        room: {
          panels: {
            [RoomPanelTypes.enum['data-sources']]: {
              title: 'Data Sources',
              // icon: FolderIcon,
              icon: DatabaseIcon,
              component: DataSourcesPanel,
              placement: 'sidebar',
            },
            main: {
              title: 'Main view',
              icon: () => null,
              component: MainView,
              placement: 'main',
            },
          },
        },
      })(set, get, store),

      // Sql editor slice
      ...createSqlEditorSlice()(set, get, store),

      // Ai slice
      ...createAiSlice({
        getApiKey: (modelProvider: string) => {
          return get()?.apiKeys[modelProvider] || '';
        },
        // Configure number of rows to share with LLM globally
        numberOfRowsToShareWithLLM: 100,
        // Maximum number of tool execution steps per question (default: 5, increased to 15 for complex analyses)
        // @ts-expect-error - maxSteps is supported at runtime but not in type definitions
        maxSteps: 15,
        // Add custom tools
        customTools: {
          // DDL-enabled query tool (overrides built-in readonly query tool)
          query: {
            ...createDDLQueryTool(),
            execute: async (params: any, options: any) => {
              // Pass the store's get function as context to the tool
              return createDDLQueryTool().execute(params, { ...options, context: { get } });
            },
          },

          // Example of adding a simple echo tool
          echo: {
            description: 'A simple echo tool that returns the input text',
            parameters: z.object({
              text: z.string().describe('The text to echo back'),
            }),
            execute: async ({text}: {text: string}) => {
              console.log('🔄 [ECHO TOOL] Executing echo with text:', text);
              return {
                llmResult: {
                  success: true,
                  details: `Echo: ${text}`,
                },
              };
            },
            component: EchoToolResult,
          },

          // Custom SQL debugging tool
          debug_sql: {
            description: 'Debug tool to trace SQL execution flow',
            parameters: z.object({
              query: z.string().describe('The SQL query to debug'),
              step: z.string().describe('The step in the execution flow'),
            }),
            execute: async ({query, step}: {query: string; step: string}) => {
              console.log(`🔍 [SQL DEBUG] Step: ${step}`);
              console.log(`🔍 [SQL DEBUG] Query: ${query}`);
              console.log(`🔍 [SQL DEBUG] Query length: ${query.length}`);
              console.log(`🔍 [SQL DEBUG] Timestamp: ${new Date().toISOString()}`);
              return {
                llmResult: {
                  success: true,
                  details: `Debug logged: ${step} - Query length: ${query.length}`,
                },
              };
            },
            component: EchoToolResult,
          },

          // Chart debugging tool
          debug_charts: {
            description: 'Debug tool to trace chart creation and display issues',
            parameters: z.object({
              message: z.string().describe('Debug message about chart state'),
              chartCount: z.number().optional().describe('Number of charts expected'),
            }),
            execute: async ({message, chartCount}: {message: string; chartCount?: number}) => {
              console.log(`📊 [CHART DEBUG] ${message}`);
              console.log(`📊 [CHART DEBUG] Expected chart count: ${chartCount || 'unknown'}`);
              console.log(`📊 [CHART DEBUG] Timestamp: ${new Date().toISOString()}`);
              
              // Log current session state
              const currentSessionId = get().config.ai.currentSessionId;
              if (currentSessionId) {
                const sessions = get().config.ai.sessions;
                const currentSession = (sessions as any)[currentSessionId];
                if (currentSession) {
                  const toolCalls = currentSession.messages
                    .filter((msg: any) => msg.type === 'assistant')
                    .flatMap((msg: any) => msg.toolCallMessages || [])
                    .filter((tool: any) => tool.toolName === 'chart');
                  
                  console.log(`📊 [CHART DEBUG] Current session has ${toolCalls.length} chart tool calls`);
                  toolCalls.forEach((tool: any, index: number) => {
                    console.log(`📊 [CHART DEBUG] Chart ${index + 1}:`, {
                      toolCallId: tool.toolCallId,
                      isCompleted: tool.isCompleted,
                      hasAdditionalData: !!tool.additionalData,
                      sqlQuery: tool.args?.sqlQuery?.substring(0, 100) + '...'
                    });
                  });
                }
              }
              
              return {
                llmResult: {
                  success: true,
                  details: `Chart debug logged: ${message} - Found ${chartCount || 'unknown'} charts`,
                },
              };
            },
            component: EchoToolResult,
          },

          // Vega Lite chart tool with optional reasoning parameter
          chart: {
            description: createVegaChartTool().description,
            parameters: z.object({
              sqlQuery: z.string(),
              vegaLiteSpec: z.string(),
              reasoning: z.string().optional().default('Visualization created based on query results'),
            }),
            execute: async (params: any, options?: any) => {
              // Ensure reasoning has a default value
              const enhancedParams = {
                ...params,
                reasoning: params.reasoning || 'Visualization created based on query results',
              };
              console.log('📊 [CHART TOOL] Executing with reasoning:', enhancedParams.reasoning);
              
              // Log the Vega spec dimensions for debugging
              try {
                const spec = JSON.parse(enhancedParams.vegaLiteSpec);
                console.log('📊 [CHART TOOL] Vega Lite Spec Dimensions:', {
                  width: spec.width,
                  height: spec.height,
                  hasWidth: spec.width !== undefined,
                  hasHeight: spec.height !== undefined,
                  mark: spec.mark
                });
              } catch (e) {
                console.error('📊 [CHART TOOL] Could not parse Vega spec:', e);
              }
              
              return createVegaChartTool().execute(enhancedParams, options);
            },
            component: createVegaChartTool().component,
          },

        },
        // Use custom instructions from separate file
        getInstructions: getCustomInstructions,
      })(set, get, store),
      
      // Log AI slice initialization
      ...(() => {
        console.log('🤖 [AI STORE] AI slice created with numberOfRowsToShareWithLLM: 100');
        console.log('🤖 [AI STORE] Custom tools available: chart (Vega Lite), echo, debug_sql, debug_charts');
        console.log('🤖 [AI STORE] Chart tool: chart (Vega Lite)');
        console.log('🤖 [AI STORE] Debug tools: debug_sql, debug_charts');
        return {};
      })(),

      apiKeys: {
        openai: undefined,
        google: undefined,
        anthropic: undefined,
        deepseek: undefined,
      },
      setProviderApiKey: (provider: string, apiKey: string) => {
        console.log(`🔑 [STORE] Setting API key for ${provider}: ${apiKey ? 'present' : 'empty'}`);
        set({
          apiKeys: {...get().apiKeys, [provider]: apiKey},
        });
      },
      setBatchApiKeys: (keys: Record<string, string>) => {
        console.log('🔑 [STORE] Batch setting API keys for providers:', Object.keys(keys));
        const currentKeys = get().apiKeys;
        const updatedKeys = { ...currentKeys };

        // Update with new keys
        Object.entries(keys).forEach(([provider, key]) => {
          if (key && key.trim().length > 0) {
            updatedKeys[provider] = key.trim();
            console.log(`🔑 [STORE] Updated ${provider}: key present`);
          } else {
            updatedKeys[provider] = undefined;
            console.log(`🔑 [STORE] Cleared ${provider}: key removed`);
          }
        });

        set({ apiKeys: updatedKeys });
        console.log('✅ [STORE] Batch API key update completed');
      },
    }),

    // Persist settings
    {
      // Local storage key - v2 to force fresh state after cycling dataset migration
      name: 'ai-example-app-state-storage-v2',

      // Error handling for localStorage quota exceeded
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('❌ [STORE] Failed to rehydrate state from localStorage:', error);
          // If rehydration fails, we continue with default state
        } else {
          console.log('✅ [STORE] State rehydrated from localStorage successfully');
        }
      },

      // Subset of the state to persist
      partialize: (state) => {
        // Limit sessions to last 25, but preserve example sessions
        const allSessions = state.config.ai.sessions;
        const exampleSessionIds = ['xefziloqhpwqlj8kb31szv1q', 'wz49jbb35umuwi7gom6cnk5g', 'qejzk4rjeofiaby238nhdxnb'];
        
        // Separate example sessions from regular sessions
        const exampleSessions = allSessions.filter(session => exampleSessionIds.includes(session.id));
        const regularSessions = allSessions.filter(session => !exampleSessionIds.includes(session.id));
        
        // Filter out empty sessions (sessions with no analysis results)
        const sessionsWithContent = regularSessions.filter(session => 
          session.analysisResults && session.analysisResults.length > 0
        );
        
        // Keep only the last 10 sessions with content (standard approach)
        const limitedRegularSessions = sessionsWithContent.slice(0, 10);
        
        // Sort regular sessions by date (latest first)
        const sortedRegularSessions = limitedRegularSessions.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        // Put regular sessions first (latest at top), then example sessions at bottom
        const limitedSessions = [...sortedRegularSessions, ...exampleSessions];

        // Check if current session still exists after limiting
        const currentSessionId = state.config.ai.currentSessionId;
        const currentSessionExists = limitedSessions.some(s => s.id === currentSessionId);

        // If current session was removed, set to most recent session or empty string
        const validCurrentSessionId = currentSessionExists
          ? currentSessionId
          : (limitedSessions[0]?.id || '');

        // Only log once per session removal (using a Set to track logged session IDs)
        if (!currentSessionExists && currentSessionId) {
          if (!(window as any).__loggedRemovedSessions) {
            (window as any).__loggedRemovedSessions = new Set<string>();
          }
          if (!(window as any).__loggedRemovedSessions.has(currentSessionId)) {
            console.warn(`⚠️ [STORE] Current session '${currentSessionId}' was removed during limiting. Setting to: ${validCurrentSessionId || 'none'}`);
            (window as any).__loggedRemovedSessions.add(currentSessionId);
          }
        }

        const limitedConfig = {
          ...state.config,
          ai: {
            ...state.config.ai,
            sessions: limitedSessions,
            currentSessionId: validCurrentSessionId,
          },
        };

        const persistedState = {
          config: RoomConfig.parse(limitedConfig),
          apiKeys: state.apiKeys,
        };

        // Monitor localStorage size and warn if approaching quota
        // Throttle logging to once per 5 seconds to avoid excessive console spam
        try {
          const serialized = JSON.stringify(persistedState);
          const sizeInBytes = new Blob([serialized]).size;
          const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

          const now = Date.now();
          if (!(window as any).__lastPersistLog || now - (window as any).__lastPersistLog > 5000) {
            console.log(`💾 [STORE] Persisting state: ${sizeInMB} MB (${limitedSessions.length} sessions)`);
            (window as any).__lastPersistLog = now;
          }

          // Warn if approaching 5MB limit (typical localStorage quota is 5-10MB)
          if (sizeInBytes > 4 * 1024 * 1024) {
            console.warn('⚠️ [STORE] localStorage approaching quota limit! Size:', sizeInMB, 'MB');
            console.warn('⚠️ [STORE] Consider reducing session count further or clearing old sessions');
          }
        } catch (error) {
          console.error('❌ [STORE] Error calculating storage size:', error);
        }

        return persistedState;
      },
      migrate: (persistedState: any, _version: number) => {
        if (persistedState?.config?.ai?.sessions) {
          // Apply the same session limiting logic as in partialize
          const allSessions = persistedState.config.ai.sessions;
          const exampleSessionIds = ['xefziloqhpwqlj8kb31szv1q', 'wz49jbb35umuwi7gom6cnk5g', 'qejzk4rjeofiaby238nhdxnb'];
          
          // Separate example sessions from regular sessions
          const exampleSessions = allSessions.filter((session: any) => exampleSessionIds.includes(session.id));
          const regularSessions = allSessions.filter((session: any) => !exampleSessionIds.includes(session.id));
          
          // Filter out empty sessions (sessions with no analysis results)
          const sessionsWithContent = regularSessions.filter((session: any) => 
            session.analysisResults && session.analysisResults.length > 0
          );
          
          // Keep only the last 10 sessions with content (standard approach)
          const limitedRegularSessions = sessionsWithContent.slice(0, 10);
          // Sort regular sessions by date (latest first)
          const sortedRegularSessions = limitedRegularSessions.sort((a: any, b: any) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          // Put regular sessions first (latest at top), then example sessions at bottom
          const limitedSessions = [...sortedRegularSessions, ...exampleSessions];

          // Check if current session still exists after limiting
          const currentSessionId = persistedState.config.ai.currentSessionId;
          const currentSessionExists = limitedSessions.some((s: any) => s.id === currentSessionId);

          // If current session was removed, set to most recent session or empty string
          if (!currentSessionExists && currentSessionId) {
            const newSessionId = limitedSessions[0]?.id || '';
            // Only log once per session removal
            if (!(window as any).__loggedMigratedSessions) {
              (window as any).__loggedMigratedSessions = new Set<string>();
            }
            if (!(window as any).__loggedMigratedSessions.has(currentSessionId)) {
              console.warn(`⚠️ [MIGRATION] Current session '${currentSessionId}' was removed. Setting to: ${newSessionId || 'none'}`);
              (window as any).__loggedMigratedSessions.add(currentSessionId);
            }
            persistedState.config.ai.currentSessionId = newSessionId;
          }

          persistedState.config.ai.sessions = limitedSessions;
          console.log('🔄 [MIGRATION] Applied 10-session limit while preserving example sessions');
        }
        return persistedState;
      },
      version: 3,
    },
  ) as StateCreator<RoomState>,
);

// Log store creation completion
console.log('✅ [AI STORE] SQLRooms AI Store fully initialized');
console.log('✅ [AI STORE] Store ready for AI operations with result sharing enabled');
