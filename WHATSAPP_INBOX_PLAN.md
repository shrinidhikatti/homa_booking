# WhatsApp Inbox & Reply Feature — Implementation Plan

## Overview

Build a mini WhatsApp inbox inside the Walk-in Entry tabs.
When a customer replies to the WhatsApp message sent during walk-in entry,
the reply is captured, stored, and staff can reply back — all from within the app.

---

## User Flow

```
1. Staff creates walk-in entry
         ↓
2. App sends walkinfirst + walkinsecond templates to customer
         ↓
3. Customer receives message and replies "Thank you" / any message
         ↓
4. MSG91 receives the reply and sends it to our webhook URL
         ↓
5. Firebase Cloud Function (webhook) receives the message
         ↓
6. Stores message in Firestore → incomingMessages collection
         ↓
7. Walk-in entry row updates: Action chip changes to "Reply Received" (green)
         ↓
8. Staff clicks "Reply Received" chip → Dialog opens
         ↓
9. Dialog shows: customer's message + text box to type reply + Send button
         ↓
10. Staff types reply → clicks Send → MSG91 sends free-form text to customer
         ↓
11. Dialog closes, chip changes to "Replied" (blue)
```

---

## Why This Works

- Customer replied to us = **24-hour session is open** on WhatsApp
- Within this session, we can send **free-form text** (no template needed)
- So the reply from staff goes through instantly without any template approval

---

## Part 1 — Firebase Cloud Function (Webhook)

**File:** `functions/index.js`
**New function:** `exports.receiveWhatsApp`

### What it does:
- Exposes a public HTTP endpoint: `https://us-central1-PROJECT.cloudfunctions.net/receiveWhatsApp`
- MSG91 calls this URL every time a customer sends a WhatsApp message
- Function extracts: sender phone, message text, timestamp
- Looks up walk-in entry in Firestore by phone number
- Stores message in `incomingMessages` collection
- Updates walk-in entry `whatsappStatus` to `'replyReceived'`

### MSG91 Webhook Payload (what MSG91 sends us):
```json
{
  "from": "919XXXXXXXXX",
  "to": "919632691895",
  "text": "Thank you",
  "type": "text",
  "timestamp": "2024-01-01T10:00:00Z",
  "messageId": "abc123"
}
```

### Firestore — `incomingMessages` collection:
```
incomingMessages/
  {docId}/
    from: "9XXXXXXXXX"          ← cleaned phone (no country code)
    fromRaw: "919XXXXXXXXX"     ← as received from MSG91
    text: "Thank you"
    receivedAt: Timestamp
    walkInId: "abc123"          ← linked walk-in entry ID (if found)
    replied: false
    replyText: ""
    repliedAt: null
```

### Logic:
```javascript
exports.receiveWhatsApp = functions.https.onRequest(async (req, res) => {
  const { from, text, type } = req.body;
  if (type !== 'text') return res.status(200).send('OK'); // ignore non-text

  const cleanPhone = from.replace(/^91/, '').replace(/\D/g, '');

  // Find most recent walk-in entry with this phone
  const walkInSnap = await firestore
    .collection('walkIns')
    .where('mobileNumber', '==', cleanPhone)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  const walkInId = walkInSnap.empty ? null : walkInSnap.docs[0].id;

  // Store incoming message
  await firestore.collection('incomingMessages').add({
    from: cleanPhone,
    fromRaw: from,
    text,
    receivedAt: admin.firestore.Timestamp.now(),
    walkInId,
    replied: false,
    replyText: '',
    repliedAt: null
  });

  // Update walk-in status
  if (walkInId) {
    await firestore.doc(`walkIns/${walkInId}`).update({
      whatsappStatus: 'replyReceived',
      lastReplyText: text,
      lastReplyAt: admin.firestore.Timestamp.now()
    });
  }

  res.status(200).send('OK');
});
```

---

## Part 2 — MSG91 Webhook Configuration

### Steps (done manually in MSG91 dashboard):
1. Go to MSG91 → WhatsApp → **Webhook** (left sidebar)
2. Paste the Firebase Function URL:
   `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/receiveWhatsApp`
3. Save

### Note:
- MSG91 will send a test ping to verify the URL — our function responds with 200 OK
- All incoming WhatsApp replies to `919632691895` will be forwarded here

---

## Part 3 — Firestore Service Update

**File:** `src/services/walkInService.js`

