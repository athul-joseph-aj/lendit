// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { 
  Search, Package, Wrench, Smartphone, Camera, 
  Laptop, Hammer, Music, Car, Home as HomeIcon,
  Zap, Droplet, UserCheck, ShieldCheck
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Home() {
  const { t } = useTranslation();

  const categories = [
    { icon: Smartphone, name: t('electronicsCategory') },
    { icon: Camera, name: t('camerasCategory') },
    { icon: Laptop, name: t('laptopsCategory') },
    { icon: Hammer, name: t('toolsCategory') },
    { icon: Music, name: t('eventEquipmentCategory') },
    { icon: Car, name: t('vehiclesCategory') },
    { icon: HomeIcon, name: t('householdCategory') },
  ];

  const services = [
    { icon: Zap, name: t('electricianService') },
    { icon: Droplet, name: t('plumberService') },
    { icon: Hammer, name: t('carpenterService') },
    { icon: HomeIcon, name: t('cleaningService') },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="bg-primary-50 py-20 lg:py-32 overflow-hidden relative">
        <div className="container-main relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight whitespace-pre-line mb-6">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/rent" className="btn btn-primary btn-lg w-full sm:w-auto">
              <Package className="w-5 h-5 mr-2" />
              {t('exploreRentals')}
            </Link>
            <Link to="/services" className="btn btn-secondary btn-lg w-full sm:w-auto bg-white">
              <Wrench className="w-5 h-5 mr-2" />
              {t('findServices')}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section bg-white">
        <div className="container-main">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            {t('categories')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link key={i} to="/rent" className="group">
                  <Card hover padding="p-4" className="flex flex-col items-center justify-center text-center h-full gap-3 border-gray-100 bg-gray-50/50 group-hover:bg-white group-hover:border-primary/20">
                    <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                      {cat.name}
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="section bg-gray-50 border-y border-gray-100">
        <div className="container-main">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            {t('howItWorks')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gray-200" />
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('step1Title')}</h3>
              <p className="text-gray-500">{t('step1Desc')}</p>
            </div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-6">
                <UserCheck className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('step2Title')}</h3>
              <p className="text-gray-500">{t('step2Desc')}</p>
            </div>
            
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('step3Title')}</h3>
              <p className="text-gray-500">{t('step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="section bg-white">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {t('servicesPreview')}
              </h2>
              <p className="text-gray-500">
                {t('servicesPreviewDesc')}
              </p>
            </div>
            <Link to="/services" className="btn btn-ghost">
              {t('viewAll')}
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <Card key={i} hover padding="p-0" className="overflow-hidden">
                  <div className="h-32 bg-primary-50 flex items-center justify-center">
                    <Icon className="w-12 h-12 text-primary opacity-20" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">Professional Service</p>
                    <Link to="/services" className="text-primary text-sm font-medium hover:underline">
                      Find Provider
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary text-white text-center">
        <div className="container-main max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('ctaTitle')}
          </h2>
          <p className="text-xl text-primary-100 mb-10">
            {t('ctaDesc')}
          </p>
          <Link to="/list-item" className="btn bg-white text-primary hover:bg-gray-50 btn-lg">
            {t('startListing')}
          </Link>
        </div>
      </section>
    </div>
  );
}
