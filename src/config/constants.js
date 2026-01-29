// Homa/Havana types (without fixed pricing - admin will set price manually)
export const HOMA_TYPES = [
  { id: 'chandra_rahu_yuti', name: 'CHANDRA RAHU YUTI SHANTI' },
  { id: 'ravi_shukra_yuti', name: 'RAVI SHUKRA YUTI SHANTI' },
  { id: 'mangal_rahu_yuti', name: 'MANGAL RAHU YUTI SHANTI' },
  { id: 'chandra_ketu_yuti', name: 'CHANDRA KETU YUTI SHANTI' },
  { id: 'ravi_ketu_yuti', name: 'RAVI KETU YUTI SHANTI' },
  { id: 'ravi_shani_yuti', name: 'RAVI SHANI YUTI SHANTI' },
  { id: 'guru_rahu_yuti', name: 'GURU RAHU YUTI SHANTI' },
  { id: 'bruhaspati_shanti', name: 'BRUHASPATI SHANTI' },
  { id: 'ravi_rahu_yuti', name: 'RAVI RAHU YUTI SHANTI' },
  { id: 'shani_shanti', name: 'SHANI SHANTI' },
  { id: 'ardha_kalasarpa', name: 'ARDHA KALASARPA SHANTI' },
  { id: 'mula_nakshatra', name: 'MULA NAKSHATRA SHANTI' },
  { id: 'krutika_nakshatra', name: 'KRUTIKA NAKSHATRA SHANTI' },
  { id: 'rohini_nakshatra', name: 'ROHINI NAKSHATRA SHANTI' },
  { id: 'jyesta_nakshatra', name: 'JYESTA NAKSHATRA SHANTI' },
  { id: 'anuradha_nakshatra', name: 'ANURADHA NAKSHATRA SHANTI' },
  { id: 'pushya_nakshatra', name: 'PUSHYA NAKSHATRA SHANTI' },
  { id: 'uttara_nakshatra', name: 'UTTARA NAKSHATRA SHANTI' },
  { id: 'chitta_nakshatra', name: 'CHITTA NAKSHATRA SHANTI' },
  { id: 'ashwini_nakshatra', name: 'ASHWINI NAKSHATRA SHANTI' },
  { id: 'vaidruti_yoga', name: 'VAIDRUTI YOGA SHANTI' },
  { id: 'vishkambha_yoga', name: 'VISHKAMBHA YOGA SHANTI' },
  { id: 'atiganda_yoga', name: 'ATIGANDA YOGA SHANTI' },
  { id: 'ganda_yoga', name: 'GANDA YOGA SHANTI' },
  { id: 'vyaghata_yoga', name: 'VYAGHATA YOGA SHANTI' },
  { id: 'vyatipata_yoga', name: 'VYATIPATA YOGA SHANTI' },
  { id: 'shoola_yoga', name: 'SHOOLA YOGA SHANTI' },
  { id: 'vishti_karan', name: 'VISHTI KARAN' },
  { id: 'amavasya_janan', name: 'AMAVASYA JANAN SHANTI' },
  { id: 'grahana_janan', name: 'GRAHANA JANAN SHANTI' },
  { id: 'bhuvaneshwari_homa', name: 'BHUVANESHWARI HOMA' },
  { id: 'swayamvar_parvati', name: 'SWAYAMVAR PARVATI HOMA' },
  { id: 'gana_homa', name: 'GANA HOMA' },
  { id: 'sudarshana_homa', name: 'SUDARSHANA HOMA' },
  { id: 'satyanarayan_shanti', name: 'SATYANARAYAN SHANTI' },
  { id: 'mahamrityunjay_homa', name: 'MAHAMRITYUNJAY HOMA' },
  { id: 'panchaka_udak', name: 'PANCHAKA AND UDAK SHANTI' },
  { id: 'mahamrityunjay_udak_panchaka', name: 'MAHAMRITYUNJAY + UDAK + PANCHAKA SHANTI' },
  { id: 'vastu_shanti_homa', name: 'VASTU SHANTI HOMA' },
  { id: 'vastu_rakshogna_satyanarayan', name: 'VASTU + RAKSHOGNA + SATYANARAYAN' },
  { id: 'mangal_shanti', name: 'MANGAL SHANTI' },
  { id: 'kalasarpa_shanti', name: 'KALASARPA SHANTI' },
  { id: 'custom', name: 'Custom Homa/Havana' }
];

// Sankalpa types
export const SANKALPA_TYPES = [
  { id: 'laxmi_kuber', name: 'LAXMI KUBER SANKALPA' },
  { id: 'saraswati', name: 'SARASWATI SANKALPA' },
  { id: 'santan_prapti', name: 'SANTAN PRAPTI SANKALPA' },
  { id: 'job', name: 'JOB SANKALPA' },
  { id: 'marriage', name: 'MARRIAGE SANKALPA' },
  { id: 'swayamvar_parvati', name: 'SWAYAMVAR PARVATI SANKALPA' },
  { id: 'ganapati', name: 'GANAPATI SANKALPA' },
  { id: 'bruhaspati', name: 'BRUHASPATI SANKALPA' },
  { id: 'exam', name: 'EXAM SANKALPA' }
];

// Booking status options
export const BOOKING_STATUS = [
  { value: 'pending', label: 'Pending', color: '#FFA726' },
  { value: 'booked', label: 'Booked', color: '#42A5F5' },
  { value: 'completed', label: 'Completed', color: '#66BB6A' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF5350' }
];

// Time slots - Now managed dynamically, not fixed
// This is just a placeholder for default slots if needed
export const TIME_SLOTS = [];

// Helper function to format time slot display
export const formatTimeSlot = (startTime, endTime) => {
  return `${startTime} - ${endTime}`;
};

// Default purohits list (can be managed from admin)
export const DEFAULT_PUROHITS = [
  { id: 'purohit1', name: 'Vikas Joshi', phone: '9876543210' },
  { id: 'purohit2', name: 'Nagaraj Hiremath', phone: '9876543211' },
  { id: 'purohit3', name: 'Dilip Kulkarni', phone: '9876543212' }
];

// Date range for bookings
export const BOOKING_START_DATE = new Date('2025-12-01');
export const BOOKING_END_DATE = new Date('2026-12-31');

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  BHADAJI: 'bhadaji', // Restricted access - can't see phone/amount
  PUROHIT: 'purohit' // Purohit-specific view - only see assigned bookings
};

// Payment received by options
export const PAYMENT_RECEIVED_BY = [
  { value: 'vikas', label: 'Vikas' },
  { value: 'new_office', label: 'New Office' },
  { value: 'old_office', label: 'Old Office' }
];
