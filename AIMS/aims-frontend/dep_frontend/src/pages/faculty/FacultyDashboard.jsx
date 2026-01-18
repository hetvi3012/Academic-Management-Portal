import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton, Tabs, Tab, TextField, Button,
  Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, Snackbar, CircularProgress, Chip, MenuItem, Grid
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, Book, Assignment, Person, Logout, School, CheckCircle, Cancel, HourglassEmpty
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { facultyAPI, academicAPI } from '@/services/api';

const drawerWidth = 240;

// HELPER: Map Status to Readable Text
const getStatusLabel = (status) => {
  if (!status) return 'Unknown';
  switch (status.toLowerCase()) {
    case 'pending_advisor': return 'Pending Advisor';
    case 'pending_instructor': return 'Pending Instructor';
    case 'pending_faculty_advisor': return 'Pending Advisor'; // Handle backend enum
    case 'approved': return 'Approved';
    case 'enrolled': return 'Enrolled';
    case 'rejected': return 'Rejected';
    default: return status;
  }
};

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data states
  const [courses, setCourses] = useState([]);
  const [floatForm, setFloatForm] = useState({ 
    courseCode: '', 
    semester: '2026-W', 
    seatLimit: '60', 
    slot: 'A' 
  });
  
  const [instructorRequests, setInstructorRequests] = useState([]);
  const [advisorRequests, setAdvisorRequests] = useState([]);

  // 1. Initial Load (Catalog)
  useEffect(() => {
    fetchCourses();
  }, []);

  // 2. Tab Switch Logic
  useEffect(() => {
    if (activeTab === 1) {
      fetchInstructorRequests();
    } else if (activeTab === 2) {
      fetchAdvisorRequests();
    }
  }, [activeTab]);

  const fetchCourses = async () => {
    try {
      const response = await academicAPI.getCourses();
      setCourses(response.data || []);
    } catch (error) {
      console.error('Failed to fetch catalog');
    }
  };

  const fetchInstructorRequests = async () => {
    setLoading(true);
    try {
      const response = await facultyAPI.getInstructorRequests();
      setInstructorRequests(response.data || []);
    } catch (error) {
      showSnackbar('Failed to fetch instructor requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisorRequests = async () => {
    setLoading(true);
    try {
      const response = await facultyAPI.getAdvisorRequests();
      setAdvisorRequests(response.data || []);
    } catch (error) {
      showSnackbar('Failed to fetch advisor requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 3. ACTION: Float Course
  const handleFloatCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        courseCode: floatForm.courseCode,
        semester: floatForm.semester,
        seatLimit: parseInt(floatForm.seatLimit),
        slot: floatForm.slot,
        // Sending default empty arrays for now (can expand UI later)
        coreBatches: [], 
        coreDepartments: [],
        allowedBatches: [], // Empty = Open to all
        allowedDepartments: [] 
      };

      await facultyAPI.floatCourse(payload);
      showSnackbar('Course floated successfully! Waiting for Admin approval.');
      setFloatForm({ ...floatForm, courseCode: '' }); // Reset only course code
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to float course', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. ACTION: Approve/Reject Student (As Instructor)
  const handleInstructorAction = async (requestId, action) => {
    try {
      await facultyAPI.handleInstructorAction(requestId, action); 
      showSnackbar(`Request ${action}ed successfully`);
      
      // Optimistic UI Update
      setInstructorRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      showSnackbar('Failed to process request', 'error');
    }
  };

  // 5. ACTION: Approve/Reject Student (As Advisor)
  const handleAdvisorAction = async (requestId, action) => {
    try {
      await facultyAPI.handleAdvisorAction(requestId, action);
      showSnackbar(`Request ${action}ed successfully`);
      
      // Optimistic UI Update
      setAdvisorRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      showSnackbar('Failed to process request', 'error');
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <School sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" noWrap color="primary" fontWeight="bold">
          AIMS Faculty
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton selected>
            <ListItemIcon><Dashboard /></ListItemIcon>
            <ListItemText primary="Faculty Dashboard" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
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
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Faculty Portal
          </Typography>
          <Chip
            icon={<Person />}
            label={user?.name || 'Faculty'}
            color="secondary" // Changed for visibility
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
          />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Paper square sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<Book />} label="Float Course" />
            <Tab icon={<Assignment />} label="Instructor Approvals" />
            <Tab icon={<Person />} label="Advisor Approvals" />
          </Tabs>
        </Paper>

        {/* --- TAB 0: FLOAT COURSE --- */}
        {activeTab === 0 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Float a New Course Offering
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Propose a course for the upcoming semester. This will require Admin approval.
              </Typography>
              
              <form onSubmit={handleFloatCourse}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField
                        fullWidth
                        select
                        label="Select Course from Catalog"
                        value={floatForm.courseCode}
                        onChange={(e) => setFloatForm({ ...floatForm, courseCode: e.target.value })}
                        required
                        helperText="Only courses existing in the Catalog can be floated."
                        >
                        {courses.map((course) => (
                            <MenuItem key={course.course_code} value={course.course_code}>
                            <strong>{course.course_code}</strong> - {course.title}
                            </MenuItem>
                        ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                        fullWidth
                        select
                        label="Semester"
                        value={floatForm.semester}
                        onChange={(e) => setFloatForm({ ...floatForm, semester: e.target.value })}
                        required
                        >
                        <MenuItem value="2026-W">Winter 2026</MenuItem>
                        <MenuItem value="2025-A">Autumn 2025</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                        fullWidth
                        label="Slot"
                        value={floatForm.slot}
                        onChange={(e) => setFloatForm({ ...floatForm, slot: e.target.value })}
                        required
                        placeholder="e.g. A, B, C"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                        fullWidth
                        label="Seat Limit"
                        type="number"
                        value={floatForm.seatLimit}
                        onChange={(e) => setFloatForm({ ...floatForm, seatLimit: e.target.value })}
                        required
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Book />}
                    >
                    {loading ? 'Submitting...' : 'Float Course'}
                    </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        )}

        {/* --- TAB 1: INSTRUCTOR APPROVALS --- */}
        {activeTab === 1 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Requests for Your Courses
              </Typography>
              {instructorRequests.length === 0 ? (
                <Alert severity="info" variant="outlined">No pending requests for your courses.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Student</strong></TableCell>
                        <TableCell><strong>Entry No.</strong></TableCell>
                        <TableCell><strong>Course</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {instructorRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.name || request.student_name}</TableCell>
                          <TableCell>{request.entry_number}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{request.title || request.course_code}</TableCell>
                          <TableCell>
                            <Chip 
                                label="Pending Instructor" 
                                color="warning" 
                                size="small" 
                                variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleInstructorAction(request.id, 'approve')}
                              startIcon={<CheckCircle />}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleInstructorAction(request.id, 'reject')}
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
            </CardContent>
          </Card>
        )}

        {/* --- TAB 2: ADVISOR APPROVALS --- */}
        {activeTab === 2 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Requests from Your Advisees
              </Typography>
              {advisorRequests.length === 0 ? (
                <Alert severity="info" variant="outlined">No pending requests from your advisees.</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Student</strong></TableCell>
                        <TableCell><strong>Entry No.</strong></TableCell>
                        <TableCell><strong>Course Requested</strong></TableCell>
                        <TableCell align="center"><strong>Final Decision</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {advisorRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.name}</TableCell>
                          <TableCell>{request.entry_number}</TableCell>
                          <TableCell>
                             Requesting to join <strong>{request.title}</strong>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleAdvisorAction(request.id, 'approve')}
                              startIcon={<CheckCircle />}
                              sx={{ mr: 1 }}
                            >
                              Final Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleAdvisorAction(request.id, 'reject')}
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
            </CardContent>
          </Card>
        )}
      </Box>

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
  );
};

export default FacultyDashboard;