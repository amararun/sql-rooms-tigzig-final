import { DuckDbConnector } from '@sqlrooms/duckdb';

/**
 * Column metadata for sample formatting
 */
interface ColumnInfo {
  name: string;
  type: string;
}

/**
 * Build SELECT clause with formatted temporal columns
 */
function buildFormattedSelectClause(columns?: ColumnInfo[]): string {
  if (!columns || columns.length === 0) {
    return '*';
  }

  const formattedColumns = columns.map(col => {
    const colType = col.type.toUpperCase();
    // Quote column name to handle reserved keywords like DEFAULT
    const quotedName = `"${col.name}"`;

    // Format DATE columns as YYYY-MM-DD
    if (colType === 'DATE') {
      return `strftime(${quotedName}, '%Y-%m-%d') as ${quotedName}`;
    }

    // Format TIMESTAMP columns as YYYY-MM-DD HH:MM:SS
    if (colType.includes('TIMESTAMP')) {
      return `strftime(${quotedName}, '%Y-%m-%d %H:%M:%S') as ${quotedName}`;
    }

    // Format TIME columns as HH:MM:SS
    if (colType === 'TIME') {
      return `strftime(${quotedName}, '%H:%M:%S') as ${quotedName}`;
    }

    // Other columns with quoted names to avoid keyword conflicts
    return quotedName;
  });

  return formattedColumns.join(', ');
}

/**
 * Collect sample rows for a table with performance monitoring
 */
export async function collectSampleRows(
  connector: DuckDbConnector,
  tableName: string,
  columns?: ColumnInfo[]
): Promise<Array<Record<string, any>> | undefined> {
  const sampleStartTime = performance.now();

  try {
    let sampleRows: Array<Record<string, any>> | undefined;
    let sampleQuery: string;

    try {
      // Build SELECT clause with formatted temporal columns
      const selectClause = buildFormattedSelectClause(columns);

      // Use USING SAMPLE for random sampling (DuckDB reservoir sampling)
      sampleQuery = `SELECT ${selectClause} FROM ${tableName} USING SAMPLE 10`;
      const queryStartTime = performance.now();
      const sampleResult = await connector.query(sampleQuery);
      const queryDuration = performance.now() - queryStartTime;

      sampleRows = [];
      for (let ri = 0; ri < sampleResult.numRows; ri++) {
        const row: Record<string, any> = {};
        for (let ci = 0; ci < sampleResult.numCols; ci++) {
          const colName = sampleResult.schema.fields[ci].name;
          let colValue = sampleResult.getChildAt(ci)?.get(ri);

          // Convert BigInt to number for serialization
          if (typeof colValue === 'bigint') {
            colValue = Number(colValue);
          }

          row[colName] = colValue;
        }
        sampleRows.push(row);
      }

      const processingTime = performance.now() - sampleStartTime;
      console.log(`✅ [SAMPLE ROWS] ${tableName}: ${sampleRows.length} rows via RESERVOIR_SAMPLE (query: ${queryDuration.toFixed(1)}ms, total: ${processingTime.toFixed(1)}ms)`);

      return sampleRows;

    } catch (samplingError) {
      // Fallback to simple LIMIT 10 if TABLESAMPLE fails
      console.log(`🔄 [SAMPLE ROWS] RESERVOIR_SAMPLE failed for ${tableName}, falling back to LIMIT 10:`, samplingError);

      try {
        // Build SELECT clause with formatted temporal columns (same as above)
        const selectClause = buildFormattedSelectClause(columns);

        sampleQuery = `SELECT ${selectClause} FROM ${tableName} LIMIT 10`;
        const queryStartTime = performance.now();
        const sampleResult = await connector.query(sampleQuery);
        const queryDuration = performance.now() - queryStartTime;

        sampleRows = [];
        for (let ri = 0; ri < sampleResult.numRows; ri++) {
          const row: Record<string, any> = {};
          for (let ci = 0; ci < sampleResult.numCols; ci++) {
            const colName = sampleResult.schema.fields[ci].name;
            let colValue = sampleResult.getChildAt(ci)?.get(ri);

            // Convert BigInt to number for serialization
            if (typeof colValue === 'bigint') {
              colValue = Number(colValue);
            }

            row[colName] = colValue;
          }
          sampleRows.push(row);
        }

        const processingTime = performance.now() - sampleStartTime;
        console.log(`✅ [SAMPLE ROWS] ${tableName}: ${sampleRows.length} rows via LIMIT (query: ${queryDuration.toFixed(1)}ms, total: ${processingTime.toFixed(1)}ms)`);

        return sampleRows;

      } catch (limitError) {
        const processingTime = performance.now() - sampleStartTime;
        console.log(`⚠️ [SAMPLE ROWS] Could not collect sample rows for ${tableName} (${processingTime.toFixed(1)}ms):`, limitError);
        return undefined;
      }
    }
  } catch (error) {
    const processingTime = performance.now() - sampleStartTime;
    console.log(`⚠️ [SAMPLE ROWS] Error collecting samples for ${tableName} (${processingTime.toFixed(1)}ms):`, error);
    return undefined;
  }
}

/**
 * Collect sample rows for all tables and update their schemas
 */
export async function enrichTablesWithSampleRows(
  connector: DuckDbConnector,
  tables: Array<any>
): Promise<Array<any>> {
  console.log(`🔍 [SAMPLE ROWS] Starting sample collection for ${tables.length} tables`);

  const enrichedTables = await Promise.all(
    tables.map(async (table) => {
      const tableName = table.table?.toString() || table.tableName;

      // Extract column metadata for formatting temporal types
      const columns: ColumnInfo[] = table.columns?.map((col: any) => ({
        name: col.name,
        type: col.type
      })) || [];

      const sampleRows = await collectSampleRows(connector, tableName, columns);

      return {
        ...table,
        sampleRows
      };
    })
  );

  const tablesWithSamples = enrichedTables.filter(t => t.sampleRows && t.sampleRows.length > 0);
  console.log(`📊 [SAMPLE ROWS] Collected samples for ${tablesWithSamples.length}/${tables.length} tables`);

  return enrichedTables;
}