import { DuckDbConnector } from '@sqlrooms/duckdb';

/**
 * Collect sample rows for a table with performance monitoring
 */
export async function collectSampleRows(
  connector: DuckDbConnector,
  tableName: string
): Promise<Array<Record<string, any>> | undefined> {
  const sampleStartTime = performance.now();

  try {
    let sampleRows: Array<Record<string, any>> | undefined;
    let sampleQuery: string;

    try {
      // Use USING SAMPLE for random sampling (DuckDB reservoir sampling)
      sampleQuery = `SELECT * FROM ${tableName} USING SAMPLE 10`;
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
        sampleQuery = `SELECT * FROM ${tableName} LIMIT 10`;
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
      const sampleRows = await collectSampleRows(connector, tableName);

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