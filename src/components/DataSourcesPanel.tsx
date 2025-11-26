import {RoomPanel} from '@sqlrooms/room-shell';
import {TableStructurePanel} from '@sqlrooms/sql-editor';
import {FileDropzone} from '@sqlrooms/dropzone';
import {useRoomStore, RoomPanelTypes} from '../store';
import {convertToValidColumnOrTableName} from '@sqlrooms/utils';
import {handleOutOfMemoryError} from '../utils/globalErrorHandler';
import {
  useToast,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sqlrooms/ui';
import {DownloadIcon, Loader2, UploadIcon, Trash2, RefreshCw} from 'lucide-react';
import {exportDatabase} from '../utils/exportDatabase';
import {TableExportButton} from './TableExportButton';
import {ImportDBButton} from './ImportDBButton';
import {ImportDBModal} from './ImportDBModal';
import {importDuckDBFile} from '../utils/importDuckDB';
import {useState} from 'react';
import {useSampleRowsEnhancement} from '../hooks/useSampleRowsEnhancement';

export const DataSourcesPanel = () => {
  const connector = useRoomStore((state) => state.db.connector);
  const db = useRoomStore((state) => state.db);
  const refreshTableSchemas = useRoomStore(
    (state) => state.db.refreshTableSchemas,
  );
  const {toast} = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enable sample rows enhancement
  useSampleRowsEnhancement();
  
  const handleExportDatabase = async () => {
    try {
      setIsExporting(true);
      await exportDatabase(db);
      toast({
        variant: 'default',
        title: 'Export completed',
        description: 'Database export download started successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: `Failed to export database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFileSelect = (file: File) => {
    // Validate file type
    const validExtensions = ['.db', '.duckdb'];
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please select a DuckDB file (.db or .duckdb)',
      });
      return;
    }

    console.log(`📤 [DATA SOURCES PANEL] Valid database file selected: ${file.name}`);
    setSelectedImportFile(file);
    setIsImportModalOpen(true);
  };

  const handleImportDatabase = async (schemaName: string) => {
    if (!selectedImportFile) return;

    console.log(`🚀 [DATA SOURCES PANEL] Starting import of '${selectedImportFile.name}' to schema '${schemaName}'`);
    setIsImporting(true);

    try {
      const toastFn = (message: { variant: string; title: string; description: string }) => {
        toast({
          variant: message.variant as "default" | "destructive",
          title: message.title,
          description: message.description,
        });
      };
      const result = await importDuckDBFile(db, selectedImportFile, schemaName, toastFn);

      if (result.success) {
        // Refresh table schemas to show imported tables
        await refreshTableSchemas();
        console.log('✅ [DATA SOURCES PANEL] Schema refresh completed after import');
      }
    } catch (error) {
      console.error('❌ [DATA SOURCES PANEL] Import process failed:', error);
      // Error handling is done in importDuckDBFile function via toast
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportModalClose = () => {
    console.log('🔄 [DATA SOURCES PANEL] Closing import modal');
    setIsImportModalOpen(false);
    setSelectedImportFile(null);
  };

  const handleRefreshSchema = async () => {
    console.log('🔄 [DATA SOURCES PANEL] Manual schema refresh triggered');
    setIsRefreshing(true);

    try {
      await refreshTableSchemas();
      console.log('✅ [DATA SOURCES PANEL] Schema refresh completed successfully');

      toast({
        variant: 'default',
        title: 'Schema refreshed',
        description: 'Table list updated successfully',
      });
    } catch (error) {
      console.error('❌ [DATA SOURCES PANEL] Schema refresh failed:', error);
      toast({
        variant: 'destructive',
        title: 'Refresh failed',
        description: `Failed to refresh schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    console.log('🗑️ [CLEAR DATA] Starting to clear all database tables and schemas');

    try {
      const connector = await db.getConnector();

      // Get all schemas (excluding system schemas)
      const schemasResult = await connector.query(`
        SELECT DISTINCT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'temp')
        ORDER BY schema_name
      `);

      const schemas: string[] = [];
      for (let i = 0; i < schemasResult.numRows; i++) {
        const schemaName = schemasResult.getChild('schema_name')?.get(i);
        if (schemaName) {
          schemas.push(schemaName);
        }
      }

      console.log(`🗑️ [CLEAR DATA] Found ${schemas.length} schemas to clear:`, schemas);

      // Drop all non-main schemas (CASCADE will drop all tables in them)
      for (const schema of schemas) {
        if (schema !== 'main') {
          console.log(`🗑️ [CLEAR DATA] Dropping schema: ${schema}`);
          await connector.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        }
      }

      // Drop all tables in main schema
      const tablesResult = await connector.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'main'
        AND table_type = 'BASE TABLE'
      `);

      const mainTables: string[] = [];
      for (let i = 0; i < tablesResult.numRows; i++) {
        const tableName = tablesResult.getChild('table_name')?.get(i);
        if (tableName) {
          mainTables.push(tableName);
        }
      }

      console.log(`🗑️ [CLEAR DATA] Dropping ${mainTables.length} tables from main schema:`, mainTables);

      for (const tableName of mainTables) {
        await connector.query(`DROP TABLE IF EXISTS main.${tableName}`);
      }

      // Refresh table schemas to update UI
      await refreshTableSchemas();

      console.log('✅ [CLEAR DATA] All data cleared successfully');

      toast({
        variant: 'default',
        title: 'Data cleared',
        description: `Removed ${schemas.length - 1} imported schemas and ${mainTables.length} tables from main schema`,
      });
    } catch (error) {
      console.error('❌ [CLEAR DATA] Error clearing data:', error);
      toast({
        variant: 'destructive',
        title: 'Clear failed',
        description: `Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsClearing(false);
      setIsClearDataDialogOpen(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploadingFile(true);
    try {
      const tableName = convertToValidColumnOrTableName(file.name);
      const fileExtension = file.name.toLowerCase().split('.').pop();
      let loadOptions: any = undefined;

      if (fileExtension === 'pipe' || fileExtension === 'psv') {
        loadOptions = { method: 'read_csv' as const, delim: '|', auto_detect: true, sample_size: -1 };
      } else if (fileExtension === 'tsv') {
        loadOptions = { method: 'read_csv' as const, delim: '\t', auto_detect: true, sample_size: -1 };
      } else if (fileExtension === 'txt') {
        const text = await file.text();
        const firstLine = text.split('\n')[0];
        const pipeCount = (firstLine.match(/\|/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        const commaCount = (firstLine.match(/,/g) || []).length;

        if (pipeCount > 0) {
          loadOptions = { method: 'read_csv' as const, delim: '|', auto_detect: true, sample_size: -1 };
        } else if (tabCount > 0) {
          loadOptions = { method: 'read_csv' as const, delim: '\t', auto_detect: true, sample_size: -1 };
        } else if (commaCount > 0) {
          loadOptions = { method: 'read_csv' as const, delim: ',', auto_detect: true, sample_size: -1 } as any;
        } else {
          loadOptions = { method: 'read_csv' as const, auto_detect: true, sample_size: -1 } as any;
        }
      }

      await connector.loadFile(file, tableName, loadOptions);

      // Rename DEFAULT column if it exists (it's a reserved keyword causing issues)
      try {
        const describeResult = await connector.query(`DESCRIBE ${tableName}`);
        let hasDefaultColumn = false;

        for (let i = 0; i < describeResult.numRows; i++) {
          const colName = describeResult.getChild('column_name')?.get(i);
          if (colName === 'DEFAULT') {
            hasDefaultColumn = true;
            break;
          }
        }

        if (hasDefaultColumn) {
          console.log(`🔧 [IMPORT] Renaming DEFAULT column to DEFAULT_FLAG in ${tableName}`);
          await connector.query(`ALTER TABLE ${tableName} RENAME COLUMN "DEFAULT" TO DEFAULT_FLAG`);
          console.log(`✅ [IMPORT] DEFAULT column renamed to DEFAULT_FLAG`);
        }
      } catch (error) {
        console.warn('⚠️ [IMPORT] Could not check/rename DEFAULT column:', error);
      }

      await refreshTableSchemas();

      toast({
        variant: 'default',
        title: 'File imported successfully',
        description: `${file.name} has been loaded as table "${tableName}"`,
      });
    } catch (error) {
      // Always check for OOM (will show modal if it is)
      handleOutOfMemoryError(error);
      // Always show toast for errors (modal + toast is fine)
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: `Failed to import ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  return (
    <RoomPanel type={RoomPanelTypes.enum['data-sources']}>
      <div className="p-4 space-y-3">
        {/* Upload File Button with Refresh */}
        <div className="flex gap-2 -mr-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center gap-2"
            disabled={isUploadingFile}
            onClick={() => {
              // Trigger file input programmatically
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.csv,.tsv,.pipe,.psv,.txt,.parquet,.json';
              input.onchange = async (e) => {
                const files = Array.from((e.target as HTMLInputElement).files || []);
                if (files.length > 0) {
                  for (const file of files) {
                    await handleFileUpload(file);
                  }
                }
              };
              input.click();
            }}
          >
            {isUploadingFile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4" />
                Import File
              </>
            )}
          </Button>
          <Button
            onClick={handleRefreshSchema}
            variant="outline"
            size="sm"
            className="px-2"
            disabled={isRefreshing}
            title="Refresh schema"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="text-[10px] text-slate-800 leading-relaxed">
          Supported formats: .csv, .tsv, .pipe, .psv, .txt, .parquet, .json. Files stay in your browser only (local storage - not uploaded to any server).
        </div>
      </div>

      <FileDropzone
        className="hidden"
        acceptedFormats={{
          'text/csv': ['.csv'],
          'text/tsv': ['.tsv'],
          'text/pipe': ['.pipe', '.psv'],
          'text/plain': ['.txt'],
          'text/parquet': ['.parquet'],
          'text/json': ['.json'],
        }}
        onDrop={async (files) => {
          for (const file of files) {
            try {
              const tableName = convertToValidColumnOrTableName(file.name);
              
              // Detect pipe-delimited files and set appropriate options
              const fileExtension = file.name.toLowerCase().split('.').pop();
              let loadOptions = {};
              
              if (fileExtension === 'pipe' || fileExtension === 'psv') {
                // For pipe-delimited files, use read_csv with pipe delimiter
                loadOptions = {
                  method: 'read_csv' as const,
                  delim: '|',
                  auto_detect: true,
                  sample_size: -1,
                };
                console.log('🔧 [FILE IMPORT] Detected pipe-delimited file:', file.name, 'Using delim: |');
              } else if (fileExtension === 'tsv') {
                // For TSV files, ensure tab delimiter is used
                loadOptions = {
                  method: 'read_csv' as const,
                  delim: '\t',
                  auto_detect: true,
                  sample_size: -1,
                };
                console.log('🔧 [FILE IMPORT] Detected TSV file:', file.name, 'Using delim: \\t');
              } else if (fileExtension === 'txt') {
                // For .txt files, try to detect the delimiter by examining content
                try {
                  const text = await file.text();
                  const firstLine = text.split('\n')[0];
                  
                  // Count delimiters in the first line to guess the format
                  const pipeCount = (firstLine.match(/\|/g) || []).length;
                  const tabCount = (firstLine.match(/\t/g) || []).length;
                  const commaCount = (firstLine.match(/,/g) || []).length;
                  
                  console.log('🔍 [FILE IMPORT] Delimiter analysis for', file.name, '- Pipes:', pipeCount, 'Tabs:', tabCount, 'Commas:', commaCount);
                  
                  // Use a more decisive approach - if ANY delimiter is found, use it
                  if (pipeCount > 0) {
                    loadOptions = {
                      method: 'read_csv' as const,
                      delim: '|',
                      auto_detect: true,
                      sample_size: -1,
                    };
                    console.log('🔧 [FILE IMPORT] Auto-detected pipe-delimited .txt file:', file.name, 'Pipe count:', pipeCount);
                  } else if (tabCount > 0) {
                    loadOptions = {
                      method: 'read_csv' as const,
                      delim: '\t',
                      auto_detect: true,
                      sample_size: -1,
                    };
                    console.log('🔧 [FILE IMPORT] Auto-detected tab-delimited .txt file:', file.name, 'Tab count:', tabCount);
                  } else if (commaCount > 0) {
                    loadOptions = {
                      method: 'read_csv' as const,
                      delim: ',',
                      auto_detect: true,
                      sample_size: -1,
                    };
                    console.log('🔧 [FILE IMPORT] Auto-detected comma-delimited .txt file:', file.name, 'Comma count:', commaCount);
                  } else {
                    // Default to read_csv with auto-detection for .txt files
                    // Even if no clear delimiter pattern, assume it's some kind of delimited text
                    loadOptions = {
                      method: 'read_csv' as const,
                      auto_detect: true,
                      sample_size: -1,
                    };
                    console.log('🔧 [FILE IMPORT] No clear delimiter pattern in .txt file:', file.name, 'Using read_csv with auto-detection');
                  }
                } catch (contentError) {
                  console.warn('⚠️ [FILE IMPORT] Failed to analyze .txt file content:', contentError);
                  // Fall back to read_csv with auto-detection
                  loadOptions = {
                    method: 'read_csv' as const,
                    auto_detect: true,
                    sample_size: -1,
                  };
                  console.log('🔧 [FILE IMPORT] Content analysis failed for .txt file:', file.name, 'Using read_csv with auto-detection');
                }
              }
              
              await connector.loadFile(file, tableName, loadOptions as any);

              // Rename DEFAULT column if it exists (it's a reserved keyword causing issues)
              try {
                const describeResult = await connector.query(`DESCRIBE ${tableName}`);
                let hasDefaultColumn = false;

                for (let i = 0; i < describeResult.numRows; i++) {
                  const colName = describeResult.getChild('column_name')?.get(i);
                  if (colName === 'DEFAULT') {
                    hasDefaultColumn = true;
                    break;
                  }
                }

                if (hasDefaultColumn) {
                  console.log(`🔧 [FILE DROP] Renaming DEFAULT column to DEFAULT_FLAG in ${tableName}`);
                  await connector.query(`ALTER TABLE ${tableName} RENAME COLUMN "DEFAULT" TO DEFAULT_FLAG`);
                  console.log(`✅ [FILE DROP] DEFAULT column renamed to DEFAULT_FLAG`);
                }
              } catch (error) {
                console.warn('⚠️ [FILE DROP] Could not check/rename DEFAULT column:', error);
              }

              toast({
                variant: 'default',
                title: 'Table created',
                description: `File ${file.name} loaded as ${tableName}`,
              });
            } catch (error) {
              // Always check for OOM (will show modal if it is)
              handleOutOfMemoryError(error);
              // Always show toast for errors (modal + toast is fine)
              toast({
                variant: 'destructive',
                title: 'Error',
                description: `Error loading file ${file.name}: ${error}`,
              });
            }
          }
          await refreshTableSchemas();
        }}
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <UploadIcon className="h-4 w-4" />
          Upload File
        </Button>
      </FileDropzone>
      <TableStructurePanel />

      {/* Export Controls */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        {/* Export Table Button */}
        <TableExportButton db={db} />

        {/* Download Database Button */}
        <Button
          onClick={handleExportDatabase}
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4" />
              Download Database
            </>
          )}
        </Button>

        {/* Import Database Button */}
        <ImportDBButton
          className="w-full justify-center"
          onFileSelect={handleImportFileSelect}
          isLoading={isImporting}
        />

        {/* Clear All Data Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={isClearing}
          onClick={() => setIsClearDataDialogOpen(true)}
        >
          {isClearing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Clearing...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </>
          )}
        </Button>
      </div>

      {/* Import Database Modal */}
      <ImportDBModal
        isOpen={isImportModalOpen}
        onClose={handleImportModalClose}
        file={selectedImportFile}
        onImport={handleImportDatabase}
        db={db}
      />

      {/* Clear All Data Confirmation Dialog */}
      <Dialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All uploaded files and tables</li>
                <li>All imported database schemas</li>
                <li>All data in the main schema</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600">
                This action cannot be undone. Your chat history will be preserved.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsClearDataDialogOpen(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearAllData}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Yes, Clear All Data'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoomPanel>
  );
};
