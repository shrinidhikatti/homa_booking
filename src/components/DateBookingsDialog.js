import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import { format } from 'date-fns';
import { BOOKING_STATUS } from '../config/constants';

const DateBookingsDialog = ({ open, onClose, date, bookings, onViewDetails }) => {
  if (!date) return null;

  const getStatusColor = (status) => {
    const statusConfig = BOOKING_STATUS.find(s => s.value === status);
    return statusConfig?.color || '#grey';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Bookings for {format(date, 'EEEE, MMMM d, yyyy')}
      </DialogTitle>
      <DialogContent>
        {bookings && bookings.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            {bookings.map((booking, index) => (
              <Card
                key={booking.id || index}
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3,
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => {
                  onViewDetails(booking);
                  onClose();
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {booking.clientName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Phone:</strong> {booking.clientPhone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Homa/Havana:</strong> {Array.isArray(booking.homaTypes) ? booking.homaTypes.join(', ') : booking.homaType}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Time Slot:</strong> {booking.slot}
                      </Typography>
                      {booking.purohitName && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Purohit:</strong> {booking.purohitName}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <Chip
                        label={BOOKING_STATUS.find(s => s.value === booking.status)?.label || booking.status}
                        sx={{
                          bgcolor: getStatusColor(booking.status),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Box sx={{ textAlign: 'right', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total: ₹{booking.totalAmount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Advance: ₹{booking.advanceAmount || 0}
                        </Typography>
                        <Typography variant="body2" color={booking.remainingAmount > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 'bold' }}>
                          Remaining: ₹{booking.remainingAmount || 0}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  {booking.venueAddress && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Venue:</strong> {booking.venueAddress}
                      </Typography>
                    </>
                  )}
                  {booking.notes && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        <strong>Notes:</strong> {booking.notes}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
              Click on any booking card to view full details
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No bookings on this date
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This date is available for new bookings
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateBookingsDialog;
