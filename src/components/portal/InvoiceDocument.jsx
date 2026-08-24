import { FiPrinter, FiX, FiShare2, FiCheckCircle } from "react-icons/fi";

const InvoiceDocument = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*E-ALL TAX INVOICE ${invoice.invoiceNo}*%0A` +
      `Customer: ${invoice.customerName}%0A` +
      `Total Amount: AED ${Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}%0A` +
      `Date: ${new Date(invoice.createdAt).toLocaleDateString()}%0A` +
      `Thank you for choosing E-ALL!`;
    const phone = invoice.customerPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none">
        
        {/* Action Header (Hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-sm">Official Tax Invoice Preview</span>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
              {invoice.invoiceNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <FiShare2 />
              WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition shadow-md cursor-pointer"
            >
              <FiPrinter />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition text-xl cursor-pointer"
            >
              <FiX />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE BODY */}
        <div className="p-8 sm:p-12 text-slate-800 bg-white font-sans print:p-8">
          
          {/* Top Brand Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-100 pb-8">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="E-ALL Logo"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  E-ALL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Premium Electronics Distribution & B2B Solutions
              </p>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                <p>Dubai Silicon Oasis, DDP, Building A2</p>
                <p>Dubai, United Arab Emirates</p>
                <p>TRN: <span className="font-mono font-bold text-slate-700">100482910400003</span></p>
                <p>Email: contact@e-all.ae | Web: www.e-all.ae</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-block bg-sky-50 text-sky-900 border border-sky-200 px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider mb-3">
                Tax Invoice
              </div>
              <p className="text-2xl font-mono font-extrabold text-slate-900">
                {invoice.invoiceNo}
              </p>
              <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                <p>
                  Date: <span className="font-semibold text-slate-700">{new Date(invoice.createdAt).toLocaleDateString("en-GB")}</span>
                </p>
                <p>
                  Time: <span className="font-semibold text-slate-700">{new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </p>
                <p>
                  Issued By: <span className="font-semibold text-slate-700">{invoice.createdBy}</span>
                </p>
                <p>
                  Payment: <span className="font-semibold text-emerald-700">{invoice.paymentMethod}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Customer Bill To Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 p-5 rounded-2xl bg-slate-50 border border-slate-100 print:bg-slate-50">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Bill To / Customer Details:
              </p>
              <p className="text-base font-bold text-slate-900">
                {invoice.customerName}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Phone: <span className="font-mono">{invoice.customerPhone}</span>
              </p>
              {invoice.customerEmail && (
                <p className="text-xs text-slate-600">
                  Email: {invoice.customerEmail}
                </p>
              )}
            </div>

            <div className="sm:text-right">
              {invoice.customerTrn ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Customer TRN / Tax No:
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-800">
                    {invoice.customerTrn}
                  </p>
                </div>
              ) : (
                <div className="flex sm:justify-end items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                  <FiCheckCircle />
                  Retail / Verified Sale
                </div>
              )}
              {invoice.notes && (
                <p className="text-xs text-slate-500 mt-2 italic">
                  Note: {invoice.notes}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Total (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {invoice.items?.map((item, idx) => (
                  <tr key={item.sku || idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-xs">{item.sku}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      {item.brand && (
                        <p className="text-[11px] text-slate-400">{item.brand}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">
                      {Number(item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {(item.quantity * item.unitPrice).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start mt-8 pt-6 border-t-2 border-slate-100 gap-6">
            <div className="max-w-xs text-xs text-slate-500 leading-relaxed">
              <p className="font-bold text-slate-700 mb-1">Terms & Conditions:</p>
              <p>• Goods once sold can be exchanged within 7 days with original packaging and invoice.</p>
              <p>• Manufacturer warranty applies as specified.</p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">
                  AED {Number(invoice.subtotal).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span className="font-mono">
                    - AED {Number(invoice.discount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>VAT ({invoice.vatRate}%):</span>
                <span className="font-mono">
                  AED {Number(invoice.vatAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-sky-950 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-sky-800 text-lg">
                  AED {Number(invoice.totalAmount).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Verification */}
          <div className="grid grid-cols-2 gap-8 mt-14 pt-8 border-t border-slate-200 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700 mb-8">Customer Signature:</p>
              <div className="border-b border-dashed border-slate-400 w-44" />
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-700 mb-8">Authorized Signatory / E-ALL:</p>
              <div className="border-b border-dashed border-slate-400 w-44 ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDocument;
