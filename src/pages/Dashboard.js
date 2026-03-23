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
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Divider
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  List,
  Assessment,
  FileDownload,
  Refresh,
  Notifications,
  Logout,
  AutoFixHigh,
  School,
  Settings,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  PersonAdd,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';

import BookingCalendar from '../components/BookingCalendar';
import BookingForm from '../components/BookingForm';
import BookingList from '../components/BookingList';
import Reports from '../components/Reports';
import BookingDetails from '../components/BookingDetails';
import DateBookingsDialog from '../components/DateBookingsDialog';
import Footer from '../components/Footer';
import KleshaKriyaTab from '../components/KleshaKriyaTab';
import ClassEnquiryTab from '../components/ClassEnquiryTab';
import WalkInTab from '../components/WalkInTab';

import {
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  getAllPurohits,
  getUpcomingBookingsForReminder
} from '../services/bookingService';
import { saveSettings, loadSettings } from '../services/settingsService';
import { testMsg91Connection, refreshMsg91Config } from '../services/msg91Service';
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
  const [calendarPage, setCalendarPage] = useState(0); // 0=Calendar, 1=Bookings, 2=Reports
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ msg91AuthKey: '', whatsappNumber: '919632691895' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsTesting, setSettingsTesting] = useState(false);
  const [settingsTestResult, setSettingsTestResult] = useState(null);
  const [showAuthKey, setShowAuthKey] = useState(false);

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

  const handleOpenSettings = async () => {
    const current = await loadSettings();
    setSettingsForm({
      msg91AuthKey: current.msg91AuthKey || '',
      whatsappNumber: current.whatsappNumber || '919632691895'
    });
    setSettingsTestResult(null);
    setSettingsOpen(true);
  };

  const handleSaveSettingsForm = async () => {
    setSettingsSaving(true);
    try {
      await saveSettings({
        msg91AuthKey: settingsForm.msg91AuthKey.trim(),
        whatsappNumber: settingsForm.whatsappNumber.trim()
      });
      await refreshMsg91Config();
      showSnackbar('Settings saved successfully', 'success');
      setSettingsOpen(false);
    } catch (err) {
      showSnackbar('Error saving settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleTestMsg91 = async () => {
    setSettingsTesting(true);
    setSettingsTestResult(null);
    try {
      // Temporarily save so the test picks up the new key
      await saveSettings({
        msg91AuthKey: settingsForm.msg91AuthKey.trim(),
        whatsappNumber: settingsForm.whatsappNumber.trim()
      });
      await refreshMsg91Config();
      const result = await testMsg91Connection();
      setSettingsTestResult(result);
    } catch (err) {
      setSettingsTestResult({ configured: false, error: err.message });
    } finally {
      setSettingsTesting(false);
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
            <Box
              component="img"
              src="/booking-homa/vmjoshi.jpeg"
              alt="Shri V M Joshi"
              sx={{
                width: { xs: 44, sm: 52 },
                height: { xs: 44, sm: 52 },
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(139, 69, 19, 0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                flexShrink: 0
              }}
            />
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  fontFamily: '"Spectral", Georgia, serif',
                  letterSpacing: '0.01em',
                  background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2,
                  fontSize: { xs: '0.85rem', sm: '1rem' }
                }}
              >
                Shri V M Joshi Vastu & Astrologer
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
              <Tooltip title="MSG91 / WhatsApp Settings">
                <IconButton
                  onClick={handleOpenSettings}
                  sx={{
                    color: '#6B5B47',
                    '&:hover': {
                      background: 'rgba(255, 140, 0, 0.1)',
                      color: '#FF8C00'
                    }
                  }}
                >
                  <Settings />
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
              {!isPurohit && !isBhadaji && <Tab icon={<AutoFixHigh />} label="Klesha Nashana Kriya" iconPosition="start" />}
              {!isPurohit && !isBhadaji && <Tab icon={<School />} label="Class Enquiries" iconPosition="start" />}
              {!isPurohit && <Tab icon={<PersonAdd />} label="Walk-in Ramdev Galli" iconPosition="start" />}
              {!isPurohit && <Tab icon={<PersonAdd />} label="Walk-in Airport Road" iconPosition="start" />}
            </Tabs>
            {currentTab === 0 && calendarPage === 0 && (
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
            <Box sx={{ animation: 'fadeIn 0.4s ease-out', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>

              {/* Internal page navigator */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 2 }}>
                <IconButton
                  onClick={() => setCalendarPage(p => Math.max(0, p - 1))}
                  disabled={calendarPage === 0}
                  sx={{ color: '#8B4513' }}
                >
                  <ChevronLeft />
                </IconButton>
                {['Calendar', 'Bookings', !isPurohit ? 'Reports' : null].filter(Boolean).map((label, idx) => (
                  <Box
                    key={label}
                    onClick={() => setCalendarPage(idx)}
                    sx={{
                      px: 2, py: 0.5, borderRadius: '20px', cursor: 'pointer', fontWeight: 600,
                      fontSize: '0.85rem', transition: 'all 0.2s',
                      background: calendarPage === idx ? 'linear-gradient(135deg, #FF6B00, #FF8C00)' : 'transparent',
                      color: calendarPage === idx ? 'white' : '#8B4513',
                      border: calendarPage === idx ? 'none' : '1px solid rgba(139,69,19,0.3)',
                    }}
                  >
                    {label}
                  </Box>
                ))}
                <IconButton
                  onClick={() => setCalendarPage(p => Math.min(isPurohit ? 1 : 2, p + 1))}
                  disabled={calendarPage === (isPurohit ? 1 : 2)}
                  sx={{ color: '#8B4513' }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>

              {/* Page 1: Calendar */}
              {calendarPage === 0 && (
                <Box sx={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(139,69,19,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
                  <BookingCalendar
                    bookings={bookings}
                    onDateSelect={handleDateSelect}
                    selectedDate={selectedDate}
                    showPanchanga={showPanchanga}
                  />
                </Box>
              )}

              {/* Page 2: Bookings */}
              {calendarPage === 1 && (
                <Box sx={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(139,69,19,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  {!isPurohit && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 2, borderBottom: '1px solid rgba(139,69,19,0.08)' }}>
                      <Tooltip title="Export Data">
                        <IconButton onClick={handleExportMenuOpen} sx={{ color: '#6B5B47', '&:hover': { background: 'rgba(255,140,0,0.1)', color: '#FF8C00' } }}>
                          <FileDownload />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
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
              )}

              {/* Page 3: Reports */}
              {calendarPage === 2 && !isPurohit && (
                <Box sx={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(139,69,19,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Tooltip title="Export Data">
                      <IconButton onClick={handleExportMenuOpen} sx={{ color: '#6B5B47', '&:hover': { background: 'rgba(255,140,0,0.1)', color: '#FF8C00' } }}>
                        <FileDownload />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Reports bookings={bookings} purohits={purohits} userRole={userRole} />
                </Box>
              )}
            </Box>
          )}

          {currentTab === 2 && !isPurohit && !isBhadaji && (
            <Box sx={{ animation: 'fadeIn 0.4s ease-out', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
              <Box sx={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(26,35,126,0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', p: { xs: 2, sm: 3 } }}>
                <ClassEnquiryTab />
              </Box>
            </Box>
          )}

          {currentTab === 1 && !isPurohit && !isBhadaji && (
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
                <KleshaKriyaTab />
              </Box>
            </Box>
          )}

          {/* Walk-in Ramdev Galli: tab 3 for admin, tab 1 for Bhadaji */}
          {currentTab === (isBhadaji ? 1 : 3) && !isPurohit && (
            <Box sx={{ animation: 'fadeIn 0.4s ease-out', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
              <Box sx={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(139, 69, 19, 0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', p: { xs: 2, sm: 3 } }}>
                <WalkInTab office="Ramdev Galli" />
              </Box>
            </Box>
          )}

          {/* Walk-in Airport Road: tab 4 for admin, tab 2 for Bhadaji */}
          {currentTab === (isBhadaji ? 2 : 4) && !isPurohit && (
            <Box sx={{ animation: 'fadeIn 0.4s ease-out', '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
              <Box sx={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(139, 69, 19, 0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', p: { xs: 2, sm: 3 } }}>
                <WalkInTab office="Airport Road" />
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

      {/* MSG91 Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Settings sx={{ color: '#FF8C00' }} />
            <Typography variant="h6" fontWeight={700}>WhatsApp / MSG91 Settings</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Enter your MSG91 auth key to enable automatic WhatsApp messages.
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="MSG91 Auth Key"
              fullWidth
              type={showAuthKey ? 'text' : 'password'}
              value={settingsForm.msg91AuthKey}
              onChange={e => setSettingsForm(f => ({ ...f, msg91AuthKey: e.target.value }))}
              placeholder="Enter your MSG91 auth key"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowAuthKey(v => !v)} edge="end" size="small">
                      {showAuthKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              helperText="Get your auth key from msg91.com → API → Auth Key"
            />
            <TextField
              label="WhatsApp Sender Number"
              fullWidth
              value={settingsForm.whatsappNumber}
              onChange={e => setSettingsForm(f => ({ ...f, whatsappNumber: e.target.value }))}
              placeholder="919XXXXXXXXX"
              helperText="Your MSG91 integrated WhatsApp number with country code (e.g. 919632691895)"
            />

            {/* Test result */}
            {settingsTestResult && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  background: settingsTestResult.configured
                    ? 'rgba(46, 125, 50, 0.08)'
                    : 'rgba(211, 47, 47, 0.08)',
                  border: `1px solid ${settingsTestResult.configured ? '#4caf50' : '#f44336'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {settingsTestResult.configured
                    ? <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} />
                    : <Cancel sx={{ color: '#f44336', fontSize: 20 }} />
                  }
                  <Typography variant="body2" fontWeight={600}
                    color={settingsTestResult.configured ? 'success.main' : 'error.main'}>
                    {settingsTestResult.configured ? 'MSG91 is configured correctly' : 'MSG91 not configured'}
                  </Typography>
                </Box>
                {settingsTestResult.configured && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Auth Key: <strong>{settingsTestResult.authKey}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      WhatsApp Number: <strong>{settingsTestResult.whatsappNumber}</strong>
                    </Typography>
                  </>
                )}
                {!settingsTestResult.configured && (
                  <Typography variant="caption" color="text.secondary">
                    Please enter a valid MSG91 auth key above and save.
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ p: 2, borderRadius: '10px', background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.2)' }}>
              <Typography variant="caption" color="text.secondary">
                <strong>How to get your MSG91 Auth Key:</strong><br />
                1. Login at <strong>msg91.com</strong><br />
                2. Go to <strong>API</strong> → <strong>Auth Key</strong><br />
                3. Copy the key and paste it above<br />
                4. Make sure your WhatsApp number is integrated in MSG91 dashboard
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleTestMsg91}
            disabled={settingsTesting || !settingsForm.msg91AuthKey}
            variant="outlined"
            startIcon={settingsTesting ? <CircularProgress size={16} /> : <CheckCircle />}
            sx={{ borderColor: '#FF8C00', color: '#FF8C00', '&:hover': { borderColor: '#FF6B00', background: 'rgba(255,140,0,0.06)' } }}
          >
            {settingsTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setSettingsOpen(false)} color="inherit">Cancel</Button>
          <Button
            onClick={handleSaveSettingsForm}
            disabled={settingsSaving}
            variant="contained"
            startIcon={settingsSaving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : null}
            sx={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)', '&:hover': { background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' } }}
          >
            {settingsSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Dashboard;
