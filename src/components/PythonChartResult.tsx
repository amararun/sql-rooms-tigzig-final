import React, { useState, useEffect, useRef } from 'react';

interface PythonChartResultProps {
  success: boolean;
  details: string;
  plotUrl: string;
  reasoning: string;
  pythonCode: string;
}

export const PythonChartResult: React.FC<PythonChartResultProps> = ({ success, details, plotUrl, reasoning, pythonCode }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const loggedRef = useRef<string | null>(null);

  // Debug logging to see what we're actually receiving - only log once per unique result
  useEffect(() => {
    const resultKey = `${success}-${plotUrl}-${reasoning}`;
    if (loggedRef.current !== resultKey && success && plotUrl) {
      console.log('🐍 [PYTHON CHART RESULT] Props:', { success, details, plotUrl, reasoning, pythonCode });
      loggedRef.current = resultKey;
    }
  }, [success, details, plotUrl, reasoning, pythonCode]);

  if (!success) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-800">
          <span className="text-lg">❌</span>
          <span className="font-medium">Python Chart Error</span>
        </div>
        <p className="mt-2 text-red-700">{details || 'Unknown error'}</p>
      </div>
    );
  }

  if (!plotUrl) {
    return (
      <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <div className="flex items-center gap-2 text-yellow-800">
          <span className="text-lg">⚠️</span>
          <span className="font-medium">No Chart Generated</span>
        </div>
        <p className="mt-2 text-yellow-700">{details}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full p-4 border border-green-200 rounded-lg bg-green-50 overflow-hidden">
      <div className="flex items-center gap-2 text-green-800 mb-4">
        <span className="text-lg">🐍</span>
        <span className="font-medium">Python Chart Created Successfully</span>
      </div>
      
      <div className="space-y-4 w-full max-w-full">
        {/* Chart Image */}
        <div className="bg-white p-4 rounded-lg border w-full max-w-full overflow-hidden">
          {imageLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading chart...</span>
            </div>
          )}
          
          {imageError ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <span className="text-4xl mb-2">🖼️</span>
              <p className="text-center">Failed to load chart image</p>
              <p className="text-sm text-gray-400 mt-1">URL: {plotUrl}</p>
            </div>
          ) : (
            <img
              src={plotUrl}
              alt="Python Generated Chart"
              className={`w-full max-w-full h-auto rounded-lg ${imageLoading ? 'hidden' : 'block'}`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
            />
          )}
        </div>

        {/* Chart Details */}
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Reasoning:</span> {reasoning}
          </div>
          
          <details className="text-sm">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
              View Python Code
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded-lg overflow-x-auto text-xs">
              <code>{pythonCode}</code>
            </pre>
          </details>
          
        </div>
      </div>
    </div>
  );
};
