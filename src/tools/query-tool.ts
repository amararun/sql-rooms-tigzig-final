import { z } from 'zod';
import { arrowTableToJson } from '@sqlrooms/duckdb';
import { AiSliceTool } from '@sqlrooms/ai';
import QueryToolResult from '../components/QueryToolResult';
import { TOOL_SPECIFIC_INSTRUCTIONS } from '../config/custom-instructions';

/**
 * DDL-Enabled Query Tool
 * 
 * This tool overrides the built-in SQLRooms query tool to remove the readOnly restriction.
 * It allows all SQL operations including CREATE, DROP, ALTER, INSERT, UPDATE, DELETE.
 * 
 * Based on investigation findings from the other AI coder, but verified and improved.
 */

// Define the schema for the query tool parameters
export const QueryToolParameters = z.object({
  type: z.literal('query').optional(),
  sqlQuery: z.string().describe('The SQL query to execute'),
  reasoning: z.string().describe('Explanation of what this query does and why'),
});

export type QueryToolParametersType = z.infer<typeof QueryToolParameters>;

/**
 * Create the DDL-enabled query tool
 * This function returns a tool configuration that can be used in the store
 */
export const createDDLQueryTool = (): AiSliceTool => ({
  description: `A tool for running SQL queries on the database. ${TOOL_SPECIFIC_INSTRUCTIONS.query}
  
  Supports all SQL operations including:
  - SELECT queries for data retrieval
  - CREATE TABLE, DROP TABLE, ALTER TABLE (DDL operations)
  - INSERT, UPDATE, DELETE (DML operations)
  
  Always explain what the query will do before executing destructive operations.`,
  
  parameters: QueryToolParameters,
  
  execute: async ({ type, sqlQuery, reasoning }: QueryToolParametersType, options?: any) => {
    console.log('🔍 [DDL QUERY TOOL] Executing query with reasoning:', reasoning);
    console.log('🔍 [DDL QUERY TOOL] SQL Query:', sqlQuery);
    
    try {
      // Access the database connector from the store context
      if (!options?.context?.get) {
        throw new Error('Store context not available');
      }
      
      const state = options.context.get();
      const connector = state.db.connector;
      
      if (!connector) {
        throw new Error('Database connector not available');
      }
      
      // Execute the query (no readOnly restriction!)
      const result = await connector.query(sqlQuery);

      // Detect if this is a DDL statement that modifies schema structure
      const isDDL = /^\s*(CREATE|DROP|ALTER|TRUNCATE|RENAME)\s/i.test(sqlQuery.trim());

      if (isDDL) {
        console.log('🔄 [DDL QUERY TOOL] DDL statement detected, refreshing table schemas...');
        // Refresh the table schemas to update the UI
        await state.db.refreshTableSchemas();
        console.log('✅ [DDL QUERY TOOL] Table schemas refreshed');
      }

      // Convert results to JSON format (limit to first 100 rows for performance)
      const firstRows = arrowTableToJson(result.slice(0, 100));

      console.log('✅ [DDL QUERY TOOL] Query executed successfully, rows:', firstRows.length);
      
      return {
        llmResult: {
          success: true,
          data: { type, firstRows },
          reasoning,
        },
        additionalData: { 
          title: 'Query Result', 
          sqlQuery,
          rowCount: firstRows.length,
          isLimitedResult: result.numRows > 100,
        },
        // Direct props for QueryToolResult component
        title: 'Query Result',
        sqlQuery,
      };
      
    } catch (error) {
      console.error('❌ [DDL QUERY TOOL] Query execution failed:', error);
      
      return {
        llmResult: {
          success: false,
          details: 'Query execution failed.',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          reasoning,
        },
        additionalData: {
          sqlQuery,
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        },
        // Direct props for QueryToolResult component
        title: 'Query Error',
        sqlQuery,
      };
    }
  },
  
  component: QueryToolResult,
});
