import { useState, useMemo } from "react";
import {
  FiSearch,
  FiPlus,
  FiMinus,
  FiTrash2,
  FiCheckCircle,
  FiUser,
  FiPhone,
  FiMail,
  FiFileText,
  FiCreditCard,
  FiDollarSign,
  FiAlertCircle,
} from "react-icons/fi";
import { createInvoice } from "../../services/billingService";
import { useStaffAuth } from "../../context/StaffAuthContext";

const BillingPOS = ({ stock = [], onInvoiceCreated }) => {
  const { currentUser, role } = useStaffAuth();

  // Search & Selector
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]); // [{ sku, name, brand, quantity, unitPrice, availableStock }]

  // Customer Form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerTrn, setCustomerTrn] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");

  // Calculations
  const [discount, setDiscount] = useState(0);
  const [applyVat, setApplyVat] = useState(true);
  const vatRate = applyVat ? 5 : 0;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Product Autocomplete Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return stock
      .filter((s) => {
        return (
          s.name.toLowerCase().includes(q) ||
          s.sku.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [stock, searchQuery]);

  const handleAddItem = (product) => {
    if (product.quantity <= 0) return;

    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.sku === product.sku);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev; // Cannot exceed stock
        return prev.map((i) =>
          i.sku === product.sku ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          unitPrice: product.price || 999,
          quantity: 1,
          availableStock: product.quantity,
        },
      ];
    });
    setSearchQuery("");
  };

  const handleUpdateQty = (sku, delta) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.sku === sku) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.availableStock) return item;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (sku) => {
    setSelectedItems((prev) => prev.filter((i) => i.sku !== sku));
  };

  const handleUpdatePrice = (sku, newPrice) => {
    const val = parseFloat(newPrice) || 0;
    setSelectedItems((prev) =>
      prev.map((item) => (item.sku === sku ? { ...item, unitPrice: val } : item))
    );
  };

  // Calculations
  const subtotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }, [selectedItems]);

  const discountedSubtotal = Math.max(0, subtotal - (Number(discount) || 0));
  const vatAmount = (discountedSubtotal * vatRate) / 100;
  const grandTotal = discountedSubtotal + vatAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (selectedItems.length === 0) {
      setErrorMsg("Please add at least one product to the invoice.");
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg("Customer name is required.");
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg("Customer phone number is required.");
      return;
    }

    setLoading(true);
    try {
      const invoice = await createInvoice({
        customerName,
        customerPhone,
        customerEmail,
        customerTrn,
        paymentMethod,
        items: selectedItems,
        vatRate,
        discount: Number(discount) || 0,
        notes,
        createdBy: currentUser?.name || "Sales Executive",
        role: role || "sales",
      });

      // Clear Form
      setSelectedItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerTrn("");
      setNotes("");
      setDiscount(0);

      onInvoiceCreated(invoice);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 📦 LEFT COLUMN: PRODUCT PICKER & BILL ITEMS (7 COLS) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Product Search Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Search Product by SKU or Name to Add
          </label>

          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. iPhone 16, APL-IP16, Nokia, Galaxy..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:border-sky-600 outline-none transition"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-2xl max-h-64 overflow-y-auto bg-white shadow-lg">
              {searchResults.map((prod) => {
                const isOutOfStock = prod.quantity <= 0;

                return (
                  <button
                    key={prod.sku}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleAddItem(prod)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-sky-50/70 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {prod.sku} • {prod.brand}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs sm:text-sm font-mono text-slate-900">
                        AED {Number(prod.price).toLocaleString()}
                      </p>
                      <p
                        className={`text-[10px] font-bold ${
                          isOutOfStock ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {isOutOfStock ? "Out of Stock" : `Stock: ${prod.quantity} units`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Items Cart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Bill Items ({selectedItems.length})
            </h3>
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {selectedItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
              <FiFileText className="mx-auto text-3xl mb-2 text-slate-300" />
              <p className="text-sm font-medium">No items added yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Search and select products above to start creating an invoice.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {selectedItems.map((item) => (
                <div
                  key={item.sku}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs font-mono text-slate-400">
                      {item.sku} • Max available: {item.availableStock}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Price Input */}
                    <div className="w-24">
                      <span className="text-[10px] text-slate-400 block">Unit AED</span>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdatePrice(item.sku, e.target.value)}
                        className="w-full text-right font-mono font-bold text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                      />
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.sku, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-700 text-xs cursor-pointer"
                      >
                        <FiMinus />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.sku, 1)}
                        disabled={item.quantity >= item.availableStock}
                        className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-700 text-xs disabled:opacity-30 cursor-pointer"
                      >
                        <FiPlus />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="w-24 text-right">
                      <span className="text-[10px] text-slate-400 block">Total</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        AED {(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.sku)}
                      className="text-slate-400 hover:text-rose-600 p-1 text-base cursor-pointer"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 👤 RIGHT COLUMN: CUSTOMER DETAILS & CHECKOUT (5 COLS) */}
      <div className="lg:col-span-5 space-y-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5"
        >
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <FiUser className="text-sky-700" />
            Customer & Billing Details
          </h3>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Client Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Tech Retail FZCO / Ahmed Ali"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-sky-600 outline-none"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone / WhatsApp Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +971 50 123 4567"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-sky-600 outline-none font-mono"
              />
            </div>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address (Optional)
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-sky-600 outline-none"
              />
            </div>
          </div>

          {/* TRN / Tax No & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                TRN / Tax ID (B2B)
              </label>
              <input
                type="text"
                value={customerTrn}
                onChange={(e) => setCustomerTrn(e.target.value)}
                placeholder="100xxxxxxx"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-sky-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full py-2 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-sky-600 outline-none cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Wire / Transfer</option>
                <option value="Credit Term">Credit Account (30 Days)</option>
              </select>
            </div>
          </div>

          {/* Calculations Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">
                AED {subtotal.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between text-slate-600 gap-2">
              <span>Discount (AED):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 text-right py-1 px-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-rose-600 outline-none"
              />
            </div>

            {/* VAT Toggle */}
            <div className="flex items-center justify-between text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Apply UAE VAT (5%)</span>
              </label>
              <span className="font-mono">
                AED {vatAmount.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-base font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-sky-800 text-lg">
                AED {grandTotal.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              <FiAlertCircle className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || selectedItems.length === 0}
            className="
              w-full py-3.5 px-4 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed
              text-white font-bold rounded-2xl shadow-lg shadow-sky-700/25
              flex items-center justify-center gap-2 transition cursor-pointer
            "
          >
            <FiCheckCircle className="text-lg" />
            {loading ? "Processing..." : "Generate Invoice & Deduct Stock"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BillingPOS;
