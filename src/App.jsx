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
import Services from './pages/Services';
import Activity from './pages/Activity';
import NotFound from './pages/NotFound';

// ── Owner module ───────────────────────────────────────────
import ListItem from './pages/ListItem';
import OwnerLayout from './pages/owner/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MyListings from './pages/owner/MyListings';
import RentalRequests from './pages/owner/RentalRequests';
import ActiveRentals from './pages/owner/ActiveRentals';
import Earnings from './pages/owner/Earnings';

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
                <Route path="/rent"     element={<Rent />} />
                <Route path="/services" element={<Services />} />

                {/* ── Protected (general) Routes ── */}
                <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />

                {/* ── Add Item (standalone, uses global Navbar) ── */}
                <Route
                  path="/list-item"
                  element={<ProtectedRoute><ListItem /></ProtectedRoute>}
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
          </div>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
