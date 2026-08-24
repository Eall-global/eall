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

  // Colors
  const navy = [15, 23, 42]; // #0f172a
  const skyBlue = [2, 132, 199]; // #0284c7
  const slateText = [51, 65, 85]; // #334155
  const lightGray = [248, 250, 252]; // #f8fafc
  const borderGray = [226, 232, 240]; // #e2e8f0

  // 1. TOP HEADER - BRAND LOGO & INFO
  doc.setFillColor(...navy);

  // Brand Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...navy);
  doc.text("E-ALL", margin, 20);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...skyBlue);
  doc.text("ELECTRONICS ALL FZCO", margin, 24.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateText);
  doc.text("Premium Consumer Electronics Distribution & Solutions", margin, 29);
  doc.text("Dubai Silicon Oasis, DDP, Building A2, Dubai, United Arab Emirates", margin, 33);
  doc.text("TRN (VAT No): 100482910400003", margin, 37);
  doc.text("Email: contact@e-all.ae   |   Web: www.e-all.ae", margin, 41);

  // 2. TAX INVOICE BADGE & META (RIGHT SIDE)
  const rightX = pageWidth - margin;

  // "TAX INVOICE" Badge
  doc.setFillColor(...navy);
  doc.roundedRect(rightX - 36, 12, 36, 7, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", rightX - 18, 16.8, { align: "center" });

  // Invoice Number
  doc.setTextColor(...navy);
  doc.setFontSize(14);
  doc.setFont("courier", "bold");
  doc.text(invoice.invoiceNo, rightX, 26, { align: "right" });

  // Date, Time, Issued By, Payment
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slateText);

  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString("en-GB");
  const invoiceTime = new Date(invoice.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.text(`Date: ${invoiceDate}`, rightX, 31, { align: "right" });
  doc.text(`Time: ${invoiceTime}`, rightX, 35, { align: "right" });
  doc.text(`Issued By: ${invoice.createdBy || "Staff"}`, rightX, 39, { align: "right" });
  doc.text(`Payment: ${invoice.paymentMethod || "Cash"}`, rightX, 43, { align: "right" });

  // Horizontal Divider Line
  doc.setDrawColor(...navy);
  doc.setLineWidth(0.5);
  doc.line(margin, 46, rightX, 46);

  // 3. CUSTOMER DETAILS CARD
  doc.setFillColor(...lightGray);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, 49, contentWidth, 23, 2, 2, "FD");

  // Left Column - Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text("BILLED TO / CUSTOMER DETAILS", margin + 4, 54);

  doc.setFontSize(10);
  doc.setTextColor(...navy);
  doc.text(invoice.customerName, margin + 4, 59);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slateText);
  doc.text(`Phone: ${invoice.customerPhone}`, margin + 4, 64);
  if (invoice.customerEmail) {
    doc.text(`Email: ${invoice.customerEmail}`, margin + 4, 68);
  }

  // Right Column - TRN / Verified
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("TAX STATUS / TRN", rightX - 4, 54, { align: "right" });

  if (invoice.customerTrn) {
    doc.setFontSize(9);
    doc.setFont("courier", "bold");
    doc.setTextColor(...navy);
    doc.text(`TRN: ${invoice.customerTrn}`, rightX - 4, 60, { align: "right" });
  } else {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129); // Emerald 600
    doc.text("✓ Retail / Verified Sale", rightX - 4, 60, { align: "right" });
  }

  if (invoice.notes) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...slateText);
    doc.text(`Notes: ${invoice.notes}`, rightX - 4, 66, { align: "right" });
  }

  // 4. ITEMIZED PRODUCTS AUTOTABLE
  const tableRows = (invoice.items || []).map((item, index) => [
    index + 1,
    item.sku || "N/A",
    item.name + (item.brand ? ` (${item.brand})` : ""),
    item.quantity,
    Number(item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 }),
    (Number(item.unitPrice) * Number(item.quantity)).toLocaleString("en-AE", { minimumFractionDigits: 2 }),
  ]);

  autoTable(doc, {
    startY: 75,
    margin: { left: margin, right: margin },
    head: [["#", "SKU Code", "Item Description", "Qty", "Unit Price (AED)", "Total (AED)"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
      cellPadding: 2.5,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: slateText,
      cellPadding: 2.5,
      valign: "middle",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left", font: "courier", cellWidth: 32 },
      2: { halign: "left" },
      3: { halign: "center", fontStyle: "bold", cellWidth: 16 },
      4: { halign: "right", font: "courier", cellWidth: 30 },
      5: { halign: "right", font: "courier", fontStyle: "bold", cellWidth: 32 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = doc.lastAutoTable.finalY + 6;

  // 5. TOTALS & SUMMARY (RIGHT) & TERMS (LEFT)
  const totalsBoxWidth = 80;
  const totalsX = rightX - totalsBoxWidth;

  // Terms (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...navy);
  doc.text("TERMS & CONDITIONS", margin, finalY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...slateText);
  doc.text("• Goods sold can be exchanged/returned within 7 days in original condition.", margin, finalY + 8);
  doc.text("• Official manufacturer warranty coverage applies as specified.", margin, finalY + 12);
  doc.text("• Thank you for doing business with E-ALL Electronics.", margin, finalY + 16);

  // Financial Breakdown (Right)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...slateText);

  // Subtotal
  doc.text("Subtotal:", totalsX, finalY + 4);
  doc.setFont("courier", "bold");
  doc.text(`AED ${Number(invoice.subtotal).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`, rightX, finalY + 4, { align: "right" });

  let curY = finalY + 9;

  // Discount
  if (invoice.discount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(225, 29, 72); // Rose 600
    doc.text("Discount:", totalsX, curY);
    doc.setFont("courier", "bold");
    doc.text(`- AED ${Number(invoice.discount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`, rightX, curY, { align: "right" });
    curY += 5;
  }

  // VAT (5%)
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...slateText);
  doc.text(`UAE VAT (${invoice.vatRate || 5}%):`, totalsX, curY);
  doc.setFont("courier", "bold");
  doc.text(`AED ${Number(invoice.vatAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`, rightX, curY, { align: "right" });
  curY += 6;

  // Grand Total Box
  doc.setFillColor(...navy);
  doc.roundedRect(totalsX - 2, curY - 1, totalsBoxWidth + 2, 8, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Grand Total:", totalsX + 2, curY + 4.5);
  doc.setFont("courier", "bold");
  doc.setFontSize(10.5);
  doc.text(`AED ${Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`, rightX - 2, curY + 4.5, { align: "right" });

  // 6. BOTTOM SIGNATURE LINES
  const bottomY = Math.max(curY + 28, 255);

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(margin, bottomY - 6, rightX, bottomY - 6);

  // Customer Signature
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...navy);
  doc.text("Customer Acceptance:", margin, bottomY);
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, bottomY + 12, margin + 45, bottomY + 12);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Signature & Date", margin, bottomY + 15);

  // Authorized Signatory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...navy);
  doc.text("Authorized Signatory (E-ALL):", rightX - 45, bottomY);
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(rightX - 45, bottomY + 12, rightX, bottomY + 12);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Electronics All FZCO", rightX - 45, bottomY + 15);

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
