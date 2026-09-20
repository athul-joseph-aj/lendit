// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Rent from './pages/Rent';
import Services from './pages/Services';
import Activity from './pages/Activity';
import ListItem from './pages/ListItem';
import NotFound from './pages/NotFound';

// Services Pages
import ProviderList from './pages/services/ProviderList';
import ProviderProfile from './pages/services/ProviderProfile';
import RequestForm from './pages/services/RequestForm';
import MyRequests from './pages/services/MyRequests';
import ProviderRegister from './pages/services/ProviderRegister';
import ProviderDashboard from './pages/services/ProviderDashboard';
import ProviderEarnings from './pages/services/ProviderEarnings';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/rent" element={<Rent />} />

                {/* Services Module Routes (Public - No Authentication Required) */}
                <Route path="/services" element={<Services />} />
                <Route path="/services/provider/:providerId" element={<ProviderProfile />} />
                <Route path="/services/request/:providerId" element={<RequestForm />} />
                <Route path="/services/my-requests" element={<MyRequests />} />
                <Route path="/services/provider-register" element={<ProviderRegister />} />
                <Route path="/services/provider-dashboard" element={<ProviderDashboard />} />
                <Route path="/services/provider-earnings" element={<ProviderEarnings />} />
                <Route path="/services/:category" element={<ProviderList />} />

                {/* Protected General Routes */}
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/activity" 
                  element={
                    <ProtectedRoute>
                      <Activity />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/list-item" 
                  element={
                    <ProtectedRoute>
                      <ListItem />
                    </ProtectedRoute>
                  } 
                />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;

