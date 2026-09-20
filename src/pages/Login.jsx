// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      return setError('Please fill in all fields.');
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/profile');
    } catch (err) {
      console.error(err);
      // Map Firebase errors to friendly messages
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError(t('wrongPassword'));
          break;
        case 'auth/invalid-email':
          setError(t('invalidEmail'));
          break;
        case 'auth/network-request-failed':
          setError(t('networkError'));
          break;
        default:
          setError(t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl text-white font-bold text-2xl mb-4">
            L
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('welcomeBack')}</h1>
          <p className="text-gray-500 mt-2">Sign in to continue to LendIt</p>
        </div>

        <Card padding="p-8">
          {error && (
            <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 text-red-700 rounded-lg border border-red-100 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t('email')}
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <div>
              <Input
                label={t('password')}
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end mt-2">
                <a href="#" className="text-sm text-primary hover:underline font-medium">
                  {t('forgotPassword')}
                </a>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              {t('signIn')}
            </Button>
          </form>
        </Card>

        <p className="text-center mt-8 text-gray-600">
          {t('noAccount')} {' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('signUp')}
          </Link>
        </p>
      </div>
    </div>
  );
}
