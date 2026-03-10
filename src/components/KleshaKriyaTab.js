import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Divider,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Menu
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  PersonOutline,
  PhoneOutlined,
  NoteOutlined,
  FilterList,
  CurrencyRupee,
  CalendarMonth,
  Close,
  Phone,
  WhatsApp,
  FileDownload
} from '@mui/icons-material';

import { exportKleshaToExcel, exportKleshaToPDF } from '../utils/exportUtils';

import { getSpecialDay } from '../services/panchangaService';
import {
  createKleshaBooking,
  updateKleshaBooking,
  deleteKleshaBooking,
  getAllKleshaBookings
} from '../services/kleshaService';

// ── Amavasya helpers ────────────────────────────────────────────────────────

/**
 * Find the next Amavasya on or after `startDate`.
 * Scans day-by-day at midnight to match how the calendar tab works.
 */
const findNextAmavasya = (startDate = new Date()) => {
  for (let i = 0; i <= 40; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    d.setHours(0, 0, 0, 0);
    try {
      const special = getSpecialDay(d);
      if (special.some(s => s.includes('Amavasya'))) return d;
    } catch (_) { /* skip */ }
  }
  return null;
};

/**
 * Build a list of the next `count` Amavasya dates starting from today.
 * Each search begins the day after the previous Amavasya to avoid duplicates.
 */
const findUpcomingAmavasyas = (count = 6) => {
  const results = [];
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let n = 0; n < count; n++) {
    const found = findNextAmavasya(cursor);
    if (!found) break;
    results.push(found);
    // skip 25 days ahead — Amavasya tithi can span 2 days, jumping 1 day
    // would re-detect the same Amavasya. Lunar cycle is ~29.5 days so 25
    // days is safely past the current one but before the next.
    cursor = new Date(found);
    cursor.setDate(cursor.getDate() + 25);
  }
  return results;
};

