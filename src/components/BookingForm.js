import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Divider,
  InputAdornment,
  Alert,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Menu,
  List,
  ListItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add } from '@mui/icons-material';
import {
  HOMA_TYPES,
  SANKALPA_TYPES,
  BOOKING_STATUS,
  BOOKING_START_DATE,
  BOOKING_END_DATE
} from '../config/constants';
import { Timestamp } from 'firebase/firestore';

const BookingForm = ({ open, onClose, onSave, booking, purohits, existingBookings, selectedDate }) => {
  const initialFormState = {
    clientName: '',
    clientPhone: '',
    selectedHomas: [], // Array of homa IDs
    homaTypes: [], // Array of homa names for display
    customHomaNames: [], // Array of custom homa names
    slot: '',
    slotDisplay: '',
    totalAmount: 0,
    advanceAmount: 0,
    remainingAmount: 0,
    purohitId: '',
    purohitName: '',
    status: 'pending',
    notes: '',
    sankalpaType: '', // Dropdown selection
    sankalpa: '', // Free text field for additional details
    venueAddress: '',
    date: selectedDate || new Date()
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [slotWarning, setSlotWarning] = useState('');
  const [customHomaInput, setCustomHomaInput] = useState('');
  const [homaMenuOpen, setHomaMenuOpen] = useState(false);
  const [tempSelectedHomas, setTempSelectedHomas] = useState([]);

  useEffect(() => {
    if (booking) {
      setFormData({
        ...booking,
        date: booking.date?.toDate ? booking.date.toDate() : new Date(booking.date),
        selectedHomas: booking.selectedHomas || [],
        homaTypes: booking.homaTypes || [],
        customHomaNames: booking.customHomaNames || []
      });
    } else {
      setFormData({
        ...initialFormState,
        date: selectedDate || new Date()
      });
    }
  }, [booking, selectedDate, open]);

  // Check slot availability
  useEffect(() => {
    if (formData.date && formData.slot) {
      const dateBookings = existingBookings?.filter(b => {
        const bookingDate = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return bookingDate.toDateString() === formData.date.toDateString() &&
               b.slot === formData.slot &&
               b.id !== booking?.id;
      });

      if (dateBookings && dateBookings.length > 0) {
        setSlotWarning(`This slot already has ${dateBookings.length} booking(s)`);
      } else {
        setSlotWarning('');
      }
    }
  }, [formData.date, formData.slot, existingBookings, booking]);

  const handleHomaMenuOpen = () => {
    setTempSelectedHomas(formData.selectedHomas);
    setHomaMenuOpen(true);
  };

  const handleHomaMenuClose = () => {
    setHomaMenuOpen(false);
  };

  const handleHomaSelection = (homaId) => {
    setTempSelectedHomas(prev => {
      if (prev.includes(homaId)) {
        return prev.filter(id => id !== homaId);
      } else {
        return [...prev, homaId];
      }
    });
  };

  const handleHomaOk = () => {
    const homaNames = tempSelectedHomas.map(homaId => {
      if (homaId === 'custom') return '';
      const homa = HOMA_TYPES.find(h => h.id === homaId);
      return homa ? homa.name : '';
    }).filter(Boolean);

    setFormData(prev => ({
      ...prev,
      selectedHomas: tempSelectedHomas,
      homaTypes: homaNames
    }));
    setHomaMenuOpen(false);
  };

  const handleHomaCancel = () => {
    setTempSelectedHomas(formData.selectedHomas);
    setHomaMenuOpen(false);
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    let updates = { [field]: value };

    // Handle purohit selection
    if (field === 'purohitId') {
      const selectedPurohit = purohits?.find(p => p.id === value);
      if (selectedPurohit) {
        updates.purohitName = selectedPurohit.name;
      } else {
        updates.purohitName = '';
      }
    }

    // Handle amount calculations
    if (field === 'totalAmount') {
      const total = parseFloat(value) || 0;
      updates.remainingAmount = total - (formData.advanceAmount || 0);
    }

    if (field === 'advanceAmount') {
      const advance = parseFloat(value) || 0;
      updates.remainingAmount = (formData.totalAmount || 0) - advance;
    }

    setFormData(prev => ({ ...prev, ...updates }));

    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, date }));
  };

  const handleAddCustomHoma = () => {
    if (customHomaInput.trim()) {
      setFormData(prev => ({
        ...prev,
        customHomaNames: [...prev.customHomaNames, customHomaInput.trim()],
        selectedHomas: [...prev.selectedHomas, 'custom']
      }));
      setCustomHomaInput('');
    }
  };

  const handleRemoveCustomHoma = (index) => {
    setFormData(prev => ({
      ...prev,
      customHomaNames: prev.customHomaNames.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.clientPhone.replace(/\D/g, ''))) {
      newErrors.clientPhone = 'Enter valid 10-digit phone number';
    }

    if (formData.selectedHomas.length === 0 && formData.customHomaNames.length === 0) {
      newErrors.selectedHomas = 'Please select at least one Homa type';
    }

    if (!formData.slot) {
      newErrors.slot = 'Please select a time slot';
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Please enter valid amount';
    }

    if (parseFloat(formData.advanceAmount) > parseFloat(formData.totalAmount)) {
      newErrors.advanceAmount = 'Advance cannot exceed total amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Combine regular homas and custom homas
      const allHomaTypes = [
        ...formData.homaTypes,
        ...formData.customHomaNames
      ];

      const bookingData = {
        ...formData,
        homaTypes: allHomaTypes, // Combined list for display
        date: Timestamp.fromDate(formData.date),
        clientPhone: formData.clientPhone.replace(/\D/g, '')
      };
      onSave(bookingData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setErrors({});
    setSlotWarning('');
    setCustomHomaInput('');
    onClose();
  };

  return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {booking ? 'Edit Booking' : 'New Booking'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Date and Slot Selection */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Booking Date"
                  value={formData.date}
                  onChange={handleDateChange}
                  minDate={BOOKING_START_DATE}
                  maxDate={BOOKING_END_DATE}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Time Slot"
                  value={formData.slot}
                  onChange={handleChange('slot')}
                  error={!!errors.slot}
                  helperText={errors.slot || 'E.g., 10:00 AM - 11:00 AM'}
                  placeholder="Enter time slot (e.g., 10:00 AM - 11:00 AM)"
                />
                {slotWarning && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {slotWarning}
                  </Alert>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Client Details
                  </Typography>
                </Divider>
              </Grid>

              {/* Client Details */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Client Name"
                  value={formData.clientName}
                  onChange={handleChange('clientName')}
                  error={!!errors.clientName}
                  helperText={errors.clientName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Contact Number"
                  value={formData.clientPhone}
                  onChange={handleChange('clientPhone')}
                  error={!!errors.clientPhone}
                  helperText={errors.clientPhone}
                  placeholder="9876543210"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Homa/Havana Details (Select Multiple)
                  </Typography>
                </Divider>
              </Grid>

              {/* Multi-Select Homa Types */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Select Homas/Havanas"
                  value={formData.homaTypes.join(', ')}
                  onClick={handleHomaMenuOpen}
                  error={!!errors.selectedHomas}
                  helperText={errors.selectedHomas}
                  InputProps={{
                    readOnly: true,
                    sx: { cursor: 'pointer' }
                  }}
                  placeholder="Click to select homas"
                />
                <Menu
                  anchorEl={homaMenuOpen ? document.activeElement : null}
                  open={homaMenuOpen}
                  onClose={handleHomaMenuClose}
                  PaperProps={{
                    style: {
                      maxHeight: 400,
                      width: '400px',
                    },
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Select Homas/Havanas
                    </Typography>
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {HOMA_TYPES.filter(h => h.id !== 'custom').map(homa => (
                        <ListItem
                          key={homa.id}
                          dense
                          button
                          onClick={() => handleHomaSelection(homa.id)}
                        >
                          <Checkbox
                            checked={tempSelectedHomas.includes(homa.id)}
                            tabIndex={-1}
                            disableRipple
                          />
                          <ListItemText primary={homa.name} />
                        </ListItem>
                      ))}
                    </List>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                      <Button onClick={handleHomaCancel} variant="outlined" size="small">
                        Cancel
                      </Button>
                      <Button onClick={handleHomaOk} variant="contained" size="small">
                        OK
                      </Button>
                    </Box>
                  </Box>
                </Menu>
              </Grid>

              {/* Custom Homas */}
              <Grid item xs={12}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Custom Homas (Optional)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Homa Name"
                      value={customHomaInput}
                      onChange={(e) => setCustomHomaInput(e.target.value)}
                      placeholder="Enter custom homa name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomHoma();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddCustomHoma}
                      disabled={!customHomaInput.trim()}
                      startIcon={<Add />}
                    >
                      Add
                    </Button>
                  </Box>
                  {formData.customHomaNames.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {formData.customHomaNames.map((name, index) => (
                        <Chip
                          key={index}
                          label={name}
                          onDelete={() => handleRemoveCustomHoma(index)}
                          color="secondary"
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Details (Manual Entry)
                  </Typography>
                </Divider>
              </Grid>

              {/* Payment Details - Manual Pricing */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Total Amount"
                  value={formData.totalAmount}
                  onChange={handleChange('totalAmount')}
                  error={!!errors.totalAmount}
                  helperText={errors.totalAmount || 'Set price based on customer'}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Advance Payment"
                  value={formData.advanceAmount}
                  onChange={handleChange('advanceAmount')}
                  error={!!errors.advanceAmount}
                  helperText={errors.advanceAmount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  disabled
                  label="Remaining Amount"
                  value={formData.remainingAmount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Assignment & Status
                  </Typography>
                </Divider>
              </Grid>

              {/* Purohit and Status */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assign Purohit</InputLabel>
                  <Select
                    value={formData.purohitId}
                    label="Assign Purohit"
                    onChange={handleChange('purohitId')}
                  >
                    <MenuItem value="">
                      <em>Not Assigned</em>
                    </MenuItem>
                    {purohits?.map(purohit => (
                      <MenuItem key={purohit.id} value={purohit.id}>
                        {purohit.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={handleChange('status')}
                  >
                    {BOOKING_STATUS.map(status => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Additional Information
                  </Typography>
                </Divider>
              </Grid>

              {/* Additional Information */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sankalpa Type</InputLabel>
                  <Select
                    value={formData.sankalpaType}
                    label="Sankalpa Type"
                    onChange={handleChange('sankalpaType')}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {SANKALPA_TYPES.map(sankalpa => (
                      <MenuItem key={sankalpa.id} value={sankalpa.name}>
                        {sankalpa.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Sankalpa Details"
                  value={formData.sankalpa}
                  onChange={handleChange('sankalpa')}
                  placeholder="Additional sankalpa information"
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  label="Venue Address"
                  value={formData.venueAddress}
                  onChange={handleChange('venueAddress')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes"
                  value={formData.notes}
                  onChange={handleChange('notes')}
                  placeholder="Any additional information about the booking..."
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {booking ? 'Update Booking' : 'Create Booking'}
          </Button>
        </DialogActions>
      </Dialog>
  );
};

export default BookingForm;
