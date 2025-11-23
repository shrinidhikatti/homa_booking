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
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  HOMA_TYPES,
  BOOKING_STATUS,
  TIME_SLOTS,
  BOOKING_START_DATE,
  BOOKING_END_DATE
} from '../config/constants';
import { Timestamp } from 'firebase/firestore';

const BookingForm = ({ open, onClose, onSave, booking, purohits, existingBookings, selectedDate }) => {
  const initialFormState = {
    clientName: '',
    clientPhone: '',
    homaTypeId: '',
    homaType: '',
    customHomaName: '',
    slot: '',
    totalAmount: 0,
    advanceAmount: 0,
    remainingAmount: 0,
    purohitId: '',
    purohitName: '',
    status: 'pending',
    notes: '',
    gotra: '',
    sankalpa: '',
    venueAddress: '',
    date: selectedDate || new Date()
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [slotWarning, setSlotWarning] = useState('');

  useEffect(() => {
    if (booking) {
      setFormData({
        ...booking,
        date: booking.date?.toDate ? booking.date.toDate() : new Date(booking.date)
      });
    } else {
      setFormData({
        ...initialFormState,
        date: selectedDate || new Date()
      });
    }
  }, [booking, selectedDate, open]);

  useEffect(() => {
    // Check slot availability
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

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    let updates = { [field]: value };

    // Handle Homa type selection
    if (field === 'homaTypeId') {
      const selectedHoma = HOMA_TYPES.find(h => h.id === value);
      if (selectedHoma) {
        updates.homaType = selectedHoma.name;
        updates.totalAmount = selectedHoma.price;
        updates.remainingAmount = selectedHoma.price - (formData.advanceAmount || 0);
      }
    }

    // Handle custom homa name
    if (field === 'customHomaName') {
      updates.homaType = value;
    }

    // Handle purohit selection
    if (field === 'purohitId') {
      const selectedPurohit = purohits?.find(p => p.id === value);
      if (selectedPurohit) {
        updates.purohitName = selectedPurohit.name;
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

    if (!formData.homaTypeId) {
      newErrors.homaTypeId = 'Please select a Homa type';
    }

    if (formData.homaTypeId === 'custom' && !formData.customHomaName.trim()) {
      newErrors.customHomaName = 'Please enter custom Homa name';
    }

    if (!formData.slot) {
      newErrors.slot = 'Please select a time slot';
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Please enter valid amount';
    }

    if (formData.advanceAmount > formData.totalAmount) {
      newErrors.advanceAmount = 'Advance cannot exceed total amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const bookingData = {
        ...formData,
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
              <FormControl fullWidth required error={!!errors.slot}>
                <InputLabel>Time Slot</InputLabel>
                <Select
                  value={formData.slot}
                  label="Time Slot"
                  onChange={handleChange('slot')}
                >
                  {TIME_SLOTS.map(slot => (
                    <MenuItem key={slot.id} value={slot.id}>
                      {slot.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  Homa/Havana Details
                </Typography>
              </Divider>
            </Grid>

            {/* Homa Type Selection */}
            <Grid item xs={12} sm={formData.homaTypeId === 'custom' ? 6 : 12}>
              <FormControl fullWidth required error={!!errors.homaTypeId}>
                <InputLabel>Type of Homa/Havana</InputLabel>
                <Select
                  value={formData.homaTypeId}
                  label="Type of Homa/Havana"
                  onChange={handleChange('homaTypeId')}
                >
                  {HOMA_TYPES.map(homa => (
                    <MenuItem key={homa.id} value={homa.id}>
                      {homa.name} {homa.price > 0 ? `- ₹${homa.price}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {formData.homaTypeId === 'custom' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Custom Homa Name"
                  value={formData.customHomaName}
                  onChange={handleChange('customHomaName')}
                  error={!!errors.customHomaName}
                  helperText={errors.customHomaName}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Payment Details
                </Typography>
              </Divider>
            </Grid>

            {/* Payment Details */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                type="number"
                label="Total Amount"
                value={formData.totalAmount}
                onChange={handleChange('totalAmount')}
                error={!!errors.totalAmount}
                helperText={errors.totalAmount}
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Gotra"
                value={formData.gotra}
                onChange={handleChange('gotra')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Sankalpa"
                value={formData.sankalpa}
                onChange={handleChange('sankalpa')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
