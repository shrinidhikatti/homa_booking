import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { TIME_SLOTS } from '../config/constants';

// Format helpers
const formatDate = (date) => {
  if (!date) return '';
  const dateObj = date?.toDate ? date.toDate() : new Date(date);
  return format(dateObj, 'dd MMM yyyy');
};

const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
};

const getSlotLabel = (slotId) => {
  const slot = TIME_SLOTS.find(s => s.id === slotId);
  return slot?.label.split(' ')[0] || slotId;
};

// Export bookings to Excel
export const exportToExcel = (bookings, filename = 'homa_bookings') => {
  const data = bookings.map(booking => ({
    'Date': formatDate(booking.date),
    'Time Slot': getSlotLabel(booking.slot),
    'Client Name': booking.clientName,
    'Contact': booking.clientPhone,
    'Homa Type': booking.homaType,
    'Purohit': booking.purohitName || '-',
    'Total Amount': booking.totalAmount || 0,
    'Advance Paid': booking.advanceAmount || 0,
    'Balance': booking.remainingAmount || 0,
    'Status': booking.status,
    'Gotra': booking.gotra || '-',
    'Sankalpa': booking.sankalpa || '-',
    'Venue': booking.venueAddress || '-',
    'Notes': booking.notes || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  // Set column widths
  const columnWidths = [
    { wch: 12 }, // Date
    { wch: 10 }, // Slot
    { wch: 20 }, // Client
    { wch: 12 }, // Contact
    { wch: 20 }, // Homa Type
    { wch: 15 }, // Purohit
    { wch: 12 }, // Total
    { wch: 12 }, // Advance
    { wch: 12 }, // Balance
    { wch: 10 }, // Status
    { wch: 15 }, // Gotra
    { wch: 15 }, // Sankalpa
    { wch: 25 }, // Venue
    { wch: 30 }  // Notes
  ];
  worksheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
  XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export monthly report to Excel
export const exportMonthlyReportToExcel = (bookings, purohitStats, stats, monthYear) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Monthly Report', monthYear],
    [''],
    ['Total Bookings', stats.totalBookings],
    ['Completed', stats.completed],
    ['Pending', stats.pending],
    ['Booked', stats.booked],
    ['Cancelled', stats.cancelled],
    [''],
    ['Total Amount', stats.totalAmount],
    ['Advance Received', stats.totalAdvance],
    ['Balance Pending', stats.totalRemaining],
    ['Completed Value', stats.completedAmount]
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Bookings Sheet
  const bookingsData = bookings.map(booking => ({
    'Date': formatDate(booking.date),
    'Slot': getSlotLabel(booking.slot),
    'Client': booking.clientName,
    'Phone': booking.clientPhone,
    'Homa Type': booking.homaType,
    'Purohit': booking.purohitName || '-',
    'Total': booking.totalAmount || 0,
    'Advance': booking.advanceAmount || 0,
    'Balance': booking.remainingAmount || 0,
    'Status': booking.status
  }));
  const bookingsSheet = XLSX.utils.json_to_sheet(bookingsData);
  XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Bookings');

  // Purohit Report Sheet
  const purohitData = purohitStats.map(p => ({
    'Purohit Name': p.name,
    'Total Assigned': p.count,
    'Completed': p.completed,
    'Completed Amount': p.totalAmount
  }));
  const purohitSheet = XLSX.utils.json_to_sheet(purohitData);
  XLSX.utils.book_append_sheet(workbook, purohitSheet, 'Purohit Report');

  XLSX.writeFile(workbook, `monthly_report_${monthYear.replace(' ', '_')}.xlsx`);
};

// Export bookings to PDF
export const exportToPDF = (bookings, title = 'Homa Bookings Report') => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 27);

  // Table data
  const tableData = bookings.map(booking => [
    formatDate(booking.date),
    getSlotLabel(booking.slot),
    booking.clientName,
    booking.clientPhone,
    booking.homaType,
    booking.purohitName || '-',
    formatCurrency(booking.totalAmount),
    formatCurrency(booking.advanceAmount),
    formatCurrency(booking.remainingAmount),
    booking.status
  ]);

  doc.autoTable({
    startY: 32,
    head: [[
      'Date', 'Slot', 'Client', 'Phone', 'Homa Type',
      'Purohit', 'Total', 'Advance', 'Balance', 'Status'
    ]],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  doc.save(`homa_bookings_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export monthly report to PDF
export const exportMonthlyReportToPDF = (bookings, purohitStats, stats, monthYear) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Title
  doc.setFontSize(20);
  doc.text('Monthly Report', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(monthYear, 105, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 105, 35, { align: 'center' });

  // Summary Section
  doc.setFontSize(12);
  doc.text('Summary', 14, 48);

  const summaryData = [
    ['Total Bookings', stats.totalBookings.toString()],
    ['Completed', stats.completed.toString()],
    ['Pending', stats.pending.toString()],
    ['Booked', stats.booked.toString()],
    ['Cancelled', stats.cancelled.toString()],
    ['Total Amount', formatCurrency(stats.totalAmount)],
    ['Advance Received', formatCurrency(stats.totalAdvance)],
    ['Balance Pending', formatCurrency(stats.totalRemaining)],
    ['Completed Value', formatCurrency(stats.completedAmount)]
  ];

  doc.autoTable({
    startY: 52,
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 40 }
    }
  });

  // Purohit Report
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('Purohit-wise Report', 14, finalY);

  const purohitData = purohitStats.map(p => [
    p.name,
    p.count.toString(),
    p.completed.toString(),
    formatCurrency(p.totalAmount)
  ]);

  // Add totals row
  purohitData.push([
    'Total',
    purohitStats.reduce((sum, p) => sum + p.count, 0).toString(),
    purohitStats.reduce((sum, p) => sum + p.completed, 0).toString(),
    formatCurrency(purohitStats.reduce((sum, p) => sum + p.totalAmount, 0))
  ]);

  doc.autoTable({
    startY: finalY + 4,
    head: [['Purohit Name', 'Total Assigned', 'Completed', 'Amount']],
    body: purohitData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [63, 81, 181] },
    footStyles: { fontStyle: 'bold' }
  });

  doc.save(`monthly_report_${monthYear.replace(' ', '_')}.pdf`);
};

// Export single booking details to PDF
export const exportBookingDetailsPDF = (booking) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFontSize(20);
  doc.text('Homa Booking Details', 105, 20, { align: 'center' });

  let y = 40;
  const lineHeight = 10;

  const addField = (label, value) => {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, 20, y);
    doc.setFont(undefined, 'normal');
    doc.text(value || '-', 70, y);
    y += lineHeight;
  };

  addField('Booking ID', booking.id);
  addField('Date', formatDate(booking.date));
  addField('Time Slot', getSlotLabel(booking.slot));
  addField('Client Name', booking.clientName);
  addField('Contact', booking.clientPhone);
  addField('Homa Type', booking.homaType);
  addField('Purohit', booking.purohitName);
  addField('Status', booking.status.toUpperCase());

  y += 5;
  doc.line(20, y, 190, y);
  y += 10;

  addField('Total Amount', formatCurrency(booking.totalAmount));
  addField('Advance Paid', formatCurrency(booking.advanceAmount));
  addField('Balance Due', formatCurrency(booking.remainingAmount));

  y += 5;
  doc.line(20, y, 190, y);
  y += 10;

  addField('Gotra', booking.gotra);
  addField('Sankalpa', booking.sankalpa);
  addField('Venue', booking.venueAddress);

  if (booking.notes) {
    y += 5;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 20, y);
    y += lineHeight;
    doc.setFont(undefined, 'normal');
    const splitNotes = doc.splitTextToSize(booking.notes, 150);
    doc.text(splitNotes, 20, y);
  }

  doc.save(`booking_${booking.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
