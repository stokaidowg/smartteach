import React, { useEffect, useState } from 'react';
import {
  Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Stack, Tabs, Tab, Box, Avatar, MenuItem, Checkbox, FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import Badge from '@mui/material/Badge';

type ParentContact = {
  relationship: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  priority: boolean;
  pickup: boolean;
};

type Pupil = {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  dob: string;
  gender: string;
  nationality: string;
  countryOfBirth: string;
  languages: string;
  religion: string;
  ethnicity: string;
  photo: string;
  senStatus: string;
  senDetails: string;
  behaviourNotes: string;
  studentId: string;
  yearGroup: string;
  form: string;
  house: string;
  tutor: string;
  enrollmentDate: string;
  status: string;
  keyStage: string;
  leavingDate: string;
  homeAddress: string;
  primaryPhone: string;
  email: string;
  parents: ParentContact[];
};

const emptyParent: ParentContact = {
  relationship: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  priority: false,
  pickup: false
};

const emptyPupil: Omit<Pupil, 'id' | 'studentId'> = {
  firstName: '',
  middleName: '',
  lastName: '',
  preferredName: '',
  dob: '',
  gender: '',
  nationality: '',
  countryOfBirth: '',
  languages: '',
  religion: '',
  ethnicity: '',
  photo: '',
  senStatus: '',
  senDetails: '',
  behaviourNotes: '',
  yearGroup: '',
  form: '',
  house: '',
  tutor: '',
  enrollmentDate: '',
  status: '',
  keyStage: '',
  leavingDate: '',
  homeAddress: '',
  primaryPhone: '',
  email: '',
  parents: []
};

function generateStudentId(existing: string[]): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  do {
    id = Array.from({ length: 11 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (existing.includes(id));
  return id;
}

const unique = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort();

// Global list item type
type GlobalListItem = {
  id: string;
  value: string;
  is_active: boolean;
};

type YearGroup = {
  id: string;
  name: string;
  is_active: boolean;
};

type House = {
  id: string;
  name: string;
  is_active: boolean;
};

type Form = {
  id: string;
  name: string;
  is_active: boolean;
};

export default function PupilManager() {
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Omit<Pupil, 'id' | 'studentId'>>({ ...emptyPupil });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    form: '',
    yearGroup: '',
    house: '',
    countryOfBirth: '',
    nationality: '',
    enrolledAfter: '',
    enrolledBefore: '',
    leavingAfter: '',
    leavingBefore: '',
    parentName: '',
    text: ''
  });

  // Normalized data from global lists and academic structure
  const [genderOptions, setGenderOptions] = useState<GlobalListItem[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<GlobalListItem[]>([]);
  const [religionOptions, setReligionOptions] = useState<GlobalListItem[]>([]);
  const [ethnicityOptions, setEthnicityOptions] = useState<GlobalListItem[]>([]);
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [forms, setForms] = useState<Form[]>([]);

  // Dynamic dropdown options (legacy - for filters)
  const statusOptions = unique(pupils.map(p => p.status));
  const formOptions = unique(pupils.map(p => p.form));
  const yearGroupOptions = unique(pupils.map(p => p.yearGroup));
  const houseOptions = unique(pupils.map(p => p.house));
  const countryOptions = unique(pupils.map(p => p.countryOfBirth));
  const legacyNationalityOptions = unique(pupils.map(p => p.nationality));

  // Initial fetch (all pupils and lookup data)
  useEffect(() => {
    fetch('http://localhost:3000/pupils')
      .then(res => res.json())
      .then(setPupils)
      .catch(err => console.error('Failed to load pupils:', err));
    
    // Load global lists
    fetch('http://localhost:3000/global-lists/items/gender')
      .then(res => res.json())
      .then(data => setGenderOptions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load gender options:', err);
        setGenderOptions([]);
      });
    
    fetch('http://localhost:3000/global-lists/items/nationality')
      .then(res => res.json())
      .then(data => setNationalityOptions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load nationality options:', err);
        setNationalityOptions([]);
      });
    
    fetch('http://localhost:3000/global-lists/items/religion')
      .then(res => res.json())
      .then(data => setReligionOptions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load religion options:', err);
        setReligionOptions([]);
      });
    
    fetch('http://localhost:3000/global-lists/items/ethnicity')
      .then(res => res.json())
      .then(data => setEthnicityOptions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load ethnicity options:', err);
        setEthnicityOptions([]);
      });
    
    // Load academic structure
    fetch('http://localhost:3000/year-groups')
      .then(res => res.json())
      .then(data => setYearGroups(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load year groups:', err);
        setYearGroups([]);
      });
    
    fetch('http://localhost:3000/houses')
      .then(res => res.json())
      .then(data => setHouses(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load houses:', err);
        setHouses([]);
      });
    
    fetch('http://localhost:3000/forms')
      .then(res => res.json())
      .then(data => setForms(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load forms:', err);
        setForms([]);
      });
  }, []);

  const handleOpen = (pupil?: Pupil) => {
    setTab(0);
    if (pupil) {
      setEditId(pupil.id);
      setForm({ ...pupil, parents: pupil.parents ? [...pupil.parents] : [] });
      setPhotoPreview(pupil.photo || '');
    } else {
      setEditId(null);
      setForm({ ...emptyPupil, parents: [] });
      setPhotoPreview('');
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = ev => {
        setPhotoPreview(ev.target?.result as string);
        setForm({ ...form, photo: ev.target?.result as string });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleParentChange = (idx: number, field: keyof ParentContact, value: any) => {
    const updated = [...form.parents];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, parents: updated });
  };

  const addParent = () => {
    setForm({ ...form, parents: [...form.parents, { ...emptyParent }] });
  };

  const removeParent = (idx: number) => {
    const updated = [...form.parents];
    updated.splice(idx, 1);
    setForm({ ...form, parents: updated });
  };

  const handleSave = async () => {
    if (editId) {
      // Update
      const updated = { ...form, id: editId, studentId: pupils.find(p => p.id === editId)?.studentId };
      await fetch(`http://localhost:3000/pupils/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } else {
      // Create
      const newId = crypto.randomUUID();
      const studentId = generateStudentId(pupils.map(p => p.studentId));
      const newPupil = { ...form, id: newId, studentId };
      await fetch('http://localhost:3000/pupils', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPupil),
      });
    }
    // Refresh list
    fetchFilteredPupils(filters);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`http://localhost:3000/pupils/${id}`, { method: 'DELETE' });
    fetchFilteredPupils(filters);
  };

  const fetchFilteredPupils = async (filters: any) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, String(val));
    });
    const res = await fetch(`http://localhost:3000/pupils?${params.toString()}`);
    setPupils(await res.json());
  };

