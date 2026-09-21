// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Layout components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public / shared pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Rent from './pages/Rent';
import ItemDetails from './pages/ItemDetails';
import Services from './pages/Services';
import Activity from './pages/Activity';
import NotFound from './pages/NotFound';

// Services Pages
import ProviderList from './pages/services/ProviderList';
import ProviderProfile from './pages/services/ProviderProfile';
import RequestForm from './pages/services/RequestForm';
import MyRequests from './pages/services/MyRequests';
import ProviderRegister from './pages/services/ProviderRegister';
import ProviderDashboard from './pages/services/ProviderDashboard';
import ProviderEarnings from './pages/services/ProviderEarnings';

// ── Owner module ───────────────────────────────────────────
import ListItem from './pages/ListItem';
import OwnerLayout from './pages/owner/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyListings from './pages/owner/MyListings';
import RentalRequests from './pages/owner/RentalRequests';
import ActiveRentals from './pages/owner/ActiveRentals';
import Earnings from './pages/owner/Earnings';
import MarketplaceAgreement from './components/MarketplaceAgreement';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col">
              <Routes>
                {/* ── Public Routes ── */}
                <Route path="/"         element={<Home />} />
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/rent" element={<Rent />} />
                <Route path="/rent/:itemId" element={<ItemDetails />} />

                {/* Services browsing is public; requests and provider tools require auth. */}
                <Route path="/services" element={<Services />} />
                <Route path="/services/provider/:providerId" element={<ProviderProfile />} />
                <Route
                  path="/services/request/:providerId"
                  element={
                    <ProtectedRoute>
                      <RequestForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services/my-requests"
                  element={
                    <ProtectedRoute>
                      <MyRequests />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services/provider-register"
                  element={
                    <ProtectedRoute>
                      <ProviderRegister />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services/provider-dashboard"
                  element={
                    <ProtectedRoute>
                      <ProviderDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/services/provider-earnings"
                  element={
                    <ProtectedRoute>
                      <ProviderEarnings />
                    </ProtectedRoute>
                  }
                />
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

                {/* ── Owner Module Routes ── */}
                {/* All /owner/* routes share OwnerLayout (sidebar + mobile tabs) */}
                <Route
                  path="/owner"
                  element={
                    <ProtectedRoute>
                      <OwnerLayout>
                        <OwnerDashboard />
                      </OwnerLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner/listings"
                  element={
                    <ProtectedRoute>
                      <OwnerLayout>
                        <MyListings />
                      </OwnerLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner/requests"
                  element={
                    <ProtectedRoute>
                      <OwnerLayout>
                        <RentalRequests />
                      </OwnerLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner/active"
                  element={
                    <ProtectedRoute>
                      <OwnerLayout>
                        <ActiveRentals />
                      </OwnerLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner/earnings"
                  element={
                    <ProtectedRoute>
                      <OwnerLayout>
                        <Earnings />
                      </OwnerLayout>
                    </ProtectedRoute>
                  }
                />

                {/* ── 404 ── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <MarketplaceAgreement />
          </div>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
