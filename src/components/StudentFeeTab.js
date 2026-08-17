import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  MenuItem, Select, FormControl, InputLabel, InputAdornment,
  Tabs, Tab, Alert, Snackbar, Tooltip, Divider, CircularProgress,
  Card, CardContent, TablePagination, Checkbox
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Payment, History, Print,
  FileDownload, School, CheckCircle, HourglassEmpty,
  PersonAdd, Payments, Class, ArrowBack, Phone, WhatsApp
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import {
  createStudent, updateStudent, deleteStudent, getAllStudents,
  addPayment, deletePayment, getPayments,
  getAllBatches, createBatch
} from '../services/studentFeeService';
import { sendCourierDispatchedNotice, sendLmsCredentialsNotice } from '../services/msg91Service';

// ── Constants ─────────────────────────────────────────────────────────────────
const COURSES = [
  { value: 'astrology', label: 'Astrology' },
  { value: 'vastu',     label: 'Vastu' },
  { value: 'both',      label: 'Both (Astrology & Vastu)' },
];
const PAY_MODES = ['Cash', 'UPI', 'Bank Transfer'];
const STATUS_OPTIONS = ['active', 'completed', 'dropped'];

const fmtCurrency = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const courseLabel = (v) => COURSES.find(c => c.value === v)?.label || v;

