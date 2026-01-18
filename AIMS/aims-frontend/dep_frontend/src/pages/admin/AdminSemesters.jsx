import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, CircularProgress, Grid, Chip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { adminAPI } from '@/services/api'; 

const AdminSemesters = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    term: 'Winter',
    startDate: '',
    endDate: '',
    status: 'Upcoming'
  });
  
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Data
  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getSemesters();
      setSemesters(response.data || []);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to load semesters', 'error');
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
    
    // Auto-generate Code: e.g., "2026-W"
    const termCode = formData.term === 'Winter' ? 'W' : formData.term === 'Autumn' ? 'A' : 'S';
    const semesterCode = `${formData.year}-${termCode}`;

    try {
      await adminAPI.createSemester({
        ...formData,
        semesterCode // Send generated code to backend
      });
      
      showSnackbar(`Semester ${semesterCode} created successfully`, 'success');
      
      setModalOpen(false);
      fetchSemesters(); // Refresh list
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to create semester', 'error');
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
                Manage Semesters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                Configure academic terms, dates, and status.
                </Typography>
            </div>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => setModalOpen(true)}
            >
                Create Semester
            </Button>
        </Box>

        {/* TABLE */}
        {loading ? (
             <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
             </Box>
        ) : semesters.length === 0 ? (
            <Alert severity="info">No semesters configured yet.</Alert>
        ) : (
            <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Term</strong></TableCell>
                    <TableCell><strong>Start Date</strong></TableCell>
                    <TableCell><strong>End Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {semesters.map((sem) => (
                    <TableRow key={sem.id || sem.semester_code}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{sem.semester_code}</TableCell>
                    <TableCell>{sem.term} {sem.year}</TableCell>
                    <TableCell>{new Date(sem.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(sem.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Chip 
                            label={sem.is_active ? 'Active' : 'Inactive'} 
                            color={sem.is_active ? 'success' : 'default'} 
                            size="small" 
                            variant="outlined" 
                        />
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        )}

        {/* CREATE MODAL */}
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Create New Semester</DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Year"
                                name="year"
                                type="number"
                                value={formData.year}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Term</InputLabel>
                                <Select
                                    label="Term"
                                    name="term"
                                    value={formData.term}
                                    onChange={handleInputChange}
                                >
                                    <MenuItem value="Winter">Winter (Jan-May)</MenuItem>
                                    <MenuItem value="Autumn">Autumn (Aug-Dec)</MenuItem>
                                    <MenuItem value="Summer">Summer (Jun-Jul)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleInputChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="End Date"
                                name="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={handleInputChange}
                                required
                                InputLabelProps={{ shrink: true }}
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
                    startIcon={submitting ? <CircularProgress size={20} /> : <Add />}
                >
                    {submitting ? 'Creating...' : 'Create Semester'}
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

export default AdminSemesters;