import React, { useState } from 'react';
import { Button, useToast } from '@sqlrooms/ui';
import { ArrowRightIcon } from 'lucide-react';
import { TableExportModal } from './TableExportModal';
import { ExportFormat } from '../utils/exportTable';

interface TableExportButtonProps {
  db: any;
  className?: string;
}

export const TableExportButton: React.FC<TableExportButtonProps> = ({
  db,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenModal = () => {
    console.log('📋 [TABLE EXPORT BUTTON] Opening export table modal');
    setIsModalOpen(true);
  };

  const handleExportComplete = (tableName: string, format: ExportFormat) => {
    console.log(`✅ [TABLE EXPORT BUTTON] Export completed: ${tableName} (${format})`);
    toast({
      variant: 'default',
      title: 'Table export completed',
      description: `${tableName} exported successfully as ${format.toUpperCase()}`,
    });
  };

  const handleExportError = (error: string) => {
    console.error('❌ [TABLE EXPORT BUTTON] Export error:', error);
    toast({
      variant: 'destructive',
      title: 'Table export failed',
      description: error,
    });
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="outline"
        size="sm"
        className={`w-full justify-center gap-2 ${className}`}
      >
        <ArrowRightIcon className="h-4 w-4" />
        Export Table
      </Button>

      <TableExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        db={db}
        onExportComplete={handleExportComplete}
        onExportError={handleExportError}
      />
    </>
  );
};