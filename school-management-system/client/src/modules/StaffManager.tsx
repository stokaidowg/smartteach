import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Stack, Checkbox, FormControlLabel, Tabs, Tab, Badge,
  Avatar, IconButton
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

type EmergencyContact = { name: string; relationship: string; phone: string; };
type Qualification = { type: string; name: string; institution?: string; year?: string; status?: string; };
type Document = { type: string; fileName: string; url: string; };
type Payroll = { bankAccount: string; salaryScale: string; payFrequency: string; taxCode: string; benefits: string; deductions: string; leaveBalance: string; };
type Schedule = { day: string; start: string; end: string; duty?: string; location?: string; };

type Staff = {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  title: string;
  gender: string;
  dob: string;
  nationalId: string;
  staffId: string;
  photo: string;
  nationality: string;
  languages: string;
  religion: string;
  jobTitle: string;
  department: string;
  roleType: string;
  lineManager: string;
  startDate: string;
  employmentType: string;
  status: string;
  workingHours: string;
  location: string;
  teachingSubjects: string;
  yearResponsibility: string;
  workEmail: string;
  personalEmail: string;
  phoneMobile: string;
  phoneWork: string;
  phoneHome: string;
  homeAddress: string;
  emergencyContact: EmergencyContact;
  qualifications: Qualification[];
  safeguarding: string;
  firstAid: string;
  backgroundCheck: string;
  documents: Document[];
  payroll: Payroll;
  schedule: Schedule[];
  notes: string;
  isTeachingStaff: boolean;
  isCoverStaff: boolean;
  maxTeachingHours: number | null;
};

const emptyStaff: Omit<Staff, 'id'> = {
  firstName: '',
  middleName: '',
  lastName: '',
  preferredName: '',
  title: '',
  gender: '',
  dob: '',
  nationalId: '',
  staffId: '',
  photo: '',
  nationality: '',
  languages: '',
  religion: '',
  jobTitle: '',
  department: '',
  roleType: '',
  lineManager: '',
  startDate: '',
  employmentType: '',
  status: '',
  workingHours: '',
  location: '',
  teachingSubjects: '',
  yearResponsibility: '',
  workEmail: '',
  personalEmail: '',
  phoneMobile: '',
  phoneWork: '',
  phoneHome: '',
  homeAddress: '',
  emergencyContact: { name: '', relationship: '', phone: '' },
  qualifications: [],
  safeguarding: '',
  firstAid: '',
  backgroundCheck: '',
  documents: [],
  payroll: {
    bankAccount: '',
    salaryScale: '',
    payFrequency: '',
    taxCode: '',
    benefits: '',
    deductions: '',
    leaveBalance: ''
  },
  schedule: [],
  notes: '',
  isTeachingStaff: false,
  isCoverStaff: false,
  maxTeachingHours: null,
};

