import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, Stack, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Checkbox, FormControlLabel
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

type Subject = { id: string; name: string; };
type Set = { id: string; subject_id: string; name: string; room_id?: string; };
type Staff = { id: string; firstName: string; lastName: string; isTeachingStaff?: boolean; };
type Pupil = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  enrollmentDate: string;
  leavingDate: string;
};
type SetTeacher = { staff_id: string; is_primary: boolean; };
type SetPupil = { pupil_id: string; };
type Room = { id: string; room_code: string; room_name: string; };

export default function TeachingManager() {
  // State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [teachers, setTeachers] = useState<Staff[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [setDialogOpen, setSetDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [setName, setSetName] = useState('');

  // For teacher/pupil allocation
  const [setTeachersList, setSetTeachersList] = useState<SetTeacher[]>([]);
  const [setPupilsList, setSetPupilsList] = useState<SetPupil[]>([]);
  const [teacherToAdd, setTeacherToAdd] = useState<string>('');
  const [teacherIsPrimary, setTeacherIsPrimary] = useState(false);
  const [pupilToAdd, setPupilToAdd] = useState<string>('');

  // For copying pupils between sets
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyTargetSet, setCopyTargetSet] = useState<string>('');
  const [copySourceSet, setCopySourceSet] = useState<string>('');

  // Set editing
  const [editSetDialogOpen, setEditSetDialogOpen] = useState(false);
  const [editSetId, setEditSetId] = useState<string>('');
  const [editSetName, setEditSetName] = useState<string>('');

  // Room allocation
  const [teachingRooms, setTeachingRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [editSetRoomId, setEditSetRoomId] = useState<string>('');

  // Fetch subjects, teachers, pupils, and rooms on mount
  useEffect(() => {
    fetch('/subjects').then(r => r.json()).then(setSubjects);
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
    fetch('/pupils').then(r => r.json()).then(setPupils);
    fetch('/teaching-rooms').then(r => r.json()).then(setTeachingRooms);
  }, []);

  // Fetch sets when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetch(`/sets?subjectId=${selectedSubject}`).then(r => r.json()).then(setSets);
    } else {
      setSets([]);
    }
    setSelectedSet('');
  }, [selectedSubject]);

  // Fetch set teachers/pupils when set changes
  useEffect(() => {
    if (selectedSet) {
      fetch(`/set-teachers?setId=${selectedSet}`).then(r => r.json()).then(setSetTeachersList);
      fetch(`/set-pupils?setId=${selectedSet}`).then(r => r.json()).then(setSetPupilsList);
    } else {
      setSetTeachersList([]);
      setSetPupilsList([]);
    }
  }, [selectedSet]);

  // Subject CRUD
  const handleAddSubject = async () => {
    const id = crypto.randomUUID();
    await fetch('/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: subjectName })
    });
    setSubjectDialogOpen(false);
    setSubjectName('');
    fetch('/subjects').then(r => r.json()).then(setSubjects);
  };

  // Set CRUD
  const handleAddSet = async () => {
    const id = crypto.randomUUID();
    await fetch('/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, subject_id: selectedSubject, name: setName, room_id: selectedRoomId || null })
    });
    setSetDialogOpen(false);
    setSetName('');
    setSelectedRoomId('');
    fetch(`/sets?subjectId=${selectedSubject}`).then(r => r.json()).then(setSets);
  };

  const handleEditSet = (setId: string, setName: string) => {
    setEditSetId(setId);
    setEditSetName(setName);
    // Find the set and set the room id for editing
    const set = sets.find(s => s.id === setId);
    setEditSetRoomId(set?.room_id || '');
    setEditSetDialogOpen(true);
  };

  const handleEditSetSubmit = async () => {
    await fetch(`/sets/${editSetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editSetName, room_id: editSetRoomId || null })
    });
    setEditSetDialogOpen(false);
    fetch(`/sets?subjectId=${selectedSubject}`).then(r => r.json()).then(setSets);
  };

  const handleDeleteSet = async (setId: string) => {
    await fetch(`/sets/${setId}`, { method: 'DELETE' });
    fetch(`/sets?subjectId=${selectedSubject}`).then(r => r.json()).then(setSets);
    if (selectedSet === setId) setSelectedSet('');
  };

  // Teacher allocation
  const handleAddTeacherToSet = async () => {
    if (!teacherToAdd) return;
    await fetch('/set-teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_id: selectedSet, staff_id: teacherToAdd, is_primary: teacherIsPrimary })
    });
    setTeacherToAdd('');
    setTeacherIsPrimary(false);
    fetch(`/set-teachers?setId=${selectedSet}`).then(r => r.json()).then(setSetTeachersList);
  };

  const handleRemoveTeacherFromSet = async (staff_id: string) => {
    await fetch(`/set-teachers?setId=${selectedSet}&staffId=${staff_id}`, { method: 'DELETE' });
    fetch(`/set-teachers?setId=${selectedSet}`).then(r => r.json()).then(setSetTeachersList);
  };

  // Pupil allocation
  const handleAddPupilToSet = async () => {
    if (!pupilToAdd) return;
    await fetch('/set-pupils', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_id: selectedSet, pupil_id: pupilToAdd })
    });
    setPupilToAdd('');
    fetch(`/set-pupils?setId=${selectedSet}`).then(r => r.json()).then(setSetPupilsList);
  };

  const handleRemovePupilFromSet = async (pupil_id: string) => {
    await fetch(`/set-pupils?setId=${selectedSet}&pupilId=${pupil_id}`, { method: 'DELETE' });
    fetch(`/set-pupils?setId=${selectedSet}`).then(r => r.json()).then(setSetPupilsList);
  };

  // Copy pupils from one set to another
  const handleCopySetList = async () => {
    if (!copySourceSet || !copyTargetSet) return;
    await fetch('/sets/copy-pupils', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromSetId: copySourceSet, toSetId: copyTargetSet })
    });
    setCopyDialogOpen(false);
    setCopySourceSet('');
    setCopyTargetSet('');
    // Refresh pupils for the target set if it's currently selected
    if (selectedSet === copyTargetSet) {
      fetch(`/set-pupils?setId=${selectedSet}`).then(r => r.json()).then(setSetPupilsList);
    }
  };

  // Remove selectedSet when clicking a set row
  const handleSelectSet = (setId: string) => {
    setSelectedSet(setId);
  };

  return (
    <Box>
      <Typography variant="h5" mb={2}>Teaching Manager</Typography>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Select
          value={selectedSubject || ''}
          onChange={e => setSelectedSubject(e.target.value)}
          displayEmpty
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Select Subject</MenuItem>
          {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </Select>
        <Button startIcon={<AddIcon />} onClick={() => setSubjectDialogOpen(true)}>Add Subject</Button>
        <Button startIcon={<AddIcon />} onClick={() => setSetDialogOpen(true)} disabled={!selectedSubject}>Add Set</Button>
      </Stack>
      {selectedSubject && (
        <Box>
          {/* List sets for the subject */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Set Name</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sets.map(set => (
                <TableRow
                  key={set.id}
                  selected={set.id === selectedSet}
                  hover
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectSet(set.id)}
                >
                  <TableCell>{set.name}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditSet(set.id, set.name)}
                      aria-label="edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSet(set.id)}
                      aria-label="delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Set details: Teachers and Pupils */}
      {selectedSet && (
        <Box mt={4}>
          <Typography variant="h6">Set Teachers</Typography>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Autocomplete
              options={teachers.filter(t => t.isTeachingStaff)}
              getOptionLabel={t => `${t.firstName} ${t.lastName}`}
              value={teachers.find(t => t.id === teacherToAdd) || null}
              onChange={(_, value) => setTeacherToAdd(value ? value.id : '')}
              renderInput={params => (
                <TextField {...params} label="Select Teacher" size="small" />
              )}
              sx={{ minWidth: 200 }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={teacherIsPrimary}
                  onChange={e => setTeacherIsPrimary(e.target.checked)}
                />
              }
              label="Primary"
            />
            <Button variant="contained" onClick={handleAddTeacherToSet} disabled={!teacherToAdd}>
              Add Teacher
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} mb={2}>
            {setTeachersList.map(st =>
              <Chip
                key={st.staff_id}
                label={
                  (teachers.find(t => t.id === st.staff_id)?.firstName || '') + ' ' +
                  (teachers.find(t => t.id === st.staff_id)?.lastName || '') +
                  (st.is_primary ? ' (Primary)' : '')
                }
                onDelete={() => handleRemoveTeacherFromSet(st.staff_id)}
                color={st.is_primary ? 'primary' : 'default'}
              />
            )}
          </Stack>

          <Typography variant="h6" mt={4}>Set Pupils</Typography>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Autocomplete
              options={pupils.filter(p => {
                const now = new Date();
                const enrollment = new Date(p.enrollmentDate);
                // If leavingDate is null, undefined, or empty, treat as still enrolled
                const leaving = p.leavingDate ? new Date(p.leavingDate) : null;
                return (
                  p.status === 'Active' &&
                  enrollment <= now &&
                  (
                    !leaving || leaving > now
                  )
                );
              })}
              getOptionLabel={p => `${p.firstName} ${p.lastName}`}
              value={pupils.find(p => p.id === pupilToAdd) || null}
              onChange={(_, value) => setPupilToAdd(value ? value.id : '')}
              renderInput={params => (
                <TextField {...params} label="Select Pupil" size="small" />
              )}
              sx={{ minWidth: 200 }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
            <Button variant="contained" onClick={handleAddPupilToSet} disabled={!pupilToAdd}>
              Add Pupil
            </Button>
            {/* Copy Set List button here */}
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => {
                setCopyTargetSet(selectedSet);
                setCopyDialogOpen(true);
              }}
              variant="outlined"
            >
              Copy Set List
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} mb={2}>
            {setPupilsList.map(sp =>
              <Chip
                key={sp.pupil_id}
                label={
                  (pupils.find(p => p.id === sp.pupil_id)?.firstName || '') + ' ' +
                  (pupils.find(p => p.id === sp.pupil_id)?.lastName || '')
                }
                onDelete={() => handleRemovePupilFromSet(sp.pupil_id)}
                color="default"
              />
            )}
          </Stack>

          {/* Room Allocation Section */}
          <Typography variant="h6" mt={4}>Allocated Room</Typography>
          <Autocomplete
            options={teachingRooms}
            getOptionLabel={r => `${r.room_code} - ${r.room_name}`}
            value={teachingRooms.find(r => r.id === sets.find(s => s.id === selectedSet)?.room_id) || null}
            onChange={async (_, value) => {
              const roomId = value ? value.id : null;
              await fetch('/assign-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ setId: selectedSet, roomId })
              });
              // Refresh sets to update room_id
              fetch(`/sets?subjectId=${selectedSubject}`).then(r => r.json()).then(setSets);
            }}
            renderInput={params => (
              <TextField {...params} label="Teaching Room" margin="dense" />
            )}
            sx={{ mt: 2, maxWidth: 400 }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Box>
      )}

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onClose={() => setSubjectDialogOpen(false)}>
        <DialogTitle>Add Subject</DialogTitle>
        <DialogContent>
          <TextField
            label="Subject Name"
            value={subjectName}
            onChange={e => setSubjectName(e.target.value)}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubjectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSubject} disabled={!subjectName.trim()} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Set Dialog */}
      <Dialog open={setDialogOpen} onClose={() => setSetDialogOpen(false)}>
        <DialogTitle>Add Set</DialogTitle>
        <DialogContent>
          <TextField
            label="Set Name"
            value={setName}
            onChange={e => setSetName(e.target.value)}
            fullWidth
            margin="dense"
          />
          <Autocomplete
            options={teachingRooms}
            getOptionLabel={r => `${r.room_code} - ${r.room_name}`}
            value={teachingRooms.find(r => r.id === selectedRoomId) || null}
            onChange={(_, value) => setSelectedRoomId(value ? value.id : '')}
            renderInput={params => (
              <TextField {...params} label="Teaching Room" margin="dense" />
            )}
            sx={{ mt: 2 }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSet} disabled={!setName.trim()} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Set Dialog */}
      <Dialog open={editSetDialogOpen} onClose={() => setEditSetDialogOpen(false)}>
        <DialogTitle>Edit Set</DialogTitle>
        <DialogContent>
          <TextField
            label="Set Name"
            value={editSetName}
            onChange={e => setEditSetName(e.target.value)}
            fullWidth
            margin="dense"
          />
          <Autocomplete
            options={teachingRooms}
            getOptionLabel={r => `${r.room_code} - ${r.room_name}`}
            value={teachingRooms.find(r => r.id === editSetRoomId) || null}
            onChange={(_, value) => setEditSetRoomId(value ? value.id : '')}
            renderInput={params => (
              <TextField {...params} label="Teaching Room" margin="dense" />
            )}
            sx={{ mt: 2 }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSetSubmit} disabled={!editSetName.trim()} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Copy Set List Dialog */}
      <Dialog open={copyDialogOpen} onClose={() => setCopyDialogOpen(false)}>
        <DialogTitle>Copy Pupils from Another Set</DialogTitle>
        <DialogContent>
          <Select
            value={copySourceSet || ''}
            onChange={e => setCopySourceSet(e.target.value)}
            displayEmpty
            fullWidth
            sx={{ mt: 2 }}
          >
            <MenuItem value="">Select Source Set</MenuItem>
            {sets
              .filter(set => set.id !== copyTargetSet)
              .map(set => (
                <MenuItem key={set.id} value={set.id}>{set.name}</MenuItem>
              ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCopySetList}
            disabled={!copySourceSet}
            variant="contained"
          >
            Copy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}