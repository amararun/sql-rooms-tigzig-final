import React, { createContext, useContext, useState, useCallback } from 'react';
import { OutOfMemoryError, setGlobalErrorHandler } from '../utils/globalErrorHandler';
import { OutOfMemoryModal } from './OutOfMemoryModal';

interface GlobalErrorContextType {
  showOutOfMemoryError: (error: OutOfMemoryError) => void;
}

const GlobalErrorContext = createContext<GlobalErrorContextType | null>(null);

export const useGlobalError = () => {
  const context = useContext(GlobalErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within a GlobalErrorProvider');
  }
  return context;
};

interface GlobalErrorProviderProps {
  children: React.ReactNode;
}

export const GlobalErrorProvider: React.FC<GlobalErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<OutOfMemoryError | null>(null);

  const showOutOfMemoryError = useCallback((error: OutOfMemoryError) => {
    console.log('🚨 [GLOBAL ERROR PROVIDER] Showing Out of Memory error modal');
    setCurrentError(error);
  }, []);

  const handleCloseError = useCallback(() => {
    console.log('✅ [GLOBAL ERROR PROVIDER] Closing Out of Memory error modal');
    setCurrentError(null);
  }, []);

  // CRITICAL: Register handler immediately using useMemo with empty deps
  // This runs once during first render, before useEffect would run
  // No console.log here to prevent Terser from removing this code
  const handlerRef = React.useRef(showOutOfMemoryError);
  handlerRef.current = showOutOfMemoryError;

  React.useMemo(() => {
    // Register the handler wrapper that uses the ref
    setGlobalErrorHandler((error: OutOfMemoryError) => {
      handlerRef.current(error);
    });
    // useMemo with empty deps array ensures this runs exactly once
  }, []);

  return (
    <GlobalErrorContext.Provider value={{ showOutOfMemoryError }}>
      {children}
      <OutOfMemoryModal error={currentError} onClose={handleCloseError} />
    </GlobalErrorContext.Provider>
  );
};
