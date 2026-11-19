import { useState, useMemo, useEffect, useRef } from "react";
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
  FiAlertCircle,
  FiLayers,
  FiGlobe,
  FiX,
  FiBookOpen,
  FiMapPin,
  FiTag,
  FiCpu,
  FiPauseCircle,
  FiPlayCircle,
  FiChevronDown,
  FiChevronUp,
  FiUserCheck,
  FiZap,
  FiHash,
} from "react-icons/fi";
import { createInvoice } from "../../services/billingService";
import {
  buildUnifiedAddressBook,
  savePosContact,
} from "../../services/customerService";
import { useStaffAuth } from "../../context/StaffAuthContext";
import PosAddressBookModal from "./PosAddressBookModal";

const HELD_BILLS_KEY = "eall_pos_held_bills";

const loadHeldBills = () => {
  try {
    const raw = localStorage.getItem(HELD_BILLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHeldBills = (bills) => {
  try {
    localStorage.setItem(HELD_BILLS_KEY, JSON.stringify(bills));
  } catch {
    // ignore storage errors
  }
};

const BillingPOS = ({
  stock = [],
  customers = [],
  posContacts = [],
  invoices = [],
  rfqs = [],
  coupons = [],
  imeiRecords = [],
  onInvoiceCreated,
  onContactsUpdated,
  prefillCustomer = null,
  onClearPrefill,
}) => {
  const { currentUser, members, role, isAdmin } = useStaffAuth();
  const searchInputRef = useRef(null);

  // Product Search & Quick Shelf
  const [searchQuery, setSearchQuery] = useState("");
  const [scanFeedback, setScanFeedback] = useState(null); // { tone, text }
  const [shelfOpen, setShelfOpen] = useState(true);
  const [shelfBrand, setShelfBrand] = useState("All");

  // Active Cart Items: [{ sku, name, brand, quantity, unitPrice, availableStock, serials: [], warrantyMonths: 12 }]
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedSerialSku, setExpandedSerialSku] = useState(null);
  const [serialDraftMap, setSerialDraftMap] = useState({}); // { [sku]: string }

  // Held / Parked Bills
  const [heldBills, setHeldBills] = useState(() => loadHeldBills());
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Customer Address Book & Form
  const [addressBookOpen, setAddressBookOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [customerName, setCustomerName] = useState(
    prefillCustomer?.customerName || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    prefillCustomer?.customerPhone || ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    prefillCustomer?.customerEmail || ""
  );
  const [customerTrn, setCustomerTrn] = useState(
    prefillCustomer?.customerTrn || ""
  );
  const [customerAddress, setCustomerAddress] = useState(
    prefillCustomer?.customerAddress || ""
  );
  const [saveToBook, setSaveToBook] = useState(false);

  // Payment, Salesperson & Remarks
  const [paymentMethod, setPaymentMethod] = useState(
    prefillCustomer?.rfqId ? "Bank Transfer" : "Cash"
  );
  const [paymentReference, setPaymentReference] = useState("");
  const [cashTendered, setCashTendered] = useState("");
  const [salespersonName, setSalespersonName] = useState(
    currentUser?.name || "Sales Executive"
  );
  const [notes, setNotes] = useState(prefillCustomer?.notes || "");

  // Discount, Coupon & VAT
  const [discountType, setDiscountType] = useState("aed"); // "aed" | "percent"
  const [discountValue, setDiscountValue] = useState(0);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState("");
  const [applyVat, setApplyVat] = useState(true);
  const vatRate = applyVat ? 5 : 0;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Keyboard shortcuts: F2 focuses scanner/search, F4 opens Customer Address Book
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        setAddressBookOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Unified Deduplicated Customer Address Book
  const addressBookContacts = useMemo(
    () =>
      buildUnifiedAddressBook({
        customers,
        posContacts,
        invoices,
        rfqs,
      }),
    [customers, posContacts, invoices, rfqs]
  );

  // In-stock IMEI records indexed by SKU and by Serial Number
  const inStockImeisBySku = useMemo(() => {
    const map = new Map();
    imeiRecords.forEach((rec) => {
      if (rec.status !== "In Stock") return;
      if (!map.has(rec.sku)) map.set(rec.sku, []);
      map.get(rec.sku).push(rec);
    });
    return map;
  }, [imeiRecords]);

  const inStockImeiLookup = useMemo(() => {
    const map = new Map();
    imeiRecords.forEach((rec) => {
      if (rec.status === "In Stock" && rec.serialNumber) {
        map.set(rec.serialNumber.toUpperCase(), rec);
      }
    });
    return map;
  }, [imeiRecords]);

  // All serials already attached to any line item in current cart
  const cartSerialSet = useMemo(() => {
    const set = new Set();
    selectedItems.forEach((item) => {
      (item.serials || []).forEach((s) => set.add(s.toUpperCase()));
    });
    return set;
  }, [selectedItems]);

  // Available In-Stock Products for Quick Pick Shelf
  const inStockProducts = useMemo(
    () =>
      stock
        .filter((s) => Number(s.quantity) > 0)
        .sort((a, b) => Number(b.quantity) - Number(a.quantity)),
    [stock]
  );

  const shelfBrands = useMemo(() => {
    const set = new Set();
    inStockProducts.forEach((p) => p.brand && set.add(p.brand));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [inStockProducts]);

  const visibleShelfProducts = useMemo(() => {
    return inStockProducts
      .filter((p) => shelfBrand === "All" || p.brand === shelfBrand)
      .slice(0, 12);
  }, [inStockProducts, shelfBrand]);

  // Product Autocomplete Results (Name, SKU, Brand, or matching In-Stock IMEI)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const imeiMatch = inStockImeiLookup.get(q.toUpperCase());

    const matched = stock.filter((s) => {
      if (imeiMatch && s.sku === imeiMatch.sku) return true;
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.sku || "").toLowerCase().includes(q) ||
        (s.brand || "").toLowerCase().includes(q)
      );
    });
    return matched.slice(0, 8);
  }, [stock, searchQuery, inStockImeiLookup]);

  const showScanToast = (tone, text) => {
    setScanFeedback({ tone, text });
    window.setTimeout(() => {
      setScanFeedback((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const handleAddItem = (product, preboundSerial = null) => {
    if (!product || Number(product.quantity) <= 0) return;

    const cleanSerial = preboundSerial
      ? String(preboundSerial).trim().toUpperCase()
      : null;

    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.sku === product.sku);
      if (existing) {
        if (cleanSerial && existing.serials?.includes(cleanSerial)) {
          return prev;
        }
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((i) => {
          if (i.sku !== product.sku) return i;
          const nextSerials = cleanSerial
            ? [...(i.serials || []), cleanSerial]
            : i.serials || [];
          return {
            ...i,
            quantity: Math.max(i.quantity + 1, nextSerials.length),
            serials: nextSerials,
          };
        });
      }
      return [
        ...prev,
        {
          sku: product.sku,
          name: product.name,
          brand: product.brand,
          unitPrice: Number(product.price) || 0,
          quantity: 1,
          availableStock: Number(product.quantity) || 0,
          serials: cleanSerial ? [cleanSerial] : [],
          warrantyMonths: 12,
        },
      ];
    });
    setSearchQuery("");
  };

  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // 1. Check if scanned input matches an In-Stock IMEI / Serial directly
    const imeiHit = inStockImeiLookup.get(trimmed.toUpperCase());
    if (imeiHit) {
      if (cartSerialSet.has(imeiHit.serialNumber)) {
        showScanToast("warn", `IMEI ${imeiHit.serialNumber} is already in this bill.`);
        setSearchQuery("");
        return;
      }
      const matchedStock = stock.find((s) => s.sku === imeiHit.sku);
      if (matchedStock && matchedStock.quantity > 0) {
        handleAddItem(matchedStock, imeiHit.serialNumber);
        setExpandedSerialSku(matchedStock.sku);
        showScanToast(
          "ok",
          `Scanned IMEI ${imeiHit.serialNumber} → Added ${matchedStock.name}`
        );
        return;
      }
    }

    // 2. Exact SKU match
    const exactSku = stock.find(
      (s) => s.sku.toLowerCase() === trimmed.toLowerCase() && s.quantity > 0
    );
    if (exactSku) {
      handleAddItem(exactSku);
      return;
    }

    // 3. First available search result
    const firstAvailable = searchResults.find((r) => r.quantity > 0);
    if (firstAvailable) {
      handleAddItem(firstAvailable);
    }
  };

  const handleUpdateQty = (sku, delta) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.sku !== sku) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.availableStock) return item;
          const trimmedSerials = (item.serials || []).slice(0, nextQty);
          return { ...item, quantity: nextQty, serials: trimmedSerials };
        })
        .filter(Boolean)
    );
  };

  const handleRemoveItem = (sku) => {
    setSelectedItems((prev) => prev.filter((i) => i.sku !== sku));
    if (expandedSerialSku === sku) setExpandedSerialSku(null);
  };

  const handleUpdatePrice = (sku, newPrice) => {
    const val = parseFloat(newPrice);
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, unitPrice: Number.isNaN(val) ? 0 : val } : item
      )
    );
  };

  const handleUpdateWarranty = (sku, months) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.sku === sku ? { ...item, warrantyMonths: Number(months) } : item
      )
    );
  };

  const handleAttachSerial = (sku, rawSerial) => {
    const clean = String(rawSerial || "").trim().toUpperCase();
    if (!clean) return;
    if (cartSerialSet.has(clean)) {
      showScanToast("warn", `Serial ${clean} is already attached to this invoice.`);
      return;
    }

    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.sku !== sku) return item;
        const currentSerials = item.serials || [];
        if (currentSerials.length >= item.quantity) {
          if (item.quantity < item.availableStock) {
            return {
              ...item,
              quantity: item.quantity + 1,
              serials: [...currentSerials, clean],
            };
          }
          showScanToast(
            "warn",
            `Max stock (${item.availableStock}) reached for ${item.name}.`
          );
          return item;
        }
        return { ...item, serials: [...currentSerials, clean] };
      })
    );
    setSerialDraftMap((prev) => ({ ...prev, [sku]: "" }));
  };

  const handleRemoveSerial = (sku, serial) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? { ...item, serials: (item.serials || []).filter((s) => s !== serial) }
          : item
      )
    );
  };

  // Select Customer from Address Book
  const handleSelectAddressBookCustomer = (contact) => {
    setSelectedContact(contact);
    setCustomerName(contact.name || "");
    setCustomerPhone(contact.phone || "");
    setCustomerEmail(contact.email || "");
    setCustomerTrn(contact.trn || "");
    setCustomerAddress(contact.defaultAddress || "");
    setSaveToBook(false);
    if (contact.isB2B && paymentMethod === "Cash") {
      setPaymentMethod("Bank Transfer");
    }
  };

  const handleQuickWalkIn = () => {
    setSelectedContact(null);
    setCustomerName("Walk-in Customer");
    setCustomerPhone("+971 00 000 0000");
    setCustomerEmail("");
    setCustomerTrn("");
    setCustomerAddress("");
    setSaveToBook(false);
    setPaymentMethod("Cash");
  };

  const handleClearCustomer = () => {
    setSelectedContact(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerTrn("");
    setCustomerAddress("");
    setSaveToBook(false);
    if (onClearPrefill) onClearPrefill();
  };

  // Calculations
  const subtotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }, [selectedItems]);

  const totalUnitsInBill = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.quantity, 0),
    [selectedItems]
  );

  const totalAttachedSerials = useMemo(
    () => selectedItems.reduce((sum, i) => sum + (i.serials?.length || 0), 0),
    [selectedItems]
  );

  const computedDiscountAed = useMemo(() => {
    const raw = Math.max(0, Number(discountValue) || 0);
    if (discountType === "percent") {
      return Math.min(subtotal, (subtotal * Math.min(100, raw)) / 100);
    }
    return Math.min(subtotal, raw);
  }, [discountType, discountValue, subtotal]);

  const discountedSubtotal = Math.max(0, subtotal - computedDiscountAed);
  const vatAmount = (discountedSubtotal * vatRate) / 100;
  const grandTotal = discountedSubtotal + vatAmount;

  const parsedCashTendered = parseFloat(cashTendered) || 0;
  const changeDue =
    paymentMethod === "Cash" && parsedCashTendered > 0
      ? Math.max(0, parsedCashTendered - grandTotal)
      : 0;

  // Apply Promo Coupon from active coupons catalog
  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const match = coupons.find((c) => (c.code || "").toUpperCase() === code);
    if (!match) {
      setCouponFeedback("Coupon code not found.");
      return;
    }
    if (match.isActive === false) {
      setCouponFeedback("This coupon is currently paused.");
      return;
    }
    if (match.expiresAt && new Date(match.expiresAt) < new Date()) {
      setCouponFeedback("This coupon has expired.");
      return;
    }
    if (Number(match.minOrderAmount || 0) > subtotal) {
      setCouponFeedback(
        `Minimum order AED ${Number(match.minOrderAmount).toLocaleString()} required.`
      );
      return;
    }

    if (Number(match.discountPercent) > 0) {
      setDiscountType("percent");
      setDiscountValue(Number(match.discountPercent));
    } else if (Number(match.discountFlat) > 0) {
      setDiscountType("aed");
      setDiscountValue(Number(match.discountFlat));
    }
    setAppliedCoupon(match);
    setCouponFeedback("");
    setCouponInput("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountValue(0);
    setDiscountType("aed");
    setCouponFeedback("");
  };

  // Hold / Park Current Bill
  const handleHoldBill = () => {
    if (selectedItems.length === 0) return;
    const draft = {
      id: `HOLD-${Date.now().toString().slice(-5)}`,
      savedAt: new Date().toISOString(),
      customerName: customerName.trim() || "Walk-in Draft",
      customerPhone,
      customerEmail,
      customerTrn,
      customerAddress,
      paymentMethod,
      notes,
      discountType,
      discountValue,
      applyVat,
      items: selectedItems,
      totalPreview: grandTotal,
    };
    const next = [draft, ...heldBills].slice(0, 10);
    setHeldBills(next);
    saveHeldBills(next);

    // Clear active screen for next customer
    setSelectedItems([]);
    setExpandedSerialSku(null);
    handleClearCustomer();
    setDiscountValue(0);
    setAppliedCoupon(null);
    setNotes("");
    setPaymentReference("");
    setCashTendered("");
    showScanToast("ok", `Bill parked (${draft.id}) — Ready for next customer.`);
  };

  const handleResumeHeldBill = (draft) => {
    // Reconcile item stock against live inventory
    const stockMap = new Map(stock.map((s) => [s.sku, s]));
    const restoredItems = (draft.items || [])
      .map((item) => {
        const live = stockMap.get(item.sku);
        const avail = live ? Number(live.quantity) : 0;
        if (avail <= 0) return null;
        return {
          ...item,
          availableStock: avail,
          quantity: Math.min(item.quantity, avail),
        };
      })
      .filter(Boolean);

    setSelectedItems(restoredItems);
    setCustomerName(draft.customerName === "Walk-in Draft" ? "" : draft.customerName || "");
    setCustomerPhone(draft.customerPhone || "");
    setCustomerEmail(draft.customerEmail || "");
    setCustomerTrn(draft.customerTrn || "");
    setCustomerAddress(draft.customerAddress || "");
    setPaymentMethod(draft.paymentMethod || "Cash");
    setNotes(draft.notes || "");
    setDiscountType(draft.discountType || "aed");
    setDiscountValue(draft.discountValue || 0);
    setApplyVat(draft.applyVat !== false);

    const remaining = heldBills.filter((b) => b.id !== draft.id);
    setHeldBills(remaining);
    saveHeldBills(remaining);
    setShowHeldModal(false);
  };

  const handleDiscardHeldBill = (draftId) => {
    const remaining = heldBills.filter((b) => b.id !== draftId);
    setHeldBills(remaining);
    saveHeldBills(remaining);
  };

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
      // Optional: Save new customer to POS Address Book before generating invoice
      if (
        saveToBook &&
        !selectedContact &&
        customerName.trim().toLowerCase() !== "walk-in customer"
      ) {
        try {
          await savePosContact({
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            trn: customerTrn,
            address: customerAddress,
            category: customerTrn.trim() ? "B2B" : "Retail",
          });
          if (onContactsUpdated) onContactsUpdated();
        } catch (saveErr) {
          console.warn("Could not save new POS contact:", saveErr.message);
        }
      }

      const invoice = await createInvoice({
        customerName,
        customerPhone,
        customerEmail,
        customerTrn,
        customerAddress,
        paymentMethod,
        paymentReference,
        couponCode: appliedCoupon?.code || "",
        cashTendered: paymentMethod === "Cash" ? parsedCashTendered : 0,
        changeDue: paymentMethod === "Cash" ? changeDue : 0,
        items: selectedItems,
        vatRate,
        discount: Number(computedDiscountAed.toFixed(2)),
        notes,
        createdBy: salespersonName || currentUser?.name || "Sales Executive",
        role: role || "sales",
      });

      // Reset POS terminal cleanly
      setSelectedItems([]);
      setExpandedSerialSku(null);
      setSerialDraftMap({});
      setSelectedContact(null);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerTrn("");
      setCustomerAddress("");
      setSaveToBook(false);
      setPaymentMethod("Cash");
      setPaymentReference("");
      setCashTendered("");
      setNotes("");
      setDiscountType("aed");
      setDiscountValue(0);
      setAppliedCoupon(null);
      if (onClearPrefill) onClearPrefill();

      onInvoiceCreated(invoice);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: SCANNER / SEARCH, BILL ITEMS & IN-STOCK QUICK SHELF */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* Smart Search & IMEI Scanner Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FiZap className="text-sky-600 dark:text-sky-400" />
                Quick Add Product, SKU or Scan IMEI / Barcode
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
                  F2
                </kbd>
              </label>

              <div className="flex items-center gap-2">
                {selectedItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleHoldBill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/25 text-xs font-semibold transition cursor-pointer"
                    title="Park this bill to serve another customer"
                  >
                    <FiPauseCircle className="text-sm" />
                    <span>Hold Bill</span>
                  </button>
                )}

                {heldBills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHeldModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <FiPlayCircle className="text-sky-600 dark:text-sky-400 text-sm" />
                    <span>Held ({heldBills.length})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-base" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Type product name, SKU, brand or scan 15-digit IMEI and press Enter..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 dark:focus:border-sky-500 outline-none transition text-left"
              />
            </div>

            {scanFeedback && (
              <div
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  scanFeedback.tone === "ok"
                    ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/25"
                    : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/25"
                }`}
              >
                <FiCpu className="shrink-0" />
                <span>{scanFeedback.text}</span>
              </div>
            )}

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-h-64 overflow-y-auto bg-white dark:bg-slate-900 shadow-lg">
                {searchResults.map((prod) => {
                  const isOutOfStock = prod.quantity <= 0;
                  const trackedImeis = inStockImeisBySku.get(prod.sku)?.length || 0;

                  return (
                    <button
                      key={prod.sku}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleAddItem(prod)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-sky-50/70 dark:hover:bg-slate-800/80 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {prod.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            {prod.sku} • {prod.brand}
                          </span>
                          {trackedImeis > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                              {trackedImeis} IMEI
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs sm:text-sm font-mono text-slate-900 dark:text-white">
                          AED {Number(prod.price).toLocaleString()}
                        </p>
                        <p
                          className={`text-[10px] font-bold ${
                            isOutOfStock
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {isOutOfStock
                            ? "Out of Stock"
                            : `Stock: ${prod.quantity} units`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Bill Items Card */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FiLayers className="text-sky-700 dark:text-sky-400 text-base" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Bill Items ({selectedItems.length} lines • {totalUnitsInBill} units)
                </h3>
                {totalAttachedSerials > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-500/25">
                    {totalAttachedSerials} IMEI Bound
                  </span>
                )}
              </div>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItems([]);
                    setExpandedSerialSku(null);
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <FiFileText className="mx-auto text-2xl mb-1.5 text-slate-300 dark:text-slate-600" />
                <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Cart is empty
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Search above, scan an IMEI, or tap any in-stock product below to add.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
                      <th className="py-2.5 px-3 text-left whitespace-nowrap min-w-[180px]">
                        Item &amp; IMEI / Serial
                      </th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[105px]">
                        Unit Price
                      </th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[105px]">
                        Qty
                      </th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[105px]">
                        Total (AED)
                      </th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
                    {selectedItems.map((item) => {
                      const serialsCount = item.serials?.length || 0;
                      const isExpanded = expandedSerialSku === item.sku;
                      const availableImeisForSku = (
                        inStockImeisBySku.get(item.sku) || []
                      ).filter((rec) => !cartSerialSet.has(rec.serialNumber));

                      return (
                        <FragmentRow
                          key={item.sku}
                          item={item}
                          serialsCount={serialsCount}
                          isExpanded={isExpanded}
                          availableImeisForSku={availableImeisForSku}
                          serialDraft={serialDraftMap[item.sku] || ""}
                          onToggleExpand={() =>
                            setExpandedSerialSku(isExpanded ? null : item.sku)
                          }
                          onDraftChange={(val) =>
                            setSerialDraftMap((prev) => ({
                              ...prev,
                              [item.sku]: val,
                            }))
                          }
                          onAttachSerial={(sn) => handleAttachSerial(item.sku, sn)}
                          onRemoveSerial={(sn) => handleRemoveSerial(item.sku, sn)}
                          onUpdatePrice={(val) => handleUpdatePrice(item.sku, val)}
                          onUpdateQty={(delta) => handleUpdateQty(item.sku, delta)}
                          onUpdateWarranty={(m) => handleUpdateWarranty(item.sku, m)}
                          onRemoveItem={() => handleRemoveItem(item.sku)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* IN-STOCK QUICK PICK CATALOG SHELF */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShelfOpen((prev) => !prev)}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white cursor-pointer"
              >
                <span>In-Stock Quick Pick</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/25">
                  {inStockProducts.length} ready
                </span>
                {shelfOpen ? (
                  <FiChevronUp className="text-slate-400" />
                ) : (
                  <FiChevronDown className="text-slate-400" />
                )}
              </button>

              {shelfOpen && shelfBrands.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {shelfBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setShelfBrand(brand)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                        shelfBrand === brand
                          ? "bg-slate-900 dark:bg-sky-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {shelfOpen && (
              <div className="mt-3.5">
                {visibleShelfProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    No in-stock products available in this brand. Add stock in Stock Manager or Purchase Records.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2.5">
                    {visibleShelfProducts.map((prod) => {
                      const inCart = selectedItems.find((i) => i.sku === prod.sku);
                      const maxedOut = inCart && inCart.quantity >= prod.quantity;

                      return (
                        <button
                          key={prod.sku}
                          type="button"
                          disabled={maxedOut}
                          onClick={() => handleAddItem(prod)}
                          className={`group p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            inCart
                              ? "bg-sky-50/70 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40"
                              : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-500/40 hover:bg-white dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <FiLayers className="text-slate-400 text-sm" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {prod.name}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-xs font-mono font-extrabold text-sky-800 dark:text-sky-300">
                                AED {Number(prod.price).toLocaleString()}
                              </span>
                              {inCart ? (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-600 text-white">
                                  ×{inCart.quantity} in bill
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  {prod.quantity} left
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER ADDRESS BOOK & CHECKOUT */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-left transition-colors"
          >
            {/* Header + Address Book & Walk-in Actions */}
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FiUser className="text-sky-700 dark:text-sky-400 text-base" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Customer &amp; Billing
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAddressBookOpen(true)}
                  title="Select existing customer from Address Book (F4)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/25 text-xs font-bold transition cursor-pointer"
                >
                  <FiBookOpen className="text-sm" />
                  <span>Address Book</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300">
                    {addressBookContacts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickWalkIn}
                  title="Fill quick Walk-in Cash customer"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  Walk-in
                </button>
              </div>
            </div>

            {/* B2B RFQ Prefill Banner */}
            {prefillCustomer?.rfqId && (
              <div className="flex items-start justify-between gap-2 p-3 rounded-2xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200/80 dark:border-sky-500/25 text-xs text-sky-900 dark:text-sky-200">
                <div className="flex items-start gap-2 min-w-0">
                  <FiGlobe className="text-sky-600 dark:text-sky-400 text-sm shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold truncate">
                      Pre-filled from B2B {prefillCustomer.rfqId}
                    </p>
                    {notes && (
                      <p className="text-[11px] text-sky-700/85 dark:text-sky-300/85 truncate">
                        {notes}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="p-1 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 rounded-lg transition cursor-pointer shrink-0"
                  title="Clear B2B pre-fill"
                >
                  <FiX className="text-sm" />
                </button>
              </div>
            )}

            {/* Selected Address Book Customer Chip + Saved Address Picker */}
            {selectedContact && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/25 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FiUserCheck className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 truncate">
                      Linked from Address Book
                    </span>
                    {selectedContact.ordersCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shrink-0">
                        {selectedContact.ordersCount} orders • AED{" "}
                        {Math.round(selectedContact.totalSpent).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="p-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg cursor-pointer"
                    title="Unlink customer"
                  >
                    <FiX />
                  </button>
                </div>

                {selectedContact.addresses?.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-emerald-200/60 dark:border-emerald-500/20">
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Saved Addresses:
                    </span>
                    {selectedContact.addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setCustomerAddress(addr.fullAddress)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                          customerAddress === addr.fullAddress
                            ? "bg-emerald-700 text-white"
                            : "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                        }`}
                      >
                        {addr.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer / Client Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tech Retail FZCO / Ahmed Ali"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs sm:text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
                />
              </div>
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@company.ae"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Billing / Delivery Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Billing / Delivery Address (Optional)
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Building, Street, City, UAE"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
                />
              </div>
            </div>

            {/* Save new customer checkbox */}
            {!selectedContact &&
              customerName.trim() &&
              customerName.trim().toLowerCase() !== "walk-in customer" && (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveToBook}
                    onChange={(e) => setSaveToBook(e.target.checked)}
                    className="rounded text-sky-600 cursor-pointer"
                  />
                  <span>Save this client to POS Address Book for future billing</span>
                </label>
              )}

            {/* TRN & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  TRN / Tax ID (B2B)
                </label>
                <input
                  type="text"
                  value={customerTrn}
                  onChange={(e) => setCustomerTrn(e.target.value)}
                  placeholder="100xxxxxxx"
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Bank Transfer">Bank Wire / Transfer</option>
                  <option value="Wave Transfer">Wave Transfer</option>
                  <option value="Credit Term">Credit Account (30 Days)</option>
                </select>
              </div>
            </div>

            {/* Cash Tendered Calculator OR Non-Cash Auth Ref */}
            {paymentMethod === "Cash" ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Cash Tendered (AED):
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={grandTotal.toFixed(2)}
                    className="w-28 text-right py-1 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-sky-600"
                  />
                </div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCashTendered(grandTotal.toFixed(2))}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 cursor-pointer"
                    >
                      Exact
                    </button>
                    {[100, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() =>
                          setCashTendered(
                            String(Math.ceil(grandTotal / amt) * amt || amt)
                          )
                        }
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 cursor-pointer"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                  {parsedCashTendered > 0 && (
                    <span
                      className={`font-mono font-bold ${
                        parsedCashTendered >= grandTotal
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {parsedCashTendered >= grandTotal
                        ? `Change: AED ${changeDue.toLocaleString("en-AE", { minimumFractionDigits: 2 })}`
                        : `Short: AED ${(grandTotal - parsedCashTendered).toFixed(2)}`}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction / Approval Ref # (Optional)
                </label>
                <div className="relative">
                  <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="POS Auth Code, Wire Ref, or Wave TX ID"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Salesperson Attribution (Admin) & Invoice Remarks */}
            <div className={`grid gap-3 ${isAdmin && members?.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {isAdmin && members?.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Salesperson
                  </label>
                  <select
                    value={salespersonName}
                    onChange={(e) => setSalespersonName(e.target.value)}
                    className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-sky-600 cursor-pointer"
                  >
                    {members
                      .filter((m) => m.status !== "Inactive")
                      .map((m) => (
                        <option key={m.id || m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery note, PO #, special terms..."
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600 outline-none"
                />
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  AED {subtotal.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Discount with AED / % toggle */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-1.5">
                  <span>Discount:</span>
                  <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType("aed");
                        setAppliedCoupon(null);
                      }}
                      className={`px-1.5 py-0.5 rounded-md cursor-pointer ${
                        discountType === "aed"
                          ? "bg-slate-900 dark:bg-sky-600 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      AED
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType("percent");
                        setAppliedCoupon(null);
                      }}
                      className={`px-1.5 py-0.5 rounded-md cursor-pointer ${
                        discountType === "percent"
                          ? "bg-slate-900 dark:bg-sky-600 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      %
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max={discountType === "percent" ? 100 : undefined}
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => {
                      setDiscountValue(e.target.value);
                      setAppliedCoupon(null);
                    }}
                    className="w-20 text-right py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-rose-600 dark:text-rose-400 outline-none focus:border-sky-600"
                  />
                </div>
              </div>

              {/* Coupon Quick Apply */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="inline-flex items-center gap-1.5 font-mono font-bold">
                    <FiTag /> {appliedCoupon.code} (-AED {computedDiscountAed.toFixed(2)})
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-emerald-700 dark:text-emerald-300 hover:underline font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <FiTag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponFeedback("");
                        }}
                        placeholder="Promo coupon code"
                        className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono uppercase text-slate-900 dark:text-white outline-none focus:border-sky-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim() || subtotal <= 0}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponFeedback && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {couponFeedback}
                    </p>
                  )}
                </div>
              )}

              {/* VAT Toggle */}
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                    className="rounded text-sky-600 cursor-pointer"
                  />
                  <span>Apply UAE VAT (5%)</span>
                </label>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  AED {vatAmount.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-base font-extrabold text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-sky-800 dark:text-sky-300 text-lg">
                  AED {grandTotal.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Error Notice */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/25 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
                <FiAlertCircle className="shrink-0 text-base" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className="w-full py-3.5 px-4 bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-sky-700/20 flex items-center justify-center gap-2 transition cursor-pointer text-sm"
            >
              <FiCheckCircle className="text-lg" />
              <span>
                {loading
                  ? "Processing..."
                  : totalAttachedSerials > 0
                  ? `Issue Invoice (${totalAttachedSerials} IMEI Bound)`
                  : "Generate Invoice & Deduct Stock"}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* CUSTOMER ADDRESS BOOK SLIDE-OVER */}
      <PosAddressBookModal
        isOpen={addressBookOpen}
        onClose={() => setAddressBookOpen(false)}
        contacts={addressBookContacts}
        selectedKey={selectedContact?.key || ""}
        onSelectCustomer={handleSelectAddressBookCustomer}
        onContactsUpdated={onContactsUpdated}
        isAdmin={isAdmin}
      />

      {/* HELD / PARKED BILLS MODAL */}
      {showHeldModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowHeldModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Parked / Held Bills ({heldBills.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Resume a paused checkout cart at any time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHeldModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-xl cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {heldBills.map((draft) => (
                <div
                  key={draft.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-400">
                        {draft.id}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {draft.customerName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {draft.items?.length || 0} item(s) • AED{" "}
                      {Number(draft.totalPreview || 0).toLocaleString("en-AE", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      • {new Date(draft.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleResumeHeldBill(draft)}
                      className="px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold cursor-pointer"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscardHeldBill(draft.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl cursor-pointer"
                      title="Discard draft"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Clean Sub-Row with inline IMEI / Serial Drawer */
const FragmentRow = ({
  item,
  serialsCount,
  isExpanded,
  availableImeisForSku,
  serialDraft,
  onToggleExpand,
  onDraftChange,
  onAttachSerial,
  onRemoveSerial,
  onUpdatePrice,
  onUpdateQty,
  onUpdateWarranty,
  onRemoveItem,
}) => {
  return (
    <>
      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
        <td className="py-3 px-3 min-w-[180px]">
          <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
            {item.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {item.sku}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold">
              Max: {item.availableStock}
            </span>
            <button
              type="button"
              onClick={onToggleExpand}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                serialsCount > 0
                  ? serialsCount === item.quantity
                    ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/25"
                    : "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/25"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400"
              }`}
            >
              <FiCpu className="text-[10px]" />
              <span>
                IMEI {serialsCount}/{item.quantity}
              </span>
            </button>
          </div>
        </td>

        <td className="py-3 px-3 text-center whitespace-nowrap">
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onUpdatePrice(e.target.value)}
            className="w-24 text-right font-mono font-bold text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-sky-600"
          />
        </td>

        <td className="py-3 px-3 text-center whitespace-nowrap">
          <div className="inline-flex items-center justify-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onUpdateQty(-1)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs cursor-pointer transition"
              title="Decrease Quantity"
            >
              <FiMinus />
            </button>
            <span className="w-6 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(1)}
              disabled={item.quantity >= item.availableStock}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
              title="Increase Quantity"
            >
              <FiPlus />
            </button>
          </div>
        </td>

        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
          AED{" "}
          {(item.unitPrice * item.quantity).toLocaleString("en-AE", {
            minimumFractionDigits: 2,
          })}
        </td>

        <td className="py-3 px-2 text-center whitespace-nowrap">
          <button
            type="button"
            onClick={onRemoveItem}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
            title="Remove item"
          >
            <FiTrash2 className="text-sm" />
          </button>
        </td>
      </tr>

      {/* Inline IMEI / Serial Assignment Sub-Row */}
      {isExpanded && (
        <tr className="bg-slate-50/80 dark:bg-slate-800/40">
          <td colSpan={5} className="px-3 py-3">
            <div className="space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <FiCpu className="text-indigo-600 dark:text-indigo-400" />
                  Bind IMEI / Serial Numbers &amp; Warranty Term
                </span>
                <select
                  value={item.warrantyMonths ?? 12}
                  onChange={(e) => onUpdateWarranty(e.target.value)}
                  className="py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value={12}>12 Months Warranty</option>
                  <option value={24}>24 Months Warranty</option>
                  <option value={6}>6 Months Warranty</option>
                  <option value={0}>No Warranty</option>
                </select>
              </div>

              {/* Attached Serial Chips */}
              {item.serials?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.serials.map((sn) => (
                    <span
                      key={sn}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30 font-mono text-[11px] font-bold"
                    >
                      {sn}
                      <button
                        type="button"
                        onClick={() => onRemoveSerial(sn)}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Scan / Type Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={serialDraft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAttachSerial(serialDraft);
                    }
                  }}
                  placeholder="Scan or type 15-digit IMEI / Serial and press Enter..."
                  className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => onAttachSerial(serialDraft)}
                  disabled={!serialDraft.trim()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
                >
                  Attach
                </button>
              </div>

              {/* Available Registered In-Stock IMEIs for this SKU */}
              {availableImeisForSku.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    In-Stock Registry:
                  </span>
                  {availableImeisForSku.slice(0, 6).map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => onAttachSerial(rec.serialNumber)}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition"
                    >
                      + {rec.serialNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default BillingPOS;
