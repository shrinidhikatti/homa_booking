# MSG91 WhatsApp Integration Setup Guide

## 📱 WhatsApp Number: 919632691895

---

## ✅ Step 1: Get Your MSG91 Auth Key

1. **Login to MSG91**: https://control.msg91.com/
2. **Navigate to Settings**:
   - Click on your profile icon (top right)
   - Go to "API" or "Developer Options"
   - Find your **Auth Key** (looks like: `123456ABCDxxxxxx`)
3. **Copy the Auth Key**

---

## ✅ Step 2: Configure Environment Variables

1. Open the `.env` file in the project root
2. Replace `your_msg91_auth_key_here` with your actual Auth Key:

```env
REACT_APP_MSG91_AUTH_KEY=YOUR_ACTUAL_AUTH_KEY_HERE
REACT_APP_WHATSAPP_NUMBER=919632691895
```

3. **Save the file**

---

## ✅ Step 3: Create WhatsApp Message Templates

**IMPORTANT**: You need to create **4 templates** (not 2) - messages will be sent to BOTH client AND purohit.

WhatsApp requires pre-approved templates for automated messages. See `WHATSAPP_TEMPLATES.md` for complete template text.

**4 Templates Required:**

1. **`booking_confirmation_client`** - Sent to client when booking confirmed (2 variables)
2. **`booking_confirmation_purohit`** - Sent to purohit when booking confirmed (8 variables)
3. **`booking_reminder_client`** - Sent to client 1 day before (7 variables)
4. **`booking_reminder_purohit`** - Sent to purohit 1 day before (8 variables)

**📄 Complete template text available in: `WHATSAPP_TEMPLATES.md`**

**Go to**: MSG91 Dashboard → WhatsApp → Templates → Create Template → Copy templates from `WHATSAPP_TEMPLATES.md`

---

## ✅ Step 4: Wait for Template Approval

- **Approval Time**: 24-48 hours
- **Status Check**: MSG91 Dashboard → WhatsApp → Templates
- **All 4 templates must be approved** before the system can send messages
- You'll receive email/SMS notification when approved

---

## ✅ Step 5: Install Dependencies & Run

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm start
```

---

## 🚀 How It Works

### **Automatic WhatsApp Sending:**

1. **When creating a new booking** with status "Booked":
   - System automatically sends **TWO** confirmations via MSG91 API:
     - One to CLIENT using `booking_confirmation_client` template
     - One to assigned PUROHIT using `booking_confirmation_purohit` template
   - Both receive WhatsApp messages instantly

2. **When updating booking** to "Booked" status:
   - Confirmation messages sent to BOTH client and purohit automatically

3. **Bulk Reminders** (for tomorrow's bookings):
   - Click the 🔔 Notifications icon in the dashboard
   - System sends reminders to all bookings scheduled for tomorrow
   - **TWO messages per booking**:
     - One to CLIENT using `booking_reminder_client` template
     - One to PUROHIT using `booking_reminder_purohit` template
   - Shows success/failure count for both

### **Fallback Mode:**

If MSG91 API is not configured or fails:
- System automatically falls back to **WhatsApp Web**
- Opens WhatsApp with pre-filled message
- You manually click "Send"

---

## 🧪 Testing the Integration

### Test 1: Check Configuration
```javascript
// Open browser console (F12) and run:
console.log('Auth Key configured:', process.env.REACT_APP_MSG91_AUTH_KEY ? 'Yes' : 'No');
```

### Test 2: Send Test Confirmation
1. Create a new booking with your own phone number as client
2. Assign a purohit (use real purohit phone number for testing)
3. Set status to "Booked"
4. **Expected**: You receive client confirmation AND purohit receives purohit confirmation

### Test 3: Bulk Reminders
1. Create a booking for tomorrow
2. Assign a purohit
3. Click the 🔔 Notifications icon
4. **Expected**: Both client and purohit receive reminder messages
5. Check dashboard message: "Reminders sent to clients & purohits: 2 successful, 0 failed"

---

## 🔍 Troubleshooting

### ❌ "MSG91 Auth Key not configured"
**Solution**: Make sure you've added the Auth Key to `.env` file and restarted the server

### ❌ Templates not found
**Solution**:
- Check if templates are approved in MSG91 dashboard
- Verify template names match exactly: `booking_confirmation`, `booking_reminder`

### ❌ Messages not sending
**Solution**:
- Check browser console for error messages
- Verify WhatsApp number is active in MSG91
- Check MSG91 balance (prepaid)
- Verify phone numbers are in correct format (10 digits without +91)

### ❌ CORS errors
**Solution**: MSG91 API should work from frontend, but if you get CORS errors:
- Consider using Firebase Cloud Functions (backend)
- Or use the WhatsApp Web fallback

---

## 💰 Pricing

**MSG91 Costs:**
- **Subscription**: ₹500/month (after 2-month free trial)
- **Per Message**: ~₹0.25 - ₹1.00 per message (varies by volume)
- **Recommended**: Add prepaid balance to avoid interruptions

**Cost Estimation:**
- 100 bookings/month = ~₹500 + (100 × 2 messages × ₹0.50) = ₹600/month
- 200 bookings/month = ~₹500 + (200 × 2 messages × ₹0.50) = ₹700/month

---

## 📊 MSG91 Dashboard

**Monitor your usage:**
- Login: https://control.msg91.com/
- View sent messages: WhatsApp → Reports
- Check delivery status
- Monitor balance
- Download reports

---

## 🔐 Security Notes

**IMPORTANT:**
- ✅ `.env` file is in `.gitignore` (already configured)
- ✅ Never commit `.env` to GitHub
- ✅ Auth Key is hidden from users (server-side only)
- ⚠️ For production, consider Firebase Cloud Functions for better security

---

## 🆘 Support

**MSG91 Support:**
- Email: support@msg91.com
- Phone: +91-9650790790
- Docs: https://docs.msg91.com/

**Technical Issues:**
- Check browser console for errors
- Review MSG91 API logs
- Test with MSG91 API explorer

---

## ✨ Success Indicators

You'll know it's working when:
- ✅ No console errors when creating bookings
- ✅ WhatsApp messages arrive within 5-10 seconds
- ✅ Snackbar shows "Confirmation sent via WhatsApp API"
- ✅ MSG91 dashboard shows message delivery status
- ✅ Bulk reminders show success count

---

## 🎯 Next Steps

After setup is complete:
1. Test with your own number first
2. Create bookings for real clients
3. Monitor delivery rates in MSG91
4. Set up auto-recharge for prepaid balance
5. Review monthly reports

---

**Need Help?** Contact your developer or MSG91 support team.

**Happy Booking! 🙏**
