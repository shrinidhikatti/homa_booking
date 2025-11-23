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
  sendWhatsAppMessage
} from '../services/notificationService';
import { DEFAULT_PUROHITS } from '../config/constants';

const Dashboard = ({ onLogout }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [purohits, setPurohits] = useState(DEFAULT_PUROHITS);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
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
      setBookings(bookingsData);
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
    setEditingBooking(null);
    setFormOpen(true);
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
      } else {
        const newBooking = await createBooking(bookingData);
        setBookings(prev => [...prev, newBooking]);
        showSnackbar('Booking created successfully');
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

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportExcel = () => {
    exportToExcel(bookings);
    showSnackbar('Excel file downloaded');
    handleExportMenuClose();
  };

  const handleExportPDF = () => {
    exportToPDF(bookings);
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
      sendBulkWhatsAppReminders(upcomingBookings);
      showSnackbar(`Sending reminders for ${upcomingBookings.length} booking(s)`);
    } catch (error) {
      console.error('Error sending reminders:', error);
      showSnackbar('Error fetching upcoming bookings', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Homa & Havana Booking System
          </Typography>
          <IconButton color="inherit" onClick={loadData} title="Refresh">
            <Refresh />
          </IconButton>
          <IconButton color="inherit" onClick={handleSendReminders} title="Send Reminders">
            <Notifications />
          </IconButton>
          <IconButton color="inherit" onClick={handleExportMenuOpen} title="Export">
            <FileDownload />
          </IconButton>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={onLogout}>
              <Logout />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={handleExportMenuClose}
      >
        <MenuItem onClick={handleExportExcel}>Export to Excel</MenuItem>
        <MenuItem onClick={handleExportPDF}>Export to PDF</MenuItem>
      </Menu>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {/* Tabs */}
        <Box sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: { xs: 48, sm: 48 },
              '& .MuiTab-root': {
                minWidth: { xs: 'auto', sm: 120 },
                px: { xs: 1, sm: 2 }
              }
            }}
          >
            <Tab icon={<CalendarMonth />} label="Calendar" iconPosition="start" />
            <Tab icon={<List />} label="Bookings" iconPosition="start" />
            <Tab icon={<Assessment />} label="Reports" iconPosition="start" />
          </Tabs>
          {currentTab === 0 && (
            <Tooltip title="Show Tithi, Nakshatra, Vāra details on calendar">
              <FormControlLabel
                control={
                  <Switch
                    checked={showPanchanga}
                    onChange={(e) => setShowPanchanga(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={<Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>Panchanga</Typography>}
                sx={{ mr: { xs: 1, sm: 2 }, ml: { xs: 'auto', sm: 0 } }}
              />
            </Tooltip>
          )}
        </Box>

        {/* Tab Panels */}
        {currentTab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <BookingCalendar
                bookings={bookings}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                showPanchanga={showPanchanga}
              />
            </Grid>
          </Grid>
        )}

        {currentTab === 1 && (
          <BookingList
            bookings={bookings}
            purohits={purohits}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
            onView={handleViewBooking}
          />
        )}

        {currentTab === 2 && (
          <Reports bookings={bookings} purohits={purohits} />
        )}
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleNewBooking}
      >
        <Add />
      </Fab>

      {/* Booking Form Dialog */}
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

      {/* Booking Details Dialog */}
      <BookingDetails
        open={Boolean(viewingBooking)}
        onClose={() => setViewingBooking(null)}
        booking={viewingBooking}
        onEdit={handleEditBooking}
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
    </Box>
  );
};

export default Dashboard;
