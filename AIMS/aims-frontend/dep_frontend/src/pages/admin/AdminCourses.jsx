import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, CircularProgress, Grid, Chip
} from '@mui/material';
import { Add, Book } from '@mui/icons-material';
import { adminAPI, academicAPI } from '@/services/api'; 

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // State matches Backend Schema exactly
  const [formData, setFormData] = useState({
    courseCode: '',
    title: '',
    credits: '',
    ltp: '', 
  });
  
  const [submitting, setSubmitting] = useState(false);

  // Load Courses from Backend on Mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch existing courses to display in the table
      const response = await academicAPI.getCourses(); 
      setCourses(response.data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
      showSnackbar('Failed to load existing courses', 'error');
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
      // 1. Construct Payload exactly as Backend expects
      const payload = {
        courseCode: formData.courseCode,
        title: formData.title,
        credits: parseFloat(formData.credits), // Ensure it's a number
        ltp: formData.ltp
      };

      // 2. Call the Real API
      const response = await adminAPI.createCourse(payload);
      
      showSnackbar('Course created successfully', 'success');
      
      // Add new course to list
      setCourses(prev => [...prev, response.data]);
      
      setModalOpen(false);
      // Reset form
      setFormData({ courseCode: '', title: '', credits: '', ltp: '' });

    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.error || 'Failed to create course', 'error');
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
                Manage Courses
                </Typography>
                <Typography variant="body2" color="text.secondary">
                Create and manage the central course catalog.
                </Typography>
            </div>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => setModalOpen(true)}
            >
                Create Course
            </Button>
        </Box>

        {/* TABLE */}
        {loading ? (
             <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
             </Box>
        ) : courses.length === 0 ? (
            <Alert severity="info">No courses found in catalog.</Alert>
        ) : (
            <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                    <TableCell><strong>Course Code</strong></TableCell>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>L-T-P</strong></TableCell>
                    <TableCell><strong>Credits</strong></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {courses.map((course) => (
                    <TableRow key={course.course_code}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{course.course_code}</TableCell>
                    <TableCell>{course.title}</TableCell>
                    <TableCell>{course.ltp}</TableCell>
                    <TableCell>
                        <Chip label={course.credits} size="small" variant="outlined" />
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        )}

        {/* CREATE MODAL */}
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Create New Course</DialogTitle>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Course Code"
                                name="courseCode"
                                value={formData.courseCode}
                                onChange={handleInputChange}
                                placeholder="e.g., CS101"
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Credits"
                                name="credits"
                                type="number"
                                value={formData.credits}
                                onChange={handleInputChange}
                                placeholder="4"
                                required
                                inputProps={{ step: "0.5", min: "1" }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Course Title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="e.g., Introduction to Programming"
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="L-T-P Structure"
                                name="ltp"
                                value={formData.ltp}
                                onChange={handleInputChange}
                                placeholder="e.g., 3-0-2"
                                required
                                helperText="Lecture-Tutorial-Practical (e.g. 3-1-0)"
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
                    startIcon={submitting ? <CircularProgress size={20} /> : <Book />}
                >
                    {submitting ? 'Creating...' : 'Create Course'}
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

export default AdminCourses;