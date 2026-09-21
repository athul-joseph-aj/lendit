// src/pages/Profile.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, MapPin, Settings, Wrench, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/Card';
import Button from '../components/Button';
import LanguageSelector from '../components/LanguageSelector';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="container-main py-8 md:py-12 flex-1">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t('myProfile')}
        </h1>

        {/* Profile Header Card */}
        <Card className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-primary-100 text-primary flex items-center justify-center overflow-hidden flex-shrink-0">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {currentUser?.displayName || t('name')}
            </h2>
            <p className="text-gray-500 mb-4">{currentUser?.email}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="badge badge-active">{t('customer')}</span>
              <span className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                Location pending
              </span>
            </div>
          </div>

          <Button variant="secondary" className="w-full md:w-auto">
            {t('edit')}
          </Button>
        </Card>

        {/* Services Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-gray-400" />
            {t('services')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/services/my-requests"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-[#4682B4] hover:shadow-sm transition-all group"
            >
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t('myRequests')}</p>
                <p className="text-xs text-gray-500">Track and manage your booked services</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#4682B4] transition-colors" />
            </Link>

            <Link
              to="/services/provider-dashboard"
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-[#4682B4] hover:shadow-sm transition-all group"
            >
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t('providerDashboard')}</p>
                <p className="text-xs text-gray-500">Manage client requests & earnings</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#4682B4] transition-colors" />
            </Link>
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            {t('language')}
          </h3>
          <LanguageSelector variant="profile" />
        </div>

        {/* Logout Section */}
        <div className="pt-8 border-t border-gray-200 flex justify-end">
          <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            isLoading={isLoggingOut}
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t('logout')}
          </Button>
        </div>

      </div>
    </div>
  );
}
