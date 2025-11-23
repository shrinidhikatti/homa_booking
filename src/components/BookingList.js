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
  Phone
} from '@mui/icons-material';
import { format } from 'date-fns';
import { BOOKING_STATUS, TIME_SLOTS } from '../config/constants';

const BookingList = ({ bookings, onEdit, onDelete, onView, purohits }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [purohitFilter, setPurohitFilter] = useState('all');

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

  const getSlotLabel = (slotId) => {
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

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch =
      booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.clientPhone?.includes(searchTerm) ||
      booking.homaType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPurohit = purohitFilter === 'all' || booking.purohitId === purohitFilter;

    return matchesSearch && matchesStatus && matchesPurohit;
  }) || [];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleWhatsAppClick = (phone, booking) => {
    const message = `Namaste! This is a reminder for your ${booking.homaType} booking on ${formatDate(booking.date)} (${getSlotLabel(booking.slot)} slot). Please confirm your attendance. Thank you!`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePhoneClick = (phone) => {
    window.open(`tel:+91${phone}`, '_self');
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
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Advance</TableCell>
              <TableCell align="right">Balance</TableCell>
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
                  <TableCell>{getSlotLabel(booking.slot)}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {booking.clientName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.clientPhone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{booking.homaType}</TableCell>
                  <TableCell>{booking.purohitName || '-'}</TableCell>
                  <TableCell align="right">{formatCurrency(booking.totalAmount)}</TableCell>
                  <TableCell align="right">{formatCurrency(booking.advanceAmount)}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={booking.remainingAmount > 0 ? 'error' : 'success'}
                      fontWeight="medium"
                    >
                      {formatCurrency(booking.remainingAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(booking.status)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => onView(booking)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {filteredBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
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
