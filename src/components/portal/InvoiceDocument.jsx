import { useRef, useState } from "react";
import {
  FiPrinter,
  FiX,
  FiShare2,
  FiDownload,
  FiCheckCircle,
  FiZoomIn,
  FiZoomOut,
  FiRefreshCw,
  FiMapPin,
  FiMail,
  FiGlobe,
  FiFileText,
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const InvoiceDocument = ({ invoice, onClose }) => {
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!invoice) return null;

  // 1. Direct PDF Download using jsPDF + html2canvas (Exact A4 scale)
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5, // Crisp 300dpi-like high resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 850,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = 210; // Standard A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(`Invoice_${invoice.invoiceNo}_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      handlePrintSinglePage();
    } finally {
      setDownloading(false);
    }
  };

  // 2. ISOLATED 1-PAGE PRINT (Prints ONLY the invoice sheet without any background UI)
  const handlePrintSinglePage = () => {
    const printArea = document.getElementById("invoice-printable-sheet");
    if (!printArea) return;

    // Create a hidden isolated iframe to guarantee ZERO background portal elements are printed
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${invoice.invoiceNo}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #ffffff;
              color: #0f172a;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              padding: 12mm 14mm;
            }
            /* Copy Tailwind helper styles for table & typography */
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-mono { font-family: monospace; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .w-full { width: 100%; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          ${printArea.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 400);
  };

  // 3. Share Functionality (Native Share / WhatsApp)
  const handleShare = async () => {
    const summary = `*E-ALL TAX INVOICE ${invoice.invoiceNo}*\n` +
      `*Customer:* ${invoice.customerName}\n` +
      `*Total Amount:* AED ${Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}\n` +
      `*Date:* ${new Date(invoice.createdAt).toLocaleDateString("en-GB")}\n` +
      `Thank you for doing business with E-ALL Electronics!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNo} - E-ALL`,
          text: summary,
        });
        return;
      } catch (e) {
        // Fall through to WhatsApp
      }
    }

    const cleanPhone = invoice.customerPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(summary)}`, "_blank");
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
              <span className="font-bold text-sm text-white">Invoice Document Viewer</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                A4 Standard
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {invoice.invoiceNo} • {invoice.customerName}
            </p>
          </div>
        </div>

        {/* Center: Zoom Controls */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
            title="Zoom Out"
          >
            <FiZoomOut />
          </button>
          <span className="text-xs font-mono px-2 text-slate-300">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.3, z + 0.1))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
            title="Zoom In"
          >
            <FiZoomIn />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer text-xs"
            title="Reset Zoom (100%)"
          >
            <FiRefreshCw />
          </button>
        </div>

        {/* Right: Actions (Share, Download, Print, Close) */}
        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Share via WhatsApp or Device"
          >
            <FiShare2 />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="Download true A4 PDF document"
          >
            <FiDownload />
            <span>{downloading ? "Saving PDF..." : "Download PDF"}</span>
          </button>

          {/* Print 1 Page */}
          <button
            type="button"
            onClick={handlePrintSinglePage}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
            title="Print isolated 1-sheet A4 page"
          >
            <FiPrinter />
            <span className="hidden sm:inline">Print (1 Page)</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition text-lg cursor-pointer ml-1"
            title="Close Viewer"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* 📄 TRUE A4 SHEET PAPER CONTAINER */}
      <div
        className="w-full flex justify-center overflow-x-auto pb-10 transition-transform duration-200"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
      >
        <div
          ref={invoiceRef}
          id="invoice-printable-sheet"
          style={{
            width: "100%",
            maxWidth: "794px", // Standard A4 width at 96 DPI
            minHeight: "1123px", // Standard A4 height at 96 DPI
          }}
          className="
            bg-white text-slate-900 font-sans p-8 sm:p-12
            shadow-2xl rounded-2xl border border-slate-200
            print:shadow-none print:rounded-none print:border-none print:p-8 print:w-full print:max-w-none
            flex flex-col justify-between text-left
          "
        >
          {/* TOP HALF OF INVOICE */}
          <div>
            
            {/* 1. BRAND HEADER & TAX INVOICE BADGE */}
            <div className="flex flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900 text-left">
              
              {/* Top Left: Logo & Company Identification */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="E-ALL Logo"
                    className="h-12 w-auto object-contain shrink-0"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950 leading-none">
                      E-ALL
                    </h1>
                    <p className="text-[11px] font-bold text-sky-800 uppercase tracking-wider mt-1">
                      Electronics All FZCO
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 font-medium">
                  Premium Consumer Electronics Distribution & B2B Solutions
                </p>

                <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 leading-relaxed">
                  <p className="flex items-center gap-1.5">
                    <FiMapPin className="text-slate-400 shrink-0" />
                    Dubai Silicon Oasis, DDP, Building A2, Dubai, UAE
                  </p>
                  <p className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-900">TRN (VAT):</span>
                    <strong className="text-slate-950 font-extrabold tracking-wider bg-slate-100 px-1.5 py-0.2 rounded">
                      100482910400003
                    </strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FiMail className="text-slate-400 shrink-0" />
                    contact@e-all.ae • <FiGlobe className="text-slate-400 shrink-0 ml-1" /> www.e-all.ae
                  </p>
                </div>
              </div>

              {/* Top Right: Tax Invoice Details */}
              <div className="text-right shrink-0">
                <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest mb-2 shadow-xs">
                  TAX INVOICE
                </div>

                <p className="text-2xl font-mono font-black text-slate-950 tracking-tight">
                  {invoice.invoiceNo}
                </p>

                <div className="text-xs text-slate-600 mt-2 space-y-1 text-right">
                  <p className="flex justify-end gap-2">
                    <span className="text-slate-400">Invoice Date:</span>
                    <strong className="text-slate-900 font-mono font-bold">
                      {new Date(invoice.createdAt).toLocaleDateString("en-GB")}
                    </strong>
                  </p>
                  <p className="flex justify-end gap-2">
                    <span className="text-slate-400">Time:</span>
                    <span className="text-slate-700 font-mono">
                      {new Date(invoice.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                  <p className="flex justify-end gap-2">
                    <span className="text-slate-400">Issued By:</span>
                    <strong className="text-sky-900 font-semibold">{invoice.createdBy}</strong>
                  </p>
                  <p className="flex justify-end gap-2 pt-0.5">
                    <span className="text-slate-400">Payment:</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[11px] border border-emerald-200">
                      {invoice.paymentMethod}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. CUSTOMER & BILL TO BOX */}
            <div className="grid grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  Billed To / Customer Details:
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  {invoice.customerName}
                </p>
                <p className="text-xs text-slate-700 mt-1 font-mono font-medium">
                  Phone: <strong className="text-slate-900">{invoice.customerPhone}</strong>
                </p>
                {invoice.customerEmail && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    Email: {invoice.customerEmail}
                  </p>
                )}
              </div>

              <div className="text-right flex flex-col justify-between">
                <div>
                  {invoice.customerTrn ? (
                    <>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                        Buyer TRN / Tax Registration No:
                      </span>
                      <p className="text-xs font-mono font-black text-slate-900 bg-white inline-block px-2 py-0.5 rounded border border-slate-200">
                        {invoice.customerTrn}
                      </p>
                    </>
                  ) : (
                    <div className="inline-flex items-center justify-end gap-1.5 text-emerald-700 text-xs font-bold">
                      <FiCheckCircle />
                      Direct Sales / Retail Invoice
                    </div>
                  )}
                </div>

                {invoice.notes && (
                  <p className="text-xs text-slate-500 italic mt-2">
                    Remarks: {invoice.notes}
                  </p>
                )}
              </div>
            </div>

            {/* 3. ITEMIZED PRODUCTS TABLE */}
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3 w-32">SKU Code</th>
                    <th className="py-3 px-4">Item & Description</th>
                    <th className="py-3 px-3 text-center w-16">Qty</th>
                    <th className="py-3 px-3 text-right w-28">Unit Price</th>
                    <th className="py-3 px-4 text-right w-32">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {invoice.items?.map((item, idx) => (
                    <tr key={item.sku || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 text-xs font-semibold">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 text-left">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        {item.brand && (
                          <p className="text-[10px] text-slate-500 font-semibold">{item.brand}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-slate-900 text-sm">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800">
                        {Number(item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-950 text-sm">
                        {(item.quantity * item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
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
                  Terms & Conditions:
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
              <p className="text-[10px] text-slate-400 mt-1">Name & Signature</p>
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
