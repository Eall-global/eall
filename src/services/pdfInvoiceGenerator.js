import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * High-performance vector A4 Tax Invoice Generator
 * Generates exact standard A4 PDF (210mm x 297mm) with vector graphics, crisp typography, and AutoTable.
 */
export const buildInvoicePDF = (invoice) => {
  if (!invoice) return null;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14; // 14mm margins
  const contentWidth = pageWidth - margin * 2; // 182mm
  const rightX = pageWidth - margin;

  // Colors
  const navy = [15, 23, 42]; // #0f172a
  const skyBlue = [2, 132, 199]; // #0284c7
  const slateText = [51, 65, 85]; // #334155
  const slateMuted = [100, 116, 139]; // #64748b
  const lightGray = [248, 250, 252]; // #f8fafc
  const borderGray = [226, 232, 240]; // #e2e8f0

  // 1. TOP HEADER - BRAND LOGO & COMPANY INFORMATION
  // Logo placeholder / space (alone on top-left)
  // Below logo: E-ALL (ELECTRONICS ALL FZCO)
  const headerY = 12;

  // Company Title below logo space
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...navy);
  doc.text("E-ALL (ELECTRONICS ALL FZCO)", margin, headerY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  doc.text("Premium Consumer Electronics Distribution & Solutions", margin, headerY + 16.5);
  doc.text("Dubai Silicon Oasis, DDP, Building A2, Dubai, United Arab Emirates", margin, headerY + 20.5);
  doc.text("TRN (VAT No): 100482910400003   |   Email: contact@e-all.ae", margin, headerY + 24.5);

  // 2. TAX INVOICE BADGE & META (RIGHT SIDE - CENTERED / BOTTOM ALIGNED)
  const rightHeaderY = headerY + 2;

  // "TAX INVOICE" Badge
  doc.setFillColor(...navy);
  doc.roundedRect(rightX - 32, rightHeaderY, 32, 6.5, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", rightX - 16, rightHeaderY + 4.5, { align: "center" });

  // Invoice Number
  doc.setTextColor(...navy);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceNo, rightX, rightHeaderY + 12, { align: "right" });

  // Meta Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateText);

  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString("en-GB");
  const invoiceTime = new Date(invoice.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.text(`Date: ${invoiceDate}   |   Time: ${invoiceTime}`, rightX, rightHeaderY + 16.5, { align: "right" });
  doc.text(`Issued By: ${invoice.createdBy || "Staff"}   |   Payment: ${invoice.paymentMethod || "Cash"}`, rightX, rightHeaderY + 20.5, { align: "right" });

  // Horizontal Divider Line
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.4);
  doc.line(margin, 41, rightX, 41);

  // 3. CUSTOMER DETAILS CARD
  doc.setFillColor(...lightGray);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, 44, contentWidth, 20, 1.5, 1.5, "FD");

  // Left Column - Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...slateMuted);
  doc.text("BILLED TO / CUSTOMER DETAILS", margin + 4, 48.5);

  doc.setFontSize(9);
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customerName, margin + 4, 53);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slateText);
  doc.text(`Phone: ${invoice.customerPhone}` + (invoice.customerEmail ? `   |   Email: ${invoice.customerEmail}` : ""), margin + 4, 57.5);

  // Right Column - TRN / Tax Status
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...slateMuted);
  doc.text("TAX STATUS / TRN", rightX - 4, 48.5, { align: "right" });

  if (invoice.customerTrn) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.text(`TRN: ${invoice.customerTrn}`, rightX - 4, 53, { align: "right" });
  } else {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.text("✓ Direct Sales / Retail Invoice", rightX - 4, 53, { align: "right" });
  }

  if (invoice.notes) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...slateMuted);
    doc.text(`Remarks: ${invoice.notes}`, rightX - 4, 57.5, { align: "right" });
  }

  // 4. ITEMIZED PRODUCTS AUTOTABLE (Compact, Professional Padding & Typography)
  const tableRows = (invoice.items || []).map((item, index) => [
    index + 1,
    item.sku || "N/A",
    item.name + (item.brand ? ` (${item.brand})` : ""),
    item.quantity,
    Number(item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 }),
    (Number(item.unitPrice) * Number(item.quantity)).toLocaleString("en-AE", { minimumFractionDigits: 2 }),
  ]);

  autoTable(doc, {
    startY: 67,
    margin: { left: margin, right: margin },
    head: [["#", "SKU Code", "Item & Description", "Qty", "Unit Price (AED)", "Total (AED)"]],
    body: tableRows,
    theme: "plain",
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
    },
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      textColor: slateText,
      cellPadding: { top: 1.8, bottom: 1.8, left: 3, right: 3 },
      valign: "middle",
      lineColor: borderGray,
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", font: "courier", cellWidth: 32 },
      2: { halign: "left", fontStyle: "normal" },
      3: { halign: "center", fontStyle: "bold", cellWidth: 14 },
      4: { halign: "right", font: "courier", cellWidth: 28 },
      5: { halign: "right", font: "courier", fontStyle: "bold", cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = doc.lastAutoTable.finalY + 5;

  // 5. TOTALS & SUMMARY (RIGHT) & TERMS (LEFT)
  const totalsBoxWidth = 72;
  const totalsX = rightX - totalsBoxWidth;

  // Terms (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...navy);
  doc.text("TERMS & CONDITIONS", margin, finalY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...slateMuted);
  doc.text("• Goods sold can be exchanged/returned within 7 days in original condition.", margin, finalY + 7);
  doc.text("• Official manufacturer warranty coverage applies as specified.", margin, finalY + 10.5);
  doc.text("• Thank you for doing business with E-ALL Electronics.", margin, finalY + 14);

  // Financial Breakdown (Right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slateText);

  // Subtotal
  doc.text("Subtotal:", totalsX, finalY + 3);
  doc.setFont("courier", "bold");
  doc.text(`AED ${Number(invoice.subtotal).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`, rightX, finalY + 3, { align: "right" });

  let curY = finalY + 7;

  // Discount
  if (invoice.discount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(225, 29, 72); // Rose 600
    doc.text("Discount:", totalsX, curY);
    doc.setFont("courier", "bold");
    doc.text(`- AED ${Number(invoice.discount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`, rightX, curY, { align: "right" });
    curY += 4.5;
  }

  // VAT (5%)
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slateText);
  doc.text(`UAE VAT (${invoice.vatRate || 5}%):`, totalsX, curY);
  doc.setFont("courier", "bold");
  doc.text(`AED ${Number(invoice.vatAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`, rightX, curY, { align: "right" });
  curY += 5.5;

  // Grand Total Box
  doc.setFillColor(...navy);
  doc.roundedRect(totalsX - 2, curY - 1, totalsBoxWidth + 2, 7, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Grand Total:", totalsX + 2, curY + 3.8);
  doc.setFont("courier", "bold");
  doc.setFontSize(9.5);
  doc.text(`AED ${Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`, rightX - 2, curY + 3.8, { align: "right" });

  // 6. BOTTOM SIGNATURE LINES
  const bottomY = Math.max(curY + 22, 258);

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.25);
  doc.line(margin, bottomY - 5, rightX, bottomY - 5);

  // Customer Signature
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...navy);
  doc.text("Customer Acceptance:", margin, bottomY);
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, bottomY + 10, margin + 40, bottomY + 10);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text("Signature & Date", margin, bottomY + 13);

  // Authorized Signatory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...navy);
  doc.text("Authorized Signatory (E-ALL):", rightX - 40, bottomY);
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(rightX - 40, bottomY + 10, rightX, bottomY + 10);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text("Electronics All FZCO", rightX - 40, bottomY + 13);

  return doc;
};

/**
 * 📥 1-Click Instant Vector PDF Download (No browser dialog, No html2canvas)
 */
export const downloadInvoicePDF = (invoice) => {
  const doc = buildInvoicePDF(invoice);
  if (!doc) return;
  const fileName = `Invoice_${invoice.invoiceNo}_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
};

/**
 * 📲 Generate PDF Blob for Web Share API
 */
export const getInvoicePDFBlob = (invoice) => {
  const doc = buildInvoicePDF(invoice);
  if (!doc) return null;
  return doc.output("blob");
};

/**
 * 👁️ Generate PDF Data URI for inline iframe preview
 */
export const getInvoicePDFDataUri = (invoice) => {
  const doc = buildInvoicePDF(invoice);
  if (!doc) return null;
  return doc.output("datauristring");
};
