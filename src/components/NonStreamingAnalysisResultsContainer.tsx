import {cn, ScrollArea, ScrollBar} from '@sqlrooms/ui';
import {ChevronDown} from 'lucide-react';
import React, {useRef} from 'react';
import {useStoreWithAi} from '@sqlrooms/ai';
import {AnalysisResult} from '@sqlrooms/ai';
import {useScrollToBottom} from '@sqlrooms/ai';

/**
 * Non-streaming version of AnalysisResultsContainer
 * 
 * This component only shows completed analysis results, effectively disabling
 * the streaming behavior by hiding partial results until they're finished.
 * Shows a loading spinner while analysis is running.
 */
export const NonStreamingAnalysisResultsContainer: React.FC<{
  className?: string;
}> = ({className}) => {
  const isRunningAnalysis = useStoreWithAi((s) => s.ai.isRunningAnalysis);
  const currentSession = useStoreWithAi((s) => s.ai.getCurrentSession());
  const deleteAnalysisResult = useStoreWithAi((s) => s.ai.deleteAnalysisResult);

  // Filter to only show completed results (non-streaming behavior)
  const completedResults = currentSession?.analysisResults.filter(result => result.isCompleted) || [];

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const {showScrollButton, scrollToBottom} = useScrollToBottom({
    containerRef,
    endRef,
    dataToObserve: completedResults, // Only observe completed results
  });

  const onDeleteAnalysisResult = (resultId: string) => {
    if (currentSession) {
      deleteAnalysisResult(currentSession.id, resultId);
    }
  };

  return (
    <div className={cn('relative flex h-full w-full flex-col', className)}>
      <ScrollArea
        ref={containerRef}
        className="flex w-full flex-grow flex-col gap-5"
      >
        {/* Only show completed results */}
        {completedResults.map((result) => (
          <AnalysisResult
            key={result.id}
            result={result}
            onDeleteAnalysisResult={onDeleteAnalysisResult}
          />
        ))}
        
        {/* Show loading spinner while analysis is running */}
        {isRunningAnalysis && (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="flex items-center space-x-3">
              {/* Simple spinner */}
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
              <div className="text-sm text-muted-foreground">
                AI is analyzing your data...
              </div>
            </div>
          </div>
        )}
        
        <div ref={endRef} className="h-10 w-full shrink-0" />
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
        <button
          onClick={scrollToBottom}
          className={cn(
            'bg-primary hover:bg-primary/90 text-primary-foreground pointer-events-auto z-50',
            'mb-6 translate-y-4 rounded-full p-2 opacity-0 shadow-md transition-all duration-200',
            showScrollButton && 'translate-y-0 opacity-100',
          )}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
