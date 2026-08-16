# Simple Student & Course Linking — Manual Bridge Model

An alternative to `integration.md`. Instead of automating the connection between Homa Booking and the Frappe LMS (API sync, custom link fields, scheduled jobs), this model uses a person — Vishal — to bridge the two systems with a couple of minutes of manual work per student. Far less to build, far less to break.

---

## The workflow

```
Student pays
        ↓
Vishal adds the student in Homa Booking
   (name, email, mobile, course, batch — form already exists today)
        ↓
Vishal manually creates the matching login in Frappe LMS
   using the SAME EMAIL (Frappe's own "Add User" screen — 2 minutes, no code)
        ↓
Vishal ticks "LMS Account Created" in Homa Booking
        ↓
Homa Booking auto-sends a WhatsApp welcome message with login instructions
   (existing MSG91 integration, one new template)
        ↓
Done. No further sync between the two systems.
```

When staff need to check a student's course progress, quiz results, or certificate status, they open Frappe LMS directly and search by the student's email. Nothing is mirrored back into Homa Booking.

---

## What connects the two systems
**Email address only.** The same email is used as the student's identity in both Homa Booking and Frappe LMS. No custom Student ID field needs to be added to Frappe, no API key exchange, no integration code.

---

## What gets built (small, in Homa Booking only)

| Item | Where | Notes |
|---|---|---|
| `lmsAccountCreated` checkbox | `students/{id}` in Firestore | Manually ticked by Vishal after he creates the Frappe login |
| "LMS Login" quick-reference | Master Student Profile | Just displays the student's email, so staff know what to search for in Frappe |
| New WhatsApp template | MSG91 | "Your LMS login is ready — here's how to access your course" |
| Simple dashboard filter | Students & Fees tab | "LMS Account Pending" list — students who paid but Vishal hasn't created their login yet, so nobody gets missed |

That's the entire build. No Cloud Function triggers, no Frappe REST API client, no scheduled sync job, no custom fields in Frappe.

---

## What this deliberately skips (compared to `integration.md`)
- ❌ Automatic account provisioning on payment
- ❌ Automatic course/batch enrollment via API
- ❌ Progress/quiz/certificate sync back into Homa Booking
- ❌ Frappe API key management
- ❌ Custom `student_code` field on Frappe User

All of these can be added later if the manual process starts to hurt — but they're not needed to get a working, usable system today.

---

## The trade-off, honestly
- **Cost to you:** Vishal spends ~2 minutes per student creating the Frappe login manually. If he forgets, the "LMS Account Pending" filter catches it — but it does rely on someone actually doing this step.
- **What you save:** essentially all of Phase 2's engineering from `integration.md` (API client, triggers, sync jobs), most of Phase 4/5's "sync progress back" work, and the risk of two systems silently drifting out of sync when an API integration breaks quietly in the background.
- **When to reconsider:** if student volume grows large enough that manual account creation becomes a real bottleneck (e.g. dozens of admissions a day), it's worth revisiting the automated version — but for a training institute's typical admission volume, manual is very likely the better trade for a long time.

---

## Estimated cost & timeline
| Item | Hours | Price |
|---|---:|---:|
| `lmsAccountCreated` field + LMS Login display on profile | 6 | ₹4,500 |
| "LMS Account Pending" filter/list | 4 | ₹3,000 |
| New WhatsApp template (design + MSG91 approval submission) | 3 | ₹2,000 |
| **Total** | **13** | **₹9,500** |

**Timeline: 2–3 days**, plus MSG91's external template-approval lead time (typically a few days, doesn't block other work).

Compare to `integration.md` Phase 2 alone: ₹70,000–₹1,20,000 and 2–4 weeks. This simple model gets students into the LMS just as reliably, for a fraction of the cost — the only difference is a human does the account-linking instead of an API.
