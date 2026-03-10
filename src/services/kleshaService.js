import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const KLESHA_COLLECTION = 'kleshaBookings';

export const createKleshaBooking = async (bookingData) => {
  try {
    const docRef = await addDoc(collection(db, KLESHA_COLLECTION), {
      ...bookingData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...bookingData };
  } catch (error) {
    console.error('Error creating Klesha booking:', error);
    throw error;
  }
};

export const updateKleshaBooking = async (id, bookingData) => {
  try {
    const ref = doc(db, KLESHA_COLLECTION, id);
    await updateDoc(ref, {
      ...bookingData,
      updatedAt: Timestamp.now()
    });
    return { id, ...bookingData };
  } catch (error) {
    console.error('Error updating Klesha booking:', error);
    throw error;
  }
};

export const deleteKleshaBooking = async (id) => {
  try {
    await deleteDoc(doc(db, KLESHA_COLLECTION, id));
    return id;
  } catch (error) {
    console.error('Error deleting Klesha booking:', error);
    throw error;
  }
};

export const getAllKleshaBookings = async () => {
  try {
    const q = query(
      collection(db, KLESHA_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching Klesha bookings:', error);
    throw error;
  }
};
