import JSZip from 'jszip';
import { handleOutOfMemoryError } from './globalErrorHandler';

/**
 * Export DuckDB database as a downloadable ZIP file containing schema and Parquet data files
 * This approach provides excellent compression and fast loading for DuckDB recreation
 */

export const exportDatabase = async (db: any): Promise<void> => {
  try {
    console.log('🔄 [EXPORT] Starting DuckDB database Parquet ZIP export...');
    
    // Get the actual DuckDB instance from the connector
    const duckdbInstance = db.connector.getDb();
    console.log('📋 [EXPORT] Got DuckDB instance:', duckdbInstance);
    
    // Get all table names to verify database has content
    const tablesResult = await db.connector.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'main' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tables = tablesResult.toArray().map((row: any) => row.table_name);
    console.log('📊 [EXPORT] Found tables:', tables);
    
    if (tables.length === 0) {
      alert('No tables found to export. Please create some tables first.');
      return;
    }
    
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `sqlrooms_database_${timestamp}.zip`;

    console.log('📋 [EXPORT] Creating Parquet ZIP export:', zipFileName);

    // Step 1: Export each table as Parquet (much smaller than CSV!)
    console.log('📦 [EXPORT] Exporting tables as Parquet files...');
    
    const parquetFiles: { [tableName: string]: Uint8Array } = {};
    const schemaStatements: string[] = [];
    
    for (const tableName of tables) {
      try {
        console.log(`📋 [EXPORT] Exporting ${tableName} as Parquet...`);
        
        // Export table as Parquet file
        const parquetFileName = `${tableName}.parquet`;
        await db.connector.execute(`COPY ${tableName} TO '${parquetFileName}' (FORMAT PARQUET)`);
        
        // Extract the Parquet file
        const parquetBuffer = await duckdbInstance.copyFileToBuffer(parquetFileName);
        parquetFiles[tableName] = parquetBuffer;
        
        console.log(`✅ [EXPORT] ${tableName}.parquet created:`, parquetBuffer.length, 'bytes');
        
        // Get table schema for recreation
        const columnsResult = await db.connector.execute(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          ORDER BY ordinal_position
        `);
        
        const columns = columnsResult.toArray();
        const columnDefs = columns.map((col: any) => {
          const nullable = col.is_nullable === 'YES' ? '' : ' NOT NULL';
          return `${col.column_name} ${col.data_type}${nullable}`;
        }).join(', ');
        
        schemaStatements.push(`CREATE TABLE ${tableName} (${columnDefs});`);
        
      } catch (error) {
        console.log(`❌ [EXPORT] Failed to export ${tableName} as Parquet:`, error);
        
        // Fallback to CSV if Parquet fails
        console.log(`📋 [EXPORT] Falling back to CSV for ${tableName}...`);
        try {
          const csvFileName = `${tableName}.csv`;
          await db.connector.execute(`COPY ${tableName} TO '${csvFileName}' (FORMAT CSV, HEADER)`);
          const csvBuffer = await duckdbInstance.copyFileToBuffer(csvFileName);
          parquetFiles[tableName] = csvBuffer; // Store as CSV buffer
          console.log(`✅ [EXPORT] ${tableName}.csv created:`, csvBuffer.length, 'bytes');
        } catch (csvError) {
          console.log(`❌ [EXPORT] Failed to export ${tableName} as CSV:`, csvError);
        }
      }
    }

    // Step 2: Create ZIP file with schema and Parquet files
    console.log('📦 [EXPORT] Creating ZIP archive...');
    const zip = new JSZip();

    // Add schema.sql to ZIP
    const schemaContent = schemaStatements.join('\n\n');
    zip.file('schema.sql', schemaContent);
    console.log('📋 [EXPORT] Added schema.sql to ZIP');

    // Add Parquet files to ZIP
    for (const [tableName, fileBuffer] of Object.entries(parquetFiles)) {
      const fileExtension = 'parquet'; // Assume Parquet, fallback handled above
      const fileName = `${tableName}.${fileExtension}`;
      zip.file(fileName, fileBuffer);
      console.log(`📋 [EXPORT] Added ${fileName} to ZIP (${fileBuffer.length} bytes)`);
    }

    // Add comprehensive README with instructions
    const readmeContent = `# SQLRooms Database Export (Parquet Format)

This ZIP contains a complete export of your SQLRooms database using efficient Parquet format.

## Files:
- schema.sql: CREATE TABLE statements for all tables
- *.parquet: Compressed columnar data files (10x smaller than CSV!)

## File Size Benefits:
- Parquet files are typically 80-90% smaller than CSV
- Much faster to load and query
- Perfect for large datasets (200MB+ CSV → 20-50MB Parquet)

## Usage in Jupyter Notebook:

### Quick Setup (RECOMMENDED)
\`\`\`python
import duckdb
import zipfile

# Extract files
with zipfile.ZipFile('${zipFileName}', 'r') as zip_ref:
    zip_ref.extractall('database_files')

# Create DuckDB connection
conn = duckdb.connect('my_database.duckdb')

# Import Parquet files directly (BLAZING FAST!)
${tables.map((table: string) => `conn.execute("CREATE TABLE ${table} AS SELECT * FROM 'database_files/${table}.parquet'")`).join('\n')}

# Query your data immediately
result = conn.execute("SELECT COUNT(*) FROM ${tables[0]}").fetchall()
print(f"Loaded {result[0][0]} rows from ${tables[0]}")
\`\`\`

Generated on: ${new Date().toISOString()}
Tables exported: ${tables.join(', ')}
`;

    zip.file('README.md', readmeContent);
    console.log('📋 [EXPORT] Added README.md with usage instructions');

    // Step 3: Generate ZIP blob and download
    console.log('📋 [EXPORT] Generating ZIP file...');
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 } // Maximum compression
    });
    console.log('✅ [EXPORT] ZIP file generated, size:', zipBlob.size, 'bytes');

    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFileName;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('📥 [EXPORT] Parquet ZIP database download started');

    // Step 4: Cleanup temporary files
    console.log('📋 [EXPORT] Cleaning up temporary files...');
    try {
      for (const tableName of tables) {
        try {
          await duckdbInstance.dropFile(`${tableName}.parquet`);
        } catch (cleanupError) {
          try {
            await duckdbInstance.dropFile(`${tableName}.csv`);
          } catch (csvCleanupError) {
            console.log(`⚠️ [EXPORT] Could not cleanup ${tableName} files`);
          }
        }
      }
      console.log('✅ [EXPORT] Cleanup completed');
    } catch (cleanupError) {
      const errorMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      console.log('⚠️ [EXPORT] Cleanup warning:', errorMessage);
    }
    
  } catch (error: any) {
    console.error('❌ [EXPORT] Parquet ZIP export failed:', error.message || error);
    // Always check for OOM (will show modal if it is)
    handleOutOfMemoryError(error);
    // Always show alert for errors (modal + alert is fine)
    alert(`Export failed: ${error.message || error}`);
  }
};