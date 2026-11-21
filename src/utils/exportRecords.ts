import { jsPDF } from 'jspdf';
import autoTable, { RowInput, Styles } from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: number;
}

export interface ExportRecordsOptions {
  title: string;
  subtitle?: string;
  filenameBase: string;
  columns: ExportColumn[];
  rows: Array<Array<string | number>>;
  /** Optional raw CSV rows if CSV needs unformatted numbers; defaults to `rows` */
  csvRows?: Array<Array<string | number>>;
  /** Optional summary footer row shown at the bottom of the PDF table */
  totalsRow?: Array<string | number>;
  orientation?: 'landscape' | 'portrait';
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function downloadRecordsCSV({
  filenameBase,
  columns,
  rows,
  csvRows,
}: Pick<ExportRecordsOptions, 'filenameBase' | 'columns' | 'rows' | 'csvRows'>): void {
  const sourceRows = csvRows || rows;
  const headerLine = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const bodyLines = sourceRows.map((r) => r.map((cell) => escapeCsvCell(cell)).join(','));
  // Prepend UTF-8 BOM so Microsoft Excel renders currency/symbols cleanly
  const csvContent = '\uFEFF' + [headerLine, ...bodyLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(filenameBase)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadRecordsPDF({
  title,
  subtitle,
  filenameBase,
  columns,
  rows,
  totalsRow,
  orientation = 'landscape',
}: ExportRecordsOptions): void {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;

  // Compact top header (records-only document header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, marginX, 12);

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  const metaLine = [
    subtitle,
    `Records: ${rows.length.toLocaleString()}`,
    `Exported: ${generatedAt}`,
  ]
    .filter(Boolean)
    .join('  |  ');
  doc.text(metaLine, marginX, 17);

  // Subtle divider line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.line(marginX, 19.5, pageWidth - marginX, 19.5);

  const columnStyles: Record<number, Partial<Styles>> = {};
  columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || 'left',
      ...(col.width ? { cellWidth: col.width } : {}),
    };
  });

  const head: RowInput[] = [columns.map((c) => c.header)];
  const body: RowInput[] = rows.map((r) => r.map((cell) => String(cell ?? '')));
  const foot: RowInput[] | undefined = totalsRow
    ? [totalsRow.map((cell) => String(cell ?? ''))]
    : undefined;

  autoTable(doc, {
    startY: 22,
    margin: { left: marginX, right: marginX, top: 14, bottom: 12 },
    head,
    body,
    foot,
    showFoot: foot ? 'lastPage' : 'never',
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 1.8, right: 2.2, bottom: 1.8, left: 2.2 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    footStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles,
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`GreenOva Poultry Management  •  ${title}`, marginX, pageHeight - 6);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - marginX, pageHeight - 6, {
      align: 'right',
    });
  }

  doc.save(`${sanitizeFilename(filenameBase)}.pdf`);
}

