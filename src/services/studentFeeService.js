import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, getDoc, query, orderBy, where, Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const STUDENTS = 'students';
const BATCHES  = 'studentBatches';

// ── Student ID: AVJ-YYYY-NNN ──────────────────────────────────────────────────
const generateStudentCode = async () => {
  const year = new Date().getFullYear();
  const q = query(collection(db, STUDENTS), where('year', '==', year));
  const snap = await getDocs(q);
  const seq = snap.size + 1;
  return `AVJ-${year}-${String(seq).padStart(3, '0')}`;
};

// ── Receipt No: RCP-YYYY-XXXXXX ──────────────────────────────────────────────
const generateReceiptNo = () => {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString().slice(-6);
  return `RCP-${year}-${suffix}`;
};

// ── Students ──────────────────────────────────────────────────────────────────
export const createStudent = async (data) => {
  const studentCode = await generateStudentCode();
  const year = new Date().getFullYear();
  const docData = {
    ...data,
    studentCode,
    year,
    amountPaid: 0,
    pendingBalance: Number(data.totalFee) || 0,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const ref = await addDoc(collection(db, STUDENTS), docData);
  return { id: ref.id, ...docData };
};

export const updateStudent = async (id, data) => {
  const updated = { ...data, updatedAt: Timestamp.now() };
  await updateDoc(doc(db, STUDENTS, id), updated);
  return { id, ...updated };
};

export const deleteStudent = async (id) => {
  await deleteDoc(doc(db, STUDENTS, id));
  return id;
};

export const getAllStudents = async () => {
  const q = query(collection(db, STUDENTS), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Payments (subcollection) ──────────────────────────────────────────────────
export const addPayment = async (studentId, paymentData) => {
  const receiptNo = generateReceiptNo();
  const paymentsRef = collection(db, STUDENTS, studentId, 'payments');

  const payDoc = {
    ...paymentData,
    amount: Number(paymentData.amount),
    receiptNo,
    recordedAt: Timestamp.now(),
  };
  const payRef = await addDoc(paymentsRef, payDoc);

  // Update student running totals
  const studentRef = doc(db, STUDENTS, studentId);
  const studentSnap = await getDoc(studentRef);
  const student = studentSnap.data();
  const newPaid    = (student.amountPaid || 0) + payDoc.amount;
  const newPending = (student.totalFee   || 0) - newPaid;
  await updateDoc(studentRef, {
    amountPaid:     newPaid,
    pendingBalance: newPending,
    updatedAt:      Timestamp.now(),
  });

  return { id: payRef.id, ...payDoc };
};

export const deletePayment = async (studentId, paymentId, amount) => {
  await deleteDoc(doc(db, STUDENTS, studentId, 'payments', paymentId));
  const studentRef  = doc(db, STUDENTS, studentId);
  const studentSnap = await getDoc(studentRef);
  const student     = studentSnap.data();
  const newPaid     = Math.max(0, (student.amountPaid || 0) - Number(amount));
  await updateDoc(studentRef, {
    amountPaid:     newPaid,
    pendingBalance: (student.totalFee || 0) - newPaid,
    updatedAt:      Timestamp.now(),
  });
};

export const getPayments = async (studentId) => {
  const q = query(
    collection(db, STUDENTS, studentId, 'payments'),
    orderBy('recordedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── Batches ───────────────────────────────────────────────────────────────────
export const getAllBatches = async () => {
  const q = query(collection(db, BATCHES), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createBatch = async (data) => {
  const ref = await addDoc(collection(db, BATCHES), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return { id: ref.id, ...data };
};

export const deleteBatch = async (id) => {
  await deleteDoc(doc(db, BATCHES, id));
  return id;
};