const formatAmavasya = (date) => {
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

const formatAmavasyaShort = (date) => {
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// ── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = {
  clientName: '',
  phone: '',
  note: '',
  paymentStatus: 'balance',  // 'paid' | 'balance'
  paymentMode: 'cash',       // 'cash' | 'phonePe'
  totalAmount: '',
  paidAmount: '',
  amavasyaDate: null         // ISO string of the chosen Amavasya
};

// ── Component ─────────────────────────────────────────────────────────────────

const KleshaKriyaTab = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amavasya, setAmavasya] = useState(null);          // next Amavasya (for header)
  const [amavasyas, setAmavasyas] = useState([]);           // list for selector

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [exportAnchor, setExportAnchor] = useState(null);

  // ── derived amounts ──────────────────────────────────────────────────────────

  const total = Number(form.totalAmount) || 0;
  const paid = Number(form.paidAmount) || 0;
  // if status is 'paid', balance = 0; otherwise balance = total - paid
  const balance = form.paymentStatus === 'paid' ? 0 : Math.max(0, total - paid);

  // ── Load ──────────────────────────────────────────────────────────────────────

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllKleshaBookings();
      setBookings(data);
    } catch {
      showSnackbar('Error loading bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const list = findUpcomingAmavasyas(6);
    setAmavasyas(list);
    if (list.length > 0) setAmavasya(list[0]);
    loadBookings();
  }, [loadBookings]);

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Form helpers ──────────────────────────────────────────────────────────────

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, amavasyaDate: amavasya ? amavasya.toISOString() : null });
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditForm = (booking) => {
    setEditingId(booking.id);
    setForm({
      clientName: booking.clientName || '',
      phone: booking.phone || '',
      note: booking.note || '',
      paymentStatus: booking.paymentStatus || 'balance',
      paymentMode: booking.paymentMode || 'cash',
      totalAmount: booking.totalAmount !== undefined ? String(booking.totalAmount) : '',
      paidAmount: booking.paidAmount !== undefined ? String(booking.paidAmount) : '',
      amavasyaDate: booking.amavasyaDate || (amavasya ? amavasya.toISOString() : null)
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.clientName.trim()) errors.clientName = 'Client name is required';
    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }
    if (form.totalAmount === '' || isNaN(Number(form.totalAmount)) || Number(form.totalAmount) < 0) {
      errors.totalAmount = 'Enter a valid total amount';
    }
    if (form.paymentStatus === 'balance') {
      if (form.paidAmount === '' || isNaN(Number(form.paidAmount)) || Number(form.paidAmount) < 0) {
        errors.paidAmount = 'Enter amount paid so far';
      } else if (Number(form.paidAmount) > Number(form.totalAmount)) {
        errors.paidAmount = 'Paid amount cannot exceed total';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const totalAmt = Number(form.totalAmount) || 0;
      const paidAmt = form.paymentStatus === 'paid' ? totalAmt : (Number(form.paidAmount) || 0);
      const balanceAmt = form.paymentStatus === 'paid' ? 0 : Math.max(0, totalAmt - paidAmt);

      const payload = {
        clientName: form.clientName.trim(),
        phone: form.phone.trim(),
        note: form.note.trim(),
        paymentStatus: form.paymentStatus,
        paymentMode: form.paymentMode,
        totalAmount: totalAmt,
        paidAmount: paidAmt,
        balanceAmount: balanceAmt,
        amavasyaDate: form.amavasyaDate || null
      };

      if (editingId) {
        const updated = await updateKleshaBooking(editingId, payload);
        setBookings(prev => prev.map(b => b.id === editingId ? { ...b, ...updated } : b));
        showSnackbar('Booking updated successfully');
      } else {
        const created = await createKleshaBooking(payload);
        setBookings(prev => [created, ...prev]);
        showSnackbar('Booking added successfully');
      }
      setFormOpen(false);
    } catch {
      showSnackbar('Error saving booking', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteKleshaBooking(deleteConfirm.id);
      setBookings(prev => prev.filter(b => b.id !== deleteConfirm.id));
      showSnackbar('Booking deleted');
    } catch {
      showSnackbar('Error deleting booking', 'error');
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, id: null });
    }
  };

  // ── Contact handlers ─────────────────────────────────────────────────────────

  const handleWhatsAppClick = (booking) => {
    const amavasyaLabel = booking.amavasyaDate
      ? new Date(booking.amavasyaDate).toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })
      : 'the upcoming Amavasya';

    const message =
      `Namaste ${booking.clientName}! 🙏\n\n` +
      `This is a reminder for your *Klesha Nashana Kriya* booking.\n\n` +
      `📅 Date: ${amavasyaLabel}\n` +
      `💰 Payment: ${booking.paymentStatus === 'paid'
        ? 'Paid ✅'
        : `Balance – ₹${Number(booking.balanceAmount || 0).toLocaleString('en-IN')} pending`}\n\n` +
      `Please confirm your attendance.\nThank you! 🙏`;

    window.open(`https://wa.me/91${booking.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePhoneClick = (phone) => {
    window.open(`tel:+91${phone}`, '_self');
  };

  // ── Filtered list ──────────────────────────────────────────────────────────────

  const filtered = bookings.filter(b => {
    const matchesSearch =
      b.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      b.phone?.includes(search);
    const matchesFilter = filterStatus === 'all' || b.paymentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // ── Styling helpers ────────────────────────────────────────────────────────────

  const rowBg = (status) =>
    status === 'paid' ? 'rgba(76,175,80,0.10)' : 'rgba(244,67,54,0.10)';

  const statusChipSx = (status) => ({
    fontWeight: 700,
    fontSize: '0.72rem',
    bgcolor: status === 'paid' ? '#E8F5E9' : '#FFEBEE',
    color: status === 'paid' ? '#2E7D32' : '#C62828',
    border: `1px solid ${status === 'paid' ? '#A5D6A7' : '#EF9A9A'}`
  });

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 100%)',
          borderRadius: '16px',
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontFamily: '"Spectral", Georgia, serif', fontWeight: 700, color: '#FFF8E1', mb: 0.5 }}>
            Klesha Nashana Kriya
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth sx={{ color: '#FFCC80', fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#FFCC80', fontWeight: 500 }}>
              Next Amavasya:&nbsp;
              <span style={{ color: '#FFE082', fontWeight: 700 }}>
                {amavasya ? formatAmavasya(amavasya) : 'Calculating…'}
              </span>
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#A1887F', mt: 0.5, display: 'block' }}>
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
            &nbsp;·&nbsp;{bookings.filter(b => b.paymentStatus === 'paid').length} paid
            &nbsp;·&nbsp;{bookings.filter(b => b.paymentStatus === 'balance').length} balance
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={e => setExportAnchor(e.currentTarget)}
            sx={{
              borderRadius: '12px', fontWeight: 700, px: 2.5, py: 1.2,
              borderColor: 'rgba(255,255,255,0.4)', color: '#FFE082',
              '&:hover': { borderColor: '#FFE082', bgcolor: 'rgba(255,255,255,0.08)' }
            }}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={() => setExportAnchor(null)}
            PaperProps={{ sx: { borderRadius: '12px', mt: 1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180 } }}
          >
            <MenuItem onClick={() => { exportKleshaToExcel(filtered, 'klesha_bookings'); setExportAnchor(null); }}
              sx={{ py: 1.5, px: 2.5, fontWeight: 600, gap: 1.5, '&:hover': { bgcolor: 'rgba(255,140,0,0.08)' } }}>
              <FileDownload fontSize="small" sx={{ color: '#FF8C00' }} /> Export to Excel
            </MenuItem>
            <MenuItem onClick={() => { exportKleshaToPDF(filtered, 'Klesha Nashana Kriya – Bookings'); setExportAnchor(null); }}
              sx={{ py: 1.5, px: 2.5, fontWeight: 600, gap: 1.5, '&:hover': { bgcolor: 'rgba(255,140,0,0.08)' } }}>
              <FileDownload fontSize="small" sx={{ color: '#FF8C00' }} /> Export to PDF
            </MenuItem>
          </Menu>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openAddForm}
            sx={{
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)',
              borderRadius: '12px', fontWeight: 700, px: 3, py: 1.2,
              boxShadow: '0 4px 14px rgba(255,140,0,0.45)',
              '&:hover': { background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }
            }}
          >
            Add Booking
          </Button>
        </Box>
      </Box>

      {/* Search + Filter */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5, alignItems: 'center' }}>
        <TextField
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#A1887F', fontSize: 20 }} /></InputAdornment>,
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}><Close fontSize="small" /></IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: '10px' }
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList sx={{ color: '#6B5B47', fontSize: 20 }} />
          <ToggleButtonGroup
            value={filterStatus} exclusive
            onChange={(_, v) => v && setFilterStatus(v)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2, py: 0.6, fontWeight: 600, fontSize: '0.78rem',
                borderRadius: '8px !important',
                border: '1px solid rgba(139,69,19,0.2) !important', mx: 0.3,
                '&.Mui-selected': { bgcolor: '#8B4513', color: 'white', '&:hover': { bgcolor: '#A0522D' } }
              }
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="paid" sx={{ '&.Mui-selected': { bgcolor: '#2E7D32 !important' } }}>Paid</ToggleButton>
            <ToggleButton value="balance" sx={{ '&.Mui-selected': { bgcolor: '#C62828 !important' } }}>Balance</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#FF8C00' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: '#A1887F' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>No bookings found</Typography>
          <Typography variant="body2">
            {search || filterStatus !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Click "Add Booking" to create the first booking.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0}
          sx={{ borderRadius: '14px', border: '1px solid rgba(139,69,19,0.1)', overflowX: 'auto' }}
        >
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FFF8F0' }}>
                {['#', 'Client Name', 'Phone', 'Amavasya', 'Note', 'Status', 'Total', 'Paid', 'Balance', 'Mode', 'Contact', ''].map((h, i) => (
                  <TableCell key={i}
                    align={i === 11 ? 'right' : 'left'}
                    sx={{
                      fontWeight: 700, color: '#5D4037', fontSize: '0.82rem', py: 1.5, whiteSpace: 'nowrap',
                      display: (i === 3 || i === 4) ? { xs: 'none', md: 'table-cell' } : undefined
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((booking, idx) => {
                const isPaid = booking.paymentStatus === 'paid';
                const balAmt = booking.balanceAmount ?? Math.max(0, (booking.totalAmount || 0) - (booking.paidAmount || 0));
                return (
                  <TableRow key={booking.id}
                    sx={{ bgcolor: rowBg(booking.paymentStatus), '&:hover': { filter: 'brightness(0.96)' }, transition: 'filter 0.15s ease' }}
                  >
                    <TableCell sx={{ color: '#795548', fontWeight: 600, fontSize: '0.8rem', py: 1.4 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2C2418', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{booking.clientName}</TableCell>
                    <TableCell sx={{ color: '#5D4037', fontSize: '0.85rem' }}>{booking.phone}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {booking.amavasyaDate ? (
                        <Chip
                          label={formatAmavasyaShort(new Date(booking.amavasyaDate))}
                          size="small"
                          icon={<CalendarMonth style={{ fontSize: 12 }} />}
                          sx={{ fontSize: '0.72rem', fontWeight: 600, bgcolor: '#FFF3E0', color: '#E65100', border: '1px solid #FFCC80' }}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell sx={{
                      color: '#795548', fontSize: '0.82rem', maxWidth: 140,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: { xs: 'none', md: 'table-cell' }
                    }}>
                      {booking.note || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip label={isPaid ? 'Paid' : 'Balance'} size="small" sx={statusChipSx(booking.paymentStatus)} />
                    </TableCell>
                    {/* Total */}
                    <TableCell sx={{ fontWeight: 600, color: '#2C2418', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {booking.totalAmount !== undefined ? fmt(booking.totalAmount) : '—'}
                    </TableCell>
                    {/* Paid */}
                    <TableCell sx={{ fontWeight: 600, color: '#2E7D32', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {booking.paidAmount !== undefined ? fmt(booking.paidAmount) : '—'}
                    </TableCell>
                    {/* Balance */}
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', color: isPaid ? '#757575' : '#C62828' }}>
                      {isPaid ? '—' : fmt(balAmt)}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#5D4037' }}>
                      {booking.paymentMode === 'phonePe' ? 'PhonePe' : 'Cash'}
                    </TableCell>
                    {/* Call + WhatsApp */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={`Call ${booking.phone}`}>
                        <IconButton size="small" onClick={() => handlePhoneClick(booking.phone)}
                          sx={{ color: '#1565C0', bgcolor: '#E3F2FD', borderRadius: '8px', width: 30, height: 30, '&:hover': { bgcolor: '#BBDEFB' } }}>
                          <Phone sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Send WhatsApp reminder">
                        <IconButton size="small" onClick={() => handleWhatsAppClick(booking)}
                          sx={{ color: '#2E7D32', bgcolor: '#E8F5E9', borderRadius: '8px', width: 30, height: 30, ml: 0.7, '&:hover': { bgcolor: '#C8E6C9' } }}>
                          <WhatsApp sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEditForm(booking)}
                          sx={{ color: '#FF8C00', '&:hover': { bgcolor: 'rgba(255,140,0,0.1)' } }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: booking.id })}
                          sx={{ color: '#EF5350', ml: 0.5, '&:hover': { bgcolor: 'rgba(239,83,80,0.1)' } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Add / Edit form dialog ── */}
      <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' } }}
      >
        <DialogTitle sx={{ fontFamily: '"Spectral", Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: '#3E2723', pb: 0, pt: 3, px: 3 }}>
          {editingId ? 'Edit Booking' : 'New Klesha Nashana Kriya Booking'}
        </DialogTitle>

        {/* Amavasya selector */}
        <Box sx={{ px: 3, pt: 1.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ fontWeight: 600, color: '#E65100' }}>
              Select Amavasya (Month)
            </InputLabel>
            <Select
              value={form.amavasyaDate || ''}
              label="Select Amavasya (Month)"
              onChange={e => handleFormChange('amavasyaDate', e.target.value)}
              sx={{
                borderRadius: '10px',
                bgcolor: '#FFF3E0',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#FFCC80' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#FF8C00' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FF8C00' }
              }}
              startAdornment={
                <InputAdornment position="start">
                  <CalendarMonth sx={{ color: '#FF8C00', fontSize: 18 }} />
                </InputAdornment>
              }
            >
              {amavasyas.length === 0 && (
                <MenuItem disabled value="">Calculating…</MenuItem>
              )}
              {amavasyas.map((d, i) => (
                <MenuItem key={d.toISOString()} value={d.toISOString()}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {i === 0 && (
                      <Chip label="Next" size="small"
                        sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FF8C00', color: 'white', fontWeight: 700 }} />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#E65100' }}>
                      {formatAmavasya(d)}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <DialogContent sx={{ pt: 2, pb: 1, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Client Name */}
            <TextField
              label="Client Name" value={form.clientName}
              onChange={e => handleFormChange('clientName', e.target.value)}
              error={!!formErrors.clientName} helperText={formErrors.clientName}
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#A1887F', fontSize: 20 }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            {/* Phone */}
            <TextField
              label="Phone Number" value={form.phone}
              onChange={e => handleFormChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              error={!!formErrors.phone} helperText={formErrors.phone}
              fullWidth inputProps={{ inputMode: 'numeric' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ color: '#A1887F', fontSize: 20 }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            {/* Note */}
            <TextField
              label="Note / Special Request" value={form.note}
              onChange={e => handleFormChange('note', e.target.value)}
              fullWidth multiline rows={2}
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><NoteOutlined sx={{ color: '#A1887F', fontSize: 20 }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <Divider sx={{ my: 0.5 }} />

            {/* Payment Status + Mode */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select value={form.paymentStatus} label="Payment Status"
                  onChange={e => handleFormChange('paymentStatus', e.target.value)}
                  sx={{ borderRadius: '10px' }}>
                  <MenuItem value="paid">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4CAF50' }} />Paid
                    </Box>
                  </MenuItem>
                  <MenuItem value="balance">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F44336' }} />Balance
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select value={form.paymentMode} label="Payment Mode"
                  onChange={e => handleFormChange('paymentMode', e.target.value)}
                  sx={{ borderRadius: '10px' }}>
                  <MenuItem value="cash">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CurrencyRupee fontSize="small" sx={{ color: '#795548' }} />Cash
                    </Box>
                  </MenuItem>
                  <MenuItem value="phonePe">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontWeight: 800, color: '#5C35CC', fontSize: '0.8rem' }}>Pe</span>PhonePe
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Amount fields */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Total Amount — always shown */}
              <TextField
                label="Total Amount"
                value={form.totalAmount}
                onChange={e => handleFormChange('totalAmount', e.target.value.replace(/\D/g, ''))}
                error={!!formErrors.totalAmount}
                helperText={formErrors.totalAmount}
                fullWidth
                inputProps={{ inputMode: 'numeric' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ color: '#A1887F', fontSize: 20 }} /></InputAdornment>
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              {/* Paid Amount — only when status is 'balance' */}
              {form.paymentStatus === 'balance' && (
                <TextField
                  label="Amount Paid"
                  value={form.paidAmount}
                  onChange={e => handleFormChange('paidAmount', e.target.value.replace(/\D/g, ''))}
                  error={!!formErrors.paidAmount}
                  helperText={formErrors.paidAmount}
                  fullWidth
                  inputProps={{ inputMode: 'numeric' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ color: '#2E7D32', fontSize: 20 }} /></InputAdornment>
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              )}
            </Box>

            {/* Balance preview — only when status is 'balance' and amounts are entered */}
            {form.paymentStatus === 'balance' && total > 0 && (
              <Box sx={{
                bgcolor: balance > 0 ? '#FFEBEE' : '#E8F5E9',
                border: `1px solid ${balance > 0 ? '#EF9A9A' : '#A5D6A7'}`,
                borderRadius: '10px', px: 2, py: 1.2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <Typography variant="body2" sx={{ color: '#5D4037', fontWeight: 500 }}>
                  Balance remaining:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: balance > 0 ? '#C62828' : '#2E7D32' }}>
                  {fmt(balance)}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={() => setFormOpen(false)} disabled={saving}
            sx={{ borderRadius: '10px', color: '#6B5B47', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{
              borderRadius: '10px', fontWeight: 700, px: 3,
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)',
              boxShadow: '0 4px 14px rgba(255,140,0,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }
            }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editingId ? 'Update' : 'Save Booking')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteConfirm.open} onClose={() => !deleting && setDeleteConfirm({ open: false, id: null })}
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#3E2723' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this booking? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })} disabled={deleting}
            sx={{ borderRadius: '10px', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleting}
            sx={{ borderRadius: '10px', fontWeight: 700 }}>
            {deleting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KleshaKriyaTab;
