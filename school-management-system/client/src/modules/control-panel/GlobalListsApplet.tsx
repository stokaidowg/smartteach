import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack,
  IconButton, Checkbox, FormControlLabel, Select, MenuItem, Chip, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

type Category = {
  id: number;
  category_key: string;
  category_name: string;
  description: string;
  item_count: number;
};

type GlobalListItem = {
  id: number;
  category_id: number;
  item_value: string;
  item_code: string | null;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  category_key?: string;
  category_name?: string;
};

export default function GlobalListsApplet() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<GlobalListItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GlobalListItem | null>(null);
  const [formData, setFormData] = useState({
    item_value: '',
    item_code: '',
    description: '',
    is_active: true,
    is_default: false,
    sort_order: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchItems(selectedCategory.category_key);
    }
  }, [selectedCategory, showInactive]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3000/global-lists/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
      setError('Failed to load categories');
    }
  };

  const fetchItems = async (categoryKey: string) => {
    try {
      const res = await fetch(`http://localhost:3000/global-lists/items/${categoryKey}?includeInactive=${showInactive}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load items:', err);
      setItems([]);
      setError('Failed to load items');
    }
  };

  const handleOpenDialog = (item?: GlobalListItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        item_value: item.item_value,
        item_code: item.item_code || '',
        description: item.description || '',
        is_active: item.is_active,
        is_default: item.is_default,
        sort_order: item.sort_order
      });
    } else {
      setEditingItem(null);
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0;
      setFormData({
        item_value: '',
        item_code: '',
        description: '',
        is_active: true,
        is_default: false,
        sort_order: maxOrder + 10
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setError('');
  };

  const handleSave = async () => {
    if (!formData.item_value.trim()) {
      setError('Item value is required');
      return;
    }

    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/global-lists/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Failed to update item');
          return;
        }
      } else {
        // Create
        const res = await fetch('/global-lists/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_id: selectedCategory?.id,
            ...formData
          })
        });
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || 'Failed to add item');
          return;
        }
      }
      handleCloseDialog();
      if (selectedCategory) {
        fetchItems(selectedCategory.category_key);
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleDelete = async (item: GlobalListItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.item_value}"?\n\nThis will fail if the item is currently in use.`)) {
      return;
    }

    try {
      const res = await fetch(`/global-lists/items/${item.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || err.error || 'Failed to delete item');
        return;
      }
      
      if (selectedCategory) {
        fetchItems(selectedCategory.category_key);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleToggleActive = async (item: GlobalListItem) => {
    try {
      const endpoint = item.is_active ? 'deactivate' : 'reactivate';
      await fetch(`/global-lists/items/${item.id}/${endpoint}`, {
        method: 'POST'
      });
      if (selectedCategory) {
        fetchItems(selectedCategory.category_key);
      }
    } catch (err) {
      alert('Failed to update item status');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Global Lists</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage dropdown options for student and staff data. These lists are used across the system
        for consistent data entry.
      </Typography>

      {categories.length === 0 ? (
        <Alert severity="info">Loading categories...</Alert>
      ) : (
        <>
          <Tabs
            value={selectedCategory?.id || false}
            onChange={(_, newValue) => {
              const cat = categories.find(c => c.id === newValue);
              if (cat) setSelectedCategory(cat);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            {categories.map(cat => (
              <Tab
                key={cat.id}
                label={
                  <Box>
                    {cat.category_name}
                    <Chip label={cat.item_count} size="small" sx={{ ml: 1 }} />
                  </Box>
                }
                value={cat.id}
              />
            ))}
          </Tabs>

          {selectedCategory && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="subtitle1">{selectedCategory.category_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedCategory.description}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={showInactive}
                        onChange={e => setShowInactive(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Show Inactive"
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                  >
                    Add Item
                  </Button>
                </Stack>
              </Stack>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={40}></TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell width={80}>Order</TableCell>
                    <TableCell width={100}>Status</TableCell>
                    <TableCell width={120} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No items found. Click "Add Item" to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map(item => (
                      <TableRow
                        key={item.id}
                        sx={{ opacity: item.is_active ? 1 : 0.5 }}
                      >
                        <TableCell>
                          <DragIndicatorIcon sx={{ color: 'text.disabled', cursor: 'grab' }} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {item.item_value}
                            {item.is_default && (
                              <Chip label="Default" size="small" color="primary" />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.item_code || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.sort_order}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={item.is_active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleActive(item)}
                            title={item.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {item.is_active ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(item)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Item' : 'Add New Item'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <TextField
              label="Value *"
              name="item_value"
              value={formData.item_value}
              onChange={handleChange}
              fullWidth
              autoFocus
              helperText="The display value (e.g., 'Christianity', 'Male')"
            />
            
            <TextField
              label="Code"
              name="item_code"
              value={formData.item_code}
              onChange={handleChange}
              fullWidth
              helperText="Optional short code (e.g., 'M', 'F', 'CHRISTIAN')"
            />
            
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              helperText="Optional description or notes"
            />
            
            <TextField
              label="Sort Order"
              name="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={handleChange}
              fullWidth
              helperText="Lower numbers appear first in dropdowns"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
              }
              label="Active (visible in dropdowns)"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                />
              }
              label="Set as default option"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
