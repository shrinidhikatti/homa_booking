const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

const MSG91_BASE_URL = 'https://control.msg91.com/api/v5/whatsapp';

// Load MSG91 config from Firestore settings
const getMsg91Config = async () => {
  const snap = await admin.firestore().doc('settings/appSettings').get();
  const settings = snap.exists ? snap.data() : {};
  return {
    authKey: settings.msg91AuthKey || null,
    whatsappNumber: settings.whatsappNumber || '919632691895'
  };
};

const isConfigured = (authKey) =>
  authKey && authKey !== 'your_msg91_auth_key_here' && authKey.trim() !== '';

const formatDate = (dateVal) => {
  if (!dateVal) return '';
  // Firestore Timestamp serializes via httpsCallable as {seconds:N} (no underscore)
  // but direct Firestore reads give {_seconds:N} — handle both
  const secs = dateVal._seconds || dateVal.seconds;
  const d = secs ? new Date(secs * 1000) : new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'
  });
};

// ── Send via approved template ─────────────────────────────────────────────────
const sendTemplate = async (authKey, whatsappNumber, phone, templateName, params) => {
  const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '');
  const body = {
    integrated_number: whatsappNumber,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      to: `91${cleanPhone}`,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en', policy: 'deterministic' },
        components: [{
          type: 'body',
          parameters: params.map(p => ({ type: 'text', text: String(p) }))
        }]
      }
    }
  };

  const res = await fetch(`${MSG91_BASE_URL}/whatsapp-outbound-message/`, {
    method: 'POST',
    headers: { 'authkey': authKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
};

// ── Core Cloud Function (called from React app) ────────────────────────────────

exports.sendWhatsApp = functions.https.onCall(async (data, context) => {
  const { phone, message, type, booking, clientName } = data;

  if (!phone) {
    throw new functions.https.HttpsError('invalid-argument', 'phone is required');
  }

  const { authKey, whatsappNumber } = await getMsg91Config();

  if (!isConfigured(authKey)) {
    return { success: false, error: 'MSG91 not configured', fallback: true };
  }

  try {
    let responseData;

    if (type === 'confirmation' && booking) {
      // Use approved template for booking confirmation
      const balanceText = booking.remainingAmount > 0
        ? `Rs. ${Number(booking.remainingAmount).toLocaleString('en-IN')}`
        : 'Fully Paid';

      const params = [
        booking.clientName || 'Customer',
        formatDate(booking.date),
        booking.slotDisplay || booking.slot || 'Morning',
        booking.venueAddress || 'To be confirmed',
        balanceText
      ];
      functions.logger.info('Confirmation params:', { params, dateRaw: JSON.stringify(booking.date) });

      responseData = await sendTemplate(authKey, whatsappNumber, phone,
        'homa_booking_confirmation', params
      );
    } else if (type === 'reminder' && booking) {
      // Use approved template for reminder
      const params = [
        booking.clientName || 'Customer',
        formatDate(booking.date),
        booking.slotDisplay || booking.slot || 'Morning',
        booking.venueAddress || 'TBD',
        booking.purohitName || 'TBD'
      ];
      functions.logger.info('Reminder params:', { params, dateRaw: JSON.stringify(booking.date) });

      responseData = await sendTemplate(authKey, whatsappNumber, phone,
        'homa_booking_reminder', params
      );
    } else if (type === 'walkin') {
      // Walk-in welcome — approved template
      responseData = await sendTemplate(authKey, whatsappNumber, phone,
        'walkin', [clientName || 'Customer']
      );
    } else if (message) {
      // Free-form text (only works within 24hr session window)
      const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '');
      const body = {
        integrated_number: whatsappNumber,
        content_type: 'text',
        recipient_number: `91${cleanPhone}`,
        text: message
      };
      const res = await fetch(`${MSG91_BASE_URL}/whatsapp-outbound-message/`, {
        method: 'POST',
        headers: { 'authkey': authKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      responseData = await res.json();
    } else {
      return { success: false, error: 'No message or type provided', fallback: true };
    }

    if (responseData?.status === 'success') {
      return { success: true, data: responseData };
    } else {
      functions.logger.error('MSG91 error:', responseData);
      return { success: false, error: responseData?.errors || 'Send failed', data: responseData };
    }
  } catch (err) {
    functions.logger.error('sendWhatsApp error:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});

// ── Scheduled daily reminder (runs at 9 AM IST every day) ────────────────────

exports.sendDailyReminders = functions.pubsub
  .schedule('30 3 * * *') // 3:30 AM UTC = 9:00 AM IST
  .timeZone('UTC')
  .onRun(async () => {
    const { authKey, whatsappNumber } = await getMsg91Config();

    if (!isConfigured(authKey)) {
      functions.logger.info('MSG91 not configured, skipping reminders');
      return null;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setHours(23, 59, 59, 999);

    const snapshot = await admin.firestore()
      .collection('bookings')
      .where('date', '>=', admin.firestore.Timestamp.fromDate(tomorrow))
      .where('date', '<=', admin.firestore.Timestamp.fromDate(dayAfter))
      .where('status', 'in', ['booked', 'pending'])
      .get();

    functions.logger.info(`Found ${snapshot.docs.length} bookings for tomorrow`);

    for (const docSnap of snapshot.docs) {
      const booking = docSnap.data();

      // Send reminder template to client
      if (booking.clientPhone) {
        try {
          await sendTemplate(authKey, whatsappNumber, booking.clientPhone,
            'homa_booking_reminder', [
              booking.clientName || 'Customer',
              formatDate(booking.date),
              booking.slotDisplay || booking.slot || 'Morning',
              booking.venueAddress || 'TBD',
              booking.purohitName || 'TBD'
            ]
          );
        } catch (e) {
          functions.logger.error(`Failed to send reminder to ${booking.clientPhone}:`, e);
        }
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    }

    functions.logger.info('Daily reminders sent successfully');
    return null;
  });
