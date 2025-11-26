/**
 * Environment detection utilities
 * Detects whether the app is running as a local file or on a server
 */

/**
 * Check if the app is running as a local file (file:// protocol)
 * This happens when the single-file build is double-clicked to open
 *
 * @returns true if running from file://, false otherwise
 */
export const isRunningAsLocalFile = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.protocol === 'file:';
};

/**
 * Check if the app is running on a server (http:// or https://)
 * This includes both development (localhost) and production (Vercel)
 *
 * @returns true if running on a server, false if local file
 */
export const isRunningOnServer = (): boolean => {
  return !isRunningAsLocalFile();
};

/**
 * Log environment info for debugging
 */
export const logEnvironmentInfo = (): void => {
  console.log('🌍 [ENVIRONMENT] Protocol:', window.location.protocol);
  console.log('🌍 [ENVIRONMENT] Running as local file:', isRunningAsLocalFile());
  console.log('🌍 [ENVIRONMENT] Running on server:', isRunningOnServer());
};
