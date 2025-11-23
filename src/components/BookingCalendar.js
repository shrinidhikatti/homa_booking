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
import { getPanchangaShort, getSpecialDay } from '../services/panchangaService';

const BookingCalendar = ({ bookings, onDateSelect, selectedDate, showPanchanga }) => {
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
    <Paper elevation={3} sx={{ p: { xs: 1, sm: 2 }, overflow: 'hidden' }}>
      {/* Calendar Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePrevMonth} size="small">
          <ChevronLeft />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleToday} size="small">
            <Today fontSize="small" />
          </IconButton>
        </Box>
        <IconButton onClick={handleNextMonth} size="small">
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
              sx={{
                fontWeight: 'bold',
                color: 'text.secondary',
                fontSize: { xs: '0.65rem', sm: '0.875rem' }
              }}
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
          const panchanga = showPanchanga ? getPanchangaShort(day) : null;
          const specialDays = showPanchanga ? getSpecialDay(day) : [];
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const slotsBooked = dayBookings.length;
          const slotsAvailable = 3 - slotsBooked;

          return (
            <Grid item xs={12/7} key={day.toISOString()}>
              <Paper
                elevation={isSelected ? 8 : 1}
                onClick={() => inRange && onDateSelect(day)}
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  minHeight: { xs: showPanchanga ? 80 : 60, sm: showPanchanga ? 120 : 100 },
                  cursor: inRange ? 'pointer' : 'not-allowed',
                  bgcolor: isSelected
                    ? 'primary.light'
                    : isToday
                    ? 'action.selected'
                    : !inRange
                    ? 'action.disabledBackground'
                    : isWeekend
                    ? '#fff8f0'
                    : 'background.paper',
                  opacity: !inRange ? 0.5 : 1,
                  '&:hover': inRange ? {
                    bgcolor: isSelected ? 'primary.light' : 'action.hover',
                    transform: 'scale(1.02)',
                    boxShadow: 3
                  } : {},
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? 'primary.main' : 'divider',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Date number with day indicator */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: isToday ? 'bold' : 'medium',
                      color: isSelected
                        ? 'primary.contrastText'
                        : isWeekend
                        ? 'error.main'
                        : 'text.primary',
                      fontSize: { xs: '0.75rem', sm: '1rem' }
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  {!showPanchanga && inRange && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: { xs: '0.45rem', sm: '0.6rem' },
                        color: slotsAvailable > 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold',
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      {slotsAvailable > 0 ? `${slotsAvailable} free` : 'Full'}
                    </Typography>
                  )}
                </Box>

                {/* Panchanga Details */}
                {showPanchanga && panchanga && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontSize: '0.55rem',
                        color: isSelected ? 'primary.contrastText' : 'text.secondary',
                        lineHeight: 1.2
                      }}
                    >
                      {panchanga.tithi}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontSize: '0.55rem',
                        color: isSelected ? 'primary.contrastText' : 'info.main',
                        lineHeight: 1.2
                      }}
                    >
                      {panchanga.nakshatra}
                    </Typography>
                    {specialDays.length > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          fontSize: '0.5rem',
                          color: 'error.main',
                          fontWeight: 'bold',
                          lineHeight: 1.2
                        }}
                      >
                        {specialDays[0]}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Booking indicators */}
                {!showPanchanga && (
                  <Box sx={{ mt: 1 }}>
                    {dayBookings.length > 0 ? (
                      <>
                        {dayBookings.slice(0, 2).map((booking, idx) => (
                          <Tooltip
                            key={booking.id || idx}
                            title={`${booking.homaType} - ${booking.clientName} (${booking.status})`}
                          >
                            <Chip
                              size="small"
                              label={`${booking.slot.charAt(0).toUpperCase()}${booking.slot.slice(1, 3)}`}
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                mb: 0.3,
                                mr: 0.3,
                                bgcolor: getStatusColor(booking.status),
                                color: 'white',
                                fontWeight: 'bold',
                                '& .MuiChip-label': {
                                  px: 0.5
                                }
                              }}
                            />
                          </Tooltip>
                        ))}
                        {dayBookings.length > 2 && (
                          <Chip
                            size="small"
                            label={`+${dayBookings.length - 2}`}
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: 'grey.400',
                              color: 'white',
                              '& .MuiChip-label': {
                                px: 0.5
                              }
                            }}
                          />
                        )}
                      </>
                    ) : inRange ? (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'success.light',
                          fontSize: '0.6rem',
                          fontStyle: 'italic'
                        }}
                      >
                        Available
                      </Typography>
                    ) : null}
                  </Box>
                )}

                {/* Show booking count when panchanga is on */}
                {showPanchanga && dayBookings.length > 0 && (
                  <Chip
                    size="small"
                    label={`${dayBookings.length} booking${dayBookings.length > 1 ? 's' : ''}`}
                    sx={{
                      height: 14,
                      fontSize: '0.5rem',
                      mt: 0.5,
                      bgcolor: 'primary.main',
                      color: 'white'
                    }}
                  />
                )}
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
