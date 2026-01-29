import { format } from 'date-fns';
import { TIME_SLOTS } from '../config/constants';
import {
  sendBookingConfirmation as msg91SendConfirmation,
  sendBookingReminder as msg91SendReminder,
  sendBulkWhatsAppReminders as msg91SendBulkReminders,
  sendWhatsAppViaWeb
} from './msg91Service';

// MSG91 WhatsApp Integration is now active
// Using WhatsApp Number: 919632691895

const getSlotLabel = (slotId) => {
  const slot = TIME_SLOTS.find(s => s.id === slotId);
  return slot?.label || slotId;
};

const formatDate = (date) => {
  const dateObj = date?.toDate ? date.toDate() : new Date(date);
  return format(dateObj, 'dd MMM yyyy (EEEE)');
};

// Generate reminder message
export const generateReminderMessage = (booking) => {
  return `Namaste ${booking.clientName}!

This is a reminder for your ${booking.homaType} scheduled for:

📅 Date: ${formatDate(booking.date)}
⏰ Time: ${getSlotLabel(booking.slot)}
${booking.venueAddress ? `📍 Venue: ${booking.venueAddress}` : ''}
${booking.purohitName ? `🙏 Purohit: ${booking.purohitName}` : ''}

${booking.remainingAmount > 0 ? `💰 Balance Due: ₹${booking.remainingAmount.toLocaleString('en-IN')}` : ''}

Please be ready on time. Contact us for any queries.

Thank you!`;
};

// Generate booking confirmation message
export const generateConfirmationMessage = (booking) => {
  return `🙏 Namaste,

Your Homa has been successfully booked as per the auspicious muhurta.

🗓 Date: ${formatDate(booking.date)}
⏰ Time: ${booking.slot || getSlotLabel(booking.slot)}
📍 Location: https://g.co/kgs/fn1nFkG

All required pooja samagri and Vedic arrangements will be taken care of by our team as per Shastra vidhi.

For any clarification or assistance, please feel free to contact us:
📞 9590033894

With divine blessings,
🌿 Shri V. M. Joshi Vastu & Astrologer
✨ Authentic Vedic Rituals | Astrology | Vastu Shastra
🌐 astrovastushrivmjoshi.com`;
};

// Send WhatsApp message using MSG91 API
export const sendWhatsAppMessage = async (phone, message, booking = null) => {
  try {
    // If MSG91 is configured and we have booking data, use API
    if (booking && process.env.REACT_APP_MSG91_AUTH_KEY &&
        process.env.REACT_APP_MSG91_AUTH_KEY !== 'your_msg91_auth_key_here') {

      // Determine which template to use based on message content
      if (message.includes('successfully booked')) {
        return await msg91SendConfirmation(booking);
      } else if (message.includes('reminder')) {
        return await msg91SendReminder(booking);
      }
    }

    // Fallback to WhatsApp Web (manual sending)
    sendWhatsAppViaWeb(phone, message);
    return { success: true, method: 'web' };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    // Fallback to web if API fails
    sendWhatsAppViaWeb(phone, message);
    return { success: true, method: 'web-fallback' };
  }
};

// Send bulk WhatsApp reminders using MSG91 API
export const sendBulkWhatsAppReminders = async (bookings) => {
  try {
    // If MSG91 is configured, use API for bulk sending
    if (process.env.REACT_APP_MSG91_AUTH_KEY &&
        process.env.REACT_APP_MSG91_AUTH_KEY !== 'your_msg91_auth_key_here') {

      console.log('Sending bulk reminders via MSG91 API...');
      const results = await msg91SendBulkReminders(bookings);

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      console.log(`Bulk send complete: ${successCount} sent, ${failedCount} failed`);
      return {
        success: true,
        total: bookings.length,
        sent: successCount,
        failed: failedCount,
        results
      };
    }

    // Fallback to WhatsApp Web (opens multiple tabs)
    bookings.forEach((booking, index) => {
      setTimeout(() => {
        const message = generateReminderMessage(booking);
        sendWhatsAppViaWeb(booking.clientPhone, message);
      }, index * 1000); // 1 second delay between each
    });

    return {
      success: true,
      method: 'web',
      total: bookings.length
    };
  } catch (error) {
    console.error('Error sending bulk reminders:', error);
    throw error;
  }
};

// For SMS integration with Twilio (requires backend/Cloud Functions)
// This is a placeholder - actual implementation requires server-side code
export const sendSMS = async (phone, message) => {
  // In production, this would call a Cloud Function or API endpoint
  // that uses Twilio or another SMS provider

  console.log('SMS would be sent to:', phone);
  console.log('Message:', message);

  // Example API call (you'd implement this in Firebase Cloud Functions):
  /*
  const response = await fetch('https://your-cloud-function-url/sendSMS', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, message })
  });
  return response.json();
  */

  return { success: true, message: 'SMS API not configured. Use WhatsApp instead.' };
};

// Twilio configuration template for Cloud Functions
export const twilioCloudFunctionTemplate = `
// Save this as a Firebase Cloud Function
// Install: npm install twilio

const functions = require('firebase-functions');
const twilio = require('twilio');

const accountSid = 'YOUR_TWILIO_ACCOUNT_SID';
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
const twilioPhone = 'YOUR_TWILIO_PHONE_NUMBER';

const client = twilio(accountSid, authToken);

exports.sendSMS = functions.https.onCall(async (data, context) => {
  const { phone, message } = data;

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: '+91' + phone
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send SMS');
  }
});

// Scheduled function to send daily reminders
exports.sendDailyReminders = functions.pubsub
  .schedule('0 9 * * *') // Run at 9 AM daily
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const admin = require('firebase-admin');
    const db = admin.firestore();

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setHours(23, 59, 59, 999);

    // Query bookings for tomorrow
    const snapshot = await db.collection('bookings')
      .where('date', '>=', tomorrow)
      .where('date', '<=', dayAfter)
      .where('status', 'in', ['booked', 'pending'])
      .get();

    const promises = snapshot.docs.map(doc => {
      const booking = doc.data();
      const message = generateReminderMessage(booking);
      return sendSMS(booking.clientPhone, message);
    });

    await Promise.all(promises);
    console.log(\`Sent \${snapshot.docs.length} reminders\`);
  });
`;

// WhatsApp Business API template (for production)
export const whatsappBusinessAPITemplate = `
// For WhatsApp Business API integration
// You'll need to register with Meta Business and get API access

const sendWhatsAppBusinessMessage = async (phone, templateName, templateParams) => {
  const WHATSAPP_TOKEN = 'YOUR_WHATSAPP_ACCESS_TOKEN';
  const PHONE_NUMBER_ID = 'YOUR_PHONE_NUMBER_ID';

  const response = await fetch(
    \`https://graph.facebook.com/v17.0/\${PHONE_NUMBER_ID}/messages\`,
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${WHATSAPP_TOKEN}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '91' + phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: templateParams
            }
          ]
        }
      })
    }
  );

  return response.json();
};
`;