export interface CsvSection {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export function downloadStructuredCSV(filenameBase: string, sections: CsvSection[]): void {
  const lines: string[] = [];
  sections.forEach((section, idx) => {
    if (idx > 0) lines.push('');
    lines.push(escapeCsvCell(section.title));
    if (section.columns.length > 0) {
      lines.push(section.columns.map((c) => escapeCsvCell(c)).join(','));
    }
    section.rows.forEach((row) => {
      lines.push(row.map((cell) => escapeCsvCell(cell)).join(','));
    });
  });

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(filenameBase)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface PdfKpiCard {
  label: string;
  value: string;
  subtext?: string;
  tone?: 'emerald' | 'rose' | 'indigo' | 'amber' | 'slate';
}

export interface PdfIncomeStatementLine {
  particulars: string;
  basis?: string;
  amount: string;
  percentRevenue: string;
  kind: 'section' | 'item' | 'subtotal' | 'gross' | 'net';
  isPositive?: boolean;
}

export interface IncomeStatementPdfOptions {
  title: string;
  subtitle: string;
  filenameBase: string;
  cards: PdfKpiCard[];
  incomeStatementLines: PdfIncomeStatementLine[];
  unitSummaryColumns: ExportColumn[];
  unitSummaryRows: Array<Array<string | number>>;
  monthlyColumns?: ExportColumn[];
  monthlyRows?: Array<Array<string | number>>;
}

export function downloadIncomeStatementPDF({
  title,
  subtitle,
  filenameBase,
  cards,
  incomeStatementLines,
  unitSummaryColumns,
  unitSummaryRows,
  monthlyColumns,
  monthlyRows,
}: IncomeStatementPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2; // 190mm

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Compact Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, marginX, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${subtitle}  |  Exported: ${generatedAt}`, marginX, 16.5);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginX, 19, pageWidth - marginX, 19);

  // Top Relevant KPI Cards (4 per row)
  const cols = 4;
  const gap = 2.6;
  const cardWidth = (contentWidth - gap * (cols - 1)) / cols;
  const cardHeight = 15.5;
  let cursorY = 21.5;

  const toneColors: Record<
    NonNullable<PdfKpiCard['tone']>,
    { border: [number, number, number]; bg: [number, number, number]; value: [number, number, number] }
  > = {
    emerald: { border: [167, 243, 208], bg: [236, 253, 245], value: [4, 120, 87] },
    rose: { border: [254, 205, 211], bg: [255, 241, 242], value: [190, 18, 60] },
    indigo: { border: [199, 210, 254], bg: [238, 242, 255], value: [67, 56, 202] },
    amber: { border: [253, 230, 138], bg: [255, 251, 235], value: [180, 83, 9] },
    slate: { border: [203, 213, 225], bg: [248, 250, 252], value: [15, 23, 42] },
  };

  cards.forEach((card, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = marginX + col * (cardWidth + gap);
    const y = cursorY + row * (cardHeight + 2.4);
    const palette = toneColors[card.tone || 'slate'];

    doc.setFillColor(...palette.bg);
    doc.setDrawColor(...palette.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(card.label.toUpperCase(), x + 2.5, y + 4.3, { maxWidth: cardWidth - 5 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...palette.value);
    doc.text(card.value, x + 2.5, y + 9.8, { maxWidth: cardWidth - 5 });

    if (card.subtext) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 116, 139);
      doc.text(card.subtext, x + 2.5, y + 13.7, { maxWidth: cardWidth - 5 });
    }
  });

  const numCardRows = Math.ceil(cards.length / cols);
  cursorY += numCardRows * (cardHeight + 2.4) + 2;

  // Section 1: Income Statement (Profit & Loss)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Income Statement (Profit & Loss)', marginX, cursorY + 2.5);

  const incomeBody: RowInput[] = incomeStatementLines.map((line) => {
    if (line.kind === 'section') {
      return [
        {
          content: line.particulars,
          colSpan: 4,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 7.5,
          },
        },
      ];
    }

    const rowStyle: Partial<Styles> =
      line.kind === 'net'
        ? {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
          }
        : line.kind === 'gross'
        ? {
            fillColor: [226, 232, 240],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
          }
        : line.kind === 'subtotal'
        ? {
            fillColor: [248, 250, 252],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
          }
        : {};

    return [
      {
        content: line.kind === 'item' ? `   ${line.particulars}` : line.particulars,
        styles: rowStyle,
      },
      { content: line.basis || '', styles: rowStyle },
      {
        content: line.amount,
        styles: {
          ...rowStyle,
          halign: 'right',
          ...(line.kind === 'net' && line.isPositive !== undefined
            ? { textColor: line.isPositive ? [110, 231, 183] : [253, 164, 175] }
            : {}),
        },
      },
      {
        content: line.percentRevenue,
        styles: { ...rowStyle, halign: 'right' },
      },
    ];
  });

  autoTable(doc, {
    startY: cursorY + 4.5,
    margin: { left: marginX, right: marginX, top: 12, bottom: 12 },
    head: [['Statement Line Item / Particulars', 'Basis / Details', 'Amount (PKR)', '% Rev']],
    body: incomeBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 1.7, right: 2.2, bottom: 1.7, left: 2.2 },
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 88, halign: 'left' },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 34, halign: 'right' },
      3: { cellWidth: 18, halign: 'right' },
    },
  });

  let nextY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 180) + 6;

  // Section 2: Unit-Wise Comparative Summary
  if (unitSummaryRows.length > 0) {
    if (nextY > pageHeight - 40) {
      doc.addPage();
      nextY = 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Unit-Wise Financial & Production Summary', marginX, nextY);

    const unitColStyles: Record<number, Partial<Styles>> = {};
    unitSummaryColumns.forEach((c, idx) => {
      unitColStyles[idx] = { halign: c.align || 'left', ...(c.width ? { cellWidth: c.width } : {}) };
    });

    autoTable(doc, {
      startY: nextY + 2.5,
      margin: { left: marginX, right: marginX, top: 12, bottom: 12 },
      head: [unitSummaryColumns.map((c) => c.header)],
      body: unitSummaryRows.map((r) => r.map((cell) => String(cell ?? ''))),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: { top: 1.5, right: 1.8, bottom: 1.5, left: 1.8 },
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === unitSummaryRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      columnStyles: unitColStyles,
    });

    nextY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || nextY + 30) + 6;
  }

  // Section 3: Monthly Rollover Summary (if available)
  if (monthlyColumns && monthlyRows && monthlyRows.length > 0) {
    if (nextY > pageHeight - 45) {
      doc.addPage();
      nextY = 14;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Monthly Rollover Schedule', marginX, nextY);

    const mColStyles: Record<number, Partial<Styles>> = {};
    monthlyColumns.forEach((c, idx) => {
      mColStyles[idx] = { halign: c.align || 'left', ...(c.width ? { cellWidth: c.width } : {}) };
    });

    autoTable(doc, {
      startY: nextY + 2.5,
      margin: { left: marginX, right: marginX, top: 12, bottom: 12 },
      head: [monthlyColumns.map((c) => c.header)],
      body: monthlyRows.map((r) => r.map((cell) => String(cell ?? ''))),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: { top: 1.5, right: 1.8, bottom: 1.5, left: 1.8 },
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        const colIdx = data.column.index;
        if (data.section === 'head') {
          if (colIdx >= 1 && colIdx <= 3) {
            data.cell.styles.fillColor = [120, 53, 15]; // Amber Eggs
          } else if (colIdx >= 4 && colIdx <= 6) {
            data.cell.styles.fillColor = [6, 78, 59]; // Emerald Financials
          } else if (colIdx >= 7 && colIdx <= 9) {
            data.cell.styles.fillColor = [12, 74, 110]; // Sky Feed
          }
        } else if (data.section === 'body') {
          if (colIdx >= 1 && colIdx <= 3) {
            data.cell.styles.fillColor = [255, 251, 235];
          } else if (colIdx >= 4 && colIdx <= 6) {
            data.cell.styles.fillColor = [236, 253, 245];
          } else if (colIdx >= 7 && colIdx <= 9) {
            data.cell.styles.fillColor = [240, 249, 255];
          }
        }
      },
      columnStyles: mColStyles,
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`GreenOva Poultry Management  •  ${title}`, marginX, pageHeight - 6);
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - marginX, pageHeight - 6, {
      align: 'right',
    });
  }

  doc.save(`${sanitizeFilename(filenameBase)}.pdf`);
}

