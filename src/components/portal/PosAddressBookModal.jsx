import { useState, useMemo } from "react";
import {
  FiX,
  FiSearch,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiBriefcase,
  FiPlus,
  FiCheck,
  FiTrash2,
  FiBookOpen,
  FiShoppingBag,
} from "react-icons/fi";
import { savePosContact, deletePosContact } from "../../services/customerService";

const normalizePhoneKey = (phone) =>
  String(phone || "")
    .replace(/[^0-9]/g, "")
    .slice(-9);

const formatAddressString = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr.trim();
  return [addr.streetAddress, addr.city, addr.country]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
};

const EMPTY_NEW_CONTACT = {
  name: "",
  phone: "",
  email: "",
  trn: "",
  address: "",
  city: "Dubai",
  country: "United Arab Emirates",
  category: "Retail",
  notes: "",
};

const SOURCE_BADGES = {
  registered: {
    label: "Registered",
    cls: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-500/25",
  },
  b2b: {
    label: "B2B Account",
    cls: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-500/25",
  },
  saved: {
    label: "Saved Contact",
    cls: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-500/25",
  },
  pos: {
    label: "Past POS",
    cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

const PosAddressBookModal = ({
  isOpen,
  onClose,
  contacts = [],
  selectedKey = "",
  onSelectCustomer,
  onContactsUpdated,
  isAdmin = false,
}) => {
  const [mode, setMode] = useState("browse"); // "browse" | "create"
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("all"); // all | registered | b2b | saved | pos
  const [newForm, setNewForm] = useState(EMPTY_NEW_CONTACT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return contacts.filter((c) => {
      if (segment === "registered" && !c.sources.includes("registered")) return false;
      if (segment === "b2b" && !c.isB2B) return false;
      if (segment === "saved" && !c.savedContactId) return false;
      if (segment === "pos" && !c.sources.includes("pos")) return false;

      if (!q) return true;
      return (
        (c.name || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.trn || "").toLowerCase().includes(q) ||
        (c.defaultAddress || "").toLowerCase().includes(q)
      );
    });
  }, [contacts, search, segment]);

  if (!isOpen) return null;

  const handleCreateContact = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!newForm.name.trim() || !newForm.phone.trim()) {
      setFormError("Name and Phone number are required.");
      return;
    }
    setSaving(true);
    try {
      const saved = await savePosContact(newForm);
      const fullAddress = formatAddressString({
        streetAddress: saved.address,
        city: saved.city,
        country: saved.country,
      });
      if (onContactsUpdated) await onContactsUpdated();
      onSelectCustomer({
        key: normalizePhoneKey(saved.phone) || saved.id,
        name: saved.name,
        phone: saved.phone,
        email: saved.email,
        trn: saved.trn,
        defaultAddress: fullAddress,
        addresses: fullAddress
          ? [{ id: saved.id, label: saved.category || "Saved", fullAddress, isDefault: true }]
          : [],
        ordersCount: 0,
        totalSpent: 0,
        isB2B: Boolean(saved.trn),
        sources: [saved.trn ? "b2b" : "saved"],
      });
      setNewForm(EMPTY_NEW_CONTACT);
      setMode("browse");
      onClose();
    } catch (err) {
      setFormError(err.message || "Could not save contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSaved = async (e, contact) => {
    e.stopPropagation();
    if (!contact.savedContactId) return;
    if (!window.confirm(`Remove "${contact.name}" from saved POS contacts?`)) return;
    await deletePosContact(contact.savedContactId);
    if (onContactsUpdated) onContactsUpdated();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end text-left"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-500/25 flex items-center justify-center shrink-0">
              <FiBookOpen className="text-base" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Customer Address Book
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {contacts.length} unified retail, registered &amp; B2B accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMode(mode === "browse" ? "create" : "browse")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                mode === "create"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  : "bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white"
              }`}
            >
              {mode === "create" ? (
                <>Browse List</>
              ) : (
                <>
                  <FiPlus className="text-sm" /> New Contact
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close address book"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {mode === "browse" ? (
          <>
            {/* Search & Segment Filter */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, phone, email, TRN, or address..."
                  className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl text-xs sm:text-sm outline-none focus:border-sky-600 dark:focus:border-sky-500 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {[
                  { id: "all", label: `All (${contacts.length})` },
                  {
                    id: "registered",
                    label: `Registered (${contacts.filter((c) => c.sources.includes("registered")).length})`,
                  },
                  {
                    id: "b2b",
                    label: `B2B / TRN (${contacts.filter((c) => c.isB2B).length})`,
                  },
                  {
                    id: "saved",
                    label: `Saved (${contacts.filter((c) => c.savedContactId).length})`,
                  },
                  {
                    id: "pos",
                    label: `Past POS (${contacts.filter((c) => c.sources.includes("pos")).length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSegment(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                      segment === tab.id
                        ? "bg-slate-900 dark:bg-sky-600 text-white"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {filteredContacts.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <FiUser className="mx-auto text-3xl text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    No matching customers found
                  </p>
                  <p className="text-xs text-slate-400">
                    Try a different keyword or add a new customer directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewForm({ ...EMPTY_NEW_CONTACT, name: search.trim() });
                      setMode("create");
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 cursor-pointer"
                  >
                    <FiPlus /> Save &quot;{search.trim() || "New Customer"}&quot;
                  </button>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedKey && selectedKey === contact.key;
                  const primaryBadge =
                    SOURCE_BADGES[contact.primarySource] || SOURCE_BADGES.pos;

                  return (
                    <div
                      key={contact.key}
                      onClick={() => {
                        onSelectCustomer(contact);
                        onClose();
                      }}
                      className={`group p-3.5 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? "bg-sky-50/70 dark:bg-sky-500/10 border-sky-400 dark:border-sky-500/50 shadow-xs"
                          : "bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-500/40 hover:bg-slate-50/70 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                            {contact.isB2B ? (
                              <FiBriefcase className="text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              (contact.name || "C").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                {contact.name}
                              </p>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${primaryBadge.cls}`}
                              >
                                {primaryBadge.label}
                              </span>
                              {contact.trn && (
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/25">
                                  TRN {contact.trn}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {contact.phone && (
                                <span className="inline-flex items-center gap-1 font-mono">
                                  <FiPhone className="text-[10px]" /> {contact.phone}
                                </span>
                              )}
                              {contact.email && (
                                <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                                  <FiMail className="text-[10px]" /> {contact.email}
                                </span>
                              )}
                            </div>

                            {contact.defaultAddress && (
                              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1 leading-snug line-clamp-2">
                                <FiMapPin className="text-[11px] text-slate-400 shrink-0 mt-0.5" />
                                <span>
                                  {contact.defaultAddress}
                                  {contact.addresses.length > 1 && (
                                    <span className="ml-1 text-sky-600 dark:text-sky-400 font-semibold">
                                      (+{contact.addresses.length - 1} more)
                                    </span>
                                  )}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white">
                              <FiCheck /> Selected
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 opacity-0 group-hover:opacity-100 transition">
                              Select →
                            </span>
                          )}

                          {contact.ordersCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              <FiShoppingBag className="text-[10px]" />
                              {contact.ordersCount} • AED{" "}
                              {Math.round(contact.totalSpent).toLocaleString()}
                            </span>
                          )}

                          {contact.savedContactId && isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSaved(e, contact)}
                              title="Remove saved contact"
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                            >
                              <FiTrash2 className="text-xs" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* CREATE NEW CONTACT FORM */
          <form onSubmit={handleCreateContact} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save a repeat retail buyer or B2B company to the shared POS Address Book and auto-fill the current invoice.
            </p>

            <div>
              <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                Customer / Company Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                placeholder="e.g. Horizon Mobiles LLC / Rashid Khan"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={newForm.phone}
                  onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                  placeholder="+971 50 000 0000"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:border-sky-600"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newForm.email}
                  onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                  placeholder="accounts@client.ae"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                  TRN / Tax ID (B2B)
                </label>
                <input
                  type="text"
                  value={newForm.trn}
                  onChange={(e) => setNewForm({ ...newForm, trn: e.target.value })}
                  placeholder="100xxxxxxxx"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-mono outline-none focus:border-sky-600"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                  Account Type
                </label>
                <select
                  value={newForm.category}
                  onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600 cursor-pointer"
                >
                  <option value="Retail">Retail Client</option>
                  <option value="B2B">B2B Wholesale</option>
                  <option value="VIP">VIP Account</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                Billing / Delivery Street Address
              </label>
              <input
                type="text"
                value={newForm.address}
                onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                placeholder="Shop / Building, Street, Area"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={newForm.city}
                  onChange={(e) => setNewForm({ ...newForm, city: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                />
              </div>
              <div>
                <label className="block font-bold uppercase text-[10px] text-slate-600 dark:text-slate-400 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={newForm.country}
                  onChange={(e) => setNewForm({ ...newForm, country: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none focus:border-sky-600"
                />
              </div>
            </div>

            {formError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {formError}
              </p>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMode("browse")}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-bold disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : "Save & Select Customer"}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
};

export default PosAddressBookModal;
