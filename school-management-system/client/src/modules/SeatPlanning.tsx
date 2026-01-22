import React, { useEffect, useState } from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Sheet from '@mui/joy/Sheet';
import Stack from '@mui/joy/Stack';
import Button from '@mui/joy/Button';
import Grid from '@mui/joy/Grid';

type Room = { id: string; room_code: string; room_name: string; capacity: number; };
type Set = { id: string; name: string; room_id?: string; };
type Pupil = { id: string; firstName: string; lastName: string; };
type Seat = { row: number; col: number; pupil_id: string | null };

export default function SeatPlanning() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [grid, setGrid] = useState<Seat[][]>([]);
  const [unassigned, setUnassigned] = useState<Pupil[]>([]);
  const [rows, setRows] = useState<number>(1);
  const [cols, setCols] = useState<number>(1);

  // Fetch all rooms on mount
  useEffect(() => {
    fetch('/teaching-rooms').then(r => r.json()).then(setRooms);
  }, []);

  // Fetch sets allocated to the selected room
  useEffect(() => {
    if (selectedRoom) {
      fetch('/sets')
        .then(r => r.json())
        .then((allSets: Set[]) => {
          // Compare as strings in case of type mismatch
          setSets(allSets.filter(s => String(s.room_id) === String(selectedRoom)));
        });
    } else {
      setSets([]);
    }
    setSelectedSet('');
    setPupils([]);
    setGrid([]);
    setUnassigned([]);
  }, [selectedRoom]);

  // Fetch pupils for the selected set
  useEffect(() => {
    if (selectedSet) {
      fetch(`/set-pupils?setId=${selectedSet}`)
        .then(r => r.json())
        .then((setPupilLinks: { pupil_id: string }[]) => {
          fetch('/pupils')
            .then(r => r.json())
            .then((allPupils: Pupil[]) => {
              const pupilsInSet = setPupilLinks.map(sp => allPupils.find((p: Pupil) => p.id === sp.pupil_id)).filter(Boolean) as Pupil[];
              setPupils(pupilsInSet);
              setUnassigned(pupilsInSet);
            });
        });
    } else {
      setPupils([]);
      setGrid([]);
      setUnassigned([]);
    }
  }, [selectedSet]);

  // Build grid and load seat plan
  useEffect(() => {
    const room = rooms.find(r => r.id === selectedRoom);
    if (!room || !selectedSet) {
      setGrid([]);
      setRows(1);
      setCols(1);
      return;
    }
    const capacity = Number.isFinite(room.capacity) && room.capacity > 0 ? room.capacity : 1;
    let bestRows = 1, bestCols = capacity;
    for (let r = 1; r <= capacity; r++) {
      const c = Math.ceil(capacity / r);
      if (r * c >= capacity && Math.abs(r - c) < Math.abs(bestRows - bestCols)) {
        bestRows = r;
        bestCols = c;
      }
    }
    setRows(bestRows);
    setCols(bestCols);

    fetch(`/seat-plan?setId=${selectedSet}&roomId=${selectedRoom}`)
      .then(r => r.json())
      .then((seats: { seat_row: number; seat_col: number; pupil_id: string }[]) => {
        const gridArr: Seat[][] = Array.from({ length: bestRows }, (_, row) =>
          Array.from({ length: bestCols }, (_, col) => ({ row, col, pupil_id: null }))
        );
        seats.forEach(seat => {
          if (
            seat.seat_row >= 0 &&
            seat.seat_row < bestRows &&
            seat.seat_col >= 0 &&
            seat.seat_col < bestCols
          ) {
            gridArr[seat.seat_row][seat.seat_col].pupil_id = seat.pupil_id;
          }
        });
        setGrid(gridArr);
        const assignedIds = seats.map(s => s.pupil_id);
        setUnassigned(pupils.filter(p => !assignedIds.includes(p.id)));
      });
  }, [rooms, selectedRoom, selectedSet, pupils]);

  const handleAssign = (row: number, col: number, pupil: Pupil) => {
    setGrid(g =>
      g.map((r, rIdx) =>
        r.map((seat, cIdx) =>
          rIdx === row && cIdx === col ? { ...seat, pupil_id: pupil.id } : seat
        )
      )
    );
    setUnassigned(u => u.filter(p => p.id !== pupil.id));
  };

  const handleUnassign = (row: number, col: number) => {
    const pupilId = grid[row][col].pupil_id;
    if (pupilId) {
      const pupil = pupils.find(p => p.id === pupilId);
      if (pupil) setUnassigned(u => [...u, pupil]);
    }
    setGrid(g =>
      g.map((r, rIdx) =>
        r.map((seat, cIdx) =>
          rIdx === row && cIdx === col ? { ...seat, pupil_id: null } : seat
        )
      )
    );
  };

  const handleSave = async () => {
    const seats: { row: number; col: number; pupil_id: string | null }[] = [];
    grid.forEach((row, rIdx) =>
      row.forEach((seat, cIdx) => {
        seats.push({ row: rIdx, col: cIdx, pupil_id: seat.pupil_id });
      })
    );
    await fetch('/seat-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId: selectedSet, roomId: selectedRoom, seats }),
    });
    alert('Seat plan saved!');
  };

  return (
    <Box>
      <Typography level="h4" mb={2}>Seat Planning</Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <Select
          value={selectedRoom}
          onChange={(_, value) => setSelectedRoom(value as string)}
          placeholder="Select Room"
          sx={{ minWidth: 200 }}
        >
          {rooms.map(r => (
            <Option key={r.id} value={r.id}>{r.room_code} - {r.room_name}</Option>
          ))}
        </Select>
        <Select
          value={selectedSet}
          onChange={(_, value) => setSelectedSet(value as string)}
          placeholder="Select Set"
          sx={{ minWidth: 200 }}
          disabled={!selectedRoom}
        >
          {sets.map(s => (
            <Option key={s.id} value={s.id}>{s.name}</Option>
          ))}
        </Select>
        <Button onClick={handleSave} disabled={!selectedSet || !selectedRoom}>
          Save Seat Plan
        </Button>
      </Stack>
      {/* Show message if no sets for this room */}
      {selectedRoom && sets.length === 0 && (
        <Typography level="body-sm" color="danger" sx={{ mb: 2 }}>
          No sets are allocated to this room.
        </Typography>
      )}
      {/* Render grid */}
      <Grid container columns={cols} spacing={1}>
        {grid.map((row, rIdx) =>
          row.map((seat, cIdx) => {
            const pupil = pupils.find(p => p.id === seat.pupil_id);
            return (
              <Grid key={`${rIdx}-${cIdx}`} xs={1}>
                <Sheet
                  variant="outlined"
                  sx={{
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: pupil ? 'pointer' : 'default',
                    bgcolor: pupil ? 'primary.softBg' : undefined,
                  }}
                  onClick={() => pupil ? handleUnassign(rIdx, cIdx) : undefined}
                >
                  {pupil ? `${pupil.firstName} ${pupil.lastName}` : ''}
                </Sheet>
                {!pupil && unassigned.length > 0 && (
                  <Select
                    value=""
                    placeholder="Assign"
                    onChange={(_, value) => {
                      const p = pupils.find(p => p.id === value);
                      if (p) handleAssign(rIdx, cIdx, p);
                    }}
                    sx={{ width: '100%', mt: 1 }}
                  >
                    {unassigned.map(p => (
                      <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>
                    ))}
                  </Select>
                )}
              </Grid>
            );
          })
        )}
      </Grid>
      <Box mt={2}>
        <Typography level="title-md">Unassigned Pupils:</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {unassigned.map(p => (
            <Sheet key={p.id} sx={{ p: 1, m: 0.5 }}>{p.firstName} {p.lastName}</Sheet>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}