import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  listPlots,
  listTransactions,
  getDashboardSummary,
  getPlot,
} from '../services/api';

// Use ASCII "Rs." instead of ₹ since default jsPDF Helvetica font cannot render the rupee glyph.
const fmtINR = (n) => {
  const v = Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs. ${v}`;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const todayStamp = () =>
  new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const PRIMARY = [30, 58, 52]; // #1E3A34
const MUTED = [107, 114, 128];

const writeHeader = (doc, title, subtitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PLOT LEDGER', 14, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Real Estate Expense Tracker', 14, 14);
  doc.text(`Generated: ${todayStamp()}`, pageWidth - 14, 14, { align: 'right' });

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, 14, 34);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(subtitle, 14, 40);
  }
};

const addFooter = (doc) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: 'right' },
    );
    doc.text('Plot Ledger', 14, pageHeight - 8);
  }
};

const buildKVTable = (doc, startY, rows) => {
  autoTable(doc, {
    startY,
    body: rows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: MUTED, cellWidth: 60 },
      1: { halign: 'right', fontStyle: 'bold' },
    },
  });
  return doc.lastAutoTable.finalY;
};

const buildBreakdown = (doc, startY, title, data) => {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return startY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(title, 14, startY + 4);
  autoTable(doc, {
    startY: startY + 7,
    head: [['Name', 'Amount']],
    body: entries.map(([k, v]) => [k, fmtINR(v)]),
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });
  return doc.lastAutoTable.finalY + 6;
};

const buildPlotsTable = (doc, startY, plots) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('Plots Overview', 14, startY + 4);
  autoTable(doc, {
    startY: startY + 7,
    head: [
      [
        'Name',
        'Mauja',
        'Kisam',
        'Size (sqft)',
        'Final Total',
        'Paid',
        'Pending',
      ],
    ],
    body: plots.map((p) => [
      p.plot_name,
      p.mauja,
      p.kisam || 'Other',
      Number(p.plot_size_sqft).toLocaleString('en-IN'),
      fmtINR(p.final_total_cost),
      fmtINR(p.total_paid),
      fmtINR(p.pending_amount),
    ]),
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });
  return doc.lastAutoTable.finalY + 6;
};

const buildTxnsTable = (doc, startY, txns, plotMap = null) => {
  if (!txns.length) return startY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(plotMap ? 'All Transactions' : 'Transactions', 14, startY + 4);
  const head = plotMap
    ? [['Date', 'Plot', 'Person', 'Type', 'Mode', 'Bank', 'Notes', 'Amount']]
    : [['Date', 'Person', 'Type', 'Mode', 'Bank', 'Notes', 'Amount']];

  autoTable(doc, {
    startY: startY + 7,
    head,
    body: txns.map((t) => {
      const sign = t.transaction_type === 'Withdrawal' ? '-' : '+';
      const row = [
        fmtDate(t.created_at),
        t.person,
        t.transaction_type,
        t.payment_mode,
        t.bank,
        t.notes || '-',
        `${sign}${fmtINR(t.amount)}`,
      ];
      if (plotMap) row.splice(1, 0, plotMap[t.plot_id] || '-');
      return row;
    }),
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      [plotMap ? 7 : 6]: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });
  return doc.lastAutoTable.finalY + 6;
};

export const exportFullLedger = async () => {
  const [plots, txns, summary] = await Promise.all([
    listPlots(),
    listTransactions(),
    getDashboardSummary(),
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  writeHeader(doc, 'Full Ledger Report', `${plots.length} plots · ${txns.length} transactions`);

  let y = 46;
  y = buildKVTable(doc, y, [
    ['Total Final Cost', fmtINR(summary.total_final_cost)],
    ['Total Paid', fmtINR(summary.total_paid)],
    ['Total Withdrawn', fmtINR(summary.total_withdrawn)],
    ['Pending', fmtINR(summary.pending_amount)],
    ['Online + UPI', fmtINR(summary.online_total)],
    ['Cash + ATM', fmtINR(summary.cash_total)],
  ]);
  y += 4;
  y = buildPlotsTable(doc, y, plots);
  y = buildBreakdown(doc, y, 'Person-wise Contributions', summary.person_totals);
  y = buildBreakdown(doc, y, 'Bank-wise Outflows', summary.bank_totals);

  const plotMap = Object.fromEntries(plots.map((p) => [p.id, p.plot_name]));
  buildTxnsTable(doc, y, txns, plotMap);

  addFooter(doc);
  const ts = new Date().toISOString().slice(0, 10);
  doc.save(`plot-ledger-full-${ts}.pdf`);
};

export const exportPlotReport = async (plotId) => {
  const [plot, txns] = await Promise.all([
    getPlot(plotId),
    listTransactions(plotId),
  ]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  writeHeader(
    doc,
    plot.plot_name,
    `${plot.mauja} · ${plot.kisam || 'Other'} · ${Number(plot.plot_size_sqft).toLocaleString('en-IN')} sqft`,
  );

  let y = 48;
  y = buildKVTable(doc, y, [
    ['Plot Size', `${Number(plot.plot_size_sqft).toLocaleString('en-IN')} sqft`],
    ['Buying Price / sqft', fmtINR(plot.buying_price_per_sqft)],
    ['Govt Valuation / sqft', fmtINR(plot.govt_valuation_per_sqft)],
    ['Plot Cost', fmtINR(plot.plot_cost)],
    ['Government Value', fmtINR(plot.govt_value)],
    ['Registration Base (max)', fmtINR(plot.registration_base)],
    [`Registration Fee @ ${plot.registration_percentage}%`, fmtINR(plot.registration_fee)],
    ['Other Charges', fmtINR(plot.other_charges)],
    ['Final Total Cost', fmtINR(plot.final_total_cost)],
    ['Total Paid', fmtINR(plot.total_paid)],
    ['Total Withdrawn', fmtINR(plot.total_withdrawn || 0)],
    ['Pending Amount', fmtINR(plot.pending_amount)],
  ]);
  y += 4;

  // Per-plot person & bank breakdown
  const PAID = ['Plot Payment', 'Advance', 'Registration', 'Documentation'];
  const personTotals = {};
  const bankTotals = {};
  for (const t of txns) {
    if (PAID.includes(t.transaction_type)) {
      personTotals[t.person] =
        (personTotals[t.person] || 0) + Number(t.amount || 0);
      bankTotals[t.bank] = (bankTotals[t.bank] || 0) + Number(t.amount || 0);
    }
  }
  y = buildBreakdown(doc, y, 'Person-wise', personTotals);
  y = buildBreakdown(doc, y, 'Bank-wise', bankTotals);
  buildTxnsTable(doc, y, txns);

  addFooter(doc);
  const safe = plot.plot_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const ts = new Date().toISOString().slice(0, 10);
  doc.save(`plot-${safe}-${ts}.pdf`);
};
