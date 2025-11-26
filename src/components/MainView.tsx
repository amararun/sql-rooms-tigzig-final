import {SkeletonPane} from '@sqlrooms/ui';
import {NonStreamingAnalysisResultsContainer} from './NonStreamingAnalysisResultsContainer';
import {CustomSessionControls} from './CustomSessionControls';
import {CustomQueryControls} from './CustomQueryControls';
import {useRoomStore} from '../store';

export const MainView: React.FC = () => {
  const currentSessionId = useRoomStore((s) => s.config.ai.currentSessionId);

  // Check if data is available
  const isDataAvailable = useRoomStore((state) => state.room.initialized);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Display SessionControls at the top */}
      <div className="flex-shrink-0">
        <CustomSessionControls />
      </div>

      {/* Display AnalysisResultsContainer with proper width constraints */}
      <div className="flex-1 overflow-y-auto w-full max-w-full">
        {isDataAvailable ? (
          <div className="w-full max-w-full px-2 space-y-1">
            <NonStreamingAnalysisResultsContainer
              key={currentSessionId} // will prevent scrolling to bottom after changing current session
              className="w-full max-w-full"
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center px-4">
            <SkeletonPane className="p-4" />
            <p className="text-muted-foreground mt-4">Loading database...</p>
          </div>
        )}
      </div>

      {/* Query input at bottom - compact */}
      <div className="flex-shrink-0">
        <CustomQueryControls 
          placeholder="What would you like to learn about the data?" 
          className="gap-1"
        />
      </div>
    </div>
  );
};
