import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Chat from './components/Chat';
import PrivateRoute from './components/PrivateRoute';
import DevNavbar from './components/DevNavbar';

function Contacts() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Contatti</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400">Pagina in sviluppo...</p>
        </div>
      </div>
    </div>
  );
}

function Notifications() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Notifiche</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400">Pagina in sviluppo...</p>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Impostazioni</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400">Pagina in sviluppo...</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const isDevelopment = true;

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900 text-white">
          {isDevelopment && <DevNavbar />}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/chat"
              element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              }
            />
            <Route
              path="/contacts"
              element={
                <PrivateRoute>
                  <Contacts />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}