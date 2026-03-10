// Panchanga (Hindu Calendar) Service - Using accurate astronomical calculations
// Based on @ishubhamx/panchangam-js - Verified against Drik Panchang

import { getPanchangam, Observer } from '@ishubhamx/panchangam-js';

// Default location: Belagavi, Karnataka (Astro Vastu Shri V M Joshi location)
// Accurate panchanga calculations for Belagavi region
const DEFAULT_LOCATION = {
  latitude: 15.8497,  // Belagavi latitude
  longitude: 74.4977, // Belagavi longitude
  elevation: 751      // Belagavi elevation in meters (approximately 751m)
};

// Create Observer for Belagavi
const createObserver = (location = DEFAULT_LOCATION) => {
  return new Observer(
    location.latitude,
    location.longitude,
    location.elevation || 0
  );
};

// Get accurate Panchanga for a date using astronomical calculations
export const getPanchanga = (date, location = DEFAULT_LOCATION) => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    const observer = createObserver(location);

    // Get panchanga data using the library
    const panchangaData = getPanchangam(dateObj, observer);

    // Extract current tithi from transitions
    const currentTithi = panchangaData.tithiTransitions?.find(t =>
      t.startTime <= dateObj && t.endTime > dateObj
    ) || panchangaData.tithiTransitions?.[0];

    // Extract current nakshatra from transitions
    const currentNakshatra = panchangaData.nakshatraTransitions?.find(n =>
      n.startTime <= dateObj && n.endTime > dateObj
    ) || panchangaData.nakshatraTransitions?.[0];

    // Extract current yoga from transitions
    const currentYoga = panchangaData.yogaTransitions?.find(y =>
      y.startTime <= dateObj && y.endTime > dateObj
    ) || panchangaData.yogaTransitions?.[0];

    // Determine paksha based on tithi index
    const tithiIndex = currentTithi?.index || 0;
    const paksha = tithiIndex <= 14 ? 'Shukla Paksha' : 'Krishna Paksha';

    // Get vara - use JavaScript's getDay() which is reliable
    // Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
    const varaIndex = dateObj.getDay();

    return {
      vara: {
        name: getVaraName(varaIndex),
        deity: getVaraDeity(varaIndex),
        short: getVaraShort(varaIndex)
      },
      tithi: {
        name: currentTithi?.name || 'Unknown',
        paksha: paksha,
        index: tithiIndex,
        endTime: currentTithi?.endTime
      },
      nakshatra: {
        name: currentNakshatra?.name || 'Unknown',
        deity: '', // Library doesn't provide deity info
        endTime: currentNakshatra?.endTime
      },
      yoga: currentYoga?.name || 'Unknown',
      karana: panchangaData.karana || 'Unknown',
      sunrise: panchangaData.sunrise,
      sunset: panchangaData.sunset,
      moonrise: panchangaData.moonrise,
      moonset: panchangaData.moonset
    };
  } catch (error) {
    console.error('Error calculating panchanga:', error);
    // Fallback to basic calculation
    return getFallbackPanchanga(date);
  }
};

// Get short display for calendar
export const getPanchangaShort = (date, location = DEFAULT_LOCATION) => {
  const panchanga = getPanchanga(date, location);
  return {
    tithi: panchanga.tithi.name,
    nakshatra: panchanga.nakshatra.name,
    vara: panchanga.vara.name
  };
};

// Check if date is auspicious for specific activities
export const isAuspicious = (date, location = DEFAULT_LOCATION) => {
  const panchanga = getPanchanga(date, location);

  // Auspicious Tithis for religious ceremonies
  const auspiciousTithis = [
    'Dvitiya', 'Tritiya', 'Panchami', 'Saptami',
    'Dashami', 'Ekadashi', 'Trayodashi', 'Purnima'
  ];

  // Auspicious Nakshatras for ceremonies
  const auspiciousNakshatras = [
    'Rohini', 'Mrigashira', 'Pushya', 'Hasta',
    'Chitra', 'Swati', 'Anuradha', 'Shravana',
    'Dhanishta', 'Revati'
  ];

  const tithiGood = auspiciousTithis.includes(panchanga.tithi.name);
  const nakshatraGood = auspiciousNakshatras.includes(panchanga.nakshatra.name);

  return {
    isGood: tithiGood && nakshatraGood,
    tithiGood,
    nakshatraGood
  };
};

// Special days
export const getSpecialDay = (date, location = DEFAULT_LOCATION) => {
  const panchanga = getPanchanga(date, location);
  const specialDays = [];

  // Major festivals and special days
  if (panchanga.tithi.name === 'Purnima') {
    specialDays.push('Purnima (Full Moon)');
  }
  if (panchanga.tithi.name === 'Amavasya') {
    specialDays.push('Amavasya (New Moon)');
  }
  if (panchanga.tithi.name === 'Ekadashi') {
    specialDays.push('Ekadashi (Fasting Day)');
  }
  if (panchanga.tithi.name === 'Chaturthi') {
    specialDays.push('Chaturthi (Ganesh Day)');
  }
  if (panchanga.vara.name === 'Somavāra' && panchanga.tithi.name === 'Trayodashi') {
    specialDays.push('Pradosha (Shiva Worship)');
  }
  if (panchanga.vara.name === 'Mangalavāra' && panchanga.tithi.name === 'Chaturthi') {
    specialDays.push('Angaraki Chaturthi');
  }

  return specialDays;
};

// Helper functions for fallback
const getVaraName = (dayIndex) => {
  const varas = ['Ravivāra', 'Somavāra', 'Mangalavāra', 'Budhavāra', 'Guruvāra', 'Shukravāra', 'Shanivāra'];
  return varas[dayIndex];
};

const getVaraDeity = (dayIndex) => {
  const deities = ['Surya', 'Chandra', 'Mangala', 'Budha', 'Brihaspati', 'Shukra', 'Shani'];
  return deities[dayIndex];
};

const getVaraShort = (dayIndex) => {
  const shorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return shorts[dayIndex];
};

// Fallback basic panchanga if library fails
const getFallbackPanchanga = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  const dayOfWeek = dateObj.getDay();

  return {
    vara: {
      name: getVaraName(dayOfWeek),
      deity: getVaraDeity(dayOfWeek),
      short: getVaraShort(dayOfWeek)
    },
    tithi: {
      name: 'Calculating...',
      paksha: 'Unknown',
      index: 0
    },
    nakshatra: {
      name: 'Calculating...',
      deity: ''
    },
    yoga: 'Unknown',
    karana: 'Unknown'
  };
};

// Export default object with all functions
const panchangaService = {
  getPanchanga,
  getPanchangaShort,
  isAuspicious,
  getSpecialDay,
  DEFAULT_LOCATION
};

export default panchangaService;
