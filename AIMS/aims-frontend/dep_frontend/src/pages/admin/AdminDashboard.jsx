import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Divider, IconButton, Chip, Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as StudentsIcon,
  School as FacultyIcon,
  School,
  CalendarMonth as SemestersIcon,
  LibraryBooks as CoursesIcon,
  CheckCircle as ApprovalsIcon,
  AssignmentInd as AdvisorsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
  { text: 'Students', icon: <StudentsIcon />, path: '/admin/students' },
  { text: 'Faculty', icon: <FacultyIcon />, path: '/admin/faculty' },
  { text: 'Semesters', icon: <SemestersIcon />, path: '/admin/semesters' },
  { text: 'Courses', icon: <CoursesIcon />, path: '/admin/courses' },
  { text: 'Pending Offerings', icon: <ApprovalsIcon />, path: '/admin/offerings' },
  { text: 'Assign Advisors', icon: <AdvisorsIcon />, path: '/admin/advisors' },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Logo Area */}
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
        <School sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
            <Typography variant="h6" color="primary" fontWeight="bold" lineHeight={1}>
            Academix
            </Typography>
            <Typography variant="caption" color="text.secondary">
            Admin Portal
            </Typography>
        </Box>
      </Toolbar>
      <Divider />

      {/* Menu List */}
      <List sx={{ flexGrow: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />
      
      {/* User Profile Area */}
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                {user?.name?.charAt(0) || 'A'}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="subtitle2" noWrap fontWeight="bold">{user?.name || 'Admin User'}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">{user?.email}</Typography>
            </Box>
        </Box>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Top Bar (Mobile Only primarily) */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` }, 
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: 1 
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, textTransform: 'capitalize' }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>

          <Chip 
            icon={<PersonIcon />} 
            label="Admin" 
            color="primary" 
            variant="outlined" 
            size="small" 
          />
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer 
            variant="temporary" 
            open={mobileOpen} 
            onClose={handleDrawerToggle} 
            ModalProps={{ keepMounted: true }} 
            sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer 
            variant="permanent" 
            sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e0e0e0' } }} 
            open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8, bgcolor: '#f8fafc', minHeight: '100vh' }}>
        {/* If path is exactly '/admin', show welcome dashboard, else show sub-route (Outlet) */}
        {location.pathname === '/admin' ? (
            <Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>Welcome Back, Admin!</Typography>
                <Typography color="text.secondary">Select an option from the sidebar to manage the system.</Typography>
                
                {/* Quick Stats or Widgets could go here */}
                <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 3 }}>
                    {menuItems.slice(1).map((item) => (
                        <Box 
                            key={item.text} 
                            onClick={() => navigate(item.path)}
                            sx={{ 
                                p: 3, 
                                bgcolor: 'white', 
                                borderRadius: 2, 
                                boxShadow: 1, 
                                cursor: 'pointer',
                                transition: '0.2s',
                                '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
                                display: 'flex', alignItems: 'center', gap: 2
                            }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'primary.light', color: 'primary.main' }}>
                                {item.icon}
                            </Box>
                            <Typography variant="h6" fontWeight="500">{item.text}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        ) : (
            <Outlet />
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;