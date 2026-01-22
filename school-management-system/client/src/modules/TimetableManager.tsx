import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Stack, Select, Tabs, Tab, Autocomplete,
  Accordion, AccordionSummary, AccordionDetails,
  IconButton
} from '@mui/material';
import { authFetch } from '../utils/authFetch';
import StaffAppointments from './StaffAppointments';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const periods = [1, 2, 3, 4, 5, 6, 7, 8]; // Adjust as needed

type TimetableEntry = {
  id: string;
  set_id: string;
  teacher_id: string;
  room_id: string;
  day_of_week: number;
  period: number;
  start_time: string;
  end_time: string;
  primary_teacher_id?: string;
};

type Set = { id: string; name: string; };
type Staff = { id: string; firstName: string; lastName: string; };
type Room = { id: string; room_code: string; room_name: string; };
type Pupil = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;           // e.g. 'Active', 'Applicant', 'Former'
  leavingDate?: string;     // ISO date string or undefined
};

export default function TimetableManager() {
  const [tab, setTab] = useState(0);
  const [timetableView, setTimetableView] = useState<'list' | 'grid'>('list');

  // Shared state
  const [sets, setSets] = useState<Set[]>([]);
  const [teachers, setTeachers] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);

  // Manage Timetable state
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  // Pupil timetable state
  const [selectedPupil, setSelectedPupil] = useState('');
  const [pupilGrid, setPupilGrid] = useState<any[][]>([]);

  // Staff timetable state
  const [selectedStaff, setSelectedStaff] = useState('');
  type StaffGridCell = null | { [key: string]: any };
  const [staffGrid, setStaffGrid] = useState<StaffGridCell[][]>([]);
  const [staffAppointments, setStaffAppointments] = useState<any[]>([]);
  const [maxStaffPeriod, setMaxStaffPeriod] = useState(8); // default to 8

  // Add Period state
  const [addPeriodDialog, setAddPeriodDialog] = useState<{ open: boolean, dayIdx: number | null }>({ open: false, dayIdx: null });
  const [newPeriod, setNewPeriod] = useState<number>(periods.length + 1);

  // Fetch shared data
  useEffect(() => {
    authFetch('/timetable').then(r => r.json()).then(setEntries);
    authFetch('/sets').then(r => r.json()).then(setSets);
    fetch('/staff')
      .then(r => r.json())
      .then(data => setTeachers(
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
    fetch('/teaching-rooms').then(r => r.json()).then(setRooms);
    fetch('/pupils').then(r => r.json()).then(setPupils);
  }, []);

  // --- Manage Timetable Handlers ---
  const handleOpen = (entry?: Partial<TimetableEntry>) => {
    setForm(entry || {});
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSave = async () => {
    if (form.id) {
      await fetch(`/timetable/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    } else {
      // Only send set_id, room_id, day_of_week, period, start_time, end_time
      const { set_id, room_id, day_of_week, period, start_time, end_time } = form;
      await fetch('/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set_id, room_id, day_of_week, period, start_time, end_time })
      });
    }
    authFetch('/timetable').then(r => r.json()).then(setEntries);
    setOpen(false);
  };
  const handleDelete = async (id: string) => {
    await fetch(`/timetable/${id}`, { method: 'DELETE' });
    authFetch('/timetable').then(r => r.json()).then(setEntries);
  };

  // --- Pupil Timetable Handlers ---
  const handleViewPupilTimetable = async () => {
    const res = await fetch(`/timetable/pupil?pupilId=${selectedPupil}`);
    const data = await res.json();
    // Find the max period from the data and periods array
    const maxPeriod = Math.max(
      ...data.map((entry: any) => entry.period),
      periods.length
    );
    const gridArr = Array.from({ length: maxPeriod }, () =>
      Array.from({ length: days.length }, () => null)
    );
    data.forEach((entry: any) => {
      // Only fill if period is valid
      if (entry.period > 0 && entry.period <= maxPeriod) {
        gridArr[entry.period - 1][entry.day_of_week] = entry;
      }
    });
    setPupilGrid(gridArr);
  };
  const handleExportPupilCSV = () => {
    let csv = 'Period,' + days.join(',') + '\n';
    for (let p = 0; p < periods.length; p++) {
      csv += (p + 1);
      for (let d = 0; d < days.length; d++) {
        const cell = pupilGrid[p][d];
        csv += ',' + (cell ? `${cell.subject} (${cell.set_name}) [${cell.room_code}]` : '');
      }
      csv += '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pupil_timetable.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Staff Timetable Handlers ---
  const handleViewStaffTimetable = async () => {
    const res = await fetch(`/timetable/staff?staffId=${selectedStaff}`);
    const data = await res.json();
    const appRes = await fetch(`/staff-appointments?staffId=${selectedStaff}`);
    const appointments = await appRes.json();

    // Find the highest period number in both lessons and appointments
    const maxPeriod = Math.max(
      data.length > 0 ? Math.max(...data.map((entry: any) => entry.period)) : 1,
      appointments.length > 0 ? Math.max(...appointments.map((a: any) => a.period || 1)) : 1
    );
    setMaxStaffPeriod(maxPeriod);
    // Build the grid
    const gridArr: StaffGridCell[][] = Array.from({ length: maxPeriod }, () =>
      Array.from({ length: days.length }, () => null)
    );
    data.forEach((entry: any) => {
      gridArr[entry.period - 1][entry.day_of_week] = {
        ...entry,
        type: 'lesson'
      };
    });
    appointments.forEach((app: any) => {
      if (
        app &&
        typeof app === 'object' &&
        !Array.isArray(app) &&
        app.period &&
        app.day_of_week !== undefined &&
        app.period > 0
      ) {
        const existing = gridArr[app.period - 1][app.day_of_week];
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
          gridArr[app.period - 1][app.day_of_week] = {
            ...(typeof existing === 'object' && existing !== null ? existing : {}),
            appointment: app
          };
        } else {
          gridArr[app.period - 1][app.day_of_week] = {
            ...(typeof app === 'object' && app !== null ? app : {}),
            type: 'appointment'
          };
        }
      }
    });
    setStaffGrid(gridArr);
    setStaffAppointments(appointments);
    setStaffAppointments(appointments);
  };
  const handleExportStaffCSV = () => {
    let csv = 'Period,' + days.join(',') + '\n';
    for (let p = 0; p < periods.length; p++) {
      csv += (p + 1);
      for (let d = 0; d < days.length; d++) {
        const cell = staffGrid[p][d];
        csv += ',' + (cell ? `${cell.subject} (${cell.set_name}) [${cell.room_code}]` : '');
      }
      csv += '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_timetable.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- New Period Handlers ---
  const handleAddPeriod = (dayIdx: number) => {
    setAddPeriodDialog({ open: true, dayIdx });
    setNewPeriod(periods.length + 1);
  };

  const handleConfirmAddPeriod = () => {
    if (!periods.includes(newPeriod)) {
      periods.push(newPeriod);
      periods.sort((a, b) => a - b);
    }
    setAddPeriodDialog({ open: false, dayIdx: null });
  };

  return (
    <Box>
      <Typography variant="h5" mb={2}>Timetable Manager</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Manage Timetable" />
        <Tab label="View Pupil Timetables" />
        <Tab label="View Staff Timetables" />
        <Tab label="Staff Appointments" />
      </Tabs>

      {/* --- Manage Timetable Tab --- */}
      {tab === 0 && (
        <Box>
          <Box mb={2}>
            <Button variant="contained" onClick={() => handleOpen()}>Add Timetable Entry</Button>
          </Box>
          <Stack direction="row" spacing={2} mb={2}>
            <Button
              variant={timetableView === 'list' ? 'contained' : 'outlined'}
              onClick={() => setTimetableView('list')}
            >
              List View
            </Button>
            <Button
              variant={timetableView === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setTimetableView('grid')}
            >
              Grid View
            </Button>
          </Stack>
          {timetableView === 'list' && (
            <Box>
              {days.map((day, dayIdx) => {
                // Find all periods for this day
                const periodsForDay = Array.from(
                  new Set(entries.filter(e => e.day_of_week === dayIdx).map(e => e.period))
                ).sort((a, b) => a - b);

                return (
                  <Accordion key={day}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">{day}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {periodsForDay.map(period => (
                        <Accordion key={period}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Period {period}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Set</TableCell>
                                  <TableCell>Teacher</TableCell>
                                  <TableCell>Room</TableCell>
                                  <TableCell>Start</TableCell>
                                  <TableCell>End</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {entries
                                  .filter(e => e.day_of_week === dayIdx && e.period === period)
                                  .map(entry => (
                                    <TableRow key={entry.id}>
                                      <TableCell>{sets.find(s => s.id === entry.set_id)?.name || ''}</TableCell>
                                      <TableCell>
                                        {teachers.find(t => t.id === entry.teacher_id)?.firstName}{" "}
                                        {teachers.find(t => t.id === entry.teacher_id)?.lastName}
                                      </TableCell>
                                      <TableCell>{rooms.find(r => r.id === entry.room_id)?.room_code}</TableCell>
                                      <TableCell>{entry.start_time}</TableCell>
                                      <TableCell>{entry.end_time}</TableCell>
                                      <TableCell>
                                        <Button size="small" onClick={() => handleOpen(entry)}>Edit</Button>
                                        <Button size="small" color="error" onClick={() => handleDelete(entry.id)}>Delete</Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                      {/* Add Period Button */}
                      <Box mt={2}>
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => handleAddPeriod(dayIdx)}
                          variant="outlined"
                          size="small"
                        >
                          Add Period
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
          {timetableView === 'grid' && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">Period</TableCell>
                  {days.map(day => <TableCell key={day} align="center">{day}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map((period, pIdx) => (
                  <TableRow key={period}>
                    <TableCell align="center">{period}</TableCell>
                    {days.map((_, dIdx) => {
                      const entry = entries.find(
                        e => e.period === period && e.day_of_week === dIdx
                      );
                      return (
                        <TableCell key={dIdx} align="center">
                          {entry ? (
                            <Box textAlign="center">
                              <div>
                                <strong>{sets.find(s => s.id === entry.set_id)?.name || ''}</strong>
                              </div>
                              <div>
                                {teachers.find(t => t.id === entry.teacher_id)?.firstName}{" "}
                                {teachers.find(t => t.id === entry.teacher_id)?.lastName}
                              </div>
                              <div>
                                {rooms.find(r => r.id === entry.room_id)?.room_code}
                              </div>
                              <Button size="small" onClick={() => handleOpen(entry)}>Edit</Button>
                              <Button size="small" color="error" onClick={() => handleDelete(entry.id)}>Delete</Button>
                            </Box>
                          ) : (
                            <Button
                              size="small"
                              onClick={() => handleOpen({
                                day_of_week: dIdx,
                                period,
                              })}
                              aria-label="Add"
                            >
                              <AddIcon />
                            </Button>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{form.id ? 'Edit' : 'Add'} Timetable Entry</DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={1}>
                <TextField
                  select
                  label="Day"
                  name="day_of_week"
                  value={form.day_of_week ?? ''}
                  onChange={handleChange}
                  fullWidth
                >
                  {days.map((d, i) => <MenuItem key={i} value={i}>{d}</MenuItem>)}
                </TextField>
                <TextField
                  label="Period"
                  name="period"
                  type="number"
                  value={form.period ?? ''}
                  onChange={handleChange}
                  fullWidth
                />
                <Autocomplete
                  options={sets}
                  getOptionLabel={s => s.name}
                  value={sets.find(s => s.id === form.set_id) || null}
                  onChange={(_, v) => setForm({ ...form, set_id: v ? v.id : '' })}
                  renderInput={params => <TextField {...params} label="Set" />}
                />
                {/* REMOVE the teacher selection here */}
                <Autocomplete
                  options={rooms}
                  getOptionLabel={r => `${r.room_code} - ${r.room_name}`}
                  value={rooms.find(r => r.id === form.room_id) || null}
                  onChange={(_, v) => setForm({ ...form, room_id: v ? v.id : '' })}
                  renderInput={params => <TextField {...params} label="Room" />}
                />
                <TextField
                  label="Start Time"
                  name="start_time"
                  type="time"
                  value={form.start_time ?? ''}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="End Time"
                  name="end_time"
                  type="time"
                  value={form.end_time ?? ''}
                  onChange={handleChange}
                  fullWidth
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
          </Dialog>

          {/* --- Add Period Dialog --- */}
          <Dialog open={addPeriodDialog.open} onClose={() => setAddPeriodDialog({ open: false, dayIdx: null })}>
            <DialogTitle>Add Period</DialogTitle>
            <DialogContent>
              <TextField
                label="Period Number"
                type="number"
                value={newPeriod}
                onChange={e => setNewPeriod(Number(e.target.value))}
                fullWidth
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddPeriodDialog({ open: false, dayIdx: null })}>Cancel</Button>
              <Button onClick={handleConfirmAddPeriod} variant="contained">Add</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}

      {/* --- View Pupil Timetables Tab --- */}
      {tab === 1 && (
        <Box>
          <Typography variant="h6" mt={2}>View Pupil Timetable</Typography>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Select
              value={selectedPupil}
              onChange={e => setSelectedPupil(e.target.value)}
              displayEmpty
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Select Pupil</MenuItem>
              {pupils
                .filter(p => {
                  // Only show pupils with status 'Active' and (no leavingDate or leavingDate in the future)
                  if (p.status !== 'Active') return false;
                  if (p.leavingDate) {
                    const leaving = new Date(p.leavingDate);
                    const now = new Date();
                    if (leaving < now) return false;
                  }
                  return true;
                })
                .map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</MenuItem>
                ))}
            </Select>
            <Button variant="contained" onClick={handleViewPupilTimetable} disabled={!selectedPupil}>
              View Timetable
            </Button>
            <Button variant="outlined" onClick={handleExportPupilCSV} disabled={pupilGrid.length === 0}>
              Export CSV
            </Button>
          </Stack>
          {pupilGrid.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  {days.map(day => <TableCell key={day}>{day}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map((period, pIdx) => (
                  <TableRow key={period}>
                    <TableCell>{period}</TableCell>
                    {days.map((_, dIdx) => (
                      <TableCell key={dIdx}>
                        {pupilGrid[pIdx][dIdx]
                          ? `${pupilGrid[pIdx][dIdx].subject} (${pupilGrid[pIdx][dIdx].set_name}) [${pupilGrid[pIdx][dIdx].room_code}]`
                          : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* --- View Staff Timetables Tab --- */}
      {tab === 2 && (
        <Box>
          <Typography variant="h6" mt={2}>View Staff Timetable</Typography>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              displayEmpty
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Select Staff</MenuItem>
              {teachers.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</MenuItem>
              ))}
            </Select>
            <Button variant="contained" onClick={handleViewStaffTimetable} disabled={!selectedStaff}>
              View Timetable
            </Button>
            <Button variant="outlined" onClick={handleExportStaffCSV} disabled={staffGrid.length === 0}>
              Export CSV
            </Button>
          </Stack>
          {staffGrid.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  {days.map(day => <TableCell key={day}>{day}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: maxStaffPeriod }, (_, pIdx) => (
                  <TableRow key={pIdx + 1}>
                    <TableCell>{pIdx + 1}</TableCell>
                    {days.map((_, dIdx) => {
                      const cell = staffGrid[pIdx][dIdx];
                      if (!cell) return <TableCell key={dIdx}></TableCell>;
                      // If both lesson and appointment
                      if (cell.type === 'lesson' && cell.appointment) {
                        const appRoom = rooms.find(r => r.id === cell.appointment.room_id);
                        return (
                          <TableCell key={dIdx}>
                            <div>
                              <strong>Lesson:</strong> {cell.subject} ({cell.set_name}) [{cell.room_code}]
                            </div>
                            <div>
                              <strong>Appointment:</strong> {cell.appointment.title} [{appRoom ? appRoom.room_code : cell.appointment.room_id}]
                            </div>
                          </TableCell>
                        );
                      }
                      // Only lesson
                      if (cell.type === 'lesson') {
                        return (
                          <TableCell key={dIdx}>
                            {cell.subject} ({cell.set_name}) [{cell.room_code}]
                          </TableCell>
                        );
                      }
                      // Only appointment
                      if (cell.type === 'appointment') {
                        const room = rooms.find(r => r.id === cell.room_id);
                        return (
                          <TableCell key={dIdx}>
                            <strong>Appointment:</strong> {cell.title} [{room ? room.room_code : cell.room_id}]
                          </TableCell>
                        );
                      }
                      return <TableCell key={dIdx}></TableCell>;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* --- Staff Appointments Tab --- */}
      {tab === 3 && (
        <Box>
          <Typography variant="h6" mt={2}>Staff Appointments</Typography>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              displayEmpty
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Select Staff</MenuItem>
              {teachers.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</MenuItem>
              ))}
            </Select>
          </Stack>
          {selectedStaff && (
            <StaffAppointments staffId={selectedStaff} />
          )}
        </Box>
      )}
    </Box>
  );
}