import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Chip, Snackbar, Alert, CircularProgress
} from '@mui/material';
// FIXED: Replaced 'UserCheck' (Lucide) with 'HowToReg' (MUI)
import { PersonAdd, HowToReg } from '@mui/icons-material'; 
import { adminAPI } from '@/services/api';

const AdminAdvisors = () => {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedFacultyEmail, setSelectedFacultyEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, facultyRes] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getFacultyList()
      ]);
      setStudents(studentsRes.data || []);
      setFaculty(facultyRes.data || []);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to load user lists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenModal = (student) => {
    setSelectedStudent(student);
    setSelectedFacultyEmail(student.advisor_email || '');
    setModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedFacultyEmail) return;
    setSubmitting(true);
    try {
      await adminAPI.assignAdvisor({ 
        studentEntryNum: selectedStudent.entry_number, 
        facultyEmail: selectedFacultyEmail 
      });
      showSnackbar(`Advisor assigned to ${selectedStudent.name}`, 'success');
      setModalOpen(false);
      fetchData(); 
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to assign advisor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <div>
                <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
                Assign Faculty Advisors
                </Typography>
                <Typography variant="body2" color="text.secondary">
                Link Students to Faculty Advisors for academic guidance.
                </Typography>
            </div>
        </Box>

        {loading ? (
             <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
             </Box>
        ) : students.length === 0 ? (
            <Alert severity="info">No students found in the database.</Alert>
        ) : (
            <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Entry No.</strong></TableCell>
                    <TableCell><strong>Department</strong></TableCell>
                    <TableCell><strong>Current Advisor</strong></TableCell>
                    <TableCell align="center"><strong>Action</strong></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {students.map((student) => (
                    <TableRow key={student.user_id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.entry_number}</TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell>
                        {student.advisor_name ? (
                            <Chip 
                                icon={<HowToReg style={{ fontSize: 16 }} />} 
                                label={student.advisor_name} 
                                color="success" 
                                size="small" 
                                variant="outlined" 
                            />
                        ) : (
                            <Chip label="Not Assigned" size="small" />
                        )}
                    </TableCell>
                    <TableCell align="center">
                        <Button 
                        size="small" 
                        variant={student.advisor_name ? 'outlined' : 'contained'}
                        onClick={() => handleOpenModal(student)}
                        startIcon={<PersonAdd />}
                        >
                        {student.advisor_name ? 'Change' : 'Assign'}
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        )}

        {/* MODAL */}
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Assign Faculty Advisor</DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ mb: 3 }}>
                    Select a faculty member for <strong>{selectedStudent?.name}</strong> ({selectedStudent?.entry_number}).
                </Typography>
                <FormControl fullWidth>
                    <InputLabel>Select Faculty Member</InputLabel>
                    <Select
                        value={selectedFacultyEmail}
                        label="Select Faculty Member"
                        onChange={(e) => setSelectedFacultyEmail(e.target.value)}
                    >
                        {faculty.map((f) => (
                            <MenuItem key={f.email} value={f.email}>
                                {f.name} ({f.department})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleAssign} 
                    disabled={!selectedFacultyEmail || submitting}
                >
                    {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
            </DialogActions>
        </Dialog>

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

export default AdminAdvisors;