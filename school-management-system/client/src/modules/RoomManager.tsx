import React, { useEffect, useState } from 'react';
import {
  Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, MenuItem, Checkbox, FormControlLabel, Box, IconButton, Select
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

type Building = {
  id: string;
  name: string;
};

type Room = {
  id: string;
  building_id: string;
  room_code: string;
  room_name: string;
  is_teaching_room: boolean;
  is_cover_room: boolean;
  capacity: number;
  notes: string;
};

const emptyRoom: Omit<Room, 'id'> = {
  building_id: '',
  room_code: '',
  room_name: '',
  is_teaching_room: false,
  is_cover_room: false,
  capacity: 0,
  notes: ''
};

export default function RoomManager() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [roomForm, setRoomForm] = useState<Omit<Room, 'id'>>({ ...emptyRoom });
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [buildingForm, setBuildingForm] = useState({ name: '' });

  // Fetch buildings on mount
  useEffect(() => {
    fetch('http://localhost:3000/buildings')
      .then(res => res.json())
      .then(setBuildings);
  }, []);

  // Fetch rooms when building changes
  useEffect(() => {
    if (selectedBuilding) {
      fetch(`http://localhost:3000/rooms/${selectedBuilding}`)
        .then(res => res.json())
        .then(setRooms);
    } else {
      setRooms([]);
    }
  }, [selectedBuilding]);

  // Building handlers
  const handleAddBuilding = async () => {
    const id = crypto.randomUUID();
    await fetch('http://localhost:3000/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: buildingForm.name })
    });
    setBuildingForm({ name: '' });
    setBuildingDialogOpen(false);
    // Refresh buildings
    fetch('http://localhost:3000/buildings')
      .then(res => res.json())
      .then(setBuildings);
  };

  const handleDeleteBuilding = async (id: string) => {
    await fetch(`http://localhost:3000/buildings/${id}`, { method: 'DELETE' });
    setSelectedBuilding('');
    fetch('http://localhost:3000/buildings')
      .then(res => res.json())
      .then(setBuildings);
    setRooms([]);
  };

  // Room handlers
  const handleOpenRoomDialog = (room?: Room) => {
    if (room) {
      setEditRoomId(room.id);
      setRoomForm({ ...room });
    } else {
      setEditRoomId(null);
      setRoomForm({ ...emptyRoom, building_id: selectedBuilding });
    }
    setRoomDialogOpen(true);
  };

  const handleCloseRoomDialog = () => setRoomDialogOpen(false);

  const handleRoomFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setRoomForm(form => ({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveRoom = async () => {
    if (!roomForm.room_code || !roomForm.room_name) return;
    if (editRoomId) {
      await fetch(`http://localhost:3000/rooms/${editRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roomForm, id: editRoomId })
      });
    } else {
      const id = crypto.randomUUID();
      await fetch('http://localhost:3000/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roomForm, id })
      });
    }
    setRoomDialogOpen(false);
    // Refresh rooms
    fetch(`http://localhost:3000/rooms/${selectedBuilding}`)
      .then(res => res.json())
      .then(setRooms);
  };

  const handleDeleteRoom = async (id: string) => {
    await fetch(`http://localhost:3000/rooms/${id}`, { method: 'DELETE' });
    fetch(`http://localhost:3000/rooms/${selectedBuilding}`)
      .then(res => res.json())
      .then(setRooms);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Room Manager</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBuildingDialogOpen(true)}>
          Add Building
        </Button>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <TextField
          select
          label="Select Building"
          value={selectedBuilding}
          onChange={e => setSelectedBuilding(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">(None)</MenuItem>
          {buildings.map(b => (
            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
          ))}
        </TextField>
        {selectedBuilding && (
          <IconButton color="error" onClick={() => handleDeleteBuilding(selectedBuilding)}>
            <DeleteIcon />
          </IconButton>
        )}
      </Stack>
      {selectedBuilding && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Rooms in {buildings.find(b => b.id === selectedBuilding)?.name}</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenRoomDialog()}>
              Add Room
            </Button>
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Room Code</TableCell>
                <TableCell>Room Name</TableCell>
                <TableCell>Teaching Room</TableCell>
                <TableCell>Cover Room</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map(room => (
                <TableRow key={room.id}>
                  <TableCell>{room.room_code}</TableCell>
                  <TableCell>{room.room_name}</TableCell>
                  <TableCell>
                    <Checkbox checked={room.is_teaching_room} disabled />
                  </TableCell>
                  <TableCell>
                    <Checkbox checked={room.is_cover_room} disabled />
                  </TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.notes}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleOpenRoomDialog(room)}>Edit</Button>
                    <IconButton color="error" onClick={() => handleDeleteRoom(room.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Building Dialog */}
      <Dialog open={buildingDialogOpen} onClose={() => setBuildingDialogOpen(false)}>
        <DialogTitle>Add Building</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Building Name"
            value={buildingForm.name}
            onChange={e => setBuildingForm({ name: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuildingDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddBuilding} disabled={!buildingForm.name.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={roomDialogOpen} onClose={handleCloseRoomDialog}>
        <DialogTitle>{editRoomId ? 'Edit Room' : 'Add Room'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Room Code"
            name="room_code"
            value={roomForm.room_code}
            onChange={handleRoomFormChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Room Name"
            name="room_name"
            value={roomForm.room_name}
            onChange={handleRoomFormChange}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                name="is_teaching_room"
                checked={roomForm.is_teaching_room}
                onChange={handleRoomFormChange}
              />
            }
            label="Teaching Room"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="is_cover_room"
                checked={roomForm.is_cover_room}
                onChange={handleRoomFormChange}
              />
            }
            label="Can be used for cover"
          />
          <TextField
            margin="dense"
            label="Capacity"
            name="capacity"
            type="number"
            value={roomForm.capacity}
            onChange={handleRoomFormChange}
            fullWidth
          />
          <TextField
            margin="dense"
            label="Notes"
            name="notes"
            value={roomForm.notes}
            onChange={handleRoomFormChange}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoomDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRoom} disabled={!roomForm.room_code || !roomForm.room_name}>
            {editRoomId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}