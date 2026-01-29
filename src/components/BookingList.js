import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Typography,
  InputAdornment
} from '@mui/material';
import {
  Edit,
  Delete,
  Search,
  Visibility,
  WhatsApp,
  Phone,
  Check,
  CheckCircle
} from '@mui/icons-material';
import { format } from 'date-fns';
import { BOOKING_STATUS, TIME_SLOTS, USER_ROLES, PAYMENT_RECEIVED_BY } from '../config/constants';

const BookingList = ({ bookings, onEdit, onDelete, onView, purohits, userRole, onUpdatePurohitCharges, onMarkComplete, onUpdatePaymentReceivedBy }) => {
  const isBhadaji = userRole === USER_ROLES.BHADAJI;
  const isPurohit = userRole === USER_ROLES.PUROHIT;
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [purohitFilter, setPurohitFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'
  const [purohitChargesInput, setPurohitChargesInput] = useState({});

  const getStatusChip = (status) => {
    const statusConfig = BOOKING_STATUS.find(s => s.value === status);
    return (
      <Chip
        size="small"
        label={statusConfig?.label || status}
        sx={{ bgcolor: statusConfig?.color, color: 'white' }}
      />
    );
  };

  const getSlotLabel = (slotId, slotDisplay) => {
    // Use slotDisplay if available (from new slot management system)
    if (slotDisplay) return slotDisplay;
    // Fallback to old TIME_SLOTS for backward compatibility
    const slot = TIME_SLOTS.find(s => s.id === slotId);
    return slot?.label.split(' ')[0] || slotId;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'dd MMM yyyy');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getPaymentReceivedByLabel = (value) => {
    const option = PAYMENT_RECEIVED_BY.find(p => p.value === value);
    return option?.label || '-';
  };

  const handlePaymentReceivedByChange = async (bookingId, value) => {
    if (onUpdatePaymentReceivedBy) {
      await onUpdatePaymentReceivedBy(bookingId, value);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch =
      booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.clientPhone?.includes(searchTerm) ||
      booking.homaType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPurohit = purohitFilter === 'all' || booking.purohitId === purohitFilter;

    // Date filter
    const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (dateFilter === 'upcoming') {
      matchesDate = bookingDate >= today;
    } else if (dateFilter === 'past') {
      matchesDate = bookingDate < today;
    }

    return matchesSearch && matchesStatus && matchesPurohit && matchesDate;
  }).sort((a, b) => {
    // Sort by date
    const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
    const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);

    if (dateFilter === 'past') {
      return dateB - dateA; // Most recent first for past
    }
    return dateA - dateB; // Nearest first for upcoming/all
  }) || [];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleWhatsAppClick = (phone, booking) => {
    const homaTypes = Array.isArray(booking.homaTypes)
      ? booking.homaTypes.join(', ')
      : booking.homaType;
    const message = `Namaste! This is a reminder for your ${homaTypes} booking on ${formatDate(booking.date)} (${getSlotLabel(booking.slot, booking.slotDisplay)} slot). Please confirm your attendance. Thank you!`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePhoneClick = (phone) => {
    window.open(`tel:+91${phone}`, '_self');
  };

  const handlePurohitChargesChange = (bookingId, value) => {
    setPurohitChargesInput(prev => ({
      ...prev,
      [bookingId]: value
    }));
  };

  const handleSavePurohitCharges = async (bookingId) => {
    const charges = parseFloat(purohitChargesInput[bookingId]);
    if (charges && charges > 0 && onUpdatePurohitCharges) {
      await onUpdatePurohitCharges(bookingId, charges);
      // Clear the input after saving
      setPurohitChargesInput(prev => ({
        ...prev,
        [bookingId]: ''
      }));
    }
  };

  return (
    <Paper elevation={3} sx={{ width: '100%' }}>
      {/* Filters */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name, phone, or homa type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            {BOOKING_STATUS.map(status => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Purohit</InputLabel>
          <Select
            value={purohitFilter}
            label="Purohit"
            onChange={(e) => setPurohitFilter(e.target.value)}
          >
            <MenuItem value="all">All Purohits</MenuItem>
            {purohits?.map(purohit => (
              <MenuItem key={purohit.id} value={purohit.id}>
                {purohit.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Date</InputLabel>
          <Select
            value={dateFilter}
            label="Date"
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="past">Past</MenuItem>
            <MenuItem value="all">All Dates</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" sx={{ alignSelf: 'center', ml: 'auto' }}>
          {filteredBookings.length} booking(s) found
        </Typography>
      </Box>

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Slot</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Homa Type</TableCell>
              <TableCell>Purohit</TableCell>
              {!isBhadaji && !isPurohit && <TableCell align="right">Total</TableCell>}
              {!isBhadaji && !isPurohit && <TableCell align="right">Advance</TableCell>}
              {!isBhadaji && !isPurohit && <TableCell align="right">Balance</TableCell>}
              {!isBhadaji && !isPurohit && <TableCell align="right">Purohit Charges</TableCell>}
              {isPurohit && <TableCell align="right">My Charges</TableCell>}
              {!isBhadaji && <TableCell>Payment By</TableCell>}
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell>{formatDate(booking.date)}</TableCell>
                  <TableCell>{getSlotLabel(booking.slot, booking.slotDisplay)}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {booking.clientName}
                      </Typography>
                      {!isBhadaji && (
                        <Typography variant="caption" color="text.secondary">
                          {booking.clientPhone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {Array.isArray(booking.homaTypes)
                      ? booking.homaTypes.join(', ')
                      : booking.homaType}
                  </TableCell>
                  <TableCell>{booking.purohitName || '-'}</TableCell>
                  {!isBhadaji && !isPurohit && <TableCell align="right">{formatCurrency(booking.totalAmount)}</TableCell>}
                  {!isBhadaji && !isPurohit && <TableCell align="right">{formatCurrency(booking.advanceAmount)}</TableCell>}
                  {!isBhadaji && !isPurohit && (
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={booking.remainingAmount > 0 ? 'error' : 'success'}
                        fontWeight="medium"
                      >
                        {formatCurrency(booking.remainingAmount)}
                      </Typography>
                    </TableCell>
                  )}
                  {!isBhadaji && !isPurohit && (
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {booking.purohitCharges ? formatCurrency(booking.purohitCharges) : '-'}
                      </Typography>
                    </TableCell>
                  )}
                  {isPurohit && (
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TextField
                          size="small"
                          type="number"
                          placeholder={booking.purohitCharges ? `₹${booking.purohitCharges}` : "Enter"}
                          value={purohitChargesInput[booking.id] || ''}
                          onChange={(e) => handlePurohitChargesChange(booking.id, e.target.value)}
                          sx={{ width: 100 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>
                          }}
                        />
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleSavePurohitCharges(booking.id)}
                          disabled={!purohitChargesInput[booking.id]}
                        >
                          <Check fontSize="small" />
                        </IconButton>
                      </Box>
                      {booking.purohitCharges && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                          Submitted: ₹{booking.purohitCharges}
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  {!isBhadaji && (
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={booking.paymentReceivedBy || ''}
                          onChange={(e) => handlePaymentReceivedByChange(booking.id, e.target.value)}
                          displayEmpty
                          sx={{ fontSize: '0.875rem' }}
                        >
                          <MenuItem value="">
                            <em>Not Set</em>
                          </MenuItem>
                          {PAYMENT_RECEIVED_BY.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  )}
                  <TableCell>{getStatusChip(booking.status)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => onView(booking)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isPurohit && booking.status !== 'completed' && (
                        <Tooltip title="Mark as Completed">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onMarkComplete(booking.id)}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!isBhadaji && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => onEdit(booking)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="WhatsApp">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleWhatsAppClick(booking.clientPhone, booking)}
                            >
                              <WhatsApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Call">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handlePhoneClick(booking.clientPhone)}
                            >
                              <Phone fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(booking.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {filteredBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={isBhadaji ? 7 : isPurohit ? 9 : 12} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No bookings found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredBookings.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default BookingList;
