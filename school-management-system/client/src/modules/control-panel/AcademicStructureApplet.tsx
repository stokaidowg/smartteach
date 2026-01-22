import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';
import authFetch from '../../utils/authFetch';

interface YearGroup {
  id: string;
  name: string;
  code: string;
  key_stage: number;
  sort_order: number;
  capacity: number;
  is_active: boolean;
  academic_year: string;
  notes: string;
  pupil_count: number;
}

interface House {
  id: string;
  name: string;
  code: string;
  color: string;
  house_captain_staff_id: string;
  captain_first_name: string;
  captain_last_name: string;
  points: number;
  is_active: boolean;
  description: string;
  pupil_count: number;
}

interface Form {
  id: string;
  name: string;
  code: string;
  year_group_id: string;
  year_group_name: string;
  form_tutor_id: string;
  tutor_first_name: string;
  tutor_last_name: string;
  room_id: string;
  room_code: string;
  capacity: number;
  is_active: boolean;
  notes: string;
  pupil_count: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  head_of_department_id: string;
  hod_first_name: string;
  hod_last_name: string;
  budget: number;
  is_active: boolean;
  description: string;
  staff_count: number;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
}

interface Room {
  id: string;
  room_code: string;
}

export default function AcademicStructureApplet() {
  const [activeTab, setActiveTab] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  
  // Year Groups state
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([]);
  const [yearGroupDialog, setYearGroupDialog] = useState(false);
  const [editingYearGroup, setEditingYearGroup] = useState<YearGroup | null>(null);
  
  // Houses state
  const [houses, setHouses] = useState<House[]>([]);
  const [houseDialog, setHouseDialog] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  
  // Forms state
  const [forms, setForms] = useState<Form[]>([]);
  const [formDialog, setFormDialog] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  
  // Departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentDialog, setDepartmentDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // Lookup data
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadYearGroups();
    loadHouses();
    loadForms();
    loadDepartments();
    loadStaff();
    loadRooms();
  }, [showInactive]);

  const loadYearGroups = async () => {
    try {
      const data = await authFetch(`http://localhost:3000/year-groups?includeInactive=${showInactive}`);
      setYearGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load year groups:', err);
      setYearGroups([]);
      setError('Failed to load year groups');
    }
  };

  const loadHouses = async () => {
    try {
      const data = await authFetch(`http://localhost:3000/houses?includeInactive=${showInactive}`);
      setHouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load houses:', err);
      setHouses([]);
      setError('Failed to load houses');
    }
  };

  const loadForms = async () => {
    try {
      const data = await authFetch(`http://localhost:3000/forms?includeInactive=${showInactive}`);
      setForms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load forms:', err);
      setForms([]);
      setError('Failed to load forms');
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await authFetch(`http://localhost:3000/departments?includeInactive=${showInactive}`);
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load departments:', err);
      setDepartments([]);
      setError('Failed to load departments');
    }
  };

  const loadStaff = async () => {
    try {
      const data = await authFetch('http://localhost:3000/staff');
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load staff:', err);
      setStaff([]);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await authFetch('http://localhost:3000/rooms');
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setRooms([]);
    }
  };

  // Year Group handlers
  const handleAddYearGroup = () => {
    setEditingYearGroup({
      id: '',
      name: '',
      code: '',
      key_stage: 1,
      sort_order: 0,
      capacity: 0,
      is_active: true,
      academic_year: '',
      notes: '',
      pupil_count: 0
    });
    setYearGroupDialog(true);
  };

  const handleEditYearGroup = (yg: YearGroup) => {
    setEditingYearGroup(yg);
    setYearGroupDialog(true);
  };

  const handleSaveYearGroup = async () => {
    if (!editingYearGroup) return;
    
    try {
      if (editingYearGroup.id) {
        await authFetch(`http://localhost:3000/year-groups/${editingYearGroup.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingYearGroup)
        });
      } else {
        await authFetch('http://localhost:3000/year-groups', {
          method: 'POST',
          body: JSON.stringify(editingYearGroup)
        });
      }
      setYearGroupDialog(false);
      loadYearGroups();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save year group');
    }
  };

  const handleDeleteYearGroup = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this year group?')) return;
    
    try {
      await authFetch(`http://localhost:3000/year-groups/${id}`, { method: 'DELETE' });
      loadYearGroups();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete year group');
    }
  };

  // House handlers
  const handleAddHouse = () => {
    setEditingHouse({
      id: '',
      name: '',
      code: '',
      color: '#000000',
      house_captain_staff_id: '',
      captain_first_name: '',
      captain_last_name: '',
      points: 0,
      is_active: true,
      description: '',
      pupil_count: 0
    });
    setHouseDialog(true);
  };

  const handleEditHouse = (house: House) => {
    setEditingHouse(house);
    setHouseDialog(true);
  };

  const handleSaveHouse = async () => {
    if (!editingHouse) return;
    
    try {
      if (editingHouse.id) {
        await authFetch(`http://localhost:3000/houses/${editingHouse.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingHouse)
        });
      } else {
        await authFetch('http://localhost:3000/houses', {
          method: 'POST',
          body: JSON.stringify(editingHouse)
        });
      }
      setHouseDialog(false);
      loadHouses();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save house');
    }
  };

  const handleDeleteHouse = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this house?')) return;
    
    try {
      await authFetch(`http://localhost:3000/houses/${id}`, { method: 'DELETE' });
      loadHouses();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete house');
    }
  };

  // Form handlers
  const handleAddForm = () => {
    setEditingForm({
      id: '',
      name: '',
      code: '',
      year_group_id: '',
      year_group_name: '',
      form_tutor_id: '',
      tutor_first_name: '',
      tutor_last_name: '',
      room_id: '',
      room_code: '',
      capacity: 0,
      is_active: true,
      notes: '',
      pupil_count: 0
    });
    setFormDialog(true);
  };

  const handleEditForm = (form: Form) => {
    setEditingForm(form);
    setFormDialog(true);
  };

  const handleSaveForm = async () => {
    if (!editingForm) return;
    
    try {
      if (editingForm.id) {
        await authFetch(`http://localhost:3000/forms/${editingForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingForm)
        });
      } else {
        await authFetch('http://localhost:3000/forms', {
          method: 'POST',
          body: JSON.stringify(editingForm)
        });
      }
      setFormDialog(false);
      loadForms();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save form');
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;
    
    try {
      await authFetch(`http://localhost:3000/forms/${id}`, { method: 'DELETE' });
      loadForms();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete form');
    }
  };

  // Department handlers
  const handleAddDepartment = () => {
    setEditingDepartment({
      id: '',
      name: '',
      code: '',
      head_of_department_id: '',
      hod_first_name: '',
      hod_last_name: '',
      budget: 0,
      is_active: true,
      description: '',
      staff_count: 0
    });
    setDepartmentDialog(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setDepartmentDialog(true);
  };

  const handleSaveDepartment = async () => {
    if (!editingDepartment) return;
    
    try {
      if (editingDepartment.id) {
        await authFetch(`http://localhost:3000/departments/${editingDepartment.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingDepartment)
        });
      } else {
        await authFetch('http://localhost:3000/departments', {
          method: 'POST',
          body: JSON.stringify(editingDepartment)
        });
      }
      setDepartmentDialog(false);
      loadDepartments();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save department');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    
    try {
      await authFetch(`http://localhost:3000/departments/${id}`, { method: 'DELETE' });
      loadDepartments();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete department');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Academic Structure Management</Typography>
      
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      
      <FormControlLabel
        control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
        label="Show Inactive"
      />

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Year Groups (${yearGroups.length})`} />
        <Tab label={`Houses (${houses.length})`} />
        <Tab label={`Forms (${forms.length})`} />
        <Tab label={`Departments (${departments.length})`} />
      </Tabs>

      {/* Year Groups Tab */}
      {activeTab === 0 && (
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddYearGroup} sx={{ mb: 2 }}>
            Add Year Group
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Key Stage</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Pupils</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {yearGroups.map((yg) => (
                  <TableRow key={yg.id}>
                    <TableCell>{yg.name}</TableCell>
                    <TableCell>{yg.code}</TableCell>
                    <TableCell>{yg.key_stage}</TableCell>
                    <TableCell>{yg.capacity || '-'}</TableCell>
                    <TableCell>{yg.pupil_count}</TableCell>
                    <TableCell>
                      <Chip label={yg.is_active ? 'Active' : 'Inactive'} color={yg.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditYearGroup(yg)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteYearGroup(yg.id)} size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Houses Tab */}
      {activeTab === 1 && (
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddHouse} sx={{ mb: 2 }}>
            Add House
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Captain</TableCell>
                  <TableCell>Points</TableCell>
                  <TableCell>Pupils</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {houses.map((house) => (
                  <TableRow key={house.id}>
                    <TableCell>{house.name}</TableCell>
                    <TableCell>{house.code}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, bgcolor: house.color, border: '1px solid #ccc' }} />
                        {house.color}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {house.captain_first_name ? `${house.captain_first_name} ${house.captain_last_name}` : '-'}
                    </TableCell>
                    <TableCell>{house.points}</TableCell>
                    <TableCell>{house.pupil_count}</TableCell>
                    <TableCell>
                      <Chip label={house.is_active ? 'Active' : 'Inactive'} color={house.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditHouse(house)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteHouse(house.id)} size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Forms Tab */}
      {activeTab === 2 && (
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddForm} sx={{ mb: 2 }}>
            Add Form
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Year Group</TableCell>
                  <TableCell>Form Tutor</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Pupils</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>{form.name}</TableCell>
                    <TableCell>{form.code}</TableCell>
                    <TableCell>{form.year_group_name || '-'}</TableCell>
                    <TableCell>
                      {form.tutor_first_name ? `${form.tutor_first_name} ${form.tutor_last_name}` : '-'}
                    </TableCell>
                    <TableCell>{form.room_code || '-'}</TableCell>
                    <TableCell>{form.capacity || '-'}</TableCell>
                    <TableCell>{form.pupil_count}</TableCell>
                    <TableCell>
                      <Chip label={form.is_active ? 'Active' : 'Inactive'} color={form.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditForm(form)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteForm(form.id)} size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Departments Tab */}
      {activeTab === 3 && (
        <Box>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddDepartment} sx={{ mb: 2 }}>
            Add Department
          </Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Head of Department</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Staff</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>{dept.code}</TableCell>
                    <TableCell>
                      {dept.hod_first_name ? `${dept.hod_first_name} ${dept.hod_last_name}` : '-'}
                    </TableCell>
                    <TableCell>{dept.budget ? `£${dept.budget.toLocaleString()}` : '-'}</TableCell>
                    <TableCell>{dept.staff_count}</TableCell>
                    <TableCell>
                      <Chip label={dept.is_active ? 'Active' : 'Inactive'} color={dept.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditDepartment(dept)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteDepartment(dept.id)} size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Year Group Dialog */}
      <Dialog open={yearGroupDialog} onClose={() => setYearGroupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingYearGroup?.id ? 'Edit Year Group' : 'Add Year Group'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editingYearGroup?.name || ''}
            onChange={(e) => setEditingYearGroup(prev => prev ? { ...prev, name: e.target.value } : null)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Code"
            value={editingYearGroup?.code || ''}
            onChange={(e) => setEditingYearGroup(prev => prev ? { ...prev, code: e.target.value } : null)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Key Stage</InputLabel>
            <Select
              value={editingYearGroup?.key_stage || 1}
              onChange={(e) => setEditingYearGroup(prev => prev ? { ...prev, key_stage: Number(e.target.value) } : null)}
            >
              <MenuItem value={1}>Key Stage 1</MenuItem>
              <MenuItem value={2}>Key Stage 2</MenuItem>
              <MenuItem value={3}>Key Stage 3</MenuItem>
              <MenuItem value={4}>Key Stage 4</MenuItem>
              <MenuItem value={5}>Key Stage 5</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Capacity"
            value={editingYearGroup?.capacity || ''}
            onChange={(e) => setEditingYearGroup(prev => prev ? { ...prev, capacity: Number(e.target.value) } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Academic Year"
            value={editingYearGroup?.academic_year || ''}
            onChange={(e) => setEditingYearGroup(prev => prev ? { ...prev, academic_year: e.target.value } : null)}
            margin="normal"
            placeholder="e.g. 2025-2026"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={editingYearGroup?.notes || ''}
            onChange={(e) => setEditingYearGroup(prev => prev ? { ...prev, notes: e.target.value } : null)}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingYearGroup?.is_active || false}
                onChange={(e) => setEditingYearGroup(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYearGroupDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveYearGroup} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* House Dialog */}
      <Dialog open={houseDialog} onClose={() => setHouseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingHouse?.id ? 'Edit House' : 'Add House'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editingHouse?.name || ''}
            onChange={(e) => setEditingHouse(prev => prev ? { ...prev, name: e.target.value } : null)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Code"
            value={editingHouse?.code || ''}
            onChange={(e) => setEditingHouse(prev => prev ? { ...prev, code: e.target.value } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            type="color"
            label="Color"
            value={editingHouse?.color || '#000000'}
            onChange={(e) => setEditingHouse(prev => prev ? { ...prev, color: e.target.value } : null)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>House Captain</InputLabel>
            <Select
              value={editingHouse?.house_captain_staff_id || ''}
              onChange={(e) => setEditingHouse(prev => prev ? { ...prev, house_captain_staff_id: e.target.value } : null)}
            >
              <MenuItem value="">None</MenuItem>
              {staff.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Points"
            value={editingHouse?.points || 0}
            onChange={(e) => setEditingHouse(prev => prev ? { ...prev, points: Number(e.target.value) } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={editingHouse?.description || ''}
            onChange={(e) => setEditingHouse(prev => prev ? { ...prev, description: e.target.value } : null)}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingHouse?.is_active || false}
                onChange={(e) => setEditingHouse(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHouseDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveHouse} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formDialog} onClose={() => setFormDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingForm?.id ? 'Edit Form' : 'Add Form'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editingForm?.name || ''}
            onChange={(e) => setEditingForm(prev => prev ? { ...prev, name: e.target.value } : null)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Code"
            value={editingForm?.code || ''}
            onChange={(e) => setEditingForm(prev => prev ? { ...prev, code: e.target.value } : null)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Year Group</InputLabel>
            <Select
              value={editingForm?.year_group_id || ''}
              onChange={(e) => setEditingForm(prev => prev ? { ...prev, year_group_id: e.target.value } : null)}
            >
              <MenuItem value="">None</MenuItem>
              {yearGroups.filter(yg => yg.is_active).map(yg => (
                <MenuItem key={yg.id} value={yg.id}>{yg.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Form Tutor</InputLabel>
            <Select
              value={editingForm?.form_tutor_id || ''}
              onChange={(e) => setEditingForm(prev => prev ? { ...prev, form_tutor_id: e.target.value } : null)}
            >
              <MenuItem value="">None</MenuItem>
              {staff.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Room</InputLabel>
            <Select
              value={editingForm?.room_id || ''}
              onChange={(e) => setEditingForm(prev => prev ? { ...prev, room_id: e.target.value } : null)}
            >
              <MenuItem value="">None</MenuItem>
              {rooms.map(r => (
                <MenuItem key={r.id} value={r.id}>{r.room_code}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Capacity"
            value={editingForm?.capacity || ''}
            onChange={(e) => setEditingForm(prev => prev ? { ...prev, capacity: Number(e.target.value) } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={editingForm?.notes || ''}
            onChange={(e) => setEditingForm(prev => prev ? { ...prev, notes: e.target.value } : null)}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingForm?.is_active || false}
                onChange={(e) => setEditingForm(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveForm} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={departmentDialog} onClose={() => setDepartmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDepartment?.id ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editingDepartment?.name || ''}
            onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, name: e.target.value } : null)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Code"
            value={editingDepartment?.code || ''}
            onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, code: e.target.value } : null)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Head of Department</InputLabel>
            <Select
              value={editingDepartment?.head_of_department_id || ''}
              onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, head_of_department_id: e.target.value } : null)}
            >
              <MenuItem value="">None</MenuItem>
              {staff.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Budget (£)"
            value={editingDepartment?.budget || ''}
            onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, budget: Number(e.target.value) } : null)}
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={editingDepartment?.description || ''}
            onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, description: e.target.value } : null)}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editingDepartment?.is_active || false}
                onChange={(e) => setEditingDepartment(prev => prev ? { ...prev, is_active: e.target.checked } : null)}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveDepartment} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
