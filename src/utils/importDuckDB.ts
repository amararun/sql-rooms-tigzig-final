// Toast will be passed as parameter from component

import { handleOutOfMemoryError } from './globalErrorHandler';

export interface TableSchema {
  table_name: string;
  columns: Array<{
    name: string;
    type: string;
  }>;
  row_count: number;
}

export interface ImportResult {
  schemaName: string;
  tablesImported: number;
  totalRows: number;
  success: boolean;
  error?: string;
}

/**
 * Generate a valid schema name from filename
 */
export const generateSchemaName = (filename: string): string => {
  return filename
    .replace(/\.(db|duckdb)$/i, '') // Remove extension
    .replace(/[^a-zA-Z0-9_]/g, '_') // Replace invalid chars with underscore
    .toLowerCase()
    .substring(0, 30); // Limit length for readability
};

/**
 * Check if schema already exists in the database
 */
export const checkSchemaExists = async (
  connector: any,
  schemaName: string
): Promise<boolean> => {
  try {
    console.log(`🔍 [DUCKDB IMPORT] Checking if schema '${schemaName}' exists...`);

    const result = await connector.query(`
      SELECT COUNT(*) as count
      FROM information_schema.schemata
      WHERE schema_name = '${schemaName}'
    `);

    const exists = result.toArray()[0].count > 0;
    console.log(`📋 [DUCKDB IMPORT] Schema '${schemaName}' exists: ${exists}`);

    return exists;
  } catch (error) {
    console.error('❌ [DUCKDB IMPORT] Error checking schema existence:', error);
    return false;
  }
};

/**
 * Load uploaded file into DuckDB-Wasm filesystem
 */
const loadFileIntoDuckDB = async (db: any, file: File): Promise<string> => {
  console.log(`📁 [DUCKDB IMPORT] Loading file '${file.name}' (${(file.size / 1024 / 1024).toFixed(2)} MB) into DuckDB-Wasm...`);
  console.log(`🔍 [DUCKDB IMPORT] Available db methods:`, Object.getOwnPropertyNames(db));

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Create unique temporary filename
  const tempFileName = `temp_import_${Date.now()}.db`;

  // Get DuckDB instance from connector like in exportDatabase.ts
  const duckdbInstance = await db.getConnector().then((connector: any) => connector.getDb());
  console.log(`🔍 [DUCKDB IMPORT] DuckDB instance methods:`, Object.getOwnPropertyNames(duckdbInstance));

  // Register file in DuckDB-Wasm filesystem using the correct method
  await duckdbInstance.registerFileBuffer(tempFileName, uint8Array);

  console.log(`✅ [DUCKDB IMPORT] File loaded as '${tempFileName}'`);
  return tempFileName;
};

/**
 * Extract table schemas from the uploaded database
 */
export const extractTablesFromDB = async (
  connector: any,
  tempFileName: string
): Promise<TableSchema[]> => {
  console.log(`🔍 [DUCKDB IMPORT] Extracting tables from '${tempFileName}'...`);

  try {
    // Attach the temporary database
    await connector.execute(`ATTACH '${tempFileName}' AS temp_import`);
    console.log(`🔗 [DUCKDB IMPORT] Attached database as 'temp_import'`);

    // Get table list - when database is attached, we need to query differently
    console.log(`📋 [DUCKDB IMPORT] Querying attached database for table list...`);
    const tablesResult = await connector.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_catalog = 'temp_import'
      AND table_schema = 'main'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableNames = tablesResult.toArray().map((row: any) => row.table_name);
    console.log(`📊 [DUCKDB IMPORT] Found ${tableNames.length} tables: ${tableNames.join(', ')}`);

    const tables: TableSchema[] = [];

    // Get schema information for each table
    for (const tableName of tableNames) {
      console.log(`🔍 [DUCKDB IMPORT] Analyzing table '${tableName}'...`);

      // Get column information
      console.log(`📋 [DUCKDB IMPORT] Getting column info for table '${tableName}'...`);
      const columnsResult = await connector.query(`
        SELECT column_name as name, data_type as type
        FROM information_schema.columns
        WHERE table_catalog = 'temp_import'
        AND table_name = '${tableName}'
        AND table_schema = 'main'
        ORDER BY ordinal_position
      `);

      // Get row count
      console.log(`📊 [DUCKDB IMPORT] Getting row count for table '${tableName}'...`);
      const countResult = await connector.query(`
        SELECT COUNT(*) as count FROM temp_import.${tableName}
      `);

      const columns = columnsResult.toArray();
      const rawRowCount = countResult.toArray()[0].count;

      // Convert BigInt to regular number for compatibility
      const rowCount = typeof rawRowCount === 'bigint' ? Number(rawRowCount) : rawRowCount;

      tables.push({
        table_name: tableName,
        columns: columns,
        row_count: rowCount
      });

      console.log(`📋 [DUCKDB IMPORT] Table '${tableName}': ${columns.length} columns, ${rowCount} rows (BigInt converted: ${typeof rawRowCount === 'bigint'})`);
    }

    console.log(`✅ [DUCKDB IMPORT] Extracted ${tables.length} tables successfully`);
    return tables;

  } catch (error) {
    console.error('❌ [DUCKDB IMPORT] Error extracting tables:', error);
    throw error;
  }
};

/**
 * Create schema and import tables from uploaded database
 */