const ContactButtons = ({ mobile }) => {
  if (!mobile) return null;
  const cleanMobile = String(mobile).replace(/\D/g, '');
  return (
    <Box sx={{ display: 'flex', gap: 0.75 }}>
      <Tooltip title="Call">
        <IconButton size="small" component="a" href={`tel:${cleanMobile}`}
          sx={{ bgcolor: '#E3F2FD', color: '#1565C0', borderRadius: '8px', '&:hover': { bgcolor: '#BBDEFB' } }}>
          <Phone sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="WhatsApp">
        <IconButton size="small" component="a" href={`https://wa.me/91${cleanMobile}`} target="_blank" rel="noopener noreferrer"
          sx={{ bgcolor: '#E8F5E9', color: '#25D366', borderRadius: '8px', '&:hover': { bgcolor: '#C8E6C9' } }}>
          <WhatsApp sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const RemarksField = ({ student, onSave }) => {
  const [value, setValue] = useState(student.notes || '');
  useEffect(() => { setValue(student.notes || ''); }, [student.notes]);
  return (
    <TextField
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={() => { if (value !== (student.notes || '')) onSave(student, value); }}
      placeholder="Add a note…"
      size="small"
      multiline
      maxRows={3}
      sx={{ minWidth: 170, '& .MuiOutlinedInput-root': { fontSize: '0.75rem', borderRadius: '8px', bgcolor: '#fafafa' } }}
    />
  );
};

const emptyStudent = {
  name: '', mobile: '', course: 'astrology', batch: '',
  joiningDate: '', totalFee: '', status: 'active', notes: '',
  initialPayment: '', initialPaymentMode: 'Cash', initialPaymentDate: ''
};
const emptyPayment = { amount: '', paymentMode: 'Cash', paymentDate: '', note: '' };

// ── Receipt print ─────────────────────────────────────────────────────────────
const buildReceiptHTML = (payment, student) => `<!DOCTYPE html><html><head><title>Receipt - ${payment.receiptNo}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #1a1a1a; }
    .header { text-align:center; border-bottom: 2px solid #ff8c00; padding-bottom:16px; margin-bottom:20px; }
    .header h1 { font-size:1.4rem; color:#ff6b00; font-weight:700; }
    .header p  { font-size:0.85rem; color:#666; margin-top:4px; }
    .receipt-no { display:flex; justify-content:space-between; background:#fff8f0;
      border:1px solid #ffd580; border-radius:8px; padding:10px 16px; margin-bottom:20px; font-size:0.85rem; }
    .receipt-no strong { color:#ff6b00; }
    .section-title { font-size:0.75rem; font-weight:700; text-transform:uppercase;
      letter-spacing:0.08em; color:#999; margin-bottom:10px; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    td { padding:8px 0; font-size:0.9rem; vertical-align:top; }
    td:first-child { color:#666; width:45%; }
    td:last-child { font-weight:600; }
    .amount-box { background:#f0fdf4; border:1px solid #86efac; border-radius:8px;
      padding:14px 16px; margin-bottom:20px; }
    .amount-box .paid { font-size:1.5rem; font-weight:700; color:#16a34a; }
    .balance-row { display:flex; justify-content:space-between; margin-top:8px;
      font-size:0.85rem; color:#555; }
    .balance-row span { font-weight:600; }
    .footer { text-align:center; border-top:1px solid #eee; padding-top:16px;
      font-size:0.75rem; color:#999; }
    .footer a { color:#ff8c00; text-decoration:none; font-weight:600; }
    @media print { body { padding:16px; } }
  </style></head><body>
  <div class="header">
    <h1>Astro Vastu Shri V M Joshi</h1>
    <p>Payment Receipt</p>
  </div>
  <div class="receipt-no">
    <div>Receipt No: <strong>${payment.receiptNo}</strong></div>
    <div>Date: <strong>${fmtDate(payment.paymentDate ? { toDate: () => new Date(payment.paymentDate) } : payment.recordedAt)}</strong></div>
  </div>
  <div class="section-title">Student Details</div>
  <table>
    <tr><td>Student ID</td><td>${student.studentCode}</td></tr>
    <tr><td>Name</td><td>${student.name}</td></tr>
    <tr><td>Mobile</td><td>${student.mobile}</td></tr>
    <tr><td>Course</td><td>${courseLabel(student.course)}</td></tr>
    <tr><td>Batch</td><td>${student.batch || '—'}</td></tr>
  </table>
  <div class="section-title">Payment Details</div>
  <div class="amount-box">
    <div style="font-size:0.8rem;color:#555;margin-bottom:4px;">Amount Paid</div>
    <div class="paid">${fmtCurrency(payment.amount)}</div>
    <div class="balance-row">
      <span>Mode: ${payment.paymentMode}</span>
      <span>Total Fee: ${fmtCurrency(student.totalFee)}</span>
    </div>
    <div class="balance-row" style="margin-top:4px;">
      <span>Total Paid: ${fmtCurrency(student.amountPaid)}</span>
      <span style="color:${student.pendingBalance > 0 ? '#dc2626' : '#16a34a'}">
        Pending: ${fmtCurrency(student.pendingBalance)}
      </span>
    </div>
  </div>
  ${payment.note ? `<table><tr><td>Note</td><td>${payment.note}</td></tr></table>` : ''}
  <div class="footer">
    <p>Thank you for your payment 🙏</p>
    <p style="margin-top:6px;">Designed &amp; Developed by <a href="https://www.prashanvitech.com">PrashanviTech</a></p>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`;

const printReceipt = (payment, student, existingWindow = null) => {
  const w = existingWindow || window.open('', '_blank', 'width=650,height=750');
  if (!w) return;
  w.document.open();
  w.document.write(buildReceiptHTML(payment, student));
  w.document.close();
};

// ── Summary Card ──────────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, color, icon }) => (
  <Card sx={{ flex: 1, borderRadius: '14px', border: `1px solid ${color}22`, boxShadow: 'none', minWidth: 140 }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, color, mt: 0.5, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: `${color}18`, borderRadius: '10px', p: 0.8, color, display: 'flex' }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ── Main Component ────────────────────────────────────────────────────────────
const StudentFeeTab = () => {
  const [subTab, setSubTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchSort, setBatchSort] = useState('date_desc');
  const [batchCourseFilter, setBatchCourseFilter] = useState('all');
  const [batchDetail, setBatchDetail] = useState({ open: false, batch: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  // Dialogs
  const [studentDialog, setStudentDialog] = useState({ open: false, editing: null });
  const [studentForm, setStudentForm]     = useState(emptyStudent);
  const [studentErrors, setStudentErrors] = useState({});

  const [payDialog, setPayDialog]   = useState({ open: false, student: null });
  const [payForm, setPayForm]       = useState(emptyPayment);
  const [payErrors, setPayErrors]   = useState({});

  const [historyDialog, setHistoryDialog] = useState({ open: false, student: null });
  const [payments, setPayments]           = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const [batchDialog, setBatchDialog] = useState(false);
  const [batchForm, setBatchForm]     = useState({ name: '', course: 'astrology', startDate: '' });

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null, extra: null });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([getAllStudents(), getAllBatches()]);
      setStudents(s);
      setBatches(b);
    } catch (e) {
      toast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  // ── Computed ──────────────────────────────────────────────────────────────
  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name?.toLowerCase().includes(q) || s.mobile?.includes(q) || s.studentCode?.toLowerCase().includes(q);
  });
  const totalCollected = students.reduce((a, s) => a + (s.amountPaid || 0), 0);
  const totalPending   = students.reduce((a, s) => a + (s.pendingBalance || 0), 0);
  const activeCount    = students.filter(s => s.status === 'active').length;

  // ── Student CRUD ──────────────────────────────────────────────────────────
  const openAddStudent = () => {
    setStudentForm({ ...emptyStudent, initialPaymentDate: new Date().toISOString().split('T')[0] });
    setStudentErrors({});
    setStudentDialog({ open: true, editing: null });
  };

  const openEditStudent = (s) => {
    setStudentForm({
      name: s.name || '', mobile: s.mobile || '',
      course: s.course || 'astrology', batch: s.batch || '',
      joiningDate: s.joiningDate || '', totalFee: s.totalFee || '',
      status: s.status || 'active', notes: s.notes || ''
    });
    setStudentErrors({});
    setStudentDialog({ open: true, editing: s });
  };

  const validateStudent = () => {
    const e = {};
    if (!studentForm.name.trim())   e.name = 'Name is required';
    if (!studentForm.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^\d{10}$/.test(studentForm.mobile.trim())) e.mobile = 'Enter valid 10-digit number';
    if (!studentForm.totalFee || isNaN(studentForm.totalFee)) e.totalFee = 'Enter valid fee amount';
    setStudentErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveStudent = async () => {
    if (!validateStudent()) return;
    setSaving(true);
    try {
      const { initialPayment, initialPaymentMode, initialPaymentDate, ...rest } = studentForm;
      const data = { ...rest, totalFee: Number(rest.totalFee) };
      if (studentDialog.editing) {
        const updated = await updateStudent(studentDialog.editing.id, data);
        setStudents(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
        toast('Student updated');
      } else {
        const created = await createStudent(data);
        // Record initial payment if provided
        if (initialPayment && Number(initialPayment) > 0) {
          await addPayment(created.id, {
            amount: Number(initialPayment),
            paymentMode: initialPaymentMode,
            paymentDate: initialPaymentDate,
            note: 'Initial payment at enrollment',
          });
          const newPaid    = Number(initialPayment);
          const newPending = data.totalFee - newPaid;
          const withPay    = { ...created, amountPaid: newPaid, pendingBalance: newPending };
          setStudents(prev => [withPay, ...prev]);
          toast(`Student added — ID: ${created.studentCode}. Initial payment of ${fmtCurrency(Number(initialPayment))} recorded.`);
        } else {
          setStudents(prev => [created, ...prev]);
          toast(`Student added — ID: ${created.studentCode}`);
        }
      }
      setStudentDialog({ open: false, editing: null });
    } catch {
      toast('Failed to save student', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    setSaving(true);
    try {
      await deleteStudent(deleteConfirm.id);
      setStudents(prev => prev.filter(s => s.id !== deleteConfirm.id));
      toast('Student deleted');
    } catch {
      toast('Failed to delete student', 'error');
    } finally {
      setSaving(false);
      setDeleteConfirm({ open: false, type: '', id: null, extra: null });
    }
  };

  // ── Fulfillment tracking (Notes / Packed / Courier / LMS Credentials) ──────
  const toggleFulfillment = async (student, field) => {
    const newValue = !student[field];
    try {
      await updateStudent(student.id, { [field]: newValue });
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, [field]: newValue } : s));

      if (newValue && field === 'courierSent') {
        const res = await sendCourierDispatchedNotice(student.mobile, student.name);
        toast(res?.success
          ? `Courier notice sent to ${student.name}`
          : `Marked dispatched, but WhatsApp message failed for ${student.name}`,
          res?.success ? 'success' : 'warning');
      } else if (newValue && field === 'lmsCredentialsSent') {
        const res = await sendLmsCredentialsNotice(student.mobile, student.name);
        toast(res?.success
          ? `LMS credentials notice sent to ${student.name}`
          : `Marked as sent, but WhatsApp message failed for ${student.name}`,
          res?.success ? 'success' : 'warning');
      }
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  const saveRemarks = async (student, value) => {
    try {
      await updateStudent(student.id, { notes: value });
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, notes: value } : s));
    } catch {
      toast('Failed to save note', 'error');
    }
  };

  // ── Payment ───────────────────────────────────────────────────────────────
  const openPayDialog = (student) => {
    setPayForm({ ...emptyPayment, paymentDate: new Date().toISOString().split('T')[0] });
    setPayErrors({});
    setPayDialog({ open: true, student });
  };

  const validatePayment = () => {
    const e = {};
    if (!payForm.amount || isNaN(payForm.amount) || Number(payForm.amount) <= 0)
      e.amount = 'Enter valid amount';
    if (!payForm.paymentDate) e.paymentDate = 'Select payment date';
    setPayErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSavePayment = async (shouldPrint = false) => {
    if (!validatePayment()) return;
    // Open window NOW (sync, before any await) so popup blocker doesn't block it
    const printWin = shouldPrint ? window.open('', '_blank', 'width=650,height=750') : null;
    setSaving(true);
    try {
      const result = await addPayment(payDialog.student.id, {
        ...payForm,
        amount: Number(payForm.amount),
      });
      const newPaid    = (payDialog.student.amountPaid || 0) + Number(payForm.amount);
      const newPending = (payDialog.student.totalFee   || 0) - newPaid;
      const updatedStudent = { ...payDialog.student, amountPaid: newPaid, pendingBalance: newPending };
      setStudents(prev => prev.map(s => s.id === payDialog.student.id ? updatedStudent : s));
      toast(`Payment recorded — ${result.receiptNo}`);
      if (shouldPrint) printReceipt(result, updatedStudent, printWin);
      setPayDialog({ open: false, student: null });
    } catch {
      if (printWin) printWin.close();
      toast('Failed to record payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── History ───────────────────────────────────────────────────────────────
  const openHistory = async (student) => {
    setHistoryDialog({ open: true, student });
    setPaymentsLoading(true);
    try {
      const p = await getPayments(student.id);
      setPayments(p);
    } catch {
      toast('Failed to load payments', 'error');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleDeletePayment = async (pay) => {
    try {
      await deletePayment(historyDialog.student.id, pay.id, pay.amount);
      setPayments(prev => prev.filter(p => p.id !== pay.id));
      const newPaid    = Math.max(0, (historyDialog.student.amountPaid || 0) - pay.amount);
      const newPending = (historyDialog.student.totalFee || 0) - newPaid;
      const updated    = { ...historyDialog.student, amountPaid: newPaid, pendingBalance: newPending };
      setHistoryDialog(prev => ({ ...prev, student: updated }));
      setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
      toast('Payment deleted');
    } catch {
      toast('Failed to delete payment', 'error');
    }
  };

  // ── Batch ─────────────────────────────────────────────────────────────────
  const handleSaveBatch = async () => {
    if (!batchForm.name.trim()) return;
    setSaving(true);
    try {
      const b = await createBatch(batchForm);
      setBatches(prev => [b, ...prev]);
      setBatchForm({ name: '', course: 'astrology', startDate: '' });
      setBatchDialog(false);
      toast('Batch created');
    } catch {
      toast('Failed to create batch', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportStudentsExcel = () => {
    const rows = students.map(s => ({
      'Student ID':      s.studentCode,
      'Name':            s.name,
      'Mobile':          s.mobile,
      'Course':          courseLabel(s.course),
      'Batch':           s.batch || '',
      'Joining Date':    s.joiningDate || '',
      'Total Fee (₹)':  s.totalFee || 0,
      'Amount Paid (₹)': s.amountPaid || 0,
      'Pending (₹)':    s.pendingBalance || 0,
      'Status':          s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, `AVJ_Students_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
  };

  const exportPendingExcel = () => {
    const pending = students.filter(s => (s.pendingBalance || 0) > 0);
    const rows = pending.map(s => ({
      'Student ID':     s.studentCode,
      'Name':           s.name,
      'Mobile':         s.mobile,
      'Course':         courseLabel(s.course),
      'Batch':          s.batch || '',
      'Total Fee (₹)': s.totalFee || 0,
      'Paid (₹)':      s.amountPaid || 0,
      'Pending (₹)':   s.pendingBalance || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pending Fees');
    XLSX.writeFile(wb, `AVJ_PendingFees_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
  };

  const exportFulfillmentExcel = () => {
    const rows = students.map(s => ({
      'Student ID':          s.studentCode,
      'Name':                s.name,
      'Mobile':              s.mobile,
      'Course':              courseLabel(s.course),
      'Batch':               s.batch || '',
      'Notes Printed':       s.notesPrinted ? 'Yes' : 'No',
      'Packed':              s.packed ? 'Yes' : 'No',
      'Courier Dispatched':  s.courierSent ? 'Yes' : 'No',
      'LMS Credentials Sent': s.lmsCredentialsSent ? 'Yes' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fulfillment Status');
    XLSX.writeFile(wb, `AVJ_FulfillmentStatus_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
  };

  // ── Chip Colours ──────────────────────────────────────────────────────────
  const statusChip = (status) => {
    const map = {
      active:    { label: 'Active',    bg: '#E8F5E9', color: '#2E7D32' },
      completed: { label: 'Completed', bg: '#E3F2FD', color: '#1565C0' },
      dropped:   { label: 'Dropped',   bg: '#FBE9E7', color: '#BF360C' },
    };
    const s = map[status] || map.active;
    return <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: '0.7rem' }} />;
  };

  const courseChip = (c) => {
    const map = {
      astrology: { bg: '#E8EAF6', color: '#283593' },
      vastu:     { bg: '#E0F2F1', color: '#00695C' },
      both:      { bg: '#EDE7F6', color: '#4527A0' },
    };
    const s = map[c] || map.astrology;
    return <Chip label={courseLabel(c)} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: '0.7rem' }} />;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* ── Secondary Tabs ── */}
      <Box sx={{ borderBottom: '1px solid #f0e6d3', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Tabs value={subTab} onChange={(_, v) => setSubTab(v)}
          sx={{ '& .MuiTab-root': { fontSize: '0.82rem', fontWeight: 600, minHeight: 40, textTransform: 'none' },
               '& .Mui-selected': { color: '#e65100' },
               '& .MuiTabs-indicator': { bgcolor: '#e65100' } }}>
          <Tab icon={<School sx={{ fontSize: 16 }} />} iconPosition="start" label="Students" />
          <Tab icon={<Payments sx={{ fontSize: 16 }} />} iconPosition="start" label="Reports" />
          <Tab icon={<Class sx={{ fontSize: 16 }} />} iconPosition="start" label="Batches" />
        </Tabs>
        {subTab === 0 && (
          <Button variant="contained" startIcon={<PersonAdd />} size="small"
            onClick={openAddStudent}
            sx={{ bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' }, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
            Add Student
          </Button>
        )}
        {subTab === 1 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<FileDownload />} size="small"
              onClick={exportStudentsExcel}
              sx={{ borderColor: '#e65100', color: '#e65100', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
              All Students
            </Button>
            <Button variant="outlined" startIcon={<FileDownload />} size="small"
              onClick={exportPendingExcel}
              sx={{ borderColor: '#c62828', color: '#c62828', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
              Pending Fees
            </Button>
            <Button variant="outlined" startIcon={<FileDownload />} size="small"
              onClick={exportFulfillmentExcel}
              sx={{ borderColor: '#1565C0', color: '#1565C0', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
              Fulfillment Status
            </Button>
          </Box>
        )}
        {subTab === 2 && (
          <Button variant="contained" startIcon={<Add />} size="small"
            onClick={() => setBatchDialog(true)}
            sx={{ bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' }, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
            New Batch
          </Button>
        )}
      </Box>

      {/* ── Summary Cards ── */}
      {subTab === 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <SummaryCard label="Total Students" value={students.length} color="#1565C0" icon={<School fontSize="small" />} />
          <SummaryCard label="Active Students" value={activeCount} color="#2E7D32" icon={<CheckCircle fontSize="small" />} />
          <SummaryCard label="Total Collected" value={fmtCurrency(totalCollected)} color="#e65100" icon={<Payments fontSize="small" />} />
          <SummaryCard label="Total Pending" value={fmtCurrency(totalPending)} color="#c62828" icon={<HourglassEmpty fontSize="small" />} />
        </Box>
      )}

      {/* ══════════════ STUDENTS TAB ══════════════ */}
      {subTab === 0 && (
        <>
          <TextField
            placeholder="Search by name, mobile or ID…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            size="small" fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#bbb', fontSize: 18 }} /></InputAdornment> }}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fafafa' } }}
          />

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress sx={{ color: '#e65100' }} /></Box>
          ) : (
            <TableContainer component={Paper} elevation={0}
              sx={{ border: '1px solid #f0e6d3', borderRadius: '12px', overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fff8f0' }}>
                    {['ID', 'Name', 'Mobile', 'Course', 'Batch', 'Total Fee', 'Paid', 'Pending', 'Status', 'Notes Printed', 'Packed', 'Courier', 'LMS Sent', 'Contact', 'Remarks', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#7c4a03', py: 1.5, whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s, i) => (
                    <TableRow key={s.id} hover sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fffaf6' }}>
                      <TableCell sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#e65100', whiteSpace: 'nowrap' }}>
                        {s.studentCode}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{s.mobile}</TableCell>
                      <TableCell>{courseChip(s.course)}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#555' }}>{s.batch || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{fmtCurrency(s.totalFee)}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#2E7D32', fontWeight: 600 }}>{fmtCurrency(s.amountPaid)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700,
                          color: (s.pendingBalance || 0) > 0 ? '#c62828' : '#2E7D32' }}>
                          {fmtCurrency(s.pendingBalance)}
                        </Typography>
                      </TableCell>
                      <TableCell>{statusChip(s.status)}</TableCell>
                      <TableCell padding="checkbox">
                        <Tooltip title="Notes Printed">
                          <Checkbox size="small" checked={!!s.notesPrinted}
                            onChange={() => toggleFulfillment(s, 'notesPrinted')}
                            sx={{ color: '#bbb', '&.Mui-checked': { color: '#e65100' } }} />
                        </Tooltip>
                      </TableCell>
                      <TableCell padding="checkbox">
                        <Tooltip title="Packed">
                          <Checkbox size="small" checked={!!s.packed}
                            onChange={() => toggleFulfillment(s, 'packed')}
                            sx={{ color: '#bbb', '&.Mui-checked': { color: '#e65100' } }} />
                        </Tooltip>
                      </TableCell>
                      <TableCell padding="checkbox">
                        <Tooltip title="Courier Dispatched — ticking sends a WhatsApp update to the client">
                          <Checkbox size="small" checked={!!s.courierSent}
                            onChange={() => toggleFulfillment(s, 'courierSent')}
                            sx={{ color: '#bbb', '&.Mui-checked': { color: '#2E7D32' } }} />
                        </Tooltip>
                      </TableCell>
                      <TableCell padding="checkbox">
                        <Tooltip title="LMS Credentials Sent — ticking sends a WhatsApp update to the client">
                          <Checkbox size="small" checked={!!s.lmsCredentialsSent}
                            onChange={() => toggleFulfillment(s, 'lmsCredentialsSent')}
                            sx={{ color: '#bbb', '&.Mui-checked': { color: '#1565C0' } }} />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <ContactButtons mobile={s.mobile} />
                      </TableCell>
                      <TableCell>
                        <RemarksField student={s} onSave={saveRemarks} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.3 }}>
                          <Tooltip title="Add Payment">
                            <IconButton size="small" onClick={() => openPayDialog(s)}
                              sx={{ color: '#2E7D32', '&:hover': { bgcolor: '#E8F5E9' } }}>
                              <Payment sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Payment History">
                            <IconButton size="small" onClick={() => openHistory(s)}
                              sx={{ color: '#1565C0', '&:hover': { bgcolor: '#E3F2FD' } }}>
                              <History sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Student">
                            <IconButton size="small" onClick={() => openEditStudent(s)}
                              sx={{ color: '#e65100', '&:hover': { bgcolor: '#FFF3E0' } }}>
                              <Edit sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Student">
                            <IconButton size="small"
                              onClick={() => setDeleteConfirm({ open: true, type: 'student', id: s.id, extra: s.name })}
                              sx={{ color: '#c62828', '&:hover': { bgcolor: '#FFEBEE' } }}>
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={16} sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                        {search ? 'No students match your search.' : 'No students added yet.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div" count={filtered.length} page={page}
                onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
                sx={{ borderTop: '1px solid #f0e6d3', '& .MuiTablePagination-toolbar': { minHeight: 40 } }}
              />
            </TableContainer>
          )}
        </>
      )}

      {/* ══════════════ REPORTS TAB ══════════════ */}
      {subTab === 1 && (
        <Box>
          {/* Summary cards for reports */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <SummaryCard label="Total Students" value={students.length} color="#1565C0" icon={<School fontSize="small" />} />
            <SummaryCard label="Total Collected" value={fmtCurrency(totalCollected)} color="#2E7D32" icon={<Payments fontSize="small" />} />
            <SummaryCard label="Total Pending" value={fmtCurrency(totalPending)} color="#c62828" icon={<HourglassEmpty fontSize="small" />} />
            <SummaryCard label="Students with Dues" value={students.filter(s => (s.pendingBalance || 0) > 0).length} color="#e65100" icon={<HourglassEmpty fontSize="small" />} />
          </Box>

          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1.5, color: '#5D3A1A' }}>
            Pending Fees — {students.filter(s => (s.pendingBalance || 0) > 0).length} students
          </Typography>
          <TableContainer component={Paper} elevation={0}
            sx={{ border: '1px solid #f0e6d3', borderRadius: '12px', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fff8f0' }}>
                  {['Student ID', 'Name', 'Mobile', 'Course', 'Batch', 'Total Fee', 'Paid', 'Pending'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#7c4a03', py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {students.filter(s => (s.pendingBalance || 0) > 0)
                  .sort((a, b) => (b.pendingBalance || 0) - (a.pendingBalance || 0))
                  .map((s, i) => (
                    <TableRow key={s.id} hover sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fffaf6' }}>
                      <TableCell sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#e65100' }}>{s.studentCode}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{s.mobile}</TableCell>
                      <TableCell>{courseChip(s.course)}</TableCell>
                      <TableCell sx={{ fontSize: '0.78rem' }}>{s.batch || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{fmtCurrency(s.totalFee)}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#2E7D32', fontWeight: 600 }}>{fmtCurrency(s.amountPaid)}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#c62828' }}>{fmtCurrency(s.pendingBalance)}</TableCell>
                    </TableRow>
                  ))}
                {students.filter(s => (s.pendingBalance || 0) > 0).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#2E7D32', fontWeight: 600 }}>
                      🎉 No pending fees!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ══════════════ BATCHES TAB ══════════════ */}
      {subTab === 2 && (
        <Box>
          {batchDetail.batch ? (
            /* ── Inline batch detail (not a popup) ── */
            <Box>
              <Button onClick={() => setBatchDetail({ open: false, batch: null })} startIcon={<ArrowBack />}
                sx={{ textTransform: 'none', color: '#e65100', fontWeight: 600, mb: 2 }}>
                Back to Batches
              </Button>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#3d2e1e' }}>
                  {batchDetail.batch.name}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>
                  {courseLabel(batchDetail.batch.course)}
                  {batchDetail.batch.startDate && ` · Starts ${new Date(batchDetail.batch.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                </Typography>
              </Box>
              {(() => {
                const batchStudents = students.filter(s => s.batch === batchDetail.batch.name);
                return batchStudents.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5, color: '#bbb' }}>
                    <Typography>No students enrolled in this batch yet.</Typography>
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 1.5 }}>
                      {batchStudents.length} student{batchStudents.length !== 1 ? 's' : ''} enrolled
                    </Typography>
                    <TableContainer component={Paper} elevation={0}
                      sx={{ border: '1px solid #f0e6d3', borderRadius: '12px', overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#fff8f0' }}>
                            {['ID', 'Name', 'Mobile', 'Total Fee', 'Paid', 'Pending', 'Status', 'Notes Printed', 'Packed', 'Courier', 'LMS Sent', 'Contact', 'Remarks'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#7c4a03', py: 1.2, whiteSpace: 'nowrap' }}>
                                {h}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {batchStudents.map(s => (
                            <TableRow key={s.id}>
                              <TableCell sx={{ fontSize: '0.78rem' }}>{s.studentCode}</TableCell>
                              <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{s.name}</TableCell>
                              <TableCell sx={{ fontSize: '0.78rem' }}>{s.mobile}</TableCell>
                              <TableCell sx={{ fontSize: '0.78rem' }}>{fmtCurrency(s.totalFee)}</TableCell>
                              <TableCell sx={{ fontSize: '0.78rem', color: '#2E7D32' }}>{fmtCurrency(s.amountPaid)}</TableCell>
                              <TableCell sx={{ fontSize: '0.78rem', color: s.pendingBalance > 0 ? '#c62828' : '#888' }}>{fmtCurrency(s.pendingBalance)}</TableCell>
                              <TableCell>{statusChip(s.status)}</TableCell>
                              <TableCell padding="checkbox">
                                <Tooltip title="Notes Printed">
                                  <Checkbox size="small" checked={!!s.notesPrinted}
                                    onChange={() => toggleFulfillment(s, 'notesPrinted')}
                                    sx={{ color: '#bbb', '&.Mui-checked': { color: '#e65100' } }} />
                                </Tooltip>
                              </TableCell>
                              <TableCell padding="checkbox">
                                <Tooltip title="Packed">
                                  <Checkbox size="small" checked={!!s.packed}
                                    onChange={() => toggleFulfillment(s, 'packed')}
                                    sx={{ color: '#bbb', '&.Mui-checked': { color: '#e65100' } }} />
                                </Tooltip>
                              </TableCell>
                              <TableCell padding="checkbox">
                                <Tooltip title="Courier Dispatched — ticking sends a WhatsApp update to the client">
                                  <Checkbox size="small" checked={!!s.courierSent}
                                    onChange={() => toggleFulfillment(s, 'courierSent')}
                                    sx={{ color: '#bbb', '&.Mui-checked': { color: '#2E7D32' } }} />
                                </Tooltip>
                              </TableCell>
                              <TableCell padding="checkbox">
                                <Tooltip title="LMS Credentials Sent — ticking sends a WhatsApp update to the client">
                                  <Checkbox size="small" checked={!!s.lmsCredentialsSent}
                                    onChange={() => toggleFulfillment(s, 'lmsCredentialsSent')}
                                    sx={{ color: '#bbb', '&.Mui-checked': { color: '#1565C0' } }} />
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <ContactButtons mobile={s.mobile} />
                              </TableCell>
                              <TableCell>
                                <RemarksField student={s} onSave={saveRemarks} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                );
              })()}
            </Box>
          ) : (
            /* ── Batch list ── */
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 2 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#888', mr: 'auto' }}>
                  {batches.length} batch{batches.length !== 1 ? 'es' : ''} created
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Course</InputLabel>
                  <Select value={batchCourseFilter} label="Course"
                    onChange={e => setBatchCourseFilter(e.target.value)}
                    sx={{ borderRadius: '10px' }}>
                    <MenuItem value="all">All Courses</MenuItem>
                    {COURSES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel>Sort by</InputLabel>
                  <Select value={batchSort} label="Sort by"
                    onChange={e => setBatchSort(e.target.value)}
                    sx={{ borderRadius: '10px' }}>
                    <MenuItem value="date_desc">Start Date (Newest)</MenuItem>
                    <MenuItem value="date_asc">Start Date (Oldest)</MenuItem>
                    <MenuItem value="name">Batch Name (A–Z)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {(() => {
                const filtered = batches.filter(b => batchCourseFilter === 'all' || b.course === batchCourseFilter);
                const sorted = [...filtered].sort((a, b) => {
                  if (batchSort === 'name') return (a.name || '').localeCompare(b.name || '');
                  const aTime = a.startDate ? new Date(a.startDate).getTime() : 0;
                  const bTime = b.startDate ? new Date(b.startDate).getTime() : 0;
                  return batchSort === 'date_asc' ? aTime - bTime : bTime - aTime;
                });
                return sorted.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: '#bbb' }}>
                  <Class sx={{ fontSize: 40, mb: 1 }} />
                  <Typography>{batches.length === 0 ? 'No batches yet. Create your first batch.' : 'No batches match this filter.'}</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {sorted.map(b => (
                    <Box key={b.id} onClick={() => setBatchDetail({ open: true, batch: b })}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                      bgcolor: '#fff8f0', border: '1px solid #ffd580', borderRadius: '10px', px: 2, py: 1,
                      '&:hover': { bgcolor: '#fff2de', borderColor: '#e65100' } }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#3d2e1e' }}>{b.name}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>
                          {courseLabel(b.course)}
                          {b.startDate && ` · Starts ${new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              );
              })()}
            </>
          )}
        </Box>
      )}

      {/* ══════════ DIALOGS ══════════ */}

      {/* Add/Edit Student */}
      <Dialog open={studentDialog.open} onClose={() => setStudentDialog({ open: false, editing: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#3d2e1e', borderBottom: '1px solid #f0e6d3' }}>
          {studentDialog.editing ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Student Name *" value={studentForm.name}
              onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))}
              error={!!studentErrors.name} helperText={studentErrors.name} fullWidth size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

            <TextField label="Mobile Number *" value={studentForm.mobile}
              onChange={e => { const d = e.target.value.replace(/\D/g, ''); setStudentForm(p => ({ ...p, mobile: d.length > 10 ? d.slice(-10) : d })); }}
              error={!!studentErrors.mobile} helperText={studentErrors.mobile} fullWidth size="small"
              inputProps={{ inputMode: 'numeric' }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Course *</InputLabel>
                <Select value={studentForm.course} label="Course *"
                  onChange={e => setStudentForm(p => ({ ...p, course: e.target.value }))}
                  sx={{ borderRadius: '10px' }}>
                  {COURSES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Batch</InputLabel>
                <Select value={studentForm.batch} label="Batch"
                  onChange={e => setStudentForm(p => ({ ...p, batch: e.target.value }))}
                  sx={{ borderRadius: '10px' }}>
                  <MenuItem value="">— None —</MenuItem>
                  {batches.filter(b => b.course === studentForm.course || studentForm.course === 'both').map(b => (
                    <MenuItem key={b.id} value={b.name}>{b.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Joining Date" type="date" value={studentForm.joiningDate}
                onChange={e => setStudentForm(p => ({ ...p, joiningDate: e.target.value }))}
                fullWidth size="small" InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

              <TextField label="Total Course Fee *" value={studentForm.totalFee}
                onChange={e => setStudentForm(p => ({ ...p, totalFee: e.target.value.replace(/\D/g, '') }))}
                error={!!studentErrors.totalFee} helperText={studentErrors.totalFee}
                fullWidth size="small" inputProps={{ inputMode: 'numeric' }}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            </Box>

            {studentDialog.editing && (
              <>
                {/* Fee summary in edit mode */}
                <Box sx={{ bgcolor: '#fff8f0', border: '1px solid #ffd580', borderRadius: '10px', p: 1.5 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c4a03', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                    Fee Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#666' }}>Total Fee</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{fmtCurrency(studentDialog.editing.totalFee)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#666' }}>Amount Paid</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#2E7D32' }}>{fmtCurrency(studentDialog.editing.amountPaid)}</Typography>
                  </Box>
                  <Divider sx={{ my: 0.8 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#666' }}>Pending Balance</Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: (studentDialog.editing.pendingBalance || 0) > 0 ? '#c62828' : '#2E7D32' }}>
                      {fmtCurrency(studentDialog.editing.pendingBalance)}
                    </Typography>
                  </Box>
                </Box>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={studentForm.status} label="Status"
                    onChange={e => setStudentForm(p => ({ ...p, status: e.target.value }))}
                    sx={{ borderRadius: '10px' }}>
                    {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </>
            )}

            {/* Initial payment section — only for new student */}
            {!studentDialog.editing && (
              <>
                <Divider sx={{ my: 0.5 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Initial Payment (optional)
                  </Typography>
                </Divider>
                <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', p: 1.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#555', mb: 1.2 }}>
                    If the student pays at the time of enrollment, enter the amount here. A receipt will be printed automatically.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField label="Amount Paid Now" value={studentForm.initialPayment}
                      onChange={e => setStudentForm(p => ({ ...p, initialPayment: e.target.value.replace(/\D/g, '') }))}
                      size="small" fullWidth inputProps={{ inputMode: 'numeric' }}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }} />
                    <TextField label="Payment Date" type="date" value={studentForm.initialPaymentDate}
                      onChange={e => setStudentForm(p => ({ ...p, initialPaymentDate: e.target.value }))}
                      size="small" fullWidth InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }} />
                  </Box>
                  <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select value={studentForm.initialPaymentMode} label="Payment Mode"
                      onChange={e => setStudentForm(p => ({ ...p, initialPaymentMode: e.target.value }))}
                      sx={{ borderRadius: '10px', bgcolor: '#fff' }}>
                      {PAY_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </>
            )}

            <TextField label="Notes (optional)" value={studentForm.notes}
              onChange={e => setStudentForm(p => ({ ...p, notes: e.target.value }))}
              fullWidth size="small" multiline rows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #f0e6d3', pt: 1.5 }}>
          <Button onClick={() => setStudentDialog({ open: false, editing: null })}
            sx={{ textTransform: 'none', color: '#888' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveStudent} disabled={saving}
            sx={{ bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' }, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : (studentDialog.editing ? 'Save Changes' : 'Add Student')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment */}
      <Dialog open={payDialog.open} onClose={() => setPayDialog({ open: false, student: null })}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#3d2e1e', borderBottom: '1px solid #f0e6d3', pb: 1.5 }}>
          Add Payment
          {payDialog.student && (
            <Typography sx={{ fontSize: '0.78rem', color: '#888', fontWeight: 400, mt: 0.3 }}>
              {payDialog.student.name} — {payDialog.student.studentCode}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          {payDialog.student && (
            <Box sx={{ bgcolor: '#fff8f0', border: '1px solid #ffd580', borderRadius: '10px', p: 1.5, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>Total Fee</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{fmtCurrency(payDialog.student.totalFee)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>Paid So Far</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#2E7D32' }}>{fmtCurrency(payDialog.student.amountPaid)}</Typography>
              </Box>
              <Divider sx={{ my: 0.8 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>Pending Balance</Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#c62828' }}>{fmtCurrency(payDialog.student.pendingBalance)}</Typography>
              </Box>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Amount Received *" value={payForm.amount}
              onChange={e => setPayForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, '') }))}
              error={!!payErrors.amount} helperText={payErrors.amount} fullWidth size="small"
              inputProps={{ inputMode: 'numeric' }}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

            <TextField label="Payment Date *" type="date" value={payForm.paymentDate}
              onChange={e => setPayForm(p => ({ ...p, paymentDate: e.target.value }))}
              error={!!payErrors.paymentDate} helperText={payErrors.paymentDate}
              fullWidth size="small" InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />

            <FormControl fullWidth size="small">
              <InputLabel>Payment Mode</InputLabel>
              <Select value={payForm.paymentMode} label="Payment Mode"
                onChange={e => setPayForm(p => ({ ...p, paymentMode: e.target.value }))}
                sx={{ borderRadius: '10px' }}>
                {PAY_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="Note (optional)" value={payForm.note}
              onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))}
              fullWidth size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #f0e6d3', pt: 1.5 }}>
          <Button onClick={() => setPayDialog({ open: false, student: null })}
            sx={{ textTransform: 'none', color: '#888' }}>Cancel</Button>
          <Button variant="outlined" onClick={() => handleSavePayment(false)} disabled={saving}
            sx={{ borderColor: '#e65100', color: '#e65100', borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
          </Button>
          <Button variant="contained" onClick={() => handleSavePayment(true)} disabled={saving}
            startIcon={<Print sx={{ fontSize: 16 }} />}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Print Receipt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment History */}
      <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ open: false, student: null })}
        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#3d2e1e', borderBottom: '1px solid #f0e6d3' }}>
          Payment History
          {historyDialog.student && (
            <Typography sx={{ fontSize: '0.78rem', color: '#888', fontWeight: 400, mt: 0.3 }}>
              {historyDialog.student.name} — {historyDialog.student.studentCode} &nbsp;|&nbsp;
              Pending: <span style={{ color: '#c62828', fontWeight: 700 }}>{fmtCurrency(historyDialog.student.pendingBalance)}</span>
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {paymentsLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress sx={{ color: '#e65100' }} /></Box>
          ) : payments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: '#bbb' }}>No payments recorded yet.</Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fff8f0' }}>
                    {['Receipt No', 'Date', 'Amount', 'Mode', 'Note', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#7c4a03' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p, i) => (
                    <TableRow key={p.id} hover sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fffaf6' }}>
                      <TableCell sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#e65100' }}>{p.receiptNo}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{fmtDate(p.paymentDate ? { toDate: () => new Date(p.paymentDate) } : p.recordedAt)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2E7D32' }}>{fmtCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Chip label={p.paymentMode} size="small"
                          sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.78rem', color: '#555' }}>{p.note || '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Print Receipt">
                            <IconButton size="small" onClick={() => printReceipt(p, historyDialog.student)}
                              sx={{ color: '#1565C0' }}>
                              <Print sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Payment">
                            <IconButton size="small" onClick={() => handleDeletePayment(p)}
                              sx={{ color: '#c62828' }}>
                              <Delete sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid #f0e6d3', pt: 1.5 }}>
          <Button onClick={() => setHistoryDialog({ open: false, student: null })}
            sx={{ textTransform: 'none', color: '#888' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Batch */}
      <Dialog open={batchDialog} onClose={() => setBatchDialog(false)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#3d2e1e', borderBottom: '1px solid #f0e6d3' }}>
          Create New Batch
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Batch Name *" value={batchForm.name}
              onChange={e => setBatchForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Batch A 2026" fullWidth size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select value={batchForm.course} label="Course"
                onChange={e => setBatchForm(p => ({ ...p, course: e.target.value }))}
                sx={{ borderRadius: '10px' }}>
                {COURSES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Start Date" type="date" value={batchForm.startDate}
              onChange={e => setBatchForm(p => ({ ...p, startDate: e.target.value }))}
              fullWidth size="small" InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #f0e6d3', pt: 1.5 }}>
          <Button onClick={() => setBatchDialog(false)} sx={{ textTransform: 'none', color: '#888' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveBatch} disabled={saving || !batchForm.name.trim()}
            sx={{ bgcolor: '#e65100', '&:hover': { bgcolor: '#bf360c' }, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Create Batch'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, type: '', id: null, extra: null })}
        maxWidth="xs" PaperProps={{ sx: { borderRadius: '14px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: '#555' }}>
            Delete student <strong>{deleteConfirm.extra}</strong>? This will also remove all their payment records.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm({ open: false, type: '', id: null, extra: null })}
            sx={{ textTransform: 'none', color: '#888' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDeleteStudent} disabled={saving}
            sx={{ bgcolor: '#c62828', '&:hover': { bgcolor: '#b71c1c' }, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3500}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          sx={{ borderRadius: '10px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentFeeTab;
