// Panchanga (Hindu Calendar) Service
// Note: For accurate calculations, consider using a proper Panchanga API

// Vāra (Weekdays)
const VARAS = [
  { name: 'Ravivāra', deity: 'Surya', short: 'Sun' },
  { name: 'Somavāra', deity: 'Chandra', short: 'Mon' },
  { name: 'Mangalavāra', deity: 'Mangala', short: 'Tue' },
  { name: 'Budhavāra', deity: 'Budha', short: 'Wed' },
  { name: 'Guruvāra', deity: 'Brihaspati', short: 'Thu' },
  { name: 'Shukravāra', deity: 'Shukra', short: 'Fri' },
  { name: 'Shanivāra', deity: 'Shani', short: 'Sat' }
];

// Tithis (Lunar days)
const TITHIS = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
];

// Nakshatras (Lunar mansions)
const NAKSHATRAS = [
  { name: 'Ashwini', deity: 'Ashwini Kumaras' },
  { name: 'Bharani', deity: 'Yama' },
  { name: 'Krittika', deity: 'Agni' },
  { name: 'Rohini', deity: 'Brahma' },
  { name: 'Mrigashira', deity: 'Soma' },
  { name: 'Ardra', deity: 'Rudra' },
  { name: 'Punarvasu', deity: 'Aditi' },
  { name: 'Pushya', deity: 'Brihaspati' },
  { name: 'Ashlesha', deity: 'Sarpa' },
  { name: 'Magha', deity: 'Pitru' },
  { name: 'Purva Phalguni', deity: 'Bhaga' },
  { name: 'Uttara Phalguni', deity: 'Aryaman' },
  { name: 'Hasta', deity: 'Savitar' },
  { name: 'Chitra', deity: 'Tvashtar' },
  { name: 'Swati', deity: 'Vayu' },
  { name: 'Vishakha', deity: 'Indra-Agni' },
  { name: 'Anuradha', deity: 'Mitra' },
  { name: 'Jyeshtha', deity: 'Indra' },
  { name: 'Mula', deity: 'Nirriti' },
  { name: 'Purva Ashadha', deity: 'Apas' },
  { name: 'Uttara Ashadha', deity: 'Vishvedevas' },
  { name: 'Shravana', deity: 'Vishnu' },
  { name: 'Dhanishta', deity: 'Vasus' },
  { name: 'Shatabhisha', deity: 'Varuna' },
  { name: 'Purva Bhadrapada', deity: 'Aja Ekapada' },
  { name: 'Uttara Bhadrapada', deity: 'Ahir Budhnya' },
  { name: 'Revati', deity: 'Pushan' }
];

// Yogas
const YOGAS = [
  'Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti'
];

// Karanas
const KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara',
  'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'
];

// Paksha (Lunar fortnight)
const getPaksha = (tithiIndex) => {
  return tithiIndex < 15 ? 'Shukla Paksha' : 'Krishna Paksha';
};

// Calculate approximate lunar day from date
// Note: This is a simplified calculation. For accurate results, use astronomical calculations or API
const getLunarDay = (date) => {
  // Reference new moon date (approximate)
  const refNewMoon = new Date('2025-11-01');
  const diffTime = date.getTime() - refNewMoon.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Lunar month is approximately 29.5 days
  const lunarAge = ((diffDays % 29.5) + 29.5) % 29.5;
  return Math.floor(lunarAge);
};

// Get Nakshatra index (simplified calculation)
const getNakshatraIndex = (date) => {
  // Moon moves through all 27 nakshatras in ~27.3 days
  const refDate = new Date('2025-01-01');
  const diffTime = date.getTime() - refDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor((diffDays * 27.3 / 27.3) % 27);
};

// Get Yoga index (simplified)
const getYogaIndex = (date) => {
  const refDate = new Date('2025-01-01');
  const diffTime = date.getTime() - refDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays % 27);
};

// Get Karana index
const getKaranaIndex = (tithiIndex) => {
  // Each tithi has 2 karanas, there are 11 karanas that repeat
  return (tithiIndex * 2) % 11;
};

// Main function to get Panchanga for a date
export const getPanchanga = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);

  const dayOfWeek = dateObj.getDay();
  const lunarDay = getLunarDay(dateObj);
  const nakshatraIndex = getNakshatraIndex(dateObj);
  const yogaIndex = getYogaIndex(dateObj);
  const karanaIndex = getKaranaIndex(lunarDay);

  return {
    vara: VARAS[dayOfWeek],
    tithi: {
      name: TITHIS[lunarDay],
      paksha: getPaksha(lunarDay),
      index: lunarDay
    },
    nakshatra: NAKSHATRAS[nakshatraIndex],
    yoga: YOGAS[yogaIndex],
    karana: KARANAS[karanaIndex]
  };
};

// Get short display for calendar
export const getPanchangaShort = (date) => {
  const panchanga = getPanchanga(date);
  return {
    tithi: panchanga.tithi.name,
    nakshatra: panchanga.nakshatra.name,
    vara: panchanga.vara.name
  };
};

// Check if date is auspicious for specific activities
export const isAuspicious = (date) => {
  const panchanga = getPanchanga(date);

  // Simplified auspicious check
  // In reality, this requires complex calculations
  const auspiciousTithis = ['Dvitiya', 'Tritiya', 'Panchami', 'Saptami', 'Dashami', 'Ekadashi', 'Trayodashi'];
  const auspiciousNakshatras = ['Rohini', 'Mrigashira', 'Pushya', 'Hasta', 'Chitra', 'Swati', 'Anuradha', 'Shravana', 'Dhanishta', 'Revati'];

  const tithiGood = auspiciousTithis.includes(panchanga.tithi.name);
  const nakshatraGood = auspiciousNakshatras.includes(panchanga.nakshatra.name);

  return {
    isGood: tithiGood && nakshatraGood,
    tithiGood,
    nakshatraGood
  };
};

// Special days
export const getSpecialDay = (date) => {
  const panchanga = getPanchanga(date);

  const specialDays = [];

  if (panchanga.tithi.name === 'Purnima') {
    specialDays.push('Purnima');
  }
  if (panchanga.tithi.name === 'Amavasya') {
    specialDays.push('Amavasya');
  }
  if (panchanga.tithi.name === 'Ekadashi') {
    specialDays.push('Ekadashi');
  }
  if (panchanga.tithi.name === 'Chaturthi') {
    specialDays.push('Sankashti/Vinayaka Chaturthi');
  }
  if (panchanga.vara.name === 'Somavāra' && panchanga.tithi.name === 'Trayodashi') {
    specialDays.push('Pradosha');
  }

  return specialDays;
};

export default {
  getPanchanga,
  getPanchangaShort,
  isAuspicious,
  getSpecialDay
};
