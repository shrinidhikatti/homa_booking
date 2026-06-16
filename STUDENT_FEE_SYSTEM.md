# Student Fee & Record Management System

## Overview
A module within the Homa Booking System dashboard to manage student records and track course fee installments for Astro Vastu Shri V M Joshi classes.

---

## Student ID Format
**`AVJ-YYYY-NNN`**
- `AVJ` = Astro Vastu Joshi (brand identifier)
- `YYYY` = Enrollment year (e.g. 2026)
- `NNN` = Auto-incremented 3-digit sequence (001, 002, ...)
- Example: `AVJ-2026-001`, `AVJ-2026-042`

---

## Firestore Data Structure

### Collection: `students`
```
students/{studentId}
  ├── studentCode       string     "AVJ-2026-001"
  ├── name              string     "Rahul Sharma"
  ├── mobile            string     "9876543210"
  ├── course            string     "Astrology" | "Vastu" (from existing list)
  ├── batch             string     "Batch A 2026" (custom, staff-created)
  ├── joiningDate       timestamp
  ├── totalFee          number     15000
  ├── amountPaid        number     5000  (auto-calculated from payments)
  ├── pendingBalance    number     10000 (auto-calculated)
  ├── status            string     "active" | "completed" | "dropped"
  └── createdAt         timestamp
```

### Subcollection: `students/{studentId}/payments`
```
payments/{paymentId}
  ├── amount            number     2000
  ├── paymentDate       timestamp
  ├── paymentMode       string     "Cash" | "UPI" | "Bank Transfer"
  ├── receiptNo         string     "RCP-2026-001"
  ├── note              string     (optional)
  └── recordedAt        timestamp
```

### Collection: `batches`
```
batches/{batchId}
  ├── name              string     "Batch A 2026"
  ├── course            string     "Astrology"
  ├── startDate         timestamp
  └── createdAt         timestamp
```

---

## Receipt Number Format
**`RCP-YYYY-NNN`**
- Example: `RCP-2026-001`
- Auto-incremented globally across all students

---

## Courses (from existing Class Enquiry list)
- Astrology
- Vastu
- (any additions to existing enquiry course list apply here too)

---

## Phase Plan

### Phase 1 — Student Records + Fee Entry (Day 1–3)
- [ ] New "Students & Fees" tab in dashboard
- [ ] Add/Edit student form
- [ ] Student list with search (name or mobile)
- [ ] Batch management (create/manage custom batches)
- [ ] Payment entry form (installment-wise)
- [ ] Auto balance calculation
- [ ] Payment history per student

### Phase 2 — Dashboard + Reports (Day 4–5)
- [ ] Summary cards: Total Students, Collected, Pending, Active
- [ ] Pending fees report (filter by course/batch)
- [ ] Monthly collection report
- [ ] Export to Excel

### Phase 3 — Receipt + WhatsApp (Day 6–7)
- [ ] Auto receipt PDF generation after each payment (jsPDF)
- [ ] Receipt design matching AVJ brand (orange/saffron theme)
- [ ] WhatsApp reminder for pending installments (manual trigger)

---

## UI Placement
- New tab in existing dashboard navigation: **"Students & Fees"**
- Sub-tabs inside: Students List | Add Student | Reports | Batches
- Consistent with existing MUI component style

---

## Receipt Design (planned)
- Header: Astro Vastu Shri V M Joshi letterhead + logo
- Receipt No, Date
- Student Name, ID, Course, Batch
- Payment Amount, Mode
- Total Fee / Paid / Balance summary
- Footer: PrashanviTech credit
- Print + Download (PDF) buttons

---

## WhatsApp Reminder Template (planned)
```
Namaste {name} 🙏

This is a gentle reminder that your fee installment 
of ₹{amount} for {course} is pending.

Student ID: {studentId}
Total Fee: ₹{totalFee}
Amount Paid: ₹{amountPaid}
Pending Balance: ₹{pendingBalance}

Please contact us to clear your dues.
- Astro Vastu Shri V M Joshi
```

---

## Status
- [ ] Phase 1 — In Progress
- [ ] Phase 2 — Pending
- [ ] Phase 3 — Pending
