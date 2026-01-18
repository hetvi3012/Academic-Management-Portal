import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, CircularProgress, Grid, Chip
} from '@mui/material';
import { Add, PersonAdd } from '@mui/icons-material';
import { adminAPI, authAPI } from '@/services/api'; 

const AdminFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Backend Schema: name, email, department, designation
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
  });
  
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Data on Mount
  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      // Calls the endpoint: /api/admin/faculty-list
      const response = await adminAPI.getFacultyList();
      setFaculty(response.data || []);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to load faculty list', 'error');
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
      // 2. Call Auth API (creates User + Faculty entry)
      await authAPI.addFaculty(formData);
      
      showSnackbar('Faculty member added successfully', 'success');
      
      setModalOpen(false);
      setFormData({ name: '', email: '', department: '', designation: '' });
      fetchFaculty(); // Refresh the table
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to add faculty', 'error');
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
                Manage Faculty
                </Typography>
                <Typography variant="body2" color="text.secondary">
                View list of registered faculty members and add new ones.
                </Typography>
            </div>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => setModalOpen(true)}
            >
                Add Faculty
            </Button>
        </Box>

        {/* TABLE */}
        {loading ? (
             <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
             </Box>
        ) : faculty.length === 0 ? (
            <Alert severity="info">No faculty members found in the system.</Alert>
        ) : (
            <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Designation</strong></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {faculty.map((member) => (
                    <TableRow key={member.user_id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                        <Chip label={member.department} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{member.designation || 'N/A'}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        )}

        {/* CREATE MODAL */}
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Add New Faculty</DialogTitle>
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
                                placeholder="Dr. John Doe"
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
                                placeholder="faculty@iitrpr.ac.in"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Designation"
                                name="designation"
                                value={formData.designation}
                                onChange={handleInputChange}
                                placeholder="e.g. Asst. Prof"
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
                    {submitting ? 'Adding...' : 'Add Faculty'}
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

export default AdminFaculty;