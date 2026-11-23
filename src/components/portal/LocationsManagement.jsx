import { useState, useMemo } from "react";
import {
  FiGlobe,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiX,
  FiAlertCircle,
  FiExternalLink,
  FiPackage,
  FiDollarSign,
  FiMapPin,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import PortalKpiGrid from "./PortalKpiGrid";
import { useCountry } from "../../context/CountryContext";
import {
  saveLocationConfig,
  deleteLocationConfig,
  convertAedToLocalPrice,
  formatLocalMoney,
} from "../../config/locationsConfig";
import { logAuditEvent } from "../../services/auditService";

const PAYMENT_METHOD_OPTIONS = [
  { id: "apple_pay", label: "Apple Pay" },
  { id: "card", label: "Debit / Credit Card" },
  { id: "mpesa", label: "M-Pesa (Kenya)" },
  { id: "wave", label: "Wave (West Africa)" },
  { id: "orange_money", label: "Orange Money" },
  { id: "mtn_momo", label: "MTN MoMo" },
  { id: "airtel_money", label: "Airtel Money" },
  { id: "tabby", label: "Tabby (Pay in 4)" },
  { id: "tamara", label: "Tamara (Pay in 6)" },
  { id: "cod", label: "Cash on Delivery" },
  { id: "wire", label: "Bank Wire" },
];

const EMPTY_LOCATION = {
  code: "",
  slug: "",
  name: "",
  shortName: "",
  hubName: "",
  city: "",
  region: "East Africa",
  flag: "🌍",
  type: "country_store",
  isSupplyHub: false,
  isPublicStorefront: true,
  currency: "USD",
  currencySymbol: "USD",
  locale: "en-US",
  decimals: 0,
  fxRateFromAed: 1,
  defaultUpliftPercent: 10,
  priceRoundingStep: 100,
  vatRate: 16,
  freeShippingThreshold: 500,
  shippingFee: 25,
  deliveryPromise: "24–48h Express Local Delivery",
  taxIdLabel: "Tax ID",
  legalEntityName: "E-ALL Electronics Regional Ltd",
  legalTaxId: "",
  legalAddress: "",
  whatsappDesk: "+971526073267",
  paymentMethods: ["card", "cod", "wire"],
  isActive: true,
  sortOrder: 20,
};

const LocationsManagement = () => {
  const { allLocations, refreshLocations } = useCountry();

  const [modalMode, setModalMode] = useState(null); // "create" | "edit" | null
  const [form, setForm] = useState(EMPTY_LOCATION);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const kpiItems = useMemo(() => {
    const hubs = allLocations.filter((l) => l.isSupplyHub && l.isActive !== false);
    const storefronts = allLocations.filter(
      (l) => l.isPublicStorefront && l.isActive !== false
    );
    const currencies = new Set(allLocations.map((l) => l.currency));
    return [
      {
        label: "Tier-1 Supply Hubs",
        value: hubs.length,
        icon: FiPackage,
        tone: "sky",
        sub: hubs.map((h) => h.code).join(" · "),
      },
      {
        label: "Live Country Storefronts",
        value: storefronts.length,
        icon: FiGlobe,
        tone: "emerald",
        sub: storefronts.map((s) => `/${s.slug}`).join(" "),
      },
      {
        label: "Active Currencies",
        value: currencies.size,
        icon: FiDollarSign,
        tone: "indigo",
        sub: Array.from(currencies).slice(0, 5).join(", "),
      },
      {
        label: "Total Configured Locations",
        value: allLocations.length,
        icon: FiMapPin,
        tone: "amber",
        sub: "Firestore-backed dynamic routing",
      },
    ];
  }, [allLocations]);

  const openCreateModal = () => {
    setForm({ ...EMPTY_LOCATION, sortOrder: allLocations.length + 1 });
    setErrorMsg("");
    setModalMode("create");
  };

  const openEditModal = (loc) => {
    setForm({
      ...EMPTY_LOCATION,
      ...loc,
      paymentMethods: Array.isArray(loc.paymentMethods)
        ? [...loc.paymentMethods]
        : ["card", "cod", "wire"],
    });
    setErrorMsg("");
    setModalMode("edit");
  };

  const togglePaymentMethod = (methodId) => {
    setForm((prev) => {
      const exists = prev.paymentMethods.includes(methodId);
      const next = exists
        ? prev.paymentMethods.filter((m) => m !== methodId)
        : [...prev.paymentMethods, methodId];
      return { ...prev, paymentMethods: next.length > 0 ? next : ["card"] };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanCode = String(form.code || "").trim().toUpperCase();
    const cleanSlug = String(form.slug || cleanCode).trim().toLowerCase();

    if (!/^[A-Z]{2,3}$/.test(cleanCode)) {
      setErrorMsg("Country / Hub Code must be 2–3 uppercase letters (e.g. TZ, NG, RW).");
      return;
    }
    if (!form.name.trim()) {
      setErrorMsg("Country / Hub Name is required.");
      return;
    }

    setSaving(true);
    try {
      await saveLocationConfig({
        ...form,
        code: cleanCode,
        slug: cleanSlug,
        shortName: form.shortName?.trim() || form.name.trim(),
        hubName: form.hubName?.trim() || `${form.city || form.name} Regional Hub`,
      });
      await refreshLocations();

      logAuditEvent({
        module: "settings",
        action: modalMode === "create" ? "create" : "update",
        severity: "warning",
        targetId: cleanCode,
        targetLabel: `${form.flag} ${form.name} (/${cleanSlug})`,
        summary: `${
          modalMode === "create" ? "Launched new" : "Updated"
        } country/hub ${form.name} (${cleanCode} · ${form.currency} · FX ${form.fxRateFromAed})`,
      });

      setSuccessMsg(
        `${form.flag} ${form.name} (/${cleanSlug}) saved! Storefront & pricing updated immediately.`
      );
      setModalMode(null);
    } catch (err) {
      setErrorMsg(err.message || "Could not save location configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (loc) => {
    if (["AE", "CN", "HK"].includes(loc.code)) {
      alert("Core global supply hubs (AE, CN, HK) cannot be deleted.");
      return;
    }
    if (
      !window.confirm(
        `Remove ${loc.flag} ${loc.name} (/${loc.slug}) from active locations? Historical invoices and stock maps remain intact.`
      )
    ) {
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await deleteLocationConfig(loc.code);
      await refreshLocations();
      setSuccessMsg(`Removed ${loc.name} (${loc.code}).`);
    } catch (err) {
      setErrorMsg(err.message || "Could not delete location.");
    }
  };

  // Live preview of a flagship AED 4,499 device under the modal's FX & uplift settings
  const previewLocalPrice = useMemo(() => {
    return convertAedToLocalPrice(4499, form, 0);
  }, [form]);

  return (
    <div className="space-y-5 text-left">
      <PortalKpiGrid items={kpiItems} />

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FiAlertCircle className="text-base shrink-0" />
            {errorMsg}
          </span>
          <button type="button" onClick={() => setErrorMsg("")} className="cursor-pointer">
            <FiX />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FiCheckCircle className="text-base shrink-0" />
            {successMsg}
          </span>
          <button type="button" onClick={() => setSuccessMsg("")} className="cursor-pointer">
            <FiX />
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            Global Countries, Supply Hubs &amp; FX Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Launch new country storefronts (e.g. <span className="font-mono">/tz</span>,{" "}
            <span className="font-mono">/ng</span>, <span className="font-mono">/rw</span>),
            adjust live FX conversion rates, regional VAT &amp; local payment methods.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-extrabold shadow-xs transition cursor-pointer shrink-0"
        >
          <FiPlus className="text-sm" />
          <span>Add New Country / Hub</span>
        </button>
      </div>

      {/* Locations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {allLocations.map((loc) => {
          const isCoreHub = ["AE", "CN", "HK"].includes(loc.code);
          const sampleFlagship = convertAedToLocalPrice(4499, loc, 0);

          return (
            <div
              key={loc.code}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl leading-none shrink-0">{loc.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {loc.name}
                        </h3>
                        <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {loc.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {loc.hubName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {loc.isSupplyHub && (
                      <span className="text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                        Tier-1 Supply Hub
                      </span>
                    )}
                    {loc.isPublicStorefront ? (
                      <Link
                        to={`/${loc.slug}`}
                        className="inline-flex items-center gap-1 text-[10.5px] font-mono font-bold text-sky-700 dark:text-sky-400 hover:underline"
                      >
                        <span>eall.ae/{loc.slug}</span>
                        <FiExternalLink className="text-[10px]" />
                      </Link>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">
                        Back-Office Only
                      </span>
                    )}
                  </div>
                </div>

                {/* FX & Financial Matrix */}
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-slate-950 rounded-xl p-2.5 border border-slate-200/70 dark:border-slate-800">
                  <div>
                    <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                      Currency
                    </span>
                    <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                      {loc.currency}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                      1 AED =
                    </span>
                    <span className="font-mono font-black text-xs text-sky-700 dark:text-sky-400">
                      {loc.fxRateFromAed}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9.5px] uppercase font-bold text-slate-400">
                      VAT / Uplift
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                      {loc.vatRate}% / +{loc.defaultUpliftPercent}%
                    </span>
                  </div>
                </div>

                {/* Sample Converted Price & Payment Methods */}
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Flagship Preview (AED 4,499):</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {formatLocalMoney(sampleFlagship, loc)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Entity ({loc.taxIdLabel}):</span>
                    <span className="truncate max-w-[175px] font-semibold">
                      {loc.legalEntityName}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(loc.paymentMethods || []).map((pm) => (
                      <span
                        key={pm}
                        className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        {pm.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => openEditModal(loc)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-500/15 text-slate-800 dark:text-slate-200 hover:text-sky-700 text-xs font-bold transition cursor-pointer"
                >
                  <FiEdit2 className="text-xs" /> Edit FX &amp; Settings
                </button>
                {!isCoreHub && (
                  <button
                    type="button"
                    onClick={() => handleDelete(loc)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer"
                    title="Delete custom country"
                  >
                    <FiTrash2 className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT COUNTRY & HUB MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {modalMode === "create"
                    ? "Launch New Country Storefront / Supply Hub"
                    : `Configure ${form.flag} ${form.name} (${form.code})`}
                </h3>
                <p className="text-xs text-slate-500">
                  Instantly activates <span className="font-mono">/{form.slug || "xx"}</span>{" "}
                  routing, currency formatting, checkout gateways &amp; warehouse stock column.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    ISO Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    disabled={modalMode === "edit"}
                    placeholder="e.g. TZ"
                    value={form.code}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
                      setForm({ ...form, code: val, slug: val.toLowerCase() });
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold uppercase disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tz"
                    value={form.slug}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Flag Emoji
                  </label>
                  <input
                    type="text"
                    value={form.flag}
                    onChange={(e) => setForm({ ...form, flag: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-base"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Country Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanzania"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                        shortName: form.shortName || e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Hub / Warehouse Name
                  </label>
                  <input
                    type="text"
                    placeholder="Dar es Salaam Hub"
                    value={form.hubName}
                    onChange={(e) => setForm({ ...form, hubName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Primary City
                  </label>
                  <input
                    type="text"
                    placeholder="Dar es Salaam"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPublicStorefront}
                      onChange={(e) =>
                        setForm({ ...form, isPublicStorefront: e.target.checked })
                      }
                    />
                    Public Store
                  </label>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isSupplyHub}
                      onChange={(e) =>
                        setForm({ ...form, isSupplyHub: e.target.checked })
                      }
                    />
                    Supply Hub
                  </label>
                </div>
              </div>

              {/* Currency & FX Box */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-500/10 border border-sky-200/70 dark:border-sky-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                    Currency, Live FX &amp; Automated Local Pricing
                  </span>
                  <span className="text-[11px] font-mono font-black text-sky-900 dark:text-white">
                    AED 4,499 → {formatLocalMoney(previewLocalPrice, form)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={form.currency}
                      onChange={(e) =>
                        setForm({ ...form, currency: e.target.value.toUpperCase() })
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={form.currencySymbol}
                      onChange={(e) =>
                        setForm({ ...form, currencySymbol: e.target.value })
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      1 AED = FX Rate
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={form.fxRateFromAed}
                      onChange={(e) =>
                        setForm({ ...form, fxRateFromAed: Number(e.target.value) || 1 })
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Uplift (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.defaultUpliftPercent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          defaultUpliftPercent: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      VAT (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={form.vatRate}
                      onChange={(e) =>
                        setForm({ ...form, vatRate: Number(e.target.value) || 0 })
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Rounding Step
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.priceRoundingStep}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          priceRoundingStep: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Free Shipping Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.freeShippingThreshold}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          freeShippingThreshold: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">
                      Standard Shipping Fee
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.shippingFee}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          shippingFee: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1.5">
                  Enabled Regional Checkout Gateways
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_METHOD_OPTIONS.map((pm) => {
                    const active = form.paymentMethods.includes(pm.id);
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => togglePaymentMethod(pm.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                          active
                            ? "bg-sky-700 text-white border-sky-700"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legal Entity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Legal Entity Name
                  </label>
                  <input
                    type="text"
                    value={form.legalEntityName}
                    onChange={(e) =>
                      setForm({ ...form, legalEntityName: e.target.value })
                    }
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Tax ID Label (TRN / KRA PIN)
                  </label>
                  <input
                    type="text"
                    value={form.taxIdLabel}
                    onChange={(e) => setForm({ ...form, taxIdLabel: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-500 mb-1">
                    Delivery Promise
                  </label>
                  <input
                    type="text"
                    value={form.deliveryPromise}
                    onChange={(e) =>
                      setForm({ ...form, deliveryPromise: e.target.value })
                    }
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : modalMode === "create" ? "Launch Country" : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsManagement;

