import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import WebcamCapture from './components/WebcamCapture';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './components/admin/AdminLayout';
import Login from './pages/admin/Login';
import Register from './pages/admin/Register';
import VerifyEmail from './pages/admin/VerifyEmail';
import ForgotPassword from './pages/admin/ForgotPassword';
import UserManagement from './pages/admin/UserManagement';
import Dashboard from './pages/admin/Dashboard';
import FaceRegistration from './components/admin/FaceRegistration';
import FaceRecognition from './components/admin/FaceRecognition';

// Public Face Verification UI
const FaceVerification = () => (
  <div className="app-container">
    <header className="header">
      <h1>Face Verification</h1>
      <p>Hệ thống chống gian lận & điểm danh trực tuyến độ chính xác cao</p>
      <Link to="/admin/login" className="inline-block mt-4 text-primary-500 hover:text-primary-600 font-medium bg-white/10 px-4 py-2 rounded-lg">
        👉 Tới trang Quản trị (Admin)
      </Link>
    </header>
    <main>
      <WebcamCapture />
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<FaceVerification />} />

          {/* Admin Auth Route */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/admin/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="face-registration-demo" element={<FaceRegistration />} />
            <Route path="face-recognition" element={<FaceRecognition />} />
            {/* Add more admin routes here later (e.g., settings) */}
            <Route path="settings" element={<div className="p-8 text-center text-gray-500">Trang Cài đặt (Đang phát triển)</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
