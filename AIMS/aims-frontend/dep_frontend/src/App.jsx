import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext.jsx'; // Ensure path is correct
import ProtectedRoute from './components/ProtectedRoute.jsx'; // Ensure path is correct

// --- PAGES ---
import LoginPage from './pages/LoginPage.jsx'; // Check if file is Login.jsx or LoginPage.jsx

// Student Pages (Assuming single dashboard with tabs)
import StudentDashboard from './pages/student/StudentDashboard.jsx';

// Faculty Pages (Assuming single dashboard with tabs)
import FacultyDashboard from './pages/faculty/FacultyDashboard.jsx';

// Admin Pages (Nested Layout Architecture)
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminStudents from './pages/admin/AdminStudents.jsx';
import AdminFaculty from './pages/admin/AdminFaculty.jsx';
import AdminSemesters from './pages/admin/AdminSemesters.jsx';
import AdminCourses from './pages/admin/AdminCourses.jsx';
import AdminAdvisors from './pages/admin/AdminAdvisors.jsx';
import AdminOfferings from './pages/admin/AdminOfferings.jsx';

// Create MUI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* ADMIN ROUTES (Nested Layout) */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }>
              {/* Child Routes - These render inside the <Outlet /> of AdminDashboard */}
              <Route path="students" element={<AdminStudents />} />
              <Route path="faculty" element={<AdminFaculty />} />
              <Route path="semesters" element={<AdminSemesters />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="advisors" element={<AdminAdvisors />} />
              <Route path="offerings" element={<AdminOfferings />} />
            </Route>
            
            {/* FACULTY ROUTES */}
            <Route 
              path="/faculty/*" 
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* STUDENT ROUTES */}
            <Route 
              path="/student/*" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback for 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;