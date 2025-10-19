import {FC} from 'react';
import {Button, useDisclosure} from '@sqlrooms/ui';
import {TableIcon} from 'lucide-react';
import DataTableModal from './DataTableModal';

type QueryToolResultProps = {
  title: string;
  sqlQuery: string;
  // We'll add arrowTable support later if needed
};

export const QueryToolResult: FC<QueryToolResultProps> = (props) => {
  const {title, sqlQuery} = props;
  const tableModal = useDisclosure();
  
  return (
    <>
      {/* Show Query + Raw Results Button */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="xs" onClick={tableModal.onOpen}>
          <TableIcon className="h-4 w-4" />
          <h3 className="text-xs">Show Query + Raw Results</h3>
        </Button>
      </div>

      {/* Data Table Modal */}
      <DataTableModal
        title={title}
        query={sqlQuery}
        tableModal={tableModal}
      />
    </>
  );
};

export default QueryToolResult;
