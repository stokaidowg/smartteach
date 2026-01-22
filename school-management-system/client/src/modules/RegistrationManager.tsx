import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, Stack, Tabs, Tab, Snackbar, Alert
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { authFetch } from '../utils/authFetch';

type Set = { id: string; name: string; };
type TimetableEntry = { id: string; day_of_week: number; period: number; set_id: string; };
type Pupil = { id: string; firstName: string; lastName: string; };
type Registration = { pupil_id: string; status: string; code?: string; notes?: string; minutes_late?: number; timetable_id?: string; period?: number; set_id?: string; date?: string; };

const statusOptions = ['Present', 'Absent', 'Late', 'Excused'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const defaultCodeConfig = [
  { status: 'Present', code: 'P', description: 'Present in class' },
  { status: 'Absent', code: 'A', description: 'Absent from class' },
  { status: 'Late', code: 'L', description: 'Arrived late' },
  { status: 'Excused', code: 'E', description: 'Excused absence' },
];

export default function RegistrationManager() {
  const [tab, setTab] = useState(0);

  // For taking register
  const [sets, setSets] = useState<Set[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [selectedTimetable, setSelectedTimetable] = useState<string>('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Registration[]>([]);

  // For history view
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [historySet, setHistorySet] = useState<string>('');
  const [historyPupil, setHistoryPupil] = useState<string>('');
  const [historyResults, setHistoryResults] = useState<Registration[]>([]);
  const [allPupils, setAllPupils] = useState<Pupil[]>([]);

  // For code configuration
  const [codeConfig, setCodeConfig] = useState<{ status: string; code: string; description: string }[]>([]);
  const [savingCodes, setSavingCodes] = useState(false);
  const [showCodesSaved, setShowCodesSaved] = useState(false);

  useEffect(() => {
    if (tab === 3) {
      fetch('/registration-codes')
        .then(r => r.json())
        .then(setCodeConfig)
        .catch(() => setCodeConfig(defaultCodeConfig));
    }
  }, [tab]);

  // For week view
  const [weekPupil, setWeekPupil] = useState<string>('');
  const [weekResults, setWeekResults] = useState<Registration[]>([]);
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().slice(0, 10);
  });

  // Load timetable and all pupils on mount
  useEffect(() => {
    authFetch('/timetable')
      .then(r => r.json())
      .then(setTimetable);

    fetch('/pupils').then(r => r.json()).then(setAllPupils);
  }, []);

  // When set is selected, load pupils
  useEffect(() => {
    if (selectedSet) {
      fetch(`/set-pupils?setId=${selectedSet}`).then((r) => r.json()).then(data => {
        fetch('/pupils').then(r => r.json()).then(allPupils => {
          const pupilsInSet = data.map((sp: any) => allPupils.find((p: any) => p.id === sp.pupil_id)).filter(Boolean);
          setPupils(pupilsInSet);
          setAttendance(pupilsInSet.map((p: any) => ({
            pupil_id: p.id,
            status: 'Present',
            code: codeConfig.find(c => c.status === 'Present')?.code || 'P'
          })));
        });
      });
    } else {
      setPupils([]);
      setAttendance([]);
    }
  }, [selectedSet, codeConfig]);

  // Helper to get day of week from date (0=Monday, 6=Sunday)
  const getDayOfWeek = (dateStr: string) => {
    const d = new Date(dateStr);
    let jsDay = d.getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  };
  const selectedDay = getDayOfWeek(date);

  // Filter periods for selected day
  const periodsForDay = selectedDay >= 0
    ? Array.from(new Set(timetable.filter(t => t.day_of_week === selectedDay).map(t => t.period)))
    : [];

  // When day/period changes, fetch only sets for that period
  useEffect(() => {
    if (selectedDay >= 0 && selectedPeriod !== null) {
      authFetch(`/sets/for-period?day_of_week=${selectedDay}&period=${selectedPeriod}`)
        .then(r => r.json())
        .then(setSets);
      setSelectedSet('');
    } else {
      setSets([]);
      setSelectedSet('');
    }
  }, [selectedDay, selectedPeriod]);

  // Find timetable entry for selected set/day/period
  useEffect(() => {
    if (selectedSet && selectedDay >= 0 && selectedPeriod !== null) {
      const tt = timetable.find(
        t => t.day_of_week === selectedDay && t.period === selectedPeriod && t.set_id === selectedSet
      );
      setSelectedTimetable(tt ? tt.id : '');
    } else {
      setSelectedTimetable('');
    }
  }, [selectedSet, selectedDay, selectedPeriod, timetable]);

  const handleStatusChange = (pupil_id: string, status: string) => {
    setAttendance(attendance =>
      attendance.map(a =>
        a.pupil_id === pupil_id
          ? {
              ...a,
              status,
              code: codeConfig.find(c => c.status === status)?.code || '',
              minutes_late: status === 'Late' ? a.minutes_late || 0 : undefined
            }
          : a
      )
    );
  };

  const handleCodeChange = (pupil_id: string, code: string) => {
    setAttendance(attendance =>
      attendance.map(a => a.pupil_id === pupil_id ? { ...a, code } : a)
    );
  };

  const handleNotesChange = (pupil_id: string, notes: string) => {
    setAttendance(attendance =>
      attendance.map(a => a.pupil_id === pupil_id ? { ...a, notes } : a)
    );
  };

  const handleMinutesLateChange = (pupil_id: string, minutes_late: number) => {
    setAttendance(attendance =>
      attendance.map(a => a.pupil_id === pupil_id ? { ...a, minutes_late } : a)
    );
  };

  const handleSave = async () => {
    for (const a of attendance) {
      await fetch('/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          set_id: selectedSet || null,
          timetable_id: selectedTimetable || null,
          date,
          pupil_id: a.pupil_id,
          status: a.status,
          code: a.code,
          notes: a.notes || '',
          minutes_late: a.status === 'Late' ? a.minutes_late : null,
        })
      });
    }
    alert('Attendance saved!');
  };

  // Only auto-fetch history when the history tab is active
  useEffect(() => {
    if (tab !== 1) return;
    let url = `/registration?date=${historyDate}`;
    if (historySet) url += `&setId=${historySet}`;
    if (historyPupil) url += `&pupilId=${historyPupil}`;
    fetch(url)
      .then(res => res.json())
      .then(setHistoryResults);
  }, [tab, historyDate, historySet, historyPupil]);

  const handleSaveCodes = async () => {
    setSavingCodes(true);
    await fetch('/registration-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codeConfig),
    });
    // Re-fetch codes to ensure UI is up-to-date
    fetch('/registration-codes')
      .then(r => r.json())
      .then(setCodeConfig);
    setSavingCodes(false);
    setShowCodesSaved(true);
  };

  const handleCodeConfigChange = (idx: number, field: 'status' | 'code' | 'description', value: string) => {
    setCodeConfig(cfg => {
      const next = [...cfg];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };
  const handleAddCodeConfig = (status: string) => {
    setCodeConfig(cfg => [...cfg, { status, code: '', description: '' }]);
  };
  const handleRemoveCodeConfig = (idx: number) => {
    setCodeConfig(cfg => cfg.filter((_, i) => i !== idx));
  };

  // Week view logic
  useEffect(() => {
    if (tab !== 2 || !weekPupil) return;
    // Get Monday of the selected week
    const monday = new Date(weekStart);
    const weekDates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    Promise.all(
      weekDates.map(date =>
        fetch(`/registration?date=${date}&pupilId=${weekPupil}`).then(r => r.json())
      )
    ).then(results => {
      setWeekResults(results.flat());
    });
  }, [tab, weekPupil, weekStart]);

  // Week view stats
  const weekStats = React.useMemo(() => {
    if (!weekResults.length) return null;
    const present = weekResults.filter(r => r.status === 'Present').length;
    const absent = weekResults.filter(r => r.status === 'Absent').length;
    const late = weekResults.filter(r => r.status === 'Late').length;
    const excused = weekResults.filter(r => r.status === 'Excused').length;
    const total = weekResults.length;
    const avgLate = weekResults.filter(r => r.minutes_late).reduce((sum, r) => sum + (r.minutes_late || 0), 0) / (late || 1);
    // Top 5 codes
    const codeCounts: Record<string, number> = {};
    weekResults.forEach(r => {
      if (r.code) codeCounts[r.code] = (codeCounts[r.code] || 0) + 1;
    });
    const topCodes = Object.entries(codeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => `${code} (${count})`);
    return {
      present: ((present / total) * 100).toFixed(1),
      absent: ((absent / total) * 100).toFixed(1),
      avgLate: isNaN(avgLate) ? 0 : avgLate.toFixed(1),
      topCodes,
    };
  }, [weekResults]);

  const safeSets = Array.isArray(sets) ? sets : [];

  return (
    <Box>
      <Typography variant="h5" mb={2}>Registration</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Take Register" />
        <Tab label="View History" />
        <Tab label="Week View" />
        <Tab label="Code Configuration" />
      </Tabs>

      {/* Take Register */}
      {tab === 0 && (
        <Box>
          <Stack direction="row" spacing={2} mb={2}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={e => {
                setDate(e.target.value);
                setSelectedPeriod(null);
                setSelectedSet('');
              }}
            />
            <Select
              value={selectedPeriod !== null ? selectedPeriod : ''}
              onChange={e => {
                setSelectedPeriod(Number(e.target.value));
                setSelectedSet('');
              }}
              displayEmpty
              sx={{ minWidth: 120 }}
              disabled={!date}
            >
              <MenuItem value="">Select Period</MenuItem>
              {periodsForDay.map(period => (
                <MenuItem key={period} value={period}>{`Period ${period}`}</MenuItem>
              ))}
            </Select>
            <Autocomplete
              options={safeSets}
              getOptionLabel={s => s.name}
              value={safeSets.find(s => s.id === selectedSet) || null}
              onChange={(_, v) => setSelectedSet(v ? v.id : '')}
              renderInput={params => <TextField {...params} label="Set" />}
              sx={{ minWidth: 200 }}
              disabled={selectedPeriod === null}
            />
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pupil</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Minutes Late</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pupils.map(p => {
                const reg = attendance.find(a => a.pupil_id === p.id) || { status: 'Present', code: codeConfig.find(c => c.status === 'Present')?.code || 'P', notes: '', minutes_late: undefined };
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.firstName} {p.lastName}</TableCell>
                    <TableCell>
                      <Select
                        value={reg.status}
                        onChange={e => handleStatusChange(p.id, e.target.value)}
                      >
                        {statusOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={reg.code || ''}
                        onChange={e => handleCodeChange(p.id, e.target.value)}
                        displayEmpty
                        sx={{ minWidth: 60 }}
                      >
                        <MenuItem value="">None</MenuItem>
                        {codeConfig.map(cfg => (
                          <MenuItem key={cfg.code} value={cfg.code}>{cfg.code} ({cfg.status})</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        label="Notes"
                        value={reg.notes || ''}
                        onChange={e => handleNotesChange(p.id, e.target.value)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {reg.status === 'Late' && (
                        <TextField
                          label="Minutes Late"
                          type="number"
                          value={reg.minutes_late ?? ''}
                          onChange={e => handleMinutesLateChange(p.id, Number(e.target.value))}
                          size="small"
                          inputProps={{ min: 0 }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button variant="contained" onClick={handleSave} sx={{ mt: 2 }}>Save Attendance</Button>
        </Box>
      )}

      {/* View History */}
      {tab === 1 && (
        <Box>
          <Stack direction="row" spacing={2} mb={2}>
            <TextField
              label="Date"
              type="date"
              value={historyDate}
              onChange={e => setHistoryDate(e.target.value)}
            />
            <Autocomplete
              options={safeSets}
              getOptionLabel={s => s.name}
              value={safeSets.find(s => s.id === historySet) || null}
              onChange={(_, v) => setHistorySet(v ? v.id : '')}
              renderInput={params => <TextField {...params} label="Set (optional)" />}
              sx={{ minWidth: 200 }}
            />
            <Autocomplete
              options={allPupils}
              getOptionLabel={p => `${p.firstName} ${p.lastName}`}
              value={allPupils.find(p => p.id === historyPupil) || null}
              onChange={(_, v) => setHistoryPupil(v ? v.id : '')}
              renderInput={params => <TextField {...params} label="Pupil (optional)" />}
              sx={{ minWidth: 200 }}
            />
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pupil</TableCell>
                <TableCell>Set</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Minutes Late</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyResults.map((reg, idx) => {
                const pupil = allPupils.find(p => p.id === reg.pupil_id);
                const set = sets.find(s => s.id === reg.set_id);
                return (
                  <TableRow key={idx}>
                    <TableCell>{pupil ? `${pupil.firstName} ${pupil.lastName}` : reg.pupil_id}</TableCell>
                    <TableCell>{set ? set.name : reg.set_id}</TableCell>
                    <TableCell>{reg.period ?? ''}</TableCell>
                    <TableCell>{reg.status}</TableCell>
                    <TableCell>{reg.code || ''}</TableCell>
                    <TableCell>{reg.notes}</TableCell>
                    <TableCell>{reg.minutes_late ?? ''}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Week View */}
      {tab === 2 && (
        <Box>
          <Stack direction="row" spacing={2} mb={2}>
            <TextField
              label="Week Start"
              type="date"
              value={weekStart}
              onChange={e => setWeekStart(e.target.value)}
            />
            <Autocomplete
              options={allPupils}
              getOptionLabel={p => `${p.firstName} ${p.lastName}`}
              value={allPupils.find(p => p.id === weekPupil) || null}
              onChange={(_, v) => setWeekPupil(v ? v.id : '')}
              renderInput={params => <TextField {...params} label="Pupil" />}
              sx={{ minWidth: 200 }}
            />
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Minutes Late</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {weekResults.map((reg, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {reg.date ? new Date(reg.date).toISOString().slice(0, 10) : ''}
                  </TableCell>
                  <TableCell>{reg.status}</TableCell>
                  <TableCell>{reg.code || ''}</TableCell>
                  <TableCell>{reg.notes}</TableCell>
                  <TableCell>{reg.minutes_late ?? ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {weekStats && (
            <Box mt={2}>
              <Typography variant="subtitle1">Summary</Typography>
              <Typography>Present: {weekStats.present}%</Typography>
              <Typography>Absent: {weekStats.absent}%</Typography>
              <Typography>Average Minutes Late: {weekStats.avgLate}</Typography>
              <Typography>Top 5 Codes: {weekStats.topCodes.join(', ')}</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Code Configuration */}
      {tab === 3 && (
        <Box>
          <Typography variant="h6" mb={2}>Code Configuration</Typography>
          <Typography variant="body2" mb={2}>
            Here you can configure the codes used for each registration status. These codes are used for reporting and analysis. Please provide a short description for each code so teachers know what they mean.
          </Typography>
          {statusOptions.map(status => (
            <Box key={status} mb={3}>
              <Typography variant="subtitle1" mb={1}>{status} Codes</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {codeConfig.filter(cfg => cfg.status === status).map((cfg, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          value={cfg.code}
                          onChange={e => handleCodeConfigChange(codeConfig.indexOf(cfg), 'code', e.target.value)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={cfg.description || ''}
                          onChange={e => handleCodeConfigChange(codeConfig.indexOf(cfg), 'description', e.target.value)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button color="error" onClick={() => handleRemoveCodeConfig(codeConfig.indexOf(cfg))}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Button onClick={() => handleAddCodeConfig(status)}>Add Code</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          ))}
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveCodes}
            disabled={savingCodes}
          >
            {savingCodes ? 'Saving...' : 'Save Codes'}
          </Button>
          <Snackbar
            open={showCodesSaved}
            autoHideDuration={4000}
            onClose={() => setShowCodesSaved(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              Codes saved successfully
            </Alert>
          </Snackbar>
        </Box>
      )}
    </Box>
  );
}