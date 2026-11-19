/**
 * E-ALL Customer Management & POS Address Book Service
 * Fetches registered customer profiles, address histories, lifetime spend,
 * and manages POS Address Book quick-saved retail/B2B contacts.
 */
import {
  getFirebaseDb,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "../lib/firebaseClient";
import { logAuditEvent } from "./auditService";

const CUSTOMERS_CACHE_KEY = "eall_admin_customers_cache";
const POS_CONTACTS_CACHE_KEY = "eall_pos_address_book";
const POS_CONTACTS_COLLECTION = "pos_contacts";

export const fetchCustomersList = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, "customers"));
      const customers = [];
      snap.forEach((d) => {
        customers.push({ id: d.id, ...d.data() });
      });

      // Fetch all customer orders to calculate real-time lifetime value (LTV)
      const ordersSnap = await getDocs(collection(db, "customer_orders"));
      const ordersByCustomer = {};
      ordersSnap.forEach((d) => {
        const o = d.data();
        const cId = o.customerId || o.customerEmail || o.email;
        if (cId) {
          if (!ordersByCustomer[cId]) ordersByCustomer[cId] = [];
          ordersByCustomer[cId].push(o);
        }
      });

      // Merge order stats
      const enriched = customers.map((c) => {
        const custOrders =
          ordersByCustomer[c.id] ||
          ordersByCustomer[c.uid] ||
          ordersByCustomer[c.email] ||
          [];
        const totalSpent = custOrders.reduce(
          (sum, o) => sum + (Number(o.total) || 0),
          0
        );
        return {
          ...c,
          ordersCount: custOrders.length,
          totalSpent,
          orders: custOrders,
        };
      });

      enriched.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      localStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify(enriched));
      return enriched;
    } catch (e) {
      console.warn("Could not fetch customers from Firestore:", e);
    }
  }

  try {
    const cached = localStorage.getItem(CUSTOMERS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // fallback
  }

  // Demo fallback seed for testing
  return [
    {
      id: "cust_demo_1",
      fullName: "Mohammed yafe",
      email: "myrs888000@gmail.com",
      phone: "+971568172539",
      country: "United Arab Emirates",
      city: "Dubai",
      shippingAddress:
        "Al khaleej street Naif 2 opposite to Hyatt Regency Gold Souq Deira",
      addresses: [
        {
          id: "addr_1",
          label: "Home",
          fullName: "Mohammed yafe",
          phone: "+971568172539",
          country: "United Arab Emirates",
          city: "Dubai",
          streetAddress:
            "Al khaleej street Naif 2 opposite to Hyatt Regency Gold Souq Deira",
          isDefault: true,
        },
      ],
      ordersCount: 1,
      totalSpent: 636,
      createdAt: new Date().toISOString(),
    },
  ];
};

/**
 * Fetch saved POS Address Book contacts (walk-in, repeat, & B2B clients)
 */
export const fetchPosContacts = async () => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, POS_CONTACTS_COLLECTION));
      const contacts = [];
      snap.forEach((d) => {
        contacts.push({ id: d.id, ...d.data() });
      });
      contacts.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      );
      localStorage.setItem(POS_CONTACTS_CACHE_KEY, JSON.stringify(contacts));
      return contacts;
    } catch (err) {
      console.warn("Could not fetch POS contacts from Firestore:", err.message);
    }
  }

  try {
    const raw = localStorage.getItem(POS_CONTACTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save or update a contact in the POS Address Book
 */
export const savePosContact = async ({
  id,
  name,
  phone,
  email = "",
  trn = "",
  address = "",
  city = "",
  country = "United Arab Emirates",
  category = "Retail", // Retail | B2B | VIP
  notes = "",
}) => {
  if (!name?.trim() || !phone?.trim()) {
    throw new Error("Contact name and phone number are required.");
  }

  const normalizedPhoneKey = phone.replace(/[^0-9]/g, "") || Date.now().toString();
  const contactId = id || `pos_${normalizedPhoneKey}`;
  const now = new Date().toISOString();

  const existing = await fetchPosContacts();
  const prev = existing.find((c) => c.id === contactId);

  const contact = {
    id: contactId,
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    trn: trn.trim(),
    address: address.trim(),
    city: city.trim(),
    country: country.trim() || "United Arab Emirates",
    category: trn.trim() ? "B2B" : category || "Retail",
    notes: notes.trim(),
    createdAt: prev?.createdAt || now,
    updatedAt: now,
  };

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, POS_CONTACTS_COLLECTION, contactId), contact, {
        merge: true,
      });
    } catch (err) {
      console.warn("Could not save POS contact to Firestore:", err.message);
    }
  }

  const next = [contact, ...existing.filter((c) => c.id !== contactId)];
  try {
    localStorage.setItem(POS_CONTACTS_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }

  logAuditEvent({
    module: "system",
    action: prev ? "update" : "create",
    severity: "info",
    targetId: contactId,
    targetLabel: `${contact.name} (${contact.phone})`,
    summary: `${prev ? "Updated" : "Saved"} POS Address Book contact: ${contact.name}`,
    changes: [
      { field: "Phone", before: prev?.phone || "—", after: contact.phone },
      ...(contact.trn ? [{ field: "TRN", before: prev?.trn || "—", after: contact.trn }] : []),
    ],
  });

  return contact;
};

