import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Container,
  Paper,
} from '@mui/material';
import { Email, Lock, School } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const { sendOtp, login, isAuthenticated, user } = useAuth();
  
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already authenticated
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     navigateByRole(user.role);
  //   }
  // }, [isAuthenticated, user]);

  const navigateByRole = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'faculty':
        navigate('/faculty');
        break;
      case 'student':
        navigate('/student');
        break;
      default:
        navigate('/login');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await sendOtp(email);
      setSuccess('OTP sent successfully! Check your email.');
      setStep(1);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const userData = await login(email, otp);
      setSuccess('Login successful!');
      navigateByRole(userData.role);
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(0);
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <School sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              AIMS Portal
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Academic Information Management System
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {/* Stepper */}
            <Stepper activeStep={step} sx={{ mb: 4 }}>
              <Step>
                <StepLabel>Enter Email</StepLabel>
              </Step>
              <Step>
                <StepLabel>Verify OTP</StepLabel>
              </Step>
            </Stepper>

            {/* Alerts */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {/* Step 1: Email Input */}
            {step === 0 && (
              <form onSubmit={handleSendOtp}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@iitp.ac.in"
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  sx={{ mb: 3 }}
                  autoFocus
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                </Button>
              </form>
            )}

            {/* Step 2: OTP Input */}
            {step === 1 && (
              <form onSubmit={handleLogin}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  OTP sent to: <strong>{email}</strong>
                </Typography>
                <TextField
                  fullWidth
                  label="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                  sx={{ mb: 3 }}
                  autoFocus
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleBack}
                    sx={{ flex: 1, py: 1.5 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ flex: 2, py: 1.5 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Verify & Login'}
                  </Button>
                </Box>
              </form>
            )}

            {/* Demo Credentials */}
            <Box
              sx={{
                mt: 4,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Demo Accounts (OTP: 123456)
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                • admin@demo.com → Admin<br />
                • faculty@demo.com → Faculty<br />
                • student@demo.com → Student
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
