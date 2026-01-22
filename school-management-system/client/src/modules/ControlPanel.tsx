import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import UserAccountsApplet from './control-panel/UserAccountsApplet';
import PermissionsApplet from './control-panel/PermissionsApplet';
import GlobalListsApplet from './control-panel/GlobalListsApplet';
import AcademicStructureApplet from './control-panel/AcademicStructureApplet';

const applets = [
  { label: 'User Accounts', component: <UserAccountsApplet /> },
  { label: 'Permissions', component: <PermissionsApplet /> },
  { label: 'Global Lists', component: <GlobalListsApplet /> },
  { label: 'Academic Structure', component: <AcademicStructureApplet /> },
  // { label: 'System Logs', component: <SystemLogsApplet /> },
];

export default function ControlPanel() {
  const [tab, setTab] = useState(0);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Control Panel</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {applets.map((applet, idx) => (
          <Tab key={applet.label} label={applet.label} />
        ))}
      </Tabs>
      <Box>
        {applets[tab].component}
      </Box>
    </Paper>
  );
}