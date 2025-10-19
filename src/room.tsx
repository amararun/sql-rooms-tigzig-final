import {RoomShell} from '@sqlrooms/room-shell';
import {SqlEditorModal} from '@sqlrooms/sql-editor';
import {useDisclosure} from '@sqlrooms/ui';
import {roomStore} from './store';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import {GlobalErrorProvider} from './components/GlobalErrorProvider';
import {useEffect} from 'react';

export const Room = () => {
  const sqlEditor = useDisclosure();

  // Check dataset version and clear old data if version changed
  useEffect(() => {
    const checkDatasetVersion = async () => {
      const config = roomStore.getState().config;
      const dataSources = config.dataSources || [];

      if (dataSources.length > 0 && (dataSources[0] as any).datasetVersion) {
        const currentVersion = (dataSources[0] as any).datasetVersion;
        const storedVersion = localStorage.getItem('default-dataset-version');

        if (storedVersion && storedVersion !== currentVersion) {
          console.log('🔄 [DATASET VERSION] Version changed from', storedVersion, 'to', currentVersion);
          console.log('🗑️ [DATASET VERSION] Clearing old default dataset...');

          try {
            const db = roomStore.getState().db;
            const connector = await db.getConnector();

            // Drop the old default table (first datasource table)
            const oldTableName = dataSources[0].tableName;
            await connector.query(`DROP TABLE IF EXISTS ${oldTableName}`);

            console.log('✅ [DATASET VERSION] Old dataset cleared, new one will download automatically');
          } catch (error) {
            console.error('❌ [DATASET VERSION] Error clearing old dataset:', error);
          }
        }

        // Store current version
        localStorage.setItem('default-dataset-version', currentVersion);
        console.log('📌 [DATASET VERSION] Current version:', currentVersion);
      }
    };

    checkDatasetVersion();
  }, []);

  // Listen for SQL editor toggle event from header buttons
  useEffect(() => {
    const handleToggleSqlEditor = () => {
      sqlEditor.onToggle();
    };

    window.addEventListener('toggle-sql-editor', handleToggleSqlEditor);
    return () => {
      window.removeEventListener('toggle-sql-editor', handleToggleSqlEditor);
    };
  }, [sqlEditor]);

  return (
    <GlobalErrorProvider>
      <div className="h-screen w-screen max-w-full flex flex-col m-0 p-0">
        <AppHeader />
        <div className="flex-1 overflow-hidden">
          <RoomShell className="h-full w-full" roomStore={roomStore}>
            {/* Removed sidebar - buttons are now in header */}
            <RoomShell.LayoutComposer />
            <RoomShell.LoadingProgress />
            <SqlEditorModal isOpen={sqlEditor.isOpen} onClose={sqlEditor.onClose} />
          </RoomShell>
        </div>
        <AppFooter />
      </div>
    </GlobalErrorProvider>
  );
};
