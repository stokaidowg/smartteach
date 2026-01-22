import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Checkbox, Button, Autocomplete, TextField, Stack } from '@mui/material';

export default function PermissionsApplet() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [edited, setEdited] = useState<{ [id: string]: { can_view: boolean; can_edit: boolean } }>({});

  // Fetch users on mount
  useEffect(() => {
    fetch('/users').then(r => r.json()).then(setUsers);
  }, []);

  // Fetch permissions for selected user
  useEffect(() => {
    if (selectedUser) {
      fetch(`/permissions?user_id=${selectedUser.id}`)
        .then(r => r.json())
        .then(setPermissions);
      setEdited({});
    } else {
      setPermissions([]);
      setEdited({});
    }
  }, [selectedUser]);

  // Handle checkbox change for can_view/can_edit
  const handleChange = (id: string, field: 'can_view' | 'can_edit', value: boolean) => {
    setEdited(prev => ({
      ...prev,
      [id]: {
        can_view: field === 'can_view' ? value : prev[id]?.can_view ?? permissions.find(p => p.id === id)?.can_view ?? false,
        can_edit: field === 'can_edit' ? value : prev[id]?.can_edit ?? permissions.find(p => p.id === id)?.can_edit ?? false,
      }
    }));
  };

  // Save all edited permissions
  const handleSave = async () => {
    for (const [id, changes] of Object.entries(edited)) {
      await fetch(`/permissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
    }
    setEdited({});
    // Refresh permissions for this user
    if (selectedUser) {
      fetch(`/permissions?user_id=${selectedUser.id}`)
        .then(r => r.json())
        .then(setPermissions);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Permissions</Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <Autocomplete
          options={users}
          getOptionLabel={u => u.display_name || u.username}
          value={selectedUser}
          onChange={(_, v) => setSelectedUser(v)}
          renderInput={params => <TextField {...params} label="Select User" />}
          sx={{ minWidth: 250 }}
        />
      </Stack>
      {selectedUser && (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Module</TableCell>
                <TableCell>Can View</TableCell>
                <TableCell>Can Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{p.module}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={
                        edited[p.id]?.can_view !== undefined
                          ? edited[p.id].can_view
                          : p.can_view
                      }
                      onChange={e => handleChange(p.id, 'can_view', e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={
                        edited[p.id]?.can_edit !== undefined
                          ? edited[p.id].can_edit
                          : p.can_edit
                      }
                      onChange={e => handleChange(p.id, 'can_edit', e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={handleSave}
            disabled={Object.keys(edited).length === 0}
          >
            Save Changes
          </Button>
        </>
      )}
    </Box>
  );
}