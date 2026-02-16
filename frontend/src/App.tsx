import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FamilyView } from './pages/FamilyView';
import { Calendar } from './pages/Calendar';
import { Gallery } from './pages/Gallery';
// import { Announcements } from './pages/Announcements'; // Removed
import { Admin } from './pages/Admin';
import { Chat } from './components/Chat';
import { Profile } from './pages/Profile';
import { VideoCall } from './pages/VideoCall';
import { LoadingScreen } from './components/LoadingScreen';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  const [minLoading, setMinLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setMinLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || minLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/family"
          element={
            <ProtectedRoute>
              <FamilyView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/call"
          element={
            <ProtectedRoute>
              <VideoCall />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* Announcement route removed */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <Chat />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <AppRoutes />
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

