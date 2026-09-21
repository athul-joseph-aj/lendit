// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import Brand from './Brand';

export default function Footer() {
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto pb-20 md:pb-0">
      <div className="container-main py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="col-span-1 md:col-span-2">
            <Link to="/" aria-label="lendit home" className="inline-flex mb-4">
              <Brand />
            </Link>
            <p className="text-gray-500 max-w-sm mb-6">
              {t('heroSubtitle')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('exploreRentals')}</h4>
            <ul className="space-y-3">
              <li><Link to="/rent" className="text-gray-500 hover:text-primary transition-colors text-sm">{t('categories')}</Link></li>
              <li><Link to="/list-item" className="text-gray-500 hover:text-primary transition-colors text-sm">{t('listItem')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('findServices')}</h4>
            <ul className="space-y-3">
              <li><Link to="/services" className="text-gray-500 hover:text-primary transition-colors text-sm">{t('servicesPreview')}</Link></li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>© {currentYear} lendit. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
