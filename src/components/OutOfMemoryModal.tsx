import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sqlrooms/ui';
import { AlertTriangle, FileText, Database, Settings } from 'lucide-react';
import { OutOfMemoryError } from '../utils/globalErrorHandler';

interface OutOfMemoryModalProps {
  error: OutOfMemoryError | null;
  onClose: () => void;
}

export const OutOfMemoryModal: React.FC<OutOfMemoryModalProps> = ({ error, onClose }) => {
  if (!error) return null;

  const handleOK = () => {
    console.log('✅ [OOM MODAL] User acknowledged Out of Memory error');
    onClose();
  };

  return (
    <Dialog open={!!error} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-red-700">
                Out of Memory Error
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                The operation requires more memory than available
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              {error.message}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Immediate solutions:</h4>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reduce file size</p>
                  <p className="text-xs text-gray-600">Import smaller files or fewer files at once</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Database className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Simplify queries</p>
                  <p className="text-xs text-gray-600">Break complex queries into smaller parts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <Settings className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-blue-800 font-medium mb-1">Custom deployment option available</p>
                <p className="text-xs text-blue-700">
                  This uses default DuckDB settings (3.1GB memory limit). For larger files, 
                  you can deploy a custom version with increased memory configuration and 
                  optimized thread settings for your specific hardware requirements.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleOK}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            OK
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
