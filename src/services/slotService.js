import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SLOTS_COLLECTION = 'timeSlots';

// Get slots for a specific date
export const getSlotsForDate = async (date) => {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const slotRef = doc(db, SLOTS_COLLECTION, dateStr);
    const slotSnap = await getDoc(slotRef);

    if (slotSnap.exists()) {
      return slotSnap.data().slots || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting slots for date:', error);
    return [];
  }
};

// Save slots for a specific date
export const saveSlotsForDate = async (date, slots) => {
  try {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const slotRef = doc(db, SLOTS_COLLECTION, dateStr);

    await setDoc(slotRef, {
      date: dateStr,
      slots: slots,
      updatedAt: new Date().toISOString()
    });

    return slots;
  } catch (error) {
    console.error('Error saving slots for date:', error);
    throw error;
  }
};

// Get all slot definitions (for multiple dates)
export const getAllSlots = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, SLOTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      date: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all slots:', error);
    throw error;
  }
};

// Delete slots for a specific date
export const deleteSlotsForDate = async (date) => {
  try {
    const dateStr = date.toISOString().split('T')[0];
    await deleteDoc(doc(db, SLOTS_COLLECTION, dateStr));
    return dateStr;
  } catch (error) {
    console.error('Error deleting slots for date:', error);
    throw error;
  }
};
