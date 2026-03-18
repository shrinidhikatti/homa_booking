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
  IconButton,
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
  TablePagination
} from '@mui/material';
import {
  Add,
  Close,
  WhatsApp,
  PersonAdd,
  CheckCircle,
  Cancel,
  HourglassEmpty
} from '@mui/icons-material';
import { createWalkIn, updateWalkInWhatsappStatus, getWalkIns } from '../services/walkInService';
import { sendWalkInWelcome, sendWhatsAppViaWeb } from '../services/msg91Service';

const emptyForm = { clientName: '', mobileNumber: '', notes: '' };

const WalkInTab = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWalkIns();
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const validate = () => {
    const errs = {};
    if (!form.clientName.trim()) errs.clientName = 'Name is required';
    if (!form.mobileNumber.trim()) {
      errs.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(form.mobileNumber.replace(/\D/g, ''))) {
      errs.mobileNumber = 'Enter a valid 10-digit mobile number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const entry = await createWalkIn({
        clientName: form.clientName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        notes: form.notes.trim()
      });

      setEntries(prev => [entry, ...prev]);
      setPage(0);
      setDialogOpen(false);
      setForm(emptyForm);

      // Send WhatsApp welcome
      setSnackbar({ open: true, message: 'Walk-in saved! Sending WhatsApp welcome...', severity: 'info' });

      const result = await sendWalkInWelcome(form.mobileNumber.trim(), form.clientName.trim());
      const status = result?.success ? 'sent' : 'failed';
      await updateWalkInWhatsappStatus(entry.id, status);

      setEntries(prev =>
        prev.map(e => e.id === entry.id ? { ...e, whatsappStatus: status } : e)
      );

      if (result?.success) {
        setSnackbar({ open: true, message: `WhatsApp welcome sent to ${form.clientName}!`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Walk-in saved. WhatsApp message failed — use the WhatsApp button to send manually.', severity: 'warning' });
      }
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Error saving walk-in entry.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppWeb = (entry) => {
    const message =
      `Hello ${entry.clientName}! 🙏 Thank you for visiting us at Homa Booking. ` +
      `We are delighted to have you here. Feel free to contact us for any assistance. 🪔`;
    sendWhatsAppViaWeb(entry.mobileNumber, message);
  };

  const statusChip = (status) => {
    if (status === 'sent') return <Chip icon={<CheckCircle />} label="Sent" color="success" size="small" />;
    if (status === 'failed') return <Chip icon={<Cancel />} label="Failed" color="error" size="small" />;
    return <Chip icon={<HourglassEmpty />} label="Pending" size="small" />;
  };

  const formatDateTime = (ts) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAdd sx={{ color: '#8B4513', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#3E2723' }}>
              Walk-in Entry
            </Typography>
            <Typography variant="body2" sx={{ color: '#795548' }}>
              Record walk-in clients and send WhatsApp welcome
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setForm(emptyForm); setErrors({}); setDialogOpen(true); }}
          sx={{
            background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
            borderRadius: '10px',
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5
          }}
        >
          Add Walk-in
        </Button>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#8B4513' }} />
        </Box>
      ) : entries.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: '#9E9E9E' }}>
          <PersonAdd sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <Typography>No walk-in entries yet. Click "Add Walk-in" to record one.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#FFF8F0' }}>
                <TableCell sx={{ fontWeight: 700, color: '#5D4037' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#5D4037' }}>Client Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#5D4037' }}>Mobile</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#5D4037' }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#5D4037' }}>WhatsApp</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#5D4037' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell sx={{ fontSize: '0.82rem', color: '#616161', whiteSpace: 'nowrap' }}>
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#3E2723' }}>{entry.clientName}</TableCell>
                  <TableCell>{entry.mobileNumber}</TableCell>
                  <TableCell sx={{ color: '#616161', maxWidth: 200 }}>
                    {entry.notes || '-'}
                  </TableCell>
                  <TableCell>{statusChip(entry.whatsappStatus)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Send WhatsApp manually">
                      <IconButton
                        size="small"
                        onClick={() => handleWhatsAppWeb(entry)}
                        sx={{ color: '#25D366' }}
                      >
                        <WhatsApp fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={entries.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
          />
        </TableContainer>
      )}

      {/* Add Walk-in Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>New Walk-in Entry</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}>
            <TextField
              label="Client Name *"
              value={form.clientName}
              onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))}
              error={!!errors.clientName}
              helperText={errors.clientName}
              fullWidth
              autoFocus
            />
            <TextField
              label="Mobile Number *"
              value={form.mobileNumber}
              onChange={e => setForm(p => ({ ...p, mobileNumber: e.target.value }))}
              error={!!errors.mobileNumber}
              helperText={errors.mobileNumber || 'WhatsApp welcome will be sent to this number'}
              fullWidth
              inputProps={{ maxLength: 10 }}
              placeholder="10-digit mobile number"
            />
            <TextField
              label="Notes (optional)"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              placeholder="Purpose of visit, interested services, etc."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <WhatsApp />}
            sx={{
              background: 'linear-gradient(135deg, #FF6B00, #FF8C00)',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {saving ? 'Saving...' : 'Save & Send WhatsApp'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WalkInTab;
