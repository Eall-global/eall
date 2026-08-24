import { useRef, useState } from "react";
import {
  FiPrinter,
  FiX,
  FiShare2,
  FiDownload,
  FiCheckCircle,
  FiShield,
  FiPhone,
  FiMail,
  FiGlobe,
  FiMapPin,
  FiFileText,
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const InvoiceDocument = ({ invoice, onClose }) => {
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!invoice) return null;

  // 1. Direct PDF Download using jsPDF + html2canvas
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution retina capture
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(`Invoice_${invoice.invoiceNo}_${invoice.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback to native print dialog
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // 2. Share Invoice (Web Share API or WhatsApp)
  const handleShare = async () => {
    const summaryText = `E-ALL Official Tax Invoice\nInvoice No: ${invoice.invoiceNo}\nCustomer: ${invoice.customerName}\nTotal: AED ${Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}\nDate: ${new Date(invoice.createdAt).toLocaleDateString()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNo} - E-ALL`,
          text: summaryText,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to WhatsApp
      }
    }

    // WhatsApp Fallback
    const encoded = `*E-ALL TAX INVOICE ${invoice.invoiceNo}*%0A` +
      `*Customer:* ${encodeURIComponent(invoice.customerName)}%0A` +
      `*Total Amount:* AED ${Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}%0A` +
      `*Payment Method:* ${invoice.paymentMethod}%0A` +
      `*Date:* ${new Date(invoice.createdAt).toLocaleDateString("en-GB")}%0A%0A` +
      `Thank you for choosing E-ALL Electronics!`;

    const phone = invoice.customerPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      
      {/* Container wrapper */}
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none print:bg-transparent">
        
        {/* 🛠️ TOP ACTION BAR (Hidden during print / export capture) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 px-5 sm:px-8 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sm text-white">Tax Invoice</span>
            <span className="font-mono text-xs bg-slate-800 text-sky-300 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {invoice.invoiceNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share / WhatsApp */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              title="Share on WhatsApp or Device"
            >
              <FiShare2 />
              <span>Share</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title="Download standard A4 PDF"
            >
              <FiDownload />
              <span>{downloading ? "Generating PDF..." : "Download PDF"}</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Print standard A4 copy"
            >
              <FiPrinter />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition text-lg cursor-pointer ml-1"
              title="Close Preview"
            >
              <FiX />
            </button>
          </div>
        </div>

        {/* 📄 A4 FORMAT INVOICE DOCUMENT */}
        <div className="flex justify-center p-3 sm:p-6 bg-slate-800/40 print:p-0 print:bg-white overflow-x-auto">
          <div
            ref={invoiceRef}
            id="invoice-print-area"
            style={{
              width: "100%",
              maxWidth: "794px", // Exact standard A4 width at 96 DPI
              minHeight: "1123px", // Exact standard A4 height at 96 DPI
            }}
            className="
              bg-white text-slate-800 font-sans p-8 sm:p-12
              shadow-xl print:shadow-none print:p-8 print:w-full print:max-w-none
              flex flex-col justify-between
            "
          >
            {/* INVOICE CONTENT */}
            <div>
              
              {/* 1. TOP HEADER: LOGO + COMPANY DETAILS + TAX INVOICE BADGE */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900">
                
                {/* Left: Company Logo & Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.png"
                      alt="E-ALL Official Logo"
                      className="h-12 w-auto object-contain shrink-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                        E-ALL
                      </h1>
                      <p className="text-[11px] font-bold text-sky-800 tracking-wide uppercase mt-0.5">
                        Electronics All FZCO
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 font-medium">
                    Premium Consumer Electronics Distribution & Solutions
                  </p>

                  <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 leading-relaxed">
                    <p className="flex items-center gap-1.5">
                      <FiMapPin className="text-slate-400 shrink-0" />
                      Dubai Silicon Oasis, DDP, Building A2, Dubai, UAE
                    </p>
                    <p className="flex items-center gap-1.5 font-mono">
                      <span className="font-bold text-slate-800">TRN (VAT):</span>
                      <strong className="text-slate-900 font-extrabold tracking-wider">100482910400003</strong>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <FiMail className="text-slate-400 shrink-0" />
                      contact@e-all.ae • <FiGlobe className="text-slate-400 shrink-0 ml-1" /> www.e-all.ae
                    </p>
                  </div>
                </div>

                {/* Right: Tax Invoice Details Badge */}
                <div className="text-left sm:text-right shrink-0">
                  <div className="inline-block bg-sky-900 text-white px-4 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest mb-2 shadow-xs">
                    TAX INVOICE
                  </div>
                  
                  <p className="text-2xl font-mono font-black text-slate-900 tracking-tight">
                    {invoice.invoiceNo}
                  </p>

                  <div className="text-xs text-slate-600 mt-3 space-y-1">
                    <p className="flex sm:justify-end gap-2">
                      <span className="text-slate-400">Date:</span>
                      <strong className="text-slate-900 font-mono">
                        {new Date(invoice.createdAt).toLocaleDateString("en-GB")}
                      </strong>
                    </p>
                    <p className="flex sm:justify-end gap-2">
                      <span className="text-slate-400">Time:</span>
                      <span className="text-slate-700 font-mono">
                        {new Date(invoice.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <p className="flex sm:justify-end gap-2">
                      <span className="text-slate-400">Issued By:</span>
                      <strong className="text-sky-900">{invoice.createdBy}</strong>
                    </p>
                    <p className="flex sm:justify-end gap-2">
                      <span className="text-slate-400">Payment:</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[11px] border border-emerald-200">
                        {invoice.paymentMethod}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. CUSTOMER & BILL TO BOX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Bill To / Customer Details:
                  </span>
                  <p className="text-base font-extrabold text-slate-900">
                    {invoice.customerName}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    Phone: <strong className="text-slate-800">{invoice.customerPhone}</strong>
                  </p>
                  {invoice.customerEmail && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      Email: {invoice.customerEmail}
                    </p>
                  )}
                </div>

                <div className="sm:text-right flex flex-col justify-between">
                  <div>
                    {invoice.customerTrn ? (
                      <>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Buyer TRN / Tax Registration No:
                        </span>
                        <p className="text-xs font-mono font-extrabold text-slate-900">
                          {invoice.customerTrn}
                        </p>
                      </>
                    ) : (
                      <div className="inline-flex items-center sm:justify-end gap-1.5 text-emerald-700 text-xs font-bold">
                        <FiCheckCircle />
                        Direct Sales / Tax Invoice
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
              <div className="mt-6">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-3 rounded-l-lg w-10 text-center">#</th>
                      <th className="py-3 px-3 w-32">SKU</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3 text-center w-16">Qty</th>
                      <th className="py-3 px-3 text-right w-28">Unit Price</th>
                      <th className="py-3 px-3 text-right w-32 rounded-r-lg">Total (AED)</th>
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
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          {item.brand && (
                            <p className="text-[10px] text-slate-500 font-semibold">{item.brand}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-800">
                          {Number(item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                          {(item.quantity * item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. TOTALS & TAX BREAKDOWN */}
              <div className="flex flex-col sm:flex-row justify-between items-start mt-6 pt-4 border-t-2 border-slate-200 gap-6">
                
                {/* Terms */}
                <div className="max-w-xs text-[11px] text-slate-500 leading-relaxed text-left">
                  <p className="font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Terms & Conditions:
                  </p>
                  <p>• Goods once sold can be returned/exchanged within 7 days in original sealed condition.</p>
                  <p>• Warranty terms apply as per official manufacturer coverage.</p>
                  <p className="mt-2 text-slate-400 font-medium">Thank you for your business with E-ALL.</p>
                </div>

                {/* Calculation Summary Box */}
                <div className="w-full sm:w-80 space-y-2 text-xs sm:text-sm font-medium">
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
                    <span>VAT ({invoice.vatRate}%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      AED {Number(invoice.vatAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Grand Total Highlight */}
                  <div className="flex justify-between items-center text-base font-black text-slate-900 pt-3 border-t-2 border-slate-900">
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
    </div>
  );
};

export default InvoiceDocument;