function safeParse(val: any, fallback: any) {
  if (!val) return fallback;
  try {
    if (typeof val === 'object') return val;
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

const unique = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort();

// Global list item type
type GlobalListItem = {
  id: string;
  value: string;
  is_active: boolean;
};

type Department = {
  id: string;
  name: string;
  is_active: boolean;
};

export default function StaffManager() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<Omit<Staff, 'id'>>({ ...emptyStaff });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    roleType: '',
    jobTitle: '',
    location: '',
    employmentType: '',
    text: ''
  });

  // Normalized data from global lists and academic structure
  const [genderOptions, setGenderOptions] = useState<GlobalListItem[]>([]);
  const [religionOptions, setReligionOptions] = useState<GlobalListItem[]>([]);
  const [jobTitleOptions, setJobTitleOptions] = useState<GlobalListItem[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<GlobalListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Dynamic dropdowns (legacy - for filters)
  const statusOptions = unique(staff.map(s => s.status));
  const legacyDepartmentOptions = unique(staff.map(s => s.department));
  const roleTypeOptions = unique(staff.map(s => s.roleType));
  const legacyJobTitleOptions = unique(staff.map(s => s.jobTitle));
  const locationOptions = unique(staff.map(s => s.location));
  const legacyEmploymentTypeOptions = unique(staff.map(s => s.employmentType));

  useEffect(() => {
    // Load staff data
    fetch('/staff')
      .then(res => res.json())
      .then(data => {
        setStaff(
          Array.isArray(data)
            ? data.map((s: any) => ({
                id: s.id,
                firstName: s.first_name ?? '',
                middleName: s.middle_name ?? '',
                lastName: s.last_name ?? '',
                preferredName: s.preferred_name ?? '',
                title: s.title ?? '',
                gender: s.gender ?? '',
                dob: s.dob ?? '',
                nationalId: s.national_id ?? '',
                staffId: s.staff_id ?? '',
                photo: s.photo ?? '',
                nationality: s.nationality ?? '',
                languages: s.languages ?? '',
                religion: s.religion ?? '',
                jobTitle: s.job_title ?? '',
                department: s.department ?? '',
                roleType: s.role_type ?? '',
                lineManager: s.line_manager ?? '',
                startDate: s.start_date ?? '',
                employmentType: s.employment_type ?? '',
                status: s.status ?? '',
                workingHours: s.working_hours ?? '',
                location: s.location ?? '',
                teachingSubjects: s.teaching_subjects ?? '',
                yearResponsibility: s.year_responsibility ?? '',
                workEmail: s.work_email ?? '',
                personalEmail: s.personal_email ?? '',
                phoneMobile: s.phone_mobile ?? '',
                phoneWork: s.phone_work ?? '',
                phoneHome: s.phone_home ?? '',
                homeAddress: s.home_address ?? '',
                emergencyContact: safeParse(s.emergency_contact, { name: '', relationship: '', phone: '' }),
                qualifications: safeParse(s.qualifications, []),
                safeguarding: s.safeguarding ?? '',
                firstAid: s.first_aid ?? '',
                backgroundCheck: s.background_check ?? '',
                documents: safeParse(s.documents, []),
                payroll: safeParse(s.payroll, {
                  bankAccount: '',
                  salaryScale: '',
                  payFrequency: '',
                  taxCode: '',
                  benefits: '',
                  deductions: '',
                  leaveBalance: ''
                }),
                schedule: safeParse(s.schedule, []),
                notes: s.notes ?? '',
                isTeachingStaff: s.is_teaching_staff ?? false,
                isCoverStaff: s.is_cover_staff ?? false,
                maxTeachingHours: s.max_teaching_hours ?? null,
              }))
            : []
        );
      });
    
    // Load global lists
    fetch('http://localhost:3000/global-lists/items/gender')
      .then(res => res.json())
      .then(data => setGenderOptions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load gender options:', err);
        setGenderOptions([]);
      });
    
    fetch('http://localhost:3000/global-lists/items/religion')
      .then(res => res.json())
      .then(data => setReligionOptions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load religion options:', err);
        setReligionOptions([]);
      });
    
    fetch('http://localhost:3000/global-lists/items/job-title')
      .then(res => res.json())
      .then(data => setJobTitleOptions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load job title options:', err);
        setJobTitleOptions([]);
      });
    
    fetch('http://localhost:3000/global-lists/items/employment-type')
      .then(res => res.json())
      .then(data => setEmploymentTypeOptions(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load employment type options:', err);
        setEmploymentTypeOptions([]);
      });
    
    // Load departments
    fetch('http://localhost:3000/departments')
      .then(res => res.json())
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load departments:', err);
        setDepartments([]);
      });
  }, []);

  const handleOpen = (member?: Staff) => {
    setTab(0);
    if (member) {
      setEditId(member.id);
      setForm({ ...member });
      setPhotoPreview(member.photo || '');
    } else {
      setEditId(null);
      setForm({ ...emptyStaff });
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

  // When saving, map isCoverStaff to is_cover_staff and all fields
  const handleSave = async () => {
    // Map camelCase to snake_case for backend compatibility
    const safeForm = {
      id: editId || crypto.randomUUID(),
      first_name: form.firstName,
      middle_name: form.middleName,
      last_name: form.lastName,
      preferred_name: form.preferredName,
      title: form.title,
      gender: form.gender,
      dob: form.dob === '' ? null : form.dob,
      national_id: form.nationalId,
      staff_id: form.staffId,
      photo: form.photo,
      nationality: form.nationality,
      languages: form.languages,
      religion: form.religion,
      job_title: form.jobTitle,
      department: form.department,
      role_type: form.roleType,
      line_manager: form.lineManager,
      start_date: form.startDate === '' ? null : form.startDate,
      employment_type: form.employmentType,
      status: form.status,
      working_hours: form.workingHours,
      location: form.location,
      teaching_subjects: form.teachingSubjects,
      year_responsibility: form.yearResponsibility,
      work_email: form.workEmail,
      personal_email: form.personalEmail,
      phone_mobile: form.phoneMobile,
      phone_work: form.phoneWork,
      phone_home: form.phoneHome,
      home_address: form.homeAddress,
      emergency_contact: JSON.stringify(form.emergencyContact),
      qualifications: JSON.stringify(form.qualifications),
      safeguarding: form.safeguarding,
      first_aid: form.firstAid,
      background_check: form.backgroundCheck,
      documents: JSON.stringify(form.documents),
      payroll: JSON.stringify(form.payroll),
      schedule: JSON.stringify(form.schedule),
      notes: form.notes,
      is_teaching_staff: !!form.isTeachingStaff,
      is_cover_staff: !!form.isCoverStaff,
      max_teaching_hours: form.maxTeachingHours,
    };
    if (editId) {
      await fetch(`/staff/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...safeForm, id: editId }),
      });
    } else {
      await fetch('/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeForm),
      });
    }
    fetchFilteredStaff(filters);
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/staff/${id}`, { method: 'DELETE' });
    fetchFilteredStaff(filters);
  };

  const fetchFilteredStaff = async (filters: any) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, String(val));
    });
    const res = await fetch(`/staff?${params.toString()}`);
    const data = await res.json();
    setStaff(
      Array.isArray(data)
        ? data.map((s: any) => ({
            id: s.id,
            firstName: s.first_name ?? '',
            middleName: s.middle_name ?? '',
            lastName: s.last_name ?? '',
            preferredName: s.preferred_name ?? '',
            title: s.title ?? '',
            gender: s.gender ?? '',
            dob: s.dob ?? '',
            nationalId: s.national_id ?? '',
            staffId: s.staff_id ?? '',
            photo: s.photo ?? '',
            nationality: s.nationality ?? '',
            languages: s.languages ?? '',
            religion: s.religion ?? '',
            jobTitle: s.job_title ?? '',
            department: s.department ?? '',
            roleType: s.role_type ?? '',
            lineManager: s.line_manager ?? '',
            startDate: s.start_date ?? '',
            employmentType: s.employment_type ?? '',
            status: s.status ?? '',
            workingHours: s.working_hours ?? '',
            location: s.location ?? '',
            teachingSubjects: s.teaching_subjects ?? '',
            yearResponsibility: s.year_responsibility ?? '',
            workEmail: s.work_email ?? '',
            personalEmail: s.personal_email ?? '',
            phoneMobile: s.phone_mobile ?? '',
            phoneWork: s.phone_work ?? '',
            phoneHome: s.phone_home ?? '',
            homeAddress: s.home_address ?? '',
            emergencyContact: safeParse(s.emergency_contact, { name: '', relationship: '', phone: '' }),
            qualifications: safeParse(s.qualifications, []),
            safeguarding: s.safeguarding ?? '',
            firstAid: s.first_aid ?? '',
            backgroundCheck: s.background_check ?? '',
            documents: safeParse(s.documents, []),
            payroll: safeParse(s.payroll, {
              bankAccount: '',
              salaryScale: '',
              payFrequency: '',
              taxCode: '',
              benefits: '',
              deductions: '',
              leaveBalance: ''
            }),
            schedule: safeParse(s.schedule, []),
            notes: s.notes ?? '',
            isTeachingStaff: s.is_teaching_staff ?? false,
            isCoverStaff: s.is_cover_staff ?? false,
            maxTeachingHours: s.max_teaching_hours ?? null,
          }))
        : []
    );
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  function hasActiveFilters(filters: Record<string, string>) {
    return Object.entries(filters).some(
      ([key, val]) => key !== 'text' && val && val !== ''
    );
  }

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Staff Manager</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>Add Staff</Button>
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
              fetchFilteredStaff(filters);
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
            <TableCell>Job Title</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.isArray(staff) && staff.map(member => (
            <TableRow key={member.id}>
              <TableCell>
                {member.photo ? <Avatar src={member.photo} /> : <Avatar>{member.firstName?.[0]}</Avatar>}
              </TableCell>
              <TableCell>{`${member.title} ${member.firstName} ${member.middleName} ${member.lastName}`}</TableCell>
              <TableCell>{member.jobTitle}</TableCell>
              <TableCell>{member.department}</TableCell>
              <TableCell>{member.status}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => handleOpen(member)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(member.id)}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editId ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
        <DialogContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="General Info" />
            <Tab label="Employment" />
            <Tab label="Contact" />
            <Tab label="Qualifications" />
            <Tab label="Documents" />
            <Tab label="Payroll" />
            <Tab label="Schedule" />
            <Tab label="Notes" />
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
                <TextField label="Title" name="title" value={form.title} onChange={handleChange} select fullWidth>
                  <MenuItem value="">(None)</MenuItem>
                  <MenuItem value="Mr">Mr</MenuItem>
                  <MenuItem value="Mrs">Mrs</MenuItem>
                  <MenuItem value="Ms">Ms</MenuItem>
                  <MenuItem value="Miss">Miss</MenuItem>
                  <MenuItem value="Dr">Dr</MenuItem>
                  <MenuItem value="Prof">Prof</MenuItem>
                </TextField>
                <TextField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} fullWidth />
                <TextField label="Middle Name" name="middleName" value={form.middleName} onChange={handleChange} fullWidth />
                <TextField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} fullWidth />
                <TextField label="Preferred Name" name="preferredName" value={form.preferredName} onChange={handleChange} fullWidth />
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Gender" name="gender" value={form.gender} onChange={handleChange} select fullWidth>
                  <MenuItem value="">(None)</MenuItem>
                  {genderOptions.filter(g => g.is_active).map(g => (
                    <MenuItem key={g.id} value={g.value}>{g.value}</MenuItem>
                  ))}
                </TextField>
                <TextField label="National Insurance / SSN" name="nationalId" value={form.nationalId} onChange={handleChange} fullWidth />
                <TextField label="Staff ID" name="staffId" value={form.staffId} onChange={handleChange} fullWidth />
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} fullWidth />
                <TextField label="Languages" name="languages" value={form.languages} onChange={handleChange} fullWidth />
                <TextField label="Religion" name="religion" value={form.religion} onChange={handleChange} select fullWidth>
                  <MenuItem value="">(None)</MenuItem>
                  {religionOptions.filter(r => r.is_active).map(r => (
                    <MenuItem key={r.id} value={r.value}>{r.value}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isTeachingStaff"
                    checked={!!form.isTeachingStaff}
                    onChange={e => setForm({ ...form, isTeachingStaff: e.target.checked })}
                  />
                }
                label="Teaching Staff"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.isCoverStaff}
                    onChange={e => setForm({ ...form, isCoverStaff: e.target.checked })}
                  />
                }
                label="Is Cover Staff"
              />
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Stack direction="row" spacing={2}>
                <TextField label="Job Title" name="jobTitle" value={form.jobTitle} onChange={handleChange} select fullWidth>
                  <MenuItem value="">(None)</MenuItem>
                  {jobTitleOptions.filter(j => j.is_active).map(j => (
                    <MenuItem key={j.id} value={j.value}>{j.value}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Department" name="department" value={form.department} onChange={handleChange} select fullWidth>
                  <MenuItem value="">(None)</MenuItem>
                  {departments.filter(d => d.is_active).map(d => (
                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Role Type" name="roleType" value={form.roleType} onChange={handleChange} select fullWidth>
                  <MenuItem value="">(None)</MenuItem>
                  <MenuItem value="Teaching">Teaching</MenuItem>
                  <MenuItem value="Support">Support</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Catering">Catering</MenuItem>
                </TextField>
                <TextField label="Line Manager" name="lineManager" value={form.lineManager} onChange={handleChange} fullWidth />
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="Employment Type" name="employmentType" value={form.employmentType} onChange={handleChange} select fullWidth>
                  <MenuItem value="">(None)</MenuItem>
                  {employmentTypeOptions.filter(e => e.is_active).map(e => (
                    <MenuItem key={e.id} value={e.value}>{e.value}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Status" name="status" value={form.status} onChange={handleChange} select fullWidth>
                  <MenuItem value="">(None)</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="On Leave">On Leave</MenuItem>
                  <MenuItem value="Terminated">Terminated</MenuItem>
                </TextField>
                <TextField label="Working Hours" name="workingHours" value={form.workingHours} onChange={handleChange} fullWidth />
                <TextField label="Location/Campus" name="location" value={form.location} onChange={handleChange} fullWidth />
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Teaching Subjects" name="teachingSubjects" value={form.teachingSubjects} onChange={handleChange} fullWidth />
                <TextField label="Year/Form Responsibility" name="yearResponsibility" value={form.yearResponsibility} onChange={handleChange} fullWidth />
                <TextField
                  label="Max Teaching Hours"
                  name="maxTeachingHours"
                  type="number"
                  value={form.maxTeachingHours ?? ''}
                  onChange={e =>
                    setForm({
                      ...form,
                      maxTeachingHours: e.target.value === '' ? null : parseInt(e.target.value, 10)
                    })
                  }
                  fullWidth
                />
              </Stack>
            </Box>
          )}
          {tab === 2 && (
            <Box>
              <Stack direction="row" spacing={2}>
                <TextField label="Work Email" name="workEmail" value={form.workEmail} onChange={handleChange} fullWidth />
                <TextField label="Personal Email" name="personalEmail" value={form.personalEmail} onChange={handleChange} fullWidth />
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Mobile Phone" name="phoneMobile" value={form.phoneMobile} onChange={handleChange} fullWidth />
                <TextField label="Work Phone" name="phoneWork" value={form.phoneWork} onChange={handleChange} fullWidth />
                <TextField label="Home Phone" name="phoneHome" value={form.phoneHome} onChange={handleChange} fullWidth />
              </Stack>
              <TextField label="Home Address" name="homeAddress" value={form.homeAddress} onChange={handleChange} fullWidth sx={{ mt: 2 }} />
              <Typography variant="subtitle1" mt={2}>Emergency Contact</Typography>
              <Stack direction="row" spacing={2} mt={1}>
                <TextField label="Name" value={form.emergencyContact.name} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value } }))} fullWidth />
                <TextField label="Relationship" value={form.emergencyContact.relationship} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, relationship: e.target.value } }))} fullWidth />
                <TextField label="Phone" value={form.emergencyContact.phone} onChange={e => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value } }))} fullWidth />
              </Stack>
            </Box>
          )}
          {tab === 3 && (
            <Box>
              {/* Qualifications & Training */}
              {/* For brevity, just a textarea for now */}
              <TextField
                label="Qualifications, Certifications, Training (comma separated or free text)"
                value={form.qualifications.map(q => q.name).join(', ')}
                onChange={e => setForm(f => ({ ...f, qualifications: e.target.value.split(',').map(name => ({ type: 'Other', name: name.trim() })) }))}
                fullWidth
                multiline
                rows={3}
              />
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Safeguarding Training" name="safeguarding" value={form.safeguarding} onChange={handleChange} fullWidth />
                <TextField label="First Aid Certification" name="firstAid" value={form.firstAid} onChange={handleChange} fullWidth />
                <TextField label="Background/DBS Check" name="backgroundCheck" value={form.backgroundCheck} onChange={handleChange} fullWidth />
              </Stack>
            </Box>
          )}
          {tab === 4 && (
            <Box>
              {/* Documents - just a list for now */}
              <Typography variant="subtitle1">Uploaded Documents</Typography>
              <ul>
                {form.documents.map((doc, idx) => (
                  <li key={idx}><a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.fileName}</a> ({doc.type})</li>
                ))}
              </ul>
              <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 1 }}>Upload Document</Button>
            </Box>
          )}
          {tab === 5 && (
            <Box>
              <Stack direction="row" spacing={2}>
                <TextField label="Bank Account" name="bankAccount" value={form.payroll.bankAccount} onChange={e => setForm(f => ({ ...f, payroll: { ...f.payroll, bankAccount: e.target.value } }))} fullWidth />
                <TextField label="Salary Scale/Band" name="salaryScale" value={form.payroll.salaryScale} onChange={e => setForm(f => ({ ...f, payroll: { ...f.payroll, salaryScale: e.target.value } }))} fullWidth />
                <TextField label="Pay Frequency" name="payFrequency" value={form.payroll.payFrequency} onChange={e => setForm(f => ({ ...f, payroll: { ...f.payroll, payFrequency: e.target.value } }))} fullWidth />
                <TextField label="Tax Code" name="taxCode" value={form.payroll.taxCode} onChange={e => setForm(f => ({ ...f, payroll: { ...f.payroll, taxCode: e.target.value } }))} fullWidth />
              </Stack>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField label="Benefits" name="benefits" value={form.payroll.benefits} onChange={e => setForm(f => ({ ...f, payroll: { ...f.payroll, benefits: e.target.value } }))} fullWidth />
                <TextField label="Deductions" name="deductions" value={form.payroll.deductions} onChange={e => setForm(f => ({ ...f, payroll: { ...f.payroll, deductions: e.target.value } }))} fullWidth />
                <TextField label="Leave Balance" name="leaveBalance" value={form.payroll.leaveBalance} onChange={e => setForm(f => ({ ...f, payroll: { ...f.payroll, leaveBalance: e.target.value } }))} fullWidth />
              </Stack>
            </Box>
          )}
          {tab === 6 && (
            <Box>
              {/* Schedule/Roster - just a textarea for now */}
              <TextField
                label="Weekly Schedule / Duties (free text or CSV)"
                value={form.schedule.map(s => `${s.day}: ${s.start}-${s.end} ${s.duty || ''}`).join('\n')}
                onChange={e => setForm(f => ({
                  ...f,
                  schedule: e.target.value.split('\n').map(line => {
                    const [day, rest] = line.split(':');
                    if (!rest) return { day: day.trim(), start: '', end: '', duty: '' };
                    const [times, ...dutyArr] = rest.trim().split(' ');
                    const [start, end] = times.split('-');
                    return { day: day.trim(), start: start || '', end: end || '', duty: dutyArr.join(' ') };
                  })
                }))}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          )}
          {tab === 7 && (
            <Box>
              <TextField
                label="Notes / Incidents / Reviews"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
              />
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
            <TextField label="Status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} select>
              <MenuItem value="">(Any)</MenuItem>
              {statusOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField label="Department" value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} select>
              <MenuItem value="">(Any)</MenuItem>
              {legacyDepartmentOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField label="Role Type" value={filters.roleType} onChange={e => setFilters(f => ({ ...f, roleType: e.target.value }))} select>
              <MenuItem value="">(Any)</MenuItem>
              {roleTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField label="Job Title" value={filters.jobTitle} onChange={e => setFilters(f => ({ ...f, jobTitle: e.target.value }))} select>
              <MenuItem value="">(Any)</MenuItem>
              {legacyJobTitleOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField label="Location" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} select>
              <MenuItem value="">(Any)</MenuItem>
              {locationOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField label="Employment Type" value={filters.employmentType} onChange={e => setFilters(f => ({ ...f, employmentType: e.target.value }))} select>
              <MenuItem value="">(Any)</MenuItem>
              {legacyEmploymentTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { fetchFilteredStaff(filters); setFilterOpen(false); }}>Apply</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}