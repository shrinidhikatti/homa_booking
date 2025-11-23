// Homa/Havana types with pricing
export const HOMA_TYPES = [
  { id: 'ganapathi', name: 'Ganapathi Homa', price: 5000 },
  { id: 'navagraha', name: 'Navagraha Homa', price: 7500 },
  { id: 'sudarshana', name: 'Sudarshana Homa', price: 6000 },
  { id: 'mrityunjaya', name: 'Mrityunjaya Homa', price: 8000 },
  { id: 'lakshmi', name: 'Lakshmi Homa', price: 5500 },
  { id: 'chandi', name: 'Chandi Homa', price: 15000 },
  { id: 'rudra', name: 'Rudra Homa', price: 12000 },
  { id: 'ayushya', name: 'Ayushya Homa', price: 5000 },
  { id: 'punyahavachana', name: 'Punyahavachana', price: 3500 },
  { id: 'gruhapravesham', name: 'Gruhapravesham', price: 10000 },
  { id: 'satyanarayan', name: 'Satyanarayan Puja', price: 5000 },
  { id: 'vastu', name: 'Vastu Shanti', price: 8000 },
  { id: 'custom', name: 'Custom Homa/Havana', price: 0 }
];

// Booking status options
export const BOOKING_STATUS = [
  { value: 'pending', label: 'Pending', color: '#FFA726' },
  { value: 'booked', label: 'Booked', color: '#42A5F5' },
  { value: 'completed', label: 'Completed', color: '#66BB6A' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF5350' }
];

// Time slots for each day
export const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (6:00 AM - 10:00 AM)', time: '06:00' },
  { id: 'midday', label: 'Midday (10:00 AM - 2:00 PM)', time: '10:00' },
  { id: 'evening', label: 'Evening (4:00 PM - 8:00 PM)', time: '16:00' }
];

// Default purohits list (can be managed from admin)
export const DEFAULT_PUROHITS = [
  { id: 'purohit1', name: 'Pandit Sharma', phone: '9876543210' },
  { id: 'purohit2', name: 'Pandit Iyer', phone: '9876543211' },
  { id: 'purohit3', name: 'Pandit Bhat', phone: '9876543212' }
];

// Date range for bookings
export const BOOKING_START_DATE = new Date('2025-12-01');
export const BOOKING_END_DATE = new Date('2026-12-31');
