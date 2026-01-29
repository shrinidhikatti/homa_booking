import React, { useState, useMemo } from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { USER_ROLES } from '../config/constants';
import PurohitPaymentReport from './PurohitPaymentReport';

const Reports = ({ bookings, purohits, userRole }) => {
  const isBhadaji = userRole === USER_ROLES.BHADAJI;
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = [2025, 2026];

  const monthlyBookings = useMemo(() => {
    if (!bookings) return [];

    const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1));

    return bookings.filter(booking => {
      const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }, [bookings, selectedYear, selectedMonth]);

  const stats = useMemo(() => {
    const completed = monthlyBookings.filter(b => b.status === 'completed');
    const pending = monthlyBookings.filter(b => b.status === 'pending');
    const booked = monthlyBookings.filter(b => b.status === 'booked');
    const cancelled = monthlyBookings.filter(b => b.status === 'cancelled');

    const totalAmount = monthlyBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
    const totalAdvance = monthlyBookings.reduce((sum, b) => sum + (parseFloat(b.advanceAmount) || 0), 0);
    const totalRemaining = monthlyBookings.reduce((sum, b) => sum + (parseFloat(b.remainingAmount) || 0), 0);
    const completedAmount = completed.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);

    return {
      totalBookings: monthlyBookings.length,
      completed: completed.length,
      pending: pending.length,
      booked: booked.length,
      cancelled: cancelled.length,
      totalAmount,
      totalAdvance,
      totalRemaining,
      completedAmount
    };
  }, [monthlyBookings]);

  const purohitStats = useMemo(() => {
    const purohitMap = new Map();

    monthlyBookings.forEach(booking => {
      if (booking.purohitId) {
        const existing = purohitMap.get(booking.purohitId) || {
          id: booking.purohitId,
          name: booking.purohitName || 'Unknown',
          count: 0,
          completed: 0,
          totalAmount: 0
        };

        existing.count++;
        if (booking.status === 'completed') {
          existing.completed++;
          existing.totalAmount += parseFloat(booking.totalAmount) || 0;
        }

        purohitMap.set(booking.purohitId, existing);
      }
    });

    return Array.from(purohitMap.values());
  }, [monthlyBookings]);

  const homaTypeStats = useMemo(() => {
    const typeMap = new Map();

    monthlyBookings.forEach(booking => {
      const existing = typeMap.get(booking.homaType) || {
        name: booking.homaType,
        count: 0,
        totalAmount: 0
      };

      existing.count++;
      existing.totalAmount += parseFloat(booking.totalAmount) || 0;

      typeMap.set(booking.homaType, existing);
    });

    return Array.from(typeMap.values()).sort((a, b) => b.count - a.count);
  }, [monthlyBookings]);

  const statusChartData = [
    { name: 'Completed', value: stats.completed, color: '#66BB6A' },
    { name: 'Booked', value: stats.booked, color: '#42A5F5' },
    { name: 'Pending', value: stats.pending, color: '#FFA726' },
    { name: 'Cancelled', value: stats.cancelled, color: '#EF5350' }
  ].filter(d => d.value > 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Month/Year Selector */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Monthly Report
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            label="Month"
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map(month => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map(year => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={isBhadaji ? 4 : 2}>
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="primary.contrastText">
                Total Bookings
              </Typography>
              <Typography variant="h4" color="primary.contrastText">
                {stats.totalBookings}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={isBhadaji ? 4 : 2}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="success.contrastText">
                Completed
              </Typography>
              <Typography variant="h4" color="success.contrastText">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={isBhadaji ? 4 : 2}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="warning.contrastText">
                Booked
              </Typography>
              <Typography variant="h4" color="warning.contrastText">
                {stats.booked}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {!isBhadaji && (
          <>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: 'info.light' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="info.contrastText">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" color="info.contrastText">
                    {formatCurrency(stats.totalAmount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: 'warning.light' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="warning.contrastText">
                    Advance Received
                  </Typography>
                  <Typography variant="h6" color="warning.contrastText">
                    {formatCurrency(stats.totalAdvance)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="error.contrastText">
                    Balance Pending
                  </Typography>
                  <Typography variant="h6" color="error.contrastText">
                    {formatCurrency(stats.totalRemaining)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Card sx={{ bgcolor: 'grey.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">
                    Completed Value
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stats.completedAmount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Status Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Booking Status Distribution
          </Typography>
          <Box sx={{ height: 300 }}>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Homa Type Chart */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Homa Types Breakdown
          </Typography>
          <Box sx={{ height: 300 }}>
            {homaTypeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={homaTypeStats.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Purohit-wise Report */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Purohit-wise Report
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Purohit Name</TableCell>
                  <TableCell align="right">Total Assigned</TableCell>
                  <TableCell align="right">Completed</TableCell>
                  {!isBhadaji && <TableCell align="right">Completed Amount</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {purohitStats.length > 0 ? (
                  purohitStats.map((purohit) => (
                    <TableRow key={purohit.id}>
                      <TableCell>{purohit.name}</TableCell>
                      <TableCell align="right">{purohit.count}</TableCell>
                      <TableCell align="right">{purohit.completed}</TableCell>
                      {!isBhadaji && <TableCell align="right">{formatCurrency(purohit.totalAmount)}</TableCell>}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isBhadaji ? 3 : 4} align="center">
                      <Typography color="text.secondary">No purohit data for this month</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {purohitStats.length > 0 && (
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell align="right">
                      <strong>{purohitStats.reduce((sum, p) => sum + p.count, 0)}</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>{purohitStats.reduce((sum, p) => sum + p.completed, 0)}</strong>
                    </TableCell>
                    {!isBhadaji && (
                      <TableCell align="right">
                        <strong>{formatCurrency(purohitStats.reduce((sum, p) => sum + p.totalAmount, 0))}</strong>
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Purohit Payment Report - Admin Only */}
        {!isBhadaji && (
          <Grid item xs={12} sx={{ mt: 3 }}>
            <PurohitPaymentReport bookings={bookings} purohits={purohits} />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default Reports;
