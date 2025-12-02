import React from 'react';
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
  IconButton
} from '@mui/material';
import {
  Edit,
  PictureAsPdf,
  WhatsApp,
  Phone,
  ContentCopy
} from '@mui/icons-material';
import { format } from 'date-fns';
import { BOOKING_STATUS, TIME_SLOTS, USER_ROLES } from '../config/constants';
import { exportBookingDetailsPDF } from '../utils/exportUtils';
import { generateConfirmationMessage, sendWhatsAppMessage } from '../services/notificationService';

const BookingDetails = ({ open, onClose, booking, onEdit, userRole }) => {
  if (!booking) return null;

  const isBhadaji = userRole === USER_ROLES.BHADAJI;

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
` : ''}
${booking.gotra ? `Gotra: ${booking.gotra}` : ''}
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
        {!isBhadaji && (
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
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Additional Info */}
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Additional Information
        </Typography>
        <DetailRow label="Gotra" value={booking.gotra} />
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
