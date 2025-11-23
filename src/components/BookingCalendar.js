import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Chip,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval } from 'date-fns';
import { BOOKING_START_DATE, BOOKING_END_DATE, BOOKING_STATUS } from '../config/constants';

const BookingCalendar = ({ bookings, onDateSelect, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add padding days for the first week
    const startDay = start.getDay();
    const paddingDays = Array(startDay).fill(null);

    setCalendarDays([...paddingDays, ...days]);
  };

  const getBookingsForDate = (date) => {
    if (!date || !bookings) return [];
    return bookings.filter(booking => {
      const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
      return isSameDay(bookingDate, date);
    });
  };

  const getStatusColor = (status) => {
    const statusConfig = BOOKING_STATUS.find(s => s.value === status);
    return statusConfig?.color || '#grey';
  };

  const isDateInRange = (date) => {
    return isWithinInterval(date, {
      start: BOOKING_START_DATE,
      end: BOOKING_END_DATE
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeft />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5">
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleToday} size="small">
            <Today />
          </IconButton>
        </Box>
        <IconButton onClick={handleNextMonth}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Week Day Headers */}
      <Grid container spacing={0.5} sx={{ mb: 1 }}>
        {weekDays.map(day => (
          <Grid item xs={12/7} key={day}>
            <Typography
              variant="subtitle2"
              align="center"
              sx={{ fontWeight: 'bold', color: 'text.secondary' }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Days */}
      <Grid container spacing={0.5}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <Grid item xs={12/7} key={`empty-${index}`} />;
          }

          const dayBookings = getBookingsForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const inRange = isDateInRange(day);

          return (
            <Grid item xs={12/7} key={day.toISOString()}>
              <Paper
                elevation={isSelected ? 8 : 1}
                onClick={() => inRange && onDateSelect(day)}
                sx={{
                  p: 1,
                  minHeight: 80,
                  cursor: inRange ? 'pointer' : 'not-allowed',
                  bgcolor: isSelected
                    ? 'primary.light'
                    : isToday
                    ? 'action.selected'
                    : !inRange
                    ? 'action.disabledBackground'
                    : 'background.paper',
                  opacity: !inRange ? 0.5 : 1,
                  '&:hover': inRange ? {
                    bgcolor: isSelected ? 'primary.light' : 'action.hover'
                  } : {},
                  border: isToday ? '2px solid' : 'none',
                  borderColor: 'primary.main'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isToday ? 'bold' : 'normal',
                    color: isSelected ? 'primary.contrastText' : 'text.primary'
                  }}
                >
                  {format(day, 'd')}
                </Typography>

                {/* Booking indicators */}
                <Box sx={{ mt: 0.5 }}>
                  {dayBookings.slice(0, 3).map((booking, idx) => (
                    <Tooltip
                      key={booking.id || idx}
                      title={`${booking.homaType} - ${booking.clientName}`}
                    >
                      <Chip
                        size="small"
                        label={booking.slot}
                        sx={{
                          height: 16,
                          fontSize: '0.6rem',
                          mb: 0.25,
                          width: '100%',
                          bgcolor: getStatusColor(booking.status),
                          color: 'white'
                        }}
                      />
                    </Tooltip>
                  ))}
                  {dayBookings.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{dayBookings.length - 3} more
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {BOOKING_STATUS.map(status => (
          <Chip
            key={status.value}
            size="small"
            label={status.label}
            sx={{ bgcolor: status.color, color: 'white' }}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default BookingCalendar;
