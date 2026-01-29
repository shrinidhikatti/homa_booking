import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Divider,
  Box,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Edit,
  PictureAsPdf,
  WhatsApp,
  Phone,
  ContentCopy,
  Check
} from '@mui/icons-material';
import { format } from 'date-fns';
import { BOOKING_STATUS, TIME_SLOTS, USER_ROLES, PAYMENT_RECEIVED_BY } from '../config/constants';
import { exportBookingDetailsPDF } from '../utils/exportUtils';
import { generateConfirmationMessage, sendWhatsAppMessage } from '../services/notificationService';

const BookingDetails = ({ open, onClose, booking, onEdit, userRole, onUpdatePurohitCharges }) => {
  const [purohitChargesInput, setPurohitChargesInput] = useState('');

  if (!booking) return null;

  const isBhadaji = userRole === USER_ROLES.BHADAJI;
  const isPurohit = userRole === USER_ROLES.PUROHIT;

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'EEEE, dd MMMM yyyy');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getSlotLabel = (slotId, slotDisplay) => {
    // Use slotDisplay if available (from new slot management system)
    if (slotDisplay) return slotDisplay;
    // Fallback to old TIME_SLOTS for backward compatibility
    const slot = TIME_SLOTS.find(s => s.id === slotId);
    return slot?.label || slotId;
  };

  const getStatusChip = (status) => {
    const statusConfig = BOOKING_STATUS.find(s => s.value === status);
    return (
      <Chip
        label={statusConfig?.label || status}
        sx={{ bgcolor: statusConfig?.color, color: 'white', fontWeight: 'bold' }}
      />
    );
  };

  const getPaymentReceivedByLabel = (value) => {
    const option = PAYMENT_RECEIVED_BY.find(p => p.value === value);
    return option?.label || 'Not Set';
  };

  const handleExportPDF = () => {
    exportBookingDetailsPDF(booking);
  };

  const handleWhatsApp = () => {
    const message = generateConfirmationMessage(booking);
    sendWhatsAppMessage(booking.clientPhone, message);
  };

  const handleCall = () => {
    window.open(`tel:+91${booking.clientPhone}`, '_self');
  };

  const handleCopyDetails = () => {
    const homaTypes = Array.isArray(booking.homaTypes)
      ? booking.homaTypes.join(', ')
      : booking.homaType;

    const details = `
Booking Details
===============
Date: ${formatDate(booking.date)}
Time: ${getSlotLabel(booking.slot, booking.slotDisplay)}
Client: ${booking.clientName}
${!isBhadaji ? `Phone: ${booking.clientPhone}` : ''}
Homa: ${homaTypes}
Purohit: ${booking.purohitName || 'Not Assigned'}
Status: ${booking.status}

${!isBhadaji ? `Payment:
Total: ${formatCurrency(booking.totalAmount)}
Advance: ${formatCurrency(booking.advanceAmount)}
Balance: ${formatCurrency(booking.remainingAmount)}
Payment Received By: ${getPaymentReceivedByLabel(booking.paymentReceivedBy)}
` : ''}
${booking.sankalpaType ? `Sankalpa Type: ${booking.sankalpaType}` : ''}
${booking.sankalpa ? `Sankalpa Details: ${booking.sankalpa}` : ''}
${booking.venueAddress ? `Venue: ${booking.venueAddress}` : ''}
${booking.notes ? `Notes: ${booking.notes}` : ''}
    `.trim();

    navigator.clipboard.writeText(details);
  };

  const handleEdit = () => {
    onClose();
    onEdit(booking);
  };

  const handleSavePurohitCharges = async () => {
    const charges = parseFloat(purohitChargesInput);
    if (charges && charges > 0 && onUpdatePurohitCharges) {
      await onUpdatePurohitCharges(booking.id, charges);
      setPurohitChargesInput('');
      onClose();
    }
  };

  const DetailRow = ({ label, value, highlight }) => (
    <Grid container sx={{ py: 1 }}>
      <Grid item xs={4}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Grid>
      <Grid item xs={8}>
        <Typography
          variant="body1"
          fontWeight={highlight ? 'bold' : 'normal'}
          color={highlight ? 'primary' : 'text.primary'}
        >
          {value || '-'}
        </Typography>
      </Grid>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Booking Details</Typography>
          {getStatusChip(booking.status)}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Date & Time */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Schedule
        </Typography>
        <DetailRow label="Date" value={formatDate(booking.date)} highlight />
        <DetailRow label="Time Slot" value={getSlotLabel(booking.slot, booking.slotDisplay)} />
        <Divider sx={{ my: 2 }} />

        {/* Client Details */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Client Information
        </Typography>
        <DetailRow label="Name" value={booking.clientName} highlight />
        {!isBhadaji && <DetailRow label="Phone" value={booking.clientPhone} />}
        <Divider sx={{ my: 2 }} />

        {/* Homa Details */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Homa Details
        </Typography>
        <DetailRow
          label="Type"
          value={Array.isArray(booking.homaTypes)
            ? booking.homaTypes.join(', ')
            : booking.homaType}
          highlight
        />
        <DetailRow label="Purohit" value={booking.purohitName} />
        <Divider sx={{ my: 2 }} />

        {/* Payment Details - Only for Admin */}
        {!isBhadaji && !isPurohit && (
          <>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Payment
            </Typography>
            <DetailRow label="Total Amount" value={formatCurrency(booking.totalAmount)} />
            <DetailRow label="Advance Paid" value={formatCurrency(booking.advanceAmount)} />
            <DetailRow
              label="Balance Due"
              value={formatCurrency(booking.remainingAmount)}
              highlight={booking.remainingAmount > 0}
            />
            <DetailRow label="Purohit Charges" value={booking.purohitCharges ? formatCurrency(booking.purohitCharges) : 'Not submitted'} />
            <DetailRow label="Payment Received By" value={getPaymentReceivedByLabel(booking.paymentReceivedBy)} />
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Payment Received By - For Purohit */}
        {isPurohit && (
          <>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Payment Info
            </Typography>
            <DetailRow label="Payment Received By" value={getPaymentReceivedByLabel(booking.paymentReceivedBy)} />
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Purohit Charges Section - Only for Purohit */}
        {isPurohit && (
          <>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              My Charges
            </Typography>
            {booking.purohitCharges ? (
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="h6" color="success.dark">
                  Submitted: {formatCurrency(booking.purohitCharges)}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Enter your charges for this homa:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder="Enter amount"
                    value={purohitChargesInput}
                    onChange={(e) => setPurohitChargesInput(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Check />}
                    onClick={handleSavePurohitCharges}
                    disabled={!purohitChargesInput || parseFloat(purohitChargesInput) <= 0}
                  >
                    Submit
                  </Button>
                </Box>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Additional Info */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Additional Information
        </Typography>
        {booking.sankalpaType && <DetailRow label="Sankalpa Type" value={booking.sankalpaType} />}
        {booking.sankalpa && <DetailRow label="Sankalpa Details" value={booking.sankalpa} />}
        <DetailRow label="Venue" value={booking.venueAddress} />
        {booking.notes && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Notes
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              {booking.notes}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Box>
          {!isBhadaji && (
            <>
              <IconButton onClick={handleWhatsApp} color="success" title="WhatsApp">
                <WhatsApp />
              </IconButton>
              <IconButton onClick={handleCall} color="primary" title="Call">
                <Phone />
              </IconButton>
              <IconButton onClick={handleExportPDF} title="Export PDF">
                <PictureAsPdf />
              </IconButton>
            </>
          )}
          <IconButton onClick={handleCopyDetails} title="Copy Details">
            <ContentCopy />
          </IconButton>
        </Box>
        <Box>
          <Button onClick={onClose}>Close</Button>
          {!isBhadaji && (
            <Button onClick={handleEdit} startIcon={<Edit />} variant="contained">
              Edit
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDetails;
