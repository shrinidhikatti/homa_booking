import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBy5yX8fVsdZBkacZvNg_WqbSEqJ88l9Tg",
  authDomain: "homa-booking.firebaseapp.com",
  projectId: "homa-booking",
  storageBucket: "homa-booking.firebasestorage.app",
  messagingSenderId: "881610587248",
  appId: "1:881610587248:web:8ac2593b1cc6e906e208b5",
  measurementId: "G-MMGQ5WQCW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
