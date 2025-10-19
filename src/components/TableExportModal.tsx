import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from '@sqlrooms/ui';
import { TableIcon } from 'lucide-react';
import {
  TableInfo,
  ExportFormat,
  getFormatDisplayName,
  exportSingleTable,
  getAvailableTables
} from '../utils/exportTable';

interface TableExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: any;
  onExportComplete: (tableName: string, format: ExportFormat) => void;
  onExportError: (error: string) => void;
}

export const TableExportModal: React.FC<TableExportModalProps> = ({
  isOpen,
  onClose,
  db,
  onExportComplete,
  onExportError,
}) => {
  const [availableTables, setAvailableTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  // Load available tables when modal opens
  useEffect(() => {
    if (isOpen && db) {
      loadTables();
    } else if (!isOpen) {
      // Reset selections when modal closes
      setSelectedTable('');
      setSelectedFormat('csv');
    }
  }, [isOpen, db]);

  const loadTables = async () => {
    try {
      setIsLoadingTables(true);
      console.log('🔄 [TABLE EXPORT MODAL] Loading available tables...');
      const tables = await getAvailableTables(db);
      setAvailableTables(tables);

      // Auto-select first table if available
      if (tables.length > 0) {
        setSelectedTable(tables[0].name);
      }
    } catch (error) {
      console.error('❌ [TABLE EXPORT MODAL] Failed to load tables:', error);
      onExportError(`Failed to load tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onClose();
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleExport = async () => {
    if (!selectedTable || !selectedFormat) {
      return;
    }

    try {
      setIsLoading(true);
      console.log(`🔄 [TABLE EXPORT MODAL] Exporting ${selectedTable} as ${selectedFormat}`);

      await exportSingleTable(db, selectedTable, selectedFormat);

      console.log(`✅ [TABLE EXPORT MODAL] Export completed: ${selectedTable}`);
      onExportComplete(selectedTable, selectedFormat);
      onClose();

    } catch (error) {
      console.error('❌ [TABLE EXPORT MODAL] Export failed:', error);
      onExportError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const canExport = selectedTable && selectedFormat && !isLoading && !isLoadingTables;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            Export Table
          </DialogTitle>
          <DialogDescription>
            Export a single table in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Table Selection */}
          <div className="space-y-2">
            <Label htmlFor="table-select">Table</Label>
            {isLoadingTables ? (
              <div className="text-sm text-gray-500">Loading tables...</div>
            ) : availableTables.length === 0 ? (
              <div className="text-sm text-red-500">No tables available</div>
            ) : (
              <Select
                value={selectedTable}
                onValueChange={setSelectedTable}
                disabled={isLoading || isLoadingTables}
              >
                <SelectTrigger id="table-select">
                  <SelectValue placeholder="Select a table..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.name} ({table.rowCount.toLocaleString()} rows)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Format</Label>
            <div className="space-y-2">
              {(['csv', 'pipe', 'parquet'] as const).map((format) => (
                <div key={format} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`format-${format}`}
                    name="format"
                    value={format}
                    checked={selectedFormat === format}
                    onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                    disabled={isLoading || isLoadingTables}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor={`format-${format}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {getFormatDisplayName(format)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!canExport}
            className="min-w-[80px]"
          >
            {isLoading ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};