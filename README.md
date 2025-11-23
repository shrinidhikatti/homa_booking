# Homa & Havana Booking System

A comprehensive booking management system for religious ceremonies (Homas and Havanas) built with React and Firebase.

## Features

- **Calendar View**: Visual calendar with booking slots
- **Multiple Slots per Day**: Morning, Midday, and Evening slots
- **Booking Management**: Create, edit, delete, and track bookings
- **Client Management**: Store client name, phone, gotra, sankalpa details
- **Payment Tracking**: Total amount, advance payment, and balance calculation
- **Purohit Assignment**: Assign purohits to bookings
- **Status Tracking**: Pending, Booked, Completed, Cancelled
- **Monthly Reports**: Analytics with charts and purohit-wise breakdown
- **Export**: Excel and PDF export functionality
- **WhatsApp Integration**: Send reminders and confirmations via WhatsApp

## Tech Stack

- **Frontend**: React 18, Material-UI
- **Backend**: Firebase (Firestore)
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Export**: jsPDF, xlsx

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable Firestore Database:
   - Go to Build > Firestore Database
   - Create database in test mode (for development)
4. Get your config:
   - Go to Project Settings > Your Apps
   - Click "Add app" > Web
   - Copy the config object

### 3. Configure the App

1. Open `src/config/firebase.js`
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Install Dependencies

```bash
cd homa_booking
npm install
```

### 5. Run Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

### 6. Build for Production

```bash
npm run build
```

This creates a `build` folder with static files.

## Deploying to HostGator

1. Run `npm run build`
2. Connect to HostGator via FTP (FileZilla) or cPanel File Manager
3. Navigate to `public_html` folder
4. Create a folder: `homa-booking` (or your preferred name)
5. Upload all contents of the `build` folder
6. Access at: `yourdomain.com/homa-booking`

## Database Structure

### Bookings Collection
```javascript
{
  clientName: string,
  clientPhone: string,
  homaTypeId: string,
  homaType: string,
  date: timestamp,
  slot: string,
  totalAmount: number,
  advanceAmount: number,
  remainingAmount: number,
  purohitId: string,
  purohitName: string,
  status: 'pending' | 'booked' | 'completed' | 'cancelled',
  gotra: string,
  sankalpa: string,
  venueAddress: string,
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Purohits Collection
```javascript
{
  name: string,
  phone: string,
  createdAt: timestamp
}
```

## Customization

### Add/Modify Homa Types

Edit `src/config/constants.js`:

```javascript
export const HOMA_TYPES = [
  { id: 'ganapathi', name: 'Ganapathi Homa', price: 5000 },
  // Add more types...
];
```

### Modify Time Slots

```javascript
export const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (6:00 AM - 10:00 AM)', time: '06:00' },
  // Modify as needed...
];
```

### Change Booking Date Range

```javascript
export const BOOKING_START_DATE = new Date('2025-12-01');
export const BOOKING_END_DATE = new Date('2026-12-31');
```

## WhatsApp/SMS Reminders

### Manual WhatsApp
The app opens WhatsApp Web/App with pre-filled messages. Works out of the box.

### Automated SMS (Twilio)
For automated reminders, you need:
1. Twilio account
2. Firebase Cloud Functions

See `src/services/notificationService.js` for the Cloud Function template.

## Security

For production, update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

And add Firebase Authentication to the app.

## Support

For issues and feature requests, please contact the development team.

## License

Private - All rights reserved
