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
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
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
  Close,
  Phone,
  WhatsApp,
  School,
  FileDownload
} from '@mui/icons-material';

import { exportEnquiriesToExcel, exportEnquiriesToPDF } from '../utils/exportUtils';

import {
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getAllEnquiries
} from '../services/classEnquiryService';

// ── Constants ─────────────────────────────────────────────────────────────────

const COURSES = [
  { value: 'astrology', label: 'Astrology' },
  { value: 'vastu',     label: 'Vastu' },
  { value: 'both',      label: 'Both (Astrology & Vastu)' }
];

const BATCHES = [
  { value: 'jan_jun',     label: 'January – June' },
  { value: 'jul_dec',     label: 'July – December' },
  { value: 'not_decided', label: 'Not Decided' }
];

const STATUSES = [
  { value: 'interested',     label: 'Interested',      bgcolor: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
  { value: 'joined',         label: 'Joined',           bgcolor: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' },
  { value: 'not_responding', label: 'Not Responding',   bgcolor: '#F5F5F5', color: '#616161', border: '#BDBDBD' }
];

const statusMeta = (val) => STATUSES.find(s => s.value === val) || STATUSES[0];
const courseMeta = (val) => COURSES.find(c => c.value === val);
const batchMeta  = (val) => BATCHES.find(b => b.value === val);

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = {
  name:           '',
  phone:          '',
  course:         'astrology',
  batch:          'not_decided',
  note:           '',
  status:         'interested'
};

// ── Component ──────────────────────────────────────────────────────────────────

const ClassEnquiryTab = () => {
  const [enquiries, setEnquiries]   = useState([]);
  const [loading, setLoading]       = useState(true);

  // search / filter
  const [search, setSearch]           = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBatch, setFilterBatch]   = useState('all');

  // form
  const [formOpen, setFormOpen]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);

  // delete
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting]           = useState(false);

  // snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [exportAnchor, setExportAnchor] = useState(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllEnquiries();
      setEnquiries(data);
    } catch {
      showSnackbar('Error loading enquiries', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEnquiries(); }, [loadEnquiries]);

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── Form helpers ─────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (enq) => {
    setEditingId(enq.id);
    setForm({
      name:   enq.name   || '',
      phone:  enq.phone  || '',
      course: enq.course || 'astrology',
      batch:  enq.batch  || 'not_decided',
      note:   enq.note   || '',
      status: enq.status || 'interested'
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim())  errors.name  = 'Name is required';
    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name:   form.name.trim(),
        phone:  form.phone.trim(),
        course: form.course,
        batch:  form.batch,
        note:   form.note.trim(),
        status: form.status
      };
      if (editingId) {
        const updated = await updateEnquiry(editingId, payload);
        setEnquiries(prev => prev.map(e => e.id === editingId ? { ...e, ...updated } : e));
        showSnackbar('Enquiry updated');
      } else {
        const created = await createEnquiry(payload);
        setEnquiries(prev => [created, ...prev]);
        showSnackbar('Enquiry added');
      }
      setFormOpen(false);
    } catch {
      showSnackbar('Error saving enquiry', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Quick status update (inline) ─────────────────────────────────────────────

  const handleStatusChange = async (enq, newStatus) => {
    try {
      await updateEnquiry(enq.id, { ...enq, status: newStatus });
      setEnquiries(prev => prev.map(e => e.id === enq.id ? { ...e, status: newStatus } : e));
      showSnackbar('Status updated');
    } catch {
      showSnackbar('Error updating status', 'error');
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteEnquiry(deleteConfirm.id);
      setEnquiries(prev => prev.filter(e => e.id !== deleteConfirm.id));
      showSnackbar('Enquiry deleted');
    } catch {
      showSnackbar('Error deleting', 'error');
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, id: null });
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────────

  const filtered = enquiries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.name?.toLowerCase().includes(q) || e.phone?.includes(search);
    const matchCourse = filterCourse === 'all' || e.course === filterCourse;
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchBatch  = filterBatch  === 'all' || e.batch  === filterBatch;
    return matchSearch && matchCourse && matchStatus && matchBatch;
  });

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = {
    total:         enquiries.length,
    interested:    enquiries.filter(e => e.status === 'interested').length,
    joined:        enquiries.filter(e => e.status === 'joined').length,
    notResponding: enquiries.filter(e => e.status === 'not_responding').length
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)',
        borderRadius: '16px', p: { xs: 2.5, sm: 3.5 }, mb: 3,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 2
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <School sx={{ color: '#90CAF9', fontSize: 28 }} />
            <Typography variant="h5" sx={{
              fontFamily: '"Spectral", Georgia, serif', fontWeight: 700,
              color: '#E3F2FD', letterSpacing: '0.01em'
            }}>
              Class Enquiries – Astrology & Vastu
            </Typography>
          </Box>

          {/* Stats row */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
            {[
              { label: 'Total',         val: stats.total,         bg: 'rgba(255,255,255,0.15)', col: '#E3F2FD' },
              { label: 'Interested',    val: stats.interested,    bg: 'rgba(21,101,192,0.5)',   col: '#90CAF9' },
              { label: 'Joined',        val: stats.joined,        bg: 'rgba(46,125,50,0.5)',    col: '#A5D6A7' },
              { label: 'Not Responding',val: stats.notResponding, bg: 'rgba(97,97,97,0.5)',     col: '#EEEEEE' }
            ].map(s => (
              <Box key={s.label} sx={{
                bgcolor: s.bg, borderRadius: '10px', px: 1.5, py: 0.6,
                display: 'flex', alignItems: 'center', gap: 0.8
              }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: s.col, lineHeight: 1 }}>{s.val}</Typography>
                <Typography variant="caption" sx={{ color: s.col, opacity: 0.85, fontWeight: 500 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={e => setExportAnchor(e.currentTarget)}
            sx={{
              borderRadius: '12px', fontWeight: 700, px: 2.5, py: 1.2,
              borderColor: 'rgba(255,255,255,0.4)', color: '#90CAF9',
              '&:hover': { borderColor: '#90CAF9', bgcolor: 'rgba(255,255,255,0.08)' }
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
            <MenuItem onClick={() => { exportEnquiriesToExcel(filtered, 'class_enquiries'); setExportAnchor(null); }}
              sx={{ py: 1.5, px: 2.5, fontWeight: 600, gap: 1.5, '&:hover': { bgcolor: 'rgba(26,35,126,0.08)' } }}>
              <FileDownload fontSize="small" sx={{ color: '#3949AB' }} /> Export to Excel
            </MenuItem>
            <MenuItem onClick={() => { exportEnquiriesToPDF(filtered, 'Class Enquiries – Astrology & Vastu'); setExportAnchor(null); }}
              sx={{ py: 1.5, px: 2.5, fontWeight: 600, gap: 1.5, '&:hover': { bgcolor: 'rgba(26,35,126,0.08)' } }}>
              <FileDownload fontSize="small" sx={{ color: '#3949AB' }} /> Export to PDF
            </MenuItem>
          </Menu>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}
            sx={{
              background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C00 100%)',
              borderRadius: '12px', fontWeight: 700, px: 3, py: 1.2,
              boxShadow: '0 4px 14px rgba(255,140,0,0.45)',
              '&:hover': { background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)' }
            }}>
            Add Enquiry
          </Button>
        </Box>
      </Box>

      {/* ── Search + Filters ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5, alignItems: 'center' }}>
        <TextField
          placeholder="Search by name or phone…"
          value={search} onChange={e => setSearch(e.target.value)}
          size="small" sx={{ flexGrow: 1, minWidth: 200 }}
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FilterList sx={{ color: '#6B5B47', fontSize: 18 }} />
          <ToggleButtonGroup value={filterStatus} exclusive size="small"
            onChange={(_, v) => v && setFilterStatus(v)}
            sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontWeight: 600, fontSize: '0.75rem', borderRadius: '8px !important', border: '1px solid rgba(0,0,0,0.12) !important', mx: 0.2 } }}>
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="interested" sx={{ '&.Mui-selected': { bgcolor: '#1565C0 !important', color: 'white' } }}>Interested</ToggleButton>
            <ToggleButton value="joined"     sx={{ '&.Mui-selected': { bgcolor: '#2E7D32 !important', color: 'white' } }}>Joined</ToggleButton>
            <ToggleButton value="not_responding" sx={{ '&.Mui-selected': { bgcolor: '#616161 !important', color: 'white' } }}>Not Responding</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Course</InputLabel>
            <Select value={filterCourse} label="Course" onChange={e => setFilterCourse(e.target.value)} sx={{ borderRadius: '10px' }}>
              <MenuItem value="all">All Courses</MenuItem>
              {COURSES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 145 }}>
            <InputLabel>Batch</InputLabel>
            <Select value={filterBatch} label="Batch" onChange={e => setFilterBatch(e.target.value)} sx={{ borderRadius: '10px' }}>
              <MenuItem value="all">All Batches</MenuItem>
              {BATCHES.map(b => <MenuItem key={b.value} value={b.value}>{b.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* ── Table ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#3949AB' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: '#A1887F' }}>
          <School sx={{ fontSize: 48, color: '#C5CAE9', mb: 1 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>No enquiries found</Typography>
          <Typography variant="body2">
            {search || filterStatus !== 'all' || filterCourse !== 'all' || filterBatch !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Click "Add Enquiry" to record the first enquiry.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0}
          sx={{ borderRadius: '14px', border: '1px solid rgba(26,35,126,0.1)', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F3F4FD' }}>
                {['#', 'Name', 'Phone', 'Course', 'Batch', 'Status', 'Note', 'Contact', ''].map((h, i) => (
                  <TableCell key={i} align={i === 8 ? 'right' : 'left'}
                    sx={{
                      fontWeight: 700, color: '#283593', fontSize: '0.82rem', py: 1.5, whiteSpace: 'nowrap',
                      display: (i === 4 || i === 6) ? { xs: 'none', md: 'table-cell' } : undefined
                    }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((enq, idx) => {
                const sm = statusMeta(enq.status);
                return (
                  <TableRow key={enq.id} sx={{ '&:hover': { bgcolor: 'rgba(26,35,126,0.03)' }, transition: 'background 0.15s' }}>
                    <TableCell sx={{ color: '#7986CB', fontWeight: 600, fontSize: '0.8rem', py: 1.4 }}>{idx + 1}</TableCell>

                    <TableCell sx={{ fontWeight: 600, color: '#1A237E', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                      {enq.name}
                    </TableCell>

                    <TableCell sx={{ color: '#3949AB', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {enq.phone}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={courseMeta(enq.course)?.label || enq.course}
                        size="small"
                        sx={{
                          fontWeight: 600, fontSize: '0.72rem',
                          bgcolor: enq.course === 'both' ? '#EDE7F6' : enq.course === 'astrology' ? '#E8EAF6' : '#E0F2F1',
                          color:   enq.course === 'both' ? '#4527A0' : enq.course === 'astrology' ? '#283593' : '#00695C',
                          border:  `1px solid ${enq.course === 'both' ? '#B39DDB' : enq.course === 'astrology' ? '#9FA8DA' : '#80CBC4'}`
                        }}
                      />
                    </TableCell>

                    {/* Batch — hidden on mobile */}
                    <TableCell sx={{ fontSize: '0.82rem', color: '#5C6BC0', display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>
                      {batchMeta(enq.batch)?.label || '—'}
                    </TableCell>

                    {/* Status — inline dropdown */}
                    <TableCell>
                      <Select
                        value={enq.status}
                        size="small"
                        onChange={e => handleStatusChange(enq, e.target.value)}
                        sx={{
                          fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px',
                          bgcolor: sm.bgcolor, color: sm.color,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: sm.border },
                          '& .MuiSelect-icon': { color: sm.color },
                          minWidth: 130, height: 30
                        }}
                      >
                        {STATUSES.map(s => (
                          <MenuItem key={s.value} value={s.value}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: s.color, fontSize: '0.78rem' }}>
                              {s.label}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>

                    {/* Note — hidden on mobile */}
                    <TableCell sx={{
                      color: '#795548', fontSize: '0.82rem', maxWidth: 160,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: { xs: 'none', md: 'table-cell' }
                    }}>
                      {enq.note || '—'}
                    </TableCell>

                    {/* Contact buttons */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={`Call ${enq.phone}`}>
                        <IconButton
                          size="small"
                          component="a"
                          href={`tel:${enq.phone}`}
                          sx={{
                            color: '#1565C0',
                            bgcolor: '#E3F2FD',
                            borderRadius: '8px',
                            width: 30, height: 30,
                            '&:hover': { bgcolor: '#BBDEFB' }
                          }}
                        >
                          <Phone sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={`WhatsApp ${enq.phone}`}>
                        <IconButton
                          size="small"
                          component="a"
                          href={`https://wa.me/91${enq.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: '#2E7D32',
                            bgcolor: '#E8F5E9',
                            borderRadius: '8px',
                            width: 30, height: 30,
                            ml: 0.7,
                            '&:hover': { bgcolor: '#C8E6C9' }
                          }}
                        >
                          <WhatsApp sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>

                    {/* Edit / Delete */}
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(enq)}
                          sx={{ color: '#FF8C00', '&:hover': { bgcolor: 'rgba(255,140,0,0.1)' } }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteConfirm({ open: true, id: enq.id })}
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

      {/* ── Add / Edit dialog ── */}
      <Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' } }}>

        <DialogTitle sx={{
          fontFamily: '"Spectral", Georgia, serif', fontWeight: 700,
          fontSize: '1.2rem', color: '#1A237E', pt: 3, pb: 0.5, px: 3
        }}>
          {editingId ? 'Edit Enquiry' : 'New Class Enquiry'}
        </DialogTitle>
        <Typography variant="body2" sx={{ px: 3, color: '#7986CB', mb: 1, fontWeight: 500 }}>
          Astrology & Vastu Classes
        </Typography>

        <DialogContent sx={{ pt: 1.5, pb: 1, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Name */}
            <TextField label="Name" value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              error={!!formErrors.name} helperText={formErrors.name} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#7986CB', fontSize: 20 }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            {/* Phone */}
            <TextField label="Phone Number" value={form.phone}
              onChange={e => { const d = e.target.value.replace(/\D/g, ''); handleChange('phone', d.length > 10 ? d.slice(-10) : d); }}
              error={!!formErrors.phone} helperText={formErrors.phone}
              fullWidth inputProps={{ inputMode: 'numeric' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ color: '#7986CB', fontSize: 20 }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            {/* Course + Batch */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Interested Course</InputLabel>
                <Select value={form.course} label="Interested Course"
                  onChange={e => handleChange('course', e.target.value)} sx={{ borderRadius: '10px' }}>
                  {COURSES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Preferred Batch</InputLabel>
                <Select value={form.batch} label="Preferred Batch"
                  onChange={e => handleChange('batch', e.target.value)} sx={{ borderRadius: '10px' }}>
                  {BATCHES.map(b => <MenuItem key={b.value} value={b.value}>{b.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 0.5 }} />

            {/* Status */}
            <FormControl fullWidth>
              <InputLabel>Enquiry Status</InputLabel>
              <Select value={form.status} label="Enquiry Status"
                onChange={e => handleChange('status', e.target.value)} sx={{ borderRadius: '10px' }}>
                {STATUSES.map(s => (
                  <MenuItem key={s.value} value={s.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
                      {s.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Note */}
            <TextField label="Note / Remarks" value={form.note}
              onChange={e => handleChange('note', e.target.value)}
              fullWidth multiline rows={2}
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><NoteOutlined sx={{ color: '#7986CB', fontSize: 20 }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
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
              background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #283593 0%, #3949AB 100%)' }
            }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (editingId ? 'Update' : 'Save Enquiry')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={deleteConfirm.open} onClose={() => !deleting && setDeleteConfirm({ open: false, id: null })}
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#1A237E' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this enquiry? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })} disabled={deleting}
            sx={{ borderRadius: '10px', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} disabled={deleting}
            sx={{ borderRadius: '10px', fontWeight: 700 }}>
            {deleting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
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

export default ClassEnquiryTab;
