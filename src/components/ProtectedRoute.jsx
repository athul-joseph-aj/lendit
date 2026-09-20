// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_MODE } from '../config/demo';
import Loading from './Loading';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // Authentication will be restored after the demo flow is complete.
  if (DEMO_MODE) {
    return children;
  }

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
