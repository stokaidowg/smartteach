import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack, Table, TableHead, TableRow, TableCell, TableBody, Select, Tabs, Tab
} from '@mui/material';

export default function CoverManager() {
  const [tab, setTab] = useState(0);
  const [absences, setAbsences] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ staff_id: '', start_date: '', end_date: '', reason: '', notes: '' });

  // Cover allocation state
  const [periods, setPeriods] = useState<any[]>([]);
  const [periodsAbsenceId, setPeriodsAbsenceId] = useState<string | null>(null);
  const [coverDialog, setCoverDialog] = useState(false);
  const [coverPeriod, setCoverPeriod] = useState<any>(null);
  const [selectedAbsence, setSelectedAbsence] = useState<any>(null);
  const [availableCover, setAvailableCover] = useState<any[]>([]);
  const [selectedCover, setSelectedCover] = useState('');

  useEffect(() => {
    fetch('/staff-absences').then(r => r.json()).then(setAbsences);
    fetch('/staff')
      .then(r => r.json())
      .then(data => setStaff(
        Array.isArray(data)
          ? data.map(s => ({
              ...s,
              firstName: s.first_name ?? s.firstName ?? '',
              lastName: s.last_name ?? s.lastName ?? '',
              isTeachingStaff: s.is_teaching_staff ?? s.isTeachingStaff ?? false,
              isCoverStaff: s.is_cover_staff ?? s.isCoverStaff ?? false,
            }))
          : []
      ));
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    await fetch('/staff-absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setOpen(false);
    fetch('/staff-absences').then(r => r.json()).then(setAbsences);
  };

  // Fetch affected periods for an absence (using timetable_id)
  const getAffectedPeriods = async (absence: any) => {
    // Fetch all timetable entries for this staff
    const res = await fetch(
      `/timetable?teacherId=${absence.staff_id}`
    );
    const timetableEntries = await res.json();

    // Calculate all dates in the absence range
    const start = new Date(absence.start_date);
    const end = new Date(absence.end_date);
    const periods: any[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().slice(0, 10);
      const jsDay = d.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
      timetableEntries.forEach((entry: any) => {
        if (entry.day_of_week === jsDay) {
          periods.push({
            date: dateStr,
            period: entry.period,
            timetable_id: entry.id,
            day_of_week: entry.day_of_week,
          });
        }
      });
    }
    return periods;
  };

  const handleAllocateCover = async (absence: any, periodObj: any) => {
    setSelectedAbsence(absence);
    setCoverPeriod(periodObj);
    setCoverDialog(true);
    const res = await fetch(`/cover/available-staff?date=${periodObj.date}&timetable_id=${periodObj.timetable_id}`);
    const data = await res.json();
    setAvailableCover(Array.isArray(data) ? data : []);
    setSelectedCover('');
  };

  const handleSaveCover = async () => {
    await fetch('/cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        absence_id: selectedAbsence.id,
        date: coverPeriod.date,
        timetable_id: coverPeriod.timetable_id,
        cover_staff_id: selectedCover
      })
    });
    setCoverDialog(false);
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Allocate Cover" />
        <Tab label="Staff Absences" />
      </Tabs>

      {/* Allocate Cover Tab */}
      {tab === 0 && (
        <Box>
          <Typography variant="h5" mb={2}>Allocate Cover</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Allocate Cover</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {absences.map(abs => (
                <TableRow key={abs.id}>
                  <TableCell>
                    {[abs.title, abs.first_name, abs.last_name].filter(Boolean).join(' ')}
                    {abs.preferred_name ? ` (${abs.preferred_name})` : ''}
                  </TableCell>
                  <TableCell>{abs.start_date ? new Date(abs.start_date).toISOString().slice(0, 10) : ''}</TableCell>
                  <TableCell>{abs.end_date ? new Date(abs.end_date).toISOString().slice(0, 10) : ''}</TableCell>
                  <TableCell>{abs.reason}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={async () => {
                        setPeriodsAbsenceId(abs.id);
                        setPeriods(await getAffectedPeriods(abs));
                      }}
                    >
                      View Periods
                    </Button>
                    {periodsAbsenceId === abs.id && periods.length > 0 && (
                      <Box>
                        <Typography variant="body2">Affected Periods:</Typography>
                        {periods.map((p, i) => (
                          <Box key={i} sx={{ display: 'inline-block', mr: 1, mb: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleAllocateCover(abs, p)}
                            >
                              {p.date} P{p.period}
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    )}
                    {periodsAbsenceId === abs.id && periods.length === 0 && (
                      <Typography variant="body2" color="error">
                        No timetable periods for this absence.
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Dialog open={coverDialog} onClose={() => setCoverDialog(false)}>
            <DialogTitle>Allocate Cover</DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <Typography>
                  Date: {coverPeriod?.date} | Period: {coverPeriod?.period}
                </Typography>
                <Select
                  value={selectedCover}
                  onChange={e => setSelectedCover(e.target.value)}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">Select Cover Staff</MenuItem>
                  {availableCover.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {[s.title, s.first_name, s.last_name].filter(Boolean).join(' ')}
                      {s.preferred_name ? ` (${s.preferred_name})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCoverDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveCover} variant="contained" disabled={!selectedCover}>Save</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* Staff Absences Tab */}
      {tab === 1 && (
        <Box>
          <Typography variant="h5" mb={2}>Staff Absences</Typography>
          <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>Add Absence</Button>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Staff</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {absences.map(abs => (
                <TableRow key={abs.id}>
                  <TableCell>
                    {[abs.title, abs.first_name, abs.last_name].filter(Boolean).join(' ')}
                    {abs.preferred_name ? ` (${abs.preferred_name})` : ''}
                  </TableCell>
                  <TableCell>{abs.start_date}</TableCell>
                  <TableCell>{abs.end_date}</TableCell>
                  <TableCell>{abs.reason}</TableCell>
                  <TableCell>{abs.notes}</TableCell>
                  <TableCell>
                    <Button
                      color="error"
                      size="small"
                      onClick={async () => {
                        await fetch(`/staff-absences/${abs.id}`, { method: 'DELETE' });
                        fetch('/staff-absences').then(r => r.json()).then(setAbsences);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Add Staff Absence</DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <Select
                  name="staff_id"
                  value={form.staff_id}
                  onChange={handleChange}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">Select Staff</MenuItem>
                  {staff.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {[s.title, s.first_name || s.firstName, s.last_name || s.lastName].filter(Boolean).join(' ')}
                      {s.preferred_name || s.preferredName
                        ? ` (${s.preferred_name || s.preferredName})`
                        : ''}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  label="Start Date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  fullWidth
                />
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
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
}