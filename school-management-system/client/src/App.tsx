// App.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Drawer,
  TextField,
  Toolbar,
  CssBaseline,
  Container,
  Paper,
  Avatar,
  Button,
  AppBar,
  IconButton,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PushPinIcon from '@mui/icons-material/PushPin';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { UserProvider, useUser } from './context/UserContext';
import LoginPage from './modules/LoginPage';
import PupilManager from './modules/PupilManager';
import StaffManager from './modules/StaffManager';
import RegistrationManager from './modules/RegistrationManager';
import RoomManager from './modules/RoomManager';
import SeatPlanning from './modules/SeatPlanning';
import TimetableManager from './modules/TimetableManager';
import TeachingManager from './modules/TeachingManager';
import ControlPanel from './modules/ControlPanel';
import CoverManager from './modules/CoverManager';

const drawerWidth = 190;

function AppContent() {
  const { user, login, logout, permissions } = useUser();
  const [selectedModule, setSelectedModule] = useState(0);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [wizardBarDocked, setWizardBarDocked] = useState(true);
  const [wizardBarOpen, setWizardBarOpen] = useState(false);

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  const canView = (module: string) =>
    permissions.find((p) => p.module === module && p.can_view);

  const modules = [
    { label: 'Pupils', module: 'PupilManager', icon: <Avatar>P</Avatar>, component: <PupilManager /> },
    { label: 'Staff', module: 'StaffManager', icon: <Avatar>S</Avatar>, component: <StaffManager /> },
    { label: 'Registration', module: 'RegistrationManager', icon: <Avatar>R</Avatar>, component: <RegistrationManager /> },
    { label: 'Rooms', module: 'RoomManager', icon: <Avatar>Rm</Avatar>, component: <RoomManager /> },
    { label: 'Seat Planning', module: 'SeatPlanning', icon: <Avatar>SP</Avatar>, component: <SeatPlanning /> },
    { label: 'Timetable', module: 'TimetableManager', icon: <Avatar>T</Avatar>, component: <TimetableManager /> },
    { label: 'Teaching', module: 'TeachingManager', icon: <Avatar>Th</Avatar>, component: <TeachingManager /> },
    { label: 'Cover', module: 'CoverManager', icon: <Avatar>C</Avatar>, component: <CoverManager /> },
    ...(user.is_superuser
      ? [{ label: 'Control Panel', module: 'ControlPanel', icon: <Avatar>CP</Avatar>, component: <ControlPanel /> }]
      : []),
  ].filter(tab => canView(tab.module));

  const filteredModules = modules.filter(m =>
    m.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f6fa' }}>
      <CssBaseline />
      {/* Top AppBar */}
      <AppBar position="fixed" color="primary" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen((open) => !open)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <SchoolIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap>
              SmartTeach School
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              // Shift left if wizard bar is visible
              mr: (wizardBarDocked || wizardBarOpen) ? '110px' : 0,
              transition: (theme) => theme.transitions.create('margin', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user.display_name || user.username}
            </Typography>
            <Button
              color="inherit"
              variant="outlined"
              onClick={logout}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.1)' }
              }}
            >
              Logout
            </Button>
            <IconButton
              sx={{
                ml: 1,
                bgcolor: wizardBarDocked ? 'primary.main' : 'transparent',
                border: wizardBarDocked ? '2px solid white' : '2px solid transparent',
                color: wizardBarDocked ? 'white' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: wizardBarDocked ? 'primary.dark' : 'rgba(255,255,255,0.08)',
                  border: wizardBarDocked ? '2px solid white' : '2px solid #ccc',
                },
              }}
              onClick={() => {
                if (wizardBarDocked) setWizardBarDocked(false);
                else {
                  setWizardBarDocked(true);
                  setWizardBarOpen(false);
                }
              }}
            >
              <PushPinIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      {/* Side Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? drawerWidth : 0,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          [`& .MuiDrawer-paper`]: {
            width: drawerOpen ? drawerWidth : 0,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap>
              {drawerOpen ? 'SmartTeach' : ''}
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ display: drawerOpen ? 'inline-flex' : 'none' }}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        {drawerOpen && (
          <Box sx={{ p: 2 }}>
            <TextField
              size="small"
              placeholder="Search modules..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
              sx={{ mb: 2 }}
            />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {filteredModules.map((mod, idx) => (
                <Paper
                  key={mod.module}
                  elevation={selectedModule === modules.indexOf(mod) ? 6 : 1}
                  sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    bgcolor: selectedModule === modules.indexOf(mod) ? 'primary.light' : 'background.paper',
                    mb: 1,
                  }}
                  onClick={() => setSelectedModule(modules.indexOf(mod))}
                >
                  {mod.icon}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {mod.label}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}
      </Drawer>
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          ml: drawerOpen ? `${drawerWidth - 10}px` : 0,
          mr: (wizardBarDocked || wizardBarOpen) ? '110px' : '110px', // Always a little padding on the right
          minWidth: 0,
          transition: (theme) => theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ pl: 0, pr: 0 }}>
          <Box sx={{ pt: 2 }}>
            {modules[selectedModule]?.component}
          </Box>
        </Container>
      </Box>
      {/* Wizard Bar (Quick Actions) */}
      {(wizardBarDocked || wizardBarOpen) && (
        <Drawer
          anchor="right"
          variant="permanent"
          sx={{
            width: 80,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 80,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
              borderLeft: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: (theme) => theme.zIndex.drawer + 2,
            },
          }}
          PaperProps={{
            elevation: 3,
          }}
        >
          {/* This Toolbar ensures the wizard bar starts below the AppBar */}
          <Toolbar />
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 1 }}>
            {/* Quick Action Buttons at the top */}
            <Tooltip title="Add Pupil" placement="left">
              <IconButton color="primary" size="large">
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>+</Avatar>
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Staff" placement="left">
              <IconButton color="primary" size="large">
                <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>S</Avatar>
              </IconButton>
            </Tooltip>
            <Tooltip title="Create Room" placement="left">
              <IconButton color="primary" size="large">
                <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>R</Avatar>
              </IconButton>
            </Tooltip>
            <Tooltip title="View Seat Plan" placement="left">
              <IconButton color="primary" size="large">
                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>SP</Avatar>
              </IconButton>
            </Tooltip>
            <Tooltip title="View Timetable" placement="left">
              <IconButton color="primary" size="large">
                <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>TT</Avatar>
              </IconButton>
            </Tooltip>
            <Tooltip title="Teacher Timetable" placement="left">
              <IconButton color="primary" size="large">
                <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>T</Avatar>
              </IconButton>
            </Tooltip>
            {/* Close Button for temporary mode */}
            {!wizardBarDocked && (
              <IconButton
                size="small"
                onClick={() => setWizardBarOpen(false)}
                sx={{ mt: 2 }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Drawer>
      )}
      {/* Floating Button to open Wizard Bar in undocked mode */}
      {!wizardBarDocked && !wizardBarOpen && (
        <IconButton
          color="primary"
          size="large"
          onClick={() => setWizardBarOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: (theme) => theme.zIndex.drawer + 3,
            bgcolor: 'background.paper',
            boxShadow: 3,
            '&:hover': { bgcolor: 'grey.100' },
          }}
        >
          <VisibilityIcon />
        </IconButton>
      )}
    </Box>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
