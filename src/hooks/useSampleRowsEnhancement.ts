import { useEffect } from 'react';
import { useRoomStore } from '../store';
import { enrichTablesWithSampleRows } from '../utils/collectSampleRows';
import { DataTable } from '@sqlrooms/duckdb';

// Extend DataTable to include sampleRows
interface EnhancedDataTable extends DataTable {
  sampleRows?: Array<Record<string, any>>;
}

/**
 * Custom hook to enhance tables with sample rows whenever schema changes
 */
export function useSampleRowsEnhancement() {
  const db = useRoomStore(state => state.db);
  const tables = useRoomStore(state => state.db.tables);

  useEffect(() => {
    // Only enhance tables if they don't already have sample rows
    const enhanceTables = async () => {
      if (tables && tables.length > 0) {
        const tablesNeedingSamples = tables.filter(table =>
          !(table as EnhancedDataTable).sampleRows || (table as EnhancedDataTable).sampleRows!.length === 0
        );

        if (tablesNeedingSamples.length > 0) {
          console.log(`🔄 [SAMPLE ENHANCEMENT] Enhancing ${tablesNeedingSamples.length} tables with sample rows`);

          try {
            const enrichedTables = await enrichTablesWithSampleRows(
              await db.getConnector(),
              tables
            );

            // Update the store with enriched tables
            // Note: This is a workaround since we can't directly modify the store's tables
            // We'll store enriched tables in a different location
            (window as any).__enrichedTables = enrichedTables;
            console.log(`✅ [SAMPLE ENHANCEMENT] Enhanced tables stored in window.__enrichedTables`);
          } catch (error) {
            console.error('❌ [SAMPLE ENHANCEMENT] Error enhancing tables:', error);
          }
        }
      }
    };

    enhanceTables();
  }, [tables, db]);
}