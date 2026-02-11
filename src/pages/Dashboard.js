import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Tabs,
  Tab,
  Button,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Fab,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  List,
  Assessment,
  FileDownload,
  Refresh,
  Notifications,
  Logout
} from '@mui/icons-material';

import BookingCalendar from '../components/BookingCalendar';
import BookingForm from '../components/BookingForm';
import BookingList from '../components/BookingList';
import Reports from '../components/Reports';
import BookingDetails from '../components/BookingDetails';
import DateBookingsDialog from '../components/DateBookingsDialog';
import Footer from '../components/Footer';

import {
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getAllPurohits,
  getUpcomingBookingsForReminder
} from '../services/bookingService';
import {
  exportToExcel,
  exportToPDF,
  exportMonthlyReportToExcel,
  exportMonthlyReportToPDF
} from '../utils/exportUtils';
import {
  sendBulkWhatsAppReminders,
  generateReminderMessage,
  sendWhatsAppMessage,
  generateConfirmationMessage
} from '../services/notificationService';
import { DEFAULT_PUROHITS, USER_ROLES } from '../config/constants';

const Dashboard = ({ onLogout, userRole, purohitId }) => {
  const isBhadaji = userRole === USER_ROLES.BHADAJI;
  const isPurohit = userRole === USER_ROLES.PUROHIT;
  const [currentTab, setCurrentTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]); // Store all bookings before filtering
  const [purohits, setPurohits] = useState(DEFAULT_PUROHITS);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [dateBookingsDialogOpen, setDateBookingsDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, bookingId: null });
  const [showPanchanga, setShowPanchanga] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, purohitsData] = await Promise.all([
        getAllBookings(),
        getAllPurohits()
      ]);

      // Store all bookings
      setAllBookings(bookingsData);

      // Filter bookings for purohit users
      if (isPurohit && purohitId) {
        const filteredBookings = bookingsData.filter(booking => booking.purohitId === purohitId);
        setBookings(filteredBookings);
      } else {
        setBookings(bookingsData);
      }

      if (purohitsData.length > 0) {
        setPurohits(purohitsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data. Using offline mode.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setDateBookingsDialogOpen(true);
  };

  const getBookingsForSelectedDate = () => {
    if (!selectedDate || !bookings) return [];
    return bookings.filter(booking => {
      const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
      return bookingDate.toDateString() === selectedDate.toDateString();
    });
  };

  const handleNewBooking = () => {
    setSelectedDate(new Date());
    setEditingBooking(null);
    setFormOpen(true);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setSelectedDate(null);
    setFormOpen(true);
  };

  const handleViewBooking = (booking) => {
    setViewingBooking(booking);
  };

  const handleSaveBooking = async (bookingData) => {
    try {
      if (editingBooking) {
        await updateBooking(editingBooking.id, bookingData);
        setBookings(prev =>
          prev.map(b => b.id === editingBooking.id ? { ...bookingData, id: editingBooking.id } : b)
        );
        showSnackbar('Booking updated successfully');

        // Send confirmation WhatsApp if status changed to 'booked'
        if (bookingData.status === 'booked' && editingBooking.status !== 'booked') {
          const message = generateConfirmationMessage(bookingData);
          const result = await sendWhatsAppMessage(bookingData.clientPhone, message, bookingData);
          if (result.success) {
            if (result.method === 'web') {
              showSnackbar('WhatsApp opened - please send manually');
            } else if (result.message) {
              showSnackbar(`Confirmation sent - ${result.message}`);
            } else {
              showSnackbar('Confirmation sent to client and purohit');
            }
          }
        }
      } else {
        const newBooking = await createBooking(bookingData);
        setBookings(prev => [...prev, newBooking]);
        showSnackbar('Booking created successfully');

        // Send confirmation WhatsApp if status is 'booked'
        if (newBooking.status === 'booked') {
          const message = generateConfirmationMessage(newBooking);
          const result = await sendWhatsAppMessage(newBooking.clientPhone, message, newBooking);
          if (result.success) {
            if (result.method === 'web') {
              showSnackbar('WhatsApp opened - please send manually');
            } else if (result.message) {
              showSnackbar(`Confirmation sent - ${result.message}`);
            } else {
              showSnackbar('Confirmation sent to client and purohit');
            }
          }
        }
      }
      setFormOpen(false);
      setEditingBooking(null);
    } catch (error) {
      console.error('Error saving booking:', error);
      showSnackbar('Error saving booking', 'error');
    }
  };

  const handleDeleteBooking = (bookingId) => {
    setDeleteConfirm({ open: true, bookingId });
  };

  const confirmDelete = async () => {
    try {
      await deleteBooking(deleteConfirm.bookingId);
      setBookings(prev => prev.filter(b => b.id !== deleteConfirm.bookingId));
      showSnackbar('Booking deleted successfully');
    } catch (error) {
      console.error('Error deleting booking:', error);
      showSnackbar('Error deleting booking', 'error');
    } finally {
      setDeleteConfirm({ open: false, bookingId: null });
    }
  };

  const handleUpdatePurohitCharges = async (bookingId, charges) => {
    try {
      const bookingToUpdate = bookings.find(b => b.id === bookingId);
      if (bookingToUpdate) {
        const updatedData = {
          ...bookingToUpdate,
          purohitCharges: charges
        };
        await updateBooking(bookingId, updatedData);
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, purohitCharges: charges } : b)
        );
        showSnackbar('Charges submitted successfully');
      }
    } catch (error) {
      console.error('Error updating purohit charges:', error);
      showSnackbar('Error submitting charges', 'error');
    }
  };

  const handleMarkComplete = async (bookingId) => {
    try {
      const bookingToUpdate = bookings.find(b => b.id === bookingId);
      if (bookingToUpdate) {
        const updatedData = {
          ...bookingToUpdate,
          status: 'completed'
        };
        await updateBooking(bookingId, updatedData);
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b)
        );
        showSnackbar('Homa marked as completed');
      }
    } catch (error) {
      console.error('Error marking as complete:', error);
      showSnackbar('Error marking as complete', 'error');
    }
  };

  const handleUpdatePaymentReceivedBy = async (bookingId, receivedBy) => {
    try {
      const bookingToUpdate = bookings.find(b => b.id === bookingId);
      if (bookingToUpdate) {
        const updatedData = {
          ...bookingToUpdate,
          paymentReceivedBy: receivedBy
        };
        await updateBooking(bookingId, updatedData);
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, paymentReceivedBy: receivedBy } : b)
        );
        showSnackbar('Payment received by updated');
      }
    } catch (error) {
      console.error('Error updating payment received by:', error);
      showSnackbar('Error updating payment info', 'error');
    }
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportExcel = () => {
    exportToExcel(bookings, 'homa_bookings', userRole);
    showSnackbar('Excel file downloaded');
    handleExportMenuClose();
  };

  const handleExportPDF = () => {
    exportToPDF(bookings, 'Homa Bookings Report', userRole);
    showSnackbar('PDF file downloaded');
    handleExportMenuClose();
  };

  const handleSendReminders = async () => {
    try {
      const upcomingBookings = await getUpcomingBookingsForReminder();
      if (upcomingBookings.length === 0) {
        showSnackbar('No bookings for tomorrow', 'info');
        return;
      }

      showSnackbar(`Sending reminders for ${upcomingBookings.length} booking(s)...`, 'info');

      const result = await sendBulkWhatsAppReminders(upcomingBookings);

      if (result.method === 'web') {
        showSnackbar(`Opening WhatsApp for ${upcomingBookings.length} booking(s) (client & purohit)`, 'success');
      } else {
        const totalSent = result.results ? result.results.filter(r => r.success).length : result.sent;
        const totalFailed = result.results ? result.results.filter(r => !r.success).length : result.failed;
        showSnackbar(
          `Reminders sent to clients & purohits: ${totalSent} successful, ${totalFailed} failed`,
          totalFailed > 0 ? 'warning' : 'success'
        );
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      showSnackbar('Error sending reminders', 'error');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF9F0 100%)',
          gap: 3
        }}
      >
        <Typography
          sx={{
            fontSize: '3rem',
            background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 50%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.6 },
              '50%': { opacity: 1 }
            }
          }}
        >
          ॐ
        </Typography>
        <CircularProgress
          size={48}
          thickness={4}
          sx={{
            color: '#FF8C00',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        <Typography
          variant="body1"
          sx={{
            color: '#6B5B47',
            fontWeight: 500,
            letterSpacing: '0.05em'
          }}
        >
          Loading sacred schedule...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', background: 'linear-gradient(135deg, #FAF8F5 0%, #FFF9F0 100%)' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ py: 1.5, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Typography
              sx={{
                fontSize: '2rem',
                background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 50%, #FFA500 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}
            >
              ॐ
            </Typography>
            <Box>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontWeight: 700,
                  fontFamily: '"Spectral", Georgia, serif',
                  letterSpacing: '-0.01em',
                  background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2,
                }}
              >
                Homa Booking
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#6B5B47',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  display: 'block',
                  mt: 0.25
                }}
              >
                {isBhadaji && 'Bhadaji Portal'} {isPurohit && 'Purohit Portal'} {!isBhadaji && !isPurohit && 'Admin Dashboard'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={loadData}
                sx={{
                  color: '#6B5B47',
                  '&:hover': {
                    background: 'rgba(255, 140, 0, 0.1)',
                    color: '#FF8C00'
                  }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            {!isBhadaji && !isPurohit && (
              <Tooltip title="Send Reminders">
                <IconButton
                  onClick={handleSendReminders}
                  sx={{
                    color: '#6B5B47',
                    '&:hover': {
                      background: 'rgba(255, 140, 0, 0.1)',
                      color: '#FF8C00'
                    }
                  }}
                >
                  <Notifications />
                </IconButton>
              </Tooltip>
            )}
            {!isPurohit && (
              <Tooltip title="Export Data">
                <IconButton
                  onClick={handleExportMenuOpen}
                  sx={{
                    color: '#6B5B47',
                    '&:hover': {
                      background: 'rgba(255, 140, 0, 0.1)',
                      color: '#FF8C00'
                    }
                  }}
                >
                  <FileDownload />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Logout">
              <IconButton
                onClick={onLogout}
                sx={{
                  color: '#6B5B47',
                  '&:hover': {
                    background: 'rgba(239, 83, 80, 0.1)',
                    color: '#EF5350'
                  }
                }}
              >
                <Logout />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
        <Box
          sx={{
            height: '3px',
            background: 'linear-gradient(90deg, #FF6B00 0%, #FF8C00 50%, #FFA500 100%)',
          }}
        />
      </AppBar>

      {/* Export Menu - Enhanced */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid rgba(139, 69, 19, 0.08)',
            minWidth: '180px'
          }
        }}
      >
        <MenuItem
          onClick={handleExportExcel}
          sx={{
            py: 1.5,
            px: 2.5,
            fontWeight: 500,
            gap: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(255, 140, 0, 0.08)'
            }
          }}
        >
          <FileDownload fontSize="small" sx={{ color: '#FF8C00' }} />
          Export to Excel
        </MenuItem>
        <MenuItem
          onClick={handleExportPDF}
          sx={{
            py: 1.5,
            px: 2.5,
            fontWeight: 500,
            gap: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(255, 140, 0, 0.08)'
            }
          }}
        >
          <FileDownload fontSize="small" sx={{ color: '#FF8C00' }} />
          Export to PDF
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 8, px: { xs: 2, sm: 3 } }}>
        {/* Tabs - Enhanced Design */}
        <Box
          sx={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(139, 69, 19, 0.08)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            mb: 3,
            overflow: 'hidden'
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            px: 2,
            py: 1
          }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: '56px',
                  px: 3,
                  gap: 1
                }
              }}
            >
              <Tab icon={<CalendarMonth />} label="Calendar" iconPosition="start" />
              <Tab icon={<List />} label="Bookings" iconPosition="start" />
              {!isPurohit && <Tab icon={<Assessment />} label="Reports" iconPosition="start" />}
            </Tabs>
            {currentTab === 0 && (
              <Tooltip title="Show Tithi, Nakshatra, Vāra details on calendar">
                <FormControlLabel
                  control={
                    <Switch
                      checked={showPanchanga}
                      onChange={(e) => setShowPanchanga(e.target.checked)}
                      color="secondary"
                      size="small"
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                        fontWeight: 600,
                        color: '#6B5B47'
                      }}
                    >
                      Panchanga
                    </Typography>
                  }
                  sx={{ mr: 2, ml: { xs: 'auto', sm: 2 } }}
                />
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Tab Panels - Enhanced with better spacing */}
        <Box sx={{ position: 'relative' }}>
          {currentTab === 0 && (
            <Box
              sx={{
                animation: 'fadeIn 0.4s ease-out',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' }
                }
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 69, 19, 0.08)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    p: { xs: 2, sm: 3 },
                    overflow: 'hidden'
                  }}>
                    <BookingCalendar
                      bookings={bookings}
                      onDateSelect={handleDateSelect}
                      selectedDate={selectedDate}
                      showPanchanga={showPanchanga}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {currentTab === 1 && (
            <Box
              sx={{
                animation: 'fadeIn 0.4s ease-out',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' }
                }
              }}
            >
              <Box sx={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(139, 69, 19, 0.08)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                overflow: 'hidden'
              }}>
                <BookingList
                  bookings={bookings}
                  purohits={purohits}
                  onEdit={handleEditBooking}
                  onDelete={handleDeleteBooking}
                  onView={handleViewBooking}
                  userRole={userRole}
                  onUpdatePurohitCharges={handleUpdatePurohitCharges}
                  onMarkComplete={handleMarkComplete}
                  onUpdatePaymentReceivedBy={handleUpdatePaymentReceivedBy}
                />
              </Box>
            </Box>
          )}

          {currentTab === 2 && !isPurohit && (
            <Box
              sx={{
                animation: 'fadeIn 0.4s ease-out',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' }
                }
              }}
            >
              <Box sx={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid rgba(139, 69, 19, 0.08)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                p: { xs: 2, sm: 3 }
              }}>
                <Reports bookings={bookings} purohits={purohits} userRole={userRole} />
              </Box>
            </Box>
          )}
        </Box>
      </Container>

      {/* Floating Action Button - Enhanced */}
      {!isBhadaji && !isPurohit && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)',
            boxShadow: '0 8px 24px rgba(255, 140, 0, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
              boxShadow: '0 12px 32px rgba(255, 140, 0, 0.5)',
              transform: 'scale(1.1) rotate(90deg)',
            },
            '&:active': {
              transform: 'scale(0.95) rotate(90deg)',
            },
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                boxShadow: '0 8px 24px rgba(255, 140, 0, 0.4)',
              },
              '50%': {
                boxShadow: '0 8px 32px rgba(255, 140, 0, 0.6)',
              }
            }
          }}
          onClick={handleNewBooking}
        >
          <Add sx={{ fontSize: 32 }} />
        </Fab>
      )}

      {/* Booking Form Dialog - Only for Admin */}
      {!isBhadaji && !isPurohit && (
        <BookingForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingBooking(null);
          }}
          onSave={handleSaveBooking}
          booking={editingBooking}
          purohits={purohits}
          existingBookings={bookings}
          selectedDate={selectedDate}
        />
      )}

      {/* Date Bookings Dialog */}
      <DateBookingsDialog
        open={dateBookingsDialogOpen}
        onClose={() => setDateBookingsDialogOpen(false)}
        date={selectedDate}
        bookings={getBookingsForSelectedDate()}
        onViewDetails={handleViewBooking}
      />

      {/* Booking Details Dialog */}
      <BookingDetails
        open={Boolean(viewingBooking)}
        onClose={() => setViewingBooking(null)}
        booking={viewingBooking}
        onEdit={handleEditBooking}
        userRole={userRole}
        onUpdatePurohitCharges={handleUpdatePurohitCharges}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, bookingId: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this booking? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, bookingId: null })}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Dashboard;
