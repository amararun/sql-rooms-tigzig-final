import {FC, useState} from 'react';
import { useDeviceDetect } from '@/hooks/use-mobile';
import { Button } from '@sqlrooms/ui';
import { Download, Info, X, Sparkles } from 'lucide-react';
import { isRunningAsLocalFile } from '@/utils/environment';

const AppHeader: FC = () => {
  const { isMobile } = useDeviceDetect();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  return (
    <>
      {/* Main Header */}
      <header
        className={`bg-indigo-950 border-b border-indigo-900 w-full ${isMobile ? 'py-2 px-2' : 'py-1 px-4'}`}
        style={{backgroundColor: '#1e1b4b'}}
      >
      {isMobile ? (
        // Mobile layout - vertical stack, centered
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="app-header-left text-sm">
            DABX-1 - Database AI In Browser
          </div>
          <div className="app-header-description text-sm leading-tight">
            In-Browser DuckDB ● Chat and Analyze in Natural Language ● No Remote DB Required
          </div>
          <div className="app-header-credits text-sm" style={{color: 'rgba(255, 255, 255, 0.9)'}}>
            Credits: <a href="https://sqlrooms.org" target="_blank" rel="noopener noreferrer" className="app-header-link">sqlrooms.org</a> ● Custom Implementation
          </div>
        </div>
      ) : (
        // Desktop layout - horizontal, space-between
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '1rem'}}>
          {/* Left section - App Name */}
          <div className="app-header-left">
            DABX-1 - Database AI In Browser
          </div>

          {/* Middle section - Description */}
          <div className="app-header-description" style={{flex: '1 1 auto', textAlign: 'center'}}>
            In-Browser DuckDB ● Chat and Analyze in Natural Language ● No Remote DB Required
          </div>

          {/* Right section - Credits */}
          <div className="app-header-credits" style={{textAlign: 'right', flex: '0 0 auto'}}>
            Credits: <a href="https://sqlrooms.org" target="_blank" rel="noopener noreferrer" className="app-header-link">sqlrooms.org</a> ● Custom Implementation
          </div>
        </div>
      )}
      </header>

      {/* Download Info Bar - Hidden when running as local file (single-file build) */}
      {!isRunningAsLocalFile() && (
        <div
          className={`w-full border-b ${isMobile ? 'py-2 px-3' : 'py-1 px-6'}`}
          style={{
            backgroundColor: '#F9FAFB',
            borderColor: '#E5E7EB',
            borderBottomWidth: '1px'
          }}
        >
        {isMobile ? (
          <div className="flex flex-col gap-2">
            {/* Mobile: Icon and Button on same line */}
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" fill="currentColor" />
              
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href="https://sql-rooms.tigzig.com/SQL-ROOMS-TIGZIG-FULL-APP.html"
                  download="SQL-ROOMS-TIGZIG-FULL-APP.html"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Full App (~3.5 MB)
                </a>
              </Button>

              {/* Info Icon Button */}
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                title="More information"
              >
                <Info className="h-5 w-5" style={{color: '#0f172a'}} />
              </button>
            </div>
          </div>
        ) : (
          /* Desktop Layout */
          <div className="flex items-center gap-3">
            {/* Icon */}
            <Sparkles className="h-5 w-5 text-amber-400" fill="currentColor" />

            {/* Download Button */}
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="https://sql-rooms.tigzig.com/SQL-ROOMS-TIGZIG-FULL-APP.html"
                download="SQL-ROOMS-TIGZIG-FULL-APP.html"
                className="flex items-center gap-2"
                style={{color: '#312e81'}}
              >
                <Download className="h-4 w-4" />
                Download Full App (~3.5 MB)
              </a>
            </Button>

            {/* Text */}
            <span
              className="text-sm download-info-text"
              style={{color: '#4f46e5'}}
            >
              Standalone portable version - download as single HTML file. Email it, share it, double-click to run. Works like the website but without needing a server.
            </span>
          </div>
        )}
        </div>
      )}

      {/* Mobile Info Modal */}
      {isMobile && isInfoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-lg p-4 max-h-96 overflow-y-auto">
            {/* Close Button */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b">
              <h3 className="font-semibold text-gray-900">Download Information</h3>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Information Text */}
            <p
              className="text-sm leading-relaxed download-info-text"
              style={{color: '#4f46e5'}}
            >
              Standalone portable version - download as single HTML file. Email it, share it, double-click to run. Works like the website but without needing a server.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AppHeader;
