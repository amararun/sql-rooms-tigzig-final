/**
 * Table export utilities for individual table exports
 * Supports CSV, pipe-delimited (TXT), and Parquet formats
 */

import { handleOutOfMemoryError } from './globalErrorHandler';

// Removed unused configureMemoryEfficientExport function

export type ExportFormat = 'csv' | 'pipe' | 'parquet';

export interface TableInfo {
  name: string;
  rowCount: number;
}

/**
 * Get list of available tables for export
 */
export const getAvailableTables = async (db: any): Promise<TableInfo[]> => {
  try {
    console.log('📋 [TABLE EXPORT] Getting available tables...');

    // Get all table names with row counts
    const tablesResult = await db.connector.execute(`
      SELECT
        table_name as name,
        COALESCE((
          SELECT COUNT(*)
          FROM information_schema.tables t2
          WHERE t2.table_name = t1.table_name
          AND t2.table_schema = 'main'
        ), 0) as estimated_rows
      FROM information_schema.tables t1
      WHERE table_schema = 'main'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.toArray().map((row: any) => ({
      name: row.name,
      rowCount: row.estimated_rows || 0
    }));

    console.log('📊 [TABLE EXPORT] Found tables:', tables);
    return tables;
  } catch (error) {
    console.error('❌ [TABLE EXPORT] Failed to get tables:', error);
    throw new Error(`Failed to get table list: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export a single table in the specified format
 */
export const exportSingleTable = async (
  db: any,
  tableName: string,
  format: ExportFormat
): Promise<void> => {
  try {
    console.log(`🔄 [TABLE EXPORT] Exporting ${tableName} as ${format.toUpperCase()}...`);

    // Get DuckDB instance for file operations
    const duckdbInstance = db.connector.getDb();

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    let fileName: string;
    let copyCommand: string;

    // Configure export based on format
    switch (format) {
      case 'csv':
        fileName = `${tableName}_${timestamp}.csv`;
        copyCommand = `COPY ${tableName} TO '${fileName}' (FORMAT CSV, HEADER)`;
        break;

      case 'pipe':
        fileName = `${tableName}_${timestamp}.txt`;
        copyCommand = `COPY ${tableName} TO '${fileName}' (FORMAT CSV, DELIMITER '|', HEADER)`;
        break;

      case 'parquet':
        fileName = `${tableName}_${timestamp}.parquet`;
        copyCommand = `COPY ${tableName} TO '${fileName}' (FORMAT PARQUET)`;
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    console.log(`📋 [TABLE EXPORT] Export command: ${copyCommand}`);

    // Execute the export command
    await db.connector.execute(copyCommand);

    // Extract the generated file
    console.log(`📋 [TABLE EXPORT] Extracting ${fileName}...`);
    const fileBuffer = await duckdbInstance.copyFileToBuffer(fileName);

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error(`Export generated empty file for table: ${tableName}`);
    }

    console.log(`✅ [TABLE EXPORT] ${fileName} generated: ${fileBuffer.length} bytes`);

    // Create download blob
    const mimeType = format === 'parquet' ? 'application/octet-stream' : 'text/plain';
    const blob = new Blob([fileBuffer], { type: mimeType });

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`📥 [TABLE EXPORT] Download started: ${fileName}`);

    // Cleanup temporary file
    try {
      await duckdbInstance.dropFile(fileName);
      console.log(`🗑️ [TABLE EXPORT] Cleaned up: ${fileName}`);
    } catch (cleanupError) {
      console.log(`⚠️ [TABLE EXPORT] Cleanup warning:`, cleanupError);
    }

  } catch (error) {
    console.error(`❌ [TABLE EXPORT] Export failed for ${tableName}:`, error);
    // Always check for OOM (will show modal if it is)
    handleOutOfMemoryError(error);
    // Always re-throw so normal error handling works (toast, etc)
    throw error;
  }
};

/**
 * Get human-readable format name for display
 */
export const getFormatDisplayName = (format: ExportFormat): string => {
  switch (format) {
    case 'csv': return 'CSV (Comma-separated)';
    case 'pipe': return 'Pipe-delimited (TXT)';
    case 'parquet': return 'Parquet (Binary)';
  }
};

/**
 * Get format file extension
 */
export const getFormatExtension = (format: ExportFormat): string => {
  switch (format) {
    case 'csv': return 'csv';
    case 'pipe': return 'txt';
    case 'parquet': return 'parquet';
    default: return format;
  }
};