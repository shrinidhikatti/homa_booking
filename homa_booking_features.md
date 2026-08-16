# Homa Booking — What's Already Built

Feature-by-feature breakdown of the Homa Booking system as it exists today (React frontend + Firebase Firestore + Cloud Functions backend), with pricing for each module. This is the **already-delivered, currently-unpaid** work — separate from the LMS (already quoted and paid) and separate from the new `integration.md` requirement (quoted separately).

Codebase surveyed: ~10,073 lines of frontend code across 24 components/services + a 289-line Cloud Functions backend + Firestore security rules, built over ~7 months of active development.

**Total: ₹2,50,000** *(friend rate — this is the floor of a fair market estimate, not a padded number)*

---

## 1. Booking Engine (core flagship feature)
The main Homa booking workflow — the reason the app exists.

- Interactive booking calendar with month navigation, date-wise booking view, status color-coding
- Booking form: client details, Homa type selection (including custom/multi-select Homa types), slot selection with conflict warnings
- Booking list with filtering
- Booking details view/edit
- Per-date bookings dialog (drill into a specific day)
- Slot management (admin-configurable time slots)
- Booking status pipeline

**Files:** `BookingCalendar.js`, `BookingForm.js`, `BookingList.js`, `BookingDetails.js`, `DateBookingsDialog.js`, `SlotManagement.js`, `bookingService.js`, `slotService.js`

**Hours: 90 | Price: ₹63,000**

---

## 2. Klesha Nashana Kriya Module (separate ritual booking flow)
A full second booking system for a different service line, tied to the lunar calendar.

- Amavasya (new moon) date selection, calendar-aware
- Separate client intake form (name, phone, notes)
- Payment status pipeline (pending/paid/etc.) and payment mode tracking
- Amount due / amount paid tracking
- Dedicated Excel/PDF export

**Files:** `KleshaKriyaTab.js` (801 lines), `kleshaService.js`

**Hours: 45 | Price: ₹31,500**

---

## 3. Class Enquiry Module
Lead-capture pipeline for prospective course/class students, ahead of formal admission.

- Enquiry intake form
- Enquiry list/status tracking
- Dedicated Excel/PDF export

**Files:** `ClassEnquiryTab.js`, `classEnquiryService.js`

**Hours: 15 | Price: ₹10,500**

---

## 4. Walk-in Management (multi-office)
Front-desk tool for logging walk-in clients across two physical office locations (Ramdev Galli, Airport Road), with automated WhatsApp outreach.

- Office-scoped walk-in entry (separate views per location)
- Real-time list with WhatsApp delivery status (Sent/Failed) per entry
- Manual resend action
- Two-message automated WhatsApp welcome sequence on save (via MSG91 — see backend section below)
- Incoming WhatsApp reply tracking and reply UI

**Files:** `WalkInTab.js`, `walkInService.js`

**Hours: 20 | Price: ₹14,000**

---

## 5. Student & Fees Management
Full student lifecycle from admission through payment tracking.

- Student admission form: name, mobile, course, batch, joining date, fee, status, notes
- Auto-generated Student ID (`AVJ-YYYY-NNN`, guaranteed unique per year)
- Payment recording with auto-generated receipt numbers (`RCP-YYYY-XXXXXX`)
- Running paid/pending balance calculation on every transaction
- Payment history per student, with delete/reversal handling
- Batch creation and management (linked to courses)
- Summary dashboard: total students, active students, total collected, total pending, students with dues
- Search by name/mobile/ID

**Files:** `StudentFeeTab.js` (1,013 lines), `studentFeeService.js`

**Hours: 55 | Price: ₹38,500**

---

## 6. Reports & Exports
Reporting layer spanning every module, with real Excel and PDF generation (not just on-screen tables).

- Purohit (priest) payment report
- General bookings report with filtering
- 9 distinct export functions: bookings (Excel/PDF), monthly report (Excel/PDF), Klesha bookings (Excel/PDF), class enquiries (Excel/PDF), single booking detail PDF
- Role-aware export content (admin vs. staff views)

**Files:** `Reports.js`, `PurohitPaymentReport.js`, `exportUtils.js` (453 lines)

**Hours: 35 | Price: ₹24,500**

---

## 7. WhatsApp Business Integration (MSG91) — backend
This is real backend/integration engineering, not UI — a Firebase Cloud Functions service talking to a third-party WhatsApp Business API.

- Outbound message sending via MSG91 templates (confirmation, reminder, walk-in welcome — 2-message sequenced flow)
- Free-form session-window messaging (24hr reply window handling)
- Inbound webhook receiver — parses incoming WhatsApp replies, links them back to the originating walk-in record
- Scheduled daily reminder job (runs automatically every morning for next-day bookings)
- Config stored in Firestore (auth key, WhatsApp number) with in-memory caching, admin-editable without redeploy
- Graceful fallback to WhatsApp Web link-out when API isn't configured/available

**Files:** `functions/index.js`, `msg91Service.js`, `notificationService.js`

**Hours: 40 | Price: ₹28,000**

---

## 8. Panchanga Service (astrological calculation engine)
Niche domain logic — computing Hindu calendar data for booking-relevant dates.

- Panchanga calculation for any date/location
- Auspicious-day detection
- Special-day (festival/Amavasya etc.) detection
- Short-form panchanga for calendar display

**Files:** `panchangaService.js`

**Hours: 20 | Price: ₹14,000**

---

## 9. Auth, Dashboard & Navigation
The shell that ties every module together.

- Login/authentication
- Multi-tab dashboard (Klesha, Class Enquiries, Walk-in ×2 offices, Students & Fees)
- Office-scoped navigation and data filtering
- Settings service (admin-editable app config, e.g. WhatsApp credentials)

**Files:** `Dashboard.js` (1,083 lines), `Login.js`, `settingsService.js`, `App.js`

**Hours: 25 | Price: ₹17,500**

---

## 10. Firebase Infrastructure & Deployment
Not a visible "feature," but required foundation work.

- Firestore data model design across 6+ collections
- Firestore security rules
- Firebase Hosting + Cloud Functions deployment configuration
- Service worker / PWA setup

**Files:** `firestore.rules`, `firebase.json`, `config/firebase.js`, `service-worker.js`

**Hours: 12 | Price: ₹8,500**

---

## Summary

| # | Module | Hours | Price |
|---|---|---:|---:|
| 1 | Booking Engine | 90 | ₹63,000 |
| 2 | Klesha Nashana Kriya Module | 45 | ₹31,500 |
| 3 | Class Enquiry Module | 15 | ₹10,500 |
| 4 | Walk-in Management (multi-office) | 20 | ₹14,000 |
| 5 | Student & Fees Management | 55 | ₹38,500 |
| 6 | Reports & Exports | 35 | ₹24,500 |
| 7 | WhatsApp Integration (MSG91 backend) | 40 | ₹28,000 |
| 8 | Panchanga Service | 20 | ₹14,000 |
| 9 | Auth, Dashboard & Navigation | 25 | ₹17,500 |
| 10 | Firebase Infrastructure & Deployment | 12 | ₹8,500 |
| | **Total** | **357** | **₹2,50,000** |

*Excludes: the LMS (already quoted at ₹1,00,000 and paid), and the new Student/Course Management integration scoped separately in `integration.md`.*
