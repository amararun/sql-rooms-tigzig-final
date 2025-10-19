/**
 * Global error handler for Out of Memory errors
 * Catches unhandled promise rejections and shows user-friendly modals
 */

export interface OutOfMemoryError {
  type: 'out_of_memory';
  message: string;
  originalError: any;
  timestamp: Date;
}

// Global error state
let globalErrorHandler: ((error: OutOfMemoryError) => void) | null = null;

/**
 * Check if an error is an Out of Memory error
 */
export const isOutOfMemoryError = (error: any): boolean => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorString = errorMessage.toLowerCase();
  
  return (
    errorString.includes('out of memory') ||
    errorString.includes('failed to allocate') ||
    errorString.includes('3.1 gib/3.1 gib used') ||
    errorString.includes('memory limit exceeded') ||
    errorString.includes('unused blocks cannot be evicted')
  );
};

/**
 * Set the global error handler callback
 * NOTE: No console.log here to prevent Terser from removing this in production builds
 */
export const setGlobalErrorHandler = (handler: (error: OutOfMemoryError) => void) => {
  globalErrorHandler = handler;
  // Handler registered - critical for modal to show on OOM errors
};

/**
 * Handle an Out of Memory error
 */
export const handleOutOfMemoryError = (error: any) => {
  if (!isOutOfMemoryError(error)) {
    return false; // Not an OOM error
  }

  // Note: Removed console.error to prevent infinite loop with console interception
  // The console.error will be handled by the interceptor itself

  const oomError: OutOfMemoryError = {
    type: 'out_of_memory',
    message: 'The operation requires more memory than available. This typically happens with very large files or complex queries.',
    originalError: error,
    timestamp: new Date(),
  };

  // Call the global handler if set
  if (globalErrorHandler) {
    globalErrorHandler(oomError);
    return true; // Error handled
  }

  return false; // No handler set
};

/**
 * Initialize the global error handler
 * Sets up browser-level event listeners for unhandled promise rejections
 * and intercepts console.error calls to catch handled Out of Memory errors
 */
export const initializeGlobalErrorHandler = () => {
  console.log('🔧 [GLOBAL ERROR HANDLER] Initializing global error handler');

  // Handle unhandled promise rejections (async errors)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    if (handleOutOfMemoryError(error)) {
      // Prevent default error handling (red error in console)
      event.preventDefault();
      console.log('✅ [GLOBAL ERROR HANDLER] Out of Memory error handled, prevented default behavior');
    }
  });

  // Handle unhandled JavaScript errors (sync errors)
  window.addEventListener('error', (event) => {
    const error = event.error;
    
    if (handleOutOfMemoryError(error)) {
      // Prevent default error handling
      event.preventDefault();
      console.log('✅ [GLOBAL ERROR HANDLER] Out of Memory error handled, prevented default behavior');
    }
  });

  // Intercept console.error calls to catch handled Out of Memory errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Check if any argument contains Out of Memory error
    const errorText = args.join(' ').toLowerCase();
    if (errorText.includes('out of memory')) {
      console.log('🔍 [CONSOLE INTERCEPTION] Out of Memory error detected in console.error');
      handleOutOfMemoryError({ message: errorText });
    }
    
    // Always call original console.error to preserve debugging
    originalConsoleError.apply(console, args);
  };

  console.log('✅ [GLOBAL ERROR HANDLER] Global error handler initialized with console interception');
};
