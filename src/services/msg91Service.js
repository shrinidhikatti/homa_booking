/**
 * MSG91 WhatsApp Business API Integration
 * Phone Number: 919632691895
 */

const MSG91_AUTH_KEY = process.env.REACT_APP_MSG91_AUTH_KEY;
const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER || '919632691895';

// MSG91 API Base URL
const MSG91_BASE_URL = 'https://control.msg91.com/api/v5/whatsapp';

/**
 * Send WhatsApp message using MSG91 Template
 * @param {string} recipientPhone - Recipient's phone number (10 digits)
 * @param {string} templateName - Approved template name from MSG91
 * @param {object} templateParams - Template parameters
 */
export const sendWhatsAppTemplate = async (recipientPhone, templateName, templateParams) => {
  try {
    // Validate Auth Key
    if (!MSG91_AUTH_KEY || MSG91_AUTH_KEY === 'your_msg91_auth_key_here') {
      console.error('MSG91 Auth Key not configured. Please add it to .env file');
      return {
        success: false,
        error: 'MSG91 Auth Key not configured'
      };
    }

    // Clean phone number (remove +91 or 91 prefix if present)
    const cleanPhone = recipientPhone.replace(/\D/g, '').replace(/^91/, '');

    // Prepare request body
    const requestBody = {
      integrated_number: WHATSAPP_NUMBER,
      content_type: 'template',
      payload: {
        to: cleanPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en',
            policy: 'deterministic'
          },
          components: [
            {
              type: 'body',
              parameters: Object.values(templateParams).map(value => ({
                type: 'text',
                text: String(value)
              }))
            }
          ]
        }
      }
    };

    console.log('Sending WhatsApp message via MSG91:', {
      to: cleanPhone,
      template: templateName
    });

    const response = await fetch(`${MSG91_BASE_URL}/whatsapp-outbound-message/`, {
      method: 'POST',
      headers: {
        'authkey': MSG91_AUTH_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('WhatsApp message sent successfully:', data);
      return {
        success: true,
        data,
        messageId: data.id
      };
    } else {
      console.error('Failed to send WhatsApp message:', data);
      return {
        success: false,
        error: data.message || 'Failed to send message'
      };
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send booking confirmation to CLIENT via WhatsApp
 * Template: booking_confirmation_client
 */
export const sendBookingConfirmationToClient = async (booking) => {
  const templateParams = {
    date: formatDate(booking.date),
    time: booking.slot || 'TBD'
  };

  return sendWhatsAppTemplate(
    booking.clientPhone,
    'booking_confirmation_client',
    templateParams
  );
};

/**
 * Send booking confirmation to PUROHIT via WhatsApp
 * Template: booking_confirmation_purohit
 */
export const sendBookingConfirmationToPurohit = async (booking) => {
  if (!booking.purohitPhone) {
    return { success: false, error: 'Purohit phone not available' };
  }

  const templateParams = {
    purohitName: booking.purohitName || 'Purohit Ji',
    clientName: booking.clientName,
    homaType: booking.homaType || 'Homa',
    date: formatDate(booking.date),
    time: booking.slot || 'TBD',
    venue: booking.venueAddress || 'To be confirmed',
    gotra: booking.gotra || 'Not specified',
    sankalpa: booking.sankalpa || 'Not specified'
  };

  return sendWhatsAppTemplate(
    booking.purohitPhone,
    'booking_confirmation_purohit',
    templateParams
  );
};

/**
 * Send booking confirmation to BOTH client and purohit
 */
export const sendBookingConfirmation = async (booking) => {
  const results = {
    client: { success: false },
    purohit: { success: false }
  };

  // Send to client
  try {
    results.client = await sendBookingConfirmationToClient(booking);
  } catch (error) {
    console.error('Error sending confirmation to client:', error);
    results.client = { success: false, error: error.message };
  }

  // Send to purohit (if assigned)
  if (booking.purohitPhone) {
    // Add small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      results.purohit = await sendBookingConfirmationToPurohit(booking);
    } catch (error) {
      console.error('Error sending confirmation to purohit:', error);
      results.purohit = { success: false, error: error.message };
    }
  }

  return {
    success: results.client.success || results.purohit.success,
    client: results.client,
    purohit: results.purohit,
    message: `Client: ${results.client.success ? '✓' : '✗'}, Purohit: ${results.purohit.success ? '✓' : '✗'}`
  };
};

/**
 * Send booking reminder to CLIENT via WhatsApp
 * Template: booking_reminder_client
 */
export const sendBookingReminderToClient = async (booking) => {
  const templateParams = {
    clientName: booking.clientName,
    homaType: booking.homaType || 'Homa',
    date: formatDate(booking.date),
    time: booking.slot || 'TBD',
    venue: booking.venueAddress || 'TBD',
    purohit: booking.purohitName || 'TBD',
    balance: booking.remainingAmount || 0
  };

  return sendWhatsAppTemplate(
    booking.clientPhone,
    'booking_reminder_client',
    templateParams
  );
};

/**
 * Send booking reminder to PUROHIT via WhatsApp
 * Template: booking_reminder_purohit
 */
export const sendBookingReminderToPurohit = async (booking) => {
  if (!booking.purohitPhone) {
    return { success: false, error: 'Purohit phone not available' };
  }

  const templateParams = {
    purohitName: booking.purohitName || 'Purohit Ji',
    clientName: booking.clientName,
    clientPhone: booking.clientPhone || 'Not provided',
    homaType: booking.homaType || 'Homa',
    date: formatDate(booking.date),
    time: booking.slot || 'TBD',
    venue: booking.venueAddress || 'To be confirmed',
    gotra: booking.gotra || 'Not specified'
  };

  return sendWhatsAppTemplate(
    booking.purohitPhone,
    'booking_reminder_purohit',
    templateParams
  );
};

/**
 * Send booking reminder to BOTH client and purohit
 */
export const sendBookingReminder = async (booking) => {
  const results = {
    client: { success: false },
    purohit: { success: false }
  };

  // Send to client
  try {
    results.client = await sendBookingReminderToClient(booking);
  } catch (error) {
    console.error('Error sending reminder to client:', error);
    results.client = { success: false, error: error.message };
  }

  // Send to purohit (if assigned)
  if (booking.purohitPhone) {
    // Add small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      results.purohit = await sendBookingReminderToPurohit(booking);
    } catch (error) {
      console.error('Error sending reminder to purohit:', error);
      results.purohit = { success: false, error: error.message };
    }
  }

  return {
    success: results.client.success || results.purohit.success,
    client: results.client,
    purohit: results.purohit,
    message: `Client: ${results.client.success ? '✓' : '✗'}, Purohit: ${results.purohit.success ? '✓' : '✗'}`
  };
};

/**
 * Send bulk WhatsApp reminders to BOTH clients and purohits
 */
export const sendBulkWhatsAppReminders = async (bookings) => {
  const results = [];

  for (const booking of bookings) {
    // Add 1 second delay between bookings to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await sendBookingReminder(booking);
    results.push({
      bookingId: booking.id,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      purohitName: booking.purohitName,
      purohitPhone: booking.purohitPhone,
      ...result
    });
  }

  return results;
};

/**
 * Fallback: Send WhatsApp via Web (opens WhatsApp in browser)
 * Use this when API is not configured or as backup
 */
export const sendWhatsAppViaWeb = (phone, message) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
};

// Helper function to format date
const formatDate = (date) => {
  if (!date) return '';
  const dateObj = date?.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'long'
  });
};

export default {
  sendWhatsAppTemplate,
  sendBookingConfirmation,
  sendBookingConfirmationToClient,
  sendBookingConfirmationToPurohit,
  sendBookingReminder,
  sendBookingReminderToClient,
  sendBookingReminderToPurohit,
  sendBulkWhatsAppReminders,
  sendWhatsAppViaWeb
};