### New functions:
```javascript
// Get incoming message for a walk-in entry
export const getIncomingMessage = async (walkInId) => {
  const q = query(
    collection(db, 'incomingMessages'),
    where('walkInId', '==', walkInId),
    orderBy('receivedAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
};

// Mark message as replied
export const markAsReplied = async (messageId, replyText) => {
  await updateDoc(doc(db, 'incomingMessages', messageId), {
    replied: true,
    replyText,
    repliedAt: Timestamp.now()
  });
};
```

---

## Part 4 — msg91Service Update

**File:** `src/services/msg91Service.js`

### New function:
```javascript
// Send free-form reply (works within 24hr session after customer replied)
export const sendWhatsAppReply = async (phone, message) => {
  const sendWhatsApp = httpsCallable(functions, 'sendWhatsApp');
  return sendWhatsApp({ phone, message, type: 'freeform' });
};
```

### Cloud Function update (`functions/index.js`):
The existing `else if (message)` branch already handles free-form text — no change needed.

---

## Part 5 — WalkInTab UI Changes

**File:** `src/components/WalkInTab.js`

### Status chip changes:
| Status | Chip Color | Label |
|--------|-----------|-------|
| `pending` | Grey | Pending |
| `sent` | Orange | Sent |
| `failed` | Red | Failed |
| `replyReceived` | Green | Reply Received ← NEW |
| `replied` | Blue | Replied ← NEW |

### New "Reply Received" chip behavior:
- Chip is **clickable** when status is `replyReceived`
- Clicking opens **ReplyDialog**

### ReplyDialog component (inside WalkInTab.js):
```
┌─────────────────────────────────────────┐
│  Reply to: Ramesh Kumar  (+91 9XXXXXXXX) │
├─────────────────────────────────────────┤
│  📩 Customer's Message:                 │
│  ┌─────────────────────────────────┐   │
│  │ "Thank you, what time should    │   │
│  │  I come tomorrow?"              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✏️ Your Reply:                         │
│  ┌─────────────────────────────────┐   │
│  │ Type your reply here...         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Cancel]              [Send Reply →]  │
└─────────────────────────────────────────┘
```

### Real-time update:
- Use Firestore `onSnapshot` on the walk-in entries so "Reply Received" chip appears **automatically** without page refresh when customer replies

---

## Part 6 — Real-time Listener

**File:** `src/services/walkInService.js`

### New function:
```javascript
// Real-time listener for walk-in entries
export const subscribeWalkIns = (office, callback) => {
  const q = query(collection(db, 'walkIns'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // filter by office same as getWalkIns
    callback(filtered);
  });
};
```

Switch `WalkInTab` from `getDocs` (one-time fetch) to `onSnapshot` (live updates).

---

## Files to Create/Modify

| File | Action | What changes |
|------|--------|-------------|
| `functions/index.js` | Modify | Add `receiveWhatsApp` webhook function |
| `src/services/walkInService.js` | Modify | Add `getIncomingMessage`, `markAsReplied`, `subscribeWalkIns` |
| `src/services/msg91Service.js` | Modify | Add `sendWhatsAppReply` |
| `src/components/WalkInTab.js` | Modify | Add Reply Received chip, ReplyDialog, real-time listener |

---

## Firestore Collections

### Existing (modified):
```
walkIns/{id}
  + whatsappStatus: 'replyReceived' | 'replied'  ← new values
  + lastReplyText: string                          ← new field
  + lastReplyAt: Timestamp                         ← new field
```

### New:
```
incomingMessages/{id}
  from: string
  fromRaw: string
  text: string
  receivedAt: Timestamp
  walkInId: string | null
  replied: boolean
  replyText: string
  repliedAt: Timestamp | null
```

---

## Firestore Security Rules

Add rule for `incomingMessages`:
```
match /incomingMessages/{id} {
  allow read, write: if true; // Cloud Function writes, app reads
}
```

---

## Deployment Steps

1. Deploy updated Firebase Functions:
   ```
   firebase deploy --only functions
   ```
2. Copy the `receiveWhatsApp` function URL from Firebase Console
3. Paste URL in MSG91 → WhatsApp → Webhook
4. Test: send a WhatsApp message to `919632691895` from any phone
5. Check Firestore `incomingMessages` collection for the entry
6. Check walk-in entry — status should change to "Reply Received"

---

## Total Effort Estimate

| Part | Complexity |
|------|-----------|
| Firebase webhook function | Simple |
| Firestore service updates | Simple |
| msg91Service update | Trivial |
| WalkInTab UI (chip + dialog) | Medium |
| Real-time listener | Simple |

Ready to code on your confirmation.
