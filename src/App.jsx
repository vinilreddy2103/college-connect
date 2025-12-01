import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import all your page and route components...
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminPage from './pages/AdminPage';
import CollegeAdminPage from './pages/CollegeAdminPage';
import AdminRoute from './components/AdminRoute';
import CollegeAdminRoute from './components/CollegeAdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import EventDetailsPage from './pages/EventDetailsPage';
import RegisteredEventsPage from './pages/RegisteredEventsPage'; // Import the new page

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/college-admin" element={<CollegeAdminRoute><CollegeAdminPage /></CollegeAdminRoute>} />
          <Route path="/event/:eventId" element={<ProtectedRoute><EventDetailsPage /></ProtectedRoute>} />

          {/* --- ADD THIS NEW ROUTE --- */}
          <Route path="/my-events" element={<ProtectedRoute><RegisteredEventsPage /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;