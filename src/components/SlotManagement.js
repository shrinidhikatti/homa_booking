import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Paper,
  Alert
} from '@mui/material';
import { Delete, Add, Edit } from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const SlotManagement = ({ open, onClose, selectedDate, existingSlots = [], onSaveSlotsForDate }) => {
  const [slots, setSlots] = useState([]);
  const [slotForm, setSlotForm] = useState({
    startTime: null,
    endTime: null,
    label: ''
  });
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && selectedDate) {
      // Load slots for the selected date
      setSlots(existingSlots || []);
      resetSlotForm();
    }
  }, [open, selectedDate, existingSlots]);

  const resetSlotForm = () => {
    setSlotForm({
      startTime: null,
      endTime: null,
      label: ''
    });
    setEditingSlotIndex(null);
    setError('');
  };

  const validateSlotForm = () => {
    if (!slotForm.startTime || !slotForm.endTime) {
      setError('Please select both start and end times');
      return false;
    }

    if (slotForm.startTime >= slotForm.endTime) {
      setError('End time must be after start time');
      return false;
    }

    if (!slotForm.label.trim()) {
      setError('Please enter a label for the slot');
      return false;
    }

    setError('');
    return true;
  };

  const handleAddSlot = () => {
    if (!validateSlotForm()) return;

    const newSlot = {
      id: editingSlotIndex !== null ? slots[editingSlotIndex].id : `slot-${Date.now()}`,
      label: slotForm.label,
      startTime: format(slotForm.startTime, 'HH:mm'),
      endTime: format(slotForm.endTime, 'HH:mm'),
      display: `${slotForm.label} (${format(slotForm.startTime, 'h:mm a')} - ${format(slotForm.endTime, 'h:mm a')})`
    };

    if (editingSlotIndex !== null) {
      // Update existing slot
      const updatedSlots = [...slots];
      updatedSlots[editingSlotIndex] = newSlot;
      setSlots(updatedSlots);
    } else {
      // Add new slot
      setSlots([...slots, newSlot]);
    }

    resetSlotForm();
  };

  const handleEditSlot = (index) => {
    const slot = slots[index];
    const startDate = new Date();
    const endDate = new Date();
    const [startHour, startMin] = slot.startTime.split(':');
    const [endHour, endMin] = slot.endTime.split(':');

    startDate.setHours(parseInt(startHour), parseInt(startMin));
    endDate.setHours(parseInt(endHour), parseInt(endMin));

    setSlotForm({
      startTime: startDate,
      endTime: endDate,
      label: slot.label
    });
    setEditingSlotIndex(index);
  };

  const handleDeleteSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
    if (editingSlotIndex === index) {
      resetSlotForm();
    }
  };

  const handleSave = () => {
    if (slots.length === 0) {
      setError('Please add at least one slot');
      return;
    }
    onSaveSlotsForDate(selectedDate, slots);
    onClose();
  };

  const handleClose = () => {
    resetSlotForm();
    setSlots([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Manage Slots for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Slot Form */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                {editingSlotIndex !== null ? 'Edit Slot' : 'Add New Slot'}
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TimePicker
                      label="Start Time"
                      value={slotForm.startTime}
                      onChange={(newValue) => setSlotForm({ ...slotForm, startTime: newValue })}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TimePicker
                      label="End Time"
                      value={slotForm.endTime}
                      onChange={(newValue) => setSlotForm({ ...slotForm, endTime: newValue })}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Label"
                      value={slotForm.label}
                      onChange={(e) => setSlotForm({ ...slotForm, label: e.target.value })}
                      placeholder="e.g., Morning, Session 1"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={editingSlotIndex !== null ? <Edit /> : <Add />}
                        onClick={handleAddSlot}
                        size="small"
                      >
                        {editingSlotIndex !== null ? 'Update Slot' : 'Add Slot'}
                      </Button>
                      {editingSlotIndex !== null && (
                        <Button
                          variant="outlined"
                          onClick={resetSlotForm}
                          size="small"
                        >
                          Cancel Edit
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </LocalizationProvider>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Slots List */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Slots for this date ({slots.length})
            </Typography>
            {slots.length === 0 ? (
              <Alert severity="info">
                No slots added yet. Add at least one slot above.
              </Alert>
            ) : (
              <Paper variant="outlined">
                <List>
                  {slots.map((slot, index) => (
                    <ListItem
                      key={slot.id}
                      divider={index < slots.length - 1}
                    >
                      <ListItemText
                        primary={slot.display}
                        secondary={`${slot.startTime} - ${slot.endTime}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditSlot(index)}
                          sx={{ mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteSlot(index)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Slots
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlotManagement;
