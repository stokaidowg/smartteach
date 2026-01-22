import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, IconButton, Select } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periods = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StaffAppointments({ staffId }: { staffId: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ day_of_week: 0, period: '', title: '', notes: '', room_id: '' });
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/staff-appointments?staffId=${staffId}`).then(r => r.json()).then(setAppointments);
  }, [staffId, open]);

  useEffect(() => {
    fetch('/teaching-rooms').then(r => r.json()).then(setRooms);
  }, []);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    await fetch('/staff-appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        staff_id: staffId,
        period: form.period === '' ? null : Number(form.period),
        room_id: form.room_id === '' ? null : form.room_id
      }),
    });
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/staff-appointments/${id}`, { method: 'DELETE' });
    setAppointments(apps => apps.filter(a => a.id !== id));
  };

  return (
    <div>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ mb: 2 }}>Add Appointment</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Day</TableCell>
            <TableCell>Period</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Room</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appointments.map(app => (
            <TableRow key={app.id}>
              <TableCell>{days[app.day_of_week]}</TableCell>
              <TableCell>{app.period ?? ''}</TableCell>
              <TableCell>{app.title}</TableCell>
              <TableCell>
                {rooms.find(r => r.id === app.room_id)?.room_code || ''}
              </TableCell>
              <TableCell>{app.notes}</TableCell>
              <TableCell>
                <IconButton color="error" onClick={() => handleDelete(app.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Staff Appointment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Day"
              name="day_of_week"
              value={form.day_of_week}
              onChange={handleChange}
              fullWidth
            >
              {days.map((d, i) => <MenuItem key={i} value={i}>{d}</MenuItem>)}
            </TextField>
            <TextField
              label="Period (optional)"
              name="period"
              type="number"
              value={form.period}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              fullWidth
              required
            />
            <Select
              name="room_id"
              value={form.room_id}
              onChange={handleChange}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">(No Room)</MenuItem>
              {rooms.map(r => (
                <MenuItem key={r.id} value={r.id}>
                  {r.room_code} - {r.room_name}
                </MenuItem>
              ))}
            </Select>
            <TextField
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}