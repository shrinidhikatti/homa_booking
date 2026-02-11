// Panchanga (Hindu Calendar) Service - Using accurate astronomical calculations
// Based on @ishubhamx/panchangam-js - Verified against Drik Panchang

import { Panchangam } from '@ishubhamx/panchangam-js';

// Default location: Belagavi, Karnataka (Astro Vastu Shri V M Joshi location)
// Accurate panchanga calculations for Belagavi region
const DEFAULT_LOCATION = {
  latitude: 15.8497,  // Belagavi latitude
  longitude: 74.4977, // Belagavi longitude
  timezone: 'Asia/Kolkata'
};

// Get accurate Panchanga for a date using astronomical calculations
export const getPanchanga = (date, location = DEFAULT_LOCATION) => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    // Create Panchangam instance with location
    const panchanga = new Panchangam({
      date: dateObj,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone || DEFAULT_LOCATION.timezone
    });

    // Get all panchanga elements
    const panchangaData = panchanga.getPanchangam();

    return {
      vara: {
        name: panchangaData.vara || getVaraName(dateObj.getDay()),
        deity: getVaraDeity(dateObj.getDay()),
        short: getVaraShort(dateObj.getDay())
      },
      tithi: {
        name: panchangaData.tithi?.name || 'Unknown',
        paksha: panchangaData.paksha || (panchangaData.tithi?.index < 15 ? 'Shukla Paksha' : 'Krishna Paksha'),
        index: panchangaData.tithi?.index || 0,
        endTime: panchangaData.tithi?.endTime
      },
      nakshatra: {
        name: panchangaData.nakshatra?.name || 'Unknown',
        deity: panchangaData.nakshatra?.deity || '',
        endTime: panchangaData.nakshatra?.endTime
      },
      yoga: panchangaData.yoga?.name || 'Unknown',
      karana: panchangaData.karana?.name || 'Unknown',
      rashi: panchangaData.rashi || {},
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
