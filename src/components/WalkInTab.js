import React, { useState, useEffect } from 'react';
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
  HourglassEmpty,
  Reply,
  MarkChatRead
} from '@mui/icons-material';
import {
  createWalkIn,
  updateWalkInWhatsappStatus,
  subscribeWalkIns,
  getChatHistory,
  storeOutgoingMessage,
  markAsReplied
} from '../services/walkInService';
import { sendWalkInWelcome, sendWhatsAppViaWeb, sendWhatsAppReply } from '../services/msg91Service';

const emptyForm = { clientName: '', mobileNumber: '', notes: '' };

const WalkInTab = ({ office }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  // Chat dialog state
  const [replyDialog, setReplyDialog] = useState({ open: false, entry: null, incomingMsg: null });
  const [chatHistory, setChatHistory] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const chatEndRef = React.useRef(null);

  // Real-time listener
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeWalkIns(office, (data) => {
      setEntries(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [office]);

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
        notes: form.notes.trim(),
        office: office || 'General'
      });

      setPage(0);
      setDialogOpen(false);
      setForm(emptyForm);

      setSnackbar({ open: true, message: 'Walk-in saved! Sending WhatsApp welcome...', severity: 'info' });

      const result = await sendWalkInWelcome(form.mobileNumber.trim(), form.clientName.trim());
      const status = result?.success ? 'sent' : 'failed';
      await updateWalkInWhatsappStatus(entry.id, status);

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

  const handleOpenReply = async (entry) => {
    setReplyText('');
    setChatHistory([]);
    setReplyDialog({ open: true, entry, incomingMsg: null });
    setLoadingMsg(true);
    try {
      const history = await getChatHistory(entry.id);
      setChatHistory(history);
      // keep latest incoming msg reference for markAsReplied
      const lastIncoming = [...history].reverse().find(m => m.direction !== 'outgoing');
      setReplyDialog(prev => ({ ...prev, incomingMsg: lastIncoming || null }));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const result = await sendWhatsAppReply(replyDialog.entry.mobileNumber, replyText.trim());
      if (result?.success) {
        // Store outgoing message in chat history
        await storeOutgoingMessage(replyDialog.entry.id, replyText.trim());
        if (replyDialog.incomingMsg) {
          await markAsReplied(replyDialog.incomingMsg.id, replyText.trim());
        }
        await updateWalkInWhatsappStatus(replyDialog.entry.id, 'replied');
        // Refresh chat
        const history = await getChatHistory(replyDialog.entry.id);
        setChatHistory(history);
        setReplyText('');
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        setSnackbar({ open: true, message: 'Reply sent!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to send reply. Try WhatsApp Web instead.', severity: 'error' });
      }
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Error sending reply.', severity: 'error' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleWhatsAppWeb = (entry) => {
    const message =
      `Hello ${entry.clientName}! 🙏 Thank you for visiting us at Homa Booking. ` +
      `We are delighted to have you here. Feel free to contact us for any assistance. 🪔`;
    sendWhatsAppViaWeb(entry.mobileNumber, message);
  };

  const statusChip = (status, entry) => {
    if (status === 'replied') {
      return (
        <Chip
          icon={<MarkChatRead />}
          label="Replied"
          size="small"
          clickable
          onClick={() => handleOpenReply(entry)}
          sx={{
            backgroundColor: '#1565C0', color: '#fff', cursor: 'pointer',
            '& .MuiChip-icon': { color: '#fff' },
            '&:hover': { backgroundColor: '#0D47A1' }
          }}
        />
      );
    }
    if (status === 'replyReceived') {
      return (
        <Chip
          icon={<Reply />}
          label="Reply Received"
          size="small"
          clickable
          onClick={() => handleOpenReply(entry)}
          sx={{
            backgroundColor: '#2E7D32',
            color: '#fff',
            cursor: 'pointer',
            '& .MuiChip-icon': { color: '#fff' },
            '&:hover': { backgroundColor: '#1B5E20' }
          }}
        />
      );
    }
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
              Walk-in Entry {office ? `— ${office}` : ''}
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
                  <TableCell>{statusChip(entry.whatsappStatus, entry)}</TableCell>
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
              onChange={e => { const d = e.target.value.replace(/\D/g, ''); setForm(p => ({ ...p, mobileNumber: d.length > 10 ? d.slice(-10) : d })); }}
              error={!!errors.mobileNumber}
              helperText={errors.mobileNumber || 'WhatsApp welcome will be sent to this number'}
              fullWidth
              inputProps={{ inputMode: 'numeric' }}
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

      {/* Reply Dialog */}
      <Dialog
        open={replyDialog.open}
        onClose={() => { setReplyDialog({ open: false, entry: null, incomingMsg: null }); setReplyText(''); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Reply to {replyDialog.entry?.clientName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#757575' }}>
              +91 {replyDialog.entry?.mobileNumber}
            </Typography>
          </Box>
          <IconButton
            onClick={() => { setReplyDialog({ open: false, entry: null, incomingMsg: null }); setReplyText(''); }}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 1, display: 'flex', flexDirection: 'column', height: 420 }}>
          {/* Chat history */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#ECE5DD',
            borderRadius: '10px',
            p: 1.5,
            mb: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {loadingMsg ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={24} sx={{ color: '#25D366' }} />
              </Box>
            ) : chatHistory.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#757575', textAlign: 'center', mt: 4 }}>
                No messages yet
              </Typography>
            ) : (
              chatHistory.map((msg) => {
                const isOutgoing = msg.direction === 'outgoing';
                const ts = msg.sentAt || msg.receivedAt;
                const time = ts?.toDate ? ts.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <Box key={msg.id} sx={{ display: 'flex', justifyContent: isOutgoing ? 'flex-end' : 'flex-start' }}>
                    <Box sx={{
                      maxWidth: '75%',
                      p: '8px 12px',
                      borderRadius: isOutgoing ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      backgroundColor: isOutgoing ? '#DCF8C6' : '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <Typography variant="body2" sx={{ color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.text}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem', display: 'block', textAlign: 'right', mt: 0.25 }}>
                        {time}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
            <div ref={chatEndRef} />
          </Box>

          {/* Reply input */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Type your reply here..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
              size="small"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => { setReplyDialog({ open: false, entry: null, incomingMsg: null }); setReplyText(''); }}
            disabled={sendingReply}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendReply}
            disabled={sendingReply || !replyText.trim()}
            startIcon={sendingReply ? <CircularProgress size={16} color="inherit" /> : <Reply />}
            sx={{
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {sendingReply ? 'Sending...' : 'Send Reply'}
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
