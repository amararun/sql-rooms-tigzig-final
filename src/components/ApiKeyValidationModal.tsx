import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sqlrooms/ui';
import { Button } from '@sqlrooms/ui';
import { AlertCircle } from 'lucide-react';

interface ApiKeyValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

/**
 * Modal that displays API key validation errors before sending a query
 * Simple modal with error message and close button
 */
export const ApiKeyValidationModal: React.FC<ApiKeyValidationModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  // Only log when modal actually opens, not on every render
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔑 [API KEY VALIDATION MODAL] Opened with message:', message);
    }
  }, [isOpen, message]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            API Key Required
          </DialogTitle>
          <DialogDescription className="pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button
            onClick={onClose}
            variant="default"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
