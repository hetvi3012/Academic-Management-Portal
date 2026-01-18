import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { adminAPI } from '@/services/api'; 

const AdminOfferings = () => {
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 1. Fetch Pending Offerings on Mount
  useEffect(() => {
    fetchPendingOfferings();
  }, []);

  const fetchPendingOfferings = async () => {
    setLoading(true);
    try {
      // Calls: GET /api/auth/offerings/pending
      const response = await adminAPI.getPendingOfferings();
      setOfferings(response.data || []);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to load pending offerings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // 2. Handle Approve / Reject
  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      // Calls: POST /api/auth/offerings/approve
      await adminAPI.approveOffering(id, action);
      
      // Optimistic UI Update: Remove from list immediately
      setOfferings(prev => prev.filter(o => o.id !== id));
      
      showSnackbar(
        `Course offering has been ${action}d.`, 
        action === 'approve' ? 'success' : 'info'
      );
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to process request', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* HEADER */}
        <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
            Pending Course Offerings
            </Typography>
            <Typography variant="body2" color="text.secondary">
            Review and approve faculty course proposals for the upcoming semester.
            </Typography>
        </Box>

        {/* TABLE */}
        {loading ? (
             <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
             </Box>
        ) : offerings.length === 0 ? (
            <Alert severity="info">No pending course proposals found.</Alert>
        ) : (
            <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                    <TableCell><strong>Course Code</strong></TableCell>
                    <TableCell><strong>Course Name</strong></TableCell>
                    <TableCell><strong>Instructor</strong></TableCell>
                    <TableCell><strong>Semester</strong></TableCell>
                    <TableCell><strong>Details</strong></TableCell>
                    <TableCell align="center"><strong>Action</strong></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {offerings.map((row) => (
                    <TableRow key={row.id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{row.course_code}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.instructor}</TableCell>
                    <TableCell>{row.semester_code}</TableCell>
                    <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip label={`Limit: ${row.seat_limit}`} size="small" variant="outlined" />
                            <Chip label={`Slot: ${row.slot}`} size="small" variant="outlined" />
                        </Box>
                    </TableCell>
                    <TableCell align="center">
                        <Button 
                            size="small" 
                            variant="contained" 
                            color="success"
                            onClick={() => handleAction(row.id, 'approve')}
                            disabled={processingId === row.id}
                            startIcon={processingId === row.id ? <CircularProgress size={16} /> : <CheckCircle />}
                            sx={{ mr: 1 }}
                        >
                            Approve
                        </Button>
                        <Button 
                            size="small" 
                            variant="outlined" 
                            color="error"
                            onClick={() => handleAction(row.id, 'reject')}
                            disabled={processingId === row.id}
                            startIcon={<Cancel />}
                        >
                            Reject
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        )}

        {/* NOTIFICATION */}
        <Snackbar 
            open={snackbar.open} 
            autoHideDuration={4000} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
            <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
                {snackbar.message}
            </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
};

export default AdminOfferings;