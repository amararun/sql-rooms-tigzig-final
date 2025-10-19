import {FC, useState, useEffect} from 'react';
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  UseDisclosureReturnValue,
} from '@sqlrooms/ui';
import {useRoomStore} from '../store';

type DataTableModalProps = {
  className?: string;
  title: string | undefined;
  query: string | undefined;
  tableModal: Pick<UseDisclosureReturnValue, 'isOpen' | 'onClose'>;
};

/**
 * A modal component for displaying a table with data from a SQL query.
 * Executes the query and displays the results in a formatted table.
 */
const DataTableModal: FC<DataTableModalProps> = (props) => {
  const {className, title, query, tableModal} = props;
  const db = useRoomStore((state) => state.db);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Execute query when modal opens
  useEffect(() => {
    if (tableModal.isOpen && query) {
      executeQuery();
    }
  }, [tableModal.isOpen, query]);

  const executeQuery = async () => {
    if (!query) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [DATA TABLE MODAL] Executing query:', query);
      const result = await db.connector.execute(query);
      console.log('✅ [DATA TABLE MODAL] Query executed successfully, rows:', result.numRows);
      
      // Convert to JSON format
      const jsonData = result.toArray();
      
      if (jsonData.length > 0) {
        // Extract column names from first row
        const firstRow = jsonData[0];
        const columnNames = Object.keys(firstRow);
        setColumns(columnNames);
        setData(jsonData);
      } else {
        setColumns([]);
        setData([]);
      }
    } catch (err) {
      console.error('❌ [DATA TABLE MODAL] Query execution failed:', err);
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={tableModal.isOpen}
      onOpenChange={(isOpen: boolean) => !isOpen && tableModal.onClose()}
    >
      <DialogContent
        className={cn('h-[80vh] max-w-[75vw]', className)}
        aria-describedby="data-table-modal"
      >
        <DialogHeader>
          <DialogTitle>{title ?? 'Query Result'}</DialogTitle>
          <DialogDescription className="hidden">{title}</DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted flex-1 overflow-hidden">
          {tableModal.isOpen && (
            <div className="h-full w-full overflow-auto p-4">
              {query ? (
                <div className="space-y-4">
                  {/* SQL Query Display */}
                  <div className="bg-gray-100 p-3 rounded-md">
                    <h4 className="text-sm font-medium mb-2">SQL Query:</h4>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                      {query}
                    </pre>
                  </div>
                  
                  {/* Data Table */}
                  <div className="bg-white rounded-md border">
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="text-sm text-gray-600">Loading query results...</div>
                      </div>
                    ) : error ? (
                      <div className="p-4 text-center">
                        <div className="text-sm text-red-600">Error: {error}</div>
                      </div>
                    ) : data.length === 0 ? (
                      <div className="p-4 text-center">
                        <div className="text-sm text-gray-600">No data returned</div>
                      </div>
                    ) : (
                      <div className="overflow-auto max-h-[50vh]">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {columns.map((col, index) => (
                                <th key={index} className="px-3 py-2 text-left font-semibold text-gray-800 border-b">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b hover:bg-gray-50">
                                {columns.map((col, colIndex) => (
                                  <td key={colIndex} className="px-3 py-2 text-gray-900 font-medium">
                                    {row[col] !== null && row[col] !== undefined 
                                      ? String(row[col]) 
                                      : <span className="text-gray-400 italic">null</span>
                                    }
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-2 text-xs text-gray-500 bg-gray-50 border-t">
                          Showing {data.length} rows
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-xs">No query provided</div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={tableModal.onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataTableModal;
