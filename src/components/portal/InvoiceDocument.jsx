import { useState } from "react";
import {
  FiPrinter,
  FiX,
  FiShare2,
  FiDownload,
  FiCheckCircle,
  FiFileText,
  FiMapPin,
  FiMail,
  FiGlobe,
} from "react-icons/fi";
import {
  downloadInvoicePDF,
  getInvoicePDFBlob,
} from "../../services/pdfInvoiceGenerator";

const InvoiceDocument = ({ invoice: rawInvoice, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!rawInvoice) return null;

  // Safe data normalization for invoices created from POS or Online Store Checkout
  const invoice = {
    ...rawInvoice,
    invoiceNo: rawInvoice.invoiceNo || rawInvoice.orderId || rawInvoice.id || "INV-001",
    customerName: rawInvoice.customerName || rawInvoice.fullName || "Customer",
    customerPhone: rawInvoice.customerPhone || rawInvoice.phone || "N/A",
    customerEmail: rawInvoice.customerEmail || rawInvoice.email || "",
    customerTrn: rawInvoice.customerTrn || "",
    paymentMethod: rawInvoice.paymentMethodName || rawInvoice.paymentMethod || "Cash",
    createdBy: rawInvoice.createdBy || "Website Online Order",
    notes: rawInvoice.notes || "",
    createdAt: rawInvoice.createdAt || new Date().toISOString(),
    subtotal: Number(rawInvoice.subtotal ?? rawInvoice.totalAmount ?? rawInvoice.total ?? 0),
    vatRate: Number(rawInvoice.vatRate ?? 5),
    vatAmount: Number(rawInvoice.vatAmount ?? 0),
    discount: Number(rawInvoice.discount ?? 0),
    totalAmount: Number(rawInvoice.totalAmount ?? rawInvoice.total ?? 0),
    items: (rawInvoice.items || []).map((item) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
      const total = Number(item.total ?? unitPrice * qty);
      return {
        ...item,
        sku: item.sku || "N/A",
        name: item.name || item.title || "Item",
        brand: item.brand || "",
        quantity: qty,
        unitPrice,
        total,
      };
    }),
  };

  // 1. Direct 1-Click Vector PDF Download
  const handleDownload = () => {
    setDownloading(true);
    try {
      downloadInvoicePDF(invoice);
    } catch (err) {
      console.error("PDF Download error:", err);
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  // 2. Direct 1-Click PDF Share (Web Share API with actual .pdf file attachment + WhatsApp fallback)
  const handleShare = async () => {
    setSharing(true);
    try {
      const pdfBlob = getInvoicePDFBlob(invoice);
      const fileName = `Invoice_${invoice.invoiceNo}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Tax Invoice ${invoice.invoiceNo} - E-ALL`,
          text: `E-ALL Official Tax Invoice for ${invoice.customerName}. Total: AED ${Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}`,
          files: [file],
        });
        return;
      }
    } catch (err) {
      console.warn("Native file share skipped:", err);
    } finally {
      setSharing(false);
    }

    // WhatsApp Fallback
    const summary =
      `*E-ALL OFFICIAL TAX INVOICE ${invoice.invoiceNo}*\n` +
      `*Customer:* ${invoice.customerName}\n` +
      `*Total Amount:* AED ${Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}\n` +
      `*Date:* ${new Date(invoice.createdAt).toLocaleDateString("en-GB")}\n\n` +
      `Thank you for doing business with E-ALL Electronics!`;

    const cleanPhone = (invoice.customerPhone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(summary)}`, "_blank");
  };

  // 3. Isolated Vector PDF Print (Direct 1-page paper print)
  const handlePrint = () => {
    const pdfBlob = getInvoicePDFBlob(invoice);
    if (!pdfBlob) return;

    const blobUrl = URL.createObjectURL(pdfBlob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex flex-col items-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">

      {/* 🛠️ CUSTOM DOCUMENT VIEWER TOOLBAR */}
      <div className="sticky top-2 z-20 w-full max-w-4xl bg-slate-900/95 backdrop-blur-lg text-white rounded-2xl shadow-2xl border border-slate-700/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">

        {/* Left: Document Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
            <FiFileText className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Document Viewer</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                A4 Vector Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {invoice.invoiceNo} • {invoice.customerName}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
            title="Download Vector A4 PDF directly"
          >
            <FiDownload className="text-sm" />
            <span>{downloading ? "Generating..." : "Download PDF"}</span>
          </button>

          {/* Print PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Print Official A4 Invoice"
          >
            <FiPrinter className="text-sm" />
            <span>Print</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            title="Share via WhatsApp or Device Share"
          >
            <FiShare2 className="text-sm" />
            <span>{sharing ? "Sharing..." : "Share"}</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer ml-1"
            title="Close Viewer"
          >
            <FiX className="text-lg" />
          </button>
        </div>
      </div>

      {/* 📄 CRISP A4 SHEET PREVIEW (Zoom-out auto-scaled for mobile) */}
      <div className="w-full flex justify-center overflow-x-auto pb-12 print:pb-0">
        <div
          id="printable-invoice"
          className="bg-white text-slate-900 shadow-2xl p-6 sm:p-10 md:p-12 transition-all duration-300 text-left border border-slate-200
                     w-full max-w-[210mm] min-h-[297mm] flex flex-col justify-between
                     rounded-2xl sm:rounded-3xl print:rounded-none print:shadow-none print:border-none print:m-0 print:p-8"
          style={{ boxSizing: "border-box" }}
        >
          <div>
            {/* 1. HEADER SECTION (LOGO ON TOP, DETAILS BELOW) */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-slate-900">
              
              {/* Left: Brand Identity & Legal Details */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="E-ALL Logo"
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                      E-ALL
                    </h1>
                    <p className="text-[11px] font-bold text-sky-800 tracking-wider uppercase">
                      Electronics ALL FZCO
                    </p>
                  </div>
                </div>

                <div className="text-[11.5px] text-slate-500 space-y-0.5 pt-1 leading-relaxed">
                  <p className="font-medium text-slate-700 flex items-center gap-1.5">
                    <FiMapPin className="text-sky-700 shrink-0 text-xs" />
                    <span>Dubai Silicon Oasis, DDP, Building A2, Dubai, United Arab Emirates</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800">TRN (VAT): 100482910400003</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FiMail className="text-slate-400 text-xs" /> contact@eall.ae
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Tax Invoice Identifier & Date Meta */}
              <div className="sm:text-right space-y-1 self-stretch sm:self-auto flex flex-col justify-between">
                <div>
                  <span className="inline-block px-3 py-1 bg-slate-950 text-white font-black text-xs uppercase tracking-widest rounded-lg mb-1 shadow-xs">
                    TAX INVOICE
                  </span>
                  <h2 className="text-base sm:text-lg font-mono font-bold text-slate-900 tracking-tight">
                    {invoice.invoiceNo}
                  </h2>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                  <p>
                    Date: <strong className="text-slate-800">{new Date(invoice.createdAt).toLocaleDateString("en-GB")}</strong>{" "}
                    Time:{" "}
                    <span className="text-slate-700 font-mono">
                      {new Date(invoice.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                  <p className="flex justify-end gap-1.5">
                    <span className="text-slate-400">Issued By:</span>
                    <strong className="text-slate-800 font-medium">{invoice.createdBy}</strong>
                    <span className="text-slate-400 ml-1">Payment:</span>
                    <span className="font-semibold text-slate-800">{invoice.paymentMethod}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. CUSTOMER & BILL TO BOX */}
            <div className="grid grid-cols-2 gap-4 my-4 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Billed To / Customer Details:
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {invoice.customerName}
                </p>
                <p className="text-xs text-slate-700 mt-0.5 font-mono font-medium">
                  Phone: <strong className="text-slate-900">{invoice.customerPhone}</strong>
                  {invoice.customerEmail && (
                    <span className="text-slate-600 font-sans font-normal ml-2">
                      | Email: {invoice.customerEmail}
                    </span>
                  )}
                </p>
              </div>

              <div className="text-right flex flex-col justify-between">
                <div>
                  {invoice.customerTrn ? (
                    <>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Buyer TRN / Tax Registration No:
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-900 bg-white inline-block px-2 py-0.5 rounded border border-slate-200">
                        {invoice.customerTrn}
                      </p>
                    </>
                  ) : (
                    <div className="inline-flex items-center justify-end gap-1.5 text-emerald-700 text-xs font-semibold">
                      <FiCheckCircle />
                      Direct Sales / Retail Invoice
                    </div>
                  )}
                </div>

                {invoice.notes && (
                  <p className="text-xs text-slate-500 italic mt-1">
                    Remarks: {invoice.notes}
                  </p>
                )}
              </div>
            </div>

            {/* 3. ITEMIZED PRODUCTS TABLE */}
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-2 px-3 text-center w-10">#</th>
                    <th className="py-2 px-3 w-32">SKU Code</th>
                    <th className="py-2 px-3">Item &amp; Description</th>
                    <th className="py-2 px-3 text-center w-14">Qty</th>
                    <th className="py-2 px-3 text-right w-28">Unit Price</th>
                    <th className="py-2 px-3 text-right w-28">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {invoice.items?.map((item, idx) => (
                    <tr key={item.sku || idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-slate-700 text-xs font-medium">
                        {item.sku}
                      </td>
                      <td className="py-1.5 px-3 text-left">
                        <span className="font-semibold text-slate-900 text-xs">{item.name}</span>
                        {item.brand && (
                          <span className="text-[10px] text-slate-400 font-medium ml-1.5">
                            ({item.brand})
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-900 text-xs">
                        {item.quantity}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-800 text-xs">
                        {Number(item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                        {Number(item.total).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. TOTALS & TAX BREAKDOWN */}
            <div className="flex flex-row justify-between items-start mt-6 pt-4 border-t-2 border-slate-200 gap-6 text-left">

              {/* Terms & Conditions */}
              <div className="max-w-xs text-[11px] text-slate-500 leading-relaxed text-left">
                <p className="font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Terms &amp; Conditions:
                </p>
                <p>• Goods once sold can be returned/exchanged within 7 days in original sealed condition.</p>
                <p>• Warranty terms apply as per official manufacturer coverage.</p>
                <p className="mt-2 text-slate-400 font-medium">Thank you for your business with E-ALL.</p>
              </div>

              {/* Calculation Summary Box */}
              <div className="w-80 space-y-2 text-xs sm:text-sm font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">
                    AED {Number(invoice.subtotal).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">
                      - AED {Number(invoice.discount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>UAE VAT ({invoice.vatRate}%):</span>
                  <span className="font-mono font-bold text-slate-800">
                    AED {Number(invoice.vatAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Grand Total Highlight */}
                <div className="flex justify-between items-center text-base font-black text-slate-950 pt-3 border-t-2 border-slate-900">
                  <span className="tracking-tight">Grand Total:</span>
                  <span className="font-mono text-sky-900 text-xl font-black">
                    AED {Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. BOTTOM SIGNATURES & OFFICIAL STAMP */}
          <div className="grid grid-cols-2 gap-8 pt-10 mt-8 border-t border-slate-200 text-xs text-slate-600">
            <div className="text-left">
              <p className="font-bold text-slate-800 mb-10">Customer Acceptance:</p>
              <div className="border-b border-dashed border-slate-400 w-48" />
              <p className="text-[10px] text-slate-400 mt-1">Name &amp; Signature</p>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-800 mb-10">Authorized Signatory (E-ALL):</p>
              <div className="border-b border-dashed border-slate-400 w-48 ml-auto" />
              <p className="text-[10px] text-slate-400 mt-1">Electronics All FZCO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDocument;
