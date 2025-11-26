import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from '@sqlrooms/ui';
import { DatabaseIcon, AlertTriangleIcon, LoaderIcon } from 'lucide-react';
import { generateSchemaName, checkSchemaExists } from '../utils/importDuckDB';

interface ImportDBModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onImport: (schemaName: string) => Promise<void>;
  db: any;
}

export const ImportDBModal: React.FC<ImportDBModalProps> = ({
  isOpen,
  onClose,
  file,
  onImport,
  db
}) => {
  const [schemaName, setSchemaName] = useState('');
  const [schemaExists, setSchemaExists] = useState(false);
  const [replaceIfExists, setReplaceIfExists] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCheckingSchema, setIsCheckingSchema] = useState(false);

  // Reset state when modal opens with new file
  useEffect(() => {
    if (isOpen && file) {
      const generatedName = generateSchemaName(file.name);
      console.log(`🔄 [IMPORT DB MODAL] Opening modal for file: ${file.name}`);
      console.log(`🔄 [IMPORT DB MODAL] Generated schema name: ${generatedName}`);

      setSchemaName(generatedName);
      setSchemaExists(false);
      setReplaceIfExists(false);
      setIsImporting(false);
      setIsCheckingSchema(false);
    }
  }, [isOpen, file]);

  // Check if schema exists when schema name changes
  useEffect(() => {
    if (schemaName && db) {
      checkSchemaExistence();
    }
  }, [schemaName, db]);

  const checkSchemaExistence = async () => {
    if (!schemaName.trim() || isImporting) return;

    setIsCheckingSchema(true);
    console.log(`🔍 [IMPORT DB MODAL] Checking if schema '${schemaName}' exists...`);

    try {
      const connector = await db.getConnector();
      const exists = await checkSchemaExists(connector, schemaName);
      setSchemaExists(exists);

      if (exists) {
        console.log(`⚠️ [IMPORT DB MODAL] Schema '${schemaName}' already exists`);
      } else {
        console.log(`✅ [IMPORT DB MODAL] Schema '${schemaName}' is available`);
      }
    } catch (error) {
      console.error('❌ [IMPORT DB MODAL] Error checking schema existence:', error);
      setSchemaExists(false);
    } finally {
      setIsCheckingSchema(false);
    }
  };

  const handleImport = async () => {
    if (!file || !schemaName.trim()) return;

    if (schemaExists && !replaceIfExists) {
      console.log('⚠️ [IMPORT DB MODAL] Cannot import - schema exists and replace not selected');
      return;
    }

    console.log(`🚀 [IMPORT DB MODAL] Starting import to schema '${schemaName}'`);
    setIsImporting(true);

    try {
      // If schema exists and we're replacing, drop it first
      if (schemaExists && replaceIfExists) {
        console.log(`🗑️ [IMPORT DB MODAL] Dropping existing schema '${schemaName}'`);
        const connector = await db.getConnector();
        await connector.execute(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
      }

      await onImport(schemaName);
      console.log(`✅ [IMPORT DB MODAL] Import completed successfully`);
      onClose();
    } catch (error) {
      console.error('❌ [IMPORT DB MODAL] Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    console.log('🔄 [IMPORT DB MODAL] Import cancelled by user');
    onClose();
  };

  const isSchemaNameValid = schemaName.trim().length > 0;
  const canImport = isSchemaNameValid && (!schemaExists || replaceIfExists) && !isImporting && !isCheckingSchema;

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import DuckDB Database</DialogTitle>
          <DialogDescription>
            Import tables from a DuckDB file into a new schema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

        {/* File info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{file.name}</span>
            <span className="text-sm text-gray-500">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        </div>

        {/* Schema name input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Schema Name
          </label>
          <Input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            placeholder="Enter schema name"
            disabled={isImporting}
            className="w-full"
          />
        </div>

        {/* Schema conflict warning */}
        {schemaExists && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-orange-800 font-medium">
                  Schema '{schemaName}' already exists
                </p>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={replaceIfExists}
                    onChange={(e) => setReplaceIfExists(e.target.checked)}
                    disabled={isImporting}
                    className="rounded"
                  />
                  <span className="text-orange-700">Replace existing schema</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isImporting && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <LoaderIcon className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-sm text-blue-700">
                Importing database... This may take a moment.
              </span>
            </div>
          </div>
        )}

        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport}
            className="min-w-[80px]"
          >
            {isImporting ? (
              <>
                <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
                Import
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};