import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const BOOKINGS_COLLECTION = 'bookings';
const PUROHITS_COLLECTION = 'purohits';

// Booking CRUD Operations
export const createBooking = async (bookingData) => {
  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...bookingData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...bookingData };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const updateBooking = async (bookingId, bookingData) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(bookingRef, {
      ...bookingData,
      updatedAt: Timestamp.now()
    });
    return { id: bookingId, ...bookingData };
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

export const deleteBooking = async (bookingId) => {
  try {
    await deleteDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
    return bookingId;
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};

export const getBookingById = async (bookingId) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const bookingSnap = await getDoc(bookingRef);
    if (bookingSnap.exists()) {
      return { id: bookingSnap.id, ...bookingSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting booking:', error);
    throw error;
  }
};

export const getAllBookings = async () => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
};

export const getBookingsByDate = async (date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting bookings by date:', error);
    throw error;
  }
};

export const getBookingsByMonth = async (year, month) => {
  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<=', Timestamp.fromDate(endOfMonth)),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting bookings by month:', error);
    throw error;
  }
};

export const getBookingsByPurohit = async (purohitId) => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('purohitId', '==', purohitId),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting bookings by purohit:', error);
    throw error;
  }
};

export const getBookingsByStatus = async (status) => {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('status', '==', status),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting bookings by status:', error);
    throw error;
  }
};

// Purohit CRUD Operations
export const createPurohit = async (purohitData) => {
  try {
    const docRef = await addDoc(collection(db, PUROHITS_COLLECTION), {
      ...purohitData,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...purohitData };
  } catch (error) {
    console.error('Error creating purohit:', error);
    throw error;
  }
};

export const getAllPurohits = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PUROHITS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting purohits:', error);
    throw error;
  }
};

export const updatePurohit = async (purohitId, purohitData) => {
  try {
    const purohitRef = doc(db, PUROHITS_COLLECTION, purohitId);
    await updateDoc(purohitRef, purohitData);
    return { id: purohitId, ...purohitData };
  } catch (error) {
    console.error('Error updating purohit:', error);
    throw error;
  }
};

export const deletePurohit = async (purohitId) => {
  try {
    await deleteDoc(doc(db, PUROHITS_COLLECTION, purohitId));
    return purohitId;
  } catch (error) {
    console.error('Error deleting purohit:', error);
    throw error;
  }
};

// Get upcoming bookings for reminders (bookings for tomorrow)
export const getUpcomingBookingsForReminder = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where('date', '>=', Timestamp.fromDate(tomorrow)),
      where('date', '<=', Timestamp.fromDate(dayAfter)),
      where('status', 'in', ['booked', 'pending'])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting upcoming bookings:', error);
    throw error;
  }
};
