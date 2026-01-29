import React, { useState, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Grid,
  Divider
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const PurohitPaymentReport = ({ bookings, purohits }) => {
  const [selectedPurohit, setSelectedPurohit] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredBookings = useMemo(() => {
    if (!bookings || !selectedPurohit || !fromDate || !toDate) return [];

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // Include the entire end date

    return bookings.filter(booking => {
      const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
      const matchesPurohit = booking.purohitId === selectedPurohit;
      const matchesDate = bookingDate >= from && bookingDate <= to;
      const hasCharges = booking.purohitCharges && booking.purohitCharges > 0;

      return matchesPurohit && matchesDate && hasCharges;
    });
  }, [bookings, selectedPurohit, fromDate, toDate]);

  const totalCharges = useMemo(() => {
    return filteredBookings.reduce((sum, booking) => sum + (parseFloat(booking.purohitCharges) || 0), 0);
  }, [filteredBookings]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return format(dateObj, 'dd MMM yyyy');
  };

  const handleExportToExcel = () => {
    if (filteredBookings.length === 0) {
      alert('No data to export');
      return;
    }

    const purohit = purohits.find(p => p.id === selectedPurohit);
    const purohitName = purohit ? purohit.name : selectedPurohit;

    // Prepare data for Excel
    const excelData = filteredBookings.map((booking, index) => ({
      'Sr. No.': index + 1,
      'Date': formatDate(booking.date),
      'Client Name': booking.clientName,
      'Homa/Havana': Array.isArray(booking.homaTypes) ? booking.homaTypes.join(', ') : booking.homaType,
      'Time Slot': booking.slot,
      'Charges (₹)': booking.purohitCharges
    }));

    // Add total row
    excelData.push({
      'Sr. No.': '',
      'Date': '',
      'Client Name': '',
      'Homa/Havana': '',
      'Time Slot': 'TOTAL',
      'Charges (₹)': totalCharges
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // Sr. No.
      { wch: 15 }, // Date
      { wch: 25 }, // Client Name
      { wch: 35 }, // Homa/Havana
      { wch: 20 }, // Time Slot
      { wch: 15 }  // Charges
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purohit Charges');

    // Generate filename
    const filename = `${purohitName}_Charges_${format(new Date(fromDate), 'dd-MMM-yyyy')}_to_${format(new Date(toDate), 'dd-MMM-yyyy')}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Purohit Payment Report
      </Typography>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Purohit</InputLabel>
            <Select
              value={selectedPurohit}
              label="Select Purohit"
              onChange={(e) => setSelectedPurohit(e.target.value)}
            >
              <MenuItem value="">
                <em>Select Purohit</em>
              </MenuItem>
              {purohits?.map(purohit => (
                <MenuItem key={purohit.id} value={purohit.id}>
                  {purohit.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExportToExcel}
            disabled={!selectedPurohit || !fromDate || !toDate || filteredBookings.length === 0}
            sx={{ height: '40px' }}
          >
            Export
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }} />

      {/* Results */}
      {selectedPurohit && fromDate && toDate && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {filteredBookings.length} booking(s) found
            </Typography>
            <Typography variant="h6" color="primary">
              Total: {formatCurrency(totalCharges)}
            </Typography>
          </Box>

          {filteredBookings.length > 0 ? (
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Sr. No.</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Client Name</TableCell>
                    <TableCell>Homa/Havana</TableCell>
                    <TableCell>Time Slot</TableCell>
                    <TableCell align="right">Charges</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBookings.map((booking, index) => (
                    <TableRow key={booking.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{formatDate(booking.date)}</TableCell>
                      <TableCell>{booking.clientName}</TableCell>
                      <TableCell>
                        {Array.isArray(booking.homaTypes)
                          ? booking.homaTypes.join(', ')
                          : booking.homaType}
                      </TableCell>
                      <TableCell>{booking.slot}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(booking.purohitCharges)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell colSpan={5} align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        TOTAL
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatCurrency(totalCharges)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No bookings with charges found for this purohit in the selected date range
              </Typography>
            </Box>
          )}
        </>
      )}

      {(!selectedPurohit || !fromDate || !toDate) && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Please select a purohit and date range to view the report
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PurohitPaymentReport;
