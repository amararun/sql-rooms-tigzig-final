import React, { useRef } from 'react';
import { Button } from '@sqlrooms/ui';
import { DatabaseIcon, UploadIcon, Loader2 } from 'lucide-react';

interface ImportDBButtonProps {
  className?: string;
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const ImportDBButton: React.FC<ImportDBButtonProps> = ({
  className,
  onFileSelect,
  isLoading = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    console.log('📤 [IMPORT DB BUTTON] Opening file picker for database import');
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      console.log('📤 [IMPORT DB BUTTON] No file selected');
      return;
    }

    console.log(`📤 [IMPORT DB BUTTON] File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Check file extension
    const validExtensions = ['.db', '.duckdb'];
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      console.warn('⚠️ [IMPORT DB BUTTON] Invalid file type selected:', file.name);
      // Toast will be handled by parent component
      return;
    }

    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';

    console.log('✅ [IMPORT DB BUTTON] Valid database file selected, passing to parent');
    onFileSelect(file);
  };

  return (
    <>
      <Button
        onClick={handleButtonClick}
        className={`flex items-center gap-2 ${className || ''}`}
        variant="outline"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Importing...</span>
          </>
        ) : (
          <>
            <DatabaseIcon className="w-4 h-4" />
            <UploadIcon className="w-3 h-3" />
            <span>Import Database</span>
          </>
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".db,.duckdb"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
};