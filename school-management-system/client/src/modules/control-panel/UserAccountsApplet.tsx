import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Stack, Checkbox, MenuItem } from '@mui/material';

export default function UserAccountsApplet() {
  const [users, setUsers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [form, setForm] = useState({ username: '', password: '', display_name: '', email: '', is_superuser: false, staff_id: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ display_name: '', email: '', is_superuser: false });

  useEffect(() => {
    fetch('/users').then(r => r.json()).then(setUsers);
    fetch('/staff')
      .then(r => r.json())
      .then(data => setStaff(
        Array.isArray(data)
          ? data.map(s => ({
              ...s,
              firstName: s.first_name ?? s.firstName ?? '',
              lastName: s.last_name ?? s.lastName ?? '',
              preferredName: s.preferred_name ?? s.preferredName ?? '',
              jobTitle: s.job_title ?? s.jobTitle ?? '',
              department: s.department ?? s.department ?? '',
            }))
          : []
      ));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStaffSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const staff_id = e.target.value;
    setForm(f => ({ ...f, staff_id }));
    const s = staff.find((s: any) => s.id === staff_id);
    if (s) {
      setForm(f => ({
        ...f,
        display_name: s.preferred_name || s.preferredName || 
          ((s.first_name || s.firstName || '') + ' ' + (s.last_name || s.lastName || '')),
      }));
    }
  };

  const handleCreate = async () => {
    await fetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ username: '', password: '', display_name: '', email: '', is_superuser: false, staff_id: '' });
    fetch('/users').then(r => r.json()).then(setUsers);
    fetch('/staff')
      .then(r => r.json())
      .then(data => setStaff(
        Array.isArray(data)
          ? data.map(s => ({
              ...s,
              firstName: s.first_name ?? s.firstName ?? '',
              lastName: s.last_name ?? s.lastName ?? '',
              preferredName: s.preferred_name ?? s.preferredName ?? '',
              jobTitle: s.job_title ?? s.jobTitle ?? '',
              department: s.department ?? s.department ?? '',
            }))
          : []
      ));
  };

  const startEdit = (user: any) => {
    setEditId(user.id);
    setEditForm({
      display_name: user.display_name || user.displayName || '',
      email: user.email || '',
      is_superuser: !!user.is_superuser,
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const saveEdit = async (id: string) => {
    await fetch(`/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditId(null);
    fetch('/users').then(r => r.json()).then(setUsers);
  };

  const cancelEdit = () => setEditId(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    await fetch(`/users/${id}`, { method: 'DELETE' });
    setUsers(users => users.filter(u => u.id !== id));
  };

  // Helper to get staff member display string (handles both camelCase and snake_case)
  const getStaffDisplay = (staffMember: any) => {
    if (!staffMember) return '';
    const name =
      staffMember.preferred_name ||
      staffMember.preferredName ||
      ((staffMember.first_name || staffMember.firstName || '') +
        ' ' +
        (staffMember.last_name || staffMember.lastName || ''));
    const job = staffMember.job_title || staffMember.jobTitle ? ` (${staffMember.job_title || staffMember.jobTitle})` : '';
    const dept = staffMember.department ? `, ${staffMember.department}` : '';
    return name.trim() + job + dept;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>User Accounts</Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          select
          label="Staff"
          name="staff_id"
          value={form.staff_id}
          onChange={handleStaffSelect}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">(None)</MenuItem>
          {staff.map((s: any) => (
            <MenuItem key={s.id} value={s.id}>
              {getStaffDisplay(s)}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Username" name="username" value={form.username} onChange={handleChange} />
        <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} />
        <TextField label="Display Name" name="display_name" value={form.display_name} onChange={handleChange} />
        <TextField label="Email" name="email" value={form.email} onChange={handleChange} />
        <Button variant="contained" onClick={handleCreate}>Create</Button>
      </Stack>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Username</TableCell>
            <TableCell>Display Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Super User</TableCell>
            <TableCell>Staff ID</TableCell>
            <TableCell>Staff Member</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(user => {
            const staffMember = staff.find((s: any) => s.id === user.staff_id);
            if (editId === user.id) {
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <TextField
                      name="display_name"
                      value={editForm.display_name}
                      onChange={handleEditChange}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      name="is_superuser"
                      checked={editForm.is_superuser}
                      onChange={handleEditChange}
                    />
                  </TableCell>
                  <TableCell>{user.staff_id || ''}</TableCell>
                  <TableCell>{getStaffDisplay(staffMember)}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => saveEdit(user.id)}>Save</Button>
                    <Button size="small" onClick={cancelEdit}>Cancel</Button>
                  </TableCell>
                </TableRow>
              );
            }
            return (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.display_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Checkbox checked={user.is_superuser} disabled />
                </TableCell>
                <TableCell>{user.staff_id || ''}</TableCell>
                <TableCell>{getStaffDisplay(staffMember)}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => startEdit(user)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(user.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}