export const createSchemaAndTables = async (
  connector: any,
  schemaName: string,
  tables: TableSchema[]
): Promise<void> => {
  console.log(`🏗️ [DUCKDB IMPORT] Creating schema '${schemaName}' and importing ${tables.length} tables...`);

  try {
    // Create the schema
    await connector.execute(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    console.log(`✅ [DUCKDB IMPORT] Created schema '${schemaName}'`);

    let totalRowsImported: number = 0;

    // Import each table
    for (const table of tables) {
      console.log(`📋 [DUCKDB IMPORT] Importing table '${table.table_name}' (${table.row_count} rows)...`);

      const startTime = performance.now();

      // Create table in new schema with data from temp database
      await connector.execute(`
        CREATE TABLE ${schemaName}.${table.table_name} AS
        SELECT * FROM temp_import.${table.table_name}
      `);

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(1);

      // Ensure we're adding numbers, not BigInt
      const rowsToAdd = typeof table.row_count === 'bigint' ? Number(table.row_count) : table.row_count;
      totalRowsImported += rowsToAdd;

      console.log(`✅ [DUCKDB IMPORT] Imported '${table.table_name}' in ${duration}ms`);
    }

    console.log(`🎉 [DUCKDB IMPORT] Successfully imported ${tables.length} tables with ${totalRowsImported} total rows`);

  } catch (error) {
    console.error('❌ [DUCKDB IMPORT] Error creating schema and tables:', error);
    throw error;
  }
};

/**
 * Cleanup temporary database connection and files
 */
const cleanupTempDatabase = async (db: any, connector: any, tempFileName: string): Promise<void> => {
  try {
    console.log(`🗑️ [DUCKDB IMPORT] Cleaning up temporary database '${tempFileName}'...`);

    // Detach the temporary database
    await connector.execute(`DETACH temp_import`);

    // Remove the temporary file from DuckDB-Wasm filesystem using correct method
    const duckdbInstance = await db.getConnector().then((connector: any) => connector.getDb());
    await duckdbInstance.dropFile(tempFileName);

    console.log(`✅ [DUCKDB IMPORT] Cleanup completed`);
  } catch (error) {
    console.error('⚠️ [DUCKDB IMPORT] Error during cleanup:', error);
    // Don't throw - cleanup errors shouldn't fail the import
  }
};

/**
 * Main function to import a DuckDB file into a new schema
 */
export const importDuckDBFile = async (
  db: any,
  file: File,
  schemaName: string,
  toastFn?: (message: { variant: string; title: string; description: string }) => void
): Promise<ImportResult> => {
  console.log(`🚀 [DUCKDB IMPORT] Starting import of '${file.name}' into schema '${schemaName}'`);
  console.log(`🔍 [DUCKDB IMPORT] File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🔍 [DUCKDB IMPORT] File type: ${file.type || 'unknown'}`);

  let tempFileName: string | null = null;

  console.log(`🔗 [DUCKDB IMPORT] Getting database connector...`);
  const connector = await db.getConnector();
  console.log(`✅ [DUCKDB IMPORT] Database connector obtained`);

  try {
    // 1. Load file into DuckDB-Wasm
    console.log(`📁 [DUCKDB IMPORT] Step 1: Loading file into DuckDB-Wasm...`);
    tempFileName = await loadFileIntoDuckDB(db, file);
    console.log(`✅ [DUCKDB IMPORT] Step 1 completed: File loaded as '${tempFileName}'`);

    // 2. Extract table schemas from uploaded database
    console.log(`🔍 [DUCKDB IMPORT] Step 2: Extracting table schemas...`);
    const tables = await extractTablesFromDB(connector, tempFileName);
    console.log(`✅ [DUCKDB IMPORT] Step 2 completed: Found ${tables.length} tables`);

    if (tables.length === 0) {
      throw new Error('No tables found in the uploaded database');
    }

    // 3. Create schema and import tables
    console.log(`🏗️ [DUCKDB IMPORT] Step 3: Creating schema and importing tables...`);
    await createSchemaAndTables(connector, schemaName, tables);
    console.log(`✅ [DUCKDB IMPORT] Step 3 completed: Schema '${schemaName}' created with all tables`);

    // 4. Calculate totals (ensure we handle BigInt conversion)
    const totalRows = tables.reduce((sum, table) => {
      const rowCount = typeof table.row_count === 'bigint' ? Number(table.row_count) : table.row_count;
      return sum + rowCount;
    }, 0);
    console.log(`📊 [DUCKDB IMPORT] Final statistics: ${tables.length} tables, ${totalRows} total rows`);

    const result: ImportResult = {
      schemaName,
      tablesImported: tables.length,
      totalRows,
      success: true
    };

    console.log(`🎉 [DUCKDB IMPORT] Import completed successfully:`, result);

    // Show success toast if toast function provided
    if (toastFn) {
      toastFn({
        variant: 'default',
        title: 'Import completed',
        description: `Imported ${tables.length} tables (${totalRows} rows) into schema '${schemaName}'`
      });
    }

    return result;

  } catch (error) {
    console.error('❌ [DUCKDB IMPORT] Import failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Always check for OOM (will show modal if it is)
    handleOutOfMemoryError(error);

    // Always show toast for errors (modal + toast is fine)
    if (toastFn) {
      toastFn({
        variant: 'destructive',
        title: 'Import failed',
        description: `Import failed: ${errorMessage}`
      });
    }

    return {
      schemaName,
      tablesImported: 0,
      totalRows: 0,
      success: false,
      error: errorMessage
    };

  } finally {
    // 5. Cleanup temporary files
    if (tempFileName) {
      await cleanupTempDatabase(db, connector, tempFileName);
    }
  }
};