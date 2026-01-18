import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, CircularProgress, Grid, Chip
} from '@mui/material';
import { Add, PersonAdd } from '@mui/icons-material';
import { adminAPI, authAPI } from '@/services/api'; 

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Backend Schema: name, email, entryNumber, department, batchYear
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    entryNumber: '',
    department: '',
    batchYear: new Date().getFullYear().toString(),
  });
  
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Data on Mount
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Calls GET /api/auth/students
      const response = await adminAPI.getStudents();
      setStudents(response.data || []);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to load student list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // 2. Call Auth API (Creates User + Student record)
      await authAPI.addStudent({
        ...formData,
        batchYear: parseInt(formData.batchYear) // Ensure integer for DB
      });
      
      showSnackbar('Student added successfully', 'success');
      
      setModalOpen(false);
      setFormData({ name: '', email: '', entryNumber: '', department: '', batchYear: '' });
      fetchStudents(); // Refresh table
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to add student', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <div>
                <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
                Manage Students
                </Typography>
                <Typography variant="body2" color="text.secondary">
                View list of enrolled students and register new ones.
                </Typography>
            </div>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => setModalOpen(true)}
            >
                Add Student
            </Button>
        </Box>

        {/* TABLE */}
        {loading ? (
             <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
             </Box>
        ) : students.length === 0 ? (
            <Alert severity="info">No students found in the system.</Alert>
        ) : (
            <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Entry No.</strong></TableCell>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Batch</strong></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {students.map((student) => (
                    <TableRow key={student.user_id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.entry_number}</TableCell>
                    <TableCell>
                        <Chip label={student.department} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{student.batch_year}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        )}

        {/* CREATE MODAL */}
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Register New Student</DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Rahul Sharma"
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="student@iitrpr.ac.in"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Entry Number"
                                name="entryNumber"
                                value={formData.entryNumber}
                                onChange={handleInputChange}
                                placeholder="2023CSB1101"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Batch Year"
                                name="batchYear"
                                type="number"
                                value={formData.batchYear}
                                onChange={handleInputChange}
                                placeholder="2023"
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                placeholder="e.g. CSE"
                                required
                            />
                        </Grid>
                    </Grid>
                </form>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setModalOpen(false)} variant="outlined">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={20} /> : <PersonAdd />}
                >
                    {submitting ? 'Adding...' : 'Add Student'}
                </Button>
            </DialogActions>
        </Dialog>

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

export default AdminStudents;