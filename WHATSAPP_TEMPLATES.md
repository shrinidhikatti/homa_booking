# 📱 WhatsApp Message Templates for MSG91

## Overview
You need to create **4 templates** in MSG91 dashboard:
1. **booking_confirmation_client** - Sent to client when booking is confirmed
2. **booking_confirmation_purohit** - Sent to assigned purohit when booking is confirmed
3. **booking_reminder_client** - Sent to client 1 day before homa
4. **booking_reminder_purohit** - Sent to purohit 1 day before homa

---

## 🔵 Template 1: Booking Confirmation for CLIENT

### Template Details
- **Template Name**: `booking_confirmation_client`
- **Category**: `TRANSACTIONAL`
- **Language**: `English`
- **Number of Variables**: 2

### Message Body
```
🙏 Namaste,

Your Homa has been successfully booked as per the auspicious muhurta.

🗓 Date: {{1}}
⏰ Time: {{2}}
📍 Location: https://g.co/kgs/fn1nFkG

All required pooja samagri and Vedic arrangements will be taken care of by our team as per Shastra vidhi.

For any clarification or assistance, please feel free to contact us:
📞 9590033894

With divine blessings,
🌿 Shri V. M. Joshi Vastu & Astrologer
✨ Authentic Vedic Rituals | Astrology | Vastu Shastra
🌐 astrovastushrivmjoshi.com
```

### Variables
- `{{1}}` = Date (e.g., "15 Feb 2026 (Monday)")
- `{{2}}` = Time Slot (e.g., "09:00 AM - 11:00 AM")

---

## 🟢 Template 2: Booking Confirmation for PUROHIT

### Template Details
- **Template Name**: `booking_confirmation_purohit`
- **Category**: `TRANSACTIONAL`
- **Language**: `English`
- **Number of Variables**: 7

### Message Body
```
Namaste {{1}},

A new Homa has been assigned to you:

👤 Client: {{2}}
📿 Homa Type: {{3}}
📅 Date: {{4}}
⏰ Time: {{5}}
📍 Venue: {{6}}

🕉️ Gotra: {{7}}
🙏 Sankalpa: {{8}}

Please confirm your availability and arrive 30 minutes before the scheduled time.

For any queries, contact:
📞 9590033894

Thank you,
Shri V. M. Joshi Vastu & Astrologer
```

### Variables
- `{{1}}` = Purohit Name (e.g., "Vikas Joshi")
- `{{2}}` = Client Name (e.g., "Ramesh Kumar")
- `{{3}}` = Homa Type (e.g., "MANGAL SHANTI")
- `{{4}}` = Date (e.g., "15 Feb 2026 (Monday)")
- `{{5}}` = Time Slot (e.g., "09:00 AM - 11:00 AM")
- `{{6}}` = Venue Address (e.g., "123, MG Road, Bangalore")
- `{{7}}` = Gotra (e.g., "Bharadwaja")
- `{{8}}` = Sankalpa (e.g., "LAXMI KUBER SANKALPA")

---

## 🔴 Template 3: Booking Reminder for CLIENT

### Template Details
- **Template Name**: `booking_reminder_client`
- **Category**: `TRANSACTIONAL`
- **Language**: `English`
- **Number of Variables**: 7

### Message Body
```
Namaste {{1}}!

This is a reminder for your {{2}} scheduled for:

📅 Date: {{3}}
⏰ Time: {{4}}
📍 Venue: {{5}}
🙏 Purohit: {{6}}

💰 Balance Due: ₹{{7}}

Please be ready on time. Keep the following items ready:
✓ Coconut, flowers, fruits
✓ New clothes for deity
✓ Dakshina for purohit

Please arrange your time accordingly.

Contact us for any queries:
📞 9590033894

Thank you!
Shri V. M. Joshi Vastu & Astrologer
```

### Variables
- `{{1}}` = Client Name
- `{{2}}` = Homa Type
- `{{3}}` = Date
- `{{4}}` = Time Slot
- `{{5}}` = Venue Address
- `{{6}}` = Purohit Name
- `{{7}}` = Balance Amount (e.g., "5000")

---

## 🟡 Template 4: Booking Reminder for PUROHIT

### Template Details
- **Template Name**: `booking_reminder_purohit`
- **Category**: `TRANSACTIONAL`
- **Language**: `English`
- **Number of Variables**: 8

### Message Body
```
Namaste {{1}},

This is a reminder for tomorrow's Homa:

👤 Client: {{2}}
📞 Client Phone: {{3}}
📿 Homa Type: {{4}}
📅 Date: {{5}}
⏰ Time: {{6}}
📍 Venue: {{7}}

🕉️ Gotra: {{8}}

Please arrive 30 minutes before the scheduled time with all required materials.

Contact client if needed: {{3}}

For any queries:
📞 9590033894

Thank you,
Shri V. M. Joshi Vastu & Astrologer
```

### Variables
- `{{1}}` = Purohit Name
- `{{2}}` = Client Name
- `{{3}}` = Client Phone
- `{{4}}` = Homa Type
- `{{5}}` = Date
- `{{6}}` = Time Slot
- `{{7}}` = Venue Address
- `{{8}}` = Gotra

---

## 📝 How to Create Templates in MSG91

### Step-by-Step Guide

1. **Login to MSG91 Dashboard**
   - Go to https://control.msg91.com/
   - Login with your credentials

2. **Navigate to Templates**
   - Click on **WhatsApp** in the left sidebar
   - Click on **Templates**
   - Click **Create Template** button

3. **Fill Template Details**
   - **Template Name**: Copy from above (e.g., `booking_confirmation_client`)
   - **Category**: Select `TRANSACTIONAL`
   - **Language**: Select `English`

4. **Add Message Body**
   - Copy the message text from above
   - Variables are automatically detected as `{{1}}`, `{{2}}`, etc.
   - Make sure variable numbers match exactly

5. **Submit for Approval**
   - Click **Submit**
   - Template will be sent to Meta/WhatsApp for approval
   - You'll get email notification when approved

6. **Repeat for All 4 Templates**
   - Create all 4 templates following the same process

---

## ⏱️ Template Approval Timeline

- **Submission**: Instant
- **Under Review**: 2-6 hours (usually)
- **Approval**: 24-48 hours (max)
- **Status**: Check in MSG91 Dashboard → WhatsApp → Templates

---

## ✅ Checklist

Before going live, ensure:

- [ ] All 4 templates created in MSG91
- [ ] Template names match exactly (case-sensitive)
- [ ] All templates show status "APPROVED"
- [ ] Variables count matches (check {{1}}, {{2}}, etc.)
- [ ] Auth Key added to `.env` file
- [ ] Server restarted after adding Auth Key

---

## 🧪 Testing

After templates are approved:

### Test 1: Create New Booking
1. Create a booking with your phone number
2. Assign a purohit (use purohit's real number for testing)
3. Set status to "Booked"
4. **Expected**: Both you and purohit receive confirmation messages

### Test 2: Update Booking Status
1. Edit an existing booking
2. Change status from "Pending" to "Booked"
3. **Expected**: Both receive confirmation messages

### Test 3: Daily Reminders
1. Create a booking for tomorrow
2. Assign a purohit
3. Click 🔔 Notifications icon in dashboard
4. **Expected**: Both receive reminder messages

---

## 🔍 Troubleshooting

### Template Not Found Error
**Problem**: "Template 'booking_confirmation_client' not found"
**Solution**:
- Template not yet approved
- Check MSG91 dashboard for approval status
- Wait for Meta approval (up to 48 hours)

### Wrong Variable Count
**Problem**: "Expected 7 variables but got 5"
**Solution**:
- Recheck template message body
- Count {{1}}, {{2}}, etc.
- Make sure all variables are present

### Template Rejected
**Problem**: Template rejected by Meta
**Solution**:
- Read rejection reason in MSG91 dashboard
- Common issues:
  - Marketing content in transactional template
  - Missing important info
  - Too promotional
- Edit and resubmit

---

## 💡 Tips

1. **Variable Formatting**
   - Always use `{{1}}`, `{{2}}` format
   - No spaces: ❌ `{{ 1 }}` ✅ `{{1}}`
   - Numbers must be sequential: ✅ {{1}}, {{2}}, {{3}}

2. **Message Length**
   - Keep under 1024 characters
   - Current templates are optimized

3. **Emojis**
   - ✅ Emojis are allowed
   - Adds visual appeal
   - Makes messages more engaging

4. **URL Shortening**
   - Long URLs are fine
   - MSG91 may auto-shorten
   - Test with real URLs

---

## 📊 Expected Message Flow

### Scenario 1: New Booking Created
```
Admin creates booking
    ↓
Status set to "Booked"
    ↓
System sends 2 messages:
    1. Client receives: booking_confirmation_client
    2. Purohit receives: booking_confirmation_purohit
```

### Scenario 2: Daily Reminder (Automatic)
```
Daily at 9 AM (or manual click)
    ↓
System checks bookings for tomorrow
    ↓
For each booking, sends 2 messages:
    1. Client receives: booking_reminder_client
    2. Purohit receives: booking_reminder_purohit
```

---

## 🎯 Success Criteria

You'll know templates are working when:

✅ All 4 templates show "APPROVED" status
✅ Creating a booking sends messages to both parties
✅ Reminders send to both client and purohit
✅ Dashboard shows: "Confirmation sent - Client: ✓, Purohit: ✓"
✅ MSG91 dashboard shows delivery reports

---

## 📞 Support

**MSG91 Template Support:**
- Email: support@msg91.com
- Phone: +91-9650790790
- Docs: https://docs.msg91.com/p/tf9GTextMe1/e/iyYaw4pNH/MSG91

**Template Not Approved?**
- Check spam/promotions folder for email
- Login to MSG91 → Templates → Check status
- Wait full 48 hours before contacting support

---

## 🚀 Next Steps

After creating templates:

1. **Wait for Approval** (24-48 hours)
2. **Test with Your Numbers**
3. **Go Live with Real Clients**
4. **Monitor Delivery in MSG91 Dashboard**

---

**Need Help?** Refer to `MSG91_SETUP_GUIDE.md` for complete integration guide.

**Good Luck! 🙏**
