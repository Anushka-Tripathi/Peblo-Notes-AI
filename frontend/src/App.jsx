import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import AppLayout from './components/layout/AppLayout';
import NotesPage from './components/notes/NotesPage';
import Dashboard from './components/dashboard/Dashboard';
import ArchivedPage from './components/notes/ArchivedPage';
import SharedNote from './components/shared/SharedNote';
import { useState } from 'react';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  const [newNoteSignal, setNewNoteSignal] = useState(0);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/shared/:shareId" element={<SharedNote />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout onNewNote={() => setNewNoteSignal(s => s + 1)}>
              <Routes>
                <Route path="/" element={<NotesPage newNoteSignal={newNoteSignal} />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/archived" element={<ArchivedPage />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: 'var(--amber)', secondary: 'var(--bg)' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
