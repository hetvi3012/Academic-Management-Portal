import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton, Button, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Alert, Snackbar, CircularProgress, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, TextField, MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Payment, Logout, School, 
  CheckCircle, Refresh as RefreshIcon, HourglassEmpty, Person
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { studentAPI } from '@/services/api';

const drawerWidth = 240;

// HELPER: Map SQL Status to Human Readable Text
const getStatusLabel = (status) => {
  if (!status) return 'Not Registered';
  const s = status.toLowerCase();
  
  switch (s) {
    case 'pending_instructor': return 'Waiting for Instructor';
    case 'pending_faculty_advisor': return 'Waiting for Advisor';
    case 'enrolled': return 'Registered';
    case 'rejected': return 'Rejected';
    case 'active': return 'Open'; 
    case 'proposed': return 'Proposed';
    default: return status;
  }
};

// HELPER: Get Color for Status
const getStatusColor = (status) => {
  if (!status) return 'default';
  const s = status.toLowerCase();
  
  if (s === 'enrolled') return 'success';
  if (s === 'active') return 'success';
  if (s === 'rejected') return 'error';
  if (s.includes('pending')) return 'warning';
  
  return 'default';
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data states
  const [feesPaid, setFeesPaid] = useState(false);
  const [offerings, setOfferings] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  
  // Dialog States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [registerCategory, setRegisterCategory] = useState('open_elective');
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // 1. INITIAL LOAD
  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await Promise.all([
        checkFeeStatus(), // Check DB for fees
        fetchData()       // Get courses
      ]);
      setLoading(false);
    };
    initFetch();
  }, []);

  // --- API FUNCTIONS ---

  // 2. CHECK FEES (The missing function fixed here)
  const checkFeeStatus = async () => {
    try {
      const response = await studentAPI.getFeeStatus();
      // Backend returns { paid: true/false }
      setFeesPaid(response.data.paid);
    } catch (error) {
      console.error("Failed to check fee status", error);
      setFeesPaid(false); // Default to false on error
    }
  };

  // 3. FETCH DATA
  const fetchData = async () => {
    try {
      const [offeringsRes, enrollmentsRes] = await Promise.all([
        studentAPI.getOfferings(),
        studentAPI.getMyCourses()
      ]);

      setOfferings(offeringsRes.data || []);
      setMyEnrollments(enrollmentsRes.data || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      showSnackbar('Failed to load data. Please refresh.', 'error');
    }
  };

  // --- ACTIONS ---

  const handlePayFees = async () => {
    setLoading(true);
    try {
      await studentAPI.payFees({ amount: 50000 });
      setFeesPaid(true); // Update UI immediately
      showSnackbar('Fees paid successfully! You can now register.');
      setPaymentDialogOpen(false);
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    try {
      await studentAPI.register({ 
        offeringId: selectedCourse.id,
        category: registerCategory
      });
      
      showSnackbar(`Request sent for ${selectedCourse.title}`);
      setRegisterDialogOpen(false);
      setSelectedCourse(null);
      await fetchData(); // Refresh list to see "Pending" status
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to register';
      if (errMsg.includes('Fee')) {
         setFeesPaid(false); // Sync UI if backend says fees pending
         showSnackbar('Fee Payment Pending. Please Pay.', 'error');
      } else {
         showSnackbar(errMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const openRegisterDialog = (course) => {
    if (!feesPaid) {
      showSnackbar('Please pay your fees first', 'warning');
      setPaymentDialogOpen(true); // Open payment dialog directly for convenience
      return;
    }
    setSelectedCourse(course);
    setRegisterCategory('open_elective'); // Reset default
    setRegisterDialogOpen(true);
  };

  // --- UI HELPERS ---

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Helper: Find enrollment status for a specific course ID
  const getStudentStatusForOffering = (offeringId) => {
    const enrollment = myEnrollments.find(e => e.id === offeringId || e.offering_id === offeringId);
    return enrollment ? enrollment.status : null;
  };

  const drawer = (
    <Box>
      <Toolbar>
        <School sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" noWrap color="primary" fontWeight="bold">
          AIMS Portal
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton selected>
            <ListItemIcon><Dashboard /></ListItemIcon>
            <ListItemText primary="Student Dashboard" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
         <ListItem disablePadding>
           <ListItemButton onClick={() => setPaymentDialogOpen(true)}>
             <ListItemIcon><Payment /></ListItemIcon>
             <ListItemText primary="Fee Payment" />
           </ListItemButton>
         </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>Student Dashboard</Typography>
          <Button color="inherit" startIcon={<RefreshIcon />} onClick={() => { setLoading(true); Promise.all([checkFeeStatus(), fetchData()]).then(() => setLoading(false)); }} disabled={loading}>
            Refresh
          </Button>
          <Box sx={{ ml: 2 }}>
             <Chip icon={<Person />} label={user?.name} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        
        {/* FEE STATUS BANNER */}
        {!feesPaid ? (
          <Alert severity="warning" sx={{ mb: 3 }} action={
              <Button color="inherit" size="small" onClick={() => setPaymentDialogOpen(true)}>
                PAY ₹50,000
              </Button>
            }>
            <Typography variant="subtitle2" fontWeight="bold">
              Fee Payment Pending: You cannot register for courses until fees are cleared.
            </Typography>
          </Alert>
        ) : (
          <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
             Fees Status: <strong>PAID</strong>. Course registration is enabled.
          </Alert>
        )}

        <Grid container spacing={3}>
          
          {/* SECTION 1: My Registrations */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>My Courses & Applications</Typography>
                {myEnrollments.length === 0 ? (
                  <Alert severity="info" variant="outlined">No active course registrations found.</Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          <TableCell><strong>Code</strong></TableCell>
                          <TableCell><strong>Course Name</strong></TableCell>
                          <TableCell><strong>Credits</strong></TableCell>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myEnrollments.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell>{enrollment.course_code}</TableCell>
                            <TableCell>{enrollment.title}</TableCell>
                            <TableCell>{enrollment.credits}</TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>{enrollment.category?.replace('_', ' ')}</TableCell>
                            <TableCell>
                              <Chip 
                                label={getStatusLabel(enrollment.status)} 
                                color={getStatusColor(enrollment.status)}
                                size="small"
                                icon={enrollment.status === 'enrolled' ? <CheckCircle /> : <HourglassEmpty />}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* SECTION 2: Course Offerings */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Available Offerings (Winter 2026)</Typography>
                {offerings.length === 0 ? (
                   <Alert severity="info">No courses are currently being offered.</Alert>
                ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Code</strong></TableCell>
                        <TableCell><strong>Title</strong></TableCell>
                        <TableCell><strong>Instructor</strong></TableCell>
                        <TableCell><strong>Slot</strong></TableCell>
                        <TableCell><strong>Seats</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Action</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {offerings.map((offering) => {
                        const studentStatus = getStudentStatusForOffering(offering.id);
                        const isCourseActive = (offering.status || '').toLowerCase() === 'active';
                        const isFull = (offering.enrolled || 0) >= (offering.seat_limit || 0);

                        return (
                          <TableRow key={offering.id}>
                            <TableCell sx={{ fontWeight: 'bold' }}>{offering.course_code}</TableCell>
                            <TableCell>{offering.title}</TableCell>
                            <TableCell>{offering.instructor}</TableCell>
                            <TableCell>{offering.slot}</TableCell>
                            <TableCell>
                              {offering.seat_limit > 0 ? `${offering.enrolled || 0}/${offering.seat_limit}` : '-'}
                            </TableCell>
                            
                            <TableCell>
                              {studentStatus ? (
                                <Chip label={getStatusLabel(studentStatus)} color={getStatusColor(studentStatus)} size="small" variant="outlined" />
                              ) : (
                                <Chip label={getStatusLabel(offering.status)} color={isCourseActive ? 'success' : 'default'} size="small" variant="outlined" />
                              )}
                            </TableCell>

                            <TableCell align="center">
                              {studentStatus ? (
                                <Button size="small" disabled startIcon={<CheckCircle />}>Applied</Button>
                              ) : (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => openRegisterDialog(offering)}
                                  disabled={!feesPaid || !isCourseActive || isFull}
                                  color="primary"
                                >
                                  {isFull ? "Full" : "Register"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Semester Fee Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1" gutterBottom>Amount Due for Winter 2026</Typography>
            <Typography variant="h3" color="primary" fontWeight="bold">₹50,000</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePayFees} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Pay Now"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={registerDialogOpen} onClose={() => setRegisterDialogOpen(false)}>
        <DialogTitle>Register for Course</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {selectedCourse && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" color="primary">{selectedCourse.course_code}: {selectedCourse.title}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>Instructor: {selectedCourse.instructor}</Typography>
              
              <TextField 
                select 
                label="Course Category" 
                fullWidth 
                value={registerCategory} 
                onChange={(e) => setRegisterCategory(e.target.value)}
                sx={{ mt: 2 }}
              >
                <MenuItem value="core">Core Course</MenuItem>
                <MenuItem value="open_elective">Open Elective</MenuItem>
                <MenuItem value="minor">Minor</MenuItem>
                <MenuItem value="concentration">Concentration</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRegister} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentDashboard;