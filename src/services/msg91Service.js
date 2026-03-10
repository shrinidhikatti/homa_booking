/**
 * MSG91 WhatsApp Business API Integration
 * Auth key is stored in Firestore (settings/appSettings.msg91AuthKey)
 * and cached in memory after first load.
 */

import { loadSettings } from './settingsService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../config/firebase';

const MSG91_BASE_URL = 'https://control.msg91.com/api/v5/whatsapp';
const functions = getFunctions(app);

// In-memory cache so we don't fetch Firestore on every message
let _cachedAuthKey = null;
let _cachedWhatsAppNumber = null;

export const refreshMsg91Config = async () => {
  const settings = await loadSettings();
  _cachedAuthKey = settings.msg91AuthKey || process.env.REACT_APP_MSG91_AUTH_KEY || null;
  _cachedWhatsAppNumber = settings.whatsappNumber
    || process.env.REACT_APP_WHATSAPP_NUMBER
    || '919632691895';
  return {
    authKey: _cachedAuthKey,
    whatsappNumber: _cachedWhatsAppNumber
  };
};

const getConfig = async () => {
  if (!_cachedAuthKey) await refreshMsg91Config();
  return { authKey: _cachedAuthKey, whatsappNumber: _cachedWhatsAppNumber };
};

const isConfigured = (authKey) =>
  authKey && authKey !== 'your_msg91_auth_key_here' && authKey.trim() !== '';

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send a WhatsApp message via MSG91.
 * Uses "text" content_type for session messages.
 * Falls back to WhatsApp Web if not configured.
 */
export const sendWhatsAppMsg91 = async (phone, message) => {
  try {
    const sendWhatsApp = httpsCallable(functions, 'sendWhatsApp');
    const result = await sendWhatsApp({ phone, message });
    return result.data;
  } catch (err) {
    console.error('Cloud Function error:', err);
    return { success: false, error: err.message, fallback: true };
  }
};

// Send booking confirmation via approved template
export const sendConfirmationTemplate = async (booking) => {
  try {
    const sendWhatsApp = httpsCallable(functions, 'sendWhatsApp');
    const result = await sendWhatsApp({ phone: booking.clientPhone, type: 'confirmation', booking });
    return result.data;
  } catch (err) {
    console.error('Cloud Function error:', err);
    return { success: false, error: err.message, fallback: true };
  }
};

// Send reminder via approved template
export const sendReminderTemplate = async (booking) => {
  try {
    const sendWhatsApp = httpsCallable(functions, 'sendWhatsApp');
    const result = await sendWhatsApp({ phone: booking.clientPhone, type: 'reminder', booking });
    return result.data;
  } catch (err) {
    console.error('Cloud Function error:', err);
    return { success: false, error: err.message, fallback: true };
  }
};

// Send walk-in welcome message via Cloud Function
export const sendWalkInWelcome = async (phone, clientName) => {
  try {
    const sendWhatsApp = httpsCallable(functions, 'sendWhatsApp');
    const result = await sendWhatsApp({ phone, type: 'walkin', clientName });
    return result.data;
  } catch (err) {
    console.error('Cloud Function error (walkin):', err);
    return { success: false, error: err.message, fallback: true };
  }
};

// ── Template send (for pre-approved templates) ────────────────────────────────

export const sendWhatsAppTemplate = async (recipientPhone, templateName, templateParams) => {
  const { authKey, whatsappNumber } = await getConfig();

  if (!isConfigured(authKey)) {
    return { success: false, error: 'MSG91 not configured', fallback: true };
  }

  const cleanPhone = recipientPhone.replace(/\D/g, '').replace(/^91/, '');

  const body = {
    integrated_number: whatsappNumber,
    content_type: 'template',
    payload: {
      to: `91${cleanPhone}`,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en', policy: 'deterministic' },
        components: [{
          type: 'body',
          parameters: Object.values(templateParams).map(v => ({ type: 'text', text: String(v) }))
        }]
      }
    }
  };

  try {
    const res = await fetch(`${MSG91_BASE_URL}/whatsapp-outbound-message/`, {
      method: 'POST',
      headers: { 'authkey': authKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return res.ok ? { success: true, data } : { success: false, error: data?.message, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ── Booking-specific senders ──────────────────────────────────────────────────

const formatDate = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'
  });
};

export const sendBookingConfirmationToClient = async (booking) => {
  const message =
    `🙏 Namaste ${booking.clientName},\n\n` +
    `Your *Homa booking* is confirmed!\n\n` +
    `📅 Date: ${formatDate(booking.date)}\n` +
    `⏰ Slot: ${booking.slotDisplay || booking.slot}\n` +
    `🏠 Venue: ${booking.venueAddress || 'To be confirmed'}\n` +
    (booking.remainingAmount > 0
      ? `💰 Balance Due: ₹${Number(booking.remainingAmount).toLocaleString('en-IN')}\n`
      : '') +
    `\nFor queries: 📞 9590033894\n\n` +
    `With divine blessings,\n🌿 Shri V. M. Joshi – Astro Vastu`;

  return sendWhatsAppMsg91(booking.clientPhone, message);
};

export const sendBookingConfirmationToPurohit = async (booking) => {
  if (!booking.purohitPhone) return { success: false, error: 'No purohit phone' };

  const message =
    `🙏 Namaste ${booking.purohitName || 'Purohit Ji'},\n\n` +
    `New booking assigned to you:\n\n` +
    `👤 Client: ${booking.clientName}\n` +
    `📞 Phone: ${booking.clientPhone}\n` +
    `🔥 Homa: ${Array.isArray(booking.homaTypes) ? booking.homaTypes.join(', ') : booking.homaType}\n` +
    `📅 Date: ${formatDate(booking.date)}\n` +
    `⏰ Slot: ${booking.slotDisplay || booking.slot}\n` +
    `🏠 Venue: ${booking.venueAddress || 'TBD'}\n` +
    `📿 Gotra: ${booking.gotra || 'Not specified'}\n\n` +
    `Please confirm your availability.`;

  return sendWhatsAppMsg91(booking.purohitPhone, message);
};

export const sendBookingConfirmation = async (booking) => {
  const [client, purohit] = await Promise.allSettled([
    sendBookingConfirmationToClient(booking),
    booking.purohitPhone ? sendBookingConfirmationToPurohit(booking) : Promise.resolve({ success: false })
  ]);
  return {
    success: client.value?.success || false,
    client: client.value,
    purohit: purohit.value
  };
};

export const sendBookingReminderToClient = async (booking) => {
  const message =
    `🔔 Reminder – *${Array.isArray(booking.homaTypes) ? booking.homaTypes.join(', ') : booking.homaType}*\n\n` +
    `Namaste ${booking.clientName},\n\n` +
    `Your Homa is scheduled for *tomorrow*:\n\n` +
    `📅 ${formatDate(booking.date)}\n` +
    `⏰ ${booking.slotDisplay || booking.slot}\n` +
    `🏠 ${booking.venueAddress || 'TBD'}\n` +
    `🙏 Purohit: ${booking.purohitName || 'TBD'}\n` +
    (booking.remainingAmount > 0
      ? `💰 Balance Due: ₹${Number(booking.remainingAmount).toLocaleString('en-IN')}\n`
      : '') +
    `\nPlease be ready on time. 🙏`;

  return sendWhatsAppMsg91(booking.clientPhone, message);
};

export const sendBookingReminderToPurohit = async (booking) => {
  if (!booking.purohitPhone) return { success: false, error: 'No purohit phone' };

  const message =
    `🔔 Tomorrow's Homa – Reminder\n\n` +
    `Namaste ${booking.purohitName || 'Purohit Ji'},\n\n` +
    `👤 Client: ${booking.clientName} (${booking.clientPhone})\n` +
    `🔥 Homa: ${Array.isArray(booking.homaTypes) ? booking.homaTypes.join(', ') : booking.homaType}\n` +
    `📅 ${formatDate(booking.date)}\n` +
    `⏰ ${booking.slotDisplay || booking.slot}\n` +
    `🏠 ${booking.venueAddress || 'TBD'}\n\n` +
    `Please confirm your attendance. 🙏`;

  return sendWhatsAppMsg91(booking.purohitPhone, message);
};

export const sendBookingReminder = async (booking) => {
  const [client, purohit] = await Promise.allSettled([
    sendBookingReminderToClient(booking),
    booking.purohitPhone ? sendBookingReminderToPurohit(booking) : Promise.resolve({ success: false })
  ]);
  return {
    success: client.value?.success || false,
    client: client.value,
    purohit: purohit.value
  };
};

export const sendBulkWhatsAppReminders = async (bookings) => {
  const results = [];
  for (const booking of bookings) {
    await new Promise(r => setTimeout(r, 800)); // rate limit
    const result = await sendBookingReminder(booking);
    results.push({ bookingId: booking.id, clientName: booking.clientName, ...result });
  }
  return results;
};

export const sendWhatsAppViaWeb = (phone, message) => {
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('91') ? clean : `91${clean}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
};

export const testMsg91Connection = async () => {
  const { authKey, whatsappNumber } = await getConfig();
  return {
    configured: isConfigured(authKey),
    authKey: authKey ? `${authKey.slice(0, 6)}${'*'.repeat(authKey.length - 6)}` : 'Not set',
    whatsappNumber
  };
};

export default {
  sendWhatsAppMsg91,
  sendWhatsAppTemplate,
  sendBookingConfirmation,
  sendBookingConfirmationToClient,
  sendBookingConfirmationToPurohit,
  sendBookingReminder,
  sendBookingReminderToClient,
  sendBookingReminderToPurohit,
  sendBulkWhatsAppReminders,
  sendWhatsAppViaWeb,
  testMsg91Connection,
  refreshMsg91Config
};
