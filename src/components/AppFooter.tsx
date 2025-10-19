import {FC} from 'react';

interface FooterProps {
  className?: string;
}

const AppFooter: FC<FooterProps> = ({ className = "" }) => {
  return (
    <footer className={`bg-white/50 border-t border-indigo-100 py-2 mt-4 text-xs ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-1">
          <div className="app-footer-left text-xs text-center md:text-left" style={{ fontWeight: '500' }}>
            <span style={{ color: '#475569', fontWeight: '500' }}>Amar Harolikar</span>
            <span className="mx-1.5 text-indigo-600">•</span>
            <span style={{ color: '#475569', fontWeight: '500' }}>Decision Sciences & Applied AI</span>
            <span className="mx-1.5 text-indigo-600">•</span>
            <span style={{ color: '#475569', fontWeight: '500' }}>
              <i className="fas fa-envelope mr-1"></i>amar@harolikar.com
            </span>
            <span className="mx-1.5 text-indigo-600">•</span>
            <a 
              href="https://www.linkedin.com/in/amarharolikar" 
              target="_blank"
              style={{ color: '#4f46e5', fontWeight: '500' }}
              className="hover:text-slate-800 hover:underline"
            >
              <i className="fab fa-linkedin mr-1"></i>LinkedIn
            </a>
          </div>
          <div className="app-footer-right flex items-center gap-4 text-xs" style={{ fontWeight: '500' }}>
            <a 
              href="https://tigzig.com" 
              target="_blank"
              style={{ color: '#4f46e5', fontWeight: '500' }}
              className="hover:text-slate-800 hover:underline"
            >
              <i className="fas fa-globe mr-1"></i>Tigzig
            </a>
            <a 
              href="https://www.tigzig.com/privacy-policy-tigzig" 
              target="_blank"
              style={{ color: '#4f46e5', fontWeight: '500' }}
              className="hover:text-slate-800 hover:underline"
            >
              <i className="fas fa-shield-alt mr-1"></i>Privacy
            </a>
            <a 
              href="https://www.tigzig.com/terms-conditions" 
              target="_blank"
              style={{ color: '#4f46e5', fontWeight: '500' }}
              className="hover:text-slate-800 hover:underline"
            >
              <i className="fas fa-file-contract mr-1"></i>Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