function hasActiveFilters(filters: Record<string, string>) {
  // Exclude 'text' from the check
  return Object.entries(filters).some(
    ([key, val]) => key !== 'text' && val && val !== ''
  );
}

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Pupil Manager</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>Add Pupil</Button>
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Quick search"
          value={filters.text}
          onChange={e => setFilters(f => ({ ...f, text: e.target.value }))}
          fullWidth
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              fetchFilteredPupils(filters);
            }
          }}
        />
        <Button
          startIcon={
            <Badge
              color="error"
              variant="dot"
              invisible={!hasActiveFilters(filters)}
              overlap="circular"
            >
              <FilterListIcon />
            </Badge>
          }
          onClick={() => setFilterOpen(true)}
        >
          Filters
        </Button>
      </Stack>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Photo</TableCell>
            <TableCell>Full Name</TableCell>
            <TableCell>Date of Birth</TableCell>
            <TableCell>Year Group</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pupils.map(pupil => (
            <TableRow key={pupil.id}>
              <TableCell>
                {pupil.photo ? <Avatar src={pupil.photo} /> : <Avatar>{pupil.firstName?.[0]}</Avatar>}
              </TableCell>
              <TableCell>{`${pupil.firstName} ${pupil.middleName} ${pupil.lastName}`}</TableCell>
              <TableCell>{pupil.dob}</TableCell>
              <TableCell>{pupil.yearGroup}</TableCell>
              <TableCell>{pupil.status}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => handleOpen(pupil)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(pupil.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Pupil' : 'Add Pupil'}</DialogTitle>
        <DialogContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="General" />
            <Tab label="School" />
            <Tab label="Contacts" />
          </Tabs>
          {tab === 0 && (
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Avatar src={photoPreview} sx={{ width: 64, height: 64 }} />
                <Button variant="outlined" component="label">
                  Upload Photo
                  <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                </Button>
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} fullWidth />
                <TextField label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} fullWidth />
                <TextField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} fullWidth />
                <TextField label="Preferred Name" name="preferredName" value={form.preferredName} onChange={handleChange} fullWidth />
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Gender" name="gender" value={form.gender} onChange={handleChange} select fullWidth>
                  <MenuItem value="">Select</MenuItem>
                  {genderOptions.filter(g => g.is_active).map(g => (
                    <MenuItem key={g.id} value={g.value}>{g.value}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} select fullWidth>
                  <MenuItem value="">Select</MenuItem>
                  {nationalityOptions.filter(n => n.is_active).map(n => (
                    <MenuItem key={n.id} value={n.value}>{n.value}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Country of Birth" name="countryOfBirth" value={form.countryOfBirth} onChange={handleChange} fullWidth />
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Languages Spoken at Home" name="languages" value={form.languages} onChange={handleChange} fullWidth />
                <TextField label="Religion" name="religion" value={form.religion} onChange={handleChange} select fullWidth>
                  <MenuItem value="">Select</MenuItem>
                  {religionOptions.filter(r => r.is_active).map(r => (
                    <MenuItem key={r.id} value={r.value}>{r.value}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Ethnicity" name="ethnicity" value={form.ethnicity} onChange={handleChange} select fullWidth>
                  <MenuItem value="">Select</MenuItem>
                  {ethnicityOptions.filter(e => e.is_active).map(e => (
                    <MenuItem key={e.id} value={e.value}>{e.value}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="SEN Status" name="senStatus" value={form.senStatus} onChange={handleChange} fullWidth />
                <TextField label="SEN Details" name="senDetails" value={form.senDetails} onChange={handleChange} fullWidth />
              </Stack>
              <TextField label="Behavioural Notes" name="behaviourNotes" value={form.behaviourNotes} onChange={handleChange} fullWidth multiline rows={2} sx={{ mt: 2 }} />
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Stack direction="row" spacing={2}>
                <TextField label="Student ID" name="studentId" value={editId ? pupils.find(p => p.id === editId)?.studentId : 'Auto-generated'} fullWidth disabled />
                <TextField label="Year Group" name="yearGroup" value={form.yearGroup} onChange={handleChange} select fullWidth>
                  <MenuItem value="">Select</MenuItem>
                  {yearGroups.filter(yg => yg.is_active).map(yg => (
                    <MenuItem key={yg.id} value={yg.name}>{yg.name}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Form/Class" name="form" value={form.form} onChange={handleChange} select fullWidth>
                  <MenuItem value="">Select</MenuItem>
                  {forms.filter(f => f.is_active).map(f => (
                    <MenuItem key={f.id} value={f.name}>{f.name}</MenuItem>
                  ))}
                </TextField>
                <TextField label="House" name="house" value={form.house} onChange={handleChange} select fullWidth>
                  <MenuItem value="">Select</MenuItem>
                  {houses.filter(h => h.is_active).map(h => (
                    <MenuItem key={h.id} value={h.name}>{h.name}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Tutor" name="tutor" value={form.tutor} onChange={handleChange} fullWidth />
                <TextField label="Enrollment Date" name="enrollmentDate" type="date" value={form.enrollmentDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Status" name="status" value={form.status} onChange={handleChange} select fullWidth>
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Former">Former</MenuItem>
                  <MenuItem value="Applicant">Applicant</MenuItem>
                  <MenuItem value="Excluded">Excluded</MenuItem>
                </TextField>
                <TextField label="Key Stage Level" name="keyStage" value={form.keyStage} onChange={handleChange} fullWidth />
                <TextField label="School Leaving Date" name="leavingDate" type="date" value={form.leavingDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
              </Stack>
            </Box>
          )}
          {tab === 2 && (
            <Box>
              <Stack direction="row" spacing={2}>
                <TextField label="Home Address" name="homeAddress" value={form.homeAddress} onChange={handleChange} fullWidth />
                <TextField label="Primary Phone" name="primaryPhone" value={form.primaryPhone} onChange={handleChange} fullWidth />
                <TextField label="Student Email" name="email" value={form.email} onChange={handleChange} fullWidth />
              </Stack>
              <Typography variant="subtitle1" mt={2}>Parents/Guardians</Typography>
              {form.parents.map((parent, idx) => (
                <Box key={idx} sx={{ border: '1px solid #eee', borderRadius: 2, p: 2, mt: 1, mb: 1 }}>
                  <Stack direction="row" spacing={2}>
                    <TextField label="Relationship" value={parent.relationship} onChange={e => handleParentChange(idx, 'relationship', e.target.value)} fullWidth />
                    <TextField label="Name" value={parent.name} onChange={e => handleParentChange(idx, 'name', e.target.value)} fullWidth />
                    <TextField label="Phone" value={parent.phone} onChange={e => handleParentChange(idx, 'phone', e.target.value)} fullWidth />
                  </Stack>
                  <Stack direction="row" spacing={2} mt={2}>
                    <TextField label="Email" value={parent.email} onChange={e => handleParentChange(idx, 'email', e.target.value)} fullWidth />
                    <TextField label="Address" value={parent.address} onChange={e => handleParentChange(idx, 'address', e.target.value)} fullWidth />
                  </Stack>
                  <Stack direction="row" spacing={2} mt={2}>
                    <FormControlLabel
                      control={<Checkbox checked={parent.priority} onChange={e => handleParentChange(idx, 'priority', e.target.checked)} />}
                      label="Priority Contact"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={parent.pickup} onChange={e => handleParentChange(idx, 'pickup', e.target.checked)} />}
                      label="Pickup Authorisation"
                    />
                    <Button color="error" onClick={() => removeParent(idx)}>Remove</Button>
                  </Stack>
                </Box>
              ))}
              <Button startIcon={<AddIcon />} onClick={addParent} sx={{ mt: 1 }}>Add Parent/Guardian</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Status"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              select
            >
              <MenuItem value="">(Any)</MenuItem>
              {statusOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Form"
              value={filters.form}
              onChange={e => setFilters(f => ({ ...f, form: e.target.value }))}
              select
            >
              <MenuItem value="">(Any)</MenuItem>
              {formOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Year Group"
              value={filters.yearGroup}
              onChange={e => setFilters(f => ({ ...f, yearGroup: e.target.value }))}
              select
            >
              <MenuItem value="">(Any)</MenuItem>
              {yearGroupOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="House"
              value={filters.house}
              onChange={e => setFilters(f => ({ ...f, house: e.target.value }))}
              select
            >
              <MenuItem value="">(Any)</MenuItem>
              {houseOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Country of Birth"
              value={filters.countryOfBirth}
              onChange={e => setFilters(f => ({ ...f, countryOfBirth: e.target.value }))}
              select
            >
              <MenuItem value="">(Any)</MenuItem>
              {countryOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Nationality"
              value={filters.nationality}
              onChange={e => setFilters(f => ({ ...f, nationality: e.target.value }))}
              select
            >
              <MenuItem value="">(Any)</MenuItem>
              {legacyNationalityOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField label="Enrolled After" type="date" value={filters.enrolledAfter} onChange={e => setFilters(f => ({ ...f, enrolledAfter: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Enrolled Before" type="date" value={filters.enrolledBefore} onChange={e => setFilters(f => ({ ...f, enrolledBefore: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Leaving After" type="date" value={filters.leavingAfter} onChange={e => setFilters(f => ({ ...f, leavingAfter: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Leaving Before" type="date" value={filters.leavingBefore} onChange={e => setFilters(f => ({ ...f, leavingBefore: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="Parent/Guardian Name" value={filters.parentName} onChange={e => setFilters(f => ({ ...f, parentName: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { fetchFilteredPupils(filters); setFilterOpen(false); }}>Apply</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}