/**
 * Remove a saved POS Address Book contact
 */
export const deletePosContact = async (contactId) => {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, POS_CONTACTS_COLLECTION, contactId));
    } catch (err) {
      console.warn("Could not delete POS contact from Firestore:", err.message);
    }
  }

  const existing = await fetchPosContacts();
  const next = existing.filter((c) => c.id !== contactId);
  try {
    localStorage.setItem(POS_CONTACTS_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return true;
};

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

/**
 * Unifies & deduplicates contacts from Registered Customers, Saved POS Contacts,
 * B2B RFQs, and Past POS Invoices into a single fast POS Address Book.
 */
export const buildUnifiedAddressBook = ({
  customers = [],
  posContacts = [],
  invoices = [],
  rfqs = [],
}) => {
  const byKey = new Map();

  const upsert = (key, data) => {
    if (!key) return;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, {
        id: data.id || key,
        key,
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        trn: data.trn || "",
        addresses: data.addresses || [],
        sources: new Set(data.source ? [data.source] : []),
        primarySource: data.source || "pos",
        savedContactId: data.savedContactId || null,
        ordersCount: Number(data.ordersCount) || 0,
        totalSpent: Number(data.totalSpent) || 0,
        notes: data.notes || "",
        lastActive: data.lastActive || null,
      });
      return;
    }

    if (!prev.name && data.name) prev.name = data.name;
    if (!prev.phone && data.phone) prev.phone = data.phone;
    if (!prev.email && data.email) prev.email = data.email;
    if (!prev.trn && data.trn) prev.trn = data.trn;
    if (!prev.notes && data.notes) prev.notes = data.notes;
    if (data.savedContactId) prev.savedContactId = data.savedContactId;
    if (data.source) prev.sources.add(data.source);

    const existingAddrStrings = new Set(
      prev.addresses.map((a) => a.fullAddress.toLowerCase())
    );
    (data.addresses || []).forEach((addr) => {
      if (addr.fullAddress && !existingAddrStrings.has(addr.fullAddress.toLowerCase())) {
        prev.addresses.push(addr);
        existingAddrStrings.add(addr.fullAddress.toLowerCase());
      }
    });

    if (data.addOrdersCount) prev.ordersCount += data.addOrdersCount;
    if (data.addTotalSpent) prev.totalSpent += data.addTotalSpent;
    if (
      data.lastActive &&
      (!prev.lastActive || new Date(data.lastActive) > new Date(prev.lastActive))
    ) {
      prev.lastActive = data.lastActive;
    }
  };

  // 1. Registered Storefront Customers
  customers.forEach((c) => {
    const phoneKey = normalizePhoneKey(c.phone);
    const key = phoneKey || (c.email || "").toLowerCase().trim() || c.id;
    const addresses = [];
    if (Array.isArray(c.addresses)) {
      c.addresses.forEach((a, idx) => {
        const full = formatAddressString(a);
        if (full) {
          addresses.push({
            id: a.id || `reg_${idx}`,
            label: a.label || (a.isDefault ? "Default" : `Address ${idx + 1}`),
            fullAddress: full,
            isDefault: Boolean(a.isDefault),
          });
        }
      });
    }
    const fallbackAddr = formatAddressString({
      streetAddress: c.shippingAddress,
      city: c.city,
      country: c.country,
    });
    if (
      fallbackAddr &&
      !addresses.some((a) => a.fullAddress.toLowerCase() === fallbackAddr.toLowerCase())
    ) {
      addresses.push({
        id: "reg_primary",
        label: "Primary",
        fullAddress: fallbackAddr,
        isDefault: addresses.length === 0,
      });
    }

    upsert(key, {
      id: `reg_${c.id}`,
      name: c.fullName || c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      trn: c.trn || "",
      addresses,
      source: "registered",
      ordersCount: Number(c.ordersCount) || 0,
      totalSpent: Number(c.totalSpent) || 0,
      lastActive: c.createdAt,
    });
  });

  // 2. Saved POS Address Book Contacts
  posContacts.forEach((c) => {
    const phoneKey = normalizePhoneKey(c.phone);
    const key = phoneKey || (c.email || "").toLowerCase().trim() || c.id;
    const full = formatAddressString({
      streetAddress: c.address,
      city: c.city,
      country: c.country,
    });
    upsert(key, {
      id: c.id,
      savedContactId: c.id,
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      trn: c.trn || "",
      addresses: full
        ? [{ id: `saved_${c.id}`, label: c.category || "Saved", fullAddress: full, isDefault: true }]
        : [],
      source: c.trn ? "b2b" : "saved",
      notes: c.notes || "",
      lastActive: c.updatedAt || c.createdAt,
    });
  });

  // 3. B2B Wholesale RFQs
  rfqs.forEach((r) => {
    const phoneKey = normalizePhoneKey(r.phone);
    const key =
      phoneKey ||
      (r.email || "").toLowerCase().trim() ||
      (r.companyName || "").toLowerCase().trim();
    const dest = [r.destinationCity, r.destinationCountry]
      .filter(Boolean)
      .join(", ");
    upsert(key, {
      id: `rfq_${r.rfqId}`,
      name: r.companyName || r.contactName || "",
      phone: r.phone || "",
      email: r.email || "",
      trn: r.trnNumber || "",
      addresses: dest
        ? [{ id: `b2b_${r.rfqId}`, label: "B2B Destination", fullAddress: dest, isDefault: false }]
        : [],
      source: "b2b",
      notes: r.contactName ? `Attn: ${r.contactName}` : "",
      lastActive: r.createdAt,
    });
  });

  // 4. Past POS Invoices
  invoices.forEach((inv) => {
    const name = (inv.customerName || "").trim();
    const phone = (inv.customerPhone || "").trim();
    if (!name || name.toLowerCase() === "walk-in customer") return;
    const phoneKey = normalizePhoneKey(phone);
    const key =
      phoneKey || (inv.customerEmail || "").toLowerCase().trim() || name.toLowerCase();
    const fullAddr = (inv.customerAddress || inv.shippingAddress || "").trim();
    const prev = byKey.get(key);
    upsert(key, {
      id: `pos_${inv.invoiceNo}`,
      name,
      phone,
      email: inv.customerEmail || "",
      trn: inv.customerTrn || "",
      addresses: fullAddr
        ? [{ id: `inv_${inv.invoiceNo}`, label: "Last Billed", fullAddress: fullAddr, isDefault: false }]
        : [],
      source: inv.customerTrn ? "b2b" : "pos",
      ordersCount: prev ? 0 : 1,
      totalSpent: prev ? 0 : Number(inv.totalAmount) || 0,
      addOrdersCount: prev ? 1 : 0,
      addTotalSpent: prev ? Number(inv.totalAmount) || 0 : 0,
      lastActive: inv.createdAt,
    });
  });

  return Array.from(byKey.values())
    .filter((entry) => entry.name || entry.phone)
    .map((entry) => ({
      ...entry,
      sources: Array.from(entry.sources),
      isB2B: Boolean(entry.trn) || entry.sources.has("b2b"),
      defaultAddress:
        entry.addresses.find((a) => a.isDefault)?.fullAddress ||
        entry.addresses[0]?.fullAddress ||
        "",
    }))
    .sort((a, b) => {
      if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
      return (a.name || "").localeCompare(b.name || "");
    });
